/**
 * Parses a recurrence string (e.g., "Every 2 Days") into its components.
 * @param {string} recurrenceString - The recurrence string to parse.
 * @returns {object} { interval: number, unit: string }
 */
export function parseRecurrence(recurrenceString) {
    if (!recurrenceString) return { interval: 1, unit: 'Week' };

    const lower = recurrenceString.toLowerCase();
    const parts = recurrenceString.split(' ');
    // Format: "Every [number] [Unit]"

    let interval = 1;
    let unit = 'Week';

    if (parts.length >= 3) {
        interval = parseInt(parts[1]) || 1;
        let u = parts[2];
        // Normalize unit (remove plural 's')
        if (u.endsWith('s')) u = u.slice(0, -1);
        // Capitalize first letter
        unit = u.charAt(0).toUpperCase() + u.slice(1);
    } else {
        // Handle shorthand like "Daily", "Weekly" if they exist in legacy data, 
        // though the app seems to use "Every X Y" format primarily.
        if (lower === 'daily') { interval = 1; unit = 'Day'; }
        if (lower === 'weekly') { interval = 1; unit = 'Week'; }
        if (lower === 'monthly') { interval = 1; unit = 'Month'; }
        if (lower === 'yearly') { interval = 1; unit = 'Year'; }
    }

    // fallback validation
    const validUnits = ['Day', 'Week', 'Month', 'Year'];
    if (!validUnits.includes(unit)) unit = 'Week';

    return { interval, unit };
}

/**
 * Formats recurrence components into a string.
 * @param {number} interval - The interval number.
 * @param {string} unit - The unit (Day, Week, Month, Year).
 * @returns {string} The formatted string (e.g., "Every 2 Weeks").
 */
export function formatRecurrence(interval, unit) {
    return `Every ${interval} ${unit}${interval > 1 ? 's' : ''}`;
}
