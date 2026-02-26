import { generateQuizFromGroq } from './services/ai/groqQuizService.js';

(async () => {
    try {
        const result = await generateQuizFromGroq({
            topic: 'Java',
            difficulty: 'HARD',
            numQuestions: 2,
            contextText: ''
        });
        console.log('Success:', result);
    } catch (e) {
        console.error('Test script caught an error:');
        console.error(e);
    }
})();
