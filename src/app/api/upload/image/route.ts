import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import sharp from 'sharp'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('image') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.' },
        { status: 400 }
      )
    }

    // Get storage path from environment or use default
    const storagePath = process.env.STORAGE_PATH || '/public/images'
    const publicPath = storagePath.replace('/public', '')
    
    // Create full directory path
    const uploadDir = path.join(process.cwd(), storagePath)
    
    // Ensure directory exists
    try {
      await mkdir(uploadDir, { recursive: true })
    } catch (error) {
      console.error('Error creating directory:', error)
    }

    // Generate filename with current timestamp
    const timestamp = Date.now()
    const filename = `banner_${timestamp}.webp`
    const filepath = path.join(uploadDir, filename)

    // Convert image to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Convert to WebP format using sharp
    const webpBuffer = await sharp(buffer)
      .webp({ quality: 85 }) // High quality WebP
      .toBuffer()

    // Save the file
    await writeFile(filepath, webpBuffer)

    // Return the public URL path
    const imageUrl = `${publicPath}/${filename}`

    return NextResponse.json(
      { 
        success: true,
        imageUrl,
        filename,
        size: webpBuffer.length
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error uploading image:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { 
        error: 'Failed to upload image',
        message: errorMessage
      },
      { status: 500 }
    )
  }
}
