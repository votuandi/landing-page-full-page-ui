import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'
import { verifyCronSecret } from '@/lib/cron-auth'
import { runMediaBackup, runDatabaseBackup } from '@/lib/backup'
import { prisma } from '@/lib/prisma'
import { extractImageUrlFromCss } from '@/lib/imageUtils'

const AUTO_BACKUP_PERFORMER = {
  userId: 0,
  username: 'auto_backup_weekly',
} as const

/** Paths that must never be deleted (relative to public, forward slashes). */
const PROTECTED_PATTERNS: { dir: string; pattern: (name: string) => boolean }[] = [
  { dir: 'images', pattern: (name) => /^logo\./i.test(name) },
  { dir: 'images', pattern: (name) => name === 'our_story.webp' },
]

/**
 * Normalize a stored path to a key comparable with file paths under public:
 * "images/..." or "videos/..." (no leading slash, forward slashes).
 * Skips external URLs.
 */
function normalizeStoredPath(raw: string | null | undefined): string | null {
  if (!raw || typeof raw !== 'string' || raw.trim() === '') return null
  if (raw.startsWith('http://') || raw.startsWith('https://')) return null
  let p = raw.trim().replace(/\\/g, '/')
  if (p.startsWith('/')) p = p.slice(1)
  if (p.toLowerCase().startsWith('public/')) p = p.slice(7)
  if (!p.startsWith('images/') && !p.startsWith('videos/')) return null
  return p
}

/** Collect all media paths referenced in the database. */
async function getReferencedPaths(): Promise<Set<string>> {
  const set = new Set<string>()

  const banners = await prisma.banner.findMany({
    select: { backgroundImage: true },
  })
  for (const b of banners) {
    if (b.backgroundImage) {
      const url = extractImageUrlFromCss(b.backgroundImage) || b.backgroundImage
      const n = normalizeStoredPath(url)
      if (n) set.add(n)
    }
  }

  const hero = await prisma.heroContent.findMany({
    select: { videoUrl: true },
  })
  for (const h of hero) {
    const n = normalizeStoredPath(h.videoUrl)
    if (n) set.add(n)
  }

  const news = await prisma.news.findMany({ select: { imageUrl: true } })
  for (const n of news) {
    const key = normalizeStoredPath(n.imageUrl)
    if (key) set.add(key)
  }

  const partners = await prisma.partner.findMany({ select: { image: true } })
  for (const p of partners) {
    const key = normalizeStoredPath(p.image)
    if (key) set.add(key)
  }

  const products = await prisma.product.findMany({ select: { imageUrl: true } })
  for (const p of products) {
    const key = normalizeStoredPath(p.imageUrl)
    if (key) set.add(key)
  }

  const categories = await prisma.productCategory.findMany({
    select: { imageUrl: true },
  })
  for (const c of categories) {
    const key = normalizeStoredPath(c.imageUrl)
    if (key) set.add(key)
  }

  const projects = await prisma.project.findMany({ select: { imageUrl: true } })
  for (const p of projects) {
    const key = normalizeStoredPath(p.imageUrl)
    if (key) set.add(key)
  }

  const services = await prisma.service.findMany({ select: { image: true } })
  for (const s of services) {
    const key = normalizeStoredPath(s.image)
    if (key) set.add(key)
  }

  const storageMedia = await prisma.storageMedia.findMany({
    select: { path: true },
  })
  for (const m of storageMedia) {
    const key = normalizeStoredPath(m.path)
    if (key) set.add(key)
  }

  return set
}

/**
 * List all files under public/{dir} (and subdirs) as paths relative to public
 * with forward slashes, e.g. "images/products/foo.jpg".
 */
function listFilesUnderPublic(publicDir: string, dir: string): string[] {
  const out: string[] = []
  const fullDir = path.join(publicDir, dir)
  if (!fs.existsSync(fullDir) || !fs.statSync(fullDir).isDirectory()) {
    return out
  }

  function walk(currentDir: string, relativePrefix: string) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true })
    for (const entry of entries) {
      const rel = relativePrefix ? `${relativePrefix}/${entry.name}` : entry.name
      const full = path.join(currentDir, entry.name)
      if (entry.isDirectory()) {
        walk(full, rel)
      } else {
        out.push(rel)
      }
    }
  }

  walk(fullDir, dir)
  return out
}

/** Return true if this path is protected from deletion. */
function isProtected(relativePath: string): boolean {
  const normalized = relativePath.replace(/\\/g, '/')
  for (const { dir, pattern } of PROTECTED_PATTERNS) {
    if (!normalized.startsWith(dir + '/') && normalized !== dir) continue
    const afterDir = normalized.slice(dir.length + 1)
    const fileName = path.basename(afterDir)
    if (pattern(fileName)) return true
  }
  return false
}

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const publicDir = path.join(process.cwd(), 'public')
  const deleted: string[] = []
  let mediaBackupError: string | null = null
  let databaseBackupError: string | null = null

  try {
    // 1. Database backup (save to file) and log with auto_backup_weekly
    try {
      await runDatabaseBackup(AUTO_BACKUP_PERFORMER, { saveToFile: true })
    } catch (e) {
      databaseBackupError = e instanceof Error ? e.message : String(e)
      console.error('Cron: database backup failed', e)
      await prisma.backupHistory.create({
        data: {
          action: 'backup',
          status: 'failed',
          type: 'database',
          performerId: AUTO_BACKUP_PERFORMER.userId,
          performerUsername: AUTO_BACKUP_PERFORMER.username,
          errorMessage: databaseBackupError,
        },
      })
    }

    // 2. Media backup and log with auto_backup_weekly
    try {
      await runMediaBackup(AUTO_BACKUP_PERFORMER)
    } catch (e) {
      mediaBackupError = e instanceof Error ? e.message : String(e)
      console.error('Cron: media backup failed', e)
      await prisma.backupHistory.create({
        data: {
          action: 'backup',
          status: 'failed',
          type: 'media',
          performerId: AUTO_BACKUP_PERFORMER.userId,
          performerUsername: AUTO_BACKUP_PERFORMER.username,
          errorMessage: mediaBackupError,
        },
      })
    }

    // 3. Find and delete orphaned files under public/images and public/videos
    const referenced = await getReferencedPaths()
    const allFiles = [
      ...listFilesUnderPublic(publicDir, 'images'),
      ...listFilesUnderPublic(publicDir, 'videos'),
    ]

    for (const rel of allFiles) {
      if (isProtected(rel)) continue
      if (referenced.has(rel)) continue

      const fullPath = path.join(publicDir, rel)
      if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) continue

      try {
        fs.unlinkSync(fullPath)
        deleted.push(rel)
      } catch (err) {
        console.error('Failed to delete orphaned file:', fullPath, err)
      }
    }

    return NextResponse.json({
      ok: true,
      databaseBackupError: databaseBackupError ?? undefined,
      mediaBackupError: mediaBackupError ?? undefined,
      deletedCount: deleted.length,
      deleted,
    })
  } catch (error) {
    console.error('Cron cleanup-orphaned-media error:', error)
    return NextResponse.json(
      {
        error: 'Cleanup failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        databaseBackupError: databaseBackupError ?? undefined,
        mediaBackupError: mediaBackupError ?? undefined,
        deletedCount: deleted.length,
        deleted,
      },
      { status: 500 }
    )
  }
}
