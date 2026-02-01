import { Request, Response } from 'express';
import { supabase } from '../services/db.service';

export const uploadController = {
    async uploadFile(req: Request, res: Response) {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }

            const file = req.file;
            const fileExt = file.originalname.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `cars/${fileName}`;

            // Use buffer directly from memory storage
            const fileBuffer = file.buffer;

            // Upload to Supabase Storage
            const { data, error } = await supabase.storage
                .from('images') // Ensure this bucket exists
                .upload(filePath, fileBuffer, {
                    contentType: file.mimetype,
                    upsert: false
                });

            if (error) throw error;

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('images')
                .getPublicUrl(filePath);

            res.json({ url: publicUrl });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
};
