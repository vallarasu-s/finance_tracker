// Authentication Service - Coordinates local user profiles & Java/MongoDB cloud user sync
export {
  DEFAULT_USER,
  DEFAULT_USER_ID,
  getActiveUserId,
  getCurrentUser,
  setCurrentUser,
  getSavedUsers,
  loginUser,
  registerUser,
  logoutUser,
} from './storage';

export {
  getUserInformation,
  saveUserInformation,
} from './api';
