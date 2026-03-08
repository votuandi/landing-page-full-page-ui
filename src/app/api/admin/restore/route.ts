import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAccessToken } from '@/lib/auth-cookies'
import { verifyAccessToken } from '@/lib/auth'

interface BackupData {
  version?: string
  exportedAt?: string
  exportedBy?: string
  data: {
    productCategories?: any[]
    products?: any[]
    news?: any[]
    banners?: any[]
    partners?: any[]
    heroContent?: any[]
    projects?: any[]
    services?: any[]
    storageMedia?: any[]
    offices?: any[]
    contactForms?: any[]
    companyInfo?: any[]
    users?: any[]
    visits?: any[]
  }
}

// POST /api/admin/restore - Restore database from backup file
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const accessToken = await getAccessToken()
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Verify access token
    const payload = await verifyAccessToken(accessToken)
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    // Check if user is admin
    if (payload.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }

    // Get the uploaded file
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.name.endsWith('.json')) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JSON files are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File size exceeds maximum limit of 50MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB` },
        { status: 400 }
      )
    }

    if (file.size === 0) {
      return NextResponse.json(
        { error: 'File is empty' },
        { status: 400 }
      )
    }

    // Read and parse the file
    let backupData: BackupData
    try {
      const fileContent = await file.text()
      backupData = JSON.parse(fileContent)
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON file. Please check the file format.' },
        { status: 400 }
      )
    }

    // Validate backup structure
    if (!backupData || typeof backupData !== 'object') {
      return NextResponse.json(
        { error: 'Invalid backup file structure. File must be a JSON object.' },
        { status: 400 }
      )
    }

    if (!backupData.data || typeof backupData.data !== 'object') {
      return NextResponse.json(
        { error: 'Invalid backup file structure. Missing data object.' },
        { status: 400 }
      )
    }

    // Validate that data properties are arrays (if they exist)
    const validDataKeys = [
      'productCategories',
      'products',
      'news',
      'banners',
      'partners',
      'heroContent',
      'projects',
      'services',
      'storageMedia',
      'offices',
      'contactForms',
      'companyInfo',
      'users',
      'visits',
    ]

    for (const key of validDataKeys) {
      if (backupData.data.hasOwnProperty(key)) {
        if (!Array.isArray(backupData.data[key])) {
          return NextResponse.json(
            { error: `Invalid backup file structure. "${key}" must be an array.` },
            { status: 400 }
          )
        }
      }
    }

    // Check if there's at least some data to restore
    const hasData = validDataKeys.some(key => 
      backupData.data[key] && Array.isArray(backupData.data[key]) && backupData.data[key].length > 0
    )

    if (!hasData) {
      return NextResponse.json(
        { error: 'Backup file contains no data to restore.' },
        { status: 400 }
      )
    }

    // Use a transaction to ensure atomicity - if anything fails, rollback everything
    const result = await prisma.$transaction(async (tx) => {
      const restoreStats = {
        productCategories: 0,
        products: 0,
        news: 0,
        banners: 0,
        partners: 0,
        heroContent: 0,
        projects: 0,
        services: 0,
        storageMedia: 0,
        offices: 0,
        contactForms: 0,
        companyInfo: 0,
        users: 0,
        visits: 0,
      }

      try {
        // Delete all existing data in reverse dependency order to avoid foreign key constraints
        // First, delete data that has foreign keys
        if (backupData.data.products) {
          await tx.product.deleteMany({})
        }
        if (backupData.data.storageMedia) {
          await tx.storageMedia.deleteMany({})
        }
        if (backupData.data.productCategories) {
          await tx.productCategory.deleteMany({})
        }
        if (backupData.data.news) {
          await tx.news.deleteMany({})
        }
        if (backupData.data.banners) {
          await tx.banner.deleteMany({})
        }
        if (backupData.data.partners) {
          await tx.partner.deleteMany({})
        }
        if (backupData.data.heroContent) {
          await tx.heroContent.deleteMany({})
        }
        if (backupData.data.projects) {
          await tx.project.deleteMany({})
        }
        if (backupData.data.services) {
          await tx.service.deleteMany({})
        }
        if (backupData.data.offices) {
          await tx.office.deleteMany({})
        }
        if (backupData.data.contactForms) {
          await tx.contactForm.deleteMany({})
        }
        if (backupData.data.companyInfo) {
          await tx.companyInfo.deleteMany({})
        }
        if (backupData.data.visits) {
          await tx.visit.deleteMany({})
        }
        // Note: We don't delete users to preserve authentication - we'll update/create them instead

        // Restore data in dependency order
        // 1. Product Categories (no dependencies)
        if (backupData.data.productCategories && backupData.data.productCategories.length > 0) {
          for (const category of backupData.data.productCategories) {
            await tx.productCategory.create({
              data: {
                id: category.id,
                name: category.name,
                description: category.description,
                imageUrl: category.imageUrl,
                createdAt: category.createdAt ? new Date(category.createdAt) : new Date(),
                updatedAt: category.updatedAt ? new Date(category.updatedAt) : new Date(),
              },
            })
          }
          restoreStats.productCategories = backupData.data.productCategories.length
        }

        // 2. Products (depends on ProductCategory)
        if (backupData.data.products && backupData.data.products.length > 0) {
          for (const product of backupData.data.products) {
            await tx.product.create({
              data: {
                id: product.id,
                title: product.title,
                description: product.description,
                isActive: product.isActive,
                imageUrl: product.imageUrl,
                categoryId: product.categoryId,
                order: product.order,
                price: product.price,
                original_price: product.original_price,
                isBestSeller: product.isBestSeller,
                showInHomePage: product.showInHomePage,
                guarantee: product.guarantee,
                introduction: product.introduction,
                specifications: product.specifications,
                createdAt: product.createdAt ? new Date(product.createdAt) : new Date(),
                updatedAt: product.updatedAt ? new Date(product.updatedAt) : new Date(),
              },
            })
          }
          restoreStats.products = backupData.data.products.length
        }

        // 3. News
        if (backupData.data.news && backupData.data.news.length > 0) {
          for (const newsItem of backupData.data.news) {
            await tx.news.create({
              data: {
                id: newsItem.id,
                title: newsItem.title,
                excerpt: newsItem.excerpt,
                content: newsItem.content,
                author: newsItem.author,
                category: newsItem.category,
                readTime: newsItem.readTime,
                imageUrl: newsItem.imageUrl,
                tags: newsItem.tags || [],
                isActive: newsItem.isActive,
                order: newsItem.order,
                publishedAt: newsItem.publishedAt ? new Date(newsItem.publishedAt) : new Date(),
                createdAt: newsItem.createdAt ? new Date(newsItem.createdAt) : new Date(),
                updatedAt: newsItem.updatedAt ? new Date(newsItem.updatedAt) : new Date(),
              },
            })
          }
          restoreStats.news = backupData.data.news.length
        }

        // 4. Banners
        if (backupData.data.banners && backupData.data.banners.length > 0) {
          for (const banner of backupData.data.banners) {
            await tx.banner.create({
              data: {
                id: banner.id,
                title: banner.title,
                description: banner.description,
                isActive: banner.isActive,
                order: banner.order,
                backgroundColor: banner.backgroundColor,
                backgroundImage: banner.backgroundImage,
                buttonLink: banner.buttonLink,
                buttonText: banner.buttonText,
                subtitle: banner.subtitle,
                createdAt: banner.createdAt ? new Date(banner.createdAt) : new Date(),
                updatedAt: banner.updatedAt ? new Date(banner.updatedAt) : new Date(),
              },
            })
          }
          restoreStats.banners = backupData.data.banners.length
        }

        // 5. Partners
        if (backupData.data.partners && backupData.data.partners.length > 0) {
          for (const partner of backupData.data.partners) {
            await tx.partner.create({
              data: {
                id: partner.id,
                name: partner.name,
                image: partner.image,
                order: partner.order,
                isActive: partner.isActive,
                createdAt: partner.createdAt ? new Date(partner.createdAt) : new Date(),
                updatedAt: partner.updatedAt ? new Date(partner.updatedAt) : new Date(),
              },
            })
          }
          restoreStats.partners = backupData.data.partners.length
        }

        // 6. Hero Content
        if (backupData.data.heroContent && backupData.data.heroContent.length > 0) {
          for (const hero of backupData.data.heroContent) {
            await tx.heroContent.create({
              data: {
                id: hero.id,
                title: hero.title,
                description: hero.description,
                videoUrl: hero.videoUrl,
                stat1Value: hero.stat1Value,
                stat1Label: hero.stat1Label,
                stat2Value: hero.stat2Value,
                stat2Label: hero.stat2Label,
                stat3Value: hero.stat3Value,
                stat3Label: hero.stat3Label,
                feature1Title: hero.feature1Title,
                feature1Description: hero.feature1Description,
                feature2Title: hero.feature2Title,
                feature2Description: hero.feature2Description,
                createdAt: hero.createdAt ? new Date(hero.createdAt) : new Date(),
                updatedAt: hero.updatedAt ? new Date(hero.updatedAt) : new Date(),
              },
            })
          }
          restoreStats.heroContent = backupData.data.heroContent.length
        }

        // 7. Projects
        if (backupData.data.projects && backupData.data.projects.length > 0) {
          for (const project of backupData.data.projects) {
            await tx.project.create({
              data: {
                id: project.id,
                title: project.title,
                location: project.location,
                capacity: project.capacity,
                completedDate: project.completedDate,
                imageUrl: project.imageUrl,
                description: project.description,
                detail: project.detail,
                category: project.category,
                client: project.client,
                isDisplay: project.isDisplay,
                showInHomepage: project.showInHomepage,
                order: project.order,
                createdAt: project.createdAt ? new Date(project.createdAt) : new Date(),
                updatedAt: project.updatedAt ? new Date(project.updatedAt) : new Date(),
              },
            })
          }
          restoreStats.projects = backupData.data.projects.length
        }

        // 8. Services
        if (backupData.data.services && backupData.data.services.length > 0) {
          for (const service of backupData.data.services) {
            await tx.service.create({
              data: {
                id: service.id,
                title: service.title,
                description: service.description,
                image: service.image,
                features: service.features || [],
                price: service.price,
                category: service.category,
                duration: service.duration,
                warranty: service.warranty,
                benefits: service.benefits,
                implementationProcess: service.implementationProcess,
                isActive: service.isActive,
                order: service.order,
                createdAt: service.createdAt ? new Date(service.createdAt) : new Date(),
                updatedAt: service.updatedAt ? new Date(service.updatedAt) : new Date(),
              },
            })
          }
          restoreStats.services = backupData.data.services.length
        }

        // 9. Storage Media
        if (backupData.data.storageMedia && backupData.data.storageMedia.length > 0) {
          for (const media of backupData.data.storageMedia) {
            await tx.storageMedia.create({
              data: {
                id: media.id,
                parentId: media.parentId,
                type: media.type,
                parentType: media.parentType,
                path: media.path,
                createdAt: media.createdAt ? new Date(media.createdAt) : new Date(),
                updatedAt: media.updatedAt ? new Date(media.updatedAt) : new Date(),
              },
            })
          }
          restoreStats.storageMedia = backupData.data.storageMedia.length
        }

        // 10. Offices
        if (backupData.data.offices && backupData.data.offices.length > 0) {
          for (const office of backupData.data.offices) {
            await tx.office.create({
              data: {
                id: office.id,
                name: office.name,
                phone: office.phone,
                email: office.email,
                address: office.address,
                workingTime: office.workingTime,
                googleMapEmbedUrl: office.googleMapEmbedUrl,
                isMainOffice: office.isMainOffice,
                createdAt: office.createdAt ? new Date(office.createdAt) : new Date(),
                updatedAt: office.updatedAt ? new Date(office.updatedAt) : new Date(),
              },
            })
          }
          restoreStats.offices = backupData.data.offices.length
        }

        // 11. Contact Forms
        if (backupData.data.contactForms && backupData.data.contactForms.length > 0) {
          for (const form of backupData.data.contactForms) {
            await tx.contactForm.create({
              data: {
                id: form.id,
                name: form.name,
                phone: form.phone,
                email: form.email,
                consultationType: form.consultationType,
                specificItem: form.specificItem,
                details: form.details,
                isResolved: form.isResolved,
                createdAt: form.createdAt ? new Date(form.createdAt) : new Date(),
                updatedAt: form.updatedAt ? new Date(form.updatedAt) : new Date(),
              },
            })
          }
          restoreStats.contactForms = backupData.data.contactForms.length
        }

        // 12. Company Info
        if (backupData.data.companyInfo && backupData.data.companyInfo.length > 0) {
          for (const company of backupData.data.companyInfo) {
            await tx.companyInfo.create({
              data: {
                id: company.id,
                companyName: company.companyName,
                logoUrl: company.logoUrl,
                slogan: company.slogan,
                storyTitle: company.storyTitle,
                storyDetail: company.storyDetail,
                storyImageUrl: company.storyImageUrl,
                storyVideoUrl: company.storyVideoUrl,
                storyItems: company.storyItems,
                milestones: company.milestones,
                coreValues: company.coreValues,
                mission: company.mission,
                achievements: company.achievements,
                team: company.team,
                whyChooseUs: company.whyChooseUs,
                facebook: company.facebook,
                zalo: company.zalo,
                youtube: company.youtube,
                tiktok: company.tiktok,
                instagram: company.instagram,
                createdAt: company.createdAt ? new Date(company.createdAt) : new Date(),
                updatedAt: company.updatedAt ? new Date(company.updatedAt) : new Date(),
              },
            })
          }
          restoreStats.companyInfo = backupData.data.companyInfo.length
        }

        // 13. Visits
        if (backupData.data.visits && backupData.data.visits.length > 0) {
          for (const visit of backupData.data.visits) {
            await tx.visit.create({
              data: {
                id: visit.id,
                date: visit.date ? new Date(visit.date) : new Date(),
                views: visit.views || 0,
                createdAt: visit.createdAt ? new Date(visit.createdAt) : new Date(),
                updatedAt: visit.updatedAt ? new Date(visit.updatedAt) : new Date(),
              },
            })
          }
          restoreStats.visits = backupData.data.visits.length
        }

        // Note: Users are not restored from backup to preserve current authentication
        // If you want to restore users, you would need to handle password hashing properly

        return restoreStats
      } catch (error) {
        // Transaction will automatically rollback on error
        throw error
      }
    }, {
      timeout: 60000, // 60 second timeout for large restores
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Database restored successfully',
        stats: result,
        restoredAt: new Date().toISOString(),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error restoring backup:', error)
    
    // Check if it's a known error
    let errorMessage = 'Failed to restore backup'
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        errorMessage = 'Restore operation timed out. The backup file may be too large.'
      } else if (error.message.includes('foreign key') || error.message.includes('constraint')) {
        errorMessage = 'Data integrity error. The backup file may be corrupted or incomplete.'
      } else {
        errorMessage = error.message
      }
    }

    return NextResponse.json(
      {
        error: 'Failed to restore backup',
        message: errorMessage,
        details: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}
