const express = require("express");
const app = express();
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const GridFsStorage = require("multer-gridfs-storage");
const Grid = require("gridfs-stream");
const methodOverride = require("method-override");
const path = require("path");
const crypto = require("crypto");
const Post = require("./models/Post");
const schedule = require("node-schedule");
const axios = require("axios");

//middleweare to parse all the data going to database + always before routes
app.use(cors());
app.use(bodyParser.json({ extended: false }));

//import routes

const postRoutes = require("./routes/posts");

app.use("/posts", postRoutes);

dotenv.config();

//connect to database

const promise = mongoose.connect(
  process.env.DB_CONNECT,
  { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true },
  () => console.log("connected to database")
);
const conn = mongoose.connection;

// Init gfs
let gfs;
conn.once("open", () => {
  // Init stream
  gfs = new Grid(conn.db, mongoose.mongo);
  gfs.collection("uploads");
  console.log("connection made successfully");
});

// Create storage engine
const storage = new GridFsStorage({
  db: promise,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }
        const filename = buf.toString("hex") + path.extname(file.originalname);
        const fileInfo = {
          filename: filename,
          bucketName: "uploads",
        };
        resolve(fileInfo);
      });
    });
  },
});
const upload = multer({ storage });
// @route POST /upload
// @desc  Uploads file to DB
app.post("/upload", upload.single("file"), async (req, res) => {
  //res.json({ file: req.file.filename});
  const post = new Post({
    description: req.body.description,
    date: req.body.date,
    img: req.file.filename,
  });
  const token = req.body.token;
  try {
    let savedPost = await post;
    savedPost.save();
    res.json(savedPost);
  } catch (err) {
    res.json({ message: err });
  }
  const message =
    req.body.description || "there is no description to this post";
  schedule.scheduleJob("39 * * * *", () => {
    console.log(message);
    axios
      .post("https://graph.facebook.com/103791674899163/feed?", {
        message: message,
        access_token: token,
      })
      .then(
        (res) => {
          const result = res.data;
          console.log(result);
          alert("Success!");
        },
        (error) => {
          console.log(error);
        }
      );
  });
});

//@route GET /files
// @desc  Display all files in JSON
app.get("/files", (req, res) => {
  gfs.files.find().toArray((err, files) => {
    // Check if files
    if (!files || files.length === 0) {
      return res.status(404).json({
        err: "No files exist",
      });
    }

    // Files exist
    return res.json(files);
  });
});

// @route GET /image/:filename
// @desc Display Image
app.get("/image/:filename", (req, res) => {
  gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
    // Check if file
    if (!file || file.length === 0) {
      return res.status(404).json({
        err: "No file exists",
      });
    }

    // Check if image
    if (file.contentType === "image/jpeg" || file.contentType === "image/png") {
      // Read output to browser
      const readstream = gfs.createReadStream(file.filename);
      readstream.pipe(res);
    } else {
      res.status(404).json({
        err: "Not an image",
      });
    }
  });
});

//@route GET /
//@desc Main app route
app.get("/", (req, res) => {
  res.send("we are on !");
});

//start listening to the server
const port = 5000;
app.listen(port, () => console.log(`Server started on port ${port}`));
