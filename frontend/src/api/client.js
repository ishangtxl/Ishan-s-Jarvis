import axios from 'axios';

const api = axios.create({
    baseURL: '/api'
});

export const tasksApi = {
    getAll: () => api.get('/tasks'),
    create: (task) => api.post('/tasks', task),
    update: (id, task) => api.put(`/tasks/${id}`, task),
    delete: (id) => api.delete(`/tasks/${id}`),

    getEvents: () => api.get('/events'),
    createEvent: (event) => api.post('/events', event),
    deleteEvent: (id) => api.delete(`/events/${id}`),

    // Task Specific Chat & Files
    getChatSession: (taskId) => api.post(`/tasks/${taskId}/chat`),
    getFiles: (taskId) => api.get(`/tasks/${taskId}/files`),
    uploadFile: (taskId, file) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post(`/tasks/${taskId}/upload`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    }
};

export const projectsApi = {
    getAll: () => api.get('/projects'),
    getOne: (id) => api.get(`/projects/${id}`),
    create: (project) => api.post('/projects', project),
    getFiles: (id) => api.get(`/projects/${id}/files`),
    uploadFile: (id, file) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post(`/projects/${id}/upload`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    }
};

export const chatApi = {
    getSessions: () => api.get('/chat/sessions'),
    createSession: (title) => api.post('/chat/sessions', { title }),
    getSession: (id) => api.get(`/chat/sessions/${id}`),
    updateSession: (id, title) => api.put(`/chat/sessions/${id}`, { title }),
    deleteSession: (id) => api.delete(`/chat/sessions/${id}`),
    transcribe: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post('/chat/transcribe', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    }
};

export const memoryApi = {
    getAll: () => api.get('/memory'),
    create: (content, category) => api.post('/memory', { content, category }),
    delete: (id) => api.delete(`/memory/${id}`)
};

export default api;
