import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { FaInbox, FaCalendarDay, FaCalendarAlt, FaPlus, FaSignOutAlt, FaHashtag, FaMoon, FaSun, FaLayerGroup, FaTrash } from 'react-icons/fa';
import styles from './Sidebar.module.css';
import AddProjectModal from './AddProjectModal';
import { useDroppable } from '@dnd-kit/core';
import EmojiPicker from 'emoji-picker-react';
import { updateProjectIcon, deleteProject } from '../services/todo';
import { useProjects } from '../contexts/projectHooks';
import { useTasks } from '../contexts/taskHooks';
import { isToday, parseISO } from 'date-fns';

import ConfirmationModal from './ConfirmationModal';

// Internal Droppable Component for Project Items
function DroppableProjectItem({ project, activeTab, setActiveTab, onDeleteProject, count }) {
    const { setNodeRef, isOver } = useDroppable({
        id: `project-${project.id}`,
        data: { type: 'project', projectId: project.id }
    });

    const [showPicker, setShowPicker] = useState(false);
    // const [isHovered, setIsHovered] = useState(false); // Removed unused
    const pickerRef = useRef(null);

    // Close picker when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (pickerRef.current && !pickerRef.current.contains(event.target)) {
                setShowPicker(false);
            }
        }
        if (showPicker) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showPicker]);

    const handleIconClick = (e) => {
        e.stopPropagation();
        setShowPicker(!showPicker);
    };

    const handleEmojiClick = async (emojiData) => {
        await updateProjectIcon(project.id, emojiData.emoji);
        setShowPicker(false);
    };

    const handleDeleteClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        onDeleteProject(project);
    };

    return (
        <div
            style={{ opacity: isOver ? 0.7 : 1, transition: 'opacity 0.2s', position: 'relative' }}
            // onMouseEnter={() => setIsHovered(true)}
            // onMouseLeave={() => setIsHovered(false)}
        >
            <div
                ref={setNodeRef}
                className={`${styles.navItem} ${activeTab === project.id ? styles.active : ''} ${isOver ? styles.droppableActive : ''}`}
                onClick={() => setActiveTab(project.id)}
                style={{ paddingRight: '30px', display: 'flex', alignItems: 'center' }}
            >
                <div
                    onClick={handleIconClick}
                    className={styles.iconWrapper}
                    style={{
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: '10px',
                        width: '20px',
                        height: '20px'
                    }}
                >
                    {project.icon ? (
                        <span style={{ fontSize: '1.2rem', lineHeight: '1' }}>{project.icon}</span>
                    ) : (
                        <span className={styles.icon} style={{ color: project.color }}><FaHashtag /></span>
                    )}
                </div>
                <span className={styles.label} style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {project.name}
                </span>
                {count > 0 && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginLeft: '8px' }}>
                        ({count})
                    </span>
                )}
            </div>

            <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={handleDeleteClick}
                className={styles.deleteBtn}
                style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-secondary)', // Subtle by default
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    borderRadius: '4px',
                    zIndex: 20,
                    opacity: 0.6 // Slightly transparent
                }}
                title="Delete Project"
                onMouseEnter={(e) => { e.target.style.color = '#db4035'; e.target.style.opacity = '1'; }}
                onMouseLeave={(e) => { e.target.style.color = 'var(--text-secondary)'; e.target.style.opacity = '0.6'; }}
            >
                <FaTrash size={12} />
            </button>

            {showPicker && (
                <div
                    ref={pickerRef}
                    style={{
                        position: 'absolute',
                        top: '100%',
                        left: '10px',
                        zIndex: 1000,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <EmojiPicker
                        onEmojiClick={handleEmojiClick}
                        width={300}
                        height={400}
                        searchDisabled={false}
                    />
                </div>
            )}
        </div>
    );
}


export default function Sidebar({ activeTab, setActiveTab, closeSidebar }) {
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
                    {navItems.map(item => {
                        let count = 0;
                        if (item.id === 'inbox') {
                            count = tasks.filter(t => !t.isCompleted && !t.projectId).length;
                        } else if (item.id === 'today') {
                            count = tasks.filter(t => {
                                if (t.isCompleted || !t.dueDate) return false;
                                const date = parseISO(t.dueDate);
                                return isToday(date) || date < new Date(); // Today or Overdue
                            }).length;
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
                            const count = tasks.filter(t => !t.isCompleted && t.projectId === project.id).length;
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
