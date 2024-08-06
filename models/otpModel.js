const mongoose = require('mongoose')



const otpSchema = new mongoose.Schema({
    otp: {
        type: String,
        required: true
    },

    createdAt: {
        type: Date, 
        default: Date.now,
        expires: '5m'
    },

    playerId: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'player', 
        required: true
    }],

    agentId: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'agent', 
        required: true
    }]
})

const OTPModel = mongoose.model('OTP', otpSchema)

module.exports = OTPModel
