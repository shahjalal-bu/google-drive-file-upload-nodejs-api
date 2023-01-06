const { google } = require("googleapis");
const express = require("express");
const app = express();
const Multer = require("multer");
const cors = require("cors");
const { Readable } = require("stream");
require("dotenv").config();
app.use(cors());
const bufferToStream = (buffer) => {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
};
async function uploadFile(file) {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: "./googledriveapi.json",
      scopes: ["https://www.googleapis.com/auth/drive"],
    });
    const driveService = google.drive({
      version: "v3",
      auth,
    });
    const fileMetaData = {
      name: file.fieldname + "_" + Date.now() + "_" + file.originalname,
      parents: [process.env.GOOGLE_API_FOLDER_ID],
    };
    const media = {
      mimeType: file.mimetype,
      // body: fs.createReadStream(file.path),
      body:bufferToStream(file.buffer)
    };
    const res = await driveService.files.create({
      resource: fileMetaData,
      media: media,
      field: "id",
    });
    return res.data.id;
  } catch (error) {
    console.log(error);
  }
}

// // https://drive.google.com/uc?id=1vHfiuJTa7sfQrOAAc2sR5msZYfOMYB5o

const port = process.env.PORT || 3000;

// Set up the storage for the uploaded files
const multer = Multer({
  storage: Multer.memoryStorage({
    destination: function (req, file, callback) {
      callback(null, "");
    },
  }),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

// Set up the file upload route
app.post("/upload", multer.single("file"), async (req, res) => {
  // Get the file from the request
  const file = req.file;
  console.log(file);
  const response = await uploadFile(file);
  res.status(200).json({ response });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
