import React, { useEffect } from 'react';
import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../store/useAuthStore';
import Sidebar from '../components/Sidebar';
import NoChatSelected from '../components/NoChatSelected';
import ChatContainer from '../components/ChatContainer';
import FriendRequestPanel from '../components/FriendRequestPanel';

const HomePage = () => {
  const { socket } = useAuthStore();
  const {
    selectedUser,
    showFriendPanel,
    subscribeToFriendRequests,
    unsubscribeFromFriendRequests,
    getPendingRequests,
  } = useChatStore();

  useEffect(() => {
    getPendingRequests();

    if (socket) {
      subscribeToFriendRequests();
      return () => unsubscribeFromFriendRequests();
    }
  }, [socket, getPendingRequests, subscribeToFriendRequests, unsubscribeFromFriendRequests]);

  return (
    <div className="h-screen bg-base-200">
      <div className="flex items-center justify-center pt-20 px-4">
        <div className="bg-base-100 rounded-lg shadow-cl w-full max-w-6xl h-[calc(100vh-8rem)]">
          <div className="flex h-full rounded-lg overflow-hidden">
            <Sidebar />
            {showFriendPanel ? (
              <FriendRequestPanel />
            ) : !selectedUser ? (
              <NoChatSelected />
            ) : (
              <ChatContainer />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
