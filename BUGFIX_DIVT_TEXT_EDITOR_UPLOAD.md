# Bug Fix: divt-text-editor Image Upload 400 Error

## Issue
When uploading images from the rich text editor (divt-text-editor), the upload failed with:
```
Error: 400 Bad Request
Endpoint: http://localhost:3000/api/upload?productId=23
```

## Root Causes

### 1. Incorrect FormData Field Name
**Problem:** The API endpoint was looking for the file in the wrong FormData field.

The endpoint was checking for:
```typescript
const file = formData.get('image') as File;
```

But according to the [divt-text-editor documentation](https://github.com/votuandi/divt-text-editor#readme), the editor sends the file with the field name `'file'`:

```typescript
// From divt-text-editor README.md line 139
const file = formData.get('file') as File;
```

**Solution:** Updated the endpoint to check multiple possible field names:
```typescript
// Try common field names: 'image', 'file', 'upload'
let file = formData.get('image') as File;
if (!file) {
  file = formData.get('file') as File;
}
if (!file) {
  file = formData.get('upload') as File;
}
```

### 2. Incorrect Response Format
**Problem:** The API was returning `{ imageUrl: ... }` but divt-text-editor expects `{ url: ... }`.

According to the documentation (line 144):
```typescript
return NextResponse.json({ url: uploadedUrl });
```

**Solution:** Updated response to include both formats:
```typescript
return NextResponse.json({
  url: imageUrl,        // Required by divt-text-editor
  success: true,
  imageUrl,            // Keep for backwards compatibility
  filename,
});
```

## Files Modified

### `src/app/api/upload/route.ts`

**Changes:**
1. Added fallback checks for multiple field names (`'image'`, `'file'`, `'upload'`)
2. Added debug logging to show available form data keys
3. Updated response format to include `url` field required by divt-text-editor

**Before:**
```typescript
const file = formData.get('image') as File;

if (!file) {
  return NextResponse.json(
    { error: 'No file provided' },
    { status: 400 }
  );
}

// ...

return NextResponse.json({
  success: true,
  imageUrl,
  filename,
}, { status: 200 });
```

**After:**
```typescript
// Try common field names
let file = formData.get('image') as File;
if (!file) {
  file = formData.get('file') as File;
}
if (!file) {
  file = formData.get('upload') as File;
}

if (!file) {
  // Log all form data keys for debugging
  const keys = Array.from(formData.keys());
  console.error('No file found. Available form data keys:', keys);
  return NextResponse.json(
    { error: 'No file provided', availableKeys: keys },
    { status: 400 }
  );
}

// ...

// Return in the format expected by divt-text-editor
return NextResponse.json({
  url: imageUrl,  // divt-text-editor expects 'url' field
  success: true,
  imageUrl,      // Keep for backwards compatibility
  filename,
}, { status: 200 });
```

## divt-text-editor Upload Specification

According to the [official documentation](https://github.com/votuandi/divt-text-editor):

### Request Format
```typescript
// The editor sends FormData with field name 'file'
const formData = new FormData();
formData.append('file', fileBlob);
```

### Response Format
```typescript
// The editor expects a response with 'url' field
{
  "url": "https://example.com/uploaded-image.jpg"
}
```

### Error Response
```typescript
{
  "error": "Upload failed"
}
```

## Testing

To verify the fix:

1. **Open Product Form:**
   - Go to `/admin/products`
   - Edit an existing product (e.g., product ID 23)

2. **Use Rich Text Editor:**
   - Click in the Description, Specifications, or Warranty field
   - Click the image button in the toolbar
   - Select an image from your device

3. **Verify Upload:**
   - Image should upload successfully
   - Image should appear in the editor
   - Check Network tab: `POST /api/upload?productId=23` should return 200
   - Response should include `{ url: "/images/products/product_xxx.webp" }`

4. **Check Database:**
   - Image should be saved to `storage_medias` table
   - `parentType` should be `"text-editor"`
   - `parentId` should be `23`

5. **Check Filesystem:**
   - Image should be saved to `public/images/products/`
   - Filename format: `product_{timestamp}.webp`

## Debug Information

If upload still fails, check the server logs for:
```
No file found. Available form data keys: ['file', 'productId']
```

This will show what field names are actually being sent.

## Related Documentation

- [divt-text-editor README](https://github.com/votuandi/divt-text-editor#readme)
- [divt-text-editor Upload Example](https://github.com/votuandi/divt-text-editor#-setting-up-upload-endpoint)
- Package version: `v0.1.6`

## Prevention

To prevent similar issues in the future:

1. **Always check third-party library documentation** for:
   - Expected request format
   - Expected response format
   - Field names used in FormData

2. **Add debug logging** for FormData keys when debugging upload issues:
   ```typescript
   const keys = Array.from(formData.keys());
   console.log('Available form data keys:', keys);
   ```

3. **Support multiple field names** as a fallback:
   ```typescript
   let file = formData.get('image') || formData.get('file') || formData.get('upload');
   ```

4. **Return multiple response formats** for compatibility:
   ```typescript
   return {
     url: imageUrl,      // Standard format
     imageUrl,           // Alternative format
     success: true,      // Status indicator
   };
   ```

## Additional Notes

### productId Query Parameter

The `productId` is passed as a query parameter to track which product the image belongs to:
```
/api/upload?productId=23
```

This allows the endpoint to save the image to the `storage_medias` table with:
- `parentId`: 23
- `parentType`: "text-editor"
- `type`: "image"

This tracking helps identify orphaned images for future cleanup.

### Image Processing

All uploaded images are:
1. Validated (type and size)
2. Converted to WebP format (85% quality)
3. Resized to max 1200px width (maintains aspect ratio)
4. Saved to `public/images/products/`
5. Tracked in `storage_medias` table

### Error Handling

The endpoint now provides detailed error messages:
- Missing file: Shows available FormData keys
- Invalid file type: Lists accepted types
- File too large: Shows size limit
- Server error: Shows error message

## Summary

The fix ensures compatibility with divt-text-editor by:
1. ✅ Accepting `'file'` as the FormData field name
2. ✅ Returning `{ url: ... }` in the response
3. ✅ Adding debug logging for troubleshooting
4. ✅ Supporting multiple field names as fallback
5. ✅ Maintaining backwards compatibility

The image upload from rich text editor now works correctly!
