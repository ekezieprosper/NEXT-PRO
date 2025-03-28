const mongoose = require ("mongoose")
const date = new Date().toLocaleString('en-NG', {day: '2-digit', month: 'short', year:'numeric'})
const createdOn = `${date}`


const adminSchema = new mongoose.Schema({
    userName: {
        type: String,
        required: true,
        unique: true
    },

    gender: {
        type: String,
        required: true,
        emum: ["male", "female"]
    },

    profileImg:{
        type: String,
        default: "https://i.pinimg.com/564x/4b/f4/22/4bf422a3d7b47265fee47d74fd3ed55d.jpg"
    },

    password: {
        type: String, required: true
    },

    admin: { 
        type: Boolean,
        default: true
    },

    createdAt: {
        type: String, 
        default: createdOn
    },

    suspended: [{
        type: mongoose.Schema.Types.ObjectId
    }]

})

const adminModel = mongoose.model("admin", adminSchema)

module.exports = adminModel