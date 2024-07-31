const mongoose = require('mongoose')
const {DateTime} = require('luxon')

const otpSchema = new mongoose.Schema({

    otp: {
        type: String,
        required: true
    },

    createdAt: {
        type: Date,
        default: () => DateTime.now().toJSDate(),
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
