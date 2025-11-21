// src/controllers/fileController.js
import { getFileStream } from '../services/storage.js';

export const serveFile = async (req, res) => {
  try {
    const fileName = req.params.filename;

    // Optional: Add validation here if you only want specific users to access files
    // For now, we are just hiding the bucket source.

    // Create a read stream from GCS
    const readStream = getFileStream(fileName);

    // Handle errors (e.g., file not found)
    readStream.on('error', (err) => {
      if (err.code === 404) {
        return res.status(404).send('File not found');
      }
      console.error('File Stream Error:', err);
      return res.status(500).send('Error retrieving file');
    });

    // Set appropriate headers
    // We assume images are JPEGs based on your upload logic. 
    // If you allow other types, you might need to store/lookup the mimetype.
    res.setHeader('Content-Type', 'image/jpeg');
    
    // Cache the image for 1 year to reduce hits to your server/GCS
    res.setHeader('Cache-Control', 'public, max-age=31536000');

    // Pipe the GCS stream directly to the Express response
    readStream.pipe(res);

  } catch (error) {
    console.error('Serve File Error:', error);
    res.status(500).send('Internal Server Error');
  }
};
