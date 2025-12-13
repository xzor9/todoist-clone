import React, { useState, useEffect } from 'react';
import { getTask, updateTaskContent, toggleTaskCompletion, updateTaskDescription, updateTaskProject } from '../services/todo';
import {
    FaTimes,
    FaEllipsisH,
    FaChevronUp,
    FaChevronDown,
    FaCheck,
    FaCalendarAlt,
    FaRegClock,
    FaHashtag
} from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { useProjects } from '../contexts/ProjectsContext';
import styles from './TaskDetailModal.module.css';

export default function TaskDetailModal({ taskId, onClose }) {
    const { currentUser } = useAuth();
    const [task, setTask] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editTitle, setEditTitle] = useState('');
    const [editDescription, setEditDescription] = useState('');

    // Projects for dropdown
    const { projects } = useProjects();
    const [showProjectDropdown, setShowProjectDropdown] = useState(false);

    useEffect(() => {
        async function fetchTask() {
            setLoading(true);
            try {
                const fetchedTask = await getTask(taskId);
                if (fetchedTask) {
                    setTask(fetchedTask);
                    setEditTitle(fetchedTask.content);
                    setEditDescription(fetchedTask.description || '');
                } else {
                    setError('Task not found');
                }
            } catch (err) {
                console.error("Error fetching task details:", err);
                setError('Failed to load task');
            } finally {
                setLoading(false);
            }
        }
        if (taskId) {
            fetchTask();
        }
    }, [taskId]);


    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handleTitleSave = async () => {
        if (editTitle.trim() !== task.content) {
            await updateTaskContent(taskId, editTitle);
            setTask(prev => ({ ...prev, content: editTitle }));
        }
    };

    const handleDescriptionSave = async () => {
        if (editDescription !== (task.description || '')) {
            await updateTaskDescription(taskId, editDescription);
            setTask(prev => ({ ...prev, description: editDescription }));
        }
    };

    const handleToggle = async () => {
        const newStatus = !task.isCompleted;
        await toggleTaskCompletion(taskId, task.isCompleted);
        setTask(prev => ({ ...prev, isCompleted: newStatus }));
    };

    const handleProjectChange = async (projectId) => {
        await updateTaskProject(taskId, projectId);
        setTask(prev => ({ ...prev, projectId: projectId }));
        setShowProjectDropdown(false);
    };

    const getProjectName = (id) => {
        const p = projects.find(pr => pr.id === id);
        return p ? p.name : 'Inbox';
    };

    if (!taskId) return null;

    // Determine completion status for checkbox styling
    const isCompleted = task?.isCompleted;

    return (
        <div className={styles.overlay} onClick={handleBackdropClick}>
            <div className={styles.modal}>
                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.headerLeft}>
                        <span>#{getProjectName(task?.projectId)}</span>
                        {task?.isRecurring && <span>🔄</span>}
                    </div>
                    <div className={styles.headerRight}>
                        <FaChevronUp className={styles.clickableIcon} />
                        <FaChevronDown className={styles.clickableIcon} />
                        <FaEllipsisH className={styles.clickableIcon} />
                        <FaTimes className={styles.clickableIcon} onClick={onClose} />
                    </div>
                </div>

                {loading ? (
                    <div className={styles.loading}>Loading...</div>
                ) : error ? (
                    <div className={styles.error}>{error}</div>
                ) : (
                    <div className={styles.contentWrapper}>
                        {/* Main Content */}
                        <div className={styles.mainContent}>
                            <div className={styles.taskHeader}>
                                <div
                                    onClick={handleToggle}
                                    className={`${styles.checkbox} ${isCompleted ? styles.completed : ''}`}
                                >
                                    {isCompleted && <FaCheck size={12} color="white" />}
                                </div>
                                <div className={styles.inputWrapper}>
                                    {/* Title Input */}
                                    <input
                                        value={editTitle}
                                        onChange={(e) => setEditTitle(e.target.value)}
                                        onBlur={handleTitleSave}
                                        placeholder="Task name"
                                        className={styles.titleInput}
                                    />

                                    {/* Description Input */}
                                    <div className={styles.descriptionWrapper}>
                                        <FaRegClock className={styles.descriptionIcon} />
                                        <textarea
                                            value={editDescription}
                                            onChange={(e) => setEditDescription(e.target.value)}
                                            onBlur={handleDescriptionSave}
                                            placeholder="Description"
                                            rows={5}
                                            className={styles.descriptionInput}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className={styles.sidebar}>
                            {/* Project / Labels Renamed */}
                            <div className={styles.sidebarSection}>
                                <div className={styles.sidebarLabel}>Project</div>
                                <div
                                    className={styles.projectSelector}
                                    onClick={() => setShowProjectDropdown(!showProjectDropdown)}
                                >
                                    <FaHashtag color="var(--text-secondary)" />
                                    {getProjectName(task.projectId)}
                                </div>

                                {showProjectDropdown && (
                                    <div className={styles.dropdown}>
                                        <div
                                            className={`${styles.dropdownItem} ${styles.bordered}`}
                                            onClick={() => handleProjectChange(null)}
                                        >
                                            Inbox
                                        </div>
                                        {projects.map(p => (
                                            <div
                                                key={p.id}
                                                className={styles.dropdownItem}
                                                onClick={() => handleProjectChange(p.id)}
                                            >
                                                <span className={styles.projectColor} style={{ background: p.color }}></span>
                                                {p.name}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className={styles.sidebarSection}>
                                <div className={styles.sidebarLabel}>Date</div>
                                <div className={styles.dateDisplay}>
                                    <FaCalendarAlt color="#d1453b" />
                                    {task.dueDate || 'No due date'}
                                    {task.isRecurring && ' 🔄'}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
