# Database Seeding Guide

## Overview
This guide explains how to seed the database with sample data for testing and development purposes.

## Available Seed Endpoints

### 1. Seed Banners
**Endpoint**: `POST /api/seed`

Seeds 4 sample banners for the homepage slider.

**Usage**:
```bash
curl -X POST http://localhost:3000/api/seed
```

**Response**:
```json
{
  "message": "Successfully seeded 4 banners"
}
```

---

### 2. Seed Projects
**Endpoint**: `POST /api/seed/projects`

Seeds 20 sample solar energy projects with diverse categories and locations.

**Usage**:
```bash
curl -X POST http://localhost:3000/api/seed/projects
```

**Response**:
```json
{
  "message": "Successfully seeded 20 out of 20 projects",
  "created": 20,
  "total": 20
}
```

**Check Status**:
```bash
curl http://localhost:3000/api/seed/projects
```

**Response**:
```json
{
  "message": "Project seeding endpoint",
  "currentProjectCount": 26,
  "info": "Use POST method to seed 20 projects"
}
```

---

## Seeded Project Details

The seed creates 20 diverse projects across 5 categories:

### Categories Distribution:
- **Công nghiệp** (Industrial): 5 projects
  - Manufacturing plants, textile factories, food processing
  - Capacity range: 40kW - 90kW

- **Dân dụng** (Residential): 4 projects
  - Villas, townhouses, garden houses
  - Capacity range: 8kW - 15kW

- **Thương mại** (Commercial): 5 projects
  - Shopping centers, supermarkets, logistics centers, restaurants
  - Capacity range: 100kW - 150kW

- **Giáo dục** (Education): 4 projects
  - Schools, kindergartens, universities
  - Capacity range: 25kW - 35kW

- **Du lịch** (Tourism): 2 projects
  - Hotels, resorts, homestays
  - Capacity range: 45kW - 75kW

### Project Attributes:
Each project includes:
- **Title**: Descriptive project name
- **Location**: City/district in Vietnam
- **Capacity**: Power capacity (kWp)
- **Completed Date**: Month/Year format
- **Image URL**: Placeholder path
- **Description**: Brief project summary
- **Detail**: HTML formatted detailed description
- **Category**: Project type
- **Client**: Customer name
- **Display Settings**: 
  - `isDisplay: true` (all projects)
  - `showInHomepage: true` (first 3 projects only)
- **Order**: Sequential ordering (1-20)

### Geographic Distribution:
Projects are spread across major cities in Vietnam:
- Ho Chi Minh City (multiple districts)
- Da Nang
- Can Tho
- Binh Duong
- Dong Nai
- Long An
- Da Lat
- Phu Quoc
- Vung Tau

---

## Running Seeds in Development

### Method 1: Using cURL
```bash
# Seed banners
curl -X POST http://localhost:3000/api/seed

# Seed projects
curl -X POST http://localhost:3000/api/seed/projects
```

### Method 2: Using Browser
Navigate to:
- Banners: Not recommended (use cURL)
- Projects: Not recommended (use cURL)

### Method 3: Using API Client (Postman/Insomnia)
1. Create a new POST request
2. Set URL to `http://localhost:3000/api/seed/projects`
3. Send request
4. Check response for success message

---

## Clearing Seeded Data

To clear projects from the database, you can use Prisma Studio or create a custom endpoint:

### Using Prisma Studio:
```bash
npx prisma studio
```
Then manually delete projects from the UI.

### Using Database Query:
```bash
npx prisma db execute --stdin <<EOF
DELETE FROM "Project";
EOF
```

---

## Production Considerations

⚠️ **Warning**: These seed endpoints should be disabled or protected in production!

### Recommendations:
1. Add authentication/authorization to seed endpoints
2. Disable seed routes in production environment
3. Use environment variables to control seed availability
4. Consider creating a separate admin panel for data management

### Example Protection:
```typescript
// In route.ts
export async function POST() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Seeding is disabled in production' },
      { status: 403 }
    )
  }
  // ... seeding logic
}
```

---

## Customizing Seed Data

To add or modify seed data:

1. Open `/src/app/api/seed/projects/route.ts`
2. Modify the `projects` array
3. Add/remove/edit project objects
4. Save and re-run the seed endpoint

### Project Object Structure:
```typescript
{
  title: string,           // Project name
  location: string,        // City/district
  capacity: string,        // e.g., "50 kWp"
  completedDate: string,   // e.g., "12/2023"
  imageUrl: string,        // Path to image
  description: string,     // Brief description
  detail: string,          // HTML content
  category: string,        // Category name
  client: string,          // Client name
  isDisplay: boolean,      // Show on website
  showInHomepage: boolean, // Show on homepage
  order: number,           // Display order
}
```

---

## Troubleshooting

### Issue: "Failed to seed projects"
**Possible causes**:
- Database connection error
- Prisma client not generated
- Database schema mismatch

**Solutions**:
```bash
# Regenerate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Restart development server
npm run dev
```

### Issue: Duplicate projects
**Solution**: The seed endpoint doesn't clear existing data. If you want to start fresh:
1. Delete existing projects manually
2. Run the seed endpoint again

### Issue: Images not showing
**Note**: The seed uses placeholder image paths. You need to:
1. Add actual images to `/public/images/projects/`
2. Or update the `imageUrl` in the seed data
3. Or use a default placeholder image

---

## Next Steps

After seeding:
1. Visit `/projects` to see the projects listing page
2. Click on any project to view details
3. Test search and filtering functionality
4. Verify responsive design on different devices
5. Check SEO metadata in browser dev tools

---

## Related Documentation

- [Projects Feature Documentation](./PROJECTS_FEATURE.md)
- [API Documentation](./README.md#api-routes)
- [Database Schema](./prisma/schema.prisma)
