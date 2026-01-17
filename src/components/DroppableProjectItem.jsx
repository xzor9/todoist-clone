import React, { useEffect, useState, useRef } from 'react';
import { useDroppable } from '@dnd-kit/core';
import EmojiPicker from 'emoji-picker-react';
import { FaHashtag, FaTrash } from 'react-icons/fa';
import { updateProjectIcon } from '../services/todo';
import styles from './Sidebar.module.css';

export default function DroppableProjectItem({ project, activeTab, setActiveTab, onDeleteProject, count }) {
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

    const handleDeleteClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        onDeleteProject(project);
    };

    return (
        <div
            style={{ opacity: isOver ? 0.7 : 1, transition: 'opacity 0.2s', position: 'relative' }}
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
