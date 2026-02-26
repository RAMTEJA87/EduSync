import Material from '../models/Material.js';

export const createMaterial = async ({ title, academicContextId, file, uploaderId }) => {
    if (!file) {
        const error = new Error('No file uploaded');
        error.statusCode = 400;
        throw error;
    }

    if (!title || !academicContextId) {
        const error = new Error('Title and academic context ID are required');
        error.statusCode = 400;
        throw error;
    }

    const material = await Material.create({
        title,
        originalFileName: file.originalname,
        fileData: file.buffer,
        fileSize: file.size,
        mimetype: file.mimetype,
        uploadedBy: uploaderId,
        academicContext: academicContextId
    });

    // Return without the binary data
    const result = material.toObject();
    delete result.fileData;
    return result;
};

export const removeMaterial = async ({ materialId, requesterId }) => {
    const material = await Material.findById(materialId).select('-fileData');
    if (!material) {
        const error = new Error('Material not found');
        error.statusCode = 404;
        throw error;
    }

    if (String(material.uploadedBy) !== String(requesterId)) {
        const error = new Error('Not authorized to delete this material');
        error.statusCode = 403;
        throw error;
    }

    await material.deleteOne();
};
