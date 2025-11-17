import { uploadFile } from '../services/storage.js';
import { prisma } from '../services/prisma.js';

export const handleFileUpload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const { publicUrl, fileName } = await uploadFile(req.file);

    // Save file metadata to the database
    await prisma.uploadedFile.create({
      data: {
        url: publicUrl,
        fileName: fileName,
        userId: req.user.id,
      },
    });


    // Send back the public URL in a JSON response
    res.status(200).json({ url: publicUrl });

  } catch (error) {
    console.error('API File Upload Error:', error);
    res.status(500).json({ error: 'File upload failed.' });
  }
};
