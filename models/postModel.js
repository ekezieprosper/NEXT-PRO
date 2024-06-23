const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
    text: {
        type: String,
         required: false,
        date:Date.now
        },

    post: [{
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

    owner:{
        type: mongoose.Schema.Types.ObjectId
    },

    date: {
        type: Date,
        default: Date.now
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
