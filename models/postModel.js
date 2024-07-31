const mongoose = require("mongoose");
const {DateTime} = require('luxon')
const createdOn = DateTime.now().toLocaleString({month:"short",day:"2-digit"})


const postSchema = new mongoose.Schema({
    description: {
        type: String,
         required: false
        },

    post: [{
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

    owner:{
        type: mongoose.Schema.Types.ObjectId
    },

    Date: {
        type: String,
        default: createdOn
    },

    player: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "player",
    },

    agent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "agent",
    },
});


const postModel = mongoose.model("post", postSchema);

module.exports = postModel
