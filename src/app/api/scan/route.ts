import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { GoogleGenerativeAI } from "@google/generative-ai";

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

        // Convert image to base64 for Gemini
        const buffer = Buffer.from(await image.arrayBuffer());
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
                imageUrl: 'https://placehold.co/400', // Mock URL for now
            },
        });

        return NextResponse.json(newItem);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to process image';
        console.error('Vision API Error:', error);
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
