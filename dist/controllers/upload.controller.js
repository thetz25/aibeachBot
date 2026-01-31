"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadController = void 0;
const db_service_1 = require("../services/db.service");
const fs_1 = __importDefault(require("fs"));
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
            // Read file buffer
            const fileBuffer = fs_1.default.readFileSync(file.path);
            // Upload to Supabase Storage
            const { data, error } = await db_service_1.supabase.storage
                .from('images') // Ensure this bucket exists
                .upload(filePath, fileBuffer, {
                contentType: file.mimetype,
                upsert: false
            });
            // Remove temp file
            fs_1.default.unlinkSync(file.path);
            if (error)
                throw error;
            // Get Public URL
            const { data: { publicUrl } } = db_service_1.supabase.storage
                .from('images')
                .getPublicUrl(filePath);
            res.json({ url: publicUrl });
        }
        catch (error) {
            // Cleanup if needed
            if (req.file)
                fs_1.default.unlinkSync(req.file.path);
            res.status(500).json({ error: error.message });
        }
    }
};
