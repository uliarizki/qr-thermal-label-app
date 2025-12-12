import React, { createContext, useState, useContext, useEffect } from 'react';
import { loginUser, logActivity } from '../utils/googleSheets';
import { toast } from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check local storage for session
        const storedUser = localStorage.getItem('qr:auth_user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
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
            const result = await loginUser(username, password);

            if (result.success) {
                const userData = result.data; // { username, role, token }
                setUser(userData);
                localStorage.setItem('qr:auth_user', JSON.stringify(userData));

                toast.success(`Welcome back, ${userData.username}!`, { id: toastId });

                // Log login activity
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
        const keysToRemove = ['qr:auth_user', 'qr:customers_cache', 'qr:lastTab', 'qr:history_log'];
        keysToRemove.forEach(key => localStorage.removeItem(key));

        setUser(null);
        toast.success('Logged out securely');

        // Force Reload to clear memory state
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
