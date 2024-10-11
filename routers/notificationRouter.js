const router = require("express").Router()

const {
    getNotificationById, 
    deleteNotification, 
    getAllNotifications } = require("../controllers/notificationController")
const authenticate = require("../auth/authenticate")


router.get('/notifications', authenticate, getAllNotifications)
router.get('/notifications/:notificationId', authenticate, getNotificationById)
router.delete('/notification/:notificationId', authenticate, deleteNotification)

module.exports = router