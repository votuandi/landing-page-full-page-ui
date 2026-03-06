import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/database/status - Check database connection status
export async function GET(request: NextRequest) {
  try {
    // Check if DATABASE_URL is configured
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        {
          connected: false,
          status: 'error',
          message: 'DATABASE_URL environment variable is not set',
          details: 'Please check your .env file and ensure DATABASE_URL is configured.',
        },
        { status: 500 }
      )
    }

    // Try to connect to the database by executing a simple query
    const startTime = Date.now()
    await prisma.$queryRaw`SELECT 1`
    const responseTime = Date.now() - startTime

    // Get database info if possible
    let databaseInfo = null
    try {
      const result = await prisma.$queryRaw<Array<{ version: string }>>`
        SELECT version()
      `
      if (result && result.length > 0) {
        databaseInfo = {
          version: result[0].version,
        }
      }
    } catch (err) {
      // Ignore errors when fetching database info
    }

    return NextResponse.json(
      {
        connected: true,
        status: 'success',
        message: 'Database connection successful',
        responseTime: `${responseTime}ms`,
        databaseUrl: process.env.DATABASE_URL
          ? process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@') // Mask password
          : null,
        databaseInfo,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Database connection check failed:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    // Provide user-friendly error messages
    let userFriendlyMessage = errorMessage
    let errorCode = null
    
    if (errorMessage.includes('P1001') || errorMessage.includes("Can't reach database server")) {
      userFriendlyMessage = 'Cannot reach database server. Please check if the database is running and the connection string is correct.'
      errorCode = 'P1001'
    } else if (errorMessage.includes('P1000') || errorMessage.includes('Authentication failed')) {
      userFriendlyMessage = 'Database authentication failed. Please check your username and password.'
      errorCode = 'P1000'
    } else if (errorMessage.includes('P1003') || errorMessage.includes('Database does not exist')) {
      userFriendlyMessage = 'Database does not exist. Please create the database or check the database name in your connection string.'
      errorCode = 'P1003'
    } else if (errorMessage.includes('P1017') || errorMessage.includes('Server has closed the connection')) {
      userFriendlyMessage = 'Database server closed the connection. Please try again.'
      errorCode = 'P1017'
    }

    return NextResponse.json(
      {
        connected: false,
        status: 'error',
        message: userFriendlyMessage,
        errorCode,
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
