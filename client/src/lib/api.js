import axios from 'axios';

export const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

const api = axios.create({
  baseURL: BASE_URL,
});

// --- helper: redirigir a login (reemplaza la URL actual para no dejar rastro en el back stack) ---
function redirectToLogin() {
  if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
    window.location.replace('/login');
  }
}

// --- Auto-attach access token ---
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// --- Refresh flow (cola para 401 simultáneos) ---
let isRefreshing = false;
let pending = [];

function processQueue(error, token) {
  pending.forEach(p => (error ? p.reject(error) : p.resolve(token)));
  pending = [];
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { config, response } = error;
    if (!response) return Promise.reject(error);

    // Si es 401 y todavía no reintentamos, intentamos refresh
    if (response.status === 401 && !config._retry) {
      config._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const r = await axios.post(`${BASE_URL}/auth/refresh`, {}, { withCredentials: true });
          const newToken = r.data?.accessToken;
          if (newToken) {
            localStorage.setItem('accessToken', newToken);
            processQueue(null, newToken);
            // reintentamos la request original con el nuevo token
            return api(config);
          }
          // si no vino token, tratamos como fallo
          throw new Error('Refresh sin token');
        } catch (err) {
          processQueue(err, null);
          localStorage.removeItem('accessToken');
          redirectToLogin(); // 👈 refresh falló: nos vamos al login
          return Promise.reject(err);
        } finally {
          isRefreshing = false;
        }
      }

      // Si ya hay un refresh en curso, encolamos la request
      return new Promise((resolve, reject) => {
        pending.push({
          resolve: (token) => {
            config.headers.Authorization = `Bearer ${token}`;
            resolve(api(config));
          },
          reject: (err) => {
            localStorage.removeItem('accessToken');
            redirectToLogin(); // 👈 si la cola termina en error, también vamos a login
            reject(err);
          },
        });
      });
    }

    // Otros errores
    return Promise.reject(error);
  }
);

export default api;

// abordar despues redireccion a login porque no funciono 