import type { User } from '../types';

export const mockEmployees: User[] = [
  { id: 'emp-1', name: 'Admin User', email: 'admin@cognitive.com', role: 'Administrator', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop' },
];

export const generateMockData = () => {
  return {
    clients: [],
    projects: [],
    tasks: [],
    timesheets: []
  };
};
