const storyModel = require("../models/stories")
const cloudinary = require("../media/cloudinary")
const playerModel = require("../models/playerModel")
const agentModel = require("../models/agentModel")
const chatModel = require("../models/chatModel")
const messageModel = require("../models/messageModel")
const fs = require("fs")
const notificationModel = require("../models/notificationModel")



exports.createstory = async (req, res) => {
    try {
        const id = req.user.userId
        let { text } = req.body

        const user = await playerModel.findById(id) || await agentModel.findById(id)
        if (!user) {
            return res.status(400).json({
                error: "No user found."
            })
        }

        let media = []
        if (req.files && req.files.length > 0) {
            try {
                media = await Promise.all(req.files.map(async (file) => {
                    const result = await cloudinary.uploader.upload(file.path, { resource_type: 'auto' })

                    // Delete the file from local storage
                    fs.unlink(file.path, (err) => {
                        if (err) {
                            console.error('Failed to delete local file', err)
                        }
                    })

                    return result.secure_url
                }))
            } catch (uploadError) {
                console.error("Error uploading files:", uploadError)
                return res.status(500).json({
                    error: "Error uploading files."
                })
            }
        }

        // Validate that at least one of text or media is present
        if (!text && media.length === 0) {
            return res.status(400).json({
                error: "No text or media was provided."
            })
        }

        // Create a new story
        const story = new storyModel({
            text: text,
            story: media,
            owner: id
        })
        await story.save()

        const response = {
            id: story._id,
            text: story.text,
            story: story.story,
            likes: story.likes ,
            comments: story.comments,
            views: story.views,
            time: story.time,
        }

        // Notify all followers about the new story
        const followers = user.followers
        await Promise.all(followers.map(async (followerId) => {
            const follower = await playerModel.findById(followerId) || await agentModel.findById(followerId)
            if (follower) {
                const recipientModel = follower instanceof agentModel ? 'agent' : 'player'
                const notificationData = {
                notification: `${user.userName} recently added a story: ${story._id}.`,
                recipient: followerId,
                recipientModel: recipientModel
                }
                const message = new notificationModel(notificationData)
                await message.save()

                follower.notifications.push(message._id)
                await follower.save()
            }
        }))

        res.status(201).json(response)

    } catch (error) {
        res.status(500).json({
            error: error.message
        })
    }
}



exports.getstory = async (req, res) => {
    try {
        const id = req.user.userId

        const user = await playerModel.findById(id) || await agentModel.findById(id)
        if (!user) {
            return res.status(400).json({
                error: "No user found."
            })
        }

        const storyId = req.params.storyId
        const story = await storyModel.findById(storyId)

        if (!story) {
            return res.status(404).json({
                error: "Story not found"
            })
        }

        if (id !== story.owner.toString() && !story.views.includes(id)) {
            story.views.push(id)
            await story.save()
        }

        res.status(200).json({
            story: story.story,
            text: story.text,
            likes: story.likes,
            comments: story.comments,
            views: story.views,
            owner: story.owner,
            time: story.time,
        })

    } catch (error) {
        res.status(500).json({
            error: error.message
        })
    }
}


exports.getAllStories = async (req, res) => {
    try {
        const id = req.user.userId

        // Find the user in userModel
        const user = await playerModel.findById(id) || await agentModel.findById(id)
        if (!user) {
            return res.status(400).json({
                 error: "No user found." 
            })
        }

        const currentTime = new Date()

        // Fetch valid stories that haven't expired yet
        const stories = await storyModel.find({
            date: { $gte: new Date(currentTime.getTime() - 24 * 60 * 60 * 1000) }
        })

        if (stories.length === 0) {
            return res.status(404).json({
                 message: "No story" 
            })
        }

        const validStories = []

        for (let story of stories) {
            const timeCreated = new Date(story.date)
            const expiresIn = new Date(timeCreated.getTime() + 24 * 60 * 60 * 1000)

            if (currentTime > expiresIn) {
                // Delete the story from the database
                await storyModel.findByIdAndDelete(story._id)

                // Delete media from Cloudinary if it exists
                if (story.story && story.story.length > 0) {
                await Promise.all(story.story.map(async (storyUrl) => {
                const publicId = storyUrl.split("/").pop().split(".")[0]

                // Determine the resource type (image or video)
                const resourceType = storyUrl.match(/\.(mp4|mov|avi)$/) ? 'video' : 'image'

                await cloudinary.uploader.destroy(publicId, { resource_type: resourceType })
                  }))
                }
            } else {
                validStories.push(story)
            }
        }

        // Return remaining valid stories
        res.status(200).json(validStories)

    } catch (error) {
        res.status(500).json({ 
            error: error.message 
        })
    }
}


exports.replyStory = async (req, res) => {
    try {
        const { userId } = req.user
        const { storyId } = req.params

        // Find the user
        const user = await playerModel.findById(userId) || await agentModel.findById(userId)
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            })
        }

        // Find the story
        const story = await storyModel.findById(storyId)
        if (!story) {
            return res.status(404).json({
                message: "Story not found"
            })
        }

        // Check if a chat already exists between the user and the story owner
        let chat = await chatModel.findOne({
            members: { $all: [userId, story.owner] },
            groupName: { $eq: "" } 
        })

        if (userId === story.owner) {
            return res.status(401).json({
              error:"cannot initialize chat for yourself"
            })
          }

        if (!chat) {
            // Create a new chat if one doesn't exist
            chat = await chatModel.create({
                members: [userId, story.owner],
                groupName: ""
            })

            if (!chat) {
                return res.status(400).json({
                    error: "Failed to create chat"
                })
            }
        }

        const {text} = req.body
        if (!text) {
            return res.status(400).json({
                message: "Text is required to reply to the story."
            })
        }

        // Create and save the new message
        const newMessage = new messageModel({
            story: storyId,
            chatId: chat._id,
            sender: userId,
            text
        })

        await newMessage.save()

        // Add the message to the chat and save it
        chat.chats.push(newMessage._id)
        await chat.save()

        res.status(201).json({
            id: newMessage._id,
            story: storyId,
            text,
            from: newMessage.sender,
            time: newMessage.time
        })

    } catch (error) {
        res.status(500).json({
            error: error.message
        })
    }
}


exports.likestory = async (req, res) => {
    try {
        const id = req.user.userId
        const storyId = req.params.storyId

        // Search for user in both playerModel and agentModel
        const user = await playerModel.findById(id) || await agentModel.findById(id)
        if (!user) {
            return res.status(404).json({
                error: "user not found"
          })
        }

        // Find the story in the database by its ID
        const story = await storyModel.findById(storyId)
        // Check if the story exists
        if (!story) {
            return res.status(404).json({
                error: "story not found."
            })
        }

        // Check if the user has already liked the story
        if (story.likes.includes(id)) {
            return res.status(400).json({
                error: "You have already liked this story."
            })
        }

        // Add the user's ID to the likes array
        story.likes.push(id)

          // Check if story owner is different from the liker's owner
    if (id !== story.owner.toString()) {
        const owner = await (story.owner instanceof agentModel ? agentModel.findById(story.owner) : playerModel.findById(story.owner))
             if (!owner) {
               return res.status(404).json({
                  message: "story owner not found" 
                 })
             }
       
             const notification = `${user.userName} likes your story`
             const Notification = {
               notification,
               recipient: story.owner,
               recipientModel: owner instanceof agentModel ? 'agent' : 'player'
             }
       
             // Create and save notification
             const message = new notificationModel(Notification)
             await message.save()
       
             // Add the notification to the story.owner's notifications list
             owner.notifications.push(message._id)
             await owner.save()
           }

        // Save the updated story
        await story.save()

        // Return the updated story
        res.status(200).json({
            likes: story.likes.length
        })
    } catch (error) {
         res.status(500).json({
            error: error.message
        })
    }
}


exports.unlikestory = async (req, res) => {
    try {
        const id = req.user.userId

        // Retrieve story ID from request parameters
        const storyId = req.params.storyId

        // Search for user in both playerModel and agentModel
        const user = await playerModel.findById(id) || await agentModel.findById(id)
        if (!user) {
            return res.status(404).json({
                error: "user not found"
            })
        }

        // Find the story in the database by its ID
        const story = await storyModel.findById(storyId)

        // Check if the story exists
        if (!story) {
            return res.status(404).json({
                error: "story not found."
            })
        }

        // Check if the user has already liked the story
        const indexOfUser = story.likes.indexOf(id)

        // to know if the user has not liked the story
        if (indexOfUser === -1) {
            return res.status(400).json({
                error: "You haven't liked this story."
            })
        }

        // Remove the user's ID from the likes array
        story.likes.splice(indexOfUser, 1)

        // Save the updated story
        const updatedstory = await story.save()

        // Return the updated story
        res.status(200).json({
            likes: updatedstory.likes.length
        })
    } catch (error) {
        res.status(500).json({
            error: error.message
        })
    }
}


exports.deletestory = async (req, res) => {
    try {
        const id = req.user.userId

        if (!id) {
            return res.status(401).json({
                error: "Session expired. Please login."
            })
        }

        const storyId = req.params.storyId

        // Find the story by its ID
        const story = await storyModel.findById(storyId)

        // If story is not found, return 404 error
        if (!story) {
            return res.status(404).json({
                error: "Story not found."
            })
        }

        // Check if the user is the owner of the story
        if (story.owner.toString() !== id) {
            return res.status(403).json({
                error: "Unauthorized."
            })
        }

             // Delete media from Cloudinary if it exists
     if (story.story && story.story.length > 0) {
        await Promise.all(story.story.map(async (storyUrl) => {
            const publicId = storyUrl.split("/").pop().split(".")[0]
            // Determine the resource type (image or video)
            const resourceType = storyUrl.includes('.mp4') || storyUrl.includes('.avi') ? 'video' : 'image'
            await cloudinary.uploader.destroy(publicId, { resource_type: resourceType })
          }))      
      }

        // Delete the story
        await storyModel.findByIdAndDelete(storyId)

        // Return success message
        res.status(200).json({
            message: "Story deleted successfully."
        })
    } catch (error) {
        res.status(500).json({
            error: error.message
        })
    }
}