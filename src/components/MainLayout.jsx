import React, { useState } from 'react';
import Sidebar from './Sidebar';
import {
    DndContext,
    closestCorners, // Better for 2D (list + sidebar)
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { FaBars } from 'react-icons/fa';
import styles from './MainLayout.module.css';
import { useTasks } from '../contexts/TasksContext';

export default function MainLayout({ children, activeTab, setActiveTab }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { setTasks, reorderTasks, updateTaskProject } = useTasks();

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Prevent accidental drags
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (!over) return;

        // Case 1: Dropped onto a Project (Sidebar)
        if (over.data.current?.type === 'project') {
            const taskId = active.id;
            const targetProjectId = over.data.current.projectId;

            // Optimistically update UI (remove from current list if applicable)
            // But main update logic is handled by context/service
            updateTaskProject(taskId, targetProjectId);

            // If dragging from list, we might want to let the list know? 
            // The subscription will update the list automatically.
            return;
        }

        // Case 2: Reordering within the list (Task over Task)
        if (active.id !== over.id) {
            // Logic handles by TaskList mostly, but since Context is lifted, we manipulate global tasks?
            // Issue: 'tasks' here is ALL tasks. We only reorder the FILTERED subset usually.
            // If we reorder global list, it might be weird if items are far apart.
            // BUT, DndContext is now global.

            // If we are strictly reordering visible items, we need to know the VISIBLE list indices.
            // Since MainLayout doesn't know about FilteredTasks easily...
            // Strategy: We pass the reorder responsibility back to state.
            // However, arrayMove depends on indices.

            // Hack/Fix: We can find the indices in the GLOBAL list? 
            // Or, we only support reordering if the list is flat.

            // Better approach: Let TaskList handle reordering? 
            // IF DndContext is here, ALL drag events bubble here.

            // If we drop task on task, we find them in global list and swap?
            // That works if they are both in the global list.

            setTasks((items) => {
                const oldIndex = items.findIndex((i) => i.id === active.id);
                const newIndex = items.findIndex((i) => i.id === over.id);

                if (oldIndex !== -1 && newIndex !== -1) {
                    const newItems = arrayMove(items, oldIndex, newIndex);
                    reorderTasks(newItems); // Persist
                    return newItems;
                }
                return items;
            });
        }
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragEnd={handleDragEnd}
        >
            <div className={styles.layout}>
                {/* Mobile Header */}
                <div className={styles.mobileHeader}>
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={styles.menuBtn}>
                        <FaBars />
                    </button>
                    <span className={styles.mobileTitle}>Todoist Clone</span>
                </div>

                {/* Sidebar Overlay for Mobile */}
                {isSidebarOpen && (
                    <div className={styles.overlay} onClick={() => setIsSidebarOpen(false)} />
                )}

                {/* Sidebar Wrapper */}
                <div className={`${styles.sidebarWrapper} ${isSidebarOpen ? styles.open : ''}`}>
                    <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
                </div>

                {/* Main Content */}
                <main className={styles.main}>
                    {children}
                </main>
            </div>
        </DndContext>
    );
}
