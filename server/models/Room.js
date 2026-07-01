import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      // Name is optional because private chats don't have a room name (they use the other participant's name)
    },
    isGroup: {
      type: Boolean,
      default: false,
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, 'Description cannot exceed 200 characters'],
    },
    avatar: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Optimize queries searching rooms by participant list
roomSchema.index({ participants: 1 });

const Room = mongoose.model('Room', roomSchema);
export default Room;
