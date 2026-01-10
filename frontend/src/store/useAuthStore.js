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
import { 
  AuthMessages, 
  getFirebaseErrorMessage,
  showToastMessage 
} from '../shared/messages.js';

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
      showToastMessage(toast, 'success', AuthMessages.ACCOUNT_CREATED_SUCCESS);
    } catch (error) {
      console.log('Error in signup:', error);
      if (error.code === 'auth/email-already-in-use') {
        showToastMessage(toast, 'error', AuthMessages.EMAIL_ALREADY_IN_USE);
      } else if (error.response?.data?.message) {
        showToastMessage(toast, 'error', error.response.data.message);
      } else {
        showToastMessage(toast, 'error', AuthMessages.FAILED_CREATE_ACCOUNT);
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
      showToastMessage(toast, 'success', AuthMessages.LOGIN_SUCCESS);
      get().connectSocket();
    } catch (error) {
      console.log('Error in login:', error);
      if (error.code === 'auth/invalid-credential') {
        showToastMessage(toast, 'error', AuthMessages.INVALID_CREDENTIALS);
      } else if (error.response?.data?.message) {
        showToastMessage(toast, 'error', error.response.data.message);
      } else {
        showToastMessage(toast, 'error', AuthMessages.FAILED_LOGIN);
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
      showToastMessage(toast, 'success', AuthMessages.LOGOUT_SUCCESS);
      get().disconnectSocket();
    } catch (error) {
      console.log('Error in logout:', error);
      showToastMessage(toast, 'error', AuthMessages.FAILED_LOGOUT);
    }
  },

  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const user = auth.currentUser;
      if (!user) throw new Error(AuthMessages.USER_NOT_AUTHENTICATED);
      
      const token = await getIdToken(user);
      const res = await axiosInstance.put('/auth/update-profile', data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ authUser: res.data });
      showToastMessage(toast, 'success', AuthMessages.PROFILE_UPDATE_SUCCESS);
    } catch (error) {
      console.log('error in update profile:', error);
      showToastMessage(toast, 'error', error.response?.data?.message || AuthMessages.FAILED_UPDATE_PROFILE);
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
