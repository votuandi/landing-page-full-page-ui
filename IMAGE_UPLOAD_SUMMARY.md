# Image Upload Feature - Quick Summary

## ✅ What Was Added

### 1. Image Upload API Endpoint
**File:** `src/app/api/partners/upload/route.ts`

- Accepts image uploads via FormData
- Validates file type (JPEG, PNG, WebP, GIF)
- Validates file size (max 10MB)
- Converts to WebP format (85% quality)
- Resizes to max 400px width
- Saves to `/public/images/partners/partner_{timestamp}.webp`
- Returns image URL for database storage

### 2. Updated Admin Interface
**File:** `src/app/(admin)/admin/settings/page.tsx`

**Added State:**
```typescript
const [selectedPartnerImage, setSelectedPartnerImage] = useState<{ [key: number]: File }>({});
const [uploadingPartnerImage, setUploadingPartnerImage] = useState<{ [key: number]: boolean }>({});
const [partnerImagePreview, setPartnerImagePreview] = useState<{ [key: number]: string }>({});
```

**Added Handlers:**
- `handlePartnerImageChange()` - File selection and preview
- `handleUploadPartnerImage()` - Upload to server
- Updated `handleSavePartner()` - Upload before saving
- Updated `handleDeletePartner()` - Clean up states

**UI Changes:**
- File input with accept filter
- Live image preview
- Upload progress indicator
- File validation messages
- Manual URL input (optional)
- Disabled states during upload

### 3. Dependencies
**Installed:** `sharp` for image processing

```bash
npm install sharp
```

## 🎯 How to Use

### For Admins

1. Go to `/admin/settings` → "Đối tác" tab
2. Click "Thêm Đối tác" or edit existing partner
3. Click "Choose File" under "Hình ảnh đối tác"
4. Select image from device (JPEG, PNG, WebP, GIF)
5. Preview appears automatically
6. Fill in partner name
7. Click "Lưu"
8. Image uploads, converts to WebP, and saves automatically

### Image Requirements

- **Formats**: JPEG, PNG, WebP, GIF
- **Max Size**: 10MB
- **Recommended**: Partner logos, transparent backgrounds work best
- **Output**: Automatically converted to WebP (400px max width)

## 🔧 Technical Details

### Upload Process

```
1. User selects file
   ↓
2. Client validates (type, size)
   ↓
3. Preview generated (FileReader)
   ↓
4. User clicks Save
   ↓
5. File uploaded to /api/partners/upload
   ↓
6. Server validates and processes
   ↓
7. Sharp converts to WebP (400px, 85% quality)
   ↓
8. Saved to /public/images/partners/partner_{time}.webp
   ↓
9. URL returned to client
   ↓
10. Partner saved to database with image URL
```

### File Structure

```
public/
  └── images/
      └── partners/
          ├── partner_1234567890.webp
          ├── partner_1234567891.webp
          └── partner_1234567892.webp

src/
  └── app/
      └── api/
          └── partners/
              ├── route.ts           # CRUD endpoints
              ├── [id]/
              │   └── route.ts       # Update/Delete
              └── upload/
                  └── route.ts       # NEW - Image upload
```

## 🎨 UI Features

### Image Preview
Shows selected image before upload with proper sizing

### Upload Progress
Button shows "Đang upload..." with spinner during upload

### Validation Messages
- ✓ File type validation
- ✓ File size validation  
- ✓ Success confirmation
- ✓ Error messages

### Flexible Input
- Primary: File upload from device
- Alternative: Manual URL entry

## 📊 Benefits

### Performance
- **WebP Format**: 25-35% smaller than JPEG/PNG
- **Optimized Size**: Max 400px width, perfect for logos
- **Fast Loading**: Smaller files = faster page loads

### User Experience
- **Easy Upload**: Simple file selection
- **Live Preview**: See before saving
- **Progress Feedback**: Know when upload is happening
- **Error Handling**: Clear messages for issues

### Developer Experience
- **Automatic Processing**: No manual image optimization needed
- **Consistent Naming**: Timestamp-based filenames
- **Organized Storage**: All partners in one folder
- **Type Safety**: Full TypeScript support

## 🔒 Security

✅ Whitelist file type validation  
✅ File size limits (10MB)  
✅ Server-side validation  
✅ Safe filename generation  
✅ No directory traversal  
✅ No user-provided filenames  

## 🐛 Common Issues & Solutions

### Issue: "Invalid file type"
**Solution:** Only JPEG, PNG, WebP, GIF allowed. Convert your image first.

### Issue: "File size exceeds 10MB"
**Solution:** Compress or resize image before uploading.

### Issue: Upload button disabled
**Solution:** Wait for current upload to complete.

### Issue: Preview not showing
**Solution:** Verify file is a valid image format.

### Issue: Image not on homepage
**Solution:** Check partner is marked as "Hiển thị" (active).

## 📝 Testing Checklist

After restarting the dev server, test:

- [ ] Upload JPEG image ✓
- [ ] Upload PNG image ✓
- [ ] Upload WebP image ✓
- [ ] Preview appears correctly ✓
- [ ] Save button shows upload progress ✓
- [ ] Image converts to WebP ✓
- [ ] Image appears in admin ✓
- [ ] Image appears on homepage ✓
- [ ] Edit and replace image ✓
- [ ] Manual URL still works ✓

## 🚀 Next Steps

1. **Restart your dev server** (important!)
   ```bash
   # Stop current server (Ctrl+C)
   # Then restart
   yarn dev
   ```

2. **Test the feature**
   - Go to `/admin/settings` → "Đối tác" tab
   - Add a new partner with image upload
   - Verify image appears on homepage

3. **Check the output**
   - Look in `/public/images/partners/` for WebP files
   - Verify file sizes are optimized
   - Check homepage loads quickly

## 📚 Documentation

- **Full Documentation**: `PARTNER_IMAGE_UPLOAD.md`
- **Partners Feature**: `PARTNERS_FEATURE.md`
- **Setup Guide**: `setup-partners.md`

## 🎉 Summary

You can now:
- ✅ Upload partner images from device
- ✅ Automatic WebP conversion
- ✅ Live preview before saving
- ✅ Optimized for web performance
- ✅ Simple and intuitive UI

**All set!** Just restart your dev server and start uploading partner logos! 🚀
