# Company Information Management Feature

## Overview

This feature adds a comprehensive company information management system to the admin panel. It allows administrators to update all company-related information including logo, slogan, story, milestones, core values, mission, achievements, team information, and social media links.

## What Was Created

### 1. Database Schema
- **Model**: `CompanyInfo` in `prisma/schema.prisma`
- **Fields**:
  - Basic info: `companyName`, `logoUrl`, `slogan`
  - Story section: `storyTitle`, `storyDetail`, `storyImageUrl`, `storyVideoUrl`, `storyItems` (JSON)
  - Milestones: `milestones` (JSON array)
  - Core values: `coreValues` (JSON array - 4 items)
  - Mission: `mission`
  - Achievements: `achievements` (JSON array)
  - Team: `team` (JSON array)
  - Why choose us: `whyChooseUsTitle`, `whyChooseUsDetail`
  - Social media: `facebook`, `zalo`, `youtube`, `tiktok`, `instagram`

### 2. API Endpoints

#### Main CRUD Endpoint
- **GET** `/api/company-info` - Fetch company information
- **PUT** `/api/company-info` - Update company information
- **POST** `/api/company-info` - Create/update company information

#### File Upload Endpoints
- **POST** `/api/company-info/upload-logo` - Upload company logo (max 5MB)
  - Saves to: `/public/images/logo.png`
  - Accepts: JPEG, PNG, WebP
  
- **POST** `/api/company-info/upload-story-image` - Upload story image
  - Saves to: `/public/images/our_story.webp`
  - Accepts: JPEG, PNG, WebP
  - Auto-converts to WebP format
  - Resizes to max 1920px width
  
- **POST** `/api/company-info/upload-story-video` - Upload story video (max 1GB)
  - Saves to: `/public/images/our_story.{extension}`
  - Accepts: Any video format
  - Preserves original extension

### 3. Redux State Management
- **Slice**: `src/lib/features/companyInfo/companyInfoSlice.ts`
- **Actions**:
  - `fetchCompanyInfo` - Load company info from API
  - `updateCompanyInfo` - Save company info to API
  - `uploadLogo` - Upload logo file
  - `uploadStoryImage` - Upload story image
  - `uploadStoryVideo` - Upload story video
  - `updateLocalField` - Update local state

### 4. UI Components
- **Component**: `src/components/CompanyInfoForm.tsx`
- **Features**:
  - Form sections for all company information
  - File upload with preview for logo and story image
  - Video upload with progress indicator
  - Dynamic array management for:
    - Story items (4 items)
    - Milestones (unlimited)
    - Core values (4 items)
    - Achievements (unlimited)
    - Team members (unlimited)
  - Social media links management
  - Real-time validation
  - Save functionality with loading states

### 5. Admin Panel Integration
- **Location**: Admin Settings page → "Thông tin công ty" tab
- **Path**: `/admin/settings` (new tab added)

## Setup Instructions

### Step 1: Generate Prisma Client
```bash
npx prisma generate
```

### Step 2: Create and Apply Migration
```bash
npx prisma migrate dev --name add_company_info_model
```

This will:
- Create a new migration file
- Apply the migration to your database
- Create the `CompanyInfo` table

### Step 3: Restart Development Server
```bash
npm run dev
```

### Step 4: Access the Feature
1. Navigate to `/admin/settings`
2. Click on the "Thông tin công ty" tab
3. Fill in your company information
4. Upload logo, story image, and video as needed
5. Click "Lưu thông tin" to save

## Data Structure

### Story Items (4 items)
```json
[
  {
    "title": "Mục tiêu 1",
    "detail": "Chi tiết mục tiêu 1"
  },
  // ... 3 more items
]
```

### Milestones
```json
[
  {
    "time": "2020",
    "title": "Thành lập",
    "detail": "Công ty được thành lập"
  },
  // ... more milestones
]
```

### Core Values (4 items)
```json
[
  {
    "title": "Giá trị 1",
    "detail": "Mô tả giá trị 1"
  },
  // ... 3 more items
]
```

### Achievements
```json
[
  {
    "title": "Thành tựu 1",
    "detail": "Mô tả thành tựu 1"
  },
  // ... more achievements
]
```

### Team
```json
[
  {
    "amount": "50+",
    "title": "Nhân viên",
    "detail": "Đội ngũ chuyên nghiệp"
  },
  // ... more team items
]
```

## File Upload Specifications

### Logo Upload
- **Max size**: 5MB
- **Formats**: JPEG, PNG, WebP
- **Save location**: `/public/images/logo.png`
- **Note**: Overwrites existing logo

### Story Image Upload
- **Max size**: 10MB (before conversion)
- **Formats**: JPEG, PNG, WebP
- **Save location**: `/public/images/our_story.webp`
- **Processing**: Auto-converts to WebP, resizes to max 1920px width
- **Note**: Overwrites existing image

### Story Video Upload
- **Max size**: 1GB
- **Formats**: Any video format
- **Save location**: `/public/images/our_story.{extension}`
- **Note**: Preserves original extension, overwrites existing video

## Usage in Frontend

To use the company information in your frontend pages:

```typescript
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { fetchCompanyInfo } from "@/lib/features/companyInfo/companyInfoSlice";

function MyComponent() {
  const dispatch = useAppDispatch();
  const { data: companyInfo } = useAppSelector((state) => state.companyInfo);

  useEffect(() => {
    dispatch(fetchCompanyInfo());
  }, [dispatch]);

  return (
    <div>
      <h1>{companyInfo?.companyName}</h1>
      <img src={companyInfo?.logoUrl} alt="Logo" />
      <p>{companyInfo?.slogan}</p>
      {/* Use other fields as needed */}
    </div>
  );
}
```

## API Usage Examples

### Fetch Company Info
```javascript
const response = await fetch('/api/company-info');
const data = await response.json();
```

### Update Company Info
```javascript
const response = await fetch('/api/company-info', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    companyName: 'New Company Name',
    slogan: 'New Slogan',
    // ... other fields
  })
});
```

### Upload Logo
```javascript
const formData = new FormData();
formData.append('logo', file);

const response = await fetch('/api/company-info/upload-logo', {
  method: 'POST',
  body: formData
});
```

## Notes

- The system automatically creates a default company info record if none exists
- All JSON fields are optional and can be null
- File uploads are validated for size and type
- Images are automatically optimized to WebP format
- Videos preserve their original format
- The form provides real-time feedback for all operations
- All changes require clicking "Lưu thông tin" to persist to the database

## Troubleshooting

### Migration Issues
If you encounter migration issues:
```bash
# Reset database (WARNING: This will delete all data)
npx prisma migrate reset

# Or create a new migration
npx prisma migrate dev
```

### Upload Issues
- Ensure the `/public/images` directory exists and is writable
- Check file size limits in your server configuration
- Verify file types are correct

### Redux Issues
- Make sure the Redux store is properly configured
- Check that the companyInfo reducer is added to the store
- Verify the Redux DevTools for state changes

## Future Enhancements

Potential improvements:
- Multi-language support for company information
- Image gallery for company photos
- Document uploads (certificates, awards)
- Timeline visualization for milestones
- Team member photos and profiles
- Video preview in the form
- Drag-and-drop reordering for array items
- Bulk import/export functionality
