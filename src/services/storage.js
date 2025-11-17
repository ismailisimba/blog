import { Storage } from '@google-cloud/storage';

const storage = new Storage();
const bucketName = process.env.GCS_BUCKET_NAME;
const bucket = storage.bucket(bucketName);

/**
 * Uploads a file to Google Cloud Storage.
 * @param {object} file - The file object from multer (req.file).
 * @returns {Promise<{publicUrl: string, fileName: string}>} - A promise that resolves to an object with the public URL and the unique filename.
 */
export function uploadFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject('No file provided.');
    }

    // Create a unique filename and sanitize spaces
    const destFileName = `${Date.now()}-${file.originalname.replace(/\s/g, '_')}`;
    const blob = bucket.file(destFileName);

    const blobStream = blob.createWriteStream({
      resumable: false,
    });

    blobStream.on('error', (err) => reject(err));

    blobStream.on('finish', () => {
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
      resolve({ publicUrl, fileName: destFileName });
    });

    blobStream.end(file.buffer);
  });
}

/**
 * Deletes a file from Google Cloud Storage.
 * @param {string} fileName - The name of the file to delete in the GCS bucket.
 * @returns {Promise<void>} - A promise that resolves when the file is deleted.
 */
export async function deleteFile(fileName) {
    if (!fileName) {
        throw new Error('No filename provided for deletion.');
    }
    try {
        await bucket.file(fileName).delete();
        console.log(`Successfully deleted ${fileName} from GCS.`);
    } catch (error) {
        console.error(`Failed to delete ${fileName} from GCS:`, error);
        throw error;
    }
}
