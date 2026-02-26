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
        const promptText = `I am conducting a business survey and need to collect and structure shop details in a standardized format. Please organize the collected information strictly in the following format: 

Business Name: 
Owner Name(s): 
Phone Number(s): 
Address: 
City: 
Business Category: 
Basic Business Details: (Brief description of products/services, years in operation, number of employees, target customers, etc.) 

Ensure: 
- Phone numbers are written clearly with country code if available. 
- Address includes area/locality and PIN code if possible. 
- Business details are concise but informative (2–4 lines). 
- No field should be left blank. If information is unavailable, write “Not Provided”.`;

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
