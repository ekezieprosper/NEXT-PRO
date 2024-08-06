const mongoose = require('mongoose');
const date = new Date().toLocaleString('en-NG', {day: '2-digit', month: 'short', year:'numeric'})
const createdOn = `${date}`

const chatSchema = new mongoose.Schema({
  
    groupName: {
        type: String, 
        required: false,
        default: ""
      },

    groupImage: {
      type: String, 
      required: false
    },

    members: [{ type: mongoose.Schema.Types.ObjectId}],

    admin: [{
      type: mongoose.Schema.Types.ObjectId
     }],

    creator: [{
     type: mongoose.Schema.Types.ObjectId
   }],

   block:[{
     type: mongoose.Schema.Types.ObjectId
   }],

   blockedBy: [{
    type: mongoose.Schema.Types.ObjectId
  }],

   chats:[{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'chatMessages'
  }],

    Date: {
     type: String, 
      default: createdOn
    }

})


const chatModel = mongoose.model('chat', chatSchema);
module.exports =   chatModel
