const mongoose = require("mongoose");
const date = new Date().toLocaleString('en-NG', {day: '2-digit', month: 'short', year:'numeric'})
const createdOn = `${date}`



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
