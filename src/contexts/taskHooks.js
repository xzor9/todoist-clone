import { createContext, useContext } from 'react';

export const TasksContext = createContext();

export function useTasks() {
    return useContext(TasksContext);
}
