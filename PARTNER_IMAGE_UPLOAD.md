# Partner Image Upload Feature

## Overview

Added automatic image upload and WebP conversion functionality for partner logos. Admins can now upload images directly from their device, and the system will automatically convert them to optimized WebP format.

## Features

✅ **File Upload from Device** - Select images directly from computer  
✅ **Automatic WebP Conversion** - All images converted to WebP for optimal performance  
✅ **Image Optimization** - Automatically resized to 400px width (maintains aspect ratio)  
✅ **Live Preview** - See image preview before saving  
✅ **Multiple Format Support** - Accepts JPEG, PNG, WebP, and GIF  
✅ **File Validation** - Size limit (10MB) and type validation  
✅ **Upload Progress** - Visual feedback during upload  
✅ **Manual URL Option** - Still allows manual URL entry if needed  

## How It Works

### 1. Image Upload Flow

```
User selects image → Preview shown → Click Save → 
Upload to server → Convert to WebP → Save to /public/images/partners/ → 
Update database with path → Display on homepage
```

### 2. File Naming Convention

Images are automatically named with timestamps:
```
partner_1234567890.webp
```

Where `1234567890` is the Unix timestamp in milliseconds.

### 3. Storage Location

All partner images are saved to:
```
/public/images/partners/partner_{timestamp}.webp
```

### 4. Image Optimization

- **Format**: WebP (85% quality)
- **Max Width**: 400px
- **Aspect Ratio**: Maintained
- **No Enlargement**: Small images won't be upscaled

## Usage Guide

### Adding a Partner with Image Upload

1. Go to `/admin/settings`
2. Click "Đối tác" tab
3. Click "Thêm Đối tác" button
4. Fill in partner name
5. Click "Choose File" under "Hình ảnh đối tác"
6. Select an image from your device
7. Preview will appear automatically
8. Check "Hiển thị" if you want it visible immediately
9. Click "Lưu" button
10. Image will upload and convert automatically
11. Partner will be saved with the new image path

### Editing Partner Image

1. Click the pencil icon on any partner card
2. Click "Choose File" to select a new image
3. New preview will replace the old one
4. Click "Lưu" to upload and save
5. Old image path will be replaced with new one

### Manual URL Entry

If you prefer to use an existing image URL:
1. Scroll to "Hoặc nhập URL thủ công" section
2. Enter the image path manually
3. Click "Lưu" (no upload needed)

## Technical Details

### API Endpoint

**POST** `/api/partners/upload`

**Request:**
- Content-Type: `multipart/form-data`
- Body: FormData with `image` field

**Response:**
```json
{
  "success": true,
  "imageUrl": "/images/partners/partner_1234567890.webp",
  "filename": "partner_1234567890.webp",
  "message": "Image uploaded and converted to WebP successfully"
}
```

**Error Response:**
```json
{
  "error": "Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed."
}
```

### Dependencies

- **sharp** - Image processing library for Node.js
  - Installed via: `npm install sharp`
  - Used for: Image resizing and WebP conversion

### File Validation

**Accepted Formats:**
- image/jpeg
- image/jpg
- image/png
- image/webp
- image/gif

**Size Limit:** 10MB

**Validation Errors:**
- "Invalid file type" - File is not an accepted image format
- "File size exceeds 10MB limit" - File is too large
- "No file provided" - Request missing image file

### Image Processing Pipeline

```javascript
sharp(buffer)
  .resize(400, null, {
    fit: 'inside',
    withoutEnlargement: true,
  })
  .webp({ quality: 85 })
  .toFile(filepath);
```

**Parameters:**
- `resize(400, null)` - Max width 400px, height auto
- `fit: 'inside'` - Maintain aspect ratio
- `withoutEnlargement: true` - Don't upscale small images
- `webp({ quality: 85 })` - Convert to WebP at 85% quality

## UI Components

### File Input
```jsx
<input
  type="file"
  accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
  onChange={(e) => handlePartnerImageChange(partner.id, e)}
  disabled={uploadingPartnerImage[partner.id]}
/>
```

### Image Preview
```jsx
{(partnerImagePreview[partner.id] || partner.image) && (
  <div className="mb-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
    <img
      src={partnerImagePreview[partner.id] || partner.image}
      alt={partner.name || "Preview"}
      className="max-h-24 mx-auto object-contain"
    />
  </div>
)}
```

### Upload Progress
```jsx
{uploadingPartnerImage[partner.id] ? (
  <>
    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
    <span>Đang upload...</span>
  </>
) : (
  <>
    <CheckIcon className="w-4 h-4" />
    <span>Lưu</span>
  </>
)}
```

## State Management

### Component State

```typescript
// Selected files for each partner
const [selectedPartnerImage, setSelectedPartnerImage] = useState<{ [key: number]: File }>({});

// Upload status for each partner
const [uploadingPartnerImage, setUploadingPartnerImage] = useState<{ [key: number]: boolean }>({});

// Preview URLs for each partner
const [partnerImagePreview, setPartnerImagePreview] = useState<{ [key: number]: string }>({});
```

### Handler Functions

**handlePartnerImageChange** - Handles file selection and preview
```typescript
const handlePartnerImageChange = (partnerId: number, e: React.ChangeEvent<HTMLInputElement>) => {
  // Validate file type and size
  // Create preview with FileReader
  // Store file in state
}
```

**handleUploadPartnerImage** - Uploads image to server
```typescript
const handleUploadPartnerImage = async (partnerId: number): Promise<string | null> => {
  // Create FormData
  // POST to /api/partners/upload
  // Return image URL or null
}
```

**handleSavePartner** - Saves partner with uploaded image
```typescript
const handleSavePartner = async (id: number) => {
  // Upload image if selected
  // Update partner with new image URL
  // Save to database
}
```

## Error Handling

### Client-Side Validation
- File type validation
- File size validation (10MB)
- Preview generation error handling
- Upload progress tracking

### Server-Side Validation
- File type validation
- File size validation (10MB)
- Directory creation
- Image processing errors
- File system errors

### User Feedback
- Alert for validation errors
- Success message after save
- Upload progress indicator
- Preview before upload
- Error messages from server

## Performance Considerations

### WebP Benefits
- **Smaller File Size**: 25-35% smaller than JPEG/PNG
- **Faster Loading**: Less bandwidth usage
- **Better Quality**: Superior compression algorithm
- **Browser Support**: 95%+ modern browsers

### Image Optimization
- **Max Width 400px**: Perfect for partner logos
- **Quality 85%**: Good balance of size and quality
- **No Upscaling**: Preserves original quality for small images
- **Aspect Ratio**: Prevents distortion

### Storage
- **Organized Structure**: All partners in one folder
- **Unique Names**: Timestamp prevents conflicts
- **Public Access**: Served directly by Next.js

## Security Considerations

✅ File type validation (whitelist approach)  
✅ File size limits (prevents DoS)  
✅ Server-side validation (not just client-side)  
✅ Safe file naming (timestamp-based)  
✅ Directory traversal prevention  
✅ No user-provided filenames  

## Browser Compatibility

### File Upload
- ✅ Chrome/Edge (all versions)
- ✅ Firefox (all versions)
- ✅ Safari (all versions)
- ✅ Mobile browsers

### WebP Support
- ✅ Chrome 23+
- ✅ Firefox 65+
- ✅ Safari 14+
- ✅ Edge 18+
- ⚠️ IE 11 (not supported, but rare)

## Troubleshooting

### Image not uploading
1. Check file size (must be < 10MB)
2. Verify file format (JPEG, PNG, WebP, GIF only)
3. Check browser console for errors
4. Verify `/public/images/partners/` directory exists
5. Check server logs for errors

### Preview not showing
1. Verify file is a valid image
2. Check browser console for FileReader errors
3. Try a different image format

### WebP conversion failing
1. Verify `sharp` is installed: `npm list sharp`
2. Reinstall if needed: `npm install sharp`
3. Check Node.js version (sharp requires Node 14.15.0+)
4. Check server logs for sharp errors

### Image not displaying on homepage
1. Verify image path in database
2. Check if partner is marked as active
3. Verify image file exists in `/public/images/partners/`
4. Check browser console for 404 errors
5. Clear browser cache

## Future Enhancements

Potential improvements:

- [ ] Drag-and-drop file upload
- [ ] Multiple image upload at once
- [ ] Image cropping tool
- [ ] Automatic background removal
- [ ] Image compression options
- [ ] Delete old images when replacing
- [ ] Image gallery/library
- [ ] CDN integration
- [ ] Lazy loading for images
- [ ] Progressive image loading

## Testing

### Manual Testing Checklist

- [ ] Upload JPEG image
- [ ] Upload PNG image
- [ ] Upload WebP image
- [ ] Upload GIF image
- [ ] Try uploading file > 10MB (should fail)
- [ ] Try uploading non-image file (should fail)
- [ ] Verify WebP conversion
- [ ] Check image appears on homepage
- [ ] Edit partner and replace image
- [ ] Delete partner (verify states cleared)
- [ ] Cancel edit (verify preview cleared)
- [ ] Upload while editing existing partner
- [ ] Upload for new partner

### Verification Steps

1. Upload an image
2. Check `/public/images/partners/` for new file
3. Verify file is WebP format
4. Check file size (should be optimized)
5. Verify image displays in admin
6. Verify image displays on homepage
7. Check database for correct path

## Summary

The image upload feature provides a seamless experience for managing partner logos:

1. **Easy Upload**: Simple file selection from device
2. **Automatic Optimization**: WebP conversion and resizing
3. **Live Preview**: See images before saving
4. **Error Handling**: Clear feedback for issues
5. **Flexible**: Supports multiple formats and manual URLs

All images are automatically optimized for web performance while maintaining visual quality.
