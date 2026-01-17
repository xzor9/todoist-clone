import React, { useState, useEffect, useRef } from 'react';
import { FaSearch, FaTimes } from 'react-icons/fa';
import styles from './SearchModal.module.css';
import { useTasks } from '../contexts/taskHooks';
import { useProjects } from '../contexts/projectHooks';
import TaskDetailModal from './TaskDetailModal';

export default function SearchModal({ onClose }) {
    const { tasks } = useTasks();
    const { projects } = useProjects();
    const [query, setQuery] = useState('');
    const [selectedTaskId, setSelectedTaskId] = useState(null);
    const inputRef = useRef(null);

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    const results = React.useMemo(() => {
        if (!query.trim()) return [];

        const lowerQuery = query.toLowerCase();
        return tasks.filter(task => {
            const contentMatch = task.content?.toLowerCase().includes(lowerQuery);
            const descriptionMatch = task.description?.toLowerCase().includes(lowerQuery);
            return !task.isCompleted && (contentMatch || descriptionMatch);
        });
    }, [query, tasks]);

    const getProjectName = (projectId) => {
        if (!projectId) return 'Inbox';
        const project = projects.find(p => p.id === projectId);
        return project ? project.name : 'Inbox';
    };

    const handleTaskClick = (taskId) => {
        setSelectedTaskId(taskId);
    };

    const closeDetailModal = () => {
        setSelectedTaskId(null);
    };

    return (
        <div className={styles.overlay} onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
        }}>
            <div className={styles.modal}>
                <div className={styles.inputWrapper}>
                    <FaSearch className={styles.searchIcon} />
                    <input
                        ref={inputRef}
                        type="text"
                        className={styles.input}
                        placeholder="Search tasks..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <button className={styles.closeBtn} onClick={onClose}>
                        <FaTimes />
                    </button>
                </div>

                <div className={styles.resultsList}>
                    {query && results.length === 0 && (
                        <div className={styles.noResults}>No tasks found.</div>
                    )}

                    {results.map(task => (
                        <div
                            key={task.id}
                            className={styles.resultItem}
                            onClick={() => handleTaskClick(task.id)}
                        >
                            <div className={styles.checkCircle} />
                            <div className={styles.taskContent}>
                                <span className={styles.taskText}>{task.content}</span>
                                <span className={styles.taskProject}>{getProjectName(task.projectId)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {selectedTaskId && (
                <TaskDetailModal
                    taskId={selectedTaskId}
                    onClose={closeDetailModal}
                />
            )}
        </div>
    );
}
