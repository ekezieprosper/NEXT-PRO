const mongoose = require('mongoose')
const {DateTime} = require('luxon')
const createdOn = DateTime.now().toLocaleString({weekday:"short", hour:"2-digit",minute:"2-digit"})



const messageSchema = new mongoose.Schema({

    chatId:{type: String},

    sender:{type: mongoose.Schema.Types.ObjectId, required: false},

    text:{type: String},

    voice: {type: String},

    media: [{type: String}],

    reactions: [],

    time: {
       type: String,
       default: createdOn
    }
})


const messageModel = mongoose.model('chatMessages', messageSchema)
module.exports = messageModel