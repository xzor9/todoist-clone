import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { FaInbox, FaCalendarDay, FaCalendarAlt, FaPlus, FaSignOutAlt, FaHashtag, FaMoon, FaSun, FaLayerGroup } from 'react-icons/fa';
import styles from './Sidebar.module.css';
import AddProjectModal from './AddProjectModal';
import { useDroppable } from '@dnd-kit/core';
import EmojiPicker from 'emoji-picker-react';
import { updateProjectIcon } from '../services/todo';

// Internal Droppable Component for Project Items
function DroppableProjectItem({ project, activeTab, setActiveTab }) {
    const { setNodeRef, isOver } = useDroppable({
        id: `project-${project.id}`,
        data: { type: 'project', projectId: project.id }
    });

    const [showPicker, setShowPicker] = useState(false);
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

    return (
        <div ref={setNodeRef} style={{ opacity: isOver ? 0.7 : 1, transition: 'opacity 0.2s', position: 'relative' }}>
            <li
                className={`${styles.navItem} ${activeTab === project.id ? styles.active : ''} ${isOver ? styles.droppableActive : ''}`}
                onClick={() => setActiveTab(project.id)}
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
                <span className={styles.label}>{project.name}</span>
            </li>

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

import { useProjects } from '../contexts/projectHooks';
import { useTasks } from '../contexts/taskHooks';

// ... (DroppableProjectItem omitted for brevity if unchanged, focused on Sidebar)

export default function Sidebar({ activeTab, setActiveTab }) {
    const { currentUser, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { openAddTaskModal } = useTasks();
    const { projects } = useProjects();
    const [showProjectModal, setShowProjectModal] = useState(false);


    const navItems = [
        { id: 'inbox', label: 'Inbox', icon: <FaInbox color="#246fe0" /> },
        { id: 'today', label: 'Today', icon: <FaCalendarDay color="#058527" /> },
        { id: 'upcoming', label: 'Upcoming', icon: <FaCalendarAlt color="#692fc2" /> },
        { id: 'all', label: 'All Tasks', icon: <FaLayerGroup color="#e34432" /> }, // Added All Tasks
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
