const notificationModel = require("../models/notificationModel")
const playerModel = require("../models/playerModel")
const agentModel = require("../models/agentModel")


exports.getAllNotifications = async (req, res) => {
    try {
        const id = req.user.userId

        const user = await playerModel.findById(id).populate('notifications') || await agentModel.findById(id).populate('notifications')
        if (!user) {
            return res.status(404).json({
                 message: "User not found." 
            })
        }

        const notifications = user.notifications.map(notification => ({
            id: notification._id,
            notification: notification.notification,
            date: notification.Date
        }))

        // Check if there are any notifications
        if (notifications.length === 0) {
            return res.status(404).json({
             message: "No notifications yet." 
            })
        }

        // Return the notifications
        res.status(200).json(notifications)
    } catch (error) {
        res.status(500).json({
             message: 'Internal server error' 
        })
    }
}


exports.getNotificationById = async (req, res) => {
    try {
        const id = req.user.userId
        const { notificationId } = req.params

        // Check if the user exists in either agentModel or playerModel
        const user = await agentModel.findById(id) || await playerModel.findById(id)
        if (!user) {
            return res.status(404).json({
                message: "User not found."
            })
        }

        // Check if the notification exists and is in the user's notifications field
        const notification = await notificationModel.findOne({ _id: notificationId, recipient: id })
        if (!notification) {
            return res.status(404).json({
                message: "Only owner can access this notification"
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
            message: 'Internal server error'
        })
    }
}


exports.deleteNotification = async (req, res) => {
    try {
        const id = req.user.userId
        const { notificationId } = req.params

        const user = await playerModel.findById(id) || await agentModel.findById(id)
        if (!user) {
            return res.status(404).json({
                 error: "User not found" 
                })
        }

        // Check if the notification exists and is in the user's notifications field
        const notification = await notificationModel.findOne({ _id: notificationId, recipient: id })

        if (!notification) {
            return res.status(404).json({
           message: "Unauthorized"
          })
        } 

        const deleteNotification = await notificationModel.findByIdAndDelete(notificationId)

        if (!deleteNotification) {
            return res.status(404).json({
                 error: "Notification not found" 
                })
        }

        // Remove the notification ID from the user notifications array
        const indexNotification = user.notifications.indexOf(notificationId)

        if (indexNotification !== -1) {
            user.notifications.splice(indexNotification, 1)
            await user.save()
        }

        return res.status(200).json({
             message: "Deleted"
             })

    } catch (error) {
        return res.status(500).json({
             message: 'Internal server error' 
            })
    }
}