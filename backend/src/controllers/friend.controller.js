import User from '../models/user.model.js';
import FriendRequest from '../models/friendRequest.model.js';
import {
  FriendMessages,
  GeneralMessages,
  StatusCodes,
} from '../shared/response.messages.js';

// Send a friend request by user email
export const sendFriendRequest = async (req, res) => {
  try {
    const { email } = req.body;
    const senderId = req.user._id;

    if (!email) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: 'Email is required' });
    }

    // 1. Find user by email
    const receiver = await User.findOne({ email: email.toLowerCase().trim() });
    if (!receiver) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: FriendMessages.EMAIL_NOT_FOUND });
    }

    const receiverId = receiver._id;

    // 2. Validate sender is not receiver
    if (senderId.toString() === receiverId.toString()) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: FriendMessages.CANNOT_FRIEND_SELF });
    }

    // 3. Check for existing request in either direction
    const existingRequest = await FriendRequest.findOne({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId },
      ],
    });

    if (existingRequest) {
      if (existingRequest.status === 'accepted') {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ message: FriendMessages.ALREADY_FRIENDS });
      }

      if (existingRequest.status === 'pending') {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ message: FriendMessages.REQUEST_PENDING });
      }

      // If it was rejected, we allow the user to send a request again.
      // We toggle it back to pending and update the sender/receiver.
      if (existingRequest.status === 'rejected') {
        existingRequest.sender = senderId;
        existingRequest.receiver = receiverId;
        existingRequest.status = 'pending';
        await existingRequest.save();

        return res.status(StatusCodes.OK).json({
          message: FriendMessages.REQUEST_SENT_SUCCESS,
          request: existingRequest,
        });
      }
    }

    // 4. Create new friend request
    const newRequest = new FriendRequest({
      sender: senderId,
      receiver: receiverId,
      status: 'pending',
    });
    await newRequest.save();

    res.status(StatusCodes.CREATED).json({
      message: FriendMessages.REQUEST_SENT_SUCCESS,
      request: newRequest,
    });
  } catch (error) {
    console.log('Error in sendFriendRequest controller', error.message);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: GeneralMessages.INTERNAL_SERVER_ERROR });
  }
};

// Get pending incoming requests for the logged-in user
export const getPendingRequests = async (req, res) => {
  try {
    const receiverId = req.user._id;

    const pendingRequests = await FriendRequest.find({
      receiver: receiverId,
      status: 'pending',
    }).populate('sender', 'fullName email profilePic');

    res.status(StatusCodes.OK).json(pendingRequests);
  } catch (error) {
    console.log('Error in getPendingRequests controller', error.message);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: GeneralMessages.INTERNAL_SERVER_ERROR });
  }
};

// Respond to friend request (accept or reject)
export const respondToFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { action } = req.body; // 'accept' or 'reject'
    const loggedInUserId = req.user._id;

    if (!['accept', 'reject'].includes(action)) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Action must be either 'accept' or 'reject'" });
    }

    const request = await FriendRequest.findById(requestId);
    if (!request) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: FriendMessages.REQUEST_NOT_FOUND });
    }

    // Verify the logged-in user is indeed the receiver of the request
    if (request.receiver.toString() !== loggedInUserId.toString()) {
      return res
        .status(StatusCodes.FORBIDDEN)
        .json({ message: GeneralMessages.FORBIDDEN });
    }

    if (request.status !== 'pending') {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: 'Request has already been processed' });
    }

    request.status = action === 'accept' ? 'accepted' : 'rejected';
    await request.save();

    const message =
      action === 'accept'
        ? FriendMessages.REQUEST_ACCEPTED_SUCCESS
        : FriendMessages.REQUEST_REJECTED_SUCCESS;

    res.status(StatusCodes.OK).json({
      message,
      request,
    });
  } catch (error) {
    console.log('Error in respondToFriendRequest controller', error.message);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: GeneralMessages.INTERNAL_SERVER_ERROR });
  }
};

// Remove friend (unfriend)
export const removeFriend = async (req, res) => {
  try {
    const { friendId } = req.params;
    const loggedInUserId = req.user._id;

    const deletedRequest = await FriendRequest.findOneAndDelete({
      status: 'accepted',
      $or: [
        { sender: loggedInUserId, receiver: friendId },
        { sender: friendId, receiver: loggedInUserId },
      ],
    });

    if (!deletedRequest) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: 'Friend connection not found or already deleted' });
    }

    res
      .status(StatusCodes.OK)
      .json({ message: FriendMessages.FRIEND_REMOVED_SUCCESS });
  } catch (error) {
    console.log('Error in removeFriend controller', error.message);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: GeneralMessages.INTERNAL_SERVER_ERROR });
  }
};

// Get list of all accepted friends
export const getFriends = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    const friendships = await FriendRequest.find({
      status: 'accepted',
      $or: [{ sender: loggedInUserId }, { receiver: loggedInUserId }],
    }).populate('sender receiver', 'fullName email profilePic');

    // Extract the other user details
    const friends = friendships.map((friendship) => {
      return friendship.sender._id.toString() === loggedInUserId.toString()
        ? friendship.receiver
        : friendship.sender;
    });

    res.status(StatusCodes.OK).json(friends);
  } catch (error) {
    console.log('Error in getFriends controller', error.message);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: GeneralMessages.INTERNAL_SERVER_ERROR });
  }
};
