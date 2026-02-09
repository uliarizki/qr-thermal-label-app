import React, { createContext, useState, useContext, useEffect } from 'react';
import { login as loginService, logout as logoutService } from '../services/authService';
import { validateLogin } from '../schemas/validationSchemas';
import { ApiError } from '../services/api';
import { logActivity } from '../utils/googleSheets';
import { toast } from 'react-hot-toast';

const AuthContext = createContext(null);

// Session expiry: 7 days in milliseconds
const SESSION_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check local storage for session (Legacy / Initial check)
        const storedUser = localStorage.getItem('qr:auth_user');
        const loginTime = localStorage.getItem('qr:auth_time');

        if (storedUser) {
            try {
                // Check if session expired
                const loginTimestamp = loginTime ? parseInt(loginTime, 10) : 0;
                const now = Date.now();

                if (now - loginTimestamp > SESSION_EXPIRY_MS) {
                    // Session expired - auto logout
                    localStorage.removeItem('qr:auth_user');
                    localStorage.removeItem('qr:auth_time');
                    // Don't toast here on init to avoid spam
                } else {
                    setUser(JSON.parse(storedUser));
                }
            } catch (e) {
                console.error("Invalid auth token");
                localStorage.removeItem('qr:auth_user');
            }
        }

        setLoading(false);
    }, []);

    const login = async (username, password) => {
        const toastId = toast.loading('Verifying credentials...');

        try {
            // Validate credentials
            const validatedCreds = validateLogin({ username, password });

            // Call auth service (with automatic retry)
            const userData = await loginService(validatedCreds.username, validatedCreds.password);

            setUser(userData);

            // Store user and login timestamp
            localStorage.setItem('qr:auth_user', JSON.stringify(userData));
            localStorage.setItem('qr:auth_time', Date.now().toString());

            toast.success(`Welcome back, ${userData.username}!`, { id: toastId });
            logActivity(userData.username, 'LOGIN', { timestamp: new Date() });

            // Check for App Update (Auto-Reload if version mismatch)
            checkAppVersion();

            return true;

        } catch (error) {
            // Handle validation errors
            if (error.name === 'ZodError') {
                const firstError = error.errors[0];
                toast.error(`Validasi gagal: ${firstError.message}`, { id: toastId });
            }
            // Handle API errors
            else if (error instanceof ApiError) {
                toast.error(error.message || 'Login failed', { id: toastId });
            }
            // Handle unexpected errors
            else {
                toast.error('Network error during login', { id: toastId });
                console.error('Login error:', error);
            }
            return false;
        }
    };

    const logout = () => {
        if (user) {
            logActivity(user.username, 'LOGOUT', { timestamp: new Date() });
        }

        // Secure Logout: Clear All Local Data
        const keysToRemove = ['qr:auth_user', 'qr:auth_time', 'qr:customers_cache', 'qr:lastTab', 'qr:history_log'];
        keysToRemove.forEach(key => localStorage.removeItem(key));

        setUser(null);
        toast.success('Logged out securely');

        setTimeout(() => {
            window.location.reload();
        }, 500);
    };

    /**
     * Check if the client version matches the server version.
     * If not, force a hard reload to clear cache.
     */
    const checkAppVersion = async () => {
        try {
            const response = await fetch('/version.json?t=' + Date.now());
            if (!response.ok) return;

            const serverVersion = await response.json();
            const localVersion = localStorage.getItem('qr:app_version');

            if (localVersion && localVersion !== serverVersion.timestamp.toString()) {
                console.log('New version detected. Reloading...');
                toast.success('Updating app to latest version...', { duration: 2000 });

                // Clear cache and reload
                localStorage.setItem('qr:app_version', serverVersion.timestamp.toString());

                // Unregister service workers if any
                if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.getRegistrations().then(function (registrations) {
                        for (let registration of registrations) {
                            registration.unregister();
                        }
                    });
                }

                setTimeout(() => {
                    window.location.reload(true);
                }, 1500);
            } else {
                // First time or same version
                localStorage.setItem('qr:app_version', serverVersion.timestamp.toString());
            }
        } catch (error) {
            console.error('Failed to check app version', error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

