const mongoose = require("mongoose")
const countries = require("../enums/countries")
const countryCodes = require("../enums/countryCodes")
const date = new Date().toLocaleString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' })
const createdOn = `${date}`

const playerSchema = new mongoose.Schema({
    userName: { 
        type: String, 
        required: true,
         unique: true 
    },

    password: { 
        type: String, 
        required: true 
    },

    gender: {
        type: String,
        required: true,
        enum: ["male", "female"]
    },

    email: { 
        type: String,
        required: true 
    },

    country: {
        type: String,
        required: true,
        enum: countries,
        trim: true
    },

    profileImg: {
        type: String,
        default: "https://i.pinimg.com/564x/76/f3/f3/76f3f3007969fd3b6db21c744e1ef289.jpg"
    },

    name: {
        type: String,
        default: "" 
    },

    Bio: { 
        type: String,
         default: "" 
    },

    countryCode: {
        type: String,
        enum: countryCodes, 
        trim: true
    },

    phoneNumber: { 
        type: String,
        trim: true,
        default: ""
    },

    Birthday: {
         type: String,
          default: "" 
    },

    position: {
        type: String,
        required: true,
        enum: ['Striker', 'Midfielder', 'Defender', 'Goalkeeper']
    },

    subPosition: {
        type: String,
        required: true,
        validate: {
            validator: function (value) {
                const positionSubpositionMap = {
                    'Striker': ['ST', 'SS', 'RW', 'LW'],
                    'Midfielder': ['CAM', 'CDM', 'CM', 'RM', 'LM'],
                    'Defender': ['CB', 'LB', 'RB', 'LWB', 'RWB'],
                    'Goalkeeper': ['GK']
                }
                return positionSubpositionMap[this.position].includes(value)
            },
        }
    },

    relationship_status: {
        type: String,
        enum: ["single", "married", "In a relationship"],
        default: "single"
    },

    isVerified: { 
        type: Boolean,
         default: false 
    },

    followers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'agent'
    }],

    following: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'agent'
    }],

    post: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "post"
    }],

    notifications: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'notification'
    }],

    emailCount: { 
        type: Number, default: 0 
    },

    createdOn: {
        type: String,
        default: createdOn
    }
})

const playerModel = mongoose.model("player", playerSchema)

module.exports = playerModel