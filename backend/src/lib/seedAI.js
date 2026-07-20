import User from '../models/user.model.js';

export const checkAndInitializeAIUser = async () => {
  try {
    let aiUser = await User.findOne({ email: 'ai@chatty.com' });
    if (!aiUser) {
      aiUser = new User({
        firebaseUid: 'chatty-ai-uid-special-key',
        email: 'ai@chatty.com',
        fullName: 'Chatty AI',
        profilePic: 'https://cdn-icons-png.flaticon.com/512/4712/4712035.png',
        isPremium: true,
      });
      await aiUser.save();
      console.log('Chatty AI user initialized in database.');
    }
  } catch (err) {
    console.error('Error seeding/checking Chatty AI user:', err);
  }
};
