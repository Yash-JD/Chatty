// Authentication Messages
export const AuthMessages = {
  ALL_FIELDS_REQUIRED: 'All fields are required',
  PASSWORD_MIN_LENGTH: 'Password must be at least 6 characters',
  EMAIL_EXISTS: 'Email already exists',
  INVALID_CREDENTIALS: 'Invalid email or password',
  ACCOUNT_CREATED_SUCCESS: 'Account created successfully!',
  LOGIN_SUCCESS: 'Logged in successfully!',
  LOGOUT_SUCCESS: 'Logged out successfully!',
  PROFILE_UPDATE_SUCCESS: 'Profile updated successfully!',
  FAILED_CREATE_ACCOUNT: 'Failed to create account',
  FAILED_LOGIN: 'Failed to login',
  FAILED_LOGOUT: 'Failed to logout',
  FAILED_UPDATE_PROFILE: 'Failed to update profile',
  USER_NOT_AUTHENTICATED: 'User not authenticated',
  EMAIL_ALREADY_IN_USE: 'Email already exists',
};

// Form Validation Messages
export const ValidationMessages = {
  EMAIL_REQUIRED: 'Email is required',
  EMAIL_INVALID: 'Please enter a valid email',
  PASSWORD_REQUIRED: 'Password is required',
  PASSWORD_MIN_LENGTH: 'Password must be at least 6 characters',
  FULL_NAME_REQUIRED: 'Full name is required',
  FULL_NAME_MIN_LENGTH: 'Full name must be at least 2 characters',
  PASSWORD_MATCH_REQUIRED: 'Passwords must match',
  MESSAGE_REQUIRED: 'Message cannot be empty',
  MESSAGE_TOO_LONG: 'Message is too long',
  IMAGE_UPLOAD_FAILED: 'Failed to upload image',
  INVALID_FILE_TYPE: 'Invalid file type',
  FILE_TOO_LARGE: 'File is too large',
};

// Toast Messages
export const ToastMessages = {
  SUCCESS: 'Success!',
  ERROR: 'Error!',
  WARNING: 'Warning!',
  INFO: 'Info!',
  LOADING: 'Loading...',
  NETWORK_ERROR: 'Network error. Please try again.',
  UNEXPECTED_ERROR: 'An unexpected error occurred.',
  COPIED_TO_CLIPBOARD: 'Copied to clipboard!',
  SAVED_SUCCESSFULLY: 'Saved successfully!',
  DELETED_SUCCESSFULLY: 'Deleted successfully!',
  UPDATED_SUCCESSFULLY: 'Updated successfully!',
};

// Chat Messages
export const ChatMessages = {
  MESSAGE_SENT: 'Message sent',
  MESSAGE_SENDING: 'Sending message...',
  MESSAGE_SEND_FAILED: 'Failed to send message',
  TYPING_INDICATOR: 'Typing...',
  ONLINE_NOW: 'Online now',
  OFFLINE: 'Offline',
  NO_MESSAGES: 'No messages yet. Start a conversation!',
  NO_CHATS_SELECTED: 'Select a chat to start messaging',
  SEARCH_USERS: 'Search users...',
  NO_USERS_FOUND: 'No users found',
  LOAD_MORE_MESSAGES: 'Load more messages',
  NEW_MESSAGE: 'New message',
};

// UI Messages
export const UIMessages = {
  WELCOME_BACK: 'Welcome Back',
  CREATE_ACCOUNT: 'Create Account',
  SIGN_IN: 'Sign In',
  SIGN_UP: 'Sign Up',
  LOGOUT: 'Logout',
  PROFILE: 'Profile',
  SETTINGS: 'Settings',
  HOME: 'Home',
  CHAT: 'Chat',
  SEARCH: 'Search',
  SEND: 'Send',
  TYPE_MESSAGE: 'Type a message...',
  UPLOAD_IMAGE: 'Upload Image',
  CHANGE_PROFILE_PIC: 'Change Profile Picture',
  SAVE_CHANGES: 'Save Changes',
  CANCEL: 'Cancel',
  CONFIRM: 'Confirm',
  DELETE: 'Delete',
  EDIT: 'Edit',
  LOADING: 'Loading...',
  ERROR: 'Error',
  SUCCESS: 'Success',
};

// Error Messages
export const ErrorMessages = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  SERVER_ERROR: 'Server error. Please try again later.',
  AUTHENTICATION_ERROR: 'Authentication error. Please login again.',
  PERMISSION_DENIED: 'Permission denied. You don\'t have access.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  TIMEOUT_ERROR: 'Request timeout. Please try again.',
  UNKNOWN_ERROR: 'An unknown error occurred.',
};

// Success Messages
export const SuccessMessages = {
  PROFILE_UPDATED: 'Profile updated successfully!',
  IMAGE_UPLOADED: 'Image uploaded successfully!',
  MESSAGE_SENT: 'Message sent successfully!',
  SETTINGS_SAVED: 'Settings saved successfully!',
  ACCOUNT_CREATED: 'Account created successfully!',
  LOGIN_SUCCESS: 'Login successful!',
  LOGOUT_SUCCESS: 'Logout successful!',
  DELETED_SUCCESSFULLY: 'Deleted successfully!',
  UPDATED_SUCCESSFULLY: 'Updated successfully!',
};

// Firebase Error Messages
export const FirebaseErrorMessages = {
  'auth/email-already-in-use': AuthMessages.EMAIL_ALREADY_IN_USE,
  'auth/invalid-credential': AuthMessages.INVALID_CREDENTIALS,
  'auth/user-disabled': 'Your account has been disabled',
  'auth/user-not-found': 'User not found',
  'auth/invalid-email': 'Invalid email address',
  'auth/weak-password': 'Password is too weak',
  'auth/too-many-requests': 'Too many requests. Try again later',
  'auth/network-request-failed': ErrorMessages.NETWORK_ERROR,
  'auth/requires-recent-login': 'Please login again to continue',
  'auth/invalid-password': 'Invalid password',
  'auth/account-exists-with-different-credential': 'Account exists with different sign-in method',
  'auth/credential-already-in-use': 'Credential already in use',
  'auth/operation-not-allowed': 'Operation not allowed',
  'auth/expired-action-code': 'Action code has expired',
  'auth/invalid-action-code': 'Invalid action code',
  'auth/missing-email': 'Email is required',
  'auth/missing-password': 'Password is required',
};

// Helper function to get Firebase error message
export const getFirebaseErrorMessage = (errorCode) => {
  return FirebaseErrorMessages[errorCode] || ErrorMessages.UNKNOWN_ERROR;
};

// Helper function to show toast with proper message
export const showToastMessage = (toast, type, message, options = {}) => {
  const toastConfig = {
    duration: 4000,
    position: 'top-right',
    ...options,
  };

  switch (type) {
    case 'success':
      return toast.success(message, toastConfig);
    case 'error':
      return toast.error(message, toastConfig);
    case 'warning':
      return toast.error(message, { ...toastConfig, icon: '⚠️' });
    case 'info':
      return toast(message, toastConfig);
    default:
      return toast(message, toastConfig);
  }
};
