const BASE_URL = 'https://taskflowx-ewxr.onrender.com';

// Token and user data helpers.
// Stored in localStorage for simplicity — in production, httpOnly cookies are safer.
const Auth = {
    getToken:   ()       => localStorage.getItem('tf_token'),
    setToken:   (token)  => localStorage.setItem('tf_token', token),
    getUser:    ()       => {
        try {
            return JSON.parse(localStorage.getItem('tf_user'));
        } catch {
            return null;
        }
    },
    setUser:    (user)   => localStorage.setItem('tf_user', JSON.stringify(user)),
    isLoggedIn: ()       => !!localStorage.getItem('tf_token'),
    logout:     ()       => {
        localStorage.removeItem('tf_token');
        localStorage.removeItem('tf_user');
    }
};

// Base wrapper around fetch. Attaches auth header when a token exists,
// handles non-2xx responses by throwing an error with the server's message,
// and redirects to login on 401.
async function apiFetch(endpoint, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    const token = Auth.getToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    let response;
    try {
        response = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
    } catch {
        throw new Error('Cannot connect to server. Please check your connection.');
    }

    const data = await response.json().catch(() => ({}));

    if (response.status === 401) {
        Auth.logout();
        window.location.href = 'index.html';
        return;
    }

    if (!response.ok) {
        throw new Error(data.message || `Request failed (${response.status})`);
    }

    return data;
}

const AuthAPI = {
    register: (payload) => apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload)
    }),
    login: (payload) => apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload)
    }),
    getMe: () => apiFetch('/auth/me')
};

const TasksAPI = {
    getAll: (params = {}) => {
        const query = new URLSearchParams();
        if (params.page)     query.set('page',     params.page);
        if (params.limit)    query.set('limit',    params.limit);
        if (params.status)   query.set('status',   params.status);
        if (params.priority) query.set('priority', params.priority);
        const qs = query.toString();
        return apiFetch(`/tasks${qs ? '?' + qs : ''}`);
    },
    create: (payload) => apiFetch('/tasks', {
        method: 'POST',
        body: JSON.stringify(payload)
    }),
    update: (id, payload) => apiFetch(`/tasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
    }),
    delete: (id) => apiFetch(`/tasks/${id}`, {
        method: 'DELETE'
    })
};
