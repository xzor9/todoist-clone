import React, { useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../firebase';
import { subscribeToTasks, reorderTasks } from '../services/todo';
import { doc as firestoreDoc, updateDoc as firestoreUpdateDoc } from 'firebase/firestore';
import { TasksContext } from './taskHooks';
import { isToday, isBefore, parseISO, startOfToday } from 'date-fns';

export default function TasksProvider({ children }) {
    const { currentUser } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUser) {
            // Reset state when user logs out - this is intentional and safe
            // as it synchronizes React state with the auth state change
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setTasks([]);
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setLoading(false);
            return () => { }; // Return empty cleanup function
        }

        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLoading(true); // Set loading when starting subscription
        const unsubscribe = subscribeToTasks(currentUser.uid, (fetchedTasks) => {
            setTasks(fetchedTasks);
            setLoading(false);
        });

        return unsubscribe;
    }, [currentUser]);

    // Update App Badge (iOS/PWA)
    useEffect(() => {
        if ('setAppBadge' in navigator && tasks.length > 0) {
            const today = startOfToday();
            const badgeCount = tasks.filter(t => {
                if (t.isCompleted || !t.dueDate) return false;
                const date = parseISO(t.dueDate);
                return isToday(date) || isBefore(date, today);
            }).length;

            navigator.setAppBadge(badgeCount).catch(err => {
                // Silently fail if permission not granted or api issues
                console.debug('Failed to set app badge', err);
            });
        } else if ('clearAppBadge' in navigator) {
            navigator.clearAppBadge().catch(() => { });
        }
    }, [tasks]);

    const updateTaskProject = async (taskId, projectId) => {
        const taskRef = firestoreDoc(db, 'tasks', taskId);
        await firestoreUpdateDoc(taskRef, {
            projectId: projectId,
            order: 0 // Reset order when moving to new project/inbox (or keep it, but 0 ensures visibility at top usually)
        });
    };

    const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);

    const openAddTaskModal = () => setIsAddTaskModalOpen(true);
    const closeAddTaskModal = () => setIsAddTaskModalOpen(false);

    const value = {
        tasks,
        setTasks, // Exposed for optimistic updates
        loading,
        reorderTasks,
        updateTaskProject,
        isAddTaskModalOpen,
        openAddTaskModal,
        closeAddTaskModal
    };

    return (
        <TasksContext.Provider value={value}>
            {children}
        </TasksContext.Provider>
    );
}
