const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema({

    chatId:{type: String},

    sender:{type: mongoose.Schema.Types.ObjectId, required: false},

    text:{type: String},

    voice: {type: String},

    media: [{type: String}],

    reactions: [],

    time: {type: Date, default: Date.now}
})


const messageModel = mongoose.model('chatMessages', messageSchema)
module.exports = messageModel
