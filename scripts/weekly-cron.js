/**
 * Weekly cron runner for VPS: calls the cleanup-orphaned-media endpoint
 * every Saturday at 2:00 AM. Requires the Next.js app to be running
 * (e.g. via pm2) and CRON_SECRET + BASE_URL in env.
 *
 * Usage:
 *   CRON_SECRET=your-secret BASE_URL=http://localhost:3000 node scripts/weekly-cron.js
 *
 * Or use system cron instead (no node-cron needed):
 *   0 2 * * 6 curl -s -H "Authorization: Bearer $CRON_SECRET" "$BASE_URL/api/cron/cleanup-orphaned-media"
 */

require('dotenv/config')
const cron = require('node-cron')

const CRON_SECRET = process.env.CRON_SECRET
const BASE_URL = (process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '')

if (!CRON_SECRET) {
  console.error('CRON_SECRET is required. Set it in .env or environment.')
  process.exit(1)
}

// Saturday at 2:00 AM
const schedule = '47 8 * * 2'

function runJob() {
  const url = `${BASE_URL}/api/cron/cleanup-orphaned-media`
  console.log('[weekly-cron] Running cleanup-orphaned-media at', new Date().toISOString())

  fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${CRON_SECRET}`,
    },
  })
    .then((res) => res.json())
    .then((body) => {
      if (body.ok) {
        console.log('[weekly-cron] Success. Deleted:', body.deletedCount, body.deleted?.length ? body.deleted : '')
        if (body.mediaBackupError) console.warn('[weekly-cron] Media backup had error:', body.mediaBackupError)
        if (body.databaseBackupError) console.warn('[weekly-cron] Database backup had error:', body.databaseBackupError)
      } else {
        console.error('[weekly-cron] Error:', body.error || body.message || body)
      }
    })
    .catch((err) => {
      console.error('[weekly-cron] Request failed:', err.message)
    })
}

cron.schedule(schedule, runJob, {
  timezone: process.env.TZ || 'Asia/Ho_Chi_Minh',
})

console.log('[weekly-cron] Scheduled: every Saturday at 2:00 AM. Waiting...')
