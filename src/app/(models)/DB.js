import mongoose, { Schema } from "mongoose";

mongoose.connect(process.env.MONGODB_URI);
mongoose.Promise = global.Promise;

const gamesSchema = new Schema({
  AppID: String,
  Name: String,
  Releasedate: String,
  Price: String,
  Aboutthegame: { type: String, text: true },
  Windows: String,
  Mac: String,
  Linux: String,
  Userscore: String,
  Positive: String,
  Negative: String,
  Developers: String,
  Publishers: String,
  Categories: String,
  Genres: String,
  Tags: String,
});

const gamesDescriptionsSchema = new Schema({
  Name: String,
  Description: { type: String, text: true },
  Tags: String,
});

const allgames =
  mongoose.models.allgames || mongoose.model("allgames", gamesSchema);

const gamesDescriptions =
  mongoose.models.descriptions ||
  mongoose.model("descriptions", gamesDescriptionsSchema);

export { allgames, gamesDescriptions };
