import React, { useState, useEffect } from 'react';
import { getTask, updateTaskContent, toggleTaskCompletion, updateTaskDescription, updateTaskProject, updateTaskDate } from '../services/todo';
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
import { useTasks } from '../contexts/taskHooks';
import { useProjects } from '../contexts/projectHooks';
import styles from './TaskDetailModal.module.css';

export default function TaskDetailModal({ taskId, onClose }) {
    const { tasks } = useTasks();
    const [task, setTask] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editTitle, setEditTitle] = useState('');
    const [editDescription, setEditDescription] = useState('');

    // Date & Recurrence State
    const [editDueDate, setEditDueDate] = useState('');
    const [isRecurring, setIsRecurring] = useState(false);
    const [recurrenceInterval, setRecurrenceInterval] = useState(1);
    const [recurrenceUnit, setRecurrenceUnit] = useState('Week');
    const [showDateEdit, setShowDateEdit] = useState(false);


    // Projects for dropdown
    const { projects } = useProjects();
    const [showProjectDropdown, setShowProjectDropdown] = useState(false);

    useEffect(() => {
        async function fetchTask() {
            setLoading(true);
            try {

                // Optimistic load for speed and fallback for tests
                const cachedTask = tasks.find(t => t.id === taskId);
                let fetchedTask = cachedTask;

                try {
                    // Try to fetch fresh data
                    const serverTask = await getTask(taskId);
                    if (serverTask) fetchedTask = serverTask;
                } catch (fetchErr) {
                    console.warn("Could not fetch fresh task, using cache if available.", fetchErr);
                    // If no cache and fetch failed, throw
                    if (!cachedTask) throw fetchErr;
                }

                if (fetchedTask) {
                    setTask(fetchedTask);
                    setEditTitle(fetchedTask.content);
                    setEditDescription(fetchedTask.description || '');
                    setEditDueDate(fetchedTask.dueDate || '');
                    setIsRecurring(fetchedTask.isRecurring || false);

                    // Parse recurrence string if exists (Simple parsing)
                    if (fetchedTask.recurrence) {
                        // Example: "Every 2 Weeks"
                        // Very basic parser matching AddTask logic
                        const parts = fetchedTask.recurrence.split(' ');
                        // parts[0] = "Every"
                        // parts[1] = number
                        // parts[2] = Unit(s)
                        if (parts.length >= 3) {
                            setRecurrenceInterval(parseInt(parts[1]) || 1);
                            let unit = parts[2];
                            if (unit.endsWith('s')) unit = unit.slice(0, -1);
                            setRecurrenceUnit(unit);
                        }
                    }

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
    }, [taskId, tasks]);


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

    const handleDateSave = async () => {
        const recurrenceString = isRecurring
            ? `Every ${recurrenceInterval} ${recurrenceUnit}${recurrenceInterval > 1 ? 's' : ''}`
            : null;

        await updateTaskDate(taskId, editDueDate || null, isRecurring, recurrenceString);
        setTask(prev => ({
            ...prev,
            dueDate: editDueDate || null,
            isRecurring: isRecurring,
            recurrence: recurrenceString
        }));
        setShowDateEdit(false);
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

                                {!showDateEdit ? (
                                    <div
                                        className={styles.dateDisplay}
                                        onClick={() => setShowDateEdit(true)}
                                        style={{ cursor: 'pointer', padding: '4px', borderRadius: '4px', transition: 'background-color 0.2s' }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--hover-color)'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                        <FaCalendarAlt color="#d1453b" />
                                        {task.dueDate || 'No due date'}
                                        {task.isRecurring && ' 🔄'}
                                    </div>
                                ) : (
                                    <div style={{ padding: '8px', border: '1px solid var(--border-color)', borderRadius: '4px', backgroundColor: 'var(--bg-color)' }}>
                                        <input
                                            type="date"
                                            value={editDueDate}
                                            onChange={(e) => setEditDueDate(e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '4px',
                                                marginBottom: '8px',
                                                border: '1px solid var(--border-color)',
                                                borderRadius: '4px',
                                                background: 'var(--bg-color)',
                                                color: 'var(--text-primary)'
                                            }}
                                        />

                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '0.9rem' }}>
                                            <input
                                                type="checkbox"
                                                checked={isRecurring}
                                                onChange={(e) => setIsRecurring(e.target.checked)}
                                            />
                                            Recurring
                                        </label>

                                        {isRecurring && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
                                                <span style={{ fontSize: '0.8rem' }}>Every</span>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="99"
                                                    value={recurrenceInterval}
                                                    onChange={(e) => setRecurrenceInterval(parseInt(e.target.value) || 1)}
                                                    style={{ width: '40px', padding: '4px', border: '1px solid var(--border-color)', borderRadius: '4px' }}
                                                />
                                                <select
                                                    value={recurrenceUnit}
                                                    onChange={(e) => setRecurrenceUnit(e.target.value)}
                                                    style={{ flex: 1, padding: '4px', border: '1px solid var(--border-color)', borderRadius: '4px' }}
                                                >
                                                    <option value="Day">Day</option>
                                                    <option value="Week">Week</option>
                                                    <option value="Month">Month</option>
                                                    <option value="Year">Year</option>
                                                </select>
                                            </div>
                                        )}

                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                            <button
                                                onClick={() => setShowDateEdit(false)}
                                                style={{ padding: '4px 8px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)' }}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleDateSave}
                                                style={{ padding: '4px 12px', border: 'none', borderRadius: '4px', background: 'var(--primary-color)', color: 'white', cursor: 'pointer' }}
                                            >
                                                Save
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
