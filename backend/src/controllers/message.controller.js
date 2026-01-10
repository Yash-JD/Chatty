import User from '../models/user.model.js';
import Message from '../models/message.model.js';
import cloudinary from '../lib/cloudinary.js';
import { getReceiverSocketId, io } from '../lib/socket.js';
import { 
  MessageMessages, 
  GeneralMessages, 
  StatusCodes 
} from '../shared/response.messages.js';

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({
      _id: { $ne: loggedInUserId },
    }).select('-password');
    res.status(StatusCodes.OK).json(filteredUsers);
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
