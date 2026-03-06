# Quick Start - Image Upload Feature

## 🚀 Get Started in 3 Steps

### Step 1: Configure Environment
Add to your `.env` file (create if it doesn't exist):
```env
STORAGE_PATH=/public/images
```

### Step 2: Restart Development Server
```bash
# Stop the current server (Ctrl+C)
# Then restart
yarn dev
```

### Step 3: Test the Feature
1. Go to: `http://localhost:3000/admin/settings`
2. Click on any banner's edit button
3. Click "Chọn ảnh" (Choose Image)
4. Select an image from your device
5. Watch it upload and convert to WebP!
6. Click "Lưu" (Save)

## 🎯 What Happens Behind the Scenes

```
┌─────────────────────────────────────────────────────────────┐
│                     USER SELECTS IMAGE                       │
│                    (JPEG, PNG, GIF, etc.)                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              CLIENT-SIDE VALIDATION                          │
│  • Check file type (image/jpeg, image/png, etc.)            │
│  • Check file size (max 10MB)                               │
│  • Create preview                                            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              UPLOAD TO SERVER                                │
│  POST /api/upload/image                                      │
│  FormData with 'image' field                                 │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              SERVER-SIDE PROCESSING                          │
│  1. Receive file                                             │
│  2. Validate again (security)                                │
│  3. Convert to WebP (Sharp library)                          │
│  4. Generate filename: banner_{timestamp}.webp              │
│  5. Save to STORAGE_PATH/banner_{timestamp}.webp            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              RETURN IMAGE URL                                │
│  Response: { imageUrl: "/images/banner_1234567890.webp" }   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              UPDATE FORM FIELD                               │
│  backgroundImage = "/images/banner_1234567890.webp"         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              USER CLICKS "LƯU" (SAVE)                        │
│  Banner data (including image path) saved to database        │
└─────────────────────────────────────────────────────────────┘
```

## 📸 Example Output

### Before Upload
```
URL hình ảnh: [                                    ] [Chọn ảnh]
```

### During Upload
```
URL hình ảnh: [                                    ] [Đang tải...]
┌─────────────────────────────────────────┐
│         [Image Preview]                 │
└─────────────────────────────────────────┘
```

### After Upload
```
URL hình ảnh: [/images/banner_1709712345.webp     ] [Chọn ảnh]
┌─────────────────────────────────────────┐
│         [Image Preview]                 │
└─────────────────────────────────────────┘
Chọn ảnh từ thiết bị (tự động chuyển sang WebP) hoặc nhập URL trực tiếp
```

## 🔍 File Locations

### Uploaded Images
```
public/
└── images/
    ├── banner_1709712345678.webp  ← Your uploaded images
    ├── banner_1709712456789.webp
    └── banner_1709712567890.webp
```

### Code Files
```
src/
├── app/
│   └── api/
│       └── upload/
│           └── image/
│               └── route.ts          ← Upload API
└── components/
    └── BannerForm.tsx                ← Enhanced form
```

## 💡 Tips

### Tip 1: Image Quality
The WebP conversion uses 85% quality, which provides excellent visual quality while reducing file size by 25-35%.

### Tip 2: File Size
Original: 2.5 MB JPEG → Converted: ~800 KB WebP (68% smaller!)

### Tip 3: Manual URL Still Works
You can still paste external image URLs directly into the text field if needed.

### Tip 4: Preview Updates
The preview updates immediately when you select a file, even before upload completes.

### Tip 5: Error Messages
All error messages are in Vietnamese for better user experience:
- "Chỉ chấp nhận file ảnh (JPEG, PNG, WebP, GIF)"
- "Kích thước file không được vượt quá 10MB"
- "Lỗi khi tải ảnh lên"

## ⚙️ Advanced Configuration

### Change Storage Location
```env
# Save to a different directory
STORAGE_PATH=/public/uploads/banners

# Or use absolute path
STORAGE_PATH=/var/www/myapp/public/images
```

### Adjust WebP Quality
Edit `src/app/api/upload/image/route.ts`:
```typescript
const webpBuffer = await sharp(buffer)
  .webp({ quality: 90 }) // Change from 85 to 90 for higher quality
  .toBuffer()
```

### Change File Size Limit
Edit `src/components/BannerForm.tsx`:
```typescript
// Change from 10MB to 5MB
if (file.size > 5 * 1024 * 1024) {
  setUploadError('Kích thước file không được vượt quá 5MB');
  return;
}
```

## 🐛 Troubleshooting

### Issue: Upload button doesn't work
**Solution:** Make sure the server is running (`yarn dev`)

### Issue: Images don't save
**Solution:** Check that `public/images` directory exists and is writable

### Issue: "Failed to upload image"
**Solution:** Check the server console for detailed error messages

### Issue: Sharp installation failed
**Solution:** 
```bash
yarn cache clean
yarn install --force
```

## 📞 Need Help?

See the detailed documentation:
- `IMAGE_UPLOAD_GUIDE.md` - Complete feature documentation
- `IMPLEMENTATION_SUMMARY.md` - Technical implementation details

## ✅ Verification Checklist

- [ ] `.env` file has `STORAGE_PATH` configured
- [ ] Server is running (`yarn dev`)
- [ ] Can access admin settings page
- [ ] Can click "Chọn ảnh" button
- [ ] Can select image from device
- [ ] Preview appears
- [ ] Upload completes successfully
- [ ] Image URL populates in field
- [ ] Can save banner with new image
- [ ] Image displays on frontend

## 🎉 You're All Set!

The banner form now supports modern image uploads with automatic WebP optimization. Enjoy the improved workflow!
