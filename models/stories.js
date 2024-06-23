const mongoose = require("mongoose")

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
        type: String,
        default: 0
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
        expires: (24 * 60 * 60 * 1000)
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
