# Admin Project Management - Setup Complete

## Overview
Successfully created a complete CRUD admin interface for managing projects at `/admin/projects`. The implementation follows the same pattern as the existing news management system.

## What Was Created

### 1. Database Schema (Prisma)
**File:** `prisma/schema.prisma`

Added new `Project` model with the following fields:
- `id` - Auto-incrementing primary key
- `title` - Project title (required)
- `location` - Project location (optional)
- `capacity` - Power capacity (e.g., "500kW")
- `completedDate` - Completion date string (e.g., "Tháng 12, 2023")
- `imageUrl` - Main project image
- `description` - Short description
- `detail` - Rich text content (edited by divt-text-editor) ⭐
- `category` - Project category (default: "Công nghiệp")
- `client` - Client name
- `isDisplay` - Boolean to show/hide project ⭐
- `showInHomepage` - Boolean to display on homepage ⭐
- `order` - Display order (for sorting)
- `createdAt`, `updatedAt` - Timestamps

### 2. API Routes

#### Main Projects Route
**File:** `src/app/api/projects/route.ts`
- `GET /api/projects` - List projects with pagination, search, and filters
- `POST /api/projects` - Create new project

#### Individual Project Route
**File:** `src/app/api/projects/[id]/route.ts`
- `GET /api/projects/[id]` - Get single project
- `PUT /api/projects/[id]` - Update project
- `DELETE /api/projects/[id]` - Delete project (also cleans up media files)

#### Upload Endpoints
**File:** `src/app/api/projects/upload/route.ts`
- Upload main project images
- Auto-converts to WebP format
- Validates file type and size (10MB limit)

**File:** `src/app/api/projects/upload-editor/route.ts`
- Upload images/videos for rich text editor
- Supports both images (10MB) and videos (100MB)
- Tracks media in `StorageMedia` table
- Auto-associates with project after creation

### 3. Redux State Management
**File:** `src/lib/features/projects/projectsSlice.ts`

Created Redux slice with:
- State management for projects list
- Async thunks for all CRUD operations
- Local state updates for editing
- Pagination support
- Error handling

**Updated:** `src/lib/store.ts`
- Registered `projectsReducer` in the store

### 4. Admin UI Page
**File:** `src/app/(admin)/admin/projects/page.tsx`

Full-featured admin interface with:
- ✅ List view with pagination
- ✅ Search functionality (title, location, client, description)
- ✅ Category filter
- ✅ Inline editing
- ✅ Image upload with preview
- ✅ Rich text editor for `detail` field (divt-text-editor)
- ✅ Toggle for `isDisplay` (show/hide project)
- ✅ Toggle for `showInHomepage` (display on homepage)
- ✅ Order field for sorting
- ✅ Delete with confirmation
- ✅ Responsive design

### 5. Rich Text Editor Support
**Updated:** `src/components/RichTextEditor.tsx`
- Added `projectId` prop support
- Routes uploads to `/api/projects/upload-editor?projectId={id}`
- Maintains existing support for `newsId` and `productId`

### 6. Navigation Updates
**Updated:** `src/app/(admin)/layout.tsx`
- Added "Dự án" link to admin sidebar
- Icon: BriefcaseIcon

**Updated:** `src/app/(admin)/admin/page.tsx`
- Added project statistics card
- Added quick action link to projects management

## Sample Data Structure

Based on `src/components/ProjectsSection.tsx`, here's a sample project:

```javascript
{
  title: "Hệ thống điện mặt trời nhà máy ABC",
  location: "Bình Dương",
  capacity: "500kW",
  completedDate: "Tháng 12, 2023",
  imageUrl: "/images/projects/project_1234567890.webp",
  description: "Hệ thống điện mặt trời quy mô lớn cho nhà máy sản xuất, giúp tiết kiệm 70% chi phí điện năng hàng năm.",
  detail: "<p>Chi tiết đầy đủ về dự án với hình ảnh và video...</p>",
  category: "Công nghiệp",
  client: "Công ty ABC Manufacturing",
  isDisplay: true,
  showInHomepage: true,
  order: 0
}
```

## Categories (from sample data)
- Công nghiệp
- Dân dụng
- Thương mại
- Giáo dục
- Du lịch

## How to Use

### 1. Access Admin Panel
Navigate to: `http://localhost:3000/admin/projects`

### 2. Create New Project
1. Click "Thêm Dự án" button
2. Fill in required fields (at minimum: title)
3. Upload main image (optional)
4. Use rich text editor for detailed content
5. Set `isDisplay` to show project
6. Set `showInHomepage` to display on homepage
7. Click "Lưu" to save

### 3. Edit Existing Project
1. Click the pencil icon on any project
2. Modify fields as needed
3. Click "Lưu" to save changes
4. Click "Hủy" to cancel

### 4. Delete Project
1. Click the trash icon
2. Confirm deletion
3. Project and associated media files will be removed

### 5. Search & Filter
- Use search bar to find projects by title, location, client, or description
- Use category dropdown to filter by category
- Click "Xóa bộ lọc" to clear all filters

## API Query Parameters

### GET /api/projects
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `search` - Search query (searches title, description, location, client)
- `category` - Filter by category
- `isDisplay` - Filter by display status (true/false)
- `showInHomepage` - Filter by homepage display (true/false)
- `orderBy` - Sort field (id, title, order, completedDate, createdAt, updatedAt)
- `order` - Sort direction (asc/desc)

Example:
```
GET /api/projects?page=1&limit=10&category=Công%20nghiệp&isDisplay=true&orderBy=order&order=asc
```

## Database Migration

The database schema has been updated using:
```bash
npx prisma db push
npx prisma generate
```

If you need to reset the database:
```bash
npx prisma migrate reset --force
```

## File Structure
```
src/
├── app/
│   ├── (admin)/
│   │   ├── admin/
│   │   │   ├── projects/
│   │   │   │   └── page.tsx          # Admin UI
│   │   │   └── page.tsx               # Dashboard (updated)
│   │   └── layout.tsx                 # Sidebar nav (updated)
│   └── api/
│       └── projects/
│           ├── route.ts               # List & Create
│           ├── [id]/
│           │   └── route.ts           # Get, Update, Delete
│           ├── upload/
│           │   └── route.ts           # Main image upload
│           └── upload-editor/
│               └── route.ts           # Editor media upload
├── lib/
│   └── features/
│       └── projects/
│           └── projectsSlice.ts       # Redux state
└── components/
    └── RichTextEditor.tsx             # Updated for projects

prisma/
└── schema.prisma                      # Updated with Project model
```

## Features Implemented ✅

All requested features have been implemented:

1. ✅ **CRUD Operations** - Create, Read, Update, Delete projects
2. ✅ **Detail Field** - Rich text editor using divt-text-editor
3. ✅ **isDisplay** - Boolean field to show/hide projects
4. ✅ **showInHomepage** - Boolean field to display on homepage
5. ✅ Search and filtering
6. ✅ Pagination
7. ✅ Image upload with WebP conversion
8. ✅ Media management for editor content
9. ✅ Responsive design
10. ✅ Navigation integration

## Next Steps

To use projects on the frontend:
1. Update `src/components/ProjectsSection.tsx` to fetch from API instead of using hardcoded data
2. Add filtering by `isDisplay` and `showInHomepage`
3. Create project detail pages if needed
4. Add sorting by `order` field

Example API call for homepage:
```javascript
fetch('/api/projects?isDisplay=true&showInHomepage=true&orderBy=order&order=asc&limit=6')
```

## Notes

- All images are automatically converted to WebP format for optimization
- Media files uploaded through the editor are tracked in `StorageMedia` table
- Deleting a project also removes associated media records
- The rich text editor supports both images and videos
- The system follows the same patterns as the existing news management for consistency
