import { auth } from '../lib/firebase.js';
import User from '../models/user.model.js';
import {
  AuthMessages,
  GeneralMessages,
  StatusCodes,
  createErrorResponse,
} from '../shared/response.messages.js';

export const protectRoute = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json(
          createErrorResponse(
            StatusCodes.UNAUTHORIZED,
            AuthMessages.UNAUTHORIZED_NO_TOKEN,
          ),
        );
    }

    const token = authHeader.split(' ')[1];

    const decodedToken = await auth.verifyIdToken(token);

    if (!decodedToken) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json(
          createErrorResponse(
            StatusCodes.UNAUTHORIZED,
            AuthMessages.UNAUTHORIZED_INVALID_TOKEN,
          ),
        );
    }

    const user = await User.findOne({ firebaseUid: decodedToken.uid });

    if (!user) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json(
          createErrorResponse(
            StatusCodes.NOT_FOUND,
            AuthMessages.USER_NOT_FOUND,
          ),
        );
    }

    // if everything works
    req.user = user;
    next();
  } catch (error) {
    console.log('Error in protectRoute middleware', error.message);
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
