import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { FaInbox, FaCalendarDay, FaCalendarAlt, FaPlus, FaSignOutAlt, FaHashtag, FaMoon, FaSun } from 'react-icons/fa';
import styles from './Sidebar.module.css';
import { subscribeToProjects } from '../services/todo';
import AddProjectModal from './AddProjectModal';
import { useDroppable } from '@dnd-kit/core';

// Internal Droppable Component for Project Items
function DroppableProjectItem({ project, activeTab, setActiveTab }) {
    const { setNodeRef, isOver } = useDroppable({
        id: `project-${project.id}`,
        data: { type: 'project', projectId: project.id }
    });

    return (
        <div ref={setNodeRef} style={{ opacity: isOver ? 0.7 : 1, transition: 'opacity 0.2s' }}>
            <li
                className={`${styles.navItem} ${activeTab === project.id ? styles.active : ''} ${isOver ? styles.droppableActive : ''}`}
                onClick={() => setActiveTab(project.id)}
            >
                <span className={styles.icon} style={{ color: project.color }}><FaHashtag /></span>
                <span className={styles.label}>{project.name}</span>
            </li>
        </div>
    );
}

import { useTasks } from '../contexts/TasksContext';

// ... (DroppableProjectItem omitted for brevity if unchanged, focused on Sidebar)

export default function Sidebar({ activeTab, setActiveTab }) {
    const { currentUser, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { openAddTaskModal } = useTasks();
    const [projects, setProjects] = useState([]);
    const [showProjectModal, setShowProjectModal] = useState(false);

    useEffect(() => {
        if (!currentUser) return;
        const unsubscribe = subscribeToProjects(currentUser.uid, (fetchedProjects) => {
            setProjects(fetchedProjects);
        });
        return unsubscribe;
    }, [currentUser]);

    const navItems = [
        { id: 'inbox', label: 'Inbox', icon: <FaInbox color="#246fe0" /> },
        { id: 'today', label: 'Today', icon: <FaCalendarDay color="#058527" /> },
        { id: 'upcoming', label: 'Upcoming', icon: <FaCalendarAlt color="#692fc2" /> },
    ];

    return (
        <aside className={styles.sidebar}>
            <div className={styles.header}>
                <div className={styles.user}>
                    {currentUser?.photoURL ? (
                        <img src={currentUser.photoURL} alt="User" className={styles.avatar} />
                    ) : (
                        <div className={styles.avatarPlaceholder}>{currentUser?.email?.[0]?.toUpperCase()}</div>
                    )}
                    <span className={styles.username}>{currentUser?.displayName || currentUser?.email}</span>
                </div>
                <button className={styles.logoutBtn} onClick={logout} title="Sign Out">
                    <FaSignOutAlt />
                </button>
            </div>

            <div className={styles.actions}>
                <button className={styles.addTaskBtn} onClick={openAddTaskModal}>
                    <span className={styles.addIcon}><FaPlus /></span>
                    Add Task
                </button>
            </div>

            <nav className={styles.nav}>
                <ul>
                    {navItems.map(item => (
                        <li
                            key={item.id}
                            className={`${styles.navItem} ${activeTab === item.id ? styles.active : ''}`}
                            onClick={() => setActiveTab(item.id)}
                        >
                            <span className={styles.icon}>{item.icon}</span>
                            <span className={styles.label}>{item.label}</span>
                        </li>
                    ))}
                </ul>

                <div className={styles.projectsSection}>
                    <div className={styles.projectsHeader}>
                        <span className={styles.projectsTitle}>My Projects</span>
                        <div className={styles.projectsActions}>
                            <button
                                className={styles.addProjectBtn}
                                onClick={(e) => { e.stopPropagation(); setShowProjectModal(true); }}
                                title="Add Project"
                            >
                                <FaPlus />
                            </button>
                        </div>
                    </div>
                    <ul>
                        {projects.map(project => (
                            <DroppableProjectItem
                                key={project.id}
                                project={project}
                                activeTab={activeTab}
                                setActiveTab={setActiveTab}
                            />
                        ))}
                    </ul>
                </div>
            </nav>

            <div style={{ padding: '0 12px 12px 12px', marginTop: 'auto' }}>
                <button
                    onClick={toggleTheme}
                    className={styles.navItem}
                    style={{
                        width: '100%',
                        justifyContent: 'flex-start',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-secondary)'
                    }}
                >
                    <span className={styles.icon}>{theme === 'dark' ? <FaSun /> : <FaMoon />}</span>
                    <span className={styles.label}>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                </button>
            </div>

            {showProjectModal && (
                <AddProjectModal
                    onClose={() => setShowProjectModal(false)}
                    onProjectCreated={(newId) => {
                        setActiveTab(newId);
                    }}
                />
            )}
        </aside>
    );
}
