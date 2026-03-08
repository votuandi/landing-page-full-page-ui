import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAccessToken } from '@/lib/auth-cookies';
import { verifyAccessToken } from '@/lib/auth';

// GET /api/users - Get all users (admin only)
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const accessToken = await getAccessToken();
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const payload = await verifyAccessToken(accessToken);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (payload.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can view users' },
        { status: 403 }
      );
    }

    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
