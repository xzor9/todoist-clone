import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
    format,
    addDays,
    subDays,
    startOfWeek,
    isSameDay,
    parseISO,
    startOfToday,
    isToday,
    isTomorrow,
    isBefore,
    differenceInCalendarDays
} from 'date-fns';
import { FaChevronLeft, FaChevronRight, FaPlus, FaCheck, FaChevronDown, FaChevronUp, FaCalendarAlt, FaInbox, FaTimes } from 'react-icons/fa';
import { useTasks } from '../contexts/taskHooks';
import { toggleTaskCompletion, updateTaskDate } from '../services/todo';
import { subscribeToProjects } from '../services/todo';
import { useAuth } from '../contexts/AuthContext';
import styles from './UpcomingView.module.css';
import AddTask from './AddTask';

const TaskItem = ({ task, projectName, projectColor, onTaskClick }) => {
    const handleToggle = (e) => {
        e.stopPropagation();
        toggleTaskCompletion(task.id, task.isCompleted);
    };

    const isOverdue = task.dueDate && isBefore(parseISO(task.dueDate), startOfToday());
    const dueDateLabel = task.dueDate ? format(parseISO(task.dueDate), 'MMM d') : '';

    return (
        <div className={styles.taskItem} onClick={() => onTaskClick && onTaskClick(task.id)}>
            <div
                className={styles.checkbox}
                onClick={handleToggle}
                style={{
                    borderColor: task.isCompleted ? 'var(--primary-color)' : 'var(--text-secondary)',
                    backgroundColor: task.isCompleted ? 'var(--primary-color)' : 'transparent',
                }}
            >
                {task.isCompleted && <FaCheck color="white" size={10} />}
            </div>
            <div className={styles.taskContent}>
                <div className={styles.taskText} style={{ textDecoration: task.isCompleted ? 'line-through' : 'none', color: task.isCompleted ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
                    {task.content}
                </div>
                <div className={styles.taskMeta}>
                    {isOverdue && !task.isCompleted && (
                        <span className={styles.overdueDate}>
                            <FaCalendarAlt size={10} style={{ marginRight: 4 }} />
                            {dueDateLabel}
                        </span>
                    )}

                    {projectName && (
                        <span className={styles.projectLabel}>
                            <span style={{ color: projectColor || '#808080' }}>#</span>
                            {projectName}
                        </span>
                    )}

                    {task.recurrence &&
                        <span title="Recurring">
                            🔄
                        </span>
                    }
                </div>
            </div>
        </div>
    );
};

const CalendarStrip = ({ startDate, onDateClick, weeksToShow = 2, selectedDate }) => {
    const days = useMemo(() => {
        // Show 2 weeks starting from today or start date
        // Mobile UX: "Today" is usually the anchor.
        return Array.from({ length: 7 * weeksToShow }).map((_, i) => addDays(startDate, i));
    }, [startDate, weeksToShow]);

    return (
        <div className={styles.calendarStrip}>
            {days.map(day => {
                const isCurrent = isSameDay(day, new Date());
                const isSelected = selectedDate && isSameDay(day, selectedDate);

                return (
                    <div
                        key={day.toISOString()}
                        className={`${styles.calendarDay} ${isCurrent ? styles.active : ''} ${isSelected ? styles.selected : ''}`}
                        onClick={() => onDateClick && onDateClick(day)}
                    >
                        <span className={styles.calendarDayName}>{format(day, 'E')[0]}</span>
                        <span className={styles.calendarDayNumber}>{format(day, 'd')}</span>
                    </div>
                );
            })}
        </div>
    );
};

const OverdueSection = ({ tasks, getProjectDetails, onTaskClick, onReschedule }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    if (!tasks || tasks.length === 0) return null;

    return (
        <div className={styles.overdueSection}>
            <div className={styles.overdueHeader} onClick={() => setIsCollapsed(!isCollapsed)}>
                <div className={styles.overdueTitle}>
                    Overdue
                    <span className={styles.taskCount}>• {tasks.length}</span>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <button className={styles.rescheduleBtn} onClick={(e) => { e.stopPropagation(); onReschedule(); }}>
                        Reschedule
                    </button>
                    {isCollapsed ? <FaChevronDown size={12} /> : <FaChevronUp size={12} />}
                </div>
            </div>

            {!isCollapsed && (
                <div className={styles.taskList}>
                    {tasks.map(task => {
                        const { name, color } = getProjectDetails(task.projectId);
                        return (
                            <TaskItem
                                key={task.id}
                                task={task}
                                projectName={name}
                                projectColor={color}
                                onTaskClick={onTaskClick}
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
};

// Simple Modal for Mobile Task Add if needed, or re-use existing
const MobileAddTaskModal = ({ onClose, defaultDate }) => {
    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'flex-end', // Bottom sheet style
        }} onClick={onClose}>
            <div style={{
                width: '100%',
                backgroundColor: 'var(--bg-color)',
                padding: '1rem',
                borderTopLeftRadius: '16px',
                borderTopRightRadius: '16px',
                maxHeight: '80vh',
                overflowY: 'auto'
            }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <h3>Add Task</h3>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }}>
                        <FaTimes size={20} />
                    </button>
                </div>
                <AddTask defaultDate={defaultDate} onClose={onClose} defaultOpen={true} />
            </div>
        </div>
    )
}

export default function UpcomingView({ onTaskClick }) {
    const { tasks, loading } = useTasks();
    const { currentUser } = useAuth();
    const [startDate, setStartDate] = useState(startOfToday());
    const [projects, setProjects] = useState([]);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [showAddTask, setShowAddTask] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null); // For scrolling highlighting

    const dateRefs = useRef({});

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (currentUser) {
            const unsubscribe = subscribeToProjects(currentUser.uid, setProjects);
            return unsubscribe;
        }
    }, [currentUser]);

    const getProjectDetails = (projectId) => {
        const project = projects.find(p => p.id === projectId);
        return project ? { name: project.name, color: project.color } : { name: 'Inbox', color: '#808080' };
    };

    // Calculate Dates
    const daysToRender = isMobile ? 14 : 7;
    const days = useMemo(() => {
        return Array.from({ length: daysToRender }).map((_, i) => addDays(startDate, i));
    }, [startDate, daysToRender]);

    // Group Tasks
    const { overdueTasks, tasksByDate } = useMemo(() => {
        const overdue = [];
        const byDate = {};

        const today = startOfToday();

        days.forEach(day => {
            byDate[format(day, 'yyyy-MM-dd')] = [];
        });

        tasks.forEach(task => {
            if (!task.dueDate) return;
            const due = parseISO(task.dueDate);

            if (!task.isCompleted && isBefore(due, today)) {
                overdue.push(task);
            } else {
                const dayKey = format(due, 'yyyy-MM-dd');
                if (byDate[dayKey]) {
                    byDate[dayKey].push(task);
                }
            }
        });

        return { overdueTasks: overdue, tasksByDate: byDate };
    }, [tasks, days]);

    const handlePrevWeek = () => setStartDate(d => subDays(d, 7));
    const handleNextWeek = () => setStartDate(d => addDays(d, 7));
    const handleToday = () => {
        const today = startOfToday();
        setStartDate(today);
        scrollToDate(today);
    };

    const scrollToDate = (date) => {
        const key = format(date, 'yyyy-MM-dd');
        setSelectedDate(date);

        if (dateRefs.current[key]) {
            dateRefs.current[key].scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            // If strictly not in view (e.g. date out of range), maybe update start date?
            // tailored for "Upcoming" which usually shows near future.
            // If date < startDate or date > startDate + 14, jump?
            setStartDate(date);
            // setTimeout to scroll after render?
        }
    };

    const [showRescheduleModal, setShowRescheduleModal] = useState(false);
    const [rescheduleTargetDate, setRescheduleTargetDate] = useState(format(startOfToday(), 'yyyy-MM-dd'));

    const handleRescheduleClick = () => {
        setShowRescheduleModal(true);
    };

    const confirmReschedule = async () => {
        if (!rescheduleTargetDate) return;

        // Batch update
        await Promise.all(overdueTasks.map(task => {
            let anchor = undefined;
            if (task.isRecurring) {
                // Keep existing anchor if present, otherwise set it to the OLD due date (before reschedule)
                // This ensures that if we reschedule from Dec 1 -> Dec 5, the anchor remains Dec 1.
                anchor = task.recurrenceAnchor || task.dueDate;
            }
            return updateTaskDate(task.id, rescheduleTargetDate, task.isRecurring, task.recurrence, anchor);
        }));

        setShowRescheduleModal(false);
    };

    const getDayHeader = (date, idx) => {
        const isFirst = idx === 0;
        if (isToday(date)) return <div className={`${styles.dayHeader} ${isFirst ? styles.firstDay : ''}`}>Today · {format(date, 'MMM d')}</div>;
        if (isTomorrow(date)) return <div className={styles.dayHeader}>Tomorrow · {format(date, 'MMM d')}</div>;
        return <div className={styles.dayHeader}>{format(date, 'EEEE · MMM d')}</div>;
    };

    const [showJumpToDateModal, setShowJumpToDateModal] = useState(false);
    const [jumpTargetDate, setJumpTargetDate] = useState(format(startOfToday(), 'yyyy-MM-dd'));

    const handleMonthClick = () => {
        setJumpTargetDate(format(startDate, 'yyyy-MM-dd'));
        setShowJumpToDateModal(true);
    };

    const confirmJumpToDate = () => {
        if (!jumpTargetDate) return;
        const date = parseISO(jumpTargetDate);
        setStartDate(date);
        scrollToDate(date);
        setShowJumpToDateModal(false);
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className={styles.container}>
            {/* Header / Controls */}
            <div className={styles.header}>
                <div className={styles.monthTitle} onClick={handleMonthClick}>
                    {format(startDate, 'MMMM yyyy')} <FaChevronDown size={12} style={{ opacity: 0.5 }} />
                </div>
                <div className={styles.controls}>
                    <button className={styles.controlButton} onClick={handlePrevWeek} title="Previous Week">
                        <FaChevronLeft />
                    </button>
                    <button className={styles.controlButton} onClick={handleToday}>
                        Today
                    </button>
                    <button className={styles.controlButton} onClick={handleNextWeek} title="Next Week">
                        <FaChevronRight />
                    </button>
                </div>
            </div>

            {/* Calendar Strip (Mobile) */}
            <CalendarStrip
                startDate={startDate}
                weeksToShow={2}
                onDateClick={scrollToDate}
                selectedDate={selectedDate}
            />

            {/* Main Content */}
            <div className={styles.contentArea}>
                {/* Overdue Section */}
                {overdueTasks.length > 0 && (
                    <OverdueSection
                        tasks={overdueTasks}
                        getProjectDetails={getProjectDetails}
                        onTaskClick={onTaskClick}
                        onReschedule={handleRescheduleClick}
                    />
                )}

                {/* Days Grid/List */}
                <div className={styles.grid}>
                    {days.map((day, idx) => {
                        const dateKey = format(day, 'yyyy-MM-dd');
                        const dayTasks = tasksByDate[dateKey] || [];
                        const activeTasks = dayTasks.filter(t => !t.isCompleted);

                        return (
                            <div
                                key={dateKey}
                                className={styles.dayColumn}
                                ref={el => dateRefs.current[dateKey] = el}
                            >
                                {getDayHeader(day, idx)}

                                <div className={styles.taskList}>
                                    {activeTasks.map(task => {
                                        const { name, color } = getProjectDetails(task.projectId);
                                        return (
                                            <TaskItem
                                                key={task.id}
                                                task={task}
                                                projectName={name}
                                                projectColor={color}
                                                onTaskClick={onTaskClick}
                                            />
                                        );
                                    })}
                                </div>

                                <AddTask defaultDate={format(day, 'yyyy-MM-dd')} isCompact={true} />
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Mobile Floating Add Button */}
            {isMobile && (
                <div className={styles.floatingAddBtn} onClick={() => setShowAddTask(true)}>
                    <FaPlus />
                </div>
            )}

            {/* Mobile Add Task Modal */}
            {isMobile && showAddTask && (
                <MobileAddTaskModal
                    onClose={() => setShowAddTask(false)}
                    defaultDate={format(startOfToday(), 'yyyy-MM-dd')}
                />
            )}

            {/* Reschedule Modal */}
            {showRescheduleModal && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    zIndex: 1100,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }} onClick={() => setShowRescheduleModal(false)}>
                    <div style={{
                        backgroundColor: 'var(--bg-color)',
                        padding: '1.5rem',
                        borderRadius: '8px',
                        width: '90%',
                        maxWidth: '350px',
                        boxShadow: 'var(--shadow-lg)'
                    }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Reschedule Overdue</h3>
                        <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                            Move {overdueTasks.length} tasks to:
                        </p>
                        <input
                            type="date"
                            value={rescheduleTargetDate}
                            onChange={(e) => setRescheduleTargetDate(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.5rem',
                                borderRadius: '4px',
                                border: '1px solid var(--border-color)',
                                marginBottom: '1.5rem',
                                fontSize: '1rem'
                            }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                            <button
                                onClick={() => setShowRescheduleModal(false)}
                                style={{
                                    padding: '0.5rem 1rem',
                                    borderRadius: '4px',
                                    border: '1px solid var(--border-color)',
                                    background: 'transparent',
                                    cursor: 'pointer',
                                    color: 'var(--text-primary)'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmReschedule}
                                style={{
                                    padding: '0.5rem 1rem',
                                    borderRadius: '4px',
                                    border: 'none',
                                    background: 'var(--primary-color)',
                                    color: 'white',
                                    cursor: 'pointer'
                                }}
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Jump To Date Modal */}
            {showJumpToDateModal && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    zIndex: 1100,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }} onClick={() => setShowJumpToDateModal(false)}>
                    <div style={{
                        backgroundColor: 'var(--bg-color)',
                        padding: '1.5rem',
                        borderRadius: '8px',
                        width: '90%',
                        maxWidth: '350px',
                        boxShadow: 'var(--shadow-lg)'
                    }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Go to Date</h3>
                        <input
                            type="date"
                            value={jumpTargetDate}
                            onChange={(e) => setJumpTargetDate(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.5rem',
                                borderRadius: '4px',
                                border: '1px solid var(--border-color)',
                                marginBottom: '1.5rem',
                                fontSize: '1rem'
                            }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                            <button
                                onClick={() => setShowJumpToDateModal(false)}
                                style={{
                                    padding: '0.5rem 1rem',
                                    borderRadius: '4px',
                                    border: '1px solid var(--border-color)',
                                    background: 'transparent',
                                    cursor: 'pointer',
                                    color: 'var(--text-primary)'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmJumpToDate}
                                style={{
                                    padding: '0.5rem 1rem',
                                    borderRadius: '4px',
                                    border: 'none',
                                    background: 'var(--primary-color)',
                                    color: 'white',
                                    cursor: 'pointer'
                                }}
                            >
                                Go
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
