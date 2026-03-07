# Service Rich Text Editor Enhancement

## Overview
Enhanced the add/edit service functionality by integrating the `divt-text-editor` rich text editor for the "Mô tả" (description) field. This allows administrators to create rich, formatted content with images and videos in service descriptions.

## Changes Made

### 1. Created Upload Endpoint for Service Editor
**File:** `src/app/api/services/upload-editor/route.ts`

- New API endpoint to handle image and video uploads from the rich text editor
- Supports both images (JPEG, PNG, WebP, GIF) and videos (MP4, WebM, OGG)
- Automatically converts images to WebP format for optimization
- File size limits: 10MB for images, 50MB for videos
- Files are stored in `/public/uploads/services/editor/`
- Returns response in format expected by divt-text-editor: `{ success, url, message }`

### 2. Updated Prisma Schema
**File:** `prisma/schema.prisma`

- Added comment to `Service.description` field indicating it's edited by divt-text-editor
- No database migration needed as the field type (String?) already supports HTML content

```prisma
model Service {
  id          Int      @id @default(autoincrement())
  title       String
  description String?  // Rich text content edited by divt-text-editor
  // ... other fields
}
```

### 3. Enhanced RichTextEditor Component
**File:** `src/components/RichTextEditor.tsx`

- Added `serviceId` parameter to support service-specific uploads
- Upload endpoint routing logic now includes service context:
  - `/api/services/upload-editor?serviceId={id}` for services
  - Existing endpoints for news, projects, and products remain unchanged

### 4. Updated Admin Services Page
**File:** `src/app/(admin)/admin/services/page.tsx`

**Changes:**
- Imported `RichTextEditor` component
- Replaced textarea with `RichTextEditor` for the description field
- Passes `serviceId` to the editor (undefined for new services)
- Updated display view to render HTML content using `dangerouslySetInnerHTML`
- Added Tailwind prose classes for proper HTML styling

**Edit Mode:**
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

**Display Mode:**
```tsx
<div className="text-sm text-gray-600 mb-2">
  <strong>Mô tả:</strong>
  <div 
    className="mt-1 prose prose-sm max-w-none"
    dangerouslySetInnerHTML={{ __html: service.description }}
  />
</div>
```

### 5. Updated Service Display Components

#### ServiceDetailContent Component
**File:** `src/components/ServiceDetailContent.tsx`

- Updated hero section to render HTML description with prose styling
- Updated overview tab to render HTML description with prose styling
- Uses `prose` and `prose-invert` classes for proper formatting

#### ServiceCard Component
**File:** `src/components/ServiceCard.tsx`

- Added `stripHtml()` helper function to remove HTML tags for preview text
- Ensures clean text display in card listings with `line-clamp-3`
- Prevents HTML tags from appearing in truncated preview text

## API Routes (No Changes Needed)

The existing service API routes already properly handle the description field:
- `POST /api/services` - Create service
- `PUT /api/services/[id]` - Update service
- `GET /api/services` - List services (with search support)
- `GET /api/services/[id]` - Get single service

## Features

### Rich Text Editing
- ✅ Bold, italic, underline, strikethrough
- ✅ Headings (H1-H6)
- ✅ Lists (ordered and unordered)
- ✅ Links
- ✅ Images (with upload)
- ✅ Videos (with upload)
- ✅ Code blocks
- ✅ Blockquotes
- ✅ Text alignment
- ✅ Text and background colors

### Image Upload
- Automatic conversion to WebP format
- 10MB file size limit
- Supported formats: JPEG, PNG, WebP, GIF
- Files stored in `/public/uploads/services/editor/`

### Video Upload
- 50MB file size limit
- Supported formats: MP4, WebM, OGG
- Direct upload without conversion

### HTML Rendering
- Proper styling with Tailwind Typography (prose classes)
- Safe HTML rendering with `dangerouslySetInnerHTML`
- Responsive design
- Clean preview text in card listings

## Usage

### Admin Panel
1. Navigate to Admin → Services
2. Click "Thêm Dịch vụ" or edit existing service
3. Use the rich text editor in the "Mô tả" field
4. Add formatted text, images, and videos
5. Save the service

### Frontend Display
- Service cards show plain text preview (HTML stripped)
- Service detail page shows full rich text content with formatting
- Hero section displays formatted description
- Overview tab shows complete formatted content

## File Structure

```
src/
├── app/
│   ├── (admin)/
│   │   └── admin/
│   │       └── services/
│   │           └── page.tsx                    # Updated with RichTextEditor
│   └── api/
│       └── services/
│           ├── route.ts                        # No changes needed
│           ├── [id]/
│           │   └── route.ts                    # No changes needed
│           └── upload-editor/
│               └── route.ts                    # NEW - Upload endpoint
├── components/
│   ├── RichTextEditor.tsx                      # Updated with serviceId support
│   ├── ServiceCard.tsx                         # Updated with HTML stripping
│   └── ServiceDetailContent.tsx                # Updated with HTML rendering
└── prisma/
    └── schema.prisma                           # Updated with comment

public/
└── uploads/
    └── services/
        └── editor/                             # NEW - Upload directory
            └── service-editor-{id}-{timestamp}-{random}.webp
```

## Technical Notes

### Security Considerations
- File type validation on upload
- File size limits enforced
- Images converted to WebP format
- HTML content sanitized by divt-text-editor
- Using `dangerouslySetInnerHTML` is safe as content comes from admin panel

### Performance
- Images automatically optimized to WebP format
- Lazy loading for images in rich content
- Efficient HTML rendering with React

### Browser Compatibility
- Rich text editor works in all modern browsers
- WebP format supported in all modern browsers
- Fallback text display for cards

## Testing Checklist

- [x] Create new service with rich text description
- [x] Edit existing service description
- [x] Upload images in description
- [x] Upload videos in description
- [x] View service in admin panel (display mode)
- [x] View service card on frontend
- [x] View service detail page on frontend
- [x] Search services by description content
- [x] Verify file uploads are stored correctly
- [x] Verify HTML rendering is correct
- [x] Verify preview text strips HTML tags

## Related Documentation

- [divt-text-editor GitHub](https://github.com/votuandi/divt-text-editor)
- [Tailwind Typography](https://tailwindcss.com/docs/typography-plugin)
- [BUGFIX_DIVT_TEXT_EDITOR_UPLOAD.md](./BUGFIX_DIVT_TEXT_EDITOR_UPLOAD.md)
- [VIDEO_UPLOAD_FEATURE.md](./VIDEO_UPLOAD_FEATURE.md)

## Future Enhancements

- [ ] Add image gallery support
- [ ] Add table support in editor
- [ ] Add embed support (YouTube, etc.)
- [ ] Add draft/publish workflow
- [ ] Add version history
- [ ] Add content templates
