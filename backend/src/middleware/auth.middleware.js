import { auth } from '../lib/firebase.js';
import User from '../models/user.model.js';

export const protectRoute = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res
        .status(401)
        .json({ message: 'Unauthorized - No token provided' });
    }

    const token = authHeader.split(' ')[1];

    const decodedToken = await auth.verifyIdToken(token);

    if (!decodedToken) {
      return res.status(401).json({ message: 'Unauthorized - Invalid token' });
    }

    const user = await User.findOne({ firebaseUid: decodedToken.uid }).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // if everything works
    req.user = user;
    next();
  } catch (error) {
    console.log('Error in protectRoute middleware', error.message);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
