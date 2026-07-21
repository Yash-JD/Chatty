import User from '../models/user.model.js';
import Message from '../models/message.model.js';
import FriendRequest from '../models/friendRequest.model.js';
import cloudinary from '../lib/cloudinary.js';
import { generateAIResponse } from '../lib/gemini.js';
import { getReceiverSocketId, io } from '../lib/socket.js';
import {
  MessageMessages,
  GeneralMessages,
  StatusCodes,
  FriendMessages,
  createErrorResponse,
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
        : friendship.sender,
    );

    // Fetch friend profiles
    const friends = await User.find({
      _id: { $in: friendIds },
    });

    // Fetch and prepend the Chatty AI virtual user
    const aiUser = await User.findOne({ email: 'ai@chatty.com' });
    const responseList = aiUser ? [aiUser, ...friends] : friends;

    res.status(StatusCodes.OK).json(responseList);
  } catch (error) {
    console.log('Error in getUsersForSidebar controller', error.message);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json(
        createErrorResponse(
          StatusCodes.INTERNAL_SERVER_ERROR,
          GeneralMessages.INTERNAL_SERVER_ERROR,
          error.message,
        ),
      );
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    // Verify accepted friendship exists (bypass if chat is with Chatty AI)
    const receiverUser = await User.findById(userToChatId);
    const isAI = receiverUser && receiverUser.email === 'ai@chatty.com';

    if (!isAI) {
      const isFriend = await FriendRequest.findOne({
        status: 'accepted',
        $or: [
          { sender: myId, receiver: userToChatId },
          { sender: userToChatId, receiver: myId },
        ],
      });

      if (!isFriend) {
        return res
          .status(StatusCodes.FORBIDDEN)
          .json(
            createErrorResponse(
              StatusCodes.FORBIDDEN,
              FriendMessages.NOT_FRIENDS,
            ),
          );
      }
    }

    let messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });

    // Seed default welcome message if it's the user's first time loading the AI chat
    if (isAI && messages.length === 0) {
      const welcomeMessage = new Message({
        senderId: userToChatId, // AI is sender
        receiverId: myId,      // User is receiver
        text: `Hi ${req.user.fullName}, how can I help you today?`,
      });
      await welcomeMessage.save();
      messages = [welcomeMessage];
    }

    res.status(StatusCodes.OK).json(messages);
  } catch (error) {
    console.log('Error in getMessages controller', error.message);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json(
        createErrorResponse(
          StatusCodes.INTERNAL_SERVER_ERROR,
          GeneralMessages.INTERNAL_SERVER_ERROR,
          error.message,
        ),
      );
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    // Verify accepted friendship exists (bypass if chat is with Chatty AI)
    const receiverUser = await User.findById(receiverId);
    const isAI = receiverUser && receiverUser.email === 'ai@chatty.com';

    if (!isAI) {
      const isFriend = await FriendRequest.findOne({
        status: 'accepted',
        $or: [
          { sender: senderId, receiver: receiverId },
          { sender: receiverId, receiver: senderId },
        ],
      });

      if (!isFriend) {
        return res
          .status(StatusCodes.FORBIDDEN)
          .json(
            createErrorResponse(
              StatusCodes.FORBIDDEN,
              FriendMessages.NOT_FRIENDS,
            ),
          );
      }
    } else {
      // AI Chat prompt limit checking for non-premium users
      if (!req.user.isPremium) {
        const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
        const now = new Date();
        const lastReset = new Date(req.user.lastAiChatReset || now);

        if (now.getTime() - lastReset.getTime() >= THIRTY_DAYS_MS) {
          req.user.aiChatCount = 0;
          req.user.lastAiChatReset = now;
          await req.user.save();
        }

        if (req.user.aiChatCount >= 20) {
          return res
            .status(StatusCodes.FORBIDDEN)
            .json(
              createErrorResponse(
                StatusCodes.FORBIDDEN,
                "You have reached your limit of 20 AI prompts for this month. Upgrade to Premium for unlimited chats!"
              )
            );
        }
      }
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

    // Respond back immediately with the user's message
    res.status(StatusCodes.CREATED).json(newMessage);

    // If it is the AI, handle Gemini call asynchronously
    if (isAI) {
      (async () => {
        try {
          const aiResponseText = await generateAIResponse(text);

          const aiMessage = new Message({
            senderId: receiverId,
            receiverId: senderId,
            text: aiResponseText,
          });
          await aiMessage.save();

          // Increment count on successful response generation
          if (!req.user.isPremium) {
            req.user.aiChatCount += 1;
            await req.user.save();
          }

          // Push to user socket
          const userSocketId = getReceiverSocketId(senderId);
          if (userSocketId) {
            io.to(userSocketId).emit('newMessage', aiMessage);
          }
        } catch (aiError) {
          console.error('Error generating AI response:', aiError.message);
          const aiErrorMessage = new Message({
            senderId: receiverId,
            receiverId: senderId,
            text: `Sorry, I am having trouble processing that right now: ${aiError.message}. Please try again later.`,
          });
          await aiErrorMessage.save();

          const userSocketId = getReceiverSocketId(senderId);
          if (userSocketId) {
            io.to(userSocketId).emit('newMessage', aiErrorMessage);
          }
        }
      })();
    } else {
      // Direct user-to-user Socket push
      const receiverSocketId = getReceiverSocketId(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('newMessage', newMessage);
      }
    }
  } catch (error) {
    console.log('Error in sentMessages controller', error.message);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json(
        createErrorResponse(
          StatusCodes.INTERNAL_SERVER_ERROR,
          GeneralMessages.INTERNAL_SERVER_ERROR,
          error.message,
        ),
      );
  }
};
