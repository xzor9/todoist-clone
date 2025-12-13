import React, { useState, useMemo } from 'react';
import {
    format,
    addDays,
    subDays,
    startOfWeek,
    isSameDay,
    parseISO,
    startOfToday,
    isToday,
    isTomorrow
} from 'date-fns';
import { FaChevronLeft, FaChevronRight, FaPlus, FaRegCircle, FaCheckCircle } from 'react-icons/fa';
import { useTasks } from '../contexts/TasksContext';
import { toggleTaskCompletion } from '../services/todo';
import styles from './UpcomingView.module.css';

// Helper component to resolve project name
const ProjectTag = ({ projectId }) => {
    // In a real app we'd have this in context. For now, small component that fetches or subscribes?
    // Subscribing per card is bad. 
    // Let's rely on a simple assumption: We should have projects loaded. 
    // Let's refactor proper to useProjects context if we can.
    // For now, let's look at how TaskList did it.
    // TaskList subscribed to projects. Let's do that at the top level of UpcomingView.
    return (
        <span className={styles.projectLabel}>
            {/* Placeholder will be replaced by parent passing project or context */}
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#808080' }}></span>
            #{projectId.substring(0, 4)}... {/* Truncate for now if we can't find name easily without refactor */}
        </span>
    );
};

// ... unused for a moment.

// Better approach: Lift project subscription to UpcomingView
import { subscribeToProjects } from '../services/todo';
import { useAuth } from '../contexts/AuthContext';

const WeekTaskCard = ({ task, projectName, projectColor }) => {
    const handleToggle = (e) => {
        e.stopPropagation();
        toggleTaskCompletion(task.id, task.isCompleted);
    };

    return (
        <div className={styles.taskCard}>
            <div className={styles.taskContent}>
                <div
                    className={styles.checkbox}
                    onClick={handleToggle}
                    style={{
                        borderColor: task.isCompleted ? 'var(--primary-color)' : 'var(--text-secondary)',
                        backgroundColor: task.isCompleted ? 'var(--primary-color)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    {task.isCompleted && <FaCheckCircle color="white" size={12} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}> {/* specific minWidth helps text truncation if needed */}
                    <div className={styles.taskText} style={{ textDecoration: task.isCompleted ? 'line-through' : 'none', color: task.isCompleted ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
                        {task.content}
                    </div>
                    <div className={styles.taskMeta}>
                        {task.projectId && (
                            <span className={styles.projectLabel} title={projectName}>
                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: projectColor || '#808080' }}></span>
                                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100px' }}>
                                    #{projectName || 'Unknown'}
                                </span>
                            </span>
                        )}
                        {task.recurrence &&
                            <span className={styles.recurrenceTag}>
                                🔄
                            </span>
                        }
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function UpcomingView() {
    const { tasks, loading } = useTasks();
    const { currentUser } = useAuth();
    const [startDate, setStartDate] = useState(startOfToday());
    const [projects, setProjects] = useState([]);

    React.useEffect(() => {
        if (currentUser) {
            const unsubscribe = subscribeToProjects(currentUser.uid, setProjects);
            return unsubscribe;
        }
    }, [currentUser]);

    const getProjectDetails = (projectId) => {
        const project = projects.find(p => p.id === projectId);
        return project ? { name: project.name, color: project.color } : { name: 'Inbox', color: '#808080' };
    };

    // Generate 7 days starting from startDate
    const days = useMemo(() => {
        return Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));
    }, [startDate]);

    const tasksByDate = useMemo(() => {
        const map = {};
        days.forEach(day => {
            const dayKey = format(day, 'yyyy-MM-dd');
            map[dayKey] = tasks.filter(task => {
                if (!task.dueDate) return false;
                return isSameDay(parseISO(task.dueDate), day);
            });
        });
        return map;
    }, [tasks, days]);

    const handlePrevWeek = () => setStartDate(d => subDays(d, 7));
    const handleNextWeek = () => setStartDate(d => addDays(d, 7));
    const handleToday = () => setStartDate(startOfToday());

    const getDayHeader = (date) => {
        if (isToday(date)) return `Today · ${format(date, 'MMM d')}`;
        if (isTomorrow(date)) return `Tomorrow · ${format(date, 'MMM d')}`;
        return format(date, 'EEEE · MMM d');
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.monthTitle}>
                    {format(days[0], 'MMMM yyyy')}
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

            <div className={styles.grid}>
                {days.map(day => {
                    const dateKey = format(day, 'yyyy-MM-dd');
                    const dayTasks = tasksByDate[dateKey] || [];

                    return (
                        <div key={dateKey} className={styles.dayColumn}>
                            <div className={styles.dayHeader}>
                                {getDayHeader(day)}
                                <span className={styles.taskCount}>{dayTasks.length}</span>
                            </div>

                            {dayTasks.map(task => {
                                const { name, color } = getProjectDetails(task.projectId);
                                return (
                                    <WeekTaskCard
                                        key={task.id}
                                        task={task}
                                        projectName={name}
                                        projectColor={color}
                                    />
                                );
                            })}

                            <button className={styles.addTaskBtn}>
                                <FaPlus /> Add task
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
