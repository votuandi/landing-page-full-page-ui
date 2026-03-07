# Projects Feature Documentation

## Overview
This document describes the public projects pages feature that allows visitors to browse all completed projects and view detailed information about individual projects.

## Created Files

### 1. `/src/app/projects/page.tsx`
- **Purpose**: Main projects listing page
- **Route**: `/projects`
- **Type**: Public page
- **Features**:
  - SEO-optimized with metadata
  - Server-side rendered
  - Displays all projects with filtering and pagination

### 2. `/src/app/projects/[slug]/page.tsx`
- **Purpose**: Individual project detail page
- **Route**: `/projects/[id]`
- **Type**: Public page (dynamic route)
- **Features**:
  - Dynamic metadata generation based on project data
  - Server-side data fetching
  - Displays comprehensive project information
  - 404 handling for non-existent projects

### 3. `/src/components/ProjectsPageContent.tsx`
- **Purpose**: Client component for projects listing page
- **Type**: Client component
- **Features**:
  - Search functionality (by title, description, location, client)
  - Category filtering
  - Pagination (9 projects per page)
  - Responsive grid layout (1/2/3 columns)
  - Loading states
  - Empty state handling
  - Statistics display
  - Call-to-action section
  - Links to project detail pages

### 4. `/src/components/ProjectDetailContent.tsx`
- **Purpose**: Client component for project detail page
- **Type**: Client component
- **Features**:
  - Breadcrumb navigation
  - Project header with category badge
  - Project information grid (location, capacity, completion date, client)
  - Featured image with error handling
  - Rich text detail content (HTML rendering)
  - Project highlights section
  - Social sharing buttons
  - Navigation buttons (back to projects, contact, view products)

## Modified Files

### 1. `/src/components/Header.tsx`
- **Change**: Added "Dự án" menu item
- **Location**: Between "Dịch vụ" and "Tin Tức"
- **Link**: `/projects`

### 2. `/src/components/ProjectsSection.tsx`
- **Changes**:
  - Added Link import
  - Made project cards clickable (link to detail page)
  - Updated CTA buttons to link to `/contact-us` and `/projects`

### 3. `/src/app/sitemap.ts`
- **Change**: Added `/projects` route to sitemap
- **Priority**: 0.8 (high priority)
- **Change Frequency**: Weekly

## API Integration

The feature integrates with existing API endpoints:

### GET `/api/projects`
- **Query Parameters**:
  - `limit`: Number of projects to fetch (default: 100)
  - `isDisplay`: Filter by display status (true/false)
  - `orderBy`: Sort field (completedDate, title, order, etc.)
  - `order`: Sort direction (asc/desc)
  - `search`: Search query
  - `category`: Filter by category

### GET `/api/projects/[id]`
- **Purpose**: Fetch single project by ID
- **Returns**: Project object with all fields

## Database Schema

The feature uses the existing `Project` model from Prisma schema:

```prisma
model Project {
  id             Int      @id @default(autoincrement())
  title          String
  location       String?
  capacity       String?
  completedDate  String?
  imageUrl       String?
  description    String?
  detail         String?  // Rich text content
  category       String   @default("Công nghiệp")
  client         String?
  isDisplay      Boolean  @default(true)
  showInHomepage Boolean  @default(false)
  order          Int      @default(0)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
```

## Features

### Projects Listing Page (`/projects`)
1. **Header Section**
   - Page title with gradient text
   - Description
   - Statistics (total projects, total capacity, customer satisfaction)

2. **Search & Filter Section**
   - Search input (searches title, description, location, client)
   - Category filter buttons (dynamic based on available categories)
   - Results count display

3. **Projects Grid**
   - Responsive grid (1/2/3 columns)
   - Project cards with:
     - Category badge
     - Featured image with hover effect
     - Location and completion date
     - Title
     - Description (truncated)
     - Capacity
     - "Chi tiết" button
   - Click anywhere on card to view details

4. **Pagination**
   - Previous/Next buttons
   - Page number buttons (max 5 visible)
   - Current page indicator

5. **Call-to-Action**
   - Gradient background
   - "Tư vấn miễn phí" button (links to contact page)
   - "Về chúng tôi" button (links to about page)

### Project Detail Page (`/projects/[id]`)
1. **Breadcrumb Navigation**
   - Home > Dự án > [Project Title]

2. **Project Header**
   - Category badge with color coding
   - Project title (large, bold)
   - Description
   - Information grid:
     - Location (with icon)
     - Capacity (with icon)
     - Completion date (with icon)
     - Client (with icon)

3. **Featured Image**
   - Large hero image
   - Error handling with placeholder

4. **Project Details**
   - Rich HTML content rendering
   - Styled with prose classes
   - Images and videos supported

5. **Project Highlights**
   - Gradient background section
   - 4 key benefits with icons:
     - Cost savings
     - Environmental friendly
     - Long warranty
     - 24/7 technical support

6. **Social Sharing**
   - Twitter, Facebook, WhatsApp buttons

7. **Navigation & CTA**
   - Back to projects button
   - Contact consultation button
   - View products button

## Styling

### Color Coding by Category
- **Công nghiệp**: Blue (bg-blue-100 text-blue-800)
- **Dân dụng**: Green (bg-green-100 text-green-800)
- **Thương mại**: Orange (bg-orange-100 text-orange-800)
- **Giáo dục**: Purple (bg-purple-100 text-purple-800)
- **Du lịch**: Pink (bg-pink-100 text-pink-800)

### Responsive Design
- Mobile: 1 column grid, simplified layout
- Tablet: 2 columns grid
- Desktop: 3 columns grid

### Animations & Transitions
- Hover effects on cards (shadow, scale, image zoom)
- Smooth transitions (300ms duration)
- Button hover states
- Loading spinner

## SEO Optimization

### Projects Listing Page
- Title: "Dự án năng lượng mặt trời | Trọng Tín Solar"
- Description: Comprehensive description of projects
- Keywords: Energy-related keywords

### Project Detail Page
- Dynamic title: "[Project Title] | Trọng Tín Solar"
- Dynamic description: Based on project description
- Dynamic keywords: Includes project title, category, location
- OpenGraph metadata for social sharing

## Navigation Integration

The projects page is accessible from:
1. **Main Navigation**: "Dự án" menu item
2. **Home Page**: "Xem thêm dự án" button in ProjectsSection
3. **Project Cards**: Click on any project card (home or projects page)
4. **Breadcrumbs**: On detail pages

## User Flow

```
Home Page
  ↓
  → Click "Dự án" in navigation → Projects Listing Page
  → Click "Xem thêm dự án" in ProjectsSection → Projects Listing Page
  
Projects Listing Page
  ↓
  → Search/Filter projects
  → Browse paginated results
  → Click on project card → Project Detail Page
  
Project Detail Page
  ↓
  → View project information
  → Read detailed content
  → Share on social media
  → Click "Liên hệ tư vấn" → Contact Page
  → Click "Xem sản phẩm" → Products Page
  → Click "Quay lại dự án" → Projects Listing Page
```

## Future Enhancements

Potential improvements for the feature:
1. Add image gallery/carousel for multiple project images
2. Implement related projects section
3. Add project timeline visualization
4. Include customer testimonials
5. Add map integration for project locations
6. Implement advanced filtering (by capacity range, date range)
7. Add sorting options (by date, capacity, alphabetical)
8. Include project statistics and metrics
9. Add print/download PDF functionality
10. Implement project comparison feature

## Testing Checklist

- [ ] Projects listing page loads correctly
- [ ] Search functionality works
- [ ] Category filtering works
- [ ] Pagination works correctly
- [ ] Project cards are clickable
- [ ] Project detail page loads with correct data
- [ ] 404 page shows for non-existent projects
- [ ] Images load correctly with error handling
- [ ] Responsive design works on all screen sizes
- [ ] Navigation links work correctly
- [ ] SEO metadata is correct
- [ ] Social sharing buttons work
- [ ] Loading states display correctly
- [ ] Empty states display correctly

## Maintenance Notes

- Project data is fetched from `/api/projects` endpoint
- Images should be stored in `/public/images/projects/` directory
- Rich text content supports HTML formatting
- Category colors can be customized in `getCategoryColor` function
- Pagination size can be adjusted in `projectsPerPage` constant
- Statistics in header can be updated to reflect actual data
