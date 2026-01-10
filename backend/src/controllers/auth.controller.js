import User from '../models/user.model.js';
import cloudinary from '../lib/cloudinary.js';
import { auth } from '../lib/firebase.js';

export const signup = async (req, res) => {
  const { fullName, email, password } = req.body;
  try {
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: 'Password must be of at least 6 characters' });
    }

    // Check if user already exists in our database
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'Email already exists' });

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

    res.status(201).json({
      _id: newUser._id,
      firebaseUid: newUser.firebaseUid,
      fullName: newUser.fullName,
      email: newUser.email,
      profilePic: newUser.profilePic,
    });
  } catch (error) {
    console.log('Error in signup controller', error.message);
    if (error.code === 'auth/email-already-exists') {
      return res.status(400).json({ message: 'Email already exists in Firebase' });
    }
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const login = async (req, res) => {
  // Login is now handled by Firebase on the frontend
  // This endpoint is just for user profile data after Firebase auth
  try {
    const { firebaseUid } = req.body;
    
    if (!firebaseUid) {
      return res.status(400).json({ message: 'Firebase UID is required' });
    }

    const user = await User.findOne({ firebaseUid }).select('-password');

    if (!user) return res.status(400).json({ message: 'User not found' });

    res.status(200).json({
      _id: user._id,
      firebaseUid: user.firebaseUid,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
    });
  } catch (error) {
    console.log('Error in login controller', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
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
    
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.log('Error in logout controller', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { profilePic } = req.body;

    if (!profilePic) {
      return res.status(400).json({ message: 'Profile pic is required' });
    }

    const uploadResponse = await cloudinary.uploader.upload(profilePic);

    const userId = req.user._id;
    const updateUser = await User.findByIdAndUpdate(
      userId,
      { profilePic: uploadResponse.secure_url },
      { new: true },
    );
    res.status(200).json(updateUser);
  } catch (error) {
    console.log('Error in updateProfile controller', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const checkAuth = (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    console.log('Error in checkAuth controller', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
