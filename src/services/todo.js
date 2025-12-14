import { db } from '../firebase';
import {
    collection,
    addDoc,
    query,
    where,
    onSnapshot,
    doc,
    updateDoc,
    deleteDoc,
    writeBatch,
    serverTimestamp,
    getDoc
} from 'firebase/firestore';
import { addDays, addWeeks, addMonths, parseISO, format } from 'date-fns';

const COLLECTION_NAME = 'tasks';

export function subscribeToTasks(userId, callback) {
    if (!userId) return () => { };

    const q = query(
        collection(db, COLLECTION_NAME),
        where('userId', '==', userId)
    );

    return onSnapshot(q, (snapshot) => {
        const tasks = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        // Client-side sort: Ascending order by 'order', then by createdAt
        tasks.sort((a, b) => {
            if (a.order !== undefined && b.order !== undefined) {
                return a.order - b.order;
            }
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
            return dateB - dateA; // Fallback to newest first if no order
        });
        callback(tasks);
    }, (error) => {
        console.error("Error fetching tasks:", error);
        // Fallback to empty list so it doesn't hang in loading state
        callback([]);
    });
}



export async function toggleTaskCompletion(taskId, currentStatus) {
    const taskRef = doc(db, COLLECTION_NAME, taskId);

    // If we are un-completing, just basic toggle
    if (currentStatus) {
        return updateDoc(taskRef, {
            isCompleted: false
        });
    }

    // If completing, check for recurrence
    const taskSnap = await getDoc(taskRef);
    if (!taskSnap.exists()) return;

    const task = taskSnap.data();

    if (task.isRecurring && task.recurrence) {
        // Calculate next date
        let nextDate = null;
        const currentDueDate = task.dueDate ? parseISO(task.dueDate) : new Date();

        const lowerRecurrence = task.recurrence.toLowerCase();

        const anchorDate = task.recurrenceAnchor ? parseISO(task.recurrenceAnchor) : currentDueDate;

        if (lowerRecurrence.includes('day') || lowerRecurrence === 'daily') {
            const match = lowerRecurrence.match(/every (\d+) day/);
            const days = match ? parseInt(match[1]) : 1;
            nextDate = addDays(anchorDate, days);
        } else if (lowerRecurrence.includes('week') || lowerRecurrence === 'weekly') {
            const match = lowerRecurrence.match(/every (\d+) week/);
            const weeks = match ? parseInt(match[1]) : 1;
            nextDate = addWeeks(anchorDate, weeks);
        } else if (lowerRecurrence.includes('month') || lowerRecurrence === 'monthly') {
            const match = lowerRecurrence.match(/every (\d+) month/);
            const months = match ? parseInt(match[1]) : 1;
            nextDate = addMonths(anchorDate, months);
        }

        if (nextDate) {
            // Create next task
            await addTask(
                task.userId,
                task.content,
                format(nextDate, 'yyyy-MM-dd'),
                true,
                task.recurrence,
                task.projectId,
                task.description || ""
                // anchor is handled in addTask automatically as 'date' if not passed, 
                // BUT for next task, the anchor should be the calculated nextDate to keep the chain.
            );
        }
    }

    return updateDoc(taskRef, {
        isCompleted: true
    });
}

export async function deleteTask(taskId) {
    const taskRef = doc(db, COLLECTION_NAME, taskId);
    return deleteDoc(taskRef);
}

export async function updateTaskContent(taskId, newContent) {
    const taskRef = doc(db, COLLECTION_NAME, taskId);
    return updateDoc(taskRef, {
        content: newContent
    });
}

export async function reorderTasks(tasks) {
    const batch = writeBatch(db);
    tasks.forEach((task, index) => {
        const taskRef = doc(db, COLLECTION_NAME, task.id);
        batch.update(taskRef, { order: index });
    });
    return batch.commit();
}

const PROJECTS_COLLECTION = 'projects';

export function subscribeToProjects(userId, callback) {
    if (!userId) return () => { };

    const q = query(
        collection(db, PROJECTS_COLLECTION),
        where('userId', '==', userId)
    );

    return onSnapshot(q, (snapshot) => {
        const projects = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        projects.sort((a, b) => a.name.localeCompare(b.name));
        callback(projects);
    }, (error) => {
        console.error("Error fetching projects:", error);
        callback([]);
    });
}

export async function addProject(userId, name, color, icon = null) {
    return addDoc(collection(db, PROJECTS_COLLECTION), {
        userId,
        name,
        color,
        icon, // Stores emoji character or null
        createdAt: serverTimestamp()
    });
}

export async function updateProjectIcon(projectId, icon) {
    const projectRef = doc(db, PROJECTS_COLLECTION, projectId);
    return updateDoc(projectRef, {
        icon: icon
    });
}

export async function deleteProject(projectId) {
    const projectRef = doc(db, PROJECTS_COLLECTION, projectId);
    return deleteDoc(projectRef);
}

// Updated addTask to include project info and description
export async function addTask(userId, content, date = null, isRecurring = false, recurrence = null, projectId = null, description = "", recurrenceAnchor = null) {
    return addDoc(collection(db, COLLECTION_NAME), {
        userId,
        content,
        description,
        isCompleted: false,
        createdAt: serverTimestamp(),
        dueDate: date,
        isRecurring: isRecurring,
        recurrence: isRecurring ? recurrence : null,
        recurrenceAnchor: recurrenceAnchor || date, // Initialize anchor with date if not provided
        projectId: projectId,
        order: Date.now() // Simple default order: new tasks at bottom (timestamp is increasing)
    });
}

// Helper to get a single task (for modal)
export async function getTask(taskId) {
    const taskRef = doc(db, COLLECTION_NAME, taskId);
    const taskSnap = await getDoc(taskRef);
    if (taskSnap.exists()) {
        return { id: taskSnap.id, ...taskSnap.data() };
    }
    return null;
}

export async function updateTaskDescription(taskId, description) {
    const taskRef = doc(db, COLLECTION_NAME, taskId);
    return updateDoc(taskRef, {
        description: description
    });
}

export async function updateTaskProject(taskId, projectId) {
    const taskRef = doc(db, COLLECTION_NAME, taskId);
    return updateDoc(taskRef, {
        projectId: projectId
    });
}

export async function updateTaskDate(taskId, date, isRecurring, recurrence, recurrenceAnchor) {
    const taskRef = doc(db, COLLECTION_NAME, taskId);
    const updates = {
        dueDate: date,
        isRecurring: isRecurring,
        recurrence: recurrence
    };
    if (recurrenceAnchor !== undefined) {
        updates.recurrenceAnchor = recurrenceAnchor;
    }
    return updateDoc(taskRef, updates);
}
