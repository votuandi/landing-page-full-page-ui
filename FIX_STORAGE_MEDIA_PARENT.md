# Fix: StorageMedia Records with parent=null After Service Creation

## Problem
After creating a service successfully, records in the `StorageMedia` table had `parent=null` instead of being associated with the created service ID.

## Root Cause
When uploading images/videos through the rich text editor during service creation:
1. The upload endpoint (`/api/services/upload-editor`) receives `serviceId=0` or `null` because the service doesn't exist yet
2. StorageMedia records are created with `parentId=null` and `parentType='service-text-editor'`
3. The service creation endpoint (`/api/services` POST) was not updating these orphaned records with the new service ID

## Solution
Updated the service API endpoints to extract media URLs from the service description and associate orphaned StorageMedia records with the service:

### Files Modified

#### 1. `src/app/api/services/route.ts` (POST endpoint)
Added logic after service creation to:
- Extract image URLs from `<img>` tags in the description
- Extract video URLs from `<video>` and `<source>` tags in the description
- Filter URLs that start with `/images/services/` or `/videos/services/`
- Convert URLs to storage paths (e.g., `/images/services/file.webp` → `public/images/services/file.webp`)
- Update StorageMedia records where `parentId=null` and `parentType='service-text-editor'` to set `parentId` to the new service ID

#### 2. `src/app/api/services/[id]/route.ts` (PUT endpoint)
Added the same logic for service updates to handle cases where:
- New media is added to an existing service
- The description is updated with new images/videos

## Implementation Details

### Pattern Used
This fix follows the same pattern already implemented for:
- News articles (`/api/news/route.ts` and `/api/news/[id]/route.ts`)
- Projects (`/api/projects/route.ts` and `/api/projects/[id]/route.ts`)

### Code Example
```typescript
// After creating the service
if (description) {
  try {
    const mediaUrls: string[] = [];
    
    // Extract image URLs from <img> tags
    const imgRegex = /<img[^>]+src=["']([^"']+)["']/g;
    let match;
    while ((match = imgRegex.exec(description)) !== null) {
      mediaUrls.push(match[1]);
    }
    
    // Extract video URLs from <video> and <source> tags
    const videoRegex = /<(?:video[^>]+src=["']([^"']+)["']|source[^>]+src=["']([^"']+)["'])/g;
    while ((match = videoRegex.exec(description)) !== null) {
      const url = match[1] || match[2];
      if (url) mediaUrls.push(url);
    }

    // Convert URLs to storage paths and update orphaned media records
    if (mediaUrls.length > 0) {
      const storagePaths = mediaUrls
        .filter(url => url.startsWith('/images/services/') || url.startsWith('/videos/services/'))
        .map(url => `public${url}`);

      if (storagePaths.length > 0) {
        await prisma.storageMedia.updateMany({
          where: {
            path: { in: storagePaths },
            parentId: null,
            parentType: 'service-text-editor'
          },
          data: {
            parentId: serviceRaw.id
          }
        });
      }
    }
  } catch (mediaError) {
    console.error('Error associating media files:', mediaError);
    // Don't fail the service creation if media association fails
  }
}
```

## Testing
To verify the fix:
1. Create a new service in the admin panel
2. Add images/videos using the rich text editor in the description field
3. Save the service
4. Check the `StorageMedia` table - records should now have `parentId` set to the service ID

## Database Schema Reference
```prisma
model StorageMedia {
  id         Int      @id @default(autoincrement())
  parentId   Int?
  type       String
  parentType String
  path       String
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@index([parentId, parentType])
  @@index([parentType])
}
```

## Benefits
- Proper tracking of media files associated with services
- Enables cleanup of unused media files
- Maintains data integrity between services and their media
- Consistent behavior across all entity types (news, projects, services)
