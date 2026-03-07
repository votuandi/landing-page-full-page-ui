# Service Deletion with Complete Cleanup

## Overview
When a service is deleted, the system now performs a complete cleanup of all associated resources:
1. Deletes the main service image file from storage
2. Deletes all text editor media files (images/videos) from storage
3. Deletes all StorageMedia database records
4. Finally deletes the service record from the database

## Implementation Details

### API Endpoint
**DELETE** `/api/services/[id]`

### Deletion Process

The deletion follows this specific order to ensure data integrity:

```
1. Fetch service data (including image URL)
2. Fetch all StorageMedia records (parentId=service.id, parentType="service-text-editor")
3. Delete main service image file from storage
4. Delete all StorageMedia files from storage
5. Delete all StorageMedia database records
6. Delete service from database
```

### Code Location
`src/app/api/services/[id]/route.ts` - DELETE handler

### Key Features

#### 1. Main Service Image Deletion
- Deletes the file at `service.image` path
- Uses `deleteImageFile()` utility function
- Handles both local and external URLs (skips external)

#### 2. Text Editor Media Deletion
- Queries all StorageMedia records with:
  - `parentType: "service-text-editor"`
  - `parentId: service.id`
- Converts storage paths to public URLs
- Deletes each file from storage
- Removes all database records

#### 3. Path Conversion
StorageMedia records store paths in format: `public/images/...` or `public/videos/...`

The code converts these to public URLs by removing the `public` prefix:
```typescript
const publicUrl = record.path.replace(/^public/, '');
// "public/images/services/file.jpg" → "/images/services/file.jpg"
```

### Database Schema

#### Service Model
```prisma
model Service {
  id                    Int      @id @default(autoincrement())
  title                 String
  description           String?
  image                 String?  // Main service image
  // ... other fields
}
```

#### StorageMedia Model
```prisma
model StorageMedia {
  id         Int      @id @default(autoincrement())
  parentId   Int?     // References service.id
  type       String   // "image" or "video"
  parentType String   // "service-text-editor"
  path       String   // Storage path (e.g., "public/images/services/...")
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@index([parentId, parentType])
  @@index([parentType])
}
```

### Error Handling

The deletion process includes comprehensive error handling:

1. **Invalid ID**: Returns 400 if service ID is not a valid number
2. **Not Found**: Returns 404 if service doesn't exist
3. **File Deletion Failures**: Logged but don't stop the process
4. **Database Errors**: Returns 500 with error message

### File Deletion Utility

The `deleteImageFile()` function (from `src/lib/imageUtils.ts`):
- Skips external URLs (http://, https://)
- Checks if file exists before deletion
- Converts public URLs to filesystem paths
- Logs all operations for debugging
- Returns boolean success status

### Usage Example

```typescript
// Delete a service
const response = await fetch(`/api/services/${serviceId}`, {
  method: 'DELETE'
});

if (response.ok) {
  const result = await response.json();
  console.log(result.message); // "Service deleted successfully"
}
```

### Testing Checklist

When testing service deletion, verify:

- [ ] Main service image file is deleted from storage
- [ ] All text editor images are deleted from storage
- [ ] All text editor videos are deleted from storage
- [ ] All StorageMedia records are removed from database
- [ ] Service record is removed from database
- [ ] No orphaned files remain in storage
- [ ] No orphaned database records remain
- [ ] External URLs are skipped (not deleted)
- [ ] Proper error messages for invalid requests

### Related Files

- `src/app/api/services/[id]/route.ts` - Service deletion API
- `src/lib/imageUtils.ts` - File deletion utilities
- `prisma/schema.prisma` - Database schema
- `src/app/api/services/upload-editor/route.ts` - Text editor file upload

### Notes

1. **Order Matters**: Files are deleted before database records to prevent orphaned files
2. **Transaction Safety**: Consider wrapping in a database transaction for production
3. **Async Operations**: All file deletions are awaited to ensure completion
4. **Logging**: All operations are logged for debugging and auditing
5. **Graceful Failures**: File deletion failures don't prevent database cleanup

## Similar Implementations

The same pattern is used for:
- Product deletion (with text editor media)
- News deletion (with text editor media)
- Project deletion (with text editor media)
- Partner deletion (simple image only)
- Banner deletion (simple image only)

## Future Enhancements

Consider adding:
1. Database transactions for atomic operations
2. Soft delete with scheduled cleanup
3. Backup before deletion
4. Bulk deletion support
5. Deletion audit log
6. Rollback capability
