const chatModel = require("../models/chatModel")
const messageModel = require("../models/messageModel")
const playerModel = require("../models/playerModel")
const agentModel = require("../models/agentModel")
const notificationModel = require("../models/notificationModel")
const cloudinary = require("../media/cloudinary")
const emoji = require('node-emoji')
const fs = require("fs")


exports.startChat = async (req, res) => {
  try {
    const id = req.user.userId
    const {friendId} = req.body

    // check if the user exist
    const user = await playerModel.findById(friendId) || await agentModel.findById(friendId)
    if (!user) {
      return res.status(404).json({
        error: "user not found"
      })
    }

    if (friendId === id) {
      return res.status(401).json({
        error:"cannot initialize chat for yourself"
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
      createdAt: newChat.Date
    })

  } catch (error) {
    res.status(500).json({
      error: error.message
    })
  }
}


exports.createGroupChat = async (req, res) => {
  try {
    const id = req.user.userId
    const { groupName, membersId } = req.body

    // Validate groupName
    if (!groupName || typeof groupName !== 'string') {
      return res.status(400).json({ 
        error: "Group name is required" 
      })
    }

    // Validate membersId
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

    const user = await playerModel.findById(id) || await agentModel.findById(id)
    if (!user) {
      return res.status(404).json({
         error: "User not found" 
        })
    }

    // Create the group chat
    const members = [id, ...membersId]
    const newGroupChat = await chatModel.create({
      groupName,
      members,
      admin: id,
      creator: id,
    })

    newGroupChat.creator.push(id)

    res.status(201).json({
      message: `${user.userName} created this group "${groupName}"`,
      id: newGroupChat._id,
      groupName: newGroupChat.groupName,
      members: newGroupChat.members,
      admin: newGroupChat.admin,
      createdAt: newGroupChat.createdAt,
    })

     // Send notifications to each member (excluding the creator)
       const notificationPromises = membersId.map(async memberId => {
        const member = await playerModel.findById(memberId) || await agentModel.findById(memberId)
        if (!member) return
  
        const notification = `${user.userName} added you to "${groupName}"`
        const Notification = {
          notification,
          recipient: member._id,
          recipientModel: member instanceof agentModel ? 'agent' : 'player',
        }
  
        // Create and save notification
        const message = new notificationModel(Notification)
        await message.save()
  
        // Add the notification to the member's notifications list
        member.notifications.push(message._id)
        await member.save()

        return message
      })
  
      await Promise.all(notificationPromises)

  } catch (error) {
    res.status(500).json({
       error: error.message 
      })
  }
}


exports.createGroupImage = async (req, res) => {
  try {
    const id = req.user.userId
    const { groupId } = req.body

    // Fetch the group chat
    const group = await chatModel.findById(groupId)
    if (!group) {
      return res.status(404).json({ 
        error: "Group chat not found." 
      })
    }

    // Check if the user is a member of the group
    if (!group.members.includes(id)) {
      return res.status(400).json({ 
        error: "You are not a member of this group." 
      })
    }

     // Check if the chat is a group chat
     if (!group.groupName) {
      return res.status(401).json({
        error: "Cannot upload image to a chat that's not a group chat"
      })
    }

    // Check if a file has been uploaded
    if (!req.file) {
      return res.status(400).json({
         error: "No file uploaded." 
        })
    }

    // Upload the file to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path)
    if (!result.secure_url) {
      return res.status(500).json({
         error: "Failed to upload image to Cloudinary." 
        })
    }

    // Delete the file from local storage
    fs.unlink(req.file.path, (err) => {
      if (err) {
        console.error('Failed to delete local file', err)
      }
    })

    // Update the group image URL
    group.groupImage = result.secure_url
    await group.save()

    // Respond with the updated group image URL
    res.status(200).json({
       groupImage: group.groupImage 
      })
  } catch (error) {
    res.status(500).json({ 
      error: error.message 
    })
  }
}


exports.deleteGroupImg = async (req, res) => {
  try {
      const id = req.user.userId
      const { groupId } = req.params

      // Fetch the group chat
      const group = await chatModel.findById(groupId)
      if (!group) {
        return res.status(404).json({ 
          error: "Group chat not found." 
        })
      }
  
      // Check if the user is a member of the group
      if (!group.members.includes(id)) {
        return res.status(400).json({ 
          error: "You are not a member of this group." 
        })
      }

      // Delete profile image from Cloudinary if exists
      if (group.groupImage) {
          const oldImage = group.groupImage.split("/").pop().split(".")[0]
          await cloudinary.uploader.destroy(oldImage)
      }

      // Update profile image URL in the database to default
      group.groupImage = "https://i.pinimg.com/564x/cd/c4/88/cdc4883428375f1badaae113f2333b22.jpg"
      await group.save()

      // Send success response
      res.status(200).json(group.groupImage)
  } catch (error) {
      res.status(500).json({
          error: error.message
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
       error: error.message 
      })
  }
}


exports.sendMessage = async (req, res) => {
  try {
    const id = req.user.userId
    const { chatId, text } = req.body

    const user = await playerModel.findById(id) || await agentModel.findById(id)
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found' 
      })
    }

    const chat = await chatModel.findById(chatId)
    if (!chat) {
      return res.status(404).json({ 
        error: 'Chat not found' 
      })
    }

    // Check if the user is a member of the chat
    if (!chat.members.includes(id)) {
      return res.status(400).json({
         error: 'User not a member of this chat' 
        })
    }

    // Check if the chat is blocked
    if (chat.block.includes(id)) {
      const blockedByUser = await playerModel.findById(chat.blockedBy) || await agentModel.findById(chat.blockedBy)
      const blockedByName = blockedByUser.userName
      return res.status(400).json({
        error: `This chat is blocked by ${blockedByName}. You can't send a message.`
      })
    }

    let message = []
    if (req.files && req.files.length > 0) {
      message = await Promise.all(req.files.map(async (file) => {
        try {
          const result = await cloudinary.uploader.upload(file.path, { resource_type: 'auto' })

          // Delete the file from local storage
          fs.unlink(file.path, (err) => {
            if (err) {
              console.error('Failed to delete local file', err)
            }
          })

          return result.secure_url
        } catch (error) {
          throw new Error('Error uploading files')
        }
      }))
    }

    // Validate that at least one of text or media is present
    if (!text && message.length === 0) {
      return res.status(400).json({
         error: 'Either text or media must be provided.' 
        })
    }

    const newMessage = new messageModel({
      chatId,
      text: text,
      sender: id,
      media: message
    })

    await newMessage.save()

    const response = {
      id: newMessage._id,
      text: newMessage.text,
      media: newMessage.media,
      from: newMessage.sender,
      time: newMessage.time
    }

    res.status(201).json(response)

    // Add the message to the chat and save it
    chat.chats.push(newMessage._id)
    await chat.save()

  } catch (error) {
    res.status(500).json({ 
      error: error.message 
    })
  }
}


exports.sendVoiceNote = async (req, res) => {
  try {
    const userId = req.user.userId
    const { chatId } = req.body

    const chat = await chatModel.findById(chatId)

    if (!chat) {
      return res.status(404).json({ 
        error: 'Chat not found' 
      })
    }

    // Check if the user is a member of the chat
    if (!chat.members.includes(userId)) {
      return res.status(400).json({
        error: 'You are not a member of this chat',
      })
    }

    // Check if the chat is blocked
    if (chat.block.includes(userId)) {
      return res.status(400).json({
        error: `This chat is blocked by ${chat.blockedBy}. You can't send messages.`,
      })
    }

    // Check if a file was uploaded
    if (!req.file) {
      return res.status(400).json({
         error: 'No file uploaded'
         })
    }

    // Upload the voice note to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      resource_type: 'auto',
    })

      // Delete the file from local storage
      fs.unlink(req.file.path, (err) => {
        if (err) {
            console.error('Failed to delete local file', err)
        }
    })

    // Save file URL to the message
    const message = new messageModel({
      chatId,
      sender: userId,
      voice: result.secure_url
    })

    await message.save()

    // Add the message to the chat
    chat.chats.push(message._id)
    await chat.save()

    res.status(200).json({
      id: message._id,
      from: message.sender,
      voiceNote: message.voice,
      time: message.time,
    })
  } catch (error) {
    res.status(500).json({
      error: error.message,
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
      error: error.message
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
       error: error.message 
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
      error: error.message
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

    if (messages.length === 0) {
      return res.status(404).json({
        message: "start sending message"
    })
  } else {
      res.status(200).json(messages)
    }    

  } catch (error) {
    res.status(500).json({ 
      error: error.message 
    })
  }
}


exports.blockChat = async (req, res) => {
  try {
    const id = req.user.userId
    const {chatId} = req.body

    // Check if the chat exists
    const chat = await chatModel.findById(chatId)
    if (!chat) {
      return res.status(404).json({
        error: "Chat not found"
      })
    }

    // Check if the user is a member of the chat
    if (!chat.members.includes(id)) {
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
    if (chat.groupName === "") {
    chat.block.push(chatId)
    chat.blockedBy.push(id)
    await chat.save()
    }else{
      return res.status(400).json({
        message: "cannot block group chat"
      })
    }

    return res.status(200).json({
      message: "blocked"
    })

  } catch (error) {
    return res.status(500).json({
      error: error.message
    })
  }
}


exports.unblockChat = async (req, res) => {
  try {
    const id = req.user.userId
    const { chatId } = req.body

    // Check if the chat exists
    const chat = await chatModel.findById(chatId)
    if (!chat) {
      return res.status(404).json({
        error: "Chat not found"
      })
    }

    // Check if the user is a member of the chat
    if (!chat.members.includes(id)) {
      return res.status(400).json({
        error: "Unauthorized"
      })
    }

    // Check if the chat is blocked
    if (!chat.block.includes(chatId)) {
      return res.status(400).json({
        message: "Chat is not blocked"
      })
    }

    // Check if the user is the one who blocked the chat
    if (!chat.blockedBy || !chat.blockedBy.includes(id)) {
      return res.status(403).json({
        error: "Unauthorized"
      })
    }

    // Unblock the chat
    // Remove the user and chat from block list
    const indexUser = chat.blockedBy.indexOf(id)
    if (indexUser !== -1) {
      chat.blockedBy.splice(indexUser, 1)
    }

    const indexChat = chat.block.indexOf(chatId)
    if (indexChat !== -1) {
      chat.block.splice(indexChat, 1)
    }
    await chat.save()

    return res.status(200).json({
      message: "Chat unblocked"
    })

  } catch (error) {
    return res.status(500).json({
      error: error.message
    })
  }
}



exports.deleteMessage = async (req, res) => {
  try {
    const id = req.user.userId
    const {messageId} = req.body

    // Find the user
    const user = await playerModel.findById(id) || await agentModel.findById(id)
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

      // Delete media from Cloudinary if it exists
      if (message.media && message.media.length > 0) {
        await Promise.all(message.media.map(async (mediaUrl) => {
          const publicId = mediaUrl.split("/").pop().split(".")[0]
          // Determine the resource type (image or video)
          const resourceType = mediaUrl.includes('.mp4') || mediaUrl.includes('.avi') ? 'video' : 'image'
          await cloudinary.uploader.destroy(publicId, { resource_type: resourceType })
        }))  
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

  } catch (error) {
    res.status(500).json({
      error: error.message
    })
  }
}


exports.addMembers = async (req, res) => {
  try {
    const id = req.user.userId
    const { groupId, newMembers } = req.body

    const user = await playerModel.findById(id) || await agentModel.findById(id)

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

    // Fetch usernames of the new unique members
    const newMembersUsernames = await Promise.all(
      newUniqueMembers.map(async memberId => {
        const member = await playerModel.findById(memberId) || await agentModel.findById(memberId)
        return member ? member.userName : null
      })
    )

    // Filter out any null values in case some members were not found
    const validUsernames = newMembersUsernames.filter(username => username !== null)

    group.members.push(...newUniqueMembers)

  // Send notifications to the newly added members
  const notificationPromises = newMembers.map(async newMembers => {
    const member = await playerModel.findById(newMembers) || await agentModel.findById(newMembers)
    if (!member) return

    const notification = `${user.userName} added you to "${group.groupName}"`
    const Notification = {
      notification,
      recipient: member._id,
      recipientModel: member instanceof agentModel ? 'agent' : 'player',
    }

    // Create and save notification
    const message = new notificationModel(Notification)
    await message.save()

    // Add the notification to the member's notifications list
    member.notifications.push(message._id)
    await member.save()

    return message
  })

  await Promise.all(notificationPromises)

    await group.save()

    res.status(200).json({
      message: `${user.userName} added ${validUsernames.join(', ')} to the group`
    })
  } catch (error) {
    res.status(500).json({
      error: error.message
    })
  }
}


exports.forwardMessage = async (req, res) => {
  try {
    const id = req.user.userId
    const { messageId, forwardTo } = req.body

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

      // Add forwarded message ID to the chat's messages
      chat.chats.push(forwardedMessage._id)
      await chat.save()
    })

    await Promise.all(forwardMessages)

    res.status(200).json({ 
      success: ` forwarded`
    })

  } catch (error) {
    return res.status(500).json({
       error: error.message 
    })
  }
}


exports.editAdmin = async (req, res) => {
  try {
    const id = req.user.userId
    const { groupId, addToAdmin } = req.body

    const newAdd = await playerModel.findById(addToAdmin) || await agentModel.findById(addToAdmin)

    if (!newAdd) {
      return res.status(404).json({
         error: `user not found` 
        })
    }

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
        error: `${newAdd.userName} is not part of this group` 
      })
  }

    if (group.admin.includes(addToAdmin)) {
      return res.status(400).json({ 
        error: "Member is already an admin for this group chat" 
      })
  }

    group.admin.push(addToAdmin)

    const notification = `${req.user.userName} added you as an admin in "${group.groupName}"`
    const Notification = {
      notification,
      recipient: newAdd._id,
      recipientModel: newAdd instanceof agentModel ? 'agent' : 'player',
    }

    const message = new notificationModel(Notification)
    await message.save()

    newAdd.notifications.push(message._id)
    await newAdd.save()

    // Save the updated group
    await group.save()

    res.status(200).json({
       message: `${newAdd.userName} is now an admin` 
      })

  } catch (error) {
    res.status(500).json({ 
      error: error.message 
    })
  }
}


exports.removeMembers = async (req, res) => {
  try {
    const id = req.user.userId
    const {groupId, removeMember} = req.body

    // Find the authenticated user in either playerModel or agentModel
    const user = await playerModel.findById(id) || await agentModel.findById(id)
    if (!user) {
      return res.status(404).json({
        error: "User not found"
      })
    }

    const remove = await playerModel.findById(removeMember) || await agentModel.findById(removeMember)

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
      error: error.message
    })
  }
}


exports.exitGroup = async (req, res) => {
  try {
    const id = req.user.userId

    // Fetch user from database
    const user = await playerModel.findById(id) || await agentModel.findById(id)
    if (!user) {
      return res.status(404).json({
        error: "User not found."
      })
    }

    const { groupId } = req.body

    // Fetch the group by ID
    const group = await chatModel.findById(groupId)

    // Check if the group exists
    if (!group) {
      return res.status(404).json({
        error: "Group not found."
      })
    }

    // Check if the user is a member of the group
    if (!group.members.includes(id)) {
      return res.status(403).json({
        error: "You are not a member of this group."
      })
    }


    // Remove the user from the group's members list
    group.members = group.members.filter(memberId => memberId.toString() !== id)

    // Remove the user from the admin list if they are an admin
    if (group.admin.includes(id)) {
      group.admin = group.admin.filter(adminId => adminId.toString() !== id)
    }

    if (group.creator.includes(id)) {
      group.creator = group.creator.filter(creatorId => creatorId.toString() !== id)
    }
     
    // If the user is the last member, delete the group
    if (group.members.length === 0) {
      await chatModel.findByIdAndDelete(groupId)
      return res.status(200).json({
        message: "Group deleted as you were the last member."
      })
    }

    // Save the updated group
    await group.save()

    res.status(200).json({
      message: `${user.userName} left the group.`
    })

  } catch (error) {
    res.status(500).json({
      error: error.message
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

      // Remove the user from the group's members list
      chat.members = chat.members.filter(memberId => memberId.toString() !== id)

      // Remove the user from the admin list if they are an admin
      if (chat.admin.includes(id)) {
        chat.admin = chat.admin.filter(adminId => adminId.toString() !== id)
      }
  
      if (chat.creator.includes(id)) {
        chat.creator = chat.creator.filter(creatorId => creatorId.toString() !== id)
      }

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
      error: error.message
     })
  }
}