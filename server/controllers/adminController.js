import AcademicStructure from '../models/AcademicStructure.js';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';

// ==========================================
// ACADEMIC STRUCTURE CONTROLLERS
// ==========================================

// @desc    Add new academic structure (Branch, Year, Section)
// @route   POST /api/admin/academic
// @access  Admin
export const addAcademicStructure = async (req, res) => {
    try {
        const { year, branch, section } = req.body;

        const exists = await AcademicStructure.findOne({ year, branch, section });
        if (exists) {
            return res.status(400).json({ message: 'This structure already exists' });
        }

        const structure = await AcademicStructure.create({
            year,
            branch,
            section
        });

        res.status(201).json(structure);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all academic structures
// @route   GET /api/admin/academic
// @access  Admin
export const getAcademicStructures = async (req, res) => {
    try {
        const structures = await AcademicStructure.find({})
            .populate('students', 'name email rollNumber')
            .sort({ year: 1, branch: 1, section: 1 })
            .collation({ locale: 'en_US', numericOrdering: true });
        res.json(structures);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update an academic structure
// @route   PUT /api/admin/academic/:id
// @access  Admin
export const updateAcademicStructure = async (req, res) => {
    try {
        const { year, branch, section } = req.body;
        const structure = await AcademicStructure.findById(req.params.id);

        if (!structure) {
            return res.status(404).json({ message: 'Structure not found' });
        }

        structure.year = year || structure.year;
        structure.branch = branch || structure.branch;
        structure.section = section || structure.section;

        await structure.save();
        res.json(structure);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// @desc    Delete an academic structure
// @route   DELETE /api/admin/academic/:id
// @access  Admin
export const deleteAcademicStructure = async (req, res) => {
    try {
        const structure = await AcademicStructure.findById(req.params.id);
        if (!structure) {
            return res.status(404).json({ message: 'Structure not found' });
        }

        // Optional: you can prevent deletion if there are students
        // if (structure.students && structure.students.length > 0) {
        //    return res.status(400).json({ message: 'Cannot delete a structure that has enrolled students' });
        // }

        // Remove the academic context from all students tied to this structure
        await User.updateMany(
            { academicContext: req.params.id },
            { $unset: { academicContext: "" } }
        );

        await AcademicStructure.findByIdAndDelete(req.params.id);
        res.json({ message: 'Structure removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// ==========================================
// USER CRUD CONTROLLERS
// ==========================================

// @desc    Add a user
// @route   POST /api/admin/users
// @access  Admin
export const addUser = async (req, res) => {
    try {
        const { name, email, password, role, academicContextId } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password || '12345678', salt);

        const targetRole = role || 'STUDENT';
        let contextId = undefined;

        if (targetRole === 'STUDENT' && academicContextId) {
            contextId = academicContextId;
        }

        const user = await User.create({
            name,
            email,
            passwordHash,
            role: targetRole,
            academicContext: contextId
        });

        if (contextId) {
            await AcademicStructure.findByIdAndUpdate(contextId, {
                $addToSet: { students: user._id }
            });
        }

        // Return user without password
        const userObj = await User.findById(user._id).populate('academicContext', 'year branch section').select('-passwordHash');
        res.status(201).json(userObj);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// @desc    Get all users (filters by role optionally query ?role=STUDENT)
// @route   GET /api/admin/users
// @access  Admin
export const getUsers = async (req, res) => {
    try {
        const query = {};
        if (req.query.role) {
            query.role = req.query.role;
        }

        const users = await User.find(query)
            .populate('academicContext', 'year branch section')
            .select('-passwordHash'); // Exclude passwords

        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// @desc    Update a user
// @route   PUT /api/admin/users/:id
// @access  Admin
export const updateUser = async (req, res) => {
    try {
        const { name, email, rollNumber, role, academicContextId } = req.body;
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.name = name || user.name;
        user.email = email || user.email;
        user.role = role || user.role;

        if (rollNumber) user.rollNumber = rollNumber;

        // If context changes, remove from old, push to new
        if (academicContextId !== undefined && academicContextId !== String(user.academicContext)) {
            // Remove from old
            if (user.academicContext) {
                await AcademicStructure.findByIdAndUpdate(user.academicContext, {
                    $pull: { students: user._id }
                });
            }
            // Add to new
            if (academicContextId) {
                await AcademicStructure.findByIdAndUpdate(academicContextId, {
                    $addToSet: { students: user._id }
                });
                user.academicContext = academicContextId;
            } else {
                user.academicContext = undefined;
            }
        }

        const updatedUser = await user.save();
        res.json(updatedUser);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// @desc    Delete a user
// @route   DELETE /api/admin/users/:id
// @access  Admin
export const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.role === 'ADMIN') {
            return res.status(403).json({ message: 'Cannot delete admin users' });
        }

        // Clean up from AcademicStructure if they are a student
        if (user.academicContext) {
            await AcademicStructure.findByIdAndUpdate(user.academicContext, {
                $pull: { students: user._id }
            });
        }

        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'User removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}
