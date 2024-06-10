const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  
    groupName: {type: String, 
        required: false},

        groupImage: {type: String, required: false},

         members:  [{ type: mongoose.Schema.Types.ObjectId}],

          admin: [{
            type: mongoose.Schema.Types.ObjectId
          }],

          creator: {
            type: mongoose.Schema.Types.ObjectId
          },

         block:[{
            type: mongoose.Schema.Types.ObjectId
          }],

        time: {type: Date, default: Date.now}

})


const chatModel = mongoose.model('chat', chatSchema);
module.exports =   chatModel
