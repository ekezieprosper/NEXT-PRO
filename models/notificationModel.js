const mongoose = require('mongoose')

const notificationSchema = new mongoose.Schema({
  type: { type: String, required: true },
  data: { type: mongoose.Schema.Types.Mixed },
  time: { type: Date, default: Date.now },
  player: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'player'
  }],
  agent: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'agent'
  }]
})

const Notification = mongoose.model('Notification', notificationSchema)

module.exports = Notification
