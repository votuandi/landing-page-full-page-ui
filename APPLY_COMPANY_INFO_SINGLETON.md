# Quick Guide: Apply CompanyInfo Singleton Changes

## What Changed?

The `CompanyInfo` model now enforces a **singleton pattern** - only ONE record can exist with `id=1`.

## Apply Changes (Choose One Method)

### Method 1: Quick Apply (Development) ⚡

```bash
# Generate Prisma client
npx prisma generate

# Push changes to database
npx prisma db push

# Restart dev server
npm run dev
```

### Method 2: With Docker 🐳

```bash
# Generate Prisma client
docker-compose exec nextjs npx prisma generate

# Push changes to database
docker-compose exec nextjs npx prisma db push

# Restart container
docker-compose restart nextjs
```

### Method 3: Production Migration 🚀

```bash
# Step 1: Clean up duplicates (if any)
docker-compose exec postgres psql -U postgres -d landing_page \
  -f /app/prisma/migrations/cleanup_company_info_duplicates.sql

# Step 2: Create migration
npx prisma migrate dev --name company_info_singleton

# Step 3: Restart application
docker-compose restart nextjs
```

## Verify It Works

1. **Open Prisma Studio:**
   ```bash
   npx prisma studio
   ```
   - Check `CompanyInfo` table
   - Should see only ONE record with `id=1`

2. **Test API:**
   ```bash
   # Get company info
   curl http://localhost:3000/api/company-info
   
   # Update company info
   curl -X PUT http://localhost:3000/api/company-info \
     -H "Content-Type: application/json" \
     -d '{"companyName": "New Name"}'
   ```

3. **Check Admin Panel:**
   - Go to `http://localhost:3000/admin/settings`
   - Click "Thông tin công ty" tab
   - Make changes and save
   - Refresh page - changes should persist

## What If Something Goes Wrong?

### Issue: "Unique constraint failed"
**Solution:** This is expected! It means the singleton is working. Use PUT to update instead of creating new records.

### Issue: Migration fails
**Solution:** Run cleanup script first:
```bash
docker-compose exec postgres psql -U postgres -d landing_page \
  -c "DELETE FROM \"CompanyInfo\" WHERE id != (SELECT MIN(id) FROM \"CompanyInfo\");"
```

### Issue: Need to reset to defaults
**Solution:**
```bash
# Delete the record
docker-compose exec postgres psql -U postgres -d landing_page \
  -c "DELETE FROM \"CompanyInfo\" WHERE id = 1;"

# Visit API to recreate with defaults
curl http://localhost:3000/api/company-info
```

## Files Changed

- ✅ `prisma/schema.prisma` - Schema updated
- ✅ `src/app/api/company-info/route.ts` - API updated
- ✅ `prisma/migrations/cleanup_company_info_duplicates.sql` - Cleanup script
- ✅ `COMPANY_INFO_SINGLETON.md` - Full documentation

## Need More Help?

See detailed documentation in:
- `COMPANY_INFO_SINGLETON.md` - Technical details
- `IMPLEMENTATION_NOTES.md` - Implementation summary

## Summary

**Before:** Multiple CompanyInfo records could be created ❌  
**After:** Only ONE CompanyInfo record (id=1) can exist ✅

This ensures data consistency and prevents confusion about which company info to use.
