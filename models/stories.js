const mongoose = require("mongoose")
const time = new Date().toLocaleString('en-NG', { timeZone: 'Africa/Lagos', ...{ hour: '2-digit', minute: '2-digit', hourCycle: 'h23' } })
const [hour,minute] = time.split(':')
const status = hour >= 12 ? "PM" : "AM"
const createdOn = `${hour}:${minute}${status}`



const storySchema = new mongoose.Schema({
    text: {
        type: String,
        required: false,
    },

    story: [{
        type: String,
        required: false,
    }],
    
    likes: [{
        type: mongoose.Schema.Types.ObjectId
    }],

    comments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "comments"
    }],

    views: [{
        type: mongoose.Schema.Types.ObjectId,
    }],
    
    date: {
        type: Date,
        default: Date.now,
        expires: '24h'
    },

    time: {
        type: String,
        default: createdOn
    },

    owner: {
        type: mongoose.Schema.Types.ObjectId
    },

    player: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "player",
    },
    agent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "agent",
    },
})


const Story = mongoose.model("stories", storySchema)
module.exports = Story
