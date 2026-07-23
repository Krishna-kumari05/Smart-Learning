const mongoose = require("mongoose");

const VideoSchema = new mongoose.Schema({
  videoId: String,
  title: String,
  channelTitle: String,
  thumbnail: String,
  url: String,
});

const YoutubeQuerySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    topic: { type: String, required: true },
    videos: [VideoSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.models.YoutubeQuery || mongoose.model("YoutubeQuery", YoutubeQuerySchema);
