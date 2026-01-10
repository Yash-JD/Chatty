import { create } from 'zustand';
import { axiosInstance } from '../lib/axios.js';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  getIdToken
} from 'firebase/auth';
import { auth } from '../lib/firebase.js';

const BASE_URL =
  import.meta.env.MODE === 'development' ? 'http://localhost:5001' : '/';

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,

  checkAuth: async () => {
    try {
      return new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
          if (user) {
            try {
              const token = await getIdToken(user);
              const res = await axiosInstance.get('/auth/check', {
                headers: { Authorization: `Bearer ${token}` }
              });
              set({ authUser: res.data });
              get().connectSocket();
            } catch (error) {
              console.log('Error in checkAuth:', error);
              set({ authUser: null });
            }
          } else {
            set({ authUser: null });
          }
          set({ isCheckingAuth: false });
          unsubscribe();
          resolve();
        });
      });
    } catch (error) {
      console.log('Error in checkAuth:', error);
      set({ authUser: null, isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;
      
      // Create user in backend
      const res = await axiosInstance.post('/auth/signup', {
        fullName: data.fullName,
        email: data.email,
        password: data.password
      });
      
      set({ authUser: res.data });
      toast.success('Account created successfully!');
    } catch (error) {
      console.log('Error in signup:', error);
      if (error.code === 'auth/email-already-in-use') {
        toast.error('Email already exists');
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to create account');
      }
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;
      
      // Get user data from backend
      const token = await getIdToken(user);
      const res = await axiosInstance.post('/auth/login', {
        firebaseUid: user.uid
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      set({ authUser: res.data });
      toast.success('Logged in successfully!');
      get().connectSocket();
    } catch (error) {
      console.log('Error in login:', error);
      if (error.code === 'auth/invalid-credential') {
        toast.error('Invalid email or password');
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to login');
      }
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const token = await getIdToken(user);
        await axiosInstance.post('/auth/logout', {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      await signOut(auth);
      set({ authUser: null });
      toast.success('Logged out successfully!');
      get().disconnectSocket();
    } catch (error) {
      console.log('Error in logout:', error);
      toast.error('Failed to logout');
    }
  },

  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');
      
      const token = await getIdToken(user);
      const res = await axiosInstance.put('/auth/update-profile', data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ authUser: res.data });
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.log('error in update profile:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  connectSocket: () => {
    const { authUser } = get();
    if (!authUser || get().socket?.connected) return;

    const socket = io(BASE_URL, { query: { userId: authUser._id } });
    socket.connect();

    set({ socket: socket });

    socket.on('getOnlineUsers', (userIds) => {
      set({ onlineUsers: userIds });
    });
  },

  disconnectSocket: () => {
    if (get().socket?.connected) get().socket.disconnect();
  },
}));
