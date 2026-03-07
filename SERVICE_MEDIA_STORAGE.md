# Service Media Storage Feature

## Overview

Images and videos uploaded via the `divt-text-editor` in the service add/edit forms are now properly tracked in the database and automatically cleaned up when services are deleted.

## Features

✅ **Automatic Storage Tracking** - All uploaded media files are recorded in `StorageMedia` table  
✅ **Proper File Naming** - Images: `service_{timestamp}.webp`, Videos: `service_{timestamp}.{ext}`  
✅ **Organized Storage** - Images in `/public/images/services/`, Videos in `/public/videos/services/`  
✅ **Automatic Cleanup** - Files are deleted when the parent service is deleted  
✅ **Database Tracking** - Records linked with `parentId=service.id` and `parentType="service-text-editor"`  

## Implementation Details

### 1. File Upload (via divt-text-editor)

**Endpoint:** `POST /api/services/upload-editor`

**Query Parameter:**
- `serviceId` - The ID of the service (or `0` for new services)

**File Storage:**

**Images:**
- **Location:** `/public/images/services/`
- **Naming:** `service_{timestamp}.webp`
- **Processing:** Converted to WebP, resized to max 1200px width
- **Quality:** 85%
- **Max Size:** 10MB

**Videos:**
- **Location:** `/public/videos/services/`
- **Naming:** `service_{timestamp}.{extension}`
- **Processing:** Saved as-is (no conversion)
- **Max Size:** 100MB
- **Supported Formats:** MP4, WebM, OGG, MOV

**Database Record:**
```typescript
{
  parentId: serviceId || null,  // null for new services
  type: 'image' | 'video',
  parentType: 'service-text-editor',
  path: 'public/images/services/service_1234567890.webp'
}
```

### 2. Service Deletion

**Endpoint:** `DELETE /api/services/[id]`

**Cleanup Process:**

1. Fetch service data (including main image URL)
2. Fetch all `StorageMedia` records where:
   - `parentType = 'service-text-editor'`
   - `parentId = service.id`
3. Delete service from database
4. Delete main service image file (if exists)
5. Delete all `StorageMedia` records
6. Delete all associated media files from storage

**Example Flow:**
```
Service ID: 5
Main Image: /images/service_main_123.webp

StorageMedia Records:
- /images/services/service_1234567890.webp (from description)
- /videos/services/service_1234567891.mp4 (from description)
- /images/services/service_1234567892.webp (from description)

Deletion Process:
1. Delete Service #5 from database
2. Delete /images/service_main_123.webp
3. Delete StorageMedia records (3 records)
4. Delete /images/services/service_1234567890.webp
5. Delete /videos/services/service_1234567891.mp4
6. Delete /images/services/service_1234567892.webp
```

## File Structure

```
public/
├── images/
│   └── services/
│       ├── service_1709712345678.webp
│       ├── service_1709712456789.webp
│       └── ...
└── videos/
    └── services/
        ├── service_1709712567890.mp4
        ├── service_1709712678901.webm
        └── ...
```

## Database Schema

### StorageMedia Table

```prisma
model StorageMedia {
  id         Int      @id @default(autoincrement())
  parentId   Int?
  type       String   // 'image' or 'video'
  parentType String   // 'service-text-editor'
  path       String   // 'public/images/services/service_123.webp'
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@index([parentId, parentType])
  @@index([parentType])
}
```

## Usage in RichTextEditor

The `RichTextEditor` component automatically uses the correct upload endpoint based on the `serviceId` prop:

```tsx
<RichTextEditor
  value={service.description || ''}
  onChange={(value) =>
    dispatch(
      updateLocalService({
        ...service,
        description: value,
      })
    )
  }
  placeholder="Mô tả chi tiết về dịch vụ"
  className="border border-gray-300 rounded-lg"
  serviceId={service.id === 0 ? undefined : service.id}
/>
```

**Upload Endpoint Resolution:**
- If `serviceId` is provided: `/api/services/upload-editor?serviceId={id}`
- If `serviceId` is `undefined` (new service): `/api/services/upload-editor?serviceId=0`

## Handling New Services

When creating a new service (ID = 0):

1. User uploads images/videos via editor
2. Files are saved with `parentId = null`
3. `StorageMedia` records created with `parentId = null`
4. After service is created, records should be updated with actual `parentId`

**Note:** Currently, orphaned records (parentId = null) are not automatically linked. This is a known limitation that can be addressed in future updates.

## API Response Format

**Success Response:**
```json
{
  "url": "/images/services/service_1234567890.webp",
  "success": true,
  "imageUrl": "/images/services/service_1234567890.webp",
  "filename": "service_1234567890.webp",
  "type": "image"
}
```

**Error Response:**
```json
{
  "error": "File size exceeds 10MB limit"
}
```

## Error Handling

### Upload Errors
- **No file provided:** Returns 400 with available form data keys for debugging
- **Invalid file type:** Returns 400 with received file type
- **File too large:** Returns 400 with size limit message
- **Database error:** Logs error but continues (file is already uploaded)

### Deletion Errors
- **Service not found:** Returns 404
- **File deletion failure:** Logs error but continues (doesn't fail the operation)
- **Database error:** Returns 500

## Security Considerations

1. **File Type Validation** - Only allowed image and video formats
2. **File Size Limits** - Prevents large file uploads
3. **Path Sanitization** - Prevents directory traversal attacks
4. **Database Validation** - Validates serviceId before processing

## Testing

### Test Upload
1. Go to `/admin/services`
2. Click "Thêm Dịch vụ" or edit existing service
3. In the description field (RichTextEditor):
   - Click image upload button
   - Select an image file
   - Verify it uploads and displays
   - Click video upload button
   - Select a video file
   - Verify it uploads and displays
4. Save the service
5. Check database for `StorageMedia` records
6. Check file system for uploaded files

### Test Deletion
1. Create a service with uploaded images/videos in description
2. Note the file paths from `StorageMedia` table
3. Delete the service
4. Verify:
   - Service is deleted from database
   - `StorageMedia` records are deleted
   - Files are deleted from file system

## Comparison with Other Entities

| Entity | Upload Endpoint | Storage Path | ParentType |
|--------|----------------|--------------|------------|
| **Services** | `/api/services/upload-editor` | `/images/services/` or `/videos/services/` | `service-text-editor` |
| **News** | `/api/news/upload-editor` | `/images/news/` or `/videos/news/` | `news-text-editor` |
| **Projects** | `/api/projects/upload-editor` | `/images/projects/` or `/videos/projects/` | `project-text-editor` |
| **Products** | `/api/upload` | `/images/products/` | N/A (no StorageMedia) |

## Future Improvements

- [ ] Automatically link orphaned media when service is created
- [ ] Add cleanup job for orphaned media (parentId = null)
- [ ] Add media usage statistics in admin panel
- [ ] Implement media library for reusing uploaded files
- [ ] Add image optimization options (quality, size)
- [ ] Support for additional video formats
- [ ] Thumbnail generation for videos
- [ ] Progress bar for large file uploads

## Related Files

- `src/app/api/services/upload-editor/route.ts` - Upload endpoint
- `src/app/api/services/[id]/route.ts` - Service CRUD operations
- `src/components/RichTextEditor.tsx` - Editor component
- `src/lib/imageUtils.ts` - File deletion utilities
- `prisma/schema.prisma` - Database schema
- `src/app/(admin)/admin/services/page.tsx` - Admin UI

## Summary

The service media storage feature ensures that all images and videos uploaded through the rich text editor are:

✅ **Properly stored** with consistent naming convention  
✅ **Tracked in database** for easy management  
✅ **Automatically cleaned up** when services are deleted  
✅ **Organized** in dedicated directories  
✅ **Optimized** (images converted to WebP)  

This prevents storage bloat and ensures a clean, maintainable system!
