const mongoose = require("mongoose")

const commentSchema = new mongoose.Schema({

   comment: { type: String, required: false},

    owner: {
        type: mongoose.Schema.Types.ObjectId
    },
    
    post: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: "post"
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

const commentModel = mongoose.model("comments", commentSchema)
module.exports = commentModel