import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile
} from 'firebase/auth';
import {
    doc,
    setDoc,
    getDoc,
    updateDoc,
    serverTimestamp
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { retryWithBackoff, ApiError } from './api';

const USERS_COLLECTION = 'users';

/**
 * Login with email and password
 */
export async function login(email, password) {
    return retryWithBackoff(async () => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Get user profile from Firestore
            const userDoc = await getDoc(doc(db, USERS_COLLECTION, user.uid));

            if (!userDoc.exists()) {
                throw new ApiError('User profile not found', 404);
            }

            const userData = userDoc.data();

            // Update last login timestamp
            await updateDoc(doc(db, USERS_COLLECTION, user.uid), {
                lastLogin: serverTimestamp()
            });

            return {
                uid: user.uid,
                email: user.email,
                username: userData.username,
                role: userData.role,
                createdAt: userData.createdAt?.toDate()
            };
        } catch (error) {
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                throw new ApiError('Username atau password salah', 401);
            } else if (error.code === 'auth/too-many-requests') {
                throw new ApiError('Terlalu banyak percobaan login. Coba lagi nanti.', 429);
            } else if (error instanceof ApiError) {
                throw error;
            } else {
                throw new ApiError('Login gagal: ' + error.message, 500);
            }
        }
    });
}

/**
 * Register new user (admin only)
 */
export async function register(email, password, username, role) {
    return retryWithBackoff(async () => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Update display name
            await updateProfile(user, {
                displayName: username
            });

            // Create user profile in Firestore
            await setDoc(doc(db, USERS_COLLECTION, user.uid), {
                email,
                username,
                role,
                createdAt: serverTimestamp(),
                lastLogin: serverTimestamp()
            });

            return {
                uid: user.uid,
                email,
                username,
                role
            };
        } catch (error) {
            if (error.code === 'auth/email-already-in-use') {
                throw new ApiError('Email sudah terdaftar', 400);
            } else if (error.code === 'auth/weak-password') {
                throw new ApiError('Password terlalu lemah', 400);
            } else {
                throw new ApiError('Registrasi gagal: ' + error.message, 500);
            }
        }
    });
}

/**
 * Logout current user
 */
export async function logout() {
    await signOut(auth);
}

/**
 * Listen to auth state changes
 */
export function onAuthChange(callback) {
    return onAuthStateChanged(auth, async (user) => {
        if (user) {
            // Get user profile
            const userDoc = await getDoc(doc(db, USERS_COLLECTION, user.uid));
            if (userDoc.exists()) {
                callback({
                    uid: user.uid,
                    email: user.email,
                    ...userDoc.data()
                });
            } else {
                callback(null);
            }
        } else {
            callback(null);
        }
    });
}
