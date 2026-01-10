import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    firebaseUid: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: false,
      minLength: 6,
    },
    profilePic: {
      type: String,
      default: '',
    },
  },
  { timestamps: true },
);

const User = mongoose.model('User', userSchema);
export default User;
