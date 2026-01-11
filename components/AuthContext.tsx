import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    onAuthStateChanged,
    User as FirebaseUser,
    signOut,
    GoogleAuthProvider,
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword
} from 'firebase/auth';
import { auth, db } from '../firebase';
import { User, UserRole } from '../types';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    loginWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Safety timeout to ensure app doesn't stay stuck forever
        const timer = setTimeout(() => {
            setLoading(false);
        }, 5000);

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            clearTimeout(timer);
            try {
                if (firebaseUser) {
                    // Fetch additional user data from Firestore if needed
                    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        setUser({
                            id: firebaseUser.uid,
                            name: userData.name || firebaseUser.displayName || 'User',
                            role: userData.role as UserRole || UserRole.MANAGER,
                            email: firebaseUser.email || undefined
                        });
                    } else {
                        // Create a default user profile if none exists
                        const newUser: User = {
                            id: firebaseUser.uid,
                            name: firebaseUser.displayName || 'New User',
                            role: UserRole.MANAGER,
                            email: firebaseUser.email || undefined
                        };
                        await setDoc(doc(db, 'users', firebaseUser.uid), {
                            name: newUser.name,
                            role: newUser.role,
                            email: newUser.email,
                            createdAt: new Date().toISOString()
                        });
                        setUser(newUser);
                    }
                } else {
                    setUser(null);
                }
            } catch (error) {
                console.error("Auth initialization error:", error);
                setUser(null);
            } finally {
                setLoading(false);
            }
        });

        return () => {
            unsubscribe();
            clearTimeout(timer);
        };
    }, []);

    const loginWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
    };

    const logout = async () => {
        await signOut(auth);
    };

    return (
        <AuthContext.Provider value={{ user, loading, loginWithGoogle, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
