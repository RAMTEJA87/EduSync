import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User.js';
import AcademicStructure from './models/AcademicStructure.js';
import QuizResult from './models/QuizResult.js';
import Quiz from './models/Quiz.js';

dotenv.config();

// ─── Configuration ────────────────────────────────────────────────
const DEFAULT_PASSWORD = 'Password@123';
const NUM_STUDENTS = 100;
const NUM_TEACHERS = 10;

const BRANCHES = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL'];
const SECTIONS = ['A', 'B'];
const YEARS = ['1', '2', '3', '4'];

const FIRST_NAMES = [
  'Aarav', 'Aditi', 'Aditya', 'Akshay', 'Amira', 'Ananya', 'Anjali', 'Arjun',
  'Bhavya', 'Chaitanya', 'Deepak', 'Diya', 'Esha', 'Gaurav', 'Harini', 'Ishaan',
  'Jaya', 'Karthik', 'Kavya', 'Lakshmi', 'Manish', 'Meera', 'Naveen', 'Nisha',
  'Omkar', 'Pooja', 'Pranav', 'Priya', 'Rahul', 'Rashmi', 'Ravi', 'Ritika',
  'Rohit', 'Sakshi', 'Sameer', 'Sanjana', 'Shreya', 'Siddharth', 'Sneha', 'Suresh',
  'Tanvi', 'Uday', 'Varun', 'Vidya', 'Vikram', 'Yamini', 'Zara', 'Nikhil',
  'Divya', 'Ramesh',
];

const LAST_NAMES = [
  'Sharma', 'Patel', 'Reddy', 'Kumar', 'Singh', 'Gupta', 'Rao', 'Iyer',
  'Nair', 'Joshi', 'Verma', 'Pillai', 'Desai', 'Bhat', 'Menon', 'Agarwal',
  'Mishra', 'Chauhan', 'Tiwari', 'Pandey', 'Das', 'Ghosh', 'Mukherjee', 'Roy',
  'Sinha', 'Prasad', 'Chatterjee', 'Banerjee', 'Saxena', 'Mehta',
];

const TEACHER_SUBJECTS = [
  'Data Structures', 'Operating Systems', 'Database Management',
  'Computer Networks', 'Machine Learning', 'Digital Electronics',
  'Engineering Mathematics', 'Software Engineering', 'Web Technologies',
  'Compiler Design',
];

const WEAK_TOPICS = [
  'Recursion', 'Dynamic Programming', 'Graph Theory', 'Binary Trees',
  'Sorting Algorithms', 'Linked Lists', 'SQL Joins', 'Normalization',
  'Process Scheduling', 'Memory Management', 'OSI Model', 'TCP/IP',
  'Pointers', 'OOP Concepts', 'Probability', 'Linear Algebra',
];

// ─── Helpers ──────────────────────────────────────────────────────
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const pickN = (arr, n) => {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(n, shuffled.length));
};
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const generateRollNumberPrefix = (structure) =>
  `Y${structure.year}${structure.branch}-${structure.section}-`;

// ─── Main Seed Function ──────────────────────────────────────────
const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected for seeding...\n');

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, salt);

    // ── Step 1: Create Academic Structures ─────────────────────
    console.log('Step 1: Creating academic structures...');
    const structures = [];
    for (const year of YEARS) {
      for (const branch of BRANCHES) {
        for (const section of SECTIONS) {
          let structure = await AcademicStructure.findOne({ year, branch, section });
          if (!structure) {
            structure = await AcademicStructure.create({ year, branch, section, students: [] });
          }
          structures.push(structure);
        }
      }
    }
    console.log(`  → ${structures.length} academic structures ready\n`);

    // ── Step 2: Create Teachers ────────────────────────────────
    console.log(`Step 2: Creating ${NUM_TEACHERS} teachers...`);
    const teachers = [];
    for (let i = 0; i < NUM_TEACHERS; i++) {
      const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
      const lastName = LAST_NAMES[i % LAST_NAMES.length];
      const name = `${firstName} ${lastName}`;
      const email = `teacher.${firstName.toLowerCase()}.${lastName.toLowerCase()}@edusync.edu`;
      const subject = TEACHER_SUBJECTS[i % TEACHER_SUBJECTS.length];

      let teacher = await User.findOne({ email });
      if (!teacher) {
        teacher = await User.create({
          name: `Prof. ${name}`,
          email,
          passwordHash,
          role: 'TEACHER',
        });
        console.log(`  ✓ Teacher ${i + 1}: ${teacher.name} (${email})`);
      } else {
        console.log(`  ○ Teacher ${i + 1}: ${teacher.name} already exists`);
      }
      teachers.push(teacher);
    }
    console.log(`  → ${teachers.length} teachers ready\n`);

    // ── Step 3: Create Students ────────────────────────────────
    console.log(`Step 3: Creating ${NUM_STUDENTS} students...`);
    const students = [];
    for (let i = 0; i < NUM_STUDENTS; i++) {
      const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
      const lastName = LAST_NAMES[Math.floor(i / FIRST_NAMES.length) % LAST_NAMES.length];
      const name = `${firstName} ${lastName}`;
      const suffix = i < FIRST_NAMES.length ? '' : `${Math.floor(i / FIRST_NAMES.length) + 1}`;
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${suffix}@edusync.student`;

      const existingStudent = await User.findOne({ email });
      if (existingStudent) {
        console.log(`  ○ Student ${i + 1}: ${name} already exists`);
        students.push(existingStudent);
        continue;
      }

      // Distribute students across structures
      const structure = structures[i % structures.length];
      const prefix = generateRollNumberPrefix(structure);
      const existingInStructure = await User.countDocuments({
        role: 'STUDENT',
        academicContext: structure._id,
      });
      const rollNumber = `${prefix}${String(existingInStructure + 1).padStart(3, '0')}`;

      // Random risk levels and weak topics for variety
      const riskLevels = ['LOW', 'LOW', 'LOW', 'MEDIUM', 'MEDIUM', 'HIGH'];
      const overallRiskLevel = pick(riskLevels);
      const numWeakTopics = overallRiskLevel === 'HIGH' ? randInt(3, 5) :
        overallRiskLevel === 'MEDIUM' ? randInt(1, 3) : randInt(0, 1);
      const weakTopics = pickN(WEAK_TOPICS, numWeakTopics).map(t => ({
        topicName: t,
        failureCount: randInt(1, 5),
      }));

      const student = await User.create({
        name,
        email,
        passwordHash,
        role: 'STUDENT',
        academicContext: structure._id,
        rollNumber,
        overallRiskLevel,
        weakTopics,
      });

      // Add to academic structure
      await AcademicStructure.findByIdAndUpdate(structure._id, {
        $addToSet: { students: student._id },
      });

      students.push(student);
      if ((i + 1) % 25 === 0 || i === NUM_STUDENTS - 1) {
        console.log(`  ✓ Created ${i + 1}/${NUM_STUDENTS} students`);
      }
    }
    console.log(`  → ${students.length} students ready\n`);

    // ── Step 4: Create Sample Quizzes ──────────────────────────
    console.log('Step 4: Creating sample quizzes...');
    const quizTopics = [
      { title: 'Data Structures Fundamentals', topic: 'Data Structures', difficulty: 'EASY' },
      { title: 'Advanced Algorithms', topic: 'Algorithms', difficulty: 'HARD' },
      { title: 'Database Concepts', topic: 'DBMS', difficulty: 'MEDIUM' },
      { title: 'OS Basics', topic: 'Operating Systems', difficulty: 'EASY' },
      { title: 'Networking Essentials', topic: 'Computer Networks', difficulty: 'MEDIUM' },
    ];

    const quizzes = [];
    for (const qt of quizTopics) {
      const existingQuiz = await Quiz.findOne({ title: qt.title });
      if (existingQuiz) {
        quizzes.push(existingQuiz);
        console.log(`  ○ Quiz "${qt.title}" already exists`);
        continue;
      }

      const questions = Array.from({ length: 5 }, (_, qi) => ({
        questionText: `Sample question ${qi + 1} about ${qt.topic}?`,
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correctOptionIndex: randInt(0, 3),
        topicTag: qt.topic,
        weight: 1,
      }));

      const quiz = await Quiz.create({
        title: qt.title,
        createdBy: teachers[0]._id,
        sourceMode: 'TOPIC',
        baseDifficulty: qt.difficulty,
        questions,
        targetAudience: structures[0]._id,
        status: 'PUBLISHED',
      });
      quizzes.push(quiz);
      console.log(`  ✓ Quiz: "${qt.title}" (${qt.difficulty})`);
    }
    console.log(`  → ${quizzes.length} quizzes ready\n`);

    // ── Step 5: Generate Sample Quiz Results ───────────────────
    console.log('Step 5: Generating sample quiz results...');
    let resultCount = 0;
    for (const student of students) {
      // Each student attempts 1-3 random quizzes
      const attemptsCount = randInt(1, 3);
      const selectedQuizzes = pickN(quizzes, attemptsCount);

      for (const quiz of selectedQuizzes) {
        const existingResult = await QuizResult.findOne({
          studentId: student._id,
          quizId: quiz._id,
        });
        if (existingResult) continue;

        const totalQuestions = quiz.questions.length;
        const correctCount = randInt(0, totalQuestions);
        const accuracy = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;

        const questionMetrics = quiz.questions.map((q, idx) => ({
          questionId: q._id,
          isCorrect: idx < correctCount,
          timeSpent: randInt(5, 60),
        }));

        await QuizResult.create({
          studentId: student._id,
          quizId: quiz._id,
          totalScore: correctCount,
          timeTakenSeconds: randInt(60, 600),
          accuracyPercentage: Math.round(accuracy * 100) / 100,
          marksAssigned: Math.round((correctCount / totalQuestions) * 5 * 10) / 10,
          questionMetrics,
        });
        resultCount++;
      }
    }
    console.log(`  → ${resultCount} quiz results generated\n`);

    // ── Summary ────────────────────────────────────────────────
    const totalStudents = await User.countDocuments({ role: 'STUDENT' });
    const totalTeachers = await User.countDocuments({ role: 'TEACHER' });
    const totalAdmins = await User.countDocuments({ role: 'ADMIN' });
    const totalQuizzes = await Quiz.countDocuments();
    const totalResults = await QuizResult.countDocuments();
    const totalStructures = await AcademicStructure.countDocuments();

    console.log('════════════════════════════════════════════════');
    console.log('  SEED COMPLETE - Database Summary');
    console.log('════════════════════════════════════════════════');
    console.log(`  👨‍💻 Admins:      ${totalAdmins}`);
    console.log(`  👩‍🏫 Teachers:    ${totalTeachers}`);
    console.log(`  🎓 Students:    ${totalStudents}`);
    console.log(`  🏫 Structures:  ${totalStructures}`);
    console.log(`  📝 Quizzes:     ${totalQuizzes}`);
    console.log(`  📊 Results:     ${totalResults}`);
    console.log('════════════════════════════════════════════════');
    console.log(`\n  Default password for all seeded users: ${DEFAULT_PASSWORD}`);
    console.log('  Teacher emails:  teacher.<first>.<last>@edusync.edu');
    console.log('  Student emails:  <first>.<last>@edusync.student\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seed failed:', error);
    process.exit(1);
  }
};

seed();
