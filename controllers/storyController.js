const storyModel = require("../models/stories")
const cloudinary = require("../media/cloudinary")
const playerModel = require("../models/playerModel")
const agentModel = require("../models/agentModel")
const emoji = require('node-emoji')
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
                    return result.secure_url
                }))
            } catch (uploadError) {
                return res.status(500).json({
                    error: "Error uploading files."
                })
            }
        }

        // Validate that at least one of text or media is present
        if (!text && media.length === 0) {
            return res.status(400).json({
                error: "No text or story was provided."
            })
        }

        // Process text to convert emoji shortcodes to actual emojis
        if (text) {
            text = emoji.emojify(text)
        }
   // Create a new story
   const story = new storyModel({
    text,
    story: media,
    owner: id
    })
    await story.save()

    const response = {
       id: story._id,
        story: story.story,
        likes: story.likes,
       comments: story.comments,
        views: story.views,
       time: story.time
    }

    // Add text to response if it was provided
        if (text) {
    response.text = text
    }

        res.status(201).json(response)

        // Notify all followers about the new story
        const followers = user.followers
        await Promise.all(followers.map(async followerId => {
            const follower = await playerModel.findById(followerId) || await agentModel.findById(followerId)
            if (follower) {
                const recipientModel = follower instanceof agentModel ? 'agent' : 'player'
                const notificationData = {
                    notification: `${user.userName} recently added to ${user.gender === 'male' ? 'his' : 'her'} story: ${story._id}.`,
                    recipient: followerId,
                    recipientModel: recipientModel
                }
                const message = new notificationModel(notificationData)
                await message.save()

                follower.notifications.push(message._id)
                await follower.save()
            }
        }))

    } catch (error) {
        res.status(500).json({
            error: "Internal server error"
        })
    }
}


exports.getstory = async (req, res) => {
    try {
        const id = req.user.userId

        let user = await playerModel.findById(id) || await agentModel.findById(id)
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

        const timeCreated = new Date(story.date)
        const expiresIn = new Date(timeCreated.getTime() + 24 * 60 * 60 * 1000)
        const currentTime = new Date()

        if (currentTime > expiresIn) {
            await storyModel.deleteOne({ _id: story._id })

            return res.status(410).json(null)
        }

        if (id !== story.owner.toString() && !story.views.includes(id)) {
            story.views.push(id)
            await story.save()
        }

        res.status(200).json(story)

    } catch (error) {
        res.status(500).json({
            error: "Internal server error"
        })
    }
}


exports.getAllstorys = async (req, res) => {
    try {
        const id = req.user.userId

        let user = await playerModel.findById(id) || await agentModel.findById(id)
        if (!user) {
            return res.status(400).json({
                error: "No user found."
            })
        }

        const story = await storyModel.find()

        if (!story) {
            return res.status(200).json(null)
        }

        res.status(200).json(story)

    } catch (error) {
        res.status(500).json({
            error: "Internal server error"
        })
    }
}


exports.likestory = async (req, res) => {
    try {
        const id = req.user.userId
        const storyId = req.params.storyId

        // Search for user in both playerModel and agentModel
        let user = await playerModel.findById(id) || await agentModel.findById(id)
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
            error: "Internal server error"
        })
    }
}


exports.unlikestory = async (req, res) => {
    try {
        const id = req.user.userId

        // Retrieve story ID from request parameters
        const storyId = req.params.storyId

        // Search for user in both playerModel and agentModel
        let user = await playerModel.findById(id) || await agentModel.findById(id)
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
            error: "Internal server error"
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

        // Delete the story
        await storyModel.findByIdAndDelete(storyId)

        // Return success message
        res.status(200).json({
            message: "Story deleted successfully."
        })
    } catch (error) {
        res.status(500).json({
            error: "Internal server error"
        })
    }
}