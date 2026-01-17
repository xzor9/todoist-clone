import React, { useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { subscribeToProjects } from '../services/todo';
import { ProjectsContext } from './projectHooks';

export default function ProjectsProvider({ children }) {
    const { currentUser } = useAuth();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUser) {
            setProjects([]);
            setLoading(false);
            return;
        }

        const unsubscribe = subscribeToProjects(currentUser.uid, (fetchedProjects) => {
            setProjects(fetchedProjects);
            setLoading(false);
        });

        return unsubscribe;
    }, [currentUser]);

    const getProjectName = (projectId) => {
        if (!projectId) return 'Inbox'; // Or null, but Inbox is usually default
        const p = projects.find(pr => pr.id === projectId);
        return p ? p.name : 'Inbox'; // Default to Inbox if not found
    };

    const getProjectColor = (projectId) => {
        const p = projects.find(pr => pr.id === projectId);
        return p ? p.color : '#808080'; // Default gray
    };

    const value = {
        projects,
        loading,
        getProjectName,
        getProjectColor
    };

    return (
        <ProjectsContext.Provider value={value}>
            {children}
        </ProjectsContext.Provider>
    );
}
