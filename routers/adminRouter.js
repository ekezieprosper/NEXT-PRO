const router = require("express").Router()
const { signUp, getAllUsers, deleteUser, ProfileImgage, suspendUser, unSuspendUser, getAllSuspendedUsers } = require("../controllers/adminController")
const adminAuth = require("../auth/adminAuth")
const upload = require("../media/multer")



router.post("/admin/signUp", signUp)
router.post("/image",adminAuth, upload.single('profileImg'), ProfileImgage, )
router.get("/allUsers",adminAuth, getAllUsers)
router.post("/suspend/user/:id",adminAuth, suspendUser)
router.get("/suspend/users",adminAuth, getAllSuspendedUsers)
router.post("/unSuspend/user/:id",adminAuth, unSuspendUser)
router.delete("/deleteUser/:id",adminAuth, deleteUser)

module.exports = router