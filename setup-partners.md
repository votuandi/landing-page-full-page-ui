# Quick Setup Guide - Partners Feature

## Step-by-Step Instructions

Follow these steps in order to set up the Partners management feature:

### Step 1: Generate Prisma Client
This updates the Prisma client to include the new Partner model.

```bash
npx prisma generate
```

Expected output: ✔ Generated Prisma Client

### Step 2: Create and Apply Migration
This creates the Partner table in your database.

```bash
npx prisma migrate dev --name add_partner_model
```

Expected output: 
- Migration created
- Database schema updated
- ✔ Migration applied successfully

### Step 3: Seed the Database (Optional)
This populates the database with sample partner data.

```bash
npm run db:seed
```

Or:

```bash
npx prisma db seed
```

Expected output:
- Cleared existing data
- Created hero content
- Created 4 sample banners
- Created 7 sample partners
- Seed completed!

### Step 4: Restart Development Server
Restart your Next.js server to pick up all changes.

```bash
# Stop the current server (Ctrl+C)
# Then start it again:
npm run dev
```

## Verification

After completing the steps above:

1. **Check Homepage**: Visit `http://localhost:3000`
   - The OurPartners section should display partner logos from the database

2. **Check Admin Panel**: Visit `http://localhost:3000/admin/settings`
   - Click on the "Đối tác" tab
   - You should see a grid of 7 partners
   - Try adding, editing, and deleting partners

## Troubleshooting

### If you see TypeScript errors:
```bash
# Regenerate Prisma client
npx prisma generate

# Restart your IDE/editor
# In VS Code: Ctrl+Shift+P → "Developer: Reload Window"
```

### If database connection fails:
```bash
# Check your .env file has DATABASE_URL configured
# Example: DATABASE_URL="postgresql://user:password@localhost:5432/dbname"

# Test the connection
npx prisma db push
```

### If partners don't show on homepage:
1. Check browser console for errors
2. Open Redux DevTools and verify partners state
3. Ensure partners have `isActive: true` in the database
4. Verify image paths are correct

## Quick Commands Reference

```bash
# Generate Prisma client
npx prisma generate

# Create migration
npx prisma migrate dev --name add_partner_model

# Seed database
npm run db:seed

# Reset database (⚠️ clears all data)
npx prisma migrate reset

# Open Prisma Studio (database GUI)
npx prisma studio
```

## What's Next?

After setup is complete, you can:

1. **Add your own partners** via the admin panel
2. **Upload partner logos** to `/public/images/partners/`
3. **Customize the order** by editing partners
4. **Toggle visibility** using the checkbox

## Need Help?

See the full documentation in `PARTNERS_FEATURE.md` for:
- Detailed feature explanation
- API documentation
- Component architecture
- Best practices
- Advanced troubleshooting
