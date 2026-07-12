import User from '../models/user.model.js';
import Message from '../models/message.model.js';
import FriendRequest from '../models/friendRequest.model.js';
import cloudinary from '../lib/cloudinary.js';
import { getReceiverSocketId, io } from '../lib/socket.js';
import { 
  MessageMessages, 
  GeneralMessages, 
  StatusCodes,
  FriendMessages
} from '../shared/response.messages.js';

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    // Find all accepted friendships
    const friendships = await FriendRequest.find({
      status: 'accepted',
      $or: [{ sender: loggedInUserId }, { receiver: loggedInUserId }],
    });

    // Extract friend IDs
    const friendIds = friendships.map((friendship) =>
      friendship.sender.toString() === loggedInUserId.toString()
        ? friendship.receiver
        : friendship.sender
    );

    // Fetch friend profiles
    const friends = await User.find({
      _id: { $in: friendIds },
    });

    res.status(StatusCodes.OK).json(friends);
  } catch (error) {
    console.log('Error in getUsersForSidebar controller', error.message);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      error: GeneralMessages.INTERNAL_SERVER_ERROR 
    });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    // Verify accepted friendship exists
    const isFriend = await FriendRequest.findOne({
      status: 'accepted',
      $or: [
        { sender: myId, receiver: userToChatId },
        { sender: userToChatId, receiver: myId },
      ],
    });

    if (!isFriend) {
      return res.status(StatusCodes.FORBIDDEN).json({
        message: FriendMessages.NOT_FRIENDS,
      });
    }

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });
    res.status(StatusCodes.OK).json(messages);
  } catch (error) {
    console.log('Error in getMessages controller', error.message);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      error: GeneralMessages.INTERNAL_SERVER_ERROR 
    });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    // Verify accepted friendship exists
    const isFriend = await FriendRequest.findOne({
      status: 'accepted',
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId },
      ],
    });

    if (!isFriend) {
      return res.status(StatusCodes.FORBIDDEN).json({
        message: FriendMessages.NOT_FRIENDS,
      });
    }

    let imageUrl;
    if (image) {
      // Upload base64 image to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
    });

    await newMessage.save();

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('newMessage', newMessage);
    }

    res.status(StatusCodes.CREATED).json(newMessage);
  } catch (error) {
    console.log('Error in sentMessages controller', error.message);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      error: GeneralMessages.INTERNAL_SERVER_ERROR 
    });
  }
};
