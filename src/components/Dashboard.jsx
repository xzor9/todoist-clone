import React from 'react';
import TaskList from './TaskList';
import UpcomingView from './UpcomingView';

export default function Dashboard({ activeTab }) {
    if (activeTab === 'upcoming') {
        return (
            <div style={{ height: 'calc(100vh - 60px)' }}> {/* Adjust height for layout */}
                <UpcomingView />
            </div>
        );
    }

    return (
        <div style={{ paddingBottom: '2rem' }}>
            <TaskList activeTab={activeTab} />
        </div>
    );
}
