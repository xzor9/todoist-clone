import React, { useState, useEffect, useMemo } from 'react';
import { parseTaskInput } from '../utils/nlpParser';
import { formatRecurrence } from '../utils/recurrence';
import { addTask } from '../services/todo';
import { useAuth } from '../contexts/AuthContext';
import styles from './AddTask.module.css';
import { FaPlus, FaInbox, FaHashtag } from 'react-icons/fa';
import { useProjects } from '../contexts/projectHooks';
import AddProjectModal from './AddProjectModal';

export default function AddTask({ defaultDate, isModal, onClose, isCompact, defaultOpen }) {
    const [isOpen, setIsOpen] = useState(isModal || defaultOpen || false);
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

    // NLP Preview State
    const parsedPreview = useMemo(() => {
        if (!content) return null;
        return parseTaskInput(content, projects);
    }, [content, projects]);


    // Force open if isModal
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (isModal) setIsOpen(true);
    }, [isModal]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!content.trim()) return;

        try {
            // NLP Parsing
            const parsed = parseTaskInput(content, projects);
            const finalContent = parsed.content;
            const finalDate = parsed.date ? parsed.date.toISOString().split('T')[0] : (dueDate || null); // formatting simple YYYY-MM-DD for now if possible, else ISO
            // Note: Priority is detected but we don't have a priority field in addTask service yet? 
            // Assuming we might need to update service or ignoring priority for now if not supported.
            // But let's assume we want to pass it if we could. For now, let's just use the parsed content and date.

            const recurrenceString = isRecurring
                ? formatRecurrence(recurrenceInterval, recurrenceUnit)
                : null;

            await addTask(
                currentUser.uid,
                finalContent,
                finalDate,
                isRecurring,
                recurrenceString,
                parsed.projectId || selectedProjectId,
                description
            );

            setContent('');
            setDescription('');
            resetForm();
            if (onClose) onClose();
            else setIsOpen(false);
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
        if (onClose) {
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

                {parsedPreview && (content.trim().length > 0) && (
                    <div className={styles.nlpPreview} style={{ fontSize: '0.8rem', color: '#db4c3f', marginTop: '4px', marginBottom: '8px', display: 'flex', gap: '8px' }}>
                        {parsedPreview.date && (
                            <span>📅 {parsedPreview.date.toLocaleDateString()} {parsedPreview.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        )}
                        {parsedPreview.priority && (
                            <span>🚩 P{parsedPreview.priority}</span>
                        )}
                        {parsedPreview.projectId && (
                            <span># {projects.find(p => p.id === parsedPreview.projectId)?.name}</span>
                        )}
                    </div>
                )}

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
