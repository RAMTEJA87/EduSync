import User from '../models/User.js';
import AcademicStructure from '../models/AcademicStructure.js';
import generateToken from '../utils/jwt.js';
import bcrypt from 'bcryptjs';

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const authUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (user && (await bcrypt.compare(password, user.passwordHash))) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id, user.role),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public (Can be restricted later)
export const registerUser = async (req, res) => {
    try {
        const { name, email, password, role, academicContextId } = req.body;

        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // If registering as a student, ensure academic structure exists
        let structure = null;
        const requestedRole = role || 'STUDENT';

        // Self-registration is only allowed for STUDENT role
        if (requestedRole !== 'STUDENT') {
            return res.status(403).json({ message: 'Only student registration is allowed. Teachers and admins must be created by an administrator.' });
        }

        if (requestedRole === 'STUDENT' && academicContextId) {
            structure = await AcademicStructure.findById(academicContextId);
            if (!structure) {
                return res.status(404).json({ message: 'Academic structure not found' });
            }
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const user = await User.create({
            name,
            email,
            passwordHash,
            role: requestedRole,
            academicContext: structure ? structure._id : undefined
        });

        if (user) {
            if (structure) {
                structure.students.push(user._id);
                await structure.save();
            }

            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id, user.role),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
