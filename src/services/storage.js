import { Storage } from '@google-cloud/storage';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// This automatically uses the GOOGLE_APPLICATION_CREDENTIALS env var
const storage = new Storage();

const bucketName = process.env.GCS_BUCKET_NAME;
const bucket = storage.bucket(bucketName);

/**
 * Uploads a file to Google Cloud Storage.
 * @param {object} file - The file object from multer (req.file).
 * @returns {Promise<string>} - A promise that resolves to the public URL of the uploaded file.
 */
export function uploadFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject('No file provided.');
    }

    // Create a unique filename
    const destFileName = `${Date.now()}-${file.originalname}`;
    const blob = bucket.file(destFileName);

    const blobStream = blob.createWriteStream({
      resumable: false,
    });

    blobStream.on('error', (err) => reject(err));

    blobStream.on('finish', () => {
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
      resolve(publicUrl);
    });

    blobStream.end(file.buffer);
  });
}
