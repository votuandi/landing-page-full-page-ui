# Company Information Management - Architecture Overview

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Admin Panel UI                          │
│                   /admin/settings (Settings Page)               │
│                                                                 │
│  ┌─────────┬─────────┬──────────┬─────────┬──────────────────┐│
│  │ Banner  │  Intro  │ Database │ Partners│  Thông tin công ty││
│  └─────────┴─────────┴──────────┴─────────┴──────────────────┘│
│                                              ▼                   │
│                                    ┌──────────────────────┐     │
│                                    │ CompanyInfoForm      │     │
│                                    │ Component            │     │
│                                    └──────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Redux State Management                      │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  companyInfoSlice                                         │  │
│  │  ├─ State: data, loading, saving, errors                 │  │
│  │  ├─ Actions: fetchCompanyInfo, updateCompanyInfo         │  │
│  │  └─ Thunks: uploadLogo, uploadStoryImage, uploadVideo   │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API Layer                               │
│                                                                 │
│  ┌────────────────────┐  ┌──────────────────────────────────┐ │
│  │ /api/company-info  │  │  File Upload APIs                 │ │
│  │                    │  │  ├─ /upload-logo                  │ │
│  │ GET  - Fetch       │  │  ├─ /upload-story-image          │ │
│  │ PUT  - Update      │  │  └─ /upload-story-video          │ │
│  │ POST - Create      │  │                                   │ │
│  └────────────────────┘  └──────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                     │
                    ┌────────────────┴────────────────┐
                    ▼                                 ▼
┌──────────────────────────────┐    ┌──────────────────────────┐
│      Database (PostgreSQL)    │    │    File System           │
│                              │    │                          │
│  ┌────────────────────────┐  │    │  /public/images/         │
│  │  CompanyInfo Table     │  │    │  ├─ logo.png            │
│  │                        │  │    │  ├─ our_story.webp      │
│  │  - Basic Info          │  │    │  └─ our_story.{ext}     │
│  │  - Story Data (JSON)   │  │    │                          │
│  │  - Milestones (JSON)   │  │    └──────────────────────────┘
│  │  - Core Values (JSON)  │  │
│  │  - Achievements (JSON) │  │
│  │  - Team (JSON)         │  │
│  │  - Social Media        │  │
│  └────────────────────────┘  │
└──────────────────────────────┘
```

## 📊 Data Flow Diagram

### Read Flow (Fetching Data)
```
User Opens Tab
      │
      ▼
CompanyInfoForm
      │
      ├─ useEffect triggers
      │
      ▼
dispatch(fetchCompanyInfo())
      │
      ▼
Redux Thunk
      │
      ▼
GET /api/company-info
      │
      ▼
Prisma Query
      │
      ▼
Database
      │
      ▼
Response JSON
      │
      ▼
Redux State Update
      │
      ▼
Component Re-render
      │
      ▼
Form Populated with Data
```

### Write Flow (Saving Data)
```
User Fills Form
      │
      ▼
Local State Updates (updateLocalField)
      │
      ▼
User Clicks "Lưu thông tin"
      │
      ▼
dispatch(updateCompanyInfo(data))
      │
      ▼
Redux Thunk
      │
      ▼
PUT /api/company-info
      │
      ▼
Prisma Update/Create
      │
      ▼
Database
      │
      ▼
Response JSON
      │
      ▼
Redux State Update
      │
      ▼
Success Message
```

### File Upload Flow
```
User Selects File
      │
      ▼
File Preview (for images)
      │
      ▼
User Clicks "Tải lên"
      │
      ▼
dispatch(uploadLogo/Image/Video(file))
      │
      ▼
Redux Thunk
      │
      ▼
FormData Creation
      │
      ▼
POST /api/company-info/upload-{type}
      │
      ├─ Validate file type
      ├─ Validate file size
      ├─ Delete old file
      ├─ Process file (optimize for images)
      └─ Save to file system
      │
      ▼
Return file URL
      │
      ▼
Redux State Update (logoUrl/imageUrl/videoUrl)
      │
      ▼
Form Shows New URL
```

## 🗂️ File Structure

```
landing-page-full-page-ui/
│
├── prisma/
│   └── schema.prisma                    # CompanyInfo model
│
├── src/
│   ├── app/
│   │   ├── (admin)/
│   │   │   └── admin/
│   │   │       └── settings/
│   │   │           └── page.tsx         # Settings page with tabs
│   │   │
│   │   └── api/
│   │       └── company-info/
│   │           ├── route.ts             # Main CRUD API
│   │           ├── upload-logo/
│   │           │   └── route.ts         # Logo upload
│   │           ├── upload-story-image/
│   │           │   └── route.ts         # Story image upload
│   │           └── upload-story-video/
│   │               └── route.ts         # Story video upload
│   │
│   ├── components/
│   │   └── CompanyInfoForm.tsx          # Main form component
│   │
│   └── lib/
│       ├── features/
│       │   └── companyInfo/
│       │       └── companyInfoSlice.ts  # Redux slice
│       │
│       └── store.ts                     # Redux store config
│
└── public/
    └── images/
        ├── logo.png                     # Company logo
        ├── our_story.webp              # Story image
        └── our_story.{ext}             # Story video
```

## 🔄 Component Hierarchy

```
SettingsPage
│
├── Tab Navigation
│   ├── Banner Tab
│   ├── Introduction Tab
│   ├── Database Tab
│   ├── Partners Tab
│   └── Company Info Tab ← NEW
│       │
│       └── CompanyInfoForm
│           │
│           ├── Basic Information Section
│           │   ├── Company Name Input
│           │   ├── Slogan Input
│           │   └── Logo Upload
│           │
│           ├── Story Section
│           │   ├── Title Input
│           │   ├── Detail Textarea
│           │   ├── Image Upload
│           │   ├── Video Upload
│           │   └── Story Items Array (4)
│           │       └── Item (Title + Detail)
│           │
│           ├── Milestones Section
│           │   └── Milestone Array (Dynamic)
│           │       └── Item (Time + Title + Detail)
│           │
│           ├── Core Values Section
│           │   └── Value Array (4 Fixed)
│           │       └── Item (Title + Detail)
│           │
│           ├── Mission Section
│           │   └── Mission Textarea
│           │
│           ├── Achievements Section
│           │   └── Achievement Array (Dynamic)
│           │       └── Item (Title + Detail)
│           │
│           ├── Team Section
│           │   └── Team Array (Dynamic)
│           │       └── Item (Amount + Title + Detail)
│           │
│           ├── Why Choose Us Section
│           │   ├── Title Input
│           │   └── Detail Textarea
│           │
│           ├── Social Media Section
│           │   ├── Facebook Input
│           │   ├── Zalo Input
│           │   ├── YouTube Input
│           │   ├── TikTok Input
│           │   └── Instagram Input
│           │
│           └── Save Button
```

## 🔐 Security Architecture

```
┌─────────────────────────────────────────┐
│         Client Side Validation          │
│  ├─ File type check                    │
│  ├─ File size check                    │
│  └─ Required field validation          │
└─────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│         Server Side Validation          │
│  ├─ File type validation               │
│  ├─ File size validation               │
│  ├─ MIME type check                    │
│  ├─ Path traversal prevention          │
│  └─ Input sanitization                 │
└─────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│         Database Layer                  │
│  ├─ Prisma ORM (SQL injection safe)   │
│  ├─ Type checking                      │
│  └─ Transaction support                │
└─────────────────────────────────────────┘
```

## 📦 Dependencies

### Runtime Dependencies
- `@prisma/client` - Database ORM
- `@reduxjs/toolkit` - State management
- `react-redux` - React bindings for Redux
- `sharp` - Image processing
- `next` - Framework

### Dev Dependencies
- `prisma` - Database toolkit
- `typescript` - Type safety
- `@types/*` - Type definitions

## 🎯 API Endpoints Summary

| Endpoint | Method | Purpose | Max Size | Output |
|----------|--------|---------|----------|--------|
| `/api/company-info` | GET | Fetch company info | - | JSON |
| `/api/company-info` | PUT | Update company info | - | JSON |
| `/api/company-info` | POST | Create company info | - | JSON |
| `/api/company-info/upload-logo` | POST | Upload logo | 5MB | Logo URL |
| `/api/company-info/upload-story-image` | POST | Upload story image | 10MB | Image URL |
| `/api/company-info/upload-story-video` | POST | Upload story video | 1GB | Video URL |

## 🗄️ Database Schema

```sql
CREATE TABLE "CompanyInfo" (
  "id" SERIAL PRIMARY KEY,
  "companyName" TEXT NOT NULL,
  "logoUrl" TEXT,
  "slogan" TEXT,
  "storyTitle" TEXT,
  "storyDetail" TEXT,
  "storyImageUrl" TEXT,
  "storyVideoUrl" TEXT,
  "storyItems" JSONB,
  "milestones" JSONB,
  "coreValues" JSONB,
  "mission" TEXT,
  "achievements" JSONB,
  "team" JSONB,
  "whyChooseUsTitle" TEXT,
  "whyChooseUsDetail" TEXT,
  "facebook" TEXT,
  "zalo" TEXT,
  "youtube" TEXT,
  "tiktok" TEXT,
  "instagram" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);
```

## 🔄 State Management Flow

```
┌─────────────────────────────────────────┐
│         Redux Store                     │
│                                         │
│  companyInfo: {                        │
│    data: CompanyInfo | null,           │
│    loading: boolean,                   │
│    saving: boolean,                    │
│    error: string | null,               │
│    uploadingLogo: boolean,             │
│    uploadingStoryImage: boolean,       │
│    uploadingStoryVideo: boolean        │
│  }                                     │
└─────────────────────────────────────────┘
                  │
                  ├─ Selectors (useAppSelector)
                  │
                  └─ Actions (useAppDispatch)
                      ├─ fetchCompanyInfo()
                      ├─ updateCompanyInfo()
                      ├─ uploadLogo()
                      ├─ uploadStoryImage()
                      ├─ uploadStoryVideo()
                      └─ updateLocalField()
```

## 🎨 UI Component Breakdown

### Form Sections (8 sections)
1. **Basic Info** - 3 fields + 1 upload
2. **Story** - 2 fields + 2 uploads + 4 items
3. **Milestones** - Dynamic array
4. **Core Values** - 4 fixed items
5. **Mission** - 1 field
6. **Achievements** - Dynamic array
7. **Team** - Dynamic array
8. **Why Choose Us** - 2 fields
9. **Social Media** - 5 fields

### Interactive Elements
- 📝 Text inputs (14)
- 📄 Textareas (8)
- 📁 File uploads (3)
- ➕ Add buttons (4)
- 🗑️ Remove buttons (Dynamic)
- 💾 Save button (1)

## 🚀 Performance Considerations

### Client Side
- Local state updates (instant feedback)
- Image preview (before upload)
- Lazy loading sections
- Debounced inputs (can be added)

### Server Side
- Image optimization with Sharp
- WebP conversion (smaller files)
- File size validation
- Efficient database queries

### Database
- Single record pattern (fast queries)
- JSON fields for complex data
- Indexed primary key
- Automatic timestamps

## 📈 Scalability

### Current Implementation
- Single company info record
- File-based storage for media
- In-memory state management

### Future Scalability Options
- Multi-company support (add companyId)
- Cloud storage (S3, Cloudinary)
- CDN for static assets
- Caching layer (Redis)
- Background job processing for large files

## ✅ Quality Assurance

### Type Safety
- ✅ Full TypeScript implementation
- ✅ Prisma type generation
- ✅ Redux type inference
- ✅ API response typing

### Error Handling
- ✅ Client-side validation
- ✅ Server-side validation
- ✅ Try-catch blocks
- ✅ User-friendly error messages

### Code Quality
- ✅ No linting errors
- ✅ Consistent naming
- ✅ Modular architecture
- ✅ Reusable components

This architecture provides a solid foundation for managing company information with room for future enhancements and scalability.
