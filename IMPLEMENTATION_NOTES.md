# CompanyInfo Singleton Implementation

## Summary

Successfully implemented a **singleton pattern** for the `CompanyInfo` model to ensure only one record can exist in the database.

## Changes Made

### 1. Database Schema (`prisma/schema.prisma`)

**Changed:**
```prisma
model CompanyInfo {
  id  Int  @id @default(1)  // Changed from autoincrement() to fixed value 1
  // ... rest of fields
  @@map("CompanyInfo")
}
```

**Why:**
- Setting `@default(1)` ensures the id is always 1
- This prevents multiple records from being created
- Primary key constraint ensures uniqueness

### 2. API Routes (`src/app/api/company-info/route.ts`)

**GET Endpoint:**
- Changed from `findFirst()` to `findUnique({ where: { id: 1 } })`
- More efficient and explicit about singleton pattern
- Creates record with `id: 1` if it doesn't exist

**PUT/POST Endpoints:**
- Uses `upsert()` with `where: { id: 1 }`
- Always targets the singleton record
- Prevents accidental creation of duplicates

### 3. Migration & Cleanup

**Created:**
- `prisma/migrations/cleanup_company_info_duplicates.sql` - SQL script to clean up any existing duplicates
- `COMPANY_INFO_SINGLETON.md` - Comprehensive documentation

## How to Apply

### Option 1: Quick Apply (Recommended for Development)

```bash
# 1. Generate Prisma client
npx prisma generate

# 2. Push schema changes to database
npx prisma db push

# 3. Restart your application
npm run dev
```

### Option 2: With Migration (Recommended for Production)

```bash
# 1. Clean up duplicates (if any exist)
docker-compose exec postgres psql -U postgres -d landing_page -f /path/to/cleanup_company_info_duplicates.sql

# 2. Generate and apply migration
npx prisma migrate dev --name company_info_singleton

# 3. Restart application
docker-compose restart nextjs
```

## Benefits

✅ **Data Integrity** - Impossible to create duplicate company info records  
✅ **Performance** - `findUnique()` is faster than `findFirst()`  
✅ **Clarity** - Code explicitly shows singleton intent  
✅ **Consistency** - Follows same pattern as other singleton models  
✅ **Safety** - Multiple levels of enforcement (app + database)

## Testing

After applying changes, verify:

```bash
# 1. Check that only one record exists
npx prisma studio
# Navigate to CompanyInfo table - should see only one record with id=1

# 2. Test API endpoints
curl http://localhost:3000/api/company-info

# 3. Try updating
curl -X PUT http://localhost:3000/api/company-info \
  -H "Content-Type: application/json" \
  -d '{"companyName": "Test Company"}'
```

## Additional Notes

### Other Singleton Models

Consider applying the same pattern to:
- `HeroContent` - Also should be singleton (currently uses `findFirst()`)
- Any other configuration/settings tables

### If You Need Multiple Records in Future

If business requirements change and you need multiple company profiles:
1. Revert schema changes
2. Add a `isActive` or `isPrimary` field
3. Update API to handle multiple records
4. Update frontend to select between companies

## Related Documentation

- `COMPANY_INFO_SINGLETON.md` - Detailed technical documentation
- `COMPANY_INFO_ARCHITECTURE.md` - Original architecture docs
- `COMPANY_INFO_QUICK_START.md` - Quick start guide

## Troubleshooting

### Error: "Unique constraint failed on the fields: (`id`)"

**Cause:** Trying to create a record when id=1 already exists  
**Solution:** This is expected behavior. Use PUT/POST to update instead.

### Error: Migration fails

**Cause:** Duplicate records exist in database  
**Solution:** Run the cleanup script first:
```bash
docker-compose exec postgres psql -U postgres -d landing_page -f prisma/migrations/cleanup_company_info_duplicates.sql
```

### Need to reset to defaults

**Solution:** Delete the record and make a GET request:
```sql
DELETE FROM "CompanyInfo" WHERE id = 1;
```
Then visit `/api/company-info` to recreate with defaults.

## Status

✅ Schema updated  
✅ API routes updated  
✅ Migration script created  
✅ Documentation created  
⏳ Pending: Database migration application  
⏳ Pending: Application restart

## Next Steps

1. Apply the migration to your database
2. Restart your application
3. Test the CompanyInfo functionality
4. Consider applying same pattern to `HeroContent` for consistency
