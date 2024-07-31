const notificationModel = require("../models/notificationModel")
const playerModel =  require("../models/playerModel")
const agentModel =  require("../models/agentModel")



exports.getAllNotifications = async (req, res) => {
    try {
        const id = req.user.userId;

        const user = await agentModel.findById(id).populate('notifications') || await playerModel.findById(id).populate('notifications');

        if (!user) {
            return res.status(404).json({
                message: "User not found."
            });
        }

        const notifications = user.notifications.map(notification => ({
            id: notification._id,
            notification: notification.notification, 
            date: notification.Date 
        }));

        res.status(200).json(notifications);
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
}


exports.getNotificationById = async (req, res) => {
    try {
        const id = req.user.userId
        const {notificationId} = req.params

        const user = await agentModel.findById(id) || await playerModel.findById(id)

        if (!user) {
            return res.status(404).json({
                message: "User not found."
            })
        }

        // Check if the notification exists and belongs to the user
        const notification = await notificationModel.findOne({ _id: notificationId, recipient: id })

        if (!notification) {
            return res.status(404).json({
                message: "Notification not found"
            })
        }

        // Return the single notification
        res.status(200).json({
            id: notification._id,
            notification: notification.notification,
            date: notification.Date
        })
    } catch (error) {
        res.status(500).json({
            message: error.message
        })
    }
}