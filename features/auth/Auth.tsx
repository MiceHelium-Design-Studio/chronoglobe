'use client';

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useAppDispatch, RootState } from '../../store/store';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { setUser, setLoading, setError, logout } from '../../store/slices/authSlice';
import { reportAuthError } from '../../lib/errorTracking';

export default function Auth() {
  const { user, loading, error } = useSelector((state: RootState) => state.auth);
  const dispatch = useAppDispatch();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        dispatch(setUser(user));
      },
      (error) => {
        reportAuthError(error, { operation: 'auth_state', route: 'auth-listener' });
      },
    );
    return () => unsubscribe();
  }, [dispatch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(setLoading(true));
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      setEmail('');
      setPassword('');
    } catch (error) {
      reportAuthError(error, {
        operation: isLogin ? 'login' : 'signup',
        route: isLogin ? '/login' : '/signup',
        userId: auth.currentUser?.uid ?? null,
      });
      dispatch(
        setError(
          error instanceof Error ? error.message : 'Unable to authenticate user.',
        ),
      );
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      dispatch(logout());
    } catch (error) {
      reportAuthError(error, {
        operation: 'logout',
        route: '/logout',
        userId: auth.currentUser?.uid ?? null,
      });
      dispatch(
        setError(
          error instanceof Error ? error.message : 'Unable to sign out user.',
        ),
      );
    }
  };

  if (user) {
    return (
      <div className="p-4 bg-white rounded shadow">
        <p className="text-lg font-semibold">Welcome, {user.email}</p>
        <button
          onClick={handleLogout}
          className="mt-2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded shadow max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">{isLogin ? 'Login' : 'Sign Up'}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full p-2 border rounded"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full p-2 border rounded"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Processing...' : (isLogin ? 'Login' : 'Sign Up')}
        </button>
      </form>
      {error && <p className="text-red-500 mt-2">{error}</p>}
      <button
        onClick={() => setIsLogin(!isLogin)}
        className="mt-4 text-blue-500 hover:underline"
      >
        {isLogin ? 'Need an account? Sign up' : 'Already have an account? Login'}
      </button>
    </div>
  );
}
