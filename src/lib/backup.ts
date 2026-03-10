import path from 'path'
import fs from 'fs'
import archiver from 'archiver'
import { prisma } from '@/lib/prisma'
const EXCLUDED_DIRS = ['backup', 'logs']

export type BackupPerformer = { userId: number; username: string }

function getAllFiles(
  dir: string,
  baseDir: string,
  excludePrefixes: string[],
  files: { absolute: string; relative: string }[] = []
): { absolute: string; relative: string }[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    const relativePath = path.relative(baseDir, fullPath)
    const relativeNormalized = path.normalize(relativePath).replace(/\\/g, '/')

    const isExcluded = excludePrefixes.some(
      (p) => relativeNormalized === p || relativeNormalized.startsWith(p + '/')
    )
    if (isExcluded) continue

    if (entry.isDirectory()) {
      getAllFiles(fullPath, baseDir, excludePrefixes, files)
    } else {
      files.push({
        absolute: fullPath,
        relative: relativePath.replace(/\\/g, '/'),
      })
    }
  }
  return files
}

/**
 * Runs media backup: zips public (excluding backup, logs), writes to public/backup,
 * prunes old zip files, logs BackupHistory. Returns path to the created zip file.
 */
export async function runMediaBackup(
  performer: BackupPerformer
): Promise<string> {
  const publicDir = path.join(process.cwd(), 'public')
  if (!fs.existsSync(publicDir)) {
    throw new Error('Public directory not found')
  }

  const backupDir = path.join(publicDir, 'backup')
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true })
  }

  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, '-')
    .slice(0, -5)
  const zipFileName = `backup_${timestamp}.zip`
  const zipPath = path.join(backupDir, zipFileName)

  const allFiles = getAllFiles(publicDir, publicDir, EXCLUDED_DIRS)

  await new Promise<void>((resolve, reject) => {
    const output = fs.createWriteStream(zipPath)
    const archive = archiver('zip', { zlib: { level: 9 } })

    output.on('close', () => resolve())
    archive.on('error', (err) => reject(err))
    output.on('error', (err) => reject(err))

    archive.pipe(output)

    for (const { absolute, relative } of allFiles) {
      archive.file(absolute, { name: relative })
    }

    archive.finalize()
  })

  // Delete old backup zip files (keep only the one just created)
  const backupFiles = fs.readdirSync(backupDir)
  const backupZipPattern = /^backup_.*\.zip$/
  for (const name of backupFiles) {
    if (backupZipPattern.test(name) && name !== zipFileName) {
      const filePath = path.join(backupDir, name)
      try {
        fs.rmSync(filePath, { force: true })
      } catch (err: unknown) {
        const unlinkErr = err as NodeJS.ErrnoException
        if (unlinkErr?.code === 'EPERM' || unlinkErr?.code === 'EBUSY') {
          console.warn('Skipping old backup file in use:', filePath)
        } else {
          console.error('Error deleting old backup file:', filePath, err)
        }
      }
    }
  }

  const recent = await prisma.backupHistory.findFirst({
    where: {
      type: 'media',
      action: 'backup',
      status: 'success',
      performerId: performer.userId,
      createdAt: { gte: new Date(Date.now() - 60_000) },
    },
  })
  if (!recent) {
    await prisma.backupHistory.create({
      data: {
        action: 'backup',
        status: 'success',
        type: 'media',
        performerId: performer.userId,
        performerUsername: performer.username,
      },
    })
  }

  return zipPath
}

/**
 * Export database to a JSON-serializable object (same shape as backup API).
 * @param exportedBy - Username or label for who triggered the export (default 'system')
 */
export async function exportDatabaseBackupData(
  exportedBy: string = 'system'
): Promise<object> {
  const data = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    exportedBy,
    data: {
      productCategories: await prisma.productCategory.findMany({
        orderBy: { id: 'asc' },
      }),
      products: await prisma.product.findMany({ orderBy: { id: 'asc' } }),
      news: await prisma.news.findMany({ orderBy: { id: 'asc' } }),
      banners: await prisma.banner.findMany({ orderBy: { id: 'asc' } }),
      partners: await prisma.partner.findMany({ orderBy: { id: 'asc' } }),
      heroContent: await prisma.heroContent.findMany({
        orderBy: { id: 'asc' },
      }),
      projects: await prisma.project.findMany({ orderBy: { id: 'asc' } }),
      services: await prisma.service.findMany({ orderBy: { id: 'asc' } }),
      storageMedia: await prisma.storageMedia.findMany({
        orderBy: { id: 'asc' },
      }),
      offices: await prisma.office.findMany({ orderBy: { id: 'asc' } }),
      contactForms: await prisma.contactForm.findMany({
        orderBy: { id: 'asc' },
      }),
      companyInfo: await prisma.companyInfo.findMany({
        orderBy: { id: 'asc' },
      }),
      users: await prisma.user.findMany({
        select: {
          id: true,
          username: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { id: 'asc' },
      }),
      visits: await prisma.visit.findMany({ orderBy: { id: 'asc' } }),
    },
  }
  return data
}

/**
 * Runs database backup: exports DB, optionally writes to public/backup, logs BackupHistory.
 * When saveToFile is true, writes to public/backup/database-backup-{timestamp}.json.
 * Returns the backup data object.
 */
export async function runDatabaseBackup(
  performer: BackupPerformer,
  options: { saveToFile?: boolean } = {}
): Promise<object> {
  const backupData = await exportDatabaseBackupData(performer.username)
  if (options.saveToFile) {
    const publicDir = path.join(process.cwd(), 'public')
    const backupDir = path.join(publicDir, 'backup')
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true })
    }
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, '-')
      .slice(0, -5)
    const filePath = path.join(backupDir, `database-backup-${timestamp}.json`)
    fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2), 'utf-8')
  }

  await prisma.backupHistory.create({
    data: {
      action: 'backup',
      status: 'success',
      type: 'database',
      performerId: performer.userId,
      performerUsername: performer.username,
    },
  })

  return backupData
}
