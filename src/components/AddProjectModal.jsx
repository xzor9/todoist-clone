import React, { useState } from 'react';
import styles from './AddProjectModal.module.css';
import { addProject } from '../services/todo';
import { useAuth } from '../contexts/AuthContext';

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
    const { currentUser } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsLoading(true);
        try {
            const docRef = await addProject(currentUser.uid, name, color);
            onProjectCreated(docRef.id);
            onClose();
        } catch (error) {
            console.error(error);
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <h3 className={styles.title}>Add project</h3>
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
                        <label className={styles.label}>Color</label>
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
