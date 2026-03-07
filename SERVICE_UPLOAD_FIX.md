# Service Upload Path Fix

## Issue
Service images and videos uploaded via the rich text editor (divt-text-editor) in the create service form were being saved to the wrong paths:
- Images were saved to: `public/images/products/product_{time}.webp` ❌
- Videos were saved to: `public/videos/products/` ❌

## Required Paths
- Images should be saved to: `public/images/services/service_{time}.webp` ✅
- Videos should be saved to: `public/videos/services/` ✅

## Root Cause
When creating a new service (with `id = 0`), the `RichTextEditor` component was receiving `serviceId={undefined}` instead of `serviceId={0}`. This caused it to fall back to the default `/api/upload` endpoint, which was configured for products and saved files to the product directories.

## Solution

### 1. Updated Services Admin Page
**File**: `src/app/(admin)/admin/services/page.tsx`

Changed the `RichTextEditor` component to always pass the `serviceId`, even when it's `0`:

```typescript
// Before
<RichTextEditor
  serviceId={service.id === 0 ? undefined : service.id}
/>

// After
<RichTextEditor
  serviceId={service.id}
/>
```

### 2. Updated RichTextEditor Component
**File**: `src/components/RichTextEditor.tsx`

Added a comment to clarify that `serviceId={0}` is valid for new services:

```typescript
} else if (serviceId !== undefined) {
  // For service editor - use service-specific upload endpoint
  // Pass serviceId even if it's 0 (for new services)
  uploadEndpoint = `/api/services/upload-editor?serviceId=${serviceId}`;
}
```

## Upload Endpoints

### Service Upload Endpoint (Correct)
**Endpoint**: `/api/services/upload-editor`
**File**: `src/app/api/services/upload-editor/route.ts`

This endpoint correctly handles:
- **Images**: Saves to `public/images/services/service_{timestamp}.webp`
- **Videos**: Saves to `public/videos/services/service_{timestamp}.{ext}`
- **Database**: Records in `storage_medias` table with `parentType = "service-text-editor"`

### Default Upload Endpoint (For Products)
**Endpoint**: `/api/upload`
**File**: `src/app/api/upload/route.ts`

This endpoint is used for products and saves to:
- **Images**: `public/images/products/product_{timestamp}.webp`
- **Videos**: `public/videos/products/product_{timestamp}.{ext}`

## Verification

After these changes:
1. ✅ New services (id = 0) now use `/api/services/upload-editor?serviceId=0`
2. ✅ Existing services use `/api/services/upload-editor?serviceId={actualId}`
3. ✅ Images are saved to `public/images/services/service_{timestamp}.webp`
4. ✅ Videos are saved to `public/videos/services/`
5. ✅ All uploads are tracked in the database with correct parent type

## Testing
To test the fix:
1. Go to Admin → Services
2. Click "Thêm dịch vụ mới" (Add new service)
3. In the description field (rich text editor):
   - Upload an image → Should save to `public/images/services/service_{timestamp}.webp`
   - Upload a video → Should save to `public/videos/services/service_{timestamp}.{ext}`
4. Save the service
5. Verify the files are in the correct directories

## Related Files
- `src/app/(admin)/admin/services/page.tsx` - Services admin page
- `src/components/RichTextEditor.tsx` - Rich text editor component
- `src/app/api/services/upload-editor/route.ts` - Service upload endpoint (correct)
- `src/app/api/upload/route.ts` - Default upload endpoint (for products)
