# Weekly cron: backup and orphaned media cleanup

This project runs a **weekly cron job** (every **Saturday at 2:00 AM**) that:

1. **Database backup** – Exports the database to `public/backup/database-backup-{timestamp}.json` and logs to backup history with `performerUsername="auto_backup_weekly"` and `performerId=0`.
2. **Media backup** – Zips `public/` (excluding `backup`, `logs`) to `public/backup/backup_{timestamp}.zip` and logs to backup history with the same performer.
3. **Orphaned media cleanup** – Deletes files under `public/images/` and `public/videos/` (and subdirectories) that are **not** referenced in the database.

## Referenced paths (never deleted)

- `Banner.backgroundImage`
- `HeroContent.videoUrl`
- `News.imageUrl`
- `Partner.image`
- `Product.imageUrl`
- `ProductCategory.imageUrl`
- `Project.imageUrl`
- `Service.image`
- `StorageMedia.path`

## Protected files (never deleted)

- `public/images/logo.*` (e.g. `logo.png`, `logo.svg`)
- `public/images/our_story.webp`

---

## VPS setup (no Vercel cron)

Set a strong **CRON_SECRET** in your environment so only your cron runner can call the endpoint.

### Option A: System crontab

1. Add to your `.env` (or server env):

   ```env
   CRON_SECRET=your-long-random-secret-here
   ```

2. Ensure the Next.js app is running (e.g. `pm2 start npm --name "next" -- start`).

3. Add a crontab entry (run `crontab -e`):

   ```cron
   0 2 * * 6 curl -s -H "Authorization: Bearer YOUR_CRON_SECRET" "http://localhost:3000/api/cron/cleanup-orphaned-media"
   ```

   Replace `YOUR_CRON_SECRET` and the URL if your app runs on another host/port. Use the same value as in your app’s `CRON_SECRET` env.

### Option B: Node script with node-cron

1. In `.env`:

   ```env
   CRON_SECRET=your-long-random-secret-here
   BASE_URL=http://localhost:3000
   ```

2. Run the cron script in the background (e.g. with pm2):

   ```bash
   npm run cron:weekly
   ```

   Or with pm2:

   ```bash
   pm2 start npm --name "weekly-cron" -- run cron:weekly
   ```

   The script schedules the job for **Saturday at 2:00 AM** (timezone: `TZ` or `Asia/Ho_Chi_Minh`). The Next.js app must be running for the HTTP call to succeed.

---

## Manual run

```bash
curl -s -H "Authorization: Bearer YOUR_CRON_SECRET" "http://localhost:3000/api/cron/cleanup-orphaned-media"
```

Response includes `deletedCount`, `deleted` (paths), and any backup errors.
