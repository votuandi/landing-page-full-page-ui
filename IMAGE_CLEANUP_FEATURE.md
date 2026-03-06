# Automatic Image Cleanup Feature

## Overview

Added automatic cleanup of old images from storage when partners or banners are deleted or when their images are replaced. This prevents storage bloat from unused image files.

## What Was Added

### 1. Image Utility Functions (`src/lib/imageUtils.ts`)

A comprehensive utility library for managing image files:

#### `deleteImageFile(imageUrl: string)`
- Deletes an image file from the public directory
- Converts public URL to file system path
- Validates file existence before deletion
- Returns boolean indicating success

#### `isGeneratedImage(imageUrl: string)`
- Checks if an image is a generated/uploaded file
- Matches pattern: `partner_123456789.webp` or `banner_123456789.webp`
- Prevents accidental deletion of original/external assets

#### `safeDeleteImage(imageUrl: string)`
- Safely deletes only generated/uploaded images
- Skips external URLs and original assets
- Combines validation and deletion

#### `extractImageUrlFromCss(backgroundImage: string)`
- Extracts URL from CSS `url()` syntax
- Useful for banner background images

### 2. Updated Partner API

**File:** `src/app/api/partners/[id]/route.ts`

#### DELETE Endpoint
- Retrieves partner image URL before deletion
- Deletes partner from database
- Automatically deletes image file from storage

#### PUT Endpoint
- Compares old and new image URLs
- Deletes old image if replaced with new one
- Only deletes if images are different

### 3. Updated Banner API

**File:** `src/app/api/banners/[id]/route.ts`

#### DELETE Endpoint
- Retrieves banner background image before deletion
- Deletes banner from database
- Automatically deletes image file from storage

#### PUT Endpoint
- Compares old and new background images
- Deletes old image if replaced with new one
- Only deletes if images are different

## How It Works

### Partner Deletion Flow

```
1. User clicks delete on partner
   ↓
2. API receives DELETE request
   ↓
3. Fetch partner data (including image URL)
   ↓
4. Delete partner from database
   ↓
5. Check if image is generated (timestamp pattern)
   ↓
6. Delete image file from /public/images/partners/
   ↓
7. Return success response
```

### Partner Image Update Flow

```
1. User uploads new image for existing partner
   ↓
2. New image uploaded and converted to WebP
   ↓
3. API receives PUT request with new image URL
   ↓
4. Fetch existing partner data (old image URL)
   ↓
5. Update partner in database with new image URL
   ↓
6. Compare old and new image URLs
   ↓
7. If different and old is generated, delete old image
   ↓
8. Return updated partner
```

### Banner Deletion Flow

```
1. User clicks delete on banner
   ↓
2. API receives DELETE request
   ↓
3. Fetch banner data (including backgroundImage)
   ↓
4. Delete banner from database
   ↓
5. Check if background image is generated
   ↓
6. Delete image file from storage
   ↓
7. Return success response
```

### Banner Image Update Flow

```
1. User updates banner with new background image
   ↓
2. API receives PUT request
   ↓
3. Fetch existing banner (old backgroundImage)
   ↓
4. Update banner in database
   ↓
5. Compare old and new background images
   ↓
6. If different and old is generated, delete old image
   ↓
7. Return updated banner
```

## Safety Features

### 1. Generated Image Detection

Only deletes images matching these patterns:
- `partner_1234567890.webp`
- `banner_1234567890.jpg`
- `hero_1234567890.png`

**Skips:**
- Original assets: `/images/partners/logo-company.png`
- External URLs: `https://example.com/image.jpg`
- Non-timestamped files: `/images/partners/default.webp`

### 2. File Existence Check

Always checks if file exists before attempting deletion to avoid errors.

### 3. Error Handling

- Catches and logs deletion errors
- Doesn't fail the main operation if image deletion fails
- Returns false on failure, true on success

### 4. External URL Protection

Automatically skips deletion for:
- `http://` URLs
- `https://` URLs

## Code Examples

### Using safeDeleteImage

```typescript
import { safeDeleteImage } from '@/lib/imageUtils';

// Delete a generated image
await safeDeleteImage('/images/partners/partner_1234567890.webp');
// Result: Image deleted ✓

// Try to delete an original asset
await safeDeleteImage('/images/partners/logo-company.png');
// Result: Skipped (not a generated image) ✓

// Try to delete external URL
await safeDeleteImage('https://example.com/logo.png');
// Result: Skipped (external URL) ✓
```

### Using isGeneratedImage

```typescript
import { isGeneratedImage } from '@/lib/imageUtils';

isGeneratedImage('/images/partners/partner_1234567890.webp');
// Returns: true

isGeneratedImage('/images/partners/logo-company.png');
// Returns: false

isGeneratedImage('https://example.com/image.jpg');
// Returns: false
```

### Using deleteImageFile

```typescript
import { deleteImageFile } from '@/lib/imageUtils';

// Delete any image (use with caution!)
const success = await deleteImageFile('/images/partners/any-image.png');
if (success) {
  console.log('Image deleted successfully');
}
```

## Benefits

### 1. Storage Efficiency
- Prevents accumulation of unused images
- Keeps storage clean and organized
- Reduces hosting costs

### 2. Automatic Management
- No manual cleanup needed
- Happens transparently during normal operations
- Consistent behavior across all image types

### 3. Safe by Default
- Only deletes generated/uploaded images
- Protects original assets
- Handles errors gracefully

### 4. Performance
- Removes unused files that would slow down backups
- Reduces file system clutter
- Improves deployment times

## Technical Details

### File Path Conversion

Public URL → File System Path:
```typescript
'/images/partners/partner_123.webp'
→ 'D:/Workspace/Projects/landing-page-full-page-ui/public/images/partners/partner_123.webp'
```

### Pattern Matching

Generated images match this regex:
```regex
/\/(partner|banner|hero)_\d+\.(webp|jpg|jpeg|png|gif)$/i
```

Examples:
- ✅ `/images/partners/partner_1234567890.webp`
- ✅ `/images/banners/banner_9876543210.jpg`
- ✅ `/images/hero_1111111111.png`
- ❌ `/images/partners/logo-company.png`
- ❌ `/images/partners/default.webp`

### Error Handling

```typescript
try {
  await unlink(filePath);
  console.log('Successfully deleted image:', filePath);
  return true;
} catch (error) {
  console.error('Error deleting image file:', error);
  return false;
}
```

## Logging

The system logs all image deletion attempts:

**Success:**
```
Successfully deleted image: D:/...public/images/partners/partner_123.webp
```

**Skipped (non-generated):**
```
Skipping deletion of non-generated image: /images/partners/logo-company.png
```

**Skipped (external):**
```
Skipping deletion of external URL: https://example.com/logo.png
```

**File not found:**
```
File does not exist: D:/...public/images/partners/partner_123.webp
```

**Error:**
```
Error deleting image file: [error details]
```

## Testing

### Manual Testing Checklist

#### Partner Images
- [ ] Delete partner → verify image file deleted
- [ ] Update partner with new image → verify old image deleted
- [ ] Update partner name only → verify image NOT deleted
- [ ] Delete partner with manual URL → verify no errors
- [ ] Delete partner with external URL → verify no errors

#### Banner Images
- [ ] Delete banner → verify background image deleted
- [ ] Update banner with new image → verify old image deleted
- [ ] Update banner text only → verify image NOT deleted
- [ ] Delete banner with original asset → verify asset NOT deleted

#### Safety Tests
- [ ] Try deleting original asset → verify it's skipped
- [ ] Try deleting external URL → verify it's skipped
- [ ] Delete non-existent file → verify no errors
- [ ] Check logs for proper messages

### Verification Steps

1. **Create partner with uploaded image**
   ```bash
   # Check file exists
   ls public/images/partners/
   # Should show: partner_1234567890.webp
   ```

2. **Delete the partner**
   ```bash
   # Check file is gone
   ls public/images/partners/
   # Should NOT show: partner_1234567890.webp
   ```

3. **Update partner image**
   ```bash
   # Before update
   ls public/images/partners/
   # Shows: partner_1111111111.webp
   
   # After update with new image
   ls public/images/partners/
   # Shows: partner_2222222222.webp
   # NOT showing: partner_1111111111.webp (deleted)
   ```

## Troubleshooting

### Image not being deleted

1. **Check if it's a generated image**
   - Must match pattern: `partner_123456789.webp`
   - Check server logs for "Skipping deletion" messages

2. **Check file permissions**
   - Ensure Node.js has write access to public folder
   - On Linux/Mac: `chmod -R 755 public/images/`

3. **Check file path**
   - Verify image URL is correct in database
   - Check server logs for actual file path attempted

### Errors during deletion

1. **File not found**
   - Image may have been manually deleted
   - Check if file exists in file system

2. **Permission denied**
   - File may be locked by another process
   - Check file permissions

3. **Operation continues despite error**
   - This is intentional - deletion failure doesn't break the main operation
   - Check logs to see what went wrong

## Future Enhancements

Potential improvements:

- [ ] Batch cleanup of orphaned images
- [ ] Admin UI to view/delete unused images
- [ ] Image usage tracking
- [ ] Automatic cleanup of images older than X days
- [ ] Move deleted images to trash folder instead of permanent deletion
- [ ] Image size statistics and cleanup recommendations
- [ ] Scheduled cleanup jobs
- [ ] Cloud storage integration (S3, Cloudinary, etc.)

## Migration Notes

### Existing Images

Images uploaded before this feature:
- Will be deleted when partner/banner is deleted
- Will be deleted when replaced with new image
- Original assets remain protected

### No Breaking Changes

- Existing functionality unchanged
- Backward compatible with all image URLs
- Safe to deploy without data migration

## Best Practices

### 1. Use Generated Images

Always use the upload feature for new images to ensure they can be automatically cleaned up.

### 2. Backup Important Images

Before bulk deletions, backup images you might need later.

### 3. Monitor Logs

Check server logs periodically to ensure cleanup is working correctly.

### 4. Test in Development

Test deletion behavior in development before deploying to production.

### 5. Document Original Assets

Keep a list of original assets that should never be deleted.

## Summary

The automatic image cleanup feature:

✅ **Automatically deletes** old images when partners/banners are deleted  
✅ **Automatically deletes** old images when replaced with new ones  
✅ **Safely protects** original assets and external URLs  
✅ **Handles errors** gracefully without breaking operations  
✅ **Logs all actions** for monitoring and debugging  
✅ **Works transparently** - no user intervention needed  

This keeps your storage clean and organized while protecting important assets!
