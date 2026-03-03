import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';

@Injectable()
export class AiService {
    private ai: GoogleGenAI;

    constructor(private configService: ConfigService) {
        const apiKey = this.configService.get<string>('GEMINI_API_KEY');
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY is not defined in the environment variables');
        }
        this.ai = new GoogleGenAI({
            apiKey,
            apiVersion: 'v1'
        });
        console.log('Gemini AI (New SDK) initialized with v1');
    }

    async analyzeImage(imageBuffer: Buffer, mimeType: string): Promise<string> {
        const promptText = `I am conducting a business survey and need to extract structured shop details from images. Please analyze the provided image and organize the information strictly in the following format. 

### FORMAT START ###
Business Name: 
Business Category: 
Business Sub Category: 
Phone: 
Alternate Phone: 
Email: 
Website: 
Contact Person Name: 
Contact Person Designation: 
Latitude: 
Longitude: 
Address Line 1: 
Address Line 2: 
Landmark: 
City: 
State: 
Pin Code: 
Country: 
### FORMAT END ###

Ensure: 
- **STRICT LABELS**: ONLY use the labels provided above. DO NOT add any extra labels like "Owner Name:", "Basic Business Details:", or "Address:".
- **NO SUMMARIES**: DO NOT provide descriptions, summaries, or conversational text. ONLY provide the extracted value itself.
- **FIELD ISOLATION**: DO NOT put address details in the Phone field. DO NOT put owner names in the Business Name field unless they are part of the shop name.
- **Multiple Phone Numbers**: If the image contains multiple phone numbers, put the first one in "Phone" and the second one in "Alternate Phone". DO NOT put both in one field.
- **Short/Long Addresses**: If the address is long or spans multiple lines, put the primary shop/house number and street in "Address Line 1" and the remaining locality/area details in "Address Line 2".
- If any information is not visible or identifiable in the image, write "Not Provided" for that field.
- For Latitude and Longitude, only provide them if they are explicitly written as text in the image (e.g., on a sign or board). Otherwise, write "Not Provided".
- For Country, if not found, default to "India" if the context suggests so, otherwise "Not Provided".
- Do not add any extra text, conversation, or markdown formatting outside of the requested labels.`;

        try {
            const response = await this.ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: [
                    {
                        role: 'user',
                        parts: [
                            { text: promptText },
                            {
                                inlineData: {
                                    data: imageBuffer.toString('base64'),
                                    mimeType,
                                },
                            },
                        ],
                    },
                ],
            });

            return response.text || 'No response from AI';
        } catch (error) {
            console.error('Error in Gemini AI analysis:', error);
            throw new InternalServerErrorException('Failed to analyze image with Gemini AI');
        }
    }

    async analyzeImageFromUrl(imageUrl: string): Promise<string> {
        try {
            const response = await fetch(imageUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch image from URL: ${imageUrl}`);
            }
            const buffer = Buffer.from(await response.arrayBuffer());
            const contentType = response.headers.get('content-type') || 'image/jpeg';
            return this.analyzeImage(buffer, contentType);
        } catch (error) {
            console.error('Error fetching/analyzing image from URL:', error);
            throw new InternalServerErrorException('Failed to analyze image from URL');
        }
    }
}
