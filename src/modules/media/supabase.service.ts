import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
    private client: SupabaseClient;
    private bucket: string;

    constructor(private configService: ConfigService) {
        const url = this.configService.get<string>('SUPABASE_URL');
        const key = this.configService.get<string>('SUPABASE_SERVICE_KEY');
        this.bucket = this.configService.get<string>('SUPABASE_BUCKET') || 'poi-images';

        if (!url || !key) {
            throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env');
        }

        this.client = createClient(url, key);
    }

    /**
     * Upload a file buffer to Supabase Storage
     * @param buffer - File buffer
     * @param mimeType - e.g. 'image/jpeg'
     * @param fileName - Already renamed file name e.g. PIXPE_20260221_8cce6c87_001.jpg
     * @returns public URL of the uploaded file
     */
    async uploadFile(buffer: Buffer, mimeType: string, fileName: string): Promise<string> {
        const { error } = await this.client.storage
            .from(this.bucket)
            .upload(fileName, buffer, {
                contentType: mimeType,
                upsert: false,
            });

        if (error) {
            throw new InternalServerErrorException(`Supabase upload failed: ${error.message}`);
        }

        const { data } = this.client.storage
            .from(this.bucket)
            .getPublicUrl(fileName);

        return data.publicUrl;
    }

    /**
     * Delete a file from Supabase Storage
     * @param fileName - Name of the file to delete
     */
    async deleteFile(fileName: string): Promise<void> {
        const { error } = await this.client.storage
            .from(this.bucket)
            .remove([fileName]);

        if (error) {
            throw new InternalServerErrorException(`Supabase delete failed: ${error.message}`);
        }
    }
}
