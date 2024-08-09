const multer = require('multer')

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './gallery') 
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname)
    }
})

const fileFilter = function (req, file, cb) {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/mp4')) {
        cb(null, true)
    } else {
        cb(new Error('Only image and video files are allowed'), false)
    }
}

const imageFileSize = 1024 * 1024 * 1024 
const videoFileSize = 1024 * 1024 * 1024 *1024

const maxCount = 30

const uploader = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: imageFileSize, 
        files: maxCount
    }
})

uploader.videoFileSize = videoFileSize

module.exports = uploader
