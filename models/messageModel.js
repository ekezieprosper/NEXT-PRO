const mongoose = require('mongoose')
const time = new Date().toLocaleString('en-NG', { 
    timeZone: 'Africa/Lagos', 
    hour: '2-digit', 
    minute: '2-digit', 
    hourCycle: 'h12' 
  })
  
  const [hour, minute, period] = time.split(/[:\s]/)
  const createdOn = `${hour}:${minute} ${period}`


const messageSchema = new mongoose.Schema({

    chatId:{
      type: String
    },

    sender:{
      type: mongoose.Schema.Types.ObjectId,
       required: false
    },

    text:{
      type: String
    },

    voice:{
      type: String
    },

    media:[{
      type: String
    }],

    reactions: [],

    time: {
       type: String,
       default: createdOn
    }
})


const messageModel = mongoose.model('chatMessages', messageSchema)
module.exports = messageModel