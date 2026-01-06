import * as chrono from 'chrono-node';

export function parseTaskInput(text, projects = []) {
    let content = text;
    let date = null;
    let priority = null;
    let projectId = null;

    // 1. Parse Date using chrono-node
    const parsedDates = chrono.parse(text);
    if (parsedDates.length > 0) {
        // Use the first detected date
        date = parsedDates[0].start.date();
        // Remove the date text from content
        // We replace with empty string, but need to be careful about not leaving double spaces
        // This simple replacement might need refinement for complex cases but works for "Tomorrow at 5pm"
        content = content.replace(parsedDates[0].text, '').trim();
    }

    // 2. Parse Priority (p1, p2, p3, p4) - Case insensitive
    // Matches p1-4 at the end of string or surrounded by spaces
    const priorityRegex = /(^|\s)p([1-4])(\s|$)/i;
    const priorityMatch = content.match(priorityRegex);
    if (priorityMatch) {
        priority = parseInt(priorityMatch[2], 10);
        // Remove priority string from content
        content = content.replace(priorityMatch[0], ' ').trim();
    }

    // 3. Parse Project (#ProjectName)
    // Matches # followed by word characters
    const projectRegex = /(^|\s)#(\w+)(\s|$)/;
    const projectMatch = content.match(projectRegex);
    if (projectMatch) {
        const projectName = projectMatch[2].toLowerCase();
        // Find project with matching name (case-insensitive)
        const project = projects.find(p => p.name.toLowerCase() === projectName);
        if (project) {
            projectId = project.id;
            content = content.replace(projectMatch[0], ' ').trim();
        }
    }

    // Clean up extra spaces
    content = content.replace(/\s+/g, ' ').trim();

    return {
        content,
        date,
        priority, // Returns 1-4 or null
        projectId // Returns ID or null
    };
}
