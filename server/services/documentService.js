const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/documents';
        // Create directory if it doesn't exist
        fs.mkdir(uploadDir, { recursive: true })
            .then(() => cb(null, uploadDir))
            .catch(err => cb(err));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter for allowed document types
const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/jpg'
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only PDF and images are allowed.'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

class DocumentService {
    constructor() {
        this.upload = upload;
    }

    // Handle single file upload
    uploadSingle(fieldName) {
        return this.upload.single(fieldName);
    }

    // Handle multiple files upload
    uploadMultiple(fieldName, maxCount) {
        return this.upload.array(fieldName, maxCount);
    }

    // Get document metadata
    async getDocumentMetadata(filePath) {
        try {
            const stats = await fs.stat(filePath);
            return {
                size: stats.size,
                createdAt: stats.birthtime,
                modifiedAt: stats.mtime
            };
        } catch (error) {
            throw new Error(`Failed to get document metadata: ${error.message}`);
        }
    }

    // Delete document
    async deleteDocument(filePath) {
        try {
            await fs.unlink(filePath);
            return true;
        } catch (error) {
            throw new Error(`Failed to delete document: ${error.message}`);
        }
    }

    // Validate document
    validateDocument(file) {
        const maxSize = 5 * 1024 * 1024; // 5MB
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];

        if (!file) {
            throw new Error('No file provided');
        }

        if (!allowedTypes.includes(file.mimetype)) {
            throw new Error('Invalid file type');
        }

        if (file.size > maxSize) {
            throw new Error('File size exceeds limit');
        }

        return true;
    }
}

module.exports = new DocumentService(); 