import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { toggleTaskCompletion, deleteTask, updateTaskContent } from '../services/todo';
import { FaTrash, FaPen, FaCheck } from 'react-icons/fa';
import styles from './TaskItem.module.css';
import { useAuth } from '../contexts/AuthContext';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FaGripVertical } from 'react-icons/fa';

import { useProjects } from '../contexts/projectHooks';

export default function TaskItem({ task, onTaskClick }) {
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(task.content);
    const { currentUser } = useAuth();
    const { projects } = useProjects();

    const project = projects.find(p => p.id === task.projectId);

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


    const handleToggle = async (e) => {
        if (!task.isCompleted && e) {
            // Trigger confetti
            const rect = e.currentTarget.getBoundingClientRect();
            const x = (rect.left + rect.width / 2) / window.innerWidth;
            const y = (rect.top + rect.height / 2) / window.innerHeight;

            confetti({
                origin: { x, y },
                particleCount: 25,
                spread: 40,
                colors: ['#e15252', '#33a06f', '#3b8fc2', '#e9a140', '#9c54ce'] // Todoist-ish colors
            });
        }
        try {
            await toggleTaskCompletion(task.id, task.isCompleted);
        } catch (error) {
            console.error("Failed to toggle task:", error);
        }
    };

    const handleDelete = async () => {
        try {
            await deleteTask(task.id);
        } catch (error) {
            console.error("Failed to delete task:", error);
        }
    };

    const handleSave = async () => {
        if (editContent.trim()) {
            try {
                await updateTaskContent(task.id, editContent);
                setIsEditing(false);
            } catch (error) {
                console.error("Failed to update task content:", error);
            }
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
                            onClick={() => onTaskClick && onTaskClick(task.id)}
                            style={{ cursor: 'pointer' }}
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
