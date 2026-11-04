import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword,
  signInWithPopup, signOut, updateProfile
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { apiRequest } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setProfile(null);
      if (!firebaseUser) {
        setLoading(false);
        return;
      }
      try {
        const token = await firebaseUser.getIdToken();
        const result = await apiRequest('/api/auth/sync', {
          method: 'POST', token, body: JSON.stringify({ displayName: firebaseUser.displayName || '' })
        });
        setProfile(result.user);
      } catch (error) {
        console.error('Could not load the account profile:', error);
      } finally {
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  async function register(name, email, password) {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName: name.trim() });
    const token = await result.user.getIdToken(true);
    const synced = await apiRequest('/api/auth/sync', {
      method: 'POST', token, body: JSON.stringify({ displayName: name.trim() })
    });
    setProfile(synced.user);
  }

  async function login(email, password) {
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function loginWithGoogle() {
    await signInWithPopup(auth, googleProvider);
  }

  async function logout() {
    await signOut(auth);
    setProfile(null);
  }

  async function refreshProfile() {
    if (!auth.currentUser) return;
    const token = await auth.currentUser.getIdToken(true);
    const result = await apiRequest('/api/auth/me', { token });
    setProfile(result.user);
  }

  const value = useMemo(() => ({
    user, profile, loading, register, login, loginWithGoogle, logout, refreshProfile
  }), [user, profile, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
}
