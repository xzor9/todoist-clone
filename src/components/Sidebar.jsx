import React, { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { FaInbox, FaCalendarDay, FaCalendarAlt, FaPlus, FaSignOutAlt, FaHashtag, FaMoon, FaSun, FaLayerGroup, FaTrash, FaSearch } from 'react-icons/fa';
import styles from './Sidebar.module.css';
import AddProjectModal from './AddProjectModal';
import DroppableProjectItem from './DroppableProjectItem';
import { deleteProject } from '../services/todo';
import { useProjects } from '../contexts/projectHooks';
import { useTasks } from '../contexts/taskHooks';
import { isToday, parseISO } from 'date-fns';

import ConfirmationModal from './ConfirmationModal';




export default function Sidebar({ activeTab, setActiveTab, closeSidebar, openSearchModal }) {
    const { currentUser, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { openAddTaskModal, tasks } = useTasks();
    const { projects } = useProjects();
    const [showProjectModal, setShowProjectModal] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState(null);


    const navItems = [
        { id: 'inbox', label: 'Inbox', icon: <FaInbox color="#246fe0" /> },
        { id: 'today', label: 'Today', icon: <FaCalendarDay color="#058527" /> },
        { id: 'upcoming', label: 'Upcoming', icon: <FaCalendarAlt color="#692fc2" /> },
        { id: 'all', label: 'All Tasks', icon: <FaLayerGroup color="#e34432" /> },
    ];

    // Optimize Task Counts
    const { inboxCount, todayCount, projectCounts } = useMemo(() => {
        let inbox = 0;
        let today = 0;
        const pCounts = {};

        // Initialize project counts
        projects.forEach(p => pCounts[p.id] = 0);

        const now = new Date(); // Current time for comparison

        tasks.forEach(t => {
            if (t.isCompleted) return;

            // Project Counts
            if (t.projectId && pCounts[t.projectId] !== undefined) {
                pCounts[t.projectId]++;
            } else if (!t.projectId) {
                inbox++;
            }

            // Today/Overdue Count
            if (t.dueDate) {
                const date = parseISO(t.dueDate);
                if (isToday(date) || date < now) {
                    today++;
                }
            }
        });

        return { inboxCount: inbox, todayCount: today, projectCounts: pCounts };
    }, [tasks, projects]);

    const handleDeleteConfirm = async () => {
        if (projectToDelete) {
            await deleteProject(projectToDelete.id);
            if (activeTab === projectToDelete.id) {
                setActiveTab('inbox');
            }
            setProjectToDelete(null);
        }
    };

    const handleTabClick = (id) => {
        setActiveTab(id);
        if (window.innerWidth <= 768 && closeSidebar) {
            closeSidebar();
        }
    }

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
                <button className={styles.addTaskBtn} onClick={() => {
                    openAddTaskModal();
                    if (window.innerWidth <= 768 && closeSidebar) closeSidebar();
                }}>
                    <span className={styles.addIcon}><FaPlus /></span>
                    Add Task
                </button>
            </div>

            <nav className={styles.nav}>
                <ul>
                    <li className={styles.navItem} onClick={() => {
                        openSearchModal();
                        if (window.innerWidth <= 768 && closeSidebar) closeSidebar();
                    }}>
                        <span className={styles.icon}><FaSearch color="#666" /></span>
                        <span className={styles.label}>Search</span>
                    </li>
                    {navItems.map(item => {
                        let count = 0;
                        if (item.id === 'inbox') {
                            count = inboxCount;
                        } else if (item.id === 'today') {
                            count = todayCount;
                        }

                        return (
                            <li
                                key={item.id}
                                className={`${styles.navItem} ${activeTab === item.id ? styles.active : ''}`}
                                onClick={() => handleTabClick(item.id)}
                            >
                                <span className={styles.icon}>{item.icon}</span>
                                <span className={styles.label}>{item.label}</span>
                                {count > 0 && (
                                    <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                        ({count})
                                    </span>
                                )}
                            </li>
                        );
                    })}
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
                        {projects.map(project => {
                            const count = projectCounts[project.id] || 0;
                            return (
                                <DroppableProjectItem
                                    key={project.id}
                                    project={project}
                                    activeTab={activeTab}
                                    setActiveTab={handleTabClick}
                                    onDeleteProject={setProjectToDelete}
                                    count={count}
                                />
                            );
                        })}
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

                {('setAppBadge' in navigator) && Notification.permission === 'default' && (
                    <button
                        onClick={() => Notification.requestPermission().then(() => window.location.reload())}
                        className={styles.navItem}
                        style={{
                            width: '100%',
                            justifyContent: 'flex-start',
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-secondary)',
                            marginTop: '4px'
                        }}
                    >
                        <span className={styles.icon}>🔔</span>
                        <span className={styles.label}>Enable Badges</span>
                    </button>
                )}
            </div>

            {showProjectModal && (
                <AddProjectModal
                    onClose={() => setShowProjectModal(false)}
                    onProjectCreated={(newId) => {
                        handleTabClick(newId);
                    }}
                />
            )}

            {projectToDelete && (
                <ConfirmationModal
                    title="Delete Project"
                    message={`Are you sure you want to delete "${projectToDelete.name}"? Tasks in this project will not be deleted but will lose their project association.`}
                    confirmLabel="Delete"
                    isDangerous={true}
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => setProjectToDelete(null)}
                />
            )}
        </aside>
    );
}
