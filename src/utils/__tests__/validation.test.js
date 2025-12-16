import { describe, it, expect } from 'vitest';
import { validateTaskInput, validateProjectInput, MAX_TASK_CONTENT_LENGTH, MAX_PROJECT_NAME_LENGTH } from '../validation';

describe('Validation Utils', () => {
    describe('validateTaskInput', () => {
        it('should accept valid task content', () => {
            expect(() => validateTaskInput('Valid content')).not.toThrow();
        });

        it('should accept valid task content with description', () => {
            expect(() => validateTaskInput('Valid content', 'Valid description')).not.toThrow();
        });

        it('should throw if content is empty', () => {
            expect(() => validateTaskInput('')).toThrow('Task content cannot be empty');
            expect(() => validateTaskInput('   ')).toThrow('Task content cannot be empty');
            expect(() => validateTaskInput(null)).toThrow('Task content cannot be empty');
        });

        it('should throw if content is too long', () => {
            const longContent = 'a'.repeat(MAX_TASK_CONTENT_LENGTH + 1);
            expect(() => validateTaskInput(longContent)).toThrow(/exceeds maximum length/);
        });

        it('should throw if description is too long', () => {
            const longDesc = 'a'.repeat(5001);
            expect(() => validateTaskInput('Valid', longDesc)).toThrow(/Task description exceeds maximum length/);
        });
    });

    describe('validateProjectInput', () => {
        it('should accept valid project name', () => {
            expect(() => validateProjectInput('My Project')).not.toThrow();
        });

        it('should throw if project name is empty', () => {
            expect(() => validateProjectInput('')).toThrow('Project name cannot be empty');
        });

        it('should throw if project name is too long', () => {
            const longName = 'a'.repeat(MAX_PROJECT_NAME_LENGTH + 1);
            expect(() => validateProjectInput(longName)).toThrow(/Project name exceeds maximum length/);
        });
    });
});
