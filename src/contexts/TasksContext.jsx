import React, { useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../firebase';
import { subscribeToTasks, reorderTasks } from '../services/todo';
import { doc as firestoreDoc, updateDoc as firestoreUpdateDoc } from 'firebase/firestore';
import { TasksContext } from './taskHooks';

export default function TasksProvider({ children }) {
    const { currentUser } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUser) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setTasks([]);
            setLoading(false);
            return;
        }

        const unsubscribe = subscribeToTasks(currentUser.uid, (fetchedTasks) => {
            setTasks(fetchedTasks);
            setLoading(false);
        });

        return unsubscribe;
    }, [currentUser]); // eslint-disable-line react-hooks/exhaustive-deps

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
