const router = require("express").Router()

const authenticate = require("../auth/authenticate");
const { getAllNotifications, getNotificationById, deleteNotification } = require("../controllers/notificationController");


router.get('/notifications', authenticate, getAllNotifications)
router.get('/notifications/:notificationId', authenticate, getNotificationById)
router.delete('/notification/:notificationId', authenticate, deleteNotification)

module.exports = router