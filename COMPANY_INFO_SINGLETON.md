# CompanyInfo Singleton Pattern

## Overview

The `CompanyInfo` model has been updated to follow a **singleton pattern**, ensuring that only **one record** can exist in the database at any time. This is appropriate for company information since there should only be one company's information stored.

## Changes Made

### 1. Database Schema (`prisma/schema.prisma`)

**Before:**
```prisma
model CompanyInfo {
  id  Int  @id @default(autoincrement())
  // ... other fields
}
```

**After:**
```prisma
model CompanyInfo {
  id  Int  @id @default(1)  // Fixed id = 1 (singleton)
  // ... other fields
  
  @@map("CompanyInfo")
}
```

**Key Changes:**
- Changed `@default(autoincrement())` to `@default(1)` to ensure only one record with `id=1` can exist
- Added `@@map("CompanyInfo")` to explicitly map the table name

### 2. API Routes (`src/app/api/company-info/route.ts`)

**GET Endpoint:**
- Changed from `findFirst()` to `findUnique({ where: { id: 1 } })`
- Explicitly creates record with `id: 1` if it doesn't exist

**PUT/POST Endpoints:**
- Uses `upsert()` with `where: { id: 1 }` to always update the singleton record
- Ensures only one record exists by always targeting `id=1`

### 3. Migration Script

Created `prisma/migrations/cleanup_company_info_duplicates.sql` to:
- Keep the oldest CompanyInfo record
- Set its id to 1
- Delete all duplicate records
- Prepare database for the new schema

## How to Apply Changes

### Step 1: Clean Up Existing Duplicates (if any)

Run the cleanup script to remove any duplicate records:

```bash
# Connect to your PostgreSQL database and run:
psql -h <host> -U <user> -d <database> -f prisma/migrations/cleanup_company_info_duplicates.sql
```

Or using Docker:

```bash
docker-compose exec postgres psql -U postgres -d landing_page -f /path/to/cleanup_company_info_duplicates.sql
```

### Step 2: Generate and Apply Prisma Migration

```bash
# Generate Prisma client with new schema
npx prisma generate

# Create and apply migration
npx prisma migrate dev --name company_info_singleton

# Or if you want to push directly without creating migration files
npx prisma db push
```

### Step 3: Restart Your Application

```bash
# If using Docker
docker-compose restart nextjs

# If running locally
npm run dev
```

## Benefits

1. **Data Integrity**: Prevents accidental creation of duplicate company information
2. **Simplified Queries**: No need to use `findFirst()` or worry about which record to use
3. **Predictable Behavior**: Always know that company info is at `id=1`
4. **Better Performance**: `findUnique()` is faster than `findFirst()`
5. **Clear Intent**: Code explicitly shows this is a singleton pattern

## API Behavior

### GET `/api/company-info`
- Returns the singleton CompanyInfo record (id=1)
- Creates default record if none exists
- Always returns exactly one record

### PUT/POST `/api/company-info`
- Updates the singleton CompanyInfo record (id=1)
- Creates record if it doesn't exist
- Never creates duplicate records

## Frontend Usage

No changes required in frontend code! The API continues to work the same way:

```typescript
// Fetch company info
const response = await fetch('/api/company-info');
const companyInfo = await response.json();

// Update company info
const response = await fetch('/api/company-info', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(updatedData),
});
```

## Database Constraint

The singleton pattern is enforced at multiple levels:

1. **Application Level**: API always uses `id=1`
2. **Database Level**: Primary key constraint on `id` prevents duplicates
3. **Schema Level**: Default value of `1` guides record creation

## Troubleshooting

### Issue: Migration fails with "duplicate key value"

**Solution**: Run the cleanup script first to remove duplicates before applying the migration.

```bash
# Run cleanup script
psql -U postgres -d landing_page -f prisma/migrations/cleanup_company_info_duplicates.sql

# Then run migration
npx prisma migrate dev
```

### Issue: Cannot create CompanyInfo record

**Solution**: Check if a record with `id=1` already exists. Use PUT/POST to update it instead.

```bash
# Check existing records
npx prisma studio
# Or query directly
psql -U postgres -d landing_page -c "SELECT id, \"companyName\" FROM \"CompanyInfo\";"
```

### Issue: Need to reset CompanyInfo

**Solution**: Delete the record and let the API recreate it with defaults:

```sql
DELETE FROM "CompanyInfo" WHERE id = 1;
```

Then make a GET request to `/api/company-info` to recreate with defaults.

## Testing

You can verify the singleton pattern works correctly:

```bash
# Test 1: GET should return or create the singleton
curl http://localhost:3000/api/company-info

# Test 2: PUT should update the singleton
curl -X PUT http://localhost:3000/api/company-info \
  -H "Content-Type: application/json" \
  -d '{"companyName": "Updated Name"}'

# Test 3: Verify only one record exists
npx prisma studio
# Check that only one CompanyInfo record with id=1 exists
```

## Notes

- The singleton pattern is ideal for configuration or settings tables
- If you ever need multiple company profiles, you would need to redesign this to a different pattern
- The `id=1` convention is a common pattern for singleton records in databases
- This pattern is also used by other models like `HeroContent` in your application

## Related Files

- `prisma/schema.prisma` - Database schema definition
- `src/app/api/company-info/route.ts` - API endpoints
- `src/components/CompanyInfoForm.tsx` - Frontend form component
- `src/lib/features/companyInfo/companyInfoSlice.ts` - Redux state management
