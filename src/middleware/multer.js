import multer from 'multer';

// Configure multer to use memory storage. This is efficient for small files
// and essential for serverless environments like Cloud Run.
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB file size limit
  },
});

export default upload;
