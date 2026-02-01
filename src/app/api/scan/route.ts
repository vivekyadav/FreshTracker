import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GoogleGenerativeAI } from "@google/generative-ai";
import sharp from 'sharp';
import { v2 as cloudinary } from 'cloudinary';
import { auth } from '@/auth';

// Configure Cloudinary - supporting both individual keys and the combined URL
if (process.env.CLOUDINARY_URL) {
    cloudinary.config(true); // Automatically uses CLOUDINARY_URL from env
} else {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

async function processImage(file: File): Promise<{ buffer: Buffer; processedBuffer: Buffer; mimeType: string }> {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let processedBuffer: Buffer = buffer;
    try {
        processedBuffer = await sharp(buffer)
            .resize(400, 400, { fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 80 })
            .toBuffer();
    } catch (sharpError) {
        console.error('Sharp Processing Error:', sharpError);
    }

    return { buffer, processedBuffer, mimeType: file.type };
}

async function uploadToCloudinary(buffer: Buffer): Promise<string | null> {
    const isCloudinaryConfigured = process.env.CLOUDINARY_URL || process.env.CLOUDINARY_CLOUD_NAME;

    if (!isCloudinaryConfigured) return null;

    try {
        const uploadResult = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream({
                folder: 'freshtracker',
                resource_type: 'image'
            }, (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }).end(buffer);
        }) as any;
        return uploadResult.secure_url;
    } catch (cloudError) {
        console.error('Cloudinary Upload Error:', cloudError);
        return null;
    }
}

export async function POST(request: Request) {
    try {
        const formData = await request.formData();

        // Support both 'images' (multiple) and 'image' (single, backwards compatible)
        let imageFiles: File[] = formData.getAll('images') as File[];
        if (imageFiles.length === 0) {
            const singleImage = formData.get('image') as File;
            if (singleImage) {
                imageFiles = [singleImage];
            }
        }

        if (imageFiles.length === 0) {
            return NextResponse.json({ error: 'No images provided' }, { status: 400 });
        }

        if (!process.env.GOOGLE_AI_API_KEY) {
            return NextResponse.json({ error: 'Google AI API Key not configured' }, { status: 500 });
        }

        // Process all images in parallel
        const processedImages = await Promise.all(imageFiles.map(processImage));

        // Upload first image to Cloudinary (for storage)
        const publicUrl = await uploadToCloudinary(processedImages[0].processedBuffer);

        // Prepare image parts for Gemini (all images)
        const imageParts = processedImages.map(({ buffer, mimeType }) => ({
            inlineData: {
                data: buffer.toString('base64'),
                mimeType,
            },
        }));

        // Updated prompt for multi-image analysis
        const prompt = `I'm sending you ${imageFiles.length} image${imageFiles.length > 1 ? 's' : ''} of the same grocery or household item${imageFiles.length > 1 ? ' from different angles' : ''}.

Please analyze ALL images together to identify the item. Look for:
- Product name (check labels, packaging text)
- Category (Fruit, Vegetable, Dairy, Meat, Bakery, Pantry, Snacks, Medicine, Beverages, Personal Care, Household)
- Expiry date (look for "Best By", "Use By", "Exp", "BB", dates on packaging)

IMPORTANT: Combine information from ALL images to get the most complete picture.
If you find an expiry date in any image, calculate how many days from today (${new Date().toISOString().split('T')[0]}) until that date.

Return ONLY a JSON object with this structure:
{
  "name": "Product Name",
  "category": "Category from list above",
  "daysToExpire": number (days until expiry, or estimate if no date visible),
  "expiryDateFound": true/false (whether you found an actual expiry date)
}`;

        const result = await model.generateContent([prompt, ...imageParts]);

        const response = await result.response;
        const text = response.text();

        // Extract JSON from response (handling potential markdown formatting)
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('Failed to parse AI response');
        }

        const itemInfo = JSON.parse(jsonMatch[0]);
        const { name, category, daysToExpire } = itemInfo;

        if (!name) {
            throw new Error('Could not identify item');
        }

        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + (daysToExpire || 7));

        const session = await auth();

        let newItem;
        // User Mode: Save to Database
        if (session?.user?.id) {
            newItem = await prisma.item.create({
                data: {
                    name,
                    category: category || 'General',
                    quantity: 1,
                    expiryDate,
                    status: 'available',
                    imageUrl: publicUrl,
                    userId: session.user.id
                },
            });
        }
        // Guest Mode: Return Analysis Only (Ephemeral)
        else {
            newItem = {
                id: -1, // Temporary ID
                name,
                category: category || 'General',
                quantity: 1,
                expiryDate,
                status: 'available',
                imageUrl: publicUrl,
                isGuest: true
            };
        }

        return NextResponse.json(newItem);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to process images';
        console.error('Vision API Error:', error);
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
