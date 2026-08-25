const fs = require('fs');
const path = require('path');

/**
 * Image Storage Service Abstraction
 * Supports local disk storage out-of-the-box and is ready for Cloudinary / AWS S3 adapters.
 */
class ImageStorageService {
  constructor() {
    this.uploadDir = path.join(__dirname, '../../uploads');
    this.ensureDirectoryExists(this.uploadDir);
  }

  ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  /**
   * Save uploaded file or buffer
   * @param {Object} file - Multer file object or raw buffer info
   * @returns {Object} { filePath, filename, originalName, size, mimeType, url }
   */
  async saveImage(file) {
    if (!file) {
      throw new Error('No file provided for image storage.');
    }

    // Multer diskStorage automatically saves the file to uploadDir
    const filename = file.filename || `pkg-${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname || '.jpg')}`;
    const relativePath = `/uploads/${filename}`;
    const absolutePath = file.path || path.join(this.uploadDir, filename);

    return {
      filename,
      filePath: relativePath,
      absolutePath,
      originalName: file.originalname || filename,
      mimeType: file.mimetype || 'image/jpeg',
      sizeBytes: file.size || 0,
      url: relativePath,
    };
  }

  /**
   * Delete an image from storage
   * @param {string} fileUrlOrPath - relative or absolute file path
   */
  async deleteImage(fileUrlOrPath) {
    try {
      if (!fileUrlOrPath) return false;
      const basename = path.basename(fileUrlOrPath);
      const fullPath = path.join(this.uploadDir, basename);

      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        return true;
      }
      return false;
    } catch (error) {
      console.warn(`[ImageStorageService] Could not delete file: ${fileUrlOrPath}`, error.message);
      return false;
    }
  }

  /**
   * Get public or accessible URL for an image
   */
  getImageUrl(filenameOrPath) {
    if (!filenameOrPath) return '';
    if (filenameOrPath.startsWith('http://') || filenameOrPath.startsWith('https://')) {
      return filenameOrPath;
    }
    const cleanBasename = path.basename(filenameOrPath);
    return `/uploads/${cleanBasename}`;
  }
}

module.exports = new ImageStorageService();
