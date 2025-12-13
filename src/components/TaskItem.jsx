import React, { useState, useEffect } from 'react';
import { toggleTaskCompletion, deleteTask, updateTaskContent, subscribeToProjects } from '../services/todo';
import { FaTrash, FaPen, FaCheck } from 'react-icons/fa';
import styles from './TaskItem.module.css';
import { useAuth } from '../contexts/AuthContext';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FaGripVertical } from 'react-icons/fa';

export default function TaskItem({ task }) {
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(task.content);
    const [project, setProject] = useState(null);
    const { currentUser } = useAuth();

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: task.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        touchAction: 'none' // Prevent scrolling while dragging on touch
    };

    // Fetch project details if projectId exists
    // Optimization: In a real app, projects should be in context/store to avoid N+1 queries.
    // For this scale, a simple subscriber or just passing projects down is fine.
    // We'll trust subscribeToProjects caches or listen once. 
    // Actually, fetching *all* projects just to find one name is inefficient per item.
    // Let's assume for now we might map it in the parent list, OR just fetch here for simplicity.
    // Better: The TaskList should ideally pass project map. 
    // Simplest for now: Subscribe to ALL projects in context or parent?
    // Let's keep it isolated but simple: We'll add a helper to get one project? No, Firestore is async.
    // Let's just subscribe here, it's a bit heavy but works for MVP.

    useEffect(() => {
        if (task.projectId) {
            // This is a bit inefficient (N listeners), but simplest for "scratch" build.
            // A better way is useContext(ProjectsContext).
            const unsubscribe = subscribeToProjects(currentUser.uid, (projects) => {
                const p = projects.find(p => p.id === task.projectId);
                setProject(p);
            });
            return unsubscribe;
        }
    }, [task.projectId, currentUser]);

    const handleToggle = () => {
        toggleTaskCompletion(task.id, task.isCompleted);
    };

    const handleDelete = () => {
        deleteTask(task.id);
    };

    const handleSave = () => {
        if (editContent.trim()) {
            updateTaskContent(task.id, editContent);
            setIsEditing(false);
        }
    };

    return (
        <div ref={setNodeRef} style={style} className={styles.item}>
            <div
                className={styles.dragHandle}
                {...attributes}
                {...listeners}
                style={{ cursor: 'grab', marginRight: '0.5rem', color: '#ccc', display: 'flex', alignItems: 'center' }}
            >
                <FaGripVertical />
            </div>
            <div
                className={`${styles.checkbox} ${task.isCompleted ? styles.checked : ''}`}
                onClick={handleToggle}
            >
                <FaCheck className={styles.checkIcon} />
            </div>

            <div className={styles.contentWrapper}>
                {isEditing ? (
                    <form
                        onSubmit={(e) => { e.preventDefault(); handleSave(); }}
                        className={styles.editForm}
                    >
                        <input
                            className={styles.editInput}
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            autoFocus
                            onBlur={handleSave}
                        />
                    </form>
                ) : (
                    <>
                        <span
                            className={`${styles.content} ${task.isCompleted ? styles.completedText : ''}`}
                            onClick={() => setIsEditing(true)}
                        >
                            {task.content}
                        </span>

                        {task.recurrence && (
                            <span className={styles.recurrenceInfo}>🔄 {task.recurrence}</span>
                        )}
                        <div className={styles.metaRow}>
                            {task.dueDate && (
                                <span className={styles.date}>{task.dueDate}</span>
                            )}
                            {project && (
                                <span
                                    className={styles.projectTag}
                                    style={{ color: project.color }}
                                >
                                    #{project.name}
                                </span>
                            )}
                        </div>
                    </>
                )}
            </div>

            <div className={styles.actions}>
                <button className={styles.actionBtn} onClick={() => setIsEditing(true)}>
                    <FaPen />
                </button>
                <button className={styles.actionBtn} onClick={handleDelete}>
                    <FaTrash />
                </button>
            </div>
        </div>
    );
}
