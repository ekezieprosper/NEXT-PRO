const mongoose = require("mongoose")
const {DateTime} = require('luxon')
const createdOn = DateTime.now().toLocaleString({hour:"2-digit",minute:"2-digit"})


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
        default: () => DateTime.now().toJSDate(),
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
