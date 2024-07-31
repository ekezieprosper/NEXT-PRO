const mongoose = require("mongoose")
const {DateTime} = require('luxon')
const createdOn = DateTime.now().toLocaleString({month:"short",day:"2-digit", year:"numeric"})

const agentSchema = new mongoose.Schema({
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
     
    relationship_status: {
        type: String,
        enum: ["single", "married", "In a relationship"]
    },

    isVerified: { type: Boolean, default: false },

    followers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'player'
    }],

    following: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'player'
    }],

    post: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "post"
    }],

    subscribed: {
        type: Boolean,
        default: false
    },

    tokens: {type: String},
      
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

const agentModel = mongoose.model("agent", agentSchema)


module.exports = agentModel