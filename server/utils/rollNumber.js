import User from '../models/User.js';

const generateRollNumberPrefix = (structure) => {
    return `Y${structure.year}${structure.branch}-${structure.section}-`;
};

export const generateUniqueRollNumber = async (structure) => {
    const prefix = generateRollNumberPrefix(structure);
    const existingCount = await User.countDocuments({
        role: 'STUDENT',
        academicContext: structure._id
    });

    let sequence = existingCount + 1;
    while (true) {
        const candidate = `${prefix}${String(sequence).padStart(3, '0')}`;
        const exists = await User.findOne({ rollNumber: candidate });
        if (!exists) {
            return candidate;
        }
        sequence += 1;
    }
};
