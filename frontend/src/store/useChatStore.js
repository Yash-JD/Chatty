import { create } from 'zustand';
import toast from 'react-hot-toast';
import { axiosInstance } from '../lib/axios';
import { useAuthStore } from './useAuthStore';

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  pendingRequests: [],
  isPendingRequestsLoading: false,
  sentRequests: [],
  isSentRequestsLoading: false,
  showFriendPanel: false,

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get('/messages/users');
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isMessagesLoading: false });
    }
  },
  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    try {
      const res = await axiosInstance.post(
        `/messages/send/${selectedUser._id}`,
        messageData,
      );
      set({ messages: [...messages, res.data] });
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  // Subscribe to new messages from the socket
  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;

    socket.on('newMessage', (newMessage) => {
      if (newMessage.senderId !== selectedUser._id) return; // Ignore messages not from the selected user
      set({ messages: [...get().messages, newMessage] });
    });
  },

  // when user logs out, unsubscribe from new messages
  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off('newMessage');
  },

  getPendingRequests: async () => {
    set({ isPendingRequestsLoading: true });
    try {
      const res = await axiosInstance.get('/friends/pending');
      set({ pendingRequests: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch requests');
    } finally {
      set({ isPendingRequestsLoading: false });
    }
  },

  sendFriendRequest: async (email) => {
    try {
      const res = await axiosInstance.post('/friends/request', { email });
      toast.success(res.data.message || 'Friend request sent!');
      get().getSentRequests();
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send request');
      return false;
    }
  },

  respondToFriendRequest: async (requestId, action) => {
    try {
      const res = await axiosInstance.put(`/friends/respond/${requestId}`, { action });
      toast.success(res.data.message);
      
      // Update pending requests list
      set({
        pendingRequests: get().pendingRequests.filter((req) => req._id !== requestId)
      });
      
      // If request was accepted, refresh our friends list
      if (action === 'accept') {
        get().getUsers();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to respond to request');
    }
  },

  removeFriend: async (friendId) => {
    try {
      const res = await axiosInstance.delete(`/friends/${friendId}`);
      toast.success(res.data.message);
      
      // If we unfriend the currently selected user, clear selected user
      if (get().selectedUser?._id === friendId) {
        set({ selectedUser: null });
      }
      
      // Refresh friends list
      get().getUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to remove friend');
    }
  },

  getSentRequests: async () => {
    set({ isSentRequestsLoading: true });
    try {
      const res = await axiosInstance.get('/friends/sent');
      set({ sentRequests: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch sent requests');
    } finally {
      set({ isSentRequestsLoading: false });
    }
  },

  subscribeToFriendRequests: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.on('newFriendRequest', (newRequest) => {
      set({
        pendingRequests: [...get().pendingRequests, newRequest],
      });
      toast.success(`New friend request from ${newRequest.sender.fullName}!`);
    });

    socket.on('friendRequestAccepted', (newFriend) => {
      set({
        users: [...get().users, newFriend],
      });
      // Filter out of sent requests
      set({
        sentRequests: get().sentRequests.filter(req => req.receiver?._id !== newFriend._id)
      });
      toast.success(`${newFriend.fullName} accepted your friend request!`);
    });

    socket.on('friendRemoved', (friendId) => {
      set({
        users: get().users.filter(user => user._id !== friendId),
      });
      if (get().selectedUser?._id === friendId) {
        set({ selectedUser: null });
      }
      toast.error('A friend was removed from your contact list.');
    });
  },

  unsubscribeFromFriendRequests: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
    socket.off('newFriendRequest');
    socket.off('friendRequestAccepted');
    socket.off('friendRemoved');
  },

  setShowFriendPanel: (showFriendPanel) => set({ showFriendPanel, selectedUser: null }),
  setSelectedUser: (selectedUser) => set({ selectedUser, showFriendPanel: false }),
}));
