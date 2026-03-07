# Office Management Feature

## Overview
This document describes the Office Management feature that allows administrators to manage company branch offices through the admin panel.

## Features Implemented

### 1. Database Model
Added `Office` model to Prisma schema with the following fields:
- `id` (Int, auto-increment, primary key)
- `name` (String) - Tên chi nhánh
- `phone` (String) - Số điện thoại
- `email` (String) - Email
- `address` (String) - Địa chỉ
- `workingTime` (String) - Giờ làm việc
- `googleMapEmbedUrl` (String, optional) - Đường dẫn Google Map
- `isMainOffice` (Boolean, default: false) - Chi nhánh chính
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

### 2. Redux State Management
Created Redux slice (`officesSlice.ts`) with:
- State management for offices list
- CRUD operations (Create, Read, Update, Delete)
- Pagination support
- Search functionality
- Loading and error states

### 3. API Routes
Implemented RESTful API endpoints:

#### GET `/api/offices`
- Get all offices with pagination
- Query parameters:
  - `page` (default: 1)
  - `limit` (default: 10)
  - `search` (optional) - Search by name, address, phone, or email
- Returns: List of offices with pagination metadata

#### POST `/api/offices`
- Create a new office
- Validates required fields and email format
- Automatically unsets other main offices if `isMainOffice` is true
- Returns: Created office object

#### GET `/api/offices/[id]`
- Get a single office by ID
- Returns: Office object

#### PUT `/api/offices/[id]`
- Update an existing office
- Validates email format
- Handles main office logic
- Returns: Updated office object

#### DELETE `/api/offices/[id]`
- Delete an office by ID
- Returns: Success message

### 4. Admin UI Page
Created admin page at `/admin/office` with:
- List view of all offices
- Search functionality
- Add new office button
- Inline editing for each office
- Delete confirmation
- Form validation
- Responsive design
- Icons for better UX:
  - Building icon for office name
  - Map pin for address
  - Phone icon for phone number
  - Envelope for email
  - Clock for working time
  - Map icon for Google Maps link

### 5. Navigation Integration
- Added "Chi nhánh" menu item to admin sidebar
- Added quick action card on admin dashboard
- Used `BuildingOfficeIcon` from Heroicons

## Usage

### Accessing the Feature
1. Navigate to the admin panel: `/admin`
2. Click on "Chi nhánh" in the sidebar
3. Or click the "Quản lý chi nhánh" quick action card

### Creating a New Office
1. Click "Thêm Chi nhánh" button
2. Fill in the required fields:
   - Tên chi nhánh (Name)
   - Số điện thoại (Phone)
   - Email
   - Địa chỉ (Address)
   - Giờ làm việc (Working Time)
3. Optionally:
   - Add Google Maps embed URL
   - Mark as main office
4. Click "Lưu" to save

### Editing an Office
1. Click the pencil icon on any office card
2. Modify the fields as needed
3. Click "Lưu" to save changes
4. Click "Hủy" to cancel

### Deleting an Office
1. Click the trash icon on any office card
2. Confirm the deletion in the popup
3. Office will be permanently deleted

### Searching Offices
1. Use the search bar at the top
2. Search works across:
   - Office name
   - Address
   - Phone number
   - Email
3. Results update automatically

## Technical Details

### File Structure
```
src/
├── lib/
│   ├── features/
│   │   └── offices/
│   │       └── officesSlice.ts
│   └── store.ts (updated)
├── app/
│   ├── api/
│   │   └── offices/
│   │       ├── route.ts
│   │       └── [id]/
│   │           └── route.ts
│   └── (admin)/
│       ├── layout.tsx (updated)
│       └── admin/
│           ├── page.tsx (updated)
│           └── office/
│               └── page.tsx
└── prisma/
    └── schema.prisma (updated)
```

### Database Migration
The database schema was updated using:
```bash
npx prisma db push
npx prisma generate
```

### Validation Rules
- **Name**: Required
- **Phone**: Required
- **Email**: Required, must be valid email format
- **Address**: Required
- **Working Time**: Required
- **Google Map URL**: Optional
- **Is Main Office**: Only one office can be marked as main office at a time

### Main Office Logic
When an office is set as the main office:
1. All other offices are automatically unmarked as main office
2. This ensures only one main office exists at any time
3. The logic is handled both on create and update operations

## Future Enhancements
Potential improvements for this feature:
1. Add office images/photos
2. Multiple contact persons per office
3. Office hours with day-specific schedules
4. Integration with contact form to route to specific offices
5. Display offices on a public-facing "Locations" page
6. Add office capacity/size information
7. Office services/specializations
8. Multi-language support for office information

## Notes
- All offices are sorted with main office first, then by creation date
- Search is case-insensitive
- Pagination is set to 10 items per page by default
- The feature uses the same design patterns as other admin features for consistency
