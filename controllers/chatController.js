const chatModel = require("../models/chatModel")
const messageModel = require("../models/messageModel")
const playerModel = require("../models/playerModel")
const agentModel = require("../models/agentModel")
const cloudinary = require("../media/cloudinary")
const emoji = require('node-emoji')
const streamifier = require('streamifier')

exports.startChat = async (req, res) => {
  try {
    const id = req.user.userId
    const {friendId} = req.body

    // check if the user exist
    let user = await playerModel.findById(friendId) || await agentModel.findById(friendId)
    if (!user) {
      return res.status(404).json({
        error: "user not found"
      })
    }

    const newChat = await chatModel.create({
      members: [id, friendId]
    })

    await newChat.save()

    if (!newChat) {
      return res.status(400).json({
        error: error.message
      })
    }

    res.status(201).json({
      id: newChat._id,
      users: newChat.members,
      createdAt: newChat.time
    })

  } catch (error) {
    res.status(500).json({
      error: "Internal server error"
    })
  }
}



exports.createGroupChat = async (req, res) => {
  try {
    const id = req.user.userId
    const {groupName, membersId} = req.body

    if (!groupName || typeof groupName !== 'string') {
      return res.status(400).json({ error: "Group name is required" })
    }

    if (!Array.isArray(membersId)) {
      return res.status(400).json({ 
        error: "MembersId should be an array"
       })
    }

    if (membersId.includes(id)) {
      return res.status(401).json({
         error: "Cannot include your own ID in the membersId" 
      })
    }

    const members = [id, ...membersId]

    const newGroupChat = await chatModel.create({
      groupName,
      members,
      admin: id,
      creator: id,
    })

    res.status(201).json({
      message: `${user.userName} created group "${groupName}"`,
      id: newGroupChat._id,
      groupName: newGroupChat.groupName,
      members: newGroupChat.members,
      admin: newGroupChat.admin,
      createdAt: newGroupChat.createdAt,
    })
  } catch (error) {
    res.status(500).json({ 
      error: "Internal server error" 
    })
  }
}


exports.createGroupImage = async (req, res) => {
  try {
    const id = req.user.userId
    const {groupId} = req.body

    const group = await chatModel.findById(groupId)
    if (!group) {
      return res.status(404).json({ 
        error: "Group chat not found." 
      })
    }

    if (!group.members.includes(id)) {
      return res.status(400).json({ 
        error: "You are not a member of this group." 
      })
    }

    if (!req.file) {
      return res.status(400).json({
         error: "No file uploaded." 
        })
    }

    const result = await cloudinary.uploader.upload(req.file.path)
    if (!result.secure_url) {
      return res.status(500).json({
         error: "Failed to upload image to Cloudinary." 
        })
    }

    group.groupImage = result.secure_url
    await group.save()

    res.status(200).json({
       groupImage: group.groupImage 
      })
  } catch (error) {
    res.status(500).json({ 
      error: "Internal server error" 
    })
  }
}


exports.getChat = async (req, res) => {
  try {
    const id = req.user.userId

    const chats = await chatModel.find({ members: id })
    res.status(200).json(chats)
  } catch (error) {
    res.status(500).json({
       error: "Internal server error" 
      })
  }
}


exports.sendMessage = async (req, res) => {
  try {
    const id = req.user.userId
    const {chatId, text} = req.body

    let user = await playerModel.findById(id) || await agentModel.findById(id)
    if (!user) {
      return res.status(404).json({
        error: `not found`
      })
    }

    const chat = await chatModel.findById(chatId)
    if (!chat) {
      return res.status(404).json({
        error: 'Chat not found'
      })
    }

    // Check if the user is a member in the chat
    if (!chat.members.includes(id) ) {
      return res.status(400).json({
        error: `not a member`
      })
    }

    if (chat.block.includes(chatId)) {
      return res.status(400).json({
        error: `This chat is blocked.You can't send message`
      })
    }

    let message = []

    if (req.files && req.files.length > 0) {
      message = await Promise.all(req.files.map(async (file) => {
        try {
          const result = await cloudinary.uploader.upload(file.path, { resource_type: 'auto' })
          return result.secure_url
        } catch (error) {
          return res.status(400).json({
            error: 'Error uploading files'
          })
        }
      }))
    }

    // Validate that at least one of text or media is present
    if (!text && message.length === 0) {
      return res.status(400).json({ error: "Either text or media must be provided." })
    }

    // Replace emoji shortcodes in text with actual emojis
    const emojifiedText = text ? emoji.emojify(text) : ''

    const newMessage = new messageModel({
      chatId: chatId,
      text: emojifiedText,
      sender: id,
      media: message
    })

    await newMessage.save()

    const response = {
      id: newMessage._id,
      media: newMessage.media,
      from: newMessage.sender,

    }

    // Add text to response if it is included
    if (emojifiedText) {
      response.text = emojifiedText
    }

    res.status(201).json(response)
  } catch (error) {
    res.status(500).json({
      error: "Internal server error"
    })
  }
}


exports.sendVoiceNote = async (req, res) => {
  try {
    const id = req.user.userId
    const { chatId } = req.body

// Check if the user is a member in the chat
if (!chat.members.includes(id) ) {
  return res.status(400).json({
    error: `not a member`
  })
}

if (chat.block.includes(chatId)) {
  return res.status(400).json({
    error: `This chat is blocked. Therefore, you can't send vioce note`
  })
}

    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        error: "Voice note file is required."
      })
    }

    const fileName = `${id}-${Date.now()}.mp3`

    const streamUpload = (buffer) => {
      return new Promise((resolve, reject) => {
        let stream = cloudinary.uploader.upload_stream({ resource_type: 'video', public_id: fileName, folder: 'voice_notes' },
          (error, result) => {
            if (result) {
              resolve(result)
            } else {
              reject(error)
            }
          }
        )
        streamifier.createReadStream(buffer).pipe(stream)
      })
    }

    const result = await streamUpload(req.file.buffer)

    const message = new messageModel({
      chatId,
      sender: id,
      voice: result.secure_url
    })
    await message.save()

    res.status(200).json({
      voiceNote: message.voice
    })
  } catch (error) {
    res.status(500).json({
      error: "Internal server error"
    })
  }
}

exports.editMessage = async (req, res) => {
  try {
    const id = req.user.userId
    const {messageId, newText} = req.body

    const message = await messageModel.findById(messageId)
    if (!message) {
      return res.status(404).json({
         error: "Message not found"
       })
    }

    if (message.sender.toString() !== id) {
      return res.status(403).json({ 
        error: "Unautorized.You can only edit your own messages."
       })
    }

    message.text = newText
    await message.save()

    res.status(200).json({
       success: 'edited',
        text: message.text
       })
  } catch (error) {
    res.status(500).json({ 
      error: "Internal server error"
     })
  }
}


exports.copyMessage = async (req, res) => {
  try {
    const {messageId} = req.body

    const message = await messageModel.findById(messageId)
    if (!message) {
      return res.status(404).json({ 
        error: "Message not found" 
      })
    }

    const copiedMessage = new messageModel({ text: message.text })

    await copiedMessage.save()
    res.status(200).json({
       success: 'copied' 
      })
  } catch (error) {
    res.status(500).json({
       error: "Internal server error" 
      })
  }
}


exports.reactOnChat = async (req, res) => {
  try {
    const id = req.user.userId
    const {messageId, reaction} = req.body

    if (!emoji.which(reaction)) {
      return res.status(400).json({
         error: "Invalid emoji" 
        })
    }

    const message = await messageModel.findById(messageId)
    if (!message) {
      return res.status(404).json({
         error: "Message not found" 
        })
    }

    const existingReactionIndex = message.reactions.findIndex(reactionObj => reactionObj.userId === id)

    if (existingReactionIndex !== -1) {
      if (message.reactions[existingReactionIndex].reaction === reaction) {
        message.reactions.splice(existingReactionIndex, 1)
      } else {
        message.reactions[existingReactionIndex].reaction = reaction
      }
    } else {
      message.reactions.push({userId: id, reaction})
    }

    await message.save()
    res.status(200).json(message.reactions)

  } catch (error) {
    res.status(500).json({ 
      error: "Internal server error"
     })
  }
}


exports.getChatmessage = async (req, res) => {
  try {
    const id = req.user.userId
    const chatId = req.params.chatId

    const chat = await chatModel.findById(chatId)
    if (!chat) {
      return res.status(404).json({
         error: "Chat not found"
         })
    }

    if (!chat.members.includes(id)) {
      return res.status(403).json({ 
        error: "Unauthorized" 
      })
    }

    const messages = await messageModel.find({chatId})

    res.status(200).json(messages)

  } catch (error) {
    res.status(500).json({ 
      error: "Internal server error" 
    })
  }
}

exports.blockChat = async (req, res) => {
  try {
    const id = req.user.userId
    const {chatId, blockUser} = req.body

    // Check if the chat exists
    const chat = await chatModel.findById(chatId)
    if (!chat) {
      return res.status(404).json({
        error: "Chat not found"
      })
    }

    // Check if the user is a member of the chat
    if (!chat.members.includes(id) && !chat.members.includes(blockUser)) {
      return res.status(400).json({
        error: "Unauthorized"
      })
    }

    // Check if the chat is already blocked
    if (chat.block.includes(chatId)) {
      return res.status(200).json({
        message: "Chat is already blocked"
      })
    }

    // Block the chat  
    chat.block.push(blockUser) &&  chat.block.push(chatId)
    await chat.save()

    return res.status(200).json({
      message: "blocked"
    })

  } catch (error) {
    return res.status(500).json({
      error: "Internal server error"
    })
  }
}


exports.unblockChat = async (req, res) => {
  try {
    const id = req.user.userId
    const {chatId, unBlockUser} = req.body

    // Check if the chat exists
    const chat = await chatModel.findById(chatId)
    if (!chat) {
      return res.status(404).json({
        error: "Chat not found"
      })
    }

    // Check if the user is authorized to unblock
    if (!chat.members.includes(id) || !chat.block.includes(chatId)) {
      return res.status(400).json({
        error: "Unauthorized to unblock this chat"
      })
    }

    // Remove the user and chat from block list
    const indexUser = chat.block.indexOf(unBlockUser)
    if (indexUser !== -1) {
      chat.block.splice(indexUser, 1)
    }

    const indexChat = chat.block.indexOf(chatId)
    if (indexChat !== -1) {
      chat.block.splice(indexChat, 1)
    }
    await chat.save()

    return res.status(200).json({
      message: "Unblocked"
    })

  } catch (error) {
    return res.status(500).json({
      error: "Internal server error"
    })
  }
}


exports.deleteMessage = async (req, res) => {
  try {
    const id = req.user.userId
    const {messageId} = req.body

    // Find the user
    const user = await playerModel.findById(id)
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      })
    }

    // Find the chat message
    const message = await messageModel.findById(messageId)
    if (!message) {
      return res.status(404).json({
        error: 'Message not found'
      })
    }

    // Find the chat
    const chat = await chatModel.findById(message.chatId)
    if (!chat) {
      return res.status(404).json({
        error: 'Chat not found'
      })
    }

    // Authorization check: the message sender or a chat admin can delete the message
    if (message.sender.toString() !== id && !chat.admin.includes(id)) {
      return res.status(403).json({
        error: 'Unauthorized'
      })
    }

    // Delete the message
    await messageModel.findByIdAndDelete(messageId)

    let responseMessage = 'You deleted this message'
    if (chat.admin.includes(id)) {
      responseMessage = `This message was deleted by admin ${user.userName}`
    }
    res.status(200).json({
      message: responseMessage
    })

  } catch (err) {
    res.status(500).json({
      error: "Internal server error"
    })
  }
}


exports.addMembers = async (req, res) => {
  try {
    const id = req.user.userId
    const {groupId, newMembers} = req.body

    let user = await playerModel.findById(id) || await agentModel(id)

    if (!Array.isArray(newMembers)) {
      return res.status(400).json({
         error: "Field should be an array" 
        })
    }

    const group = await chatModel.findById(groupId)
    if (!group) {
      return res.status(404).json({
         error: "Chat not found" 
        })
    }

    if (!group.admin.includes(id)) {
      return res.status(403).json({
         error: "Unauthorized" 
        })
    }

    const newUniqueMembers = newMembers.filter(member => !group.members.includes(member))
    if (newUniqueMembers.length === 0) {
      return res.status(400).json({
         message: "No new members to add" 
        })
    }

    group.members.push(...newUniqueMembers)
    await group.save()

    res.status(200).json({
       message: `${user.userName} added new member(s)`
       })
  } catch (error) {
    res.status(500).json({
       error: "Internal server error" 
      })
  }
}


exports.forwardMessage = async (req, res) => {
  try {
    const id = req.user.userId
    const {messageId, forwardTo} = req.body

    // Validate message
    const message = await messageModel.findById(messageId)
    if (!message) {
      return res.status(404).json({
        error: "Message not found."
      })
    }

    // Validate recipients
    if (!forwardTo || !Array.isArray(forwardTo)) {
      return res.status(400).json({ 
        error: "Recipients (array of chat IDs) are required." 
      })
    }

    // Find chats that correspond to valid recipients
    const chats = await chatModel.find({
      _id: { $in: forwardTo }
    })


    // If no valid chats found, return an error
    if (chats.length === 0) {
      return res.status(404).json({
        error: "No recipients found."
      })
    }

    // Forward message to valid chats
    const forwardMessages = chats.map(async chat => {
      const forwardedMessage = new messageModel({
        chatId: chat._id,
        text: message.text,
        sender: id,
        originalMessageId: messageId,
        media: message.media,
        voice: message.voice
      })
      await forwardedMessage.save()
    })

    await Promise.all(forwardMessages)

    res.status(200).json({ 
      success: `forwarded to ${uniqueChats.length} chat(s).`
    })

  } catch (error) {
    return res.status(500).json({
       error: "Internal server error." 
    })
  }
}


exports.editAdmin = async (req, res) => {
  try {
    const id = req.user.userId
    const {groupId, addToAdmin} = req.body

    let newAdd = await playerModel.findById(addToAdmin) || await agentModel.findById(addToAdmin)

    const group = await chatModel.findById(groupId)
    if (!group) {
      return res.status(404).json({ 
        error: "Group not found" 
      })
    }

    if (!group.admin.includes(id)) {
      return res.status(403).json({
         error: "Unauthorized" 
        })
    }

    if (!group.members.includes(addToAdmin)) {
      return res.status(404).json({ 
        error: `${addToAdmin} not part of this group`
      })
    }

    if (group.admin.includes(addToAdmin)) {
      return res.status(400).json({
         error: "Member is already an admin" 
        })
    }

    group.admin.push(addToAdmin)
    await group.save()

    res.status(200).json({ 
      message: `${newAdd.userName} is now an admin`
     })
  } catch (error) {
    res.status(500).json({
       error: "Internal server error" 
      })
  }
}


exports.removeMembers = async (req, res) => {
  try {
    const id = req.user.userId
    const {groupId, removeMember} = req.body

    // Find the authenticated user in either playerModel or agentModel
    let user = await playerModel.findById(id) || await agentModel.findById(id)
    if (!user) {
      return res.status(404).json({
        error: "User not found"
      })
    }

    let remove = await playerModel.findById(removeMember) || await agentModel.findById(removeMember)

    // Find the group by groupId
    const group = await chatModel.findById(groupId)
    if (!group) {
      return res.status(404).json({
        error: "Group not found"
      })
    }

    // Check if the member to remove is in the group's members list
    if (!group.members.includes(removeMember)) {
      return res.status(404).json({
        error: "Member not part of this group"
      })
    }

    // Check if the authenticated user is an admin or the creator of the group
    if (!group.admin.includes(id) && group.creator.toString() !== id) {
      return res.status(403).json({
        error: "Unauthorized"
      })
    }

    // Prevent removal of the group creator
    if (group.creator.toString() === removeMember) {
      return res.status(403).json({
        error: `Cannot remove the group creator "${remove.userName}"`
      })
    }

    // Prevent admins from removing other admins unless they are the creator
    if (group.admin.includes(removeMember) && group.creator.toString() !== id) {
      return res.status(403).json({
        error: "Only the creator can remove an admin"
      })
    }

    // Remove the member from the group's members list
    group.members = group.members.filter(memberId => memberId.toString() !== removeMember)

    // Remove the member from the admin list if they are an admin
    if (group.admin.includes(removeMember)) {
      group.admin = group.admin.filter(adminId => adminId.toString() !== removeMember)
    }

    // Save the updated group
    await group.save()

    res.status(200).json({
      message:  `${user.userName} removed ${remove.userName} from this group`
    })

  } catch (error) {
    res.status(500).json({
      error: "Internal server error"
    })
  }
}


exports.exitGroup = async (req, res) => {
  try {
    const id = req.user.userId

    if (!id) {
      return res.status(404).json({
        error: "Session expired. Login"
      })
    }

    // Fetch user from database
    let user = await playerModel.findById(id)
    if (!user) {
      user = await agentModel.findById(id)
    }

    const {groupId} = req.body

    // Fetch the group by ID
    const group = await chatModel.findById(groupId)

    // Check if the group exists
    if (!group) {
      return res.status(404).json({
        error: "Group not found"
      })
    }

    // Check if the user is a member in the chat
    if (!group.members.includes(id)) {
      return res.status(400).json({
        error: `not a member of this group`
      })
    }

    const userName = user.userName

    // Remove the user from the group's members list
    group.members = group.members.filter(memberId => memberId.toString() !== id)

    // check if the user is an admin and remove 
    if (group.admin.includes(id)) {
      group.admin = group.admin.filter(memberId => memberId.toString() !== id)
    }

    // Save the updated group details
    await group.save()

    res.status(200).json({
      message: `${userName} left the group`
    })

  } catch (error) {
    res.status(500).json({
      error: "Internal server error"
    })
  }
}


exports.deleteChat = async (req, res) => {
  try {
    const id = req.user.userId
    const {chatId} = req.body

    const chat = await chatModel.findById(chatId)
    if (!chat) {
      return res.status(404).json({ 
        error: "Chat not found" 
      })
    }

    if (!chat.members.includes(id)) {
      return res.status(403).json({
         error: "Unauthorized" 
        })
    }

    chat.members = chat.members.filter(memberId => memberId.toString() !== id)

    if (chat.members.length === 0) {
      await chatModel.findByIdAndDelete(chatId)
    } else {
      await chat.save()
    }

    res.status(200).json({ 
      message: "Chat deleted successfully" 
    })
  } catch (error) {
    res.status(500).json({ 
      error: "Internal server error"
     })
  }
}