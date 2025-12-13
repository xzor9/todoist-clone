import React from 'react';
import TaskList from './TaskList';

export default function Dashboard({ activeTab }) {
    return (
        <div style={{ paddingBottom: '2rem' }}>
            <TaskList activeTab={activeTab} />
        </div>
    );
}
