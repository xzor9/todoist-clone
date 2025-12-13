import React, { useState, useEffect } from 'react';
import { addTask } from '../services/todo';
import { useAuth } from '../contexts/AuthContext';
import styles from './AddTask.module.css';
import { FaPlus, FaInbox, FaHashtag } from 'react-icons/fa';
import { useProjects } from '../contexts/projectHooks';

export default function AddTask({ defaultDate, isModal, onClose, isCompact }) {
    const [isOpen, setIsOpen] = useState(isModal || false);
    const [content, setContent] = useState('');
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState(defaultDate || '');
    const [isRecurring, setIsRecurring] = useState(false);
    const [recurrenceInterval, setRecurrenceInterval] = useState(1);
    const [recurrenceUnit, setRecurrenceUnit] = useState('Week');

    // ... (Project state matches original)
    const { projects } = useProjects();
    const [selectedProjectId, setSelectedProjectId] = useState(null); // null = Inbox
    const [showProjectModal, setShowProjectModal] = useState(false);

    const { currentUser } = useAuth();


    // Force open if isModal
    useEffect(() => {
        if (isModal) setIsOpen(true);
    }, [isModal]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!content.trim()) return;

        try {
            const recurrenceString = isRecurring
                ? `Every ${recurrenceInterval} ${recurrenceUnit}${recurrenceInterval > 1 ? 's' : ''}`
                : null;

            await addTask(
                currentUser.uid,
                content,
                dueDate || null,
                isRecurring,
                recurrenceString,
                selectedProjectId,
                description
            );

            setContent('');
            setDescription('');
            resetForm();
            if (isModal && onClose) onClose();
            if (!isModal) setIsOpen(false); // Close inline form on submit? Usually yes for Todoist simplicity
        } catch (error) {
            console.error("Failed to add task", error);
        }
    };

    const resetForm = () => {
        setDueDate(defaultDate || '');
        setIsRecurring(false);
        setRecurrenceInterval(1);
        setRecurrenceUnit('Week');
    };

    const handleCancel = () => {
        if (isModal && onClose) {
            onClose();
        } else {
            setIsOpen(false);
        }
    };

    if (!isOpen && !isModal) {
        return (
            <button className={styles.triggerBtn} onClick={() => setIsOpen(true)}>
                <span className={styles.icon}><FaPlus /></span>
                Add task
            </button>
        );
    }


    const containerClass = isModal
        ? styles.modalContainer
        : (isCompact ? styles.compactContainer : styles.container);

    const optionsRowClass = isCompact ? styles.compactOptionsRow : styles.optionsRow;

    const formContent = (
        <div className={containerClass} onClick={e => e.stopPropagation()}>
            <form onSubmit={handleSubmit} className={styles.form}>
                <input
                    autoFocus
                    className={styles.input}
                    placeholder="Task name"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                />

                {!isCompact && (
                    <textarea
                        className={styles.descriptionInput}
                        placeholder="Description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={2}
                    />
                )}

                <div className={optionsRowClass}>
                    <input
                        type="date"
                        className={styles.dateInput}
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                    />

                    <div className={styles.projectSelectWrapper}>
                        <select
                            className={styles.projectSelect}
                            value={selectedProjectId || ""}
                            onChange={(e) => {
                                if (e.target.value === "NEW") {
                                    setShowProjectModal(true);
                                } else {
                                    setSelectedProjectId(e.target.value || null);
                                }
                            }}
                        >
                            <option value="">Inbox</option>
                            {projects.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                            <option disabled>──────────</option>
                            <option value="NEW">+ Create new project</option>
                        </select>
                    </div>

                    <label className={styles.recurringLabel}>
                        <input
                            type="checkbox"
                            checked={isRecurring}
                            onChange={(e) => setIsRecurring(e.target.checked)}
                        />
                        Recurring
                    </label>

                    {isRecurring && (
                        <div className={styles.recurrenceOptions}>
                            <span className={styles.recurrenceText}>Every</span>
                            <input
                                type="number"
                                min="1"
                                max="99"
                                className={styles.intervalInput}
                                value={recurrenceInterval}
                                onChange={(e) => setRecurrenceInterval(parseInt(e.target.value) || 1)}
                            />
                            <select
                                className={styles.unitSelect}
                                value={recurrenceUnit}
                                onChange={(e) => setRecurrenceUnit(e.target.value)}
                            >
                                <option value="Day">Day</option>
                                <option value="Week">Week</option>
                                <option value="Month">Month</option>
                                <option value="Year">Year</option>
                            </select>
                        </div>
                    )}
                </div>

                <div className={styles.actions}>
                    <button type="submit" className={styles.addBtn} disabled={!content.trim()}>
                        Add task
                    </button>
                    <button type="button" className={styles.cancelBtn} onClick={handleCancel}>
                        Cancel
                    </button>
                </div>
            </form>

            {showProjectModal && (
                <AddProjectModal
                    onClose={() => setShowProjectModal(false)}
                    onProjectCreated={(newId) => {
                        setSelectedProjectId(newId);
                    }}
                />
            )}
        </div>
    );

    if (isModal) {
        return (
            <div className={styles.modalOverlay} onClick={handleCancel}>
                {formContent}
            </div>
        );
    }

    return formContent;
}
