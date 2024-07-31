const mongoose = require('mongoose')
const {DateTime} = require('luxon')
const createdOn = DateTime.now().toLocaleString({month:"short",day:"2-digit", year:"numeric"})


const notificationSchema = new mongoose.Schema({
  player: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'player'
  },

  agent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'agent'
  },

  notification:{
    type:String,
},

  recipient: {
  type: mongoose.Schema.Types.ObjectId,
  required: true,
  refPath: 'recipientModel'
},
  recipientModel: {
  type: String,
  required: true,
  enum: ['agent', 'player']
},


  Date:{
    type:String,
    default:createdOn
 },
})


const Notification = mongoose.model('notification', notificationSchema)

module.exports = Notification
