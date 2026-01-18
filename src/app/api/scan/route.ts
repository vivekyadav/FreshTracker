import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GoogleGenerativeAI } from "@google/generative-ai";
import sharp from 'sharp';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const image = formData.get('image') as File;

        if (!image) {
            return NextResponse.json({ error: 'No image provided' }, { status: 400 });
        }

        if (!process.env.GOOGLE_AI_API_KEY) {
            return NextResponse.json({ error: 'Google AI API Key not configured' }, { status: 500 });
        }

        // Convert image to buffer 
        const buffer = Buffer.from(await image.arrayBuffer() as ArrayBuffer);

        // Resize image with Sharp before uploading
        let processBuffer = buffer;
        try {
            processBuffer = await sharp(buffer)
                .resize(400, 400, { fit: 'inside', withoutEnlargement: true })
                .webp({ quality: 80 })
                .toBuffer();
        } catch (sharpError) {
            console.error('Sharp Processing Error:', sharpError);
        }

        // Upload to Cloudinary (Production Storage)
        let publicUrl = 'https://placehold.co/400';
        if (process.env.CLOUDINARY_CLOUD_NAME) {
            try {
                const uploadResult = await new Promise((resolve, reject) => {
                    cloudinary.uploader.upload_stream({
                        folder: 'freshtracker',
                        resource_type: 'image'
                    }, (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }).end(processBuffer);
                }) as any;
                publicUrl = uploadResult.secure_url;
            } catch (cloudError) {
                console.error('Cloudinary Upload Error:', cloudError);
            }
        }

        const base64Image = buffer.toString('base64');

        // Prepare the prompt and image parts for Gemini
        const prompt = `Identify the grocery or household item in this image. 
Be specific about its category.
Possible categories include: Fruit, Vegetable, Dairy, Meat, Bakery, Pantry, Snacks, Medicine, Beverages, Personal Care, Household.

Return ONLY a JSON object with this structure:
{
  "name": "Item Name",
  "category": "Item Category (use the list above)",
  "daysToExpire": number (an estimate of how many days until this item expires if bought fresh today, or 0 if it has no clear expiry)
}`;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Image,
                    mimeType: image.type,
                },
            },
        ]);

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

        // Add to database
        const newItem = await prisma.item.create({
            data: {
                name,
                category: category || 'General',
                quantity: 1,
                expiryDate,
                status: 'available',
                imageUrl: publicUrl,
            },
        });

        return NextResponse.json(newItem);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to process image';
        console.error('Vision API Error:', error);
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
