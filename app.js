const { google } = require("googleapis");
const express = require("express");
const fs = require("fs");
const app = express();
const Multer = require("multer");
const cors = require("cors");
require("dotenv").config();
;

app.use(cors());

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
      body: fs.createReadStream(file.path),
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

const deleteFile = (filePath) => {
  fs.unlink(filePath, () => {
    console.log("file deleted");
  });
};


// // https://drive.google.com/uc?id=1vHfiuJTa7sfQrOAAc2sR5msZYfOMYB5o

const port = process.env.PORT || 3000;

// Set up the storage for the uploaded files
const multer = Multer({
  storage: Multer.diskStorage({
    destination: function (req, file, callback) {
      callback(null, `${__dirname}/audio-files`);
    },
    filename: function (req, file, callback) {
      callback(
        null,
        file.fieldname + "_" + Date.now() + "_" + file.originalname
      );
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
  deleteFile(req.file.path);
  res.status(200).json({ response });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
