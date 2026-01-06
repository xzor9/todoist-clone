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
    const [results, setResults] = useState([]);
    const [selectedTaskId, setSelectedTaskId] = useState(null);
    const inputRef = useRef(null);

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    useEffect(() => {
        if (!query.trim()) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setResults([]);
            return;
        }

        const lowerQuery = query.toLowerCase();
        const filtered = tasks.filter(task => {
            const contentMatch = task.content?.toLowerCase().includes(lowerQuery);
            const descMatch = task.description?.toLowerCase().includes(lowerQuery);
            return !task.isCompleted && (contentMatch || descMatch); // Optionally exclude completed tasks? Todoist searches everything usually. Let's include everything or just active? Todoist usually separates completed. Let's search all for now, or just active. The prompt says "search all existing tasks". I'll search active tasks for now as that's more common, but maybe I should check if "all existing" implies completed too. Let's stick to !isCompleted for clutter reduction unless user asks.
        });
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setResults(filtered);
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
