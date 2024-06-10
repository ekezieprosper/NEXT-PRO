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
    const { friendId } = req.body

    // check if the user exist
    let user = await playerModel.findById(friendId) || await agentModel.findById(friendId)
    if (!user) {
      return res.status(404).json({
        error: "user not found"
      })
    }

    // Check if a chat with both id and friendId already exists
    const existingChat = await chatModel.findOne({
      members: { $all: [id, friendId] }
    })
    if (existingChat) {
      return res.status(400).json({
        error: `You already have an existing chat with ${user.userName}`
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
    const { groupName, membersId } = req.body

    let user = await playerModel.findById(id) || await agentModel.findById(id)

    // Check if groupName is provided and is a non-empty string
    if (!groupName || typeof groupName !== 'string') {
      return res.status(400).json({
        error: "Group name is required"
      })
    }

    // Check if membersId is an array
    if (!Array.isArray(membersId)) {
      return res.status(400).json({
        error: "MembersId should be an array"
      })
    }

    if (membersId.includes(id)) {
     return res.status(401).json({
       message: "can not input your id in the membersId"
      })
    }

    // Include the creatorId in the members array
    const members = [id, ...membersId]

    // Create group chat with creatorId and membersId
    const newGroupChat = await chatModel.create({
      groupName: groupName,
      members: members,
      admin: id,
      creator: id
    })

    // Return the newly created group chat
    res.status(201).json({
      message: `${user.userName} created group "${groupName}"`,
      id: newGroupChat._id,
      group_name: newGroupChat.groupName,
      members: newGroupChat.members,
      admin: newGroupChat.admin,
      createdAt: newGroupChat.time

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

    // Check if user ID exists
    if (!id) {
      return res.status(404).json({
        error: "Session expired. Please log in."
      })
    }

    const groupId = req.body.groupId
    const group = await chatModel.findById(groupId)

    // Check if the chat exists and if the user is a member
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

    // Check if a file is uploaded
    if (!req.file) {
      return res.status(400).json({
        error: "No file uploaded."
      })
    }

    const imageFile = req.file.path

    // Upload image to Cloudinary
    const result = await cloudinary.uploader.upload(imageFile)

    if (!result.secure_url) {
      return res.status(500).json({
        error: "Failed to upload image to Cloudinary."
      })
    }

    // Update the group chat with the new image URL
    const updateGroup = await chatModel.findByIdAndUpdate(
      groupId,
      { groupImage: result.secure_url },
      {new: true}
    )

    if (!updateGroup) {
      return res.status(404).json({
        error: "Group chat not found."
      })
    }

    // Respond with success
    res.status(200).json({
      group: updateGroup.groupImage
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

    if (!id) {
      return res.status(404).json({
        error: "session expired. Login"
      })
    }

    const chats = await chatModel.find({
      members: { $in: [id] }
    })

    // Check if the user is a member in each chat
    const isMember = chats.every(chat => chat.members.includes(id))

    if (!isMember) {
      return res.status(400).json(null)
    }

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

    if (chat.block.includes(id)) {
      return res.status(400).json({
        error: `you've been blocked`
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

if (chat.block.includes(id)) {
  return res.status(400).json({
    error: `you've been blocked`
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
    if (!id) {
      return res.status(404).json({
        error: "session expired.Login"
      })
    }
    const {messageId, newText} = req.body

    const edited = await messageModel.findById(messageId)
    if (!edited) {
      return res.status(404).json({
        error: 'Message not found'
      })
    }

    // Check if the user is the sender of the message
    if (edited.sender.toString() !== id) {
      return res.status(403).json({
        error: "You can only edit your own messages."
      })
    }

    edited.text = newText
    await edited.save()

    res.status(200).json({
      message: 'Edited.',
      text: edited.text
    })
  } catch (err) {
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
        error: 'Message not found'
      })
    }

    // copy message
    const copiedMessage = new messageModel({ text: message.text })

    await copiedMessage.save()
    res.status(200).json({
      message: 'Copied.'
    })

  } catch (err) {
    res.status(500).json({
      error: "Internal server error"
    })
  }
}


exports.reactOnChat = async (req, res) => {
  try {
    const id = req.user.userId
    const {messageId, reaction} = req.body

    // Check if the reaction is a valid emoji
    if (!emoji.which(reaction)) {
      return res.status(400).json({
        error: 'Invalid emoji'
      })
    }

    // Find the chat message
    const message = await messageModel.findById(messageId)
    if (!message) {
      return res.status(404).json({
        error: 'Message not found'
      })
    }

    // Find if the user has already reacted
    const existingReactionIndex = message.reactions.findIndex(reactionObj => reactionObj.userId === id)

    // If user has already reacted
    if (existingReactionIndex !== -1) {
      // If the user is reacting with the same emoji again, delete the previous reaction
      if (message.reactions[existingReactionIndex].reaction === reaction) {
        message.reactions.splice(existingReactionIndex, 1)
      } else {
        // If the user is reacting with a different emoji, update the previous reaction
        message.reactions[existingReactionIndex].reaction = reaction
      }
    } else {
      // If user has not reacted before, add the reaction
      message.reactions.push({ userId: id, reaction })
    }

    await message.save()

    res.status(200).json({
      message: 'Reaction updated successfully',
      reactions: message.reactions
    })

  } catch (err) {
    res.status(500).json({
      error: "Internal server error"
    })
  }
}


exports.forwardMessage = async (req, res) => {
  try {
    const id = req.user.userId
    const {messageId, forwardTo} = req.body

    // Find the user either in the playerModel or agentModel
    let user = await playerModel.findById(id) || await agentModel.findById(id)
    if (!user) {
      return res.status(404).json({
        error: "User not found"
      })
    }

    const message = await messageModel.findById(messageId)
    if (!message) {
      return res.status(404).json({
        error: "Message not found."
      })
    }

    if (!forwardTo || !Array.isArray(forwardTo)) {
      return res.status(400).json({
        error: "recipients (array of chat IDs) are required."
      })
    }

    // Find chats that correspond to valid recipients
    const chats = await chatModel.find({
      _id: { $in: forwardTo }
    })

    // If no valid chats found, return an error
    if (chats.length === 0) {
      return res.status(404).json({
        error: "No valid recipients found."
      })
    }

    // Forward the message to valid recipients
    const forwardMessages = forwardTo.map(async recipientId => {
      const forwardedMessage = new messageModel({
        chatId: recipientId,
        text: message.text,
        sender: id,
        originalMessageId: messageId
      })
      await forwardedMessage.save()
    })

    await Promise.all(forwardMessages)

    res.status(200).json({
      success: "Message forwarded to recipients."
    })

  } catch (error) {
    console.error(error)
    return res.status(500).json({
      error: "Internal server error. Please try again later."
    })
  }
}


exports.getChatmessage = async (req, res) => {
  try {
    const id = req.user.userId

    if (!id) {
      return res.status(401).json({
        error: "Session expired.Login."
      })
    }

    const chatId = req.params.chatId
    const chat = await chatModel.findById(chatId)

    if (!chat) {
      return res.status(404).json({
        error: "Chat not found."
      })
    }

    if (!chat.members.includes(id)) {
      return res.status(403).json({
        error: "Unauthorized"
      })
    }

    // Fetch the messages
    const messages = await messageModel.find({ chatId: chatId })

    if (!messages || messages.length === 0) {
      return res.status(404).json(null)
    }

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
    const {chatId, friendId} = req.body

    // Check if the chat exists
    const chat = await chatModel.findById(chatId)
    if (!chat) {
      return res.status(404).json({
        error: "Chat not found"
      })
    }

    // Fetch user from database
    let user = await playerModel.findById(friendId) || await agentModel.findById(friendId)
    if (!user) {
      return res.status(404).json({
        error: "User not found"
      })
    }
    const userName = user.userName

    // Check if both users are in the chat
    const inChat = chat.members.includes(id) && chat.members.includes(friendId)
    if (!inChat) {
      return res.status(400).json({
        error: "Both users must be in the chat"
      })
    }

    // Check if the user is already blocked
    if (chat.block.includes(friendId)) {
      return res.status(200).json({
        message: `${userName} is already blocked`
      })
    }

    // Block the user
    chat.block.push(friendId)
    await chat.save()

    return res.status(200).json({
      message: `You've blocked ${userName}`
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
    const {chatId, friendId} = req.body

    // Check if the chat exists
    const chat = await chatModel.findById(chatId)
    if (!chat) {
      return res.status(404).json({
        error: "Chat not found"
      })
    }

    // Fetch user from database
    let user = await playerModel.findById(friendId) || await agentModel.findById(friendId)
    if (!user) {
      return res.status(404).json({
        error: "User not found"
      })
    }
    const userName = user.userName

    // Check if both users are in the chat
    const inChat = chat.members.includes(id) && chat.members.includes(friendId)
    if (!inChat) {
      return res.status(400).json({
        error: "Both users must be in the chat"
      })
    }

    // Check if the user is actually blocked
    if (!chat.block.includes(friendId)) {
      return res.status(200).json({
        message: `${userName} is not blocked`
      })
    }

    // Unblock the user
    chat.block = chat.block.filter(blockedId => blockedId.toString() !== friendId)
    await chat.save()

    return res.status(200).json({
      message: `You've unblocked ${userName}`
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
    const { messageId } = req.body

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
    console.error(err) 
    res.status(500).json({
      error: "Internal server error"
    })
  }
}


exports.addMembers = async (req, res) => {
  try {
    const id = req.user.userId
    const {groupId, newMembers} = req.body

    if (!Array.isArray(newMembers)) {
      return res.status(400).json({
        error: "Field should be an array."
      })
    }

    const user = await playerModel.findById(id) || await agentModel.findById(id)
    if (!user) {
      return res.status(401).json({
        error: "User not found."
      })
    }

    const NewPlayers = await playerModel.find({ _id: { $in: newMembers } })
    const NewAgents = await agentModel.find({ _id: { $in: newMembers } })
    const New = [...NewPlayers, ...NewAgents]

    if (New.length === 0) {
      return res.status(404).json({
        message: "Not found."
      })
    }

    const newAdds = New.map(users => users.userName)

    // Find the chat group
    const chat = await chatModel.findById(groupId)
    if (!chat) {
      return res.status(404).json({
        error: "Chat not found."
      })
    }

    // Check if the user is an admin of the chat group
    if (!chat.admin.includes(id)) {
      return res.status(403).json({
        error: "Unauthorized."
      })
    }

    // Filter out members that are already in the chat group
    const newUniqueMembers = newMembers.filter(member => !chat.members.includes(member))

    if (newUniqueMembers.length === 0) {
      return res.status(400).json({
        message: `${newAdds.join(", ")} already in the group.`
      })
    }

    // Add new members to the chat group
    const updatedMembers = Array.from(new Set([...chat.members, ...newUniqueMembers]))

    const updatedChat = await chatModel.findByIdAndUpdate(groupId, { members: updatedMembers }, { new: true })

    return res.status(200).json({
      message: `${user.userName} added ${newAdds.join(", ")}.`,
      updatedChat
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

    if (!id) {
      return res.status(401).json({
        error: "Session expired. Please log in.",
      })
    }

    let newAdd = await playerModel.findById(addToAdmin) || await agentModel.findById(addToAdmin)

    const group = await chatModel.findById(groupId)
    if (!group) {
      return res.status(404).json({
        error: "group not found.",
      })
    }

    if (!group.admin.includes(id)) {
      return res.status(403).json({
        error: "Unauthorized.",
      })
    }

    if (!group.members.includes(addToAdmin)) {
      return res.status(404).json({
        error: "Member not part of this group"
      })
    }

    if (group.admin.includes(addToAdmin)) {
      return res.status(404).json({
        error: `${newAdd.userName} is already an admin.`
      })
    }

    group.admin.push(addToAdmin)
    await group.save()

    return res.status(200).json({
      message: `${newAdd.userName} is now an admin.`,
    })
  } catch (error) {
    res.status(500).json({
      error: "Internal server error",
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
      message:  `${user.userName} removed you from this group`
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
    const chatId = req.body.chatId


    const chat = await chatModel.findById(chatId)

    if (!chat) {
      return res.status(404).json({
        error: "Chat not found."
      })
    }

    // Check if the user is a member of the chat
    if (!chat.members.includes(id)) {
      return res.status(403).json({
        error: "Unauthourized."
      })
    }

    // Remove the user from the chat's members array
    chat.members = chat.members.filter(memberId => memberId.toString() !== id)

    // If no members remain, delete the chat
    if (chat.members.length === 0) {
      await chatModel.findByIdAndDelete(chatId)

      return res.status(200).json({
        message: "deleted successfully"
      })
    } else {
      await chat.save()
      return res.status(200).json({
        message: "deleted successfully"
      })
    }
  } catch (error) {
    res.status(500).json({
      error: "Internal server error"
    })
  }
}