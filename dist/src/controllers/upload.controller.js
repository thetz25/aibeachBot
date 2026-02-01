"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadController = void 0;
const db_service_1 = require("../services/db.service");
exports.uploadController = {
    async uploadFile(req, res) {
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
            const { data, error } = await db_service_1.supabase.storage
                .from('images') // Ensure this bucket exists
                .upload(filePath, fileBuffer, {
                contentType: file.mimetype,
                upsert: false
            });
            if (error)
                throw error;
            // Get Public URL
            const { data: { publicUrl } } = db_service_1.supabase.storage
                .from('images')
                .getPublicUrl(filePath);
            res.json({ url: publicUrl });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};
