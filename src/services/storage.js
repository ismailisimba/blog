import { Storage } from '@google-cloud/storage';
import sharp from 'sharp'; // <-- Import sharp

const storage = new Storage();
const bucketName = process.env.GCS_BUCKET_NAME;
const bucket = storage.bucket(bucketName);

/**
 * Uploads a file to Google Cloud Storage.
 * @param {object} file - The file object from multer (req.file).
 * @returns {Promise<{publicUrl: string, fileName: string}>} - A promise that resolves to an object with the public URL and the unique filename.
 */
/*export function uploadFile(file) {
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
}*/



/**
 * Processes an image buffer using sharp and uploads it to Google Cloud Storage.
 * @param {Buffer} buffer - The image file buffer.
 * @param {string} originalName - The original filename to create a unique name.
 * @param {object} [options] - Processing options.
 * @param {{width: number, height: number}} [options.resize] - Resize dimensions.
 * @param {number} [options.quality=80] - The JPEG quality (1-100).
 * @returns {Promise<{publicUrl: string, fileName: string}>}
 */
export async function processAndUploadImage(buffer, originalName, options = {}) {
  const { resize, quality = 80 } = options;

  let imagePipeline = sharp(buffer);

  // Resize if dimensions are provided
  if (resize && resize.width && resize.height) {
    imagePipeline = imagePipeline.resize(resize.width, resize.height);
  }

  // Convert to compressed JPEG
  const processedBuffer = await imagePipeline
    .jpeg({ quality, mozjpeg: true })
    .toBuffer();

  // Create a unique filename
  const sanitizedName = originalName.replace(/\.[^/.]+$/, "").replace(/\s/g, '_');
  const destFileName = `${Date.now()}-${sanitizedName}.jpg`;
  const blob = bucket.file(destFileName);
  const blobStream = blob.createWriteStream({ resumable: false });

  return new Promise((resolve, reject) => {
    blobStream.on('error', (err) => reject(err));
    blobStream.on('finish', () => {
      const publicUrl = `/files/${destFileName}`; 
      resolve({ publicUrl, fileName: destFileName });
    });
    blobStream.end(processedBuffer);
  });
}


/**
 * Gets a read stream for a file from GCS.
 * @param {string} fileName 
 * @returns {import('stream').Readable}
 */
export function getFileStream(fileName) {
    return bucket.file(fileName).createReadStream();
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
