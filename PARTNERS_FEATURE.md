# Partners Management Feature

## Overview

Added a comprehensive Partners management system to the admin settings page. This feature allows administrators to manage partner logos displayed in the "OurPartners" section on the homepage.

## What Was Added

### 1. Database Schema

Added a new `Partner` model to Prisma schema:

```prisma
model Partner {
  id        Int      @id @default(autoincrement())
  name      String
  image     String
  order     Int      @default(0)
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Fields:**
- `id`: Auto-incrementing primary key
- `name`: Partner name (used as alt text for images)
- `image`: URL/path to partner logo image
- `order`: Display order (lower numbers appear first)
- `isActive`: Whether the partner is visible on the homepage
- `createdAt`: Timestamp when created
- `updatedAt`: Timestamp when last updated

### 2. API Routes

Created RESTful API endpoints for partner management:

#### `GET /api/partners`
- Fetches all partners
- Query params:
  - `isActive`: Filter by active status (true/false)
  - `orderBy`: Sort field (order, id, createdAt, updatedAt, name)
- Returns: Array of partner objects

#### `POST /api/partners`
- Creates a new partner
- Required fields: `name`, `image`
- Optional fields: `order`, `isActive`
- Returns: Created partner object

#### `PUT /api/partners/[id]`
- Updates an existing partner
- All fields are optional
- Returns: Updated partner object

#### `DELETE /api/partners/[id]`
- Deletes a partner
- Returns: Success status

### 3. Redux State Management

Created a new Redux slice for partners (`src/lib/features/partners/partnersSlice.ts`):

**State:**
```typescript
{
  partners: Partner[],
  loading: boolean,
  error: string | null,
  editingPartnerId: number | null
}
```

**Async Thunks:**
- `fetchPartners()` - Fetch all partners
- `createPartner(partner)` - Create new partner
- `updatePartner({ id, partner })` - Update partner
- `deletePartner(id)` - Delete partner

**Sync Actions:**
- `setEditingPartner(id)` - Set editing state
- `addNewPartner()` - Add temporary partner
- `updateLocalPartner(partner)` - Update locally
- `clearError()` - Clear error state

### 4. Admin Interface

Added a new "Đối tác" (Partners) tab to the admin settings page with:

- **Grid layout** displaying partner cards (3 columns on large screens)
- **Add Partner button** to create new partners
- **Inline editing** - click edit to modify partner details
- **Form fields:**
  - Partner name (text input)
  - Image URL (text input)
  - Active/Inactive toggle (checkbox)
- **Actions:**
  - Edit button (pencil icon)
  - Delete button (trash icon)
  - Save/Cancel buttons when editing

### 5. Updated OurPartners Component

Modified the homepage `OurPartners` component to:
- Fetch partners from the database via Redux
- Display only active partners (`isActive: true`)
- Show loading state while fetching
- Show empty state if no partners exist
- Maintain the carousel/slider functionality
- Use partner `name` as image alt text for accessibility

## Setup Instructions

### 1. Generate Prisma Client

After pulling these changes, regenerate the Prisma client:

```bash
npm run db:generate
```

Or:

```bash
npx prisma generate
```

### 2. Run Database Migration

Create and apply the migration for the new Partner model:

```bash
npx prisma migrate dev --name add_partner_model
```

This will:
- Create a new migration file
- Apply the migration to your database
- Create the `Partner` table

### 3. Seed Initial Data (Optional)

The seed file has been updated to include sample partners. Run:

```bash
npm run db:seed
```

Or:

```bash
npx prisma db seed
```

This will populate the database with 7 sample partners using the existing partner images.

### 4. Restart Development Server

Restart your Next.js development server to pick up the changes:

```bash
npm run dev
```

## Usage Guide

### Accessing the Partners Admin

1. Navigate to `/admin/settings`
2. Click on the "Đối tác" tab
3. You'll see a grid of all partners

### Adding a New Partner

1. Click "Thêm Đối tác" button
2. A new partner card will appear in edit mode
3. Fill in:
   - **Tên đối tác**: Partner name (e.g., "Vinamilk")
   - **URL hình ảnh**: Image path (e.g., "/images/partners/vinamilk.png")
   - **Hiển thị**: Check to make it visible on homepage
4. Click "Lưu" to save or "Hủy" to cancel

### Editing a Partner

1. Click the pencil icon on any partner card
2. Modify the fields as needed
3. Click "Lưu" to save changes

### Deleting a Partner

1. Click the trash icon on any partner card
2. Confirm the deletion in the popup dialog
3. The partner will be removed from the database

### Managing Visibility

- Use the "Hiển thị" checkbox to control whether a partner appears on the homepage
- Inactive partners are hidden from the public OurPartners section
- You can keep partners in the database without displaying them

## Technical Details

### File Structure

```
src/
├── app/
│   ├── api/
│   │   └── partners/
│   │       ├── route.ts              # GET, POST endpoints
│   │       └── [id]/
│   │           └── route.ts          # PUT, DELETE endpoints
│   └── (admin)/
│       └── admin/
│           └── settings/
│               └── page.tsx          # Admin UI with Partners tab
├── components/
│   └── OurPartners.tsx              # Homepage partners section
└── lib/
    ├── features/
    │   └── partners/
    │       └── partnersSlice.ts     # Redux slice
    └── store.ts                     # Updated to include partners reducer

prisma/
├── schema.prisma                    # Updated with Partner model
└── seed.ts                          # Updated with partner seeds
```

### Redux Integration

The partners reducer is integrated into the main Redux store:

```typescript
// src/lib/store.ts
import partnersReducer from './features/partners/partnersSlice';

export const makeStore = () => {
  return configureStore({
    reducer: {
      banners: bannersReducer,
      introduction: introductionReducer,
      database: databaseReducer,
      partners: partnersReducer, // ← Added
    },
  });
};
```

### Component Integration

The OurPartners component now uses Redux hooks:

```typescript
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { fetchPartners } from "@/lib/features/partners/partnersSlice";

const dispatch = useAppDispatch();
const { partners, loading } = useAppSelector((state) => state.partners);

useEffect(() => {
  dispatch(fetchPartners());
}, [dispatch]);
```

## Features

✅ Full CRUD operations (Create, Read, Update, Delete)  
✅ Real-time updates via Redux state management  
✅ Optimistic UI updates  
✅ Error handling with user-friendly messages  
✅ Loading states  
✅ Active/Inactive toggle for visibility control  
✅ Order management (partners are sorted by order field)  
✅ Responsive grid layout (1/2/3 columns based on screen size)  
✅ Image preview in admin cards  
✅ Confirmation dialog before deletion  
✅ Inline editing with save/cancel actions  

## Best Practices

1. **Image Management**: Store partner logos in `/public/images/partners/` directory
2. **Image Naming**: Use descriptive, lowercase names with hyphens (e.g., `partner-name-logo.png`)
3. **Image Format**: Use WebP for best performance, with PNG/JPG fallbacks
4. **Image Size**: Optimize images to ~120x60px for best display
5. **Alt Text**: Always provide descriptive partner names for accessibility
6. **Order**: Use incremental numbers (0, 1, 2, 3...) for logical ordering

## Troubleshooting

### Partners not showing on homepage

1. Check if partners are marked as active (`isActive: true`)
2. Verify the image paths are correct
3. Check browser console for image loading errors
4. Ensure the database has been seeded or partners have been added

### Database errors

1. Make sure you ran `npx prisma generate` after schema changes
2. Verify database connection in `.env` file
3. Check if migration was applied: `npx prisma migrate status`
4. Try resetting: `npx prisma migrate reset` (⚠️ will clear all data)

### Redux state not updating

1. Check browser Redux DevTools for state changes
2. Verify API endpoints are responding correctly
3. Check browser console for error messages
4. Ensure the component is wrapped in Redux Provider

## Future Enhancements

Potential improvements for this feature:

- [ ] Image upload functionality (instead of manual URL entry)
- [ ] Drag-and-drop reordering
- [ ] Bulk operations (activate/deactivate multiple partners)
- [ ] Partner categories or tags
- [ ] Analytics (track partner logo clicks)
- [ ] Link to partner website
- [ ] Partner description field
- [ ] Image validation and optimization
- [ ] Search and filter in admin interface

## Support

For issues or questions about this feature, please check:
1. This documentation
2. Redux DevTools for state inspection
3. Browser console for errors
4. Database logs for query issues
