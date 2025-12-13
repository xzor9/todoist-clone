import React, { useState } from 'react';
import TaskList from './TaskList';
import UpcomingView from './UpcomingView';
import TaskDetailModal from './TaskDetailModal';

export default function Dashboard({ activeTab }) {
    const [selectedTaskId, setSelectedTaskId] = useState(null);

    const handleTaskClick = (taskId) => {
        setSelectedTaskId(taskId);
    };

    const handleCloseModal = () => {
        setSelectedTaskId(null);
    };

    return (
        <>
            {activeTab === 'upcoming' ? (
                <div style={{ height: 'calc(100vh - 60px)' }}> {/* Adjust height for layout */}
                    <UpcomingView onTaskClick={handleTaskClick} />
                </div>
            ) : (
                <div style={{ paddingBottom: '2rem' }}>
                    <TaskList activeTab={activeTab} onTaskClick={handleTaskClick} />
                </div>
            )}

            {selectedTaskId && (
                <TaskDetailModal taskId={selectedTaskId} onClose={handleCloseModal} />
            )}
        </>
    );
}
