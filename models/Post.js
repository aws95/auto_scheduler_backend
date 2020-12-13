const mongoose = require("mongoose");

const PostSchema = mongoose.Schema({
  description: {
    type: String,
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  img: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("Posts", PostSchema);
