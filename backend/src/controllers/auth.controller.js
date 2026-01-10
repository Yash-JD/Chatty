import User from '../models/user.model.js';
import cloudinary from '../lib/cloudinary.js';
import { auth } from '../lib/firebase.js';
import { 
  AuthMessages, 
  GeneralMessages, 
  StatusCodes, 
  FirebaseMessages,
  createSuccessResponse,
  createErrorResponse 
} from '../shared/response.messages.js';

export const signup = async (req, res) => {
  const { fullName, email, password } = req.body;
  try {
    if (!fullName || !email || !password) {
      return res.status(StatusCodes.BAD_REQUEST).json({ 
        message: AuthMessages.ALL_FIELDS_REQUIRED 
      });
    }

    if (password.length < 6) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: AuthMessages.PASSWORD_MIN_LENGTH });
    }

    // Check if user already exists in our database
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(StatusCodes.BAD_REQUEST).json({ 
      message: AuthMessages.EMAIL_EXISTS 
    });

    // Create user in Firebase
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: fullName,
    });

    // Create user in our database
    const newUser = new User({
      firebaseUid: userRecord.uid,
      fullName,
      email,
    });

    await newUser.save();

    res.status(StatusCodes.CREATED).json({
      _id: newUser._id,
      firebaseUid: newUser.firebaseUid,
      fullName: newUser.fullName,
      email: newUser.email,
      profilePic: newUser.profilePic,
    });
  } catch (error) {
    console.log('Error in signup controller', error.message);
    if (error.code === FirebaseMessages.EMAIL_ALREADY_IN_USE) {
      return res.status(StatusCodes.BAD_REQUEST).json({ 
        message: AuthMessages.EMAIL_EXISTS_FIREBASE 
      });
    }
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      message: GeneralMessages.INTERNAL_SERVER_ERROR 
    });
  }
};

export const login = async (req, res) => {
  // Login is now handled by Firebase on the frontend
  // This endpoint is just for user profile data after Firebase auth
  try {
    const { firebaseUid } = req.body;
    
    if (!firebaseUid) {
      return res.status(StatusCodes.BAD_REQUEST).json({ 
        message: AuthMessages.FIREBASE_UID_REQUIRED 
      });
    }

    const user = await User.findOne({ firebaseUid });

    if (!user) return res.status(StatusCodes.BAD_REQUEST).json({ 
      message: AuthMessages.USER_NOT_FOUND 
    });

    res.status(StatusCodes.OK).json({
      _id: user._id,
      firebaseUid: user.firebaseUid,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
    });
  } catch (error) {
    console.log('Error in login controller', error.message);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      message: GeneralMessages.INTERNAL_SERVER_ERROR 
    });
  }
};

export const logout = async (req, res) => {
  try {
    // Revoke Firebase tokens
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decodedToken = await auth.verifyIdToken(token);
        await auth.revokeRefreshTokens(decodedToken.uid);
      } catch (error) {
        console.log('Error revoking token:', error.message);
      }
    }
    
    res.status(StatusCodes.OK).json({ 
      message: AuthMessages.LOGOUT_SUCCESS 
    });
  } catch (error) {
    console.log('Error in logout controller', error.message);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      message: GeneralMessages.INTERNAL_SERVER_ERROR 
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { profilePic } = req.body;

    if (!profilePic) {
      return res.status(StatusCodes.BAD_REQUEST).json({ 
        message: AuthMessages.PROFILE_PIC_REQUIRED 
      });
    }

    const uploadResponse = await cloudinary.uploader.upload(profilePic);

    const userId = req.user._id;
    const updateUser = await User.findByIdAndUpdate(
      userId,
      { profilePic: uploadResponse.secure_url },
      { new: true },
    );
    res.status(StatusCodes.OK).json(updateUser);
  } catch (error) {
    console.log('Error in updateProfile controller', error.message);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      message: GeneralMessages.INTERNAL_SERVER_ERROR 
    });
  }
};

export const checkAuth = (req, res) => {
  try {
    res.status(StatusCodes.OK).json(req.user);
  } catch (error) {
    console.log('Error in checkAuth controller', error.message);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      message: GeneralMessages.INTERNAL_SERVER_ERROR 
    });
  }
};
