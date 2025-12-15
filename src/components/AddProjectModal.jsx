import React, { useState } from 'react';
import styles from './AddProjectModal.module.css';
import { addProject } from '../services/todo';
import { useAuth } from '../contexts/AuthContext';
import EmojiPicker from 'emoji-picker-react';
import { FaHashtag } from 'react-icons/fa';

const COLORS = [
    { name: 'Berry Red', value: '#b8256f' },
    { name: 'Red', value: '#db4035' },
    { name: 'Orange', value: '#ff9933' },
    { name: 'Yellow', value: '#fad000' },
    { name: 'Olive Green', value: '#afb83b' },
    { name: 'Lime Green', value: '#7ecc49' },
    { name: 'Green', value: '#299438' },
    { name: 'Mint Green', value: '#6accbc' },
    { name: 'Teal', value: '#158fad' },
    { name: 'Sky Blue', value: '#14aaf5' },
    { name: 'Light Blue', value: '#96c3eb' },
    { name: 'Blue', value: '#4073ff' },
    { name: 'Grape', value: '#884dff' },
    { name: 'Violet', value: '#af38eb' },
    { name: 'Lavender', value: '#eb96eb' },
    { name: 'Magenta', value: '#e05194' },
    { name: 'Salmon', value: '#ff8d85' },
    { name: 'Charcoal', value: '#808080' },
    { name: 'Grey', value: '#b8b8b8' },
    { name: 'Taupe', value: '#ccac93' },
];

export default function AddProjectModal({ onClose, onProjectCreated }) {
    const [name, setName] = useState('');
    const [color, setColor] = useState(COLORS[11].value); // Default Blue
    const [icon, setIcon] = useState(null); // Emoji character
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [error, setError] = useState('');

    const { currentUser } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    const MAX_NAME_LENGTH = 100;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        setError('');

        if (name.length > MAX_NAME_LENGTH) {
            setError(`Project name is too long. Max ${MAX_NAME_LENGTH} characters.`);
            return;
        }

        setIsLoading(true);
        try {
            const docRef = await addProject(currentUser.uid, name, color, icon);
            onProjectCreated(docRef.id);
            onClose();
        } catch (error) {
            console.error(error);
            setError('Failed to add project.');
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <h3 className={styles.title}>Add project</h3>
                {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className={styles.field}>
                        <label className={styles.label}>Name</label>
                        <input
                            autoFocus
                            className={styles.input}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Project name"
                        />
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label}>Icon & Color</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                            <button
                                type="button"
                                style={{
                                    border: '1px solid #ddd',
                                    borderRadius: '5px',
                                    width: '40px',
                                    height: '40px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: 'transparent',
                                    cursor: 'pointer',
                                    fontSize: '1.2rem',
                                    color: color // Use selected color for Hashtag
                                }}
                                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            >
                                {icon ? icon : <FaHashtag />}
                            </button>
                            <span style={{ fontSize: '0.9rem', color: '#666' }}>
                                {icon ? 'Emoji selected' : 'Default icon'}
                            </span>
                            {icon && (
                                <button
                                    type="button"
                                    onClick={() => setIcon(null)}
                                    style={{
                                        border: 'none',
                                        background: 'transparent',
                                        color: '#db4035',
                                        cursor: 'pointer',
                                        fontSize: '0.8rem',
                                        textDecoration: 'underline'
                                    }}
                                >
                                    Remove Emoji
                                </button>
                            )}
                        </div>

                        {showEmojiPicker && (
                            <div style={{ marginBottom: '10px' }}>
                                <EmojiPicker
                                    onEmojiClick={(emojiData) => {
                                        setIcon(emojiData.emoji);
                                        setShowEmojiPicker(false);
                                    }}
                                    width="100%"
                                    height={300}
                                />
                            </div>
                        )}

                        <div className={styles.colors}>
                            {COLORS.map(c => (
                                <button
                                    key={c.value}
                                    type="button"
                                    className={`${styles.colorBtn} ${color === c.value ? styles.selected : ''}`}
                                    style={{ backgroundColor: c.value }}
                                    onClick={() => setColor(c.value)}
                                    title={c.name}
                                />
                            ))}
                        </div>
                    </div>

                    <div className={styles.actions}>
                        <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={isLoading}>
                            Cancel
                        </button>
                        <button type="submit" className={styles.submitBtn} disabled={!name.trim() || isLoading}>
                            {isLoading ? 'Adding...' : 'Add'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
