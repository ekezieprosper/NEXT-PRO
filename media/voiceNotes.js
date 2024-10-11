const multer = require("multer")
const path = require('path')


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./gallery")
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
})

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("audio/")) {
    cb(null, true)
  } else {
    cb(new Error("Filetype not supported. Only audio files are allowed."), false)
  }
}

const audio_file_size = 1024 * 1024 * 10
const maxcount = 1

const voiceNote = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: audio_file_size,
    files: maxcount
  }
})

module.exports = voiceNote