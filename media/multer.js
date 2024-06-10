const multer = require("multer")

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "./gallery")
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname)
    }
})

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image/") || file.mimetype.startsWith('audio/')) {
        cb(null, true)
    } else {
        cb(new Error("Filetype not supported. Only images or audio files are allowed."), false)
    }
}

const image_file_size = 1024 * 1024 * 10 
const audio_file_size = 20 * 1024 * 1024 

const maxcount = 1

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: image_file_size, 
        files: maxcount 
    }
})

upload.audioFileSize = audio_file_size

module.exports = upload
