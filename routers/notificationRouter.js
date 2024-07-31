const router = require("express").Router()

const authenticate = require("../auth/authenticate");
const { getAllNotifications, getNotificationById } = require("../controllers/notificationController");


router.get('/notifications', authenticate, getAllNotifications)
router.get('/notifications/:notificationId', authenticate, getNotificationById)

module.exports = router