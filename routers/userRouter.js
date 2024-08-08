const router = require("express").Router()

const { signupAgent, logIn, verify, logOut, deleteProfileImg, getAllFollowers, getOneFollower, createProfileImg,changePassword, 
updateUserName, getUsers, deleteAccount, updateUserProfile, resendOTP, follow, unfollow,resetPassword, updateEmail, forgotPassword,
signupPlayer, home, subscription, getSubscription, getAllFollowing, getOneFollowing} = require("../controllers/userController")

const {signUp, updateValidation, forgotValidation,changePasswordValidation, resetPasswordValidation} = require("../validation/validation")
const upload = require("../media/multer")
const authenticate = require("../auth/authenticate")

router.get("/home", home)
router.post('/register_agent',signUp, signupAgent)
router.post('/register_player',signUp, signupPlayer)
router.post("/logIn", logIn)
router.post('/verify/:id', verify)
router.post('/resend_otp/:id', resendOTP)
router.put('/profile', authenticate, updateValidation, updateUserProfile)
router.post('/profileImg', authenticate, upload.single('profileImg'), createProfileImg)
router.delete('/delete/profileImg', authenticate, deleteProfileImg)
router.post("/logout", authenticate, logOut)
router.post('/follow', authenticate, follow)
router.get('/followers', authenticate, getAllFollowers)
router.get('/follower', authenticate, getOneFollower)
router.get('/following', authenticate, getAllFollowing)
router.get('/followings/', authenticate, getOneFollowing)
router.post('/unfollow', authenticate, unfollow)
router.put('/update/username', authenticate, updateUserName)
router.put('/update/email', authenticate, updateEmail)
router.get('/users', authenticate, getUsers)
router.post('/forgot_password/:id',forgotValidation, forgotPassword)
router.post('/reset_password/:id',resetPasswordValidation, resetPassword)
router.put('/change_password', authenticate, changePasswordValidation, changePassword)
router.post("/subscribe", authenticate, subscription)
router.get("/subscription", authenticate, getSubscription)
router.delete('/delete_account', authenticate, deleteAccount)


module.exports = router