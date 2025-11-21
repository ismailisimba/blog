// src/controllers/apiController.js
import { processAndUploadImage } from '../services/storage.js'; // <-- Use new function
import { prisma } from '../services/prisma.js';

export const handleFileUpload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    // Process and upload the image with default compression
    const { publicUrl, fileName } = await processAndUploadImage(
      req.file.buffer,
      req.file.originalname
    );

    // Save file metadata to the database
    await prisma.uploadedFile.create({
      data: { url: publicUrl, fileName: fileName, userId: req.user.id },
    });
    
    res.status(200).json({ url: publicUrl });

  } catch (error) {
    console.error('API File Upload Error:', error);
    res.status(500).json({ error: 'File upload failed.' });
  }
};
