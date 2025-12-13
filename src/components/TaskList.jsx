import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToProjects } from '../services/todo';
import TaskItem from './TaskItem';
import AddTask from './AddTask';
import { isToday, parseISO, startOfToday } from 'date-fns';
import { useTasks } from '../contexts/TasksContext';
import {
    SortableContext,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { FaChevronRight, FaChevronDown } from 'react-icons/fa';


export default function TaskList({ activeTab }) {
    const { currentUser } = useAuth();
    const { tasks, loading } = useTasks();
    const [projects, setProjects] = useState([]);

    useEffect(() => {
        const unsubscribeProjects = subscribeToProjects(currentUser.uid, (fetchedProjects) => {
            setProjects(fetchedProjects);
        });

        return () => {
            unsubscribeProjects();
        };
    }, [currentUser]);

    const filteredTasks = React.useMemo(() => {
        return tasks.filter(task => {
            // Standard filters
            if (activeTab === 'inbox') return !task.projectId && !task.dueDate;

            // Note: Logic adjustment. Inbox should probably contain all tasks NOT in a project? or tasks in Inbox project?
            // Todoist 'Inbox' is a project itself effectively.
            // For our simplified model: 'inbox' tab shows tasks with NO project OR projectId "Inbox" (if we had one).
            // Let's stick to: Inbox = No Project set.

            if (activeTab === 'inbox') {
                // If we treat "Inbox" as default "no project"
                return !task.projectId;
            }

            if (activeTab === 'today') {
                if (!task.dueDate) return false;
                return isToday(parseISO(task.dueDate));
            }

            if (activeTab === 'upcoming') {
                if (!task.dueDate) return false;
                return parseISO(task.dueDate) >= startOfToday();
            }

            // Project Filters
            return task.projectId === activeTab;
        });
    }, [tasks, activeTab]);

    const getPageTitle = () => {
        switch (activeTab) {
            case 'inbox': return 'Inbox';
            case 'today': return 'Today';
            case 'upcoming': return 'Upcoming';
            default: {
                const project = projects.find(p => p.id === activeTab);
                return project ? project.name : 'Unknown Project';
            }
        }
    };



    const getDefaultDateForAdd = () => {
        if (activeTab === 'today') return new Date().toISOString().split('T')[0];
        return null;
    };

    if (loading) {
        return <div style={{ padding: '2rem', color: 'var(--text-secondary)' }}>Loading tasks...</div>;
    }

    const [showCompleted, setShowCompleted] = useState(false);

    // Separating active and completed tasks
    const activeTasks = React.useMemo(() => filteredTasks.filter(t => !t.isCompleted), [filteredTasks]);
    const completedTasks = React.useMemo(() => filteredTasks.filter(t => t.isCompleted), [filteredTasks]);

    return (
        <div>
            <h2 style={{ marginBottom: '1rem', fontSize: '1.2rem', fontWeight: 700 }}>{getPageTitle()}</h2>

            {activeTasks.length === 0 && completedTasks.length === 0 ? (
                <div style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <p>No tasks found in {getPageTitle()}.</p>
                    <p>All clear!</p>
                    <img src="https://todoist.b-cdn.net/assets/images/4424eb281bb8764024f2.svg" alt="Empty" style={{ maxWidth: '200px', marginTop: '1rem', opacity: 0.8 }} />
                </div>
            ) : (
                <SortableContext
                    items={activeTasks}
                    strategy={verticalListSortingStrategy}
                >
                    <div style={{ marginBottom: '2rem' }}>
                        {activeTasks.map(task => (
                            <TaskItem key={task.id} task={task} />
                        ))}
                    </div>
                </SortableContext>
            )}

            {completedTasks.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                    <button
                        onClick={() => setShowCompleted(!showCompleted)}
                        style={{
                            background: 'transparent',
                            color: 'var(--text-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '0.9rem',
                            padding: '0.5rem 0'
                        }}
                    >
                        {showCompleted ? <FaChevronDown size={12} /> : <FaChevronRight size={12} />}
                        Completed {completedTasks.length}
                    </button>

                    {showCompleted && (
                        <div style={{ opacity: 0.7 }}>
                            {completedTasks.map(task => (
                                <TaskItem key={task.id} task={task} />
                            ))}
                        </div>
                    )}
                </div>
            )}

            <AddTask defaultDate={getDefaultDateForAdd()} />
        </div>
    );
}
