const router = require("express").Router()

const { signupAgent, logIn, verify, logOut, deleteProfileImg, getAllFollowers, getOneFollower, createProfileImg,changePassword, 
updateUserName, getUsers, deleteAccount, updateUserProfile, resendOTP, follow, unfollow,resetPassword, updateEmail, forgotPassword,
signupPlayer, home, getAllFollowing, getOneFollowing} = require("../controllers/userController")

const {signUp, updateValidation, forgotValidation,changePasswordValidation, resetPasswordValidation} = require("../validation/validation")
const upload = require("../media/multer")
const authenticate = require("../auth/authenticate")

router.get("/home", home)
router.post('/signup/player',signUp, signupPlayer)
router.post('/signup/agent',signUp, signupAgent)
router.post('/resend_otp/:id', resendOTP)
router.post('/verify/:id', verify)
router.post("/logIn", logIn)
router.post("/logout", authenticate, logOut)
router.post('/forgot_password/:id',forgotValidation, forgotPassword)
router.post('/reset_password/:id',resetPasswordValidation, resetPassword)
router.put('/change_password', authenticate, changePasswordValidation, changePassword)
router.put('/update/username', authenticate, updateUserName)
router.put('/update/email', authenticate, updateEmail)
router.put('/profile', authenticate, updateValidation, updateUserProfile)
router.post('/profileImg', authenticate, upload.single('profileImg'), createProfileImg)
router.delete('/delete/profileImg', authenticate, deleteProfileImg)
router.post('/follow', authenticate, follow)
router.post('/unfollow', authenticate, unfollow)
router.get('/followers', authenticate, getAllFollowers)
router.post('/follower', authenticate, getOneFollower)
router.get('/following/', authenticate, getAllFollowing)
router.post('/following', authenticate, getOneFollowing)
router.get('/users', authenticate, getUsers)
router.delete('/delete_account', authenticate, deleteAccount)


module.exports = router