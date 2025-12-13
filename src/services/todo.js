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
    serverTimestamp
} from 'firebase/firestore';

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
    return updateDoc(taskRef, {
        isCompleted: !currentStatus
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

export async function addProject(userId, name, color) {
    return addDoc(collection(db, PROJECTS_COLLECTION), {
        userId,
        name,
        color,
        createdAt: serverTimestamp()
    });
}

// Updated addTask to include project info
export async function addTask(userId, content, date = null, isRecurring = false, recurrence = null, projectId = null) {
    return addDoc(collection(db, COLLECTION_NAME), {
        userId,
        content,
        isCompleted: false,
        createdAt: serverTimestamp(),
        dueDate: date,
        isRecurring: isRecurring,
        recurrence: isRecurring ? recurrence : null,
        projectId: projectId,
        order: Date.now() // Simple default order: new tasks at bottom (timestamp is increasing)
    });
}
