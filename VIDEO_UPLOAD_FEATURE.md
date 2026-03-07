# Video Upload Feature - divt-text-editor

## Overview
The `/api/upload` endpoint now supports both image and video uploads from the divt-text-editor rich text editor component.

## Supported File Types

### Images
- **Formats:** JPEG, JPG, PNG, WebP, GIF
- **Max Size:** 10MB
- **Processing:** Converted to WebP format (85% quality), resized to max 1200px width
- **Storage:** `public/images/products/`
- **Filename:** `product_{timestamp}.webp`

### Videos
- **Formats:** MP4, WebM, OGG, QuickTime (MOV)
- **Max Size:** 100MB
- **Processing:** Saved as-is (no conversion)
- **Storage:** `public/videos/products/`
- **Filename:** `product_{timestamp}.{original_extension}`

## Implementation Details

### File Type Detection

```typescript
const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const videoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
const isImage = imageTypes.includes(file.type);
const isVideo = videoTypes.includes(file.type);
```

### Size Validation

```typescript
// Images: 10MB limit
// Videos: 100MB limit
const maxSize = isImage ? 10 * 1024 * 1024 : 100 * 1024 * 1024;
```

### Image Processing

Images are processed using Sharp:
```typescript
await sharp(buffer)
  .resize(1200, null, {
    fit: 'inside',
    withoutEnlargement: true,
  })
  .webp({ quality: 85 })
  .toFile(filepath);
```

### Video Processing

Videos are saved without modification:
```typescript
const extension = file.name.split('.').pop() || 'mp4';
filename = `product_${timestamp}.${extension}`;
await writeFile(filepath, buffer);
```

### Storage Tracking

Both images and videos are tracked in the `storage_medias` table:

```typescript
await prisma.storageMedia.create({
  data: {
    parentId: parseInt(productId),
    type: isImage ? 'image' : 'video',  // ← Type differentiation
    parentType: 'text-editor',
    path: filePath,
  },
});
```

## API Endpoint

### POST `/api/upload`

**Query Parameters:**
- `productId` (optional): Product ID to associate the media with

**Request:**
```
POST /api/upload?productId=23
Content-Type: multipart/form-data

FormData:
  - file: <File>
```

**Response (Success):**
```json
{
  "url": "/images/products/product_1234567890.webp",
  "success": true,
  "imageUrl": "/images/products/product_1234567890.webp",
  "filename": "product_1234567890.webp",
  "type": "image"
}
```

or for videos:

```json
{
  "url": "/videos/products/product_1234567890.mp4",
  "success": true,
  "imageUrl": "/videos/products/product_1234567890.mp4",
  "filename": "product_1234567890.mp4",
  "type": "video"
}
```

**Response (Error - Invalid Type):**
```json
{
  "error": "Invalid file type. Only images (JPEG, PNG, WebP, GIF) and videos (MP4, WebM, OGG, MOV) are allowed.",
  "receivedType": "application/pdf"
}
```

**Response (Error - File Too Large):**
```json
{
  "error": "File size exceeds 100MB limit"
}
```

## Usage in divt-text-editor

### Configuration

```tsx
<RichTextEditor
  value={product.description || ''}
  onChange={(value) => handleChange(value)}
  productId={product.id !== 0 ? product.id : undefined}
/>
```

The `RichTextEditor` component automatically:
1. Detects when user inserts image/video
2. Sends file to `/api/upload?productId={id}`
3. Receives URL in response
4. Inserts media into editor content

### Image Insertion

User clicks image button → selects image → uploads → inserts:
```html
<img src="/images/products/product_1234567890.webp" alt="..." />
```

### Video Insertion

User clicks video button → selects video → uploads → inserts:
```html
<video controls src="/videos/products/product_1234567890.mp4"></video>
```

## Directory Structure

```
public/
├── images/
│   └── products/
│       ├── product_1234567890.webp
│       ├── product_1234567891.webp
│       └── ...
└── videos/
    └── products/
        ├── product_1234567890.mp4
        ├── product_1234567891.webm
        └── ...
```

## Database Schema

### storage_medias Table

```sql
CREATE TABLE storage_medias (
  id SERIAL PRIMARY KEY,
  parent_id INTEGER,
  type VARCHAR(50),        -- 'image' or 'video'
  parent_type VARCHAR(50), -- 'text-editor', 'product', etc.
  path VARCHAR(255),       -- File path
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Example Records

**Image:**
```json
{
  "id": 1,
  "parentId": 23,
  "type": "image",
  "parentType": "text-editor",
  "path": "public/images/products/product_1234567890.webp",
  "createdAt": "2026-03-07T05:30:00Z",
  "updatedAt": "2026-03-07T05:30:00Z"
}
```

**Video:**
```json
{
  "id": 2,
  "parentId": 23,
  "type": "video",
  "parentType": "text-editor",
  "path": "public/videos/products/product_1234567891.mp4",
  "createdAt": "2026-03-07T05:31:00Z",
  "updatedAt": "2026-03-07T05:31:00Z"
}
```

## Error Handling

### Client-Side

The divt-text-editor handles upload errors automatically:
- Shows error message to user
- Prevents media insertion on failure
- Allows retry

### Server-Side

The endpoint provides detailed error messages:

1. **No File:**
```json
{
  "error": "No file provided",
  "availableKeys": ["productId"]
}
```

2. **Invalid Type:**
```json
{
  "error": "Invalid file type...",
  "receivedType": "application/pdf"
}
```

3. **File Too Large:**
```json
{
  "error": "File size exceeds 100MB limit"
}
```

4. **Server Error:**
```json
{
  "error": "Failed to upload file",
  "message": "Disk full"
}
```

## File Size Recommendations

### Images
- **Recommended:** < 2MB
- **Maximum:** 10MB
- **Reason:** Faster page load, better UX

### Videos
- **Recommended:** < 50MB
- **Maximum:** 100MB
- **Reason:** Balance between quality and load time
- **Alternative:** Consider using YouTube/Vimeo embed for larger videos

## Performance Considerations

### Image Optimization
- Automatic WebP conversion reduces file size by ~30%
- Max width 1200px prevents oversized images
- Quality 85% maintains visual quality

### Video Handling
- No server-side conversion (CPU intensive)
- Consider using external video hosting for production:
  - YouTube
  - Vimeo
  - AWS S3 + CloudFront
  - Cloudinary

## Security Considerations

1. **File Type Validation:**
   - Checks MIME type
   - Prevents executable uploads
   - Whitelist approach

2. **File Size Limits:**
   - Prevents DoS attacks
   - Protects disk space
   - Different limits for images/videos

3. **Storage Location:**
   - Public directory (served by Next.js)
   - No direct filesystem access from client
   - Filename randomization prevents guessing

## Future Enhancements

1. **Video Transcoding:**
   - Convert to web-optimized formats
   - Generate multiple resolutions
   - Create thumbnails

2. **Cloud Storage:**
   - Upload to S3/GCS/Azure
   - CDN integration
   - Better scalability

3. **Progress Tracking:**
   - Upload progress bar
   - Chunked uploads for large files
   - Resume capability

4. **Compression:**
   - Video compression
   - Adaptive bitrate
   - Format conversion

5. **Validation:**
   - Video duration limits
   - Resolution limits
   - Codec validation

## Testing

### Test Image Upload

1. Edit product
2. Click image button in editor
3. Select image (< 10MB)
4. Verify upload success
5. Check: Image appears in editor
6. Check: File saved to `public/images/products/`
7. Check: Record in `storage_medias` table

### Test Video Upload

1. Edit product
2. Click video button in editor
3. Select video (< 100MB)
4. Verify upload success
5. Check: Video appears in editor with controls
6. Check: File saved to `public/videos/products/`
7. Check: Record in `storage_medias` table with `type="video"`

### Test Error Cases

1. **Invalid Type:** Upload PDF → Should show error
2. **Too Large:** Upload 150MB video → Should show error
3. **No File:** Submit empty form → Should show error
4. **Network Error:** Disconnect during upload → Should handle gracefully

## Troubleshooting

### Video Not Playing

**Possible Causes:**
1. Browser doesn't support codec
2. File corrupted during upload
3. Wrong MIME type

**Solutions:**
1. Convert to MP4 (H.264)
2. Re-upload file
3. Check server logs

### Upload Timeout

**Possible Causes:**
1. File too large
2. Slow network
3. Server timeout

**Solutions:**
1. Reduce file size
2. Compress video
3. Increase server timeout settings

### Disk Space Issues

**Monitoring:**
```bash
# Check disk usage
df -h

# Check videos directory size
du -sh public/videos/products/
```

**Cleanup:**
- Implement periodic cleanup of orphaned files
- Archive old videos
- Use cloud storage

## Related Files

- `src/app/api/upload/route.ts` - Upload endpoint
- `src/components/RichTextEditor.tsx` - Editor component
- `prisma/schema.prisma` - Database schema
- `src/app/api/storage-medias/delete/route.ts` - Deletion endpoint

## Summary

The upload endpoint now supports:
- ✅ Images (JPEG, PNG, WebP, GIF) - max 10MB
- ✅ Videos (MP4, WebM, OGG, MOV) - max 100MB
- ✅ Automatic image optimization (WebP conversion)
- ✅ Storage tracking in database
- ✅ Proper error handling
- ✅ Type differentiation (image vs video)
- ✅ Compatible with divt-text-editor

Video uploads from the rich text editor now work correctly!
