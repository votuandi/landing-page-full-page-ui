import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { getAccessToken } from '@/lib/auth-cookies';
import { verifyAccessToken } from '@/lib/auth';

// This endpoint is for creating additional users (admin only)
// For initial setup, use the seed script
export async function POST(request: NextRequest) {
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
        { error: 'Only admins can create users' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { username, password, role = 'editor' } = body;

    // Validate input
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 409 }
      );
    }

    // Validate role
    if (role !== 'admin' && role !== 'editor') {
      return NextResponse.json(
        { error: 'Invalid role. Must be "admin" or "editor"' },
        { status: 400 }
      );
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role: role as 'admin' | 'editor',
        isActive: true,
      },
      select: {
        id: true,
        username: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        user,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
