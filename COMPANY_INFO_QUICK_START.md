# Company Information Management - Quick Start Guide

## 🎯 What Was Built

A complete company information management system in the admin panel with:
- ✅ Database model for storing company information
- ✅ API endpoints for CRUD operations and file uploads
- ✅ Redux state management
- ✅ Full-featured admin form with all requested fields
- ✅ File upload support (logo, story image, story video)

## 🚀 How to Use

### Step 1: Access the Feature
1. Open your browser and go to: `http://localhost:3000/admin/settings`
2. Click on the **"Thông tin công ty"** tab (rightmost tab)

### Step 2: Fill in Company Information

The form is organized into sections:

#### 1️⃣ **Thông tin cơ bản** (Basic Information)
- Enter company name
- Enter slogan
- Upload logo (max 5MB) - Click "Chọn tệp" → Select image → Click "Tải lên"

#### 2️⃣ **Hành trình phát triển** (Development Journey)
- Enter title and detail
- Upload story image - Auto-converts to WebP
- Upload story video (max 1GB)
- Add/edit 4 story items (use + button to add more)

#### 3️⃣ **Cột mốc phát triển** (Milestones)
- Click "+ Thêm cột mốc" to add milestones
- Enter time (e.g., "2020"), title, and detail for each
- Click trash icon to remove

#### 4️⃣ **Giá trị cốt lõi** (Core Values)
- Fill in 4 core values (fixed number)
- Each has title and detail

#### 5️⃣ **Sứ mệnh** (Mission)
- Enter mission statement in text area

#### 6️⃣ **Thành tựu** (Achievements)
- Click "+ Thêm thành tựu" to add achievements
- Enter title and detail for each
- Click trash icon to remove

#### 7️⃣ **Đội ngũ** (Team)
- Click "+ Thêm" to add team items
- Enter amount (e.g., "50+"), title, and detail
- Click trash icon to remove

#### 8️⃣ **Tại sao chọn chúng tôi** (Why Choose Us)
- Enter title and detail

#### 9️⃣ **Mạng xã hội** (Social Media)
- Enter URLs for Facebook, YouTube, TikTok, Instagram
- Enter phone number for Zalo

### Step 3: Save
Click the **"Lưu thông tin"** button at the bottom of the form.

## 📁 Where Files Are Saved

After uploading, files are saved to:
- **Logo**: `/public/images/logo.png`
- **Story Image**: `/public/images/our_story.webp`
- **Story Video**: `/public/images/our_story.{extension}`

You can access these files directly:
- Logo: `http://localhost:3000/images/logo.png`
- Story Image: `http://localhost:3000/images/our_story.webp`

## 🔍 How to View/Use the Data

### In Admin Panel
Just navigate to `/admin/settings` → "Thông tin công ty" tab to view and edit.

### In Your Frontend Code
```typescript
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { fetchCompanyInfo } from "@/lib/features/companyInfo/companyInfoSlice";
import { useEffect } from "react";

function AboutPage() {
  const dispatch = useAppDispatch();
  const { data: companyInfo, loading } = useAppSelector((state) => state.companyInfo);

  useEffect(() => {
    dispatch(fetchCompanyInfo());
  }, [dispatch]);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>{companyInfo?.companyName}</h1>
      <img src={companyInfo?.logoUrl} alt="Logo" />
      <p>{companyInfo?.slogan}</p>
      
      {/* Story Items */}
      {companyInfo?.storyItems?.map((item, index) => (
        <div key={index}>
          <h3>{item.title}</h3>
          <p>{item.detail}</p>
        </div>
      ))}
      
      {/* Milestones */}
      {companyInfo?.milestones?.map((milestone, index) => (
        <div key={index}>
          <span>{milestone.time}</span>
          <h4>{milestone.title}</h4>
          <p>{milestone.detail}</p>
        </div>
      ))}
      
      {/* Core Values */}
      {companyInfo?.coreValues?.map((value, index) => (
        <div key={index}>
          <h4>{value.title}</h4>
          <p>{value.detail}</p>
        </div>
      ))}
      
      {/* And so on... */}
    </div>
  );
}
```

### Via API
```javascript
// Fetch company info
const response = await fetch('/api/company-info');
const data = await response.json();
console.log(data);
```

## 📊 Data Structure Example

```json
{
  "id": 1,
  "companyName": "Công ty ABC",
  "logoUrl": "/images/logo.png",
  "slogan": "Chất lượng là uy tín",
  "storyTitle": "Hành trình phát triển",
  "storyDetail": "Từ năm 2020...",
  "storyImageUrl": "/images/our_story.webp",
  "storyVideoUrl": "/images/our_story.mp4",
  "storyItems": [
    { "title": "Khởi đầu", "detail": "..." },
    { "title": "Phát triển", "detail": "..." },
    { "title": "Mở rộng", "detail": "..." },
    { "title": "Tương lai", "detail": "..." }
  ],
  "milestones": [
    { "time": "2020", "title": "Thành lập", "detail": "..." },
    { "time": "2021", "title": "Mở rộng", "detail": "..." }
  ],
  "coreValues": [
    { "title": "Chất lượng", "detail": "..." },
    { "title": "Uy tín", "detail": "..." },
    { "title": "Sáng tạo", "detail": "..." },
    { "title": "Trách nhiệm", "detail": "..." }
  ],
  "mission": "Mang đến giải pháp tốt nhất...",
  "achievements": [
    { "title": "Giải thưởng A", "detail": "..." }
  ],
  "team": [
    { "amount": "50+", "title": "Nhân viên", "detail": "..." }
  ],
  "whyChooseUsTitle": "Tại sao chọn chúng tôi",
  "whyChooseUsDetail": "Chúng tôi cam kết...",
  "facebook": "https://facebook.com/...",
  "zalo": "0123456789",
  "youtube": "https://youtube.com/...",
  "tiktok": "https://tiktok.com/@...",
  "instagram": "https://instagram.com/..."
}
```

## ⚠️ Important Notes

### File Upload Limits
- **Logo**: Max 5MB (JPEG, PNG, WebP)
- **Story Image**: Max 10MB (auto-converts to WebP)
- **Story Video**: Max 1GB (any video format)

### Fixed vs Dynamic Arrays
- **Fixed (4 items)**: Story Items, Core Values
- **Dynamic (unlimited)**: Milestones, Achievements, Team

### File Overwrites
- Uploading a new logo will replace the old one
- Same for story image and video
- Old files are automatically deleted

### Default Data
- On first access, default placeholder data is created automatically
- You can edit and save your own data immediately

## 🐛 Troubleshooting

### "Đang tải..." never finishes
- Check if the database is running
- Check browser console for errors
- Verify API endpoints are accessible

### File upload fails
- Check file size limits
- Verify file type is correct
- Ensure `/public/images` directory exists

### Changes not saving
- Check browser console for errors
- Verify database connection
- Check Redux DevTools for state changes

### Can't see the tab
- Make sure you're on `/admin/settings`
- Check if the page has loaded completely
- Try refreshing the page

## 📞 Need Help?

Check these files for more details:
- `COMPANY_INFO_SETUP.md` - Full setup documentation
- `COMPANY_INFO_FEATURE_SUMMARY.md` - Technical implementation details

## ✅ Quick Checklist

- [ ] Navigate to `/admin/settings`
- [ ] Click "Thông tin công ty" tab
- [ ] Fill in basic information
- [ ] Upload logo
- [ ] Add story content and upload image/video
- [ ] Add story items (4 items)
- [ ] Add milestones
- [ ] Fill in core values (4 items)
- [ ] Enter mission
- [ ] Add achievements
- [ ] Add team information
- [ ] Fill in "Why Choose Us"
- [ ] Enter social media links
- [ ] Click "Lưu thông tin"
- [ ] Verify data is saved (refresh page)

## 🎉 That's It!

Your company information management system is ready to use. Start filling in your company's information now!
