// src/contexts/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '978955210480-uhe12gbqjrso5mkof5e1gqbukkt8hsap.apps.googleusercontent.com';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [googleLoaded, setGoogleLoaded] = useState(false);

  // Load Google Identity Services
  useEffect(() => {
    if (window.google) {
      setGoogleLoaded(true);
      checkExistingAuth();
      return;
    }

    // Wait for Google script to load
    const checkGoogle = setInterval(() => {
      if (window.google) {
        setGoogleLoaded(true);
        checkExistingAuth();
        clearInterval(checkGoogle);
      }
    }, 100);

    return () => clearInterval(checkGoogle);
  }, []);

  const checkExistingAuth = () => {
    try {
      const savedUser = localStorage.getItem('qr:user');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        setUser(userData);
      }
    } catch (error) {
      console.error('Error loading saved user:', error);
      localStorage.removeItem('qr:user');
    } finally {
      setLoading(false);
    }
  };

  const login = () => {
    return new Promise((resolve, reject) => {
      if (!window.google) {
        reject(new Error('Google Identity Services belum dimuat'));
        return;
      }

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => {
          try {
            // Decode JWT token
            const tokenParts = response.credential.split('.');
            const payload = JSON.parse(atob(tokenParts[1]));
            
            const userData = {
              email: payload.email,
              name: payload.name,
              picture: payload.picture,
              token: response.credential,
            };

            setUser(userData);
            localStorage.setItem('qr:user', JSON.stringify(userData));
            resolve(userData);
          } catch (error) {
            console.error('Error parsing token:', error);
            reject(error);
          }
        },
      });

      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // Use popup instead
          window.google.accounts.oauth2.initTokenClient({
            client_id: GOOGLE_CLIENT_ID,
            scope: 'email profile',
            callback: (tokenResponse) => {
              // For OAuth2, we need to fetch user info
              fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${tokenResponse.access_token}`)
                .then(res => res.json())
                .then(profile => {
                  const userData = {
                    email: profile.email,
                    name: profile.name,
                    picture: profile.picture,
                    token: tokenResponse.access_token,
                  };
                  setUser(userData);
                  localStorage.setItem('qr:user', JSON.stringify(userData));
                  resolve(userData);
                })
                .catch(reject);
            },
          }).requestAccessToken();
        }
      });

      // Trigger One Tap or show button
      window.google.accounts.id.renderButton(
        document.getElementById('google-signin-button'),
        {
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
        }
      );
    });
  };

  const showLoginPopup = () => {
    return new Promise((resolve, reject) => {
      if (!window.google) {
        reject(new Error('Google Identity Services belum dimuat'));
        return;
      }

      window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'email profile',
        callback: (tokenResponse) => {
          fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${tokenResponse.access_token}`)
            .then(res => res.json())
            .then(profile => {
              const userData = {
                email: profile.email,
                name: profile.name,
                picture: profile.picture,
                token: tokenResponse.access_token,
              };
              setUser(userData);
              localStorage.setItem('qr:user', JSON.stringify(userData));
              resolve(userData);
            })
            .catch(reject);
        },
      }).requestAccessToken();
    });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('qr:user');
    localStorage.removeItem('qr:selectedBranch');
  };

  const value = {
    user,
    loading,
    googleLoaded,
    login,
    showLoginPopup,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

