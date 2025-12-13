import React, { useState, useEffect } from 'react';
import { getTask, updateTaskContent, toggleTaskCompletion, updateTaskDescription, updateTaskProject, subscribeToProjects } from '../services/todo';
import {
    FaTimes,
    FaEllipsisH,
    FaChevronUp,
    FaChevronDown,
    FaCheck,
    FaCalendarAlt,
    FaRegClock,
    FaHashtag,
    FaPlus
} from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';

export default function TaskDetailModal({ taskId, onClose }) {
    const { currentUser } = useAuth();
    const [task, setTask] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editTitle, setEditTitle] = useState('');
    const [editDescription, setEditDescription] = useState('');

    // Projects for dropdown
    const [projects, setProjects] = useState([]);
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

    useEffect(() => {
        if (currentUser) {
            const unsubscribe = subscribeToProjects(currentUser.uid, setProjects);
            return unsubscribe;
        }
    }, [currentUser]);

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

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(0,0,0,0.5)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 1000
            }}
            onClick={handleBackdropClick}
        >
            <div
                style={{
                    backgroundColor: 'var(--bg-color)',
                    width: '800px',
                    maxWidth: '90%',
                    height: '80vh',
                    borderRadius: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    color: 'var(--text-primary)',
                    boxShadow: 'var(--shadow-md)',
                    border: '1px solid var(--border-color)'
                }}
            >
                {/* Header */}
                <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        <span>#{getProjectName(task?.projectId)}</span>
                        {task?.isRecurring && <span>🔄</span>}
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-secondary)' }}>
                        <FaChevronUp style={{ cursor: 'pointer' }} />
                        <FaChevronDown style={{ cursor: 'pointer' }} />
                        <FaEllipsisH style={{ cursor: 'pointer' }} />
                        <FaTimes style={{ cursor: 'pointer' }} onClick={onClose} />
                    </div>
                </div>

                {loading ? (
                    <div style={{ padding: '2rem' }}>Loading...</div>
                ) : error ? (
                    <div style={{ padding: '2rem', color: 'red' }}>{error}</div>
                ) : (
                    <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                        {/* Main Content */}
                        <div style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                                <div
                                    onClick={handleToggle}
                                    style={{
                                        width: '24px',
                                        height: '24px',
                                        borderRadius: '50%',
                                        border: `2px solid ${task.isCompleted ? 'var(--primary-color)' : 'var(--text-secondary)'}`,
                                        backgroundColor: task.isCompleted ? 'var(--primary-color)' : 'transparent',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        flexShrink: 0,
                                        marginTop: '4px'
                                    }}
                                >
                                    {task.isCompleted && <FaCheck size={12} color="white" />}
                                </div>
                                <div style={{ flex: 1 }}>
                                    {/* Title Input */}
                                    <input
                                        value={editTitle}
                                        onChange={(e) => setEditTitle(e.target.value)}
                                        onBlur={handleTitleSave}
                                        placeholder="Task name"
                                        style={{
                                            background: 'transparent',
                                            border: '1px solid var(--border-color)',
                                            borderRadius: '4px',
                                            padding: '8px',
                                            color: 'var(--text-primary)',
                                            fontSize: '1.5rem',
                                            fontWeight: 'bold',
                                            width: '100%',
                                            outline: 'none',
                                            marginBottom: '1rem'
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = '#666'}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = 'var(--border-color)';
                                            handleTitleSave();
                                        }}
                                    />

                                    {/* Description Input */}
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '1rem' }}>
                                        <FaRegClock style={{ marginTop: '12px', color: 'var(--text-secondary)' }} />
                                        <textarea
                                            value={editDescription}
                                            onChange={(e) => setEditDescription(e.target.value)}
                                            onBlur={handleDescriptionSave}
                                            placeholder="Description"
                                            rows={5}
                                            style={{
                                                background: 'transparent',
                                                border: '1px solid var(--border-color)',
                                                borderRadius: '4px',
                                                padding: '8px',
                                                color: 'var(--text-primary)',
                                                fontSize: '0.9rem',
                                                width: '100%',
                                                outline: 'none',
                                                resize: 'vertical',
                                                fontFamily: 'inherit'
                                            }}
                                            onFocus={(e) => e.target.style.borderColor = '#666'}
                                            onBlur={(e) => {
                                                e.target.style.borderColor = 'var(--border-color)';
                                                handleDescriptionSave();
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div style={{ width: '300px', background: 'var(--bg-sidebar)', padding: '1rem', borderLeft: '1px solid var(--border-color)', overflowY: 'auto' }}>
                            {/* Project / Labels Renamed */}
                            <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Project</div>
                                <div
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}
                                    onClick={() => setShowProjectDropdown(!showProjectDropdown)}
                                >
                                    <FaHashtag color="var(--text-secondary)" />
                                    {getProjectName(task.projectId)}
                                </div>

                                {showProjectDropdown && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '100%',
                                        left: 0,
                                        width: '100%',
                                        backgroundColor: 'var(--bg-color)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '4px',
                                        boxShadow: 'var(--shadow-md)',
                                        zIndex: 10,
                                        maxHeight: '200px',
                                        overflowY: 'auto'
                                    }}>
                                        <div
                                            style={{ padding: '8px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)' }}
                                            onClick={() => handleProjectChange(null)}
                                        >
                                            Inbox
                                        </div>
                                        {projects.map(p => (
                                            <div
                                                key={p.id}
                                                style={{ padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                                                onClick={() => handleProjectChange(p.id)}
                                            >
                                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }}></span>
                                                {p.name}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Date</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <FaCalendarAlt color="#d1453b" />
                                    {task.dueDate || 'No due date'}
                                    {task.isRecurring && ' 🔄'}
                                </div>
                            </div>

                            {/* Removed Priority */}
                            {/* Removed Labels (Converted to Project above) */}

                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
