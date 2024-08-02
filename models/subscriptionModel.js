const mongoose = require('mongoose')
const {DateTime} = require('luxon')
const createdOn = DateTime.now().toLocaleString({month:"short",day:"2-digit", year:"numeric", hour:"2-digit",minute:"2-digit"})

const subscriptionSchema = new mongoose.Schema({
    plan: {
        type: String,
        enum: ['monthly', 'yearly'],
        required: true
    },
    amount: {
        type: Number
    },
    
    owner: {
        type: String
    },

    date: {
        type: Date,
        default: Date.now()
    },

    Date:{
        type: String,
       default: createdOn
   }, 

    expiresIn: {
        type: Date
    },

    subscribed: {
        type: Boolean,
        default: false
    },

    agent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'agent'
    },

    player: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'player'
    },
})

// Pre-validate hook to set expiration date and amount based on the plan
subscriptionSchema.pre('validate', function(next) {
    if (!this.expiresIn) {
        if (this.plan === 'monthly') {
            this.amount = 15
            this.expiresIn = new Date(this.date.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days
        } else if (this.plan === 'yearly') {
            this.amount = 180
            this.expiresIn = new Date(this.date.getTime() + 365 * 24 * 60 * 60 * 1000) // 1 year
        }
    }
    next()
})

// Check if the subscription is expired
subscriptionSchema.methods.isExpired = function() {
    return new Date() > this.expiresIn
}

// Check and update expired subscriptions
subscriptionSchema.statics.checkExpiredSubscriptions = async function() {
    try {
        const expiredSubscriptions = await this.find({
            expiresIn: { $lt: new Date() },
            subscribed: true
        })

        await Promise.all(expiredSubscriptions.map(async (subscription) => {
            subscription.subscribed = false
            await subscription.save()
        }))
    } catch (error) {
         error.message
    }
}


const Subscription = mongoose.model('Subscription', subscriptionSchema)
module.exports = Subscription