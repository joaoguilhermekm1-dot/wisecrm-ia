import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
const API_URL = `${BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: { 
    'Content-Type': 'application/json',
    'Bypass-Tunnel-Reminder': 'true',
    'ngrok-skip-browser-warning': 'true'
  },
});

// Interceptor: injeta JWT em toda requisição
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('wise_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor: se 401, remove token e redireciona para login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Não deslogar se for uma tentativa de login intencional
    const isLoginEndpoint = error.config?.url?.includes('/auth/login');
    
    if (error.response?.status === 401 && !isLoginEndpoint) {
      localStorage.removeItem('wise_token');
      localStorage.removeItem('wise_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// --- Auth ---
export const authApi = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (name, email, password) => api.post('/auth/register', { name, email, password }),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/password', data),
};

// --- Leads ---
export const leadsApi = {
  getConversations: () => api.get('/leads/conversations'),
  getAll: () => api.get('/leads'),
  create: (data) => api.post('/leads', data),
  batchCreate: (leads) => api.post('/leads/batch', { leads }),
  update: (id, data) => api.patch(`/leads/${id}`, data),
  delete: (id) => api.delete(`/leads/${id}`),
};

export const pipelinesApi = {
  get: () => api.get('/pipelines'),
  updateStages: (stages) => api.patch('/pipelines/stages', { stages }),
  reset: () => api.post('/pipelines/reset'),
};

export const whatsappApi = {
  getStatus: () => api.get('/whatsapp/status'),
  start: () => api.post('/whatsapp/start'),
  reset: () => api.post('/whatsapp/reset'),
};

// --- Messages ---
export const messagesApi = {
  getByLead: (leadId) => api.get(`/leads/${leadId}/messages`),
  send: (leadId, content, extraPayload = {}) => api.post(`/leads/${leadId}/messages`, { content, ...extraPayload }),
  getAISuggestion: (leadId) => api.get(`/leads/${leadId}/ai-suggestion`),
  getSmartTemplates: (leadId) => api.get(`/leads/${leadId}/smart-templates`),
};

// --- Marketing ---
export const marketingApi = {
  getAdAccounts: () => api.get('/marketing/meta/accounts'),
  getAdInsights: (adAccountId, startDate, endDate) => api.get('/marketing/ads/insights', { params: { adAccountId, startDate, endDate } }),
  sendAdChat: (data) => api.post('/marketing/ads/chat', data),
  syncAdInsights: (adAccountId) => api.post('/marketing/ads/sync', { adAccountId }),
  getSEOInsights: () => api.get('/marketing/seo/insights'),
  getMetaConnectUrl: () => api.get('/marketing/connect/meta'),
  getGoogleConnectUrl: () => api.get('/marketing/connect/google'),
  getIntegrations: () => api.get('/marketing/integrations'),
};

// --- Processes ---
export const processesApi = {
  getAll: () => api.get('/processes'),
  generate: (noteTitle) => api.post('/processes/generate', { noteTitle }),
  save: (data) => api.post('/processes/save', data),
  execute: (processId, nodeId, leadId) => api.post('/processes/execute', { processId, nodeId, leadId }),
};

// --- Prospecting ---
export const prospectingApi = {
  startMission: (data) => api.post('/prospecting/start', data),
  getStatus: (runId) => api.get(`/prospecting/status/${runId}`),
};

// --- Analytics ---
export const analyticsApi = {
  getGlobalMetrics: () => api.get('/analytics/metrics'),
};

// --- Upload ---
export const uploadApi = {
  uploadFile: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};

export default api;
