const mongoose = require('mongoose')

const notificationSchema = new mongoose.Schema({

  type: { type: String, required: true },
  data: { type: mongoose.Schema.Types.Mixed },
  time: { type: Date, default: Date.now }

})

const Notification = mongoose.model('notification', notificationSchema)

module.exports = Notification
