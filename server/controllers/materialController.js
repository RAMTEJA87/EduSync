import Material from '../models/Material.js';

export const uploadMaterial = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const { title, academicContextId } = req.body;

        if (!title || !academicContextId) {
            return res.status(400).json({ message: 'Title and academic context ID are required' });
        }

        const material = await Material.create({
            title,
            originalFileName: req.file.originalname,
            fileUrl: `/uploads/${req.file.filename}`,
            mimetype: req.file.mimetype,
            uploadedBy: req.user._id,
            academicContext: academicContextId
        });

        res.status(201).json(material);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getMaterialsByContext = async (req, res) => {
    try {
        const { contextId } = req.params;
        const materials = await Material.find({ academicContext: contextId })
            .populate('uploadedBy', 'name')
            .sort({ createdAt: -1 });

        res.status(200).json(materials);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete Material
// @route   DELETE /api/materials/:id
// @access  Teacher
export const deleteMaterial = async (req, res) => {
    try {
        const materialId = req.params.id;
        const material = await Material.findById(materialId);
        if (!material) {
            return res.status(404).json({ message: 'Material not found' });
        }

        // Try to remove file from fs
        const fs = await import('fs');
        const path = await import('path');
        const filePath = path.join(process.cwd(), material.fileUrl);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        await material.deleteOne();
        res.json({ message: 'Material deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
