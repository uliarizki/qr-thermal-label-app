import React, { createContext, useState, useContext, useEffect } from 'react';
import { loginUser, logActivity } from '../utils/googleSheets';
import { toast } from 'react-hot-toast';

const AuthContext = createContext(null);

// Session expiry: 7 days in milliseconds
const SESSION_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check local storage for session
        const storedUser = localStorage.getItem('qr:auth_user');
        const loginTime = localStorage.getItem('qr:auth_time');

        if (storedUser) {
            try {
                // Check if session expired
                const loginTimestamp = loginTime ? parseInt(loginTime, 10) : 0;
                const now = Date.now();

                if (now - loginTimestamp > SESSION_EXPIRY_MS) {
                    // Session expired - auto logout
                    console.log('Session expired, logging out...');
                    localStorage.removeItem('qr:auth_user');
                    localStorage.removeItem('qr:auth_time');
                    toast.error('Sesi telah berakhir. Silakan login kembali.', { duration: 5000 });
                } else {
                    setUser(JSON.parse(storedUser));
                }
            } catch (e) {
                console.error("Invalid auth token");
                localStorage.removeItem('qr:auth_user');
                localStorage.removeItem('qr:auth_time');
            }
        }
        setLoading(false);
    }, []);

    const login = async (username, password) => {
        const toastId = toast.loading('Verifying credentials...');
        try {
            const result = await loginUser(username, password);

            if (result.success) {
                const userData = result.data;
                setUser(userData);

                // Store user and login timestamp
                localStorage.setItem('qr:auth_user', JSON.stringify(userData));
                localStorage.setItem('qr:auth_time', Date.now().toString());

                toast.success(`Welcome back, ${userData.username}!`, { id: toastId });
                logActivity(userData.username, 'LOGIN', { timestamp: new Date() });
                return true;
            } else {
                toast.error(result.error || 'Login failed', { id: toastId });
                return false;
            }
        } catch (err) {
            toast.error('Network error during login', { id: toastId });
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

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

