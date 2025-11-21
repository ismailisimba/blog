import multer from 'multer';

console.log('Initializing multer middleware with memory storage and file filter')

// Define allowed file types
const ALLOWED_MIMETYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/pdf',
  'application/zip',
  'image/webp',
  'image/svg+xml',
  'image/jpg',
  'application/octet-stream'
];

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIMETYPES.includes(file.mimetype)) {
    cb(null, true); // Accept the file
  } else {
    cb(new Error('Invalid file type.'), false); // Reject the file
  }
};

const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: { fileSize: 125 * 1024 * 1024 }, // 10MB limit
  fileFilter: fileFilter,
});

export default upload;
