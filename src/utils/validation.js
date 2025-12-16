// Security Constants
export const MAX_TASK_CONTENT_LENGTH = 2000;
export const MAX_DESCRIPTION_LENGTH = 5000;
export const MAX_PROJECT_NAME_LENGTH = 100;

/**
 * Validates task input to prevent invalid data or abuse.
 * @param {string} content - The task content.
 * @param {string} [description] - The task description.
 * @throws {Error} If validation fails.
 */
export function validateTaskInput(content, description = '') {
    if (!content || typeof content !== 'string' || !content.trim()) {
        throw new Error('Task content cannot be empty');
    }
    if (content.length > MAX_TASK_CONTENT_LENGTH) {
        throw new Error(`Task content exceeds maximum length of ${MAX_TASK_CONTENT_LENGTH} characters`);
    }
    if (description && description.length > MAX_DESCRIPTION_LENGTH) {
        throw new Error(`Task description exceeds maximum length of ${MAX_DESCRIPTION_LENGTH} characters`);
    }
}

/**
 * Validates project input.
 * @param {string} name - The project name.
 * @throws {Error} If validation fails.
 */
export function validateProjectInput(name) {
    if (!name || typeof name !== 'string' || !name.trim()) {
        throw new Error('Project name cannot be empty');
    }
    if (name.length > MAX_PROJECT_NAME_LENGTH) {
        throw new Error(`Project name exceeds maximum length of ${MAX_PROJECT_NAME_LENGTH} characters`);
    }
}
