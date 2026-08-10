const API_URL = 'http://localhost:3000/api';

// Utility to check auth state
function isAuthenticated() {
    return localStorage.getItem('token') !== null;
}

function getUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

// Update Navigation based on Auth State
function updateNavigation() {
    const authSection = document.getElementById('nav-auth-section');
    if (!authSection) return;

    if (isAuthenticated()) {
        const user = getUser();
        authSection.innerHTML = `
            <a href="dashboard.html" class="btn btn-outline" style="border:none; color: var(--text-main);">Hi, ${user.fullName.split(' ')[0]}</a>
            <button onclick="logout()" class="btn btn-danger">Logout</button>
        `;
    }
}

// API Helper
async function apiCall(endpoint, method = 'GET', body = null) {
    const headers = {
        'Content-Type': 'application/json'
    };
    
    if (isAuthenticated()) {
        headers['Authorization'] = `Bearer ${localStorage.getItem('token')}`;
    }

    const config = {
        method,
        headers
    };

    if (body) {
        config.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`${API_URL}${endpoint}`, config);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'API Error');
        }
        
        return data;
    } catch (error) {
        console.error('API Call Failed:', error);
        throw error;
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    updateNavigation();
});
