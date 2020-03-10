import mongoose from 'mongoose';

const mongooseSchema = {
  dateCreated: { type: Date, default: Date.now },
  player1: {
    type: String,
  },
  player2: {
    type: String,
  },
  player3: {
    type: String,
  },
  player4: {
    type: String,
  },
  manager: String,
  group: String,
  round: Number,
};

export default mongoose.model('Cup', new mongoose.Schema(mongooseSchema));
