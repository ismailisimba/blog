import { uploadFile } from '../services/storage.js';

export const handleFileUpload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const publicUrl = await uploadFile(req.file);

    // Send back the public URL in a JSON response
    res.status(200).json({ url: publicUrl });

  } catch (error) {
    console.error('API File Upload Error:', error);
    res.status(500).json({ error: 'File upload failed.' });
  }
};
