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
      default: "https://i.pinimg.com/564x/cd/c4/88/cdc4883428375f1badaae113f2333b22.jpg",
    },

    members: [{
       type: mongoose.Schema.Types.ObjectId
      }],

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
