import { createContext, useContext } from 'react';

export const ProjectsContext = createContext();

export function useProjects() {
    return useContext(ProjectsContext);
}
