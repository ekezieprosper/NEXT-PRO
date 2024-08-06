const mongoose = require("mongoose")
const date = new Date().toLocaleString('en-NG', {day: '2-digit', month: 'short', year:'numeric'})
const createdOn = `${date}`


const playerSchema = new mongoose.Schema({
    userName: {type: String, required: true, unique: true},

    password: { type: String, required: true },

    gender: {
        type: String,
        required: true,
        enum: ["male", "female"]
    },

    email: { type: String, required: true},

    profileImg:{
        type: String,
        default: "https://t3.ftcdn.net/jpg/05/53/79/60/360_F_553796090_XHrE6R9jwmBJUMo9HKl41hyHJ5gqt9oz.jpg"
    },

    name: { type: String, default: ""},

    Bio: {type: String, default: ""},

    phoneNumber: { type: String, default: ""},

    Birthday: { type: String, default: "" },

    locatedAt: { type: String, default: "" },

    position: {
        goalKeeper:{
         type: String,
         enum: ["goalKeeper"]
        },
        defender:{
         type: String,
         enum: ["LB", "RB", "CLB", "CB", "CRB"]
        },
        midfielder:{
         type: String,
         enum: ["CAM", "LM", "CM", "RM", "CDM"]
        },
        attacker:{
            type: String,
            enum: ["LW", , "RF", "LF", "RW"]
           }, 
        striker:{
            type: String,
            enum: ["CF", "ST", "SS"]
           }, 
     },
     
    relationship_status: {
        type: String,
        enum: ["single", "married", "In a relationship"],
         default: "single"
    },

    isVerified: { type: Boolean, default: false },

    followers: [{
        type: mongoose.Schema.Types.ObjectId,
        default: 0,
        ref: 'agent'
    }],

    following: [{
        type: mongoose.Schema.Types.ObjectId,
          default: 0,
        ref: 'agent'
    }],

    post: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "post"
    }],

    subscribed: {
        type: Boolean,
        default: false
    },
 
    subscription: { 
        type: mongoose.Schema.Types.ObjectId,
         ref: 'subscription'
        },

        notifications:[{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'notification'
        }],

       Date: {
        type: String,
        default: createdOn
       }
})

const playerModel = mongoose.model("player", playerSchema)

module.exports = playerModel