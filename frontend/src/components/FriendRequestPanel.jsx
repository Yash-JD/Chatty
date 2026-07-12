import React, { useEffect, useState } from 'react';
import { useChatStore } from '../store/useChatStore';
import { UserPlus, Check, X, Users, UserMinus, Loader2 } from 'lucide-react';

const FriendRequestPanel = () => {
  const {
    pendingRequests,
    isPendingRequestsLoading,
    getPendingRequests,
    sendFriendRequest,
    respondToFriendRequest,
    removeFriend,
    users: friends, // 'users' store array now contains only accepted friends
    getUsers: getFriends,
  } = useChatStore();

  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    getPendingRequests();
    getFriends();
  }, [getPendingRequests, getFriends]);

  const handleSendRequest = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSending(true);
    const success = await sendFriendRequest(email);
    setIsSending(false);

    if (success) {
      setEmail('');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-base-100 p-6 md:p-8">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-base-300 pb-5 mb-6">
        <Users className="size-8 text-primary" />
        <div>
          <h2 className="text-xl font-bold">Friend Settings</h2>
          <p className="text-sm text-base-content/60">
            Manage your network, send invitations, and view pending requests.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Add Friend & Pending Requests */}
        <div className="space-y-6">
          {/* Add Friend Form */}
          <div className="bg-base-200/50 rounded-xl p-5 border border-base-300">
            <h3 className="text-md font-semibold mb-3 flex items-center gap-2">
              <UserPlus className="size-5 text-primary" /> Add Friend
            </h3>
            <form onSubmit={handleSendRequest} className="space-y-3">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Find user by email address</span>
                </label>
                <div className="join w-full">
                  <input
                    type="email"
                    placeholder="friend@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input input-bordered join-item flex-1 focus:outline-none"
                    required
                  />
                  <button
                    type="submit"
                    className="btn btn-primary join-item px-6"
                    disabled={isSending}
                  >
                    {isSending ? (
                      <Loader2 className="size-5 animate-spin" />
                    ) : (
                      'Invite'
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Pending Requests Section */}
          <div className="bg-base-200/50 rounded-xl p-5 border border-base-300">
            <h3 className="text-md font-semibold mb-4 flex items-center gap-2">
              <Users className="size-5 text-primary" /> Pending Friend Requests (
              {pendingRequests.length})
            </h3>

            {isPendingRequestsLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="size-6 animate-spin text-primary" />
              </div>
            ) : pendingRequests.length === 0 ? (
              <p className="text-sm text-base-content/50 py-4 text-center">
                No pending incoming requests.
              </p>
            ) : (
              <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                {pendingRequests.map((req) => (
                  <div
                    key={req._id}
                    className="flex items-center justify-between p-3 rounded-lg bg-base-100 border border-base-300"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={req.sender.profilePic || '/avatar.png'}
                        alt={req.sender.fullName}
                        className="size-10 rounded-full object-cover"
                      />
                      <div className="min-w-0">
                        <div className="font-semibold text-sm truncate">
                          {req.sender.fullName}
                        </div>
                        <div className="text-xs text-base-content/60 truncate">
                          {req.sender.email}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => respondToFriendRequest(req._id, 'accept')}
                        className="btn btn-sm btn-success btn-square"
                        title="Accept Request"
                      >
                        <Check className="size-4" />
                      </button>
                      <button
                        onClick={() => respondToFriendRequest(req._id, 'reject')}
                        className="btn btn-sm btn-error btn-square"
                        title="Reject Request"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Friends List Management */}
        <div className="bg-base-200/50 rounded-xl p-5 border border-base-300">
          <h3 className="text-md font-semibold mb-4 flex items-center gap-2">
            <Users className="size-5 text-primary" /> Current Friends ({friends.length})
          </h3>

          {friends.length === 0 ? (
            <p className="text-sm text-base-content/50 py-8 text-center">
              You haven't added any friends yet. Invite them by email to start chatting!
            </p>
          ) : (
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {friends.map((friend) => (
                <div
                  key={friend._id}
                  className="flex items-center justify-between p-3 rounded-lg bg-base-100 border border-base-300"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={friend.profilePic || '/avatar.png'}
                      alt={friend.fullName}
                      className="size-10 rounded-full object-cover"
                    />
                    <div className="min-w-0">
                      <div className="font-semibold text-sm truncate">
                        {friend.fullName}
                      </div>
                      <div className="text-xs text-base-content/60 truncate">
                        {friend.email}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFriend(friend._id)}
                    className="btn btn-sm btn-outline btn-error gap-1"
                    title="Remove Friend"
                  >
                    <UserMinus className="size-4" />
                    <span className="hidden sm:inline">Remove</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FriendRequestPanel;
