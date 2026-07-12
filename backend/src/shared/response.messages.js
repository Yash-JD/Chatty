// Authentication Messages
export const AuthMessages = {
  ALL_FIELDS_REQUIRED: 'All fields are required',
  PASSWORD_MIN_LENGTH: 'Password must be of at least 6 characters',
  EMAIL_EXISTS: 'Email already exists',
  EMAIL_EXISTS_FIREBASE: 'Email already exists in Firebase',
  FIREBASE_UID_REQUIRED: 'Firebase UID is required',
  USER_NOT_FOUND: 'User not found',
  PROFILE_PIC_REQUIRED: 'Profile pic is required',
  LOGOUT_SUCCESS: 'Logged out successfully',
  ACCOUNT_CREATED_SUCCESS: 'Account created successfully!',
  LOGIN_SUCCESS: 'Logged in successfully!',
  PROFILE_UPDATE_SUCCESS: 'Profile updated successfully!',
  INVALID_CREDENTIALS: 'Invalid email or password',
  FAILED_CREATE_ACCOUNT: 'Failed to create account',
  FAILED_LOGIN: 'Failed to login',
  FAILED_LOGOUT: 'Failed to logout',
  FAILED_UPDATE_PROFILE: 'Failed to update profile',
  UNAUTHORIZED_NO_TOKEN: 'Unauthorized - No token provided',
  UNAUTHORIZED_INVALID_TOKEN: 'Unauthorized - Invalid token',
  USER_NOT_AUTHENTICATED: 'User not authenticated',
};

// Message/Chat Messages
export const MessageMessages = {
  MESSAGE_SENT_SUCCESS: 'Message sent successfully',
  MESSAGES_FETCHED_SUCCESS: 'Messages fetched successfully',
  USERS_FETCHED_SUCCESS: 'Users fetched successfully',
  MESSAGE_SEND_FAILED: 'Failed to send message',
  MESSAGE_FETCH_FAILED: 'Failed to fetch messages',
  USERS_FETCH_FAILED: 'Failed to fetch users',
  RECEIVER_NOT_FOUND: 'Receiver not found',
  INVALID_MESSAGE_DATA: 'Invalid message data',
};

// General Messages
export const GeneralMessages = {
  INTERNAL_SERVER_ERROR: 'Internal Server Error',
  BAD_REQUEST: 'Bad Request',
  NOT_FOUND: 'Resource not found',
  FORBIDDEN: 'Access forbidden',
  UNAUTHORIZED: 'Unauthorized access',
  VALIDATION_ERROR: 'Validation error',
  DATABASE_ERROR: 'Database operation failed',
  FILE_UPLOAD_ERROR: 'File upload failed',
  NETWORK_ERROR: 'Network error occurred',
  SUCCESS: 'Operation successful',
  CREATED: 'Resource created successfully',
  UPDATED: 'Resource updated successfully',
  DELETED: 'Resource deleted successfully',
};

// Friend System Messages
export const FriendMessages = {
  REQUEST_SENT_SUCCESS: 'Friend request sent successfully',
  REQUEST_ACCEPTED_SUCCESS: 'Friend request accepted',
  REQUEST_REJECTED_SUCCESS: 'Friend request rejected',
  FRIEND_REMOVED_SUCCESS: 'Friend removed successfully',
  EMAIL_NOT_FOUND: 'No user found with this email',
  CANNOT_FRIEND_SELF: 'You cannot friend yourself',
  ALREADY_FRIENDS: 'You are already friends with this user',
  REQUEST_PENDING: 'A friend request is already pending with this user',
  REQUEST_NOT_FOUND: 'Friend request not found',
  NOT_FRIENDS: 'You can only message users who are your friends',
};

// Firebase Specific Messages
export const FirebaseMessages = {
  EMAIL_ALREADY_IN_USE: 'Email already exists',
  INVALID_CREDENTIAL: 'Invalid email or password',
  USER_DISABLED: 'User account has been disabled',
  USER_NOT_FOUND: 'User not found',
  INVALID_EMAIL: 'Invalid email address',
  WEAK_PASSWORD: 'Password is too weak',
  OPERATION_NOT_ALLOWED: 'Operation not allowed',
  TOO_MANY_REQUESTS: 'Too many requests. Try again later',
  TOKEN_EXPIRED: 'Authentication token has expired',
  INVALID_TOKEN: 'Invalid authentication token',
};

// Status Codes
export const StatusCodes = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};

// Response Templates
export const createResponse = (status, message, data = null) => ({
  status,
  message,
  data,
  timestamp: new Date().toISOString(),
});

export const createErrorResponse = (status, message, error = null) => ({
  status,
  message,
  error,
  timestamp: new Date().toISOString(),
});

export const createSuccessResponse = (message, data = null) => ({
  status: StatusCodes.OK,
  message,
  data,
  timestamp: new Date().toISOString(),
});