# ⚠️ Dev Server Restart Required

## Issue
You're getting a 500 error when updating product categories:
```
PUT http://localhost:3000/api/product-categories/3 500 (Internal Server Error)
```

## Root Cause
The Prisma client was regenerated with the new `imageUrl` field, but the dev server is still using the old cached version without this field.

## Solution
**Restart your development server:**

1. Stop the current dev server (Ctrl+C in the terminal running `yarn dev`)
2. Start it again: `yarn dev`

## What Happened
1. ✅ Added `imageUrl` field to `ProductCategory` in Prisma schema
2. ✅ Ran `npx prisma db push` - Database updated
3. ✅ Ran `npx prisma generate` - Prisma client regenerated
4. ❌ Dev server still using old Prisma client (needs restart)

## After Restart
The PUT endpoint will work correctly and accept the `imageUrl` field.

---

**Note:** You can delete this file after restarting the server.
