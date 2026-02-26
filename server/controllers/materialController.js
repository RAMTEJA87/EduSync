import Material from '../models/Material.js';
import { createMaterial, removeMaterial } from '../services/materialService.js';

export const uploadMaterial = async (req, res) => {
    try {
        const { title, academicContextId } = req.body;

        const material = await createMaterial({
            title,
            academicContextId,
            file: req.file,
            uploaderId: req.user._id
        });

        res.status(201).json(material);
    } catch (error) {
        res.status(error.statusCode || 500).json({ message: error.message });
    }
};

export const getMaterialsByContext = async (req, res) => {
    try {
        const { contextId } = req.params;
        const materials = await Material.find({ academicContext: contextId })
            .select('-fileData')
            .populate('uploadedBy', 'name')
            .sort({ createdAt: -1 });

        res.status(200).json(materials);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const downloadMaterial = async (req, res) => {
    try {
        const material = await Material.findById(req.params.id);
        if (!material) {
            return res.status(404).json({ message: 'Material not found' });
        }

        res.set({
            'Content-Type': material.mimetype,
            'Content-Disposition': `inline; filename="${encodeURIComponent(material.originalFileName)}"`,
            'Content-Length': material.fileSize,
        });

        res.send(material.fileData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteMaterial = async (req, res) => {
    try {
        await removeMaterial({
            materialId: req.params.id,
            requesterId: req.user._id
        });

        res.json({ message: 'Material deleted successfully' });
    } catch (error) {
        res.status(error.statusCode || 500).json({ message: error.message });
    }
};
