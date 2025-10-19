const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

class UploadService {
  constructor() {
    this.setupMulter();
  }

  // Setup multer for file uploads
  setupMulter() {
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Configure storage
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, uploadsDir);
      },
      filename: (req, file, cb) => {
        // Generate unique filename
        const uniqueSuffix = crypto.randomBytes(16).toString('hex');
        const extension = path.extname(file.originalname);
        cb(null, `${uniqueSuffix}${extension}`);
      }
    });

    // File filter
    const fileFilter = (req, file, cb) => {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024; // 10MB default

      if (!allowedTypes.includes(file.mimetype)) {
        return cb(new Error('Invalid file type. Only PDF, JPG, JPEG, and PNG files are allowed.'), false);
      }

      if (file.size > maxSize) {
        return cb(new Error('File size too large. Maximum size is 10MB.'), false);
      }

      cb(null, true);
    };

    this.upload = multer({
      storage: storage,
      fileFilter: fileFilter,
      limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
        files: 1 // Only one file at a time
      }
    });
  }

  // Upload file to Cloudinary
  async uploadToCloudinary(filePath, options = {}) {
    try {
      console.log('Cloudinary config:', {
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY ? 'set' : 'not set',
        api_secret: process.env.CLOUDINARY_API_SECRET ? 'set' : 'not set'
      });
      
      const result = await cloudinary.uploader.upload(filePath, {
        folder: 'healthmate/reports',
        resource_type: 'auto',
        quality: 'auto',
        fetch_format: 'auto',
        ...options
      });

      return {
        publicId: result.public_id,
        url: result.secure_url,
        format: result.format,
        width: result.width,
        height: result.height,
        bytes: result.bytes
      };
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw new Error(`Failed to upload file to cloud: ${error.message}`);
    }
  }

  // Delete file from Cloudinary
  async deleteFromCloudinary(publicId) {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result;
    } catch (error) {
      console.error('Cloudinary delete error:', error);
      throw new Error(`Failed to delete file from cloud: ${error.message}`);
    }
  }

  // Delete local file
  deleteLocalFile(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Local file delete error:', error);
      return false;
    }
  }

  // Get file type from extension
  getFileType(filename) {
    const ext = path.extname(filename).toLowerCase();
    const imageExts = ['.jpg', '.jpeg', '.png'];
    const docExts = ['.pdf'];

    if (imageExts.includes(ext)) {
      return 'image';
    } else if (docExts.includes(ext)) {
      return 'document';
    } else {
      return 'unknown';
    }
  }

  // Get MIME type from extension
  getMimeType(filename) {
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.pdf': 'application/pdf'
    };

    return mimeTypes[ext] || 'application/octet-stream';
  }

  // Generate signed URL for secure access
  generateSignedUrl(publicId, options = {}) {
    try {
      const url = cloudinary.url(publicId, {
        secure: true,
        sign_url: true,
        ...options
      });
      return url;
    } catch (error) {
      console.error('Signed URL generation error:', error);
      throw new Error(`Failed to generate signed URL: ${error.message}`);
    }
  }

  // Get file info from Cloudinary
  async getFileInfo(publicId) {
    try {
      const result = await cloudinary.api.resource(publicId);
      return {
        publicId: result.public_id,
        url: result.secure_url,
        format: result.format,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
        createdAt: result.created_at
      };
    } catch (error) {
      console.error('Get file info error:', error);
      throw new Error(`Failed to get file info: ${error.message}`);
    }
  }

  // Transform image (resize, crop, etc.)
  async transformImage(publicId, transformations = {}) {
    try {
      const url = cloudinary.url(publicId, {
        secure: true,
        ...transformations
      });
      return url;
    } catch (error) {
      console.error('Image transformation error:', error);
      throw new Error(`Failed to transform image: ${error.message}`);
    }
  }

  // Get multer middleware
  getMulterMiddleware() {
    return this.upload;
  }

  // Validate file before upload
  validateFile(file) {
    const errors = [];

    // Check file size
    const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      errors.push(`File size exceeds maximum allowed size of ${maxSize / (1024 * 1024)}MB`);
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.mimetype)) {
      errors.push('Invalid file type. Only PDF, JPG, JPEG, and PNG files are allowed.');
    }

    // Check filename
    if (!file.originalname || file.originalname.trim() === '') {
      errors.push('Filename is required');
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  // Clean up old temporary files
  cleanupTempFiles() {
    const uploadsDir = path.join(__dirname, '../uploads');
    
    if (!fs.existsSync(uploadsDir)) {
      return;
    }

    const files = fs.readdirSync(uploadsDir);
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    files.forEach(file => {
      const filePath = path.join(uploadsDir, file);
      const stats = fs.statSync(filePath);
      
      if (now - stats.mtime.getTime() > maxAge) {
        try {
          fs.unlinkSync(filePath);
          console.log(`Cleaned up old temp file: ${file}`);
        } catch (error) {
          console.error(`Error cleaning up file ${file}:`, error);
        }
      }
    });
  }

  // Get storage usage statistics
  async getStorageStats() {
    try {
      const result = await cloudinary.api.usage();
      return {
        plan: result.plan,
        objects: result.objects,
        bandwidth: result.bandwidth,
        storage: result.storage,
        requests: result.requests,
        resources: result.resources,
        derived_resources: result.derived_resources
      };
    } catch (error) {
      console.error('Storage stats error:', error);
      throw new Error(`Failed to get storage stats: ${error.message}`);
    }
  }
}

module.exports = new UploadService();
