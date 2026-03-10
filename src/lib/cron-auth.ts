import { NextRequest } from 'next/server'

/**
 * Verifies cron secret for server-side cron endpoints (e.g. VPS cron hitting API).
 * Expects CRON_SECRET in env and Authorization: Bearer <secret> or x-cron-secret header.
 */
export function verifyCronSecret(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const authHeader = request.headers.get('authorization')
  const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  const headerSecret = request.headers.get('x-cron-secret')
  const provided = bearer ?? headerSecret ?? request.nextUrl.searchParams.get('secret')
  return provided === secret
}
