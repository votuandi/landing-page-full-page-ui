import { NextRequest, NextResponse } from 'next/server';
import { getRefreshToken, setAuthCookies, clearAuthCookies } from '@/lib/auth-cookies';
import { verifyRefreshToken, generateAccessToken, generateRefreshToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const refreshToken = await getRefreshToken();

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token not found' },
        { status: 401 }
      );
    }

    // Verify refresh token
    const payload = await verifyRefreshToken(refreshToken);
    if (!payload) {
      await clearAuthCookies();
      return NextResponse.json(
        { error: 'Invalid or expired refresh token' },
        { status: 401 }
      );
    }

    // Check if user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user || !user.isActive) {
      await clearAuthCookies();
      return NextResponse.json(
        { error: 'User not found or inactive' },
        { status: 401 }
      );
    }

    // Generate new tokens
    const tokenPayload = {
      userId: user.id,
      username: user.username,
      role: user.role,
    };

    const newAccessToken = await generateAccessToken(tokenPayload);
    const newRefreshToken = await generateRefreshToken(tokenPayload);

    // Set new cookies
    await setAuthCookies(newAccessToken, newRefreshToken);

    return NextResponse.json(
      {
        success: true,
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Refresh token error:', error);
    await clearAuthCookies();
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
