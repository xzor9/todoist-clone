/**
 * Validates task content.
 * @param {string} content - The main text of the task.
 * @throws {Error} If validation fails.
 */
export function validateTaskContent(content) {
    if (typeof content !== 'string' || content.trim() === '') {
        throw new Error("Task content is required.");
    }
    if (content.length > 500) {
        throw new Error("Task content must be less than 500 characters.");
    }
}

/**
 * Validates task description.
 * @param {string} description - The detailed description of the task.
 * @throws {Error} If validation fails.
 */
export function validateTaskDescription(description) {
    if (description === null || description === undefined) return; // Optional
    if (typeof description !== 'string') {
        throw new Error("Description must be a string.");
    }
    if (description.length > 5000) {
        throw new Error("Description must be less than 5000 characters.");
    }
}

/**
 * Validates task input data.
 * @param {string} content - The main text of the task.
 * @param {string} description - The detailed description of the task (optional).
 * @throws {Error} If validation fails.
 */
export function validateTaskInput(content, description = "") {
    validateTaskContent(content);
    validateTaskDescription(description);
}

/**
 * Validates project input data.
 * @param {string} name - The name of the project.
 * @throws {Error} If validation fails.
 */
export function validateProjectInput(name) {
    if (typeof name !== 'string' || name.trim() === '') {
        throw new Error("Project name is required.");
    }
    if (name.length > 100) {
        throw new Error("Project name must be less than 100 characters.");
    }
}
