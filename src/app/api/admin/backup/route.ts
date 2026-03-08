import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAccessToken } from '@/lib/auth-cookies'
import { verifyAccessToken } from '@/lib/auth'

// GET /api/admin/backup - Export entire database to JSON
export async function GET(request: NextRequest) {
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

    // Export all data from all tables
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      exportedBy: payload.username,
      data: {
        // Product Categories
        productCategories: await prisma.productCategory.findMany({
          orderBy: { id: 'asc' },
        }),
        
        // Products
        products: await prisma.product.findMany({
          orderBy: { id: 'asc' },
        }),
        
        // News
        news: await prisma.news.findMany({
          orderBy: { id: 'asc' },
        }),
        
        // Banners
        banners: await prisma.banner.findMany({
          orderBy: { id: 'asc' },
        }),
        
        // Partners
        partners: await prisma.partner.findMany({
          orderBy: { id: 'asc' },
        }),
        
        // Hero Content
        heroContent: await prisma.heroContent.findMany({
          orderBy: { id: 'asc' },
        }),
        
        // Projects
        projects: await prisma.project.findMany({
          orderBy: { id: 'asc' },
        }),
        
        // Services
        services: await prisma.service.findMany({
          orderBy: { id: 'asc' },
        }),
        
        // Storage Media
        storageMedia: await prisma.storageMedia.findMany({
          orderBy: { id: 'asc' },
        }),
        
        // Offices
        offices: await prisma.office.findMany({
          orderBy: { id: 'asc' },
        }),
        
        // Contact Forms
        contactForms: await prisma.contactForm.findMany({
          orderBy: { id: 'asc' },
        }),
        
        // Company Info
        companyInfo: await prisma.companyInfo.findMany({
          orderBy: { id: 'asc' },
        }),
        
        // Users (excluding passwords for security)
        users: await prisma.user.findMany({
          select: {
            id: true,
            username: true,
            role: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
            // Exclude password field
          },
          orderBy: { id: 'asc' },
        }),
        
        // Visits
        visits: await prisma.visit.findMany({
          orderBy: { id: 'asc' },
        }),
      },
    }

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
    const filename = `database-backup-${timestamp}.json`

    // Return JSON file as download
    return new NextResponse(JSON.stringify(backupData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error creating backup:', error)
    return NextResponse.json(
      {
        error: 'Failed to create backup',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    )
  }
}
