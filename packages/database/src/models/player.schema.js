import mongoose from 'mongoose';

const statsSchema = {
  apps: Number,
  asts: Number,
  con: Number,
  cs: Number,
  gls: Number,
  pensv: Number,
  points: Number,
  rcard: Number,
  sb: Number,
  subs: Number,
  tb: Number,
  ycard: Number,
};

const fixtureSchema = {
  aScore: Number, // 2
  aTname: String, // Tottenham Hotspur
  date: String, // 2017-08-13 13:30:00
  event: Number, // 3
  hScore: Number, // 0
  hTname: String, // Newcastle United
  status: String, // PLAYED
  stats: [Number],
};

const gameWeeksSchema = {
  fixtures: {
    type: Array,
    schema: new mongoose.Schema(fixtureSchema),
    default: { stats: [] },
  },
  stats: statsSchema,
};

const mongooseSchema = {
  dateCreated: { type: Date, default: Date.now },
  name: {
    type: String,
    index: { unique: true },
  },
  code: Number,
  pos: String,
  club: String,
  skySportsPosition: String,
  isHidden: {
    type: Boolean,
    default: false,
  },
  new: {
    type: Boolean,
    default: false,
  },
  value: Number,
  fixtures: {
    type: Array,
    schema: new mongoose.Schema(fixtureSchema),
    default: { stats: [] },
  },
  gameWeeks: {
    type: Array,
    schema: new mongoose.Schema(gameWeeksSchema),
    default: { fixtures: [] },
  },
  gameWeek: statsSchema,
  season: statsSchema,
};

export default mongoose.model('Player', new mongoose.Schema(mongooseSchema));
