import express from 'express';
import { protectRoute } from '../middleware/auth.middleware.js';
import {
  sendFriendRequest,
  getPendingRequests,
  getSentRequests,
  respondToFriendRequest,
  removeFriend,
  getFriends,
} from '../controllers/friend.controller.js';

const router = express.Router();

router.post('/request', protectRoute, sendFriendRequest);
router.get('/pending', protectRoute, getPendingRequests);
router.get('/sent', protectRoute, getSentRequests);
router.put('/respond/:requestId', protectRoute, respondToFriendRequest);
router.get('/', protectRoute, getFriends);
router.delete('/:friendId', protectRoute, removeFriend);

export default router;
