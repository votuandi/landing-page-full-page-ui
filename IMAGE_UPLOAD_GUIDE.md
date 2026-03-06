# Image Upload Feature - Banner Form

## Overview
The banner form now supports uploading images directly from your device. Images are automatically converted to WebP format to reduce file size while maintaining quality.

## Features
- ✅ Upload images from device (JPEG, PNG, WebP, GIF)
- ✅ Automatic conversion to WebP format (85% quality)
- ✅ Real-time image preview
- ✅ File size validation (max 10MB)
- ✅ Configurable storage path via environment variable
- ✅ Fallback to manual URL input

## Configuration

### Environment Variable
Add the following to your `.env` file:

```env
STORAGE_PATH=/public/images
```

**Default value:** `/public/images` (if not specified)

The uploaded images will be saved in this directory with the naming pattern: `banner_{timestamp}.webp`

## Usage

### In the Banner Form
1. Click the **"Chọn ảnh"** (Choose Image) button
2. Select an image from your device
3. The image will be automatically:
   - Previewed in the form
   - Uploaded to the server
   - Converted to WebP format
   - Saved with a unique filename
4. The image path will be automatically populated in the URL field
5. Click **"Lưu"** (Save) to save the banner with the new image

### Alternative: Manual URL Input
You can still manually enter an image URL in the text field if you prefer to use external images.

## API Endpoint

### POST `/api/upload/image`

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body: FormData with `image` field

**Response:**
```json
{
  "success": true,
  "imageUrl": "/images/banner_1234567890.webp",
  "filename": "banner_1234567890.webp",
  "size": 123456
}
```

**Error Response:**
```json
{
  "error": "Error message",
  "message": "Detailed error description"
}
```

## File Validation

### Accepted File Types
- JPEG (.jpg, .jpeg)
- PNG (.png)
- WebP (.webp)
- GIF (.gif)

### File Size Limit
- Maximum: 10MB

### Conversion Settings
- Format: WebP
- Quality: 85%
- Compression: Automatic

## Technical Details

### Dependencies
- **sharp**: Image processing library for Node.js
  - Installed via: `yarn add sharp`
  - Used for WebP conversion and optimization

### File Structure
```
src/
├── app/
│   └── api/
│       └── upload/
│           └── image/
│               └── route.ts          # Image upload API endpoint
└── components/
    └── BannerForm.tsx                # Enhanced form with upload UI
```

### Storage Structure
```
public/
└── images/
    ├── banner_1709712345678.webp
    ├── banner_1709712456789.webp
    └── ...
```

## Benefits of WebP Format

1. **Smaller File Size**: WebP provides 25-35% better compression than JPEG
2. **Better Quality**: Maintains visual quality at smaller file sizes
3. **Browser Support**: Supported by all modern browsers
4. **Faster Loading**: Smaller files = faster page load times
5. **SEO Friendly**: Faster loading improves search engine rankings

## Troubleshooting

### Upload fails with "Failed to upload image"
- Check that the `STORAGE_PATH` directory exists and is writable
- Ensure the file size is under 10MB
- Verify the file type is supported

### Image doesn't display after upload
- Check the browser console for errors
- Verify the `STORAGE_PATH` is correctly configured
- Ensure the Next.js server has write permissions to the directory

### Sharp installation issues
If you encounter issues installing sharp:
```bash
# Clear cache and reinstall
yarn cache clean
yarn install --force
```

## Security Considerations

1. **File Type Validation**: Only image files are accepted
2. **File Size Limit**: Prevents large file uploads
3. **Unique Filenames**: Timestamp-based naming prevents overwrites
4. **Server-side Processing**: All conversion happens on the server
5. **Path Sanitization**: Storage path is validated and sanitized

## Future Enhancements

Potential improvements for future versions:
- [ ] Image cropping/resizing UI
- [ ] Multiple image upload
- [ ] Image optimization presets (thumbnail, medium, large)
- [ ] Cloud storage integration (S3, Cloudinary)
- [ ] Image gallery/library for reusing uploaded images
- [ ] Drag-and-drop upload interface
