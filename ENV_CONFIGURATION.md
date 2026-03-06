# Environment Configuration for Image Upload

## Required Environment Variable

Add this to your `.env` file:

```env
STORAGE_PATH=/public/images
```

## What is STORAGE_PATH?

`STORAGE_PATH` defines where uploaded banner images will be stored on your server.

### Default Value
If not specified, the default is `/public/images`

### Path Format
- Must be relative to the project root
- Should start with `/public` to be accessible via web
- Will be created automatically if it doesn't exist

## Examples

### Example 1: Default Configuration
```env
STORAGE_PATH=/public/images
```
- Images saved to: `project_root/public/images/`
- Accessible at: `http://yoursite.com/images/banner_123456.webp`

### Example 2: Separate Upload Directory
```env
STORAGE_PATH=/public/uploads/banners
```
- Images saved to: `project_root/public/uploads/banners/`
- Accessible at: `http://yoursite.com/uploads/banners/banner_123456.webp`

### Example 3: Year-based Organization
```env
STORAGE_PATH=/public/images/2026
```
- Images saved to: `project_root/public/images/2026/`
- Accessible at: `http://yoursite.com/images/2026/banner_123456.webp`

## Complete .env File Example

Here's a complete example of what your `.env` file should look like:

```env
# Database Configuration
DATABASE_URL="postgresql://user:password@localhost:5432/landing_page_db"

# Storage Configuration for Image Uploads
STORAGE_PATH=/public/images

# Optional: Node Environment
NODE_ENV=development
```

## Important Notes

### 1. Security
- The `STORAGE_PATH` must be within your project directory
- Never expose the `.env` file publicly
- The `.env` file is already in `.gitignore`

### 2. Public Access
- Only paths under `/public` are web-accessible
- Images in `/public/images` can be accessed at `/images/filename.webp`
- The `/public` prefix is automatically removed from URLs

### 3. Directory Creation
- The directory will be created automatically on first upload
- No manual setup required
- Ensure the application has write permissions

### 4. File Naming
- Files are automatically named: `banner_{timestamp}.webp`
- Example: `banner_1709712345678.webp`
- Timestamp ensures unique filenames

## Troubleshooting

### Issue: "Cannot create directory"
**Cause:** Application doesn't have write permissions

**Solution:**
```bash
# On Linux/Mac
chmod 755 public/images

# On Windows
# Right-click folder → Properties → Security → Edit permissions
```

### Issue: "Images not accessible"
**Cause:** Path is not under `/public`

**Solution:** Make sure `STORAGE_PATH` starts with `/public`

### Issue: "Path not found"
**Cause:** Typo in environment variable name

**Solution:** Variable must be exactly `STORAGE_PATH` (case-sensitive)

## Testing Your Configuration

### Step 1: Create .env file
```bash
# Create the file if it doesn't exist
touch .env

# Or on Windows
type nul > .env
```

### Step 2: Add the configuration
```env
STORAGE_PATH=/public/images
```

### Step 3: Restart the server
```bash
# Stop current server (Ctrl+C)
yarn dev
```

### Step 4: Test upload
1. Go to admin settings
2. Upload an image
3. Check that file appears in `public/images/`

## Verification

After uploading an image, verify:

```bash
# Check if directory was created
ls -la public/images

# You should see files like:
# banner_1709712345678.webp
# banner_1709712456789.webp
```

## Best Practices

### 1. Use Default Path
For most cases, the default `/public/images` is sufficient:
```env
STORAGE_PATH=/public/images
```

### 2. Organize by Type
If you have multiple upload types:
```env
STORAGE_PATH=/public/uploads/banners
PRODUCT_IMAGE_PATH=/public/uploads/products
```

### 3. Backup Strategy
Regularly backup the upload directory:
```bash
# Example backup command
tar -czf images_backup_$(date +%Y%m%d).tar.gz public/images/
```

### 4. CDN Integration (Future)
If you plan to use a CDN, keep the path simple:
```env
STORAGE_PATH=/public/images
```

## Production Considerations

### For Production Deployment

1. **Environment Variables**
   ```env
   STORAGE_PATH=/public/images
   NODE_ENV=production
   ```

2. **File Permissions**
   - Ensure web server can write to the directory
   - Set appropriate permissions (755 for directories, 644 for files)

3. **Storage Monitoring**
   - Monitor disk space usage
   - Implement cleanup for old/unused images

4. **CDN (Optional)**
   - Consider using a CDN for better performance
   - Upload to cloud storage (S3, Cloudinary, etc.)

## Summary

- **Variable Name:** `STORAGE_PATH`
- **Default Value:** `/public/images`
- **Required:** No (uses default if not set)
- **Format:** Relative path starting with `/public`
- **Auto-created:** Yes
- **File Pattern:** `banner_{timestamp}.webp`

## Quick Setup Commands

```bash
# 1. Create .env file
echo "STORAGE_PATH=/public/images" > .env

# 2. Add your database URL
echo "DATABASE_URL=your_database_url_here" >> .env

# 3. Restart server
yarn dev
```

That's it! Your image upload feature is now configured and ready to use.
