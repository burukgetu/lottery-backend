import multer from "multer";
import path from "path";
import fs from "fs";

// Ensure images directory exists
const uploadDir = path.resolve("images");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images/"); // Save images to /images/
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname)); // Unique file name
  },
});

const upload = multer({ storage });

export default upload;