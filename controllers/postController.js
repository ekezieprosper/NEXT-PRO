const postModel = require("../models/postModel")
const cloudinary = require("../media/cloudinary")
const playerModel = require("../models/playerModel")
const agentModel = require("../models/agentModel")
const fs = require("fs")
const notificationModel = require("../models/notificationModel")
const emoji = require('node-emoji')
const date = new Date().toLocaleString('en-NG', {day: '2-digit', month: 'short'})
const createdOn = `${date}`



exports.createPost = async (req, res) => {
    try {
        const id = req.user.userId
        let { description } = req.body

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
                return res.status(500).json({
                    error: "Error uploading files."
                })
            }
        }

        // Validate that at least one of description or media is present
        if (!description && media.length === 0) {
            return res.status(400).json({
                error: "No description or post was provided."
            })
        }

        // Process description to convert emoji shortcodes to actual emojis
        if (description) {
            description = emoji.emojify(description)
        }

        // Create a new post
        const post = new postModel({
            description,
            post: media,
            owner: id
        })
        await post.save()

        const response = {
            postId: post._id,
            post: post.post,
            likes: post.likes,
            comments: post.comments,
            date: post.Date
        }

        // Add description to response if it was provided
        if (description) {
            response.description = description
        }

        // Notify all followers about the new post
        const followers = user.followers
        await Promise.all(followers.map(async followerId => {
            const follower = await playerModel.findById(followerId) || await agentModel.findById(followerId)
            if (follower) {
                const recipientModel = follower instanceof agentModel ? 'agent' : 'player'
                const notificationData = {
                    notification: `${user.userName} just created a new post: ${post._id}.         ${createdOn} `,
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
            error: "Internal server error"
        })
    }
}


exports.getPost = async (req, res) => {
    try {
        const id = req.user.userId
        const postId = req.params.postId

        if (!id) {
            return res.status(404).json({
                error: "Session expired. Please login."
            })
        }

        const post = await postModel.findById(postId)

        if (!post) {
            return res.status(404).json({
                message: "post has been deleted"
            })
        }

        res.status(200).json({
            post: post.post,
            description: post.description,
            likes: post.likes,
            comments: post.comments,
            owner: post.owner,
            Date: post.Date,
        })

    } catch (error) {
        res.status(500).json({
            error: "Internal server error"
        })
    }
}


exports.getAllPosts = async (req, res) => {
    try {
        const id = req.user.userId

        if (!id) {
            return res.status(404).json({
                error: "session expired.Login"
            })
        }

        const posts = await postModel.find()

        if (!posts) {
            return res.status(404).json({
                error: "no post found"
            })
        }
        res.status(200).json(posts)

    } catch (error) {
        res.status(500).json({
            error: "Internal server error"
        })
    }
}


exports.getPostByDescription = async (req, res) => {
    try {
        const id = req.user.userId

        if (!id) {
            return res.status(404).json({
                error: "Session expired. Login"
            })
        }

        const { description } = req.body

        if (!description || description.trim() === '') {
            return res.status(400).json({
                error: "Description is required"
            })
        }

        // Use find instead of findOne to return all matching posts
        const posts = await postModel.find({ description: { $regex: new RegExp(description, "i") } })

        if (posts.length === 0) {
            return res.status(404).json({
                error: `No posts with description '${description}' was found`
            })
        }

        res.status(200).json({
            posts: posts.map(post => ({
                post: post.post,
                description: post.description,
                likes: post.likes,
                comments: post.comments,
                owner: post.owner,
                Date: post.Date
            }))
        })

    } catch (error) {
        res.status(500).json({
            error: "Internal server error"
        })
    }
}


exports.likePost = async (req, res) => {
    try {
        const id = req.user.userId
        const postId = req.params.postId

        // Search for user in both playerModel and agentModel
        const user = await playerModel.findById(id) || await agentModel.findById(id)
        if (!user) {
            return res.status(400).json({
                error: "No user found."
            })
        }

        // Find the post in the database by its ID
        const post = await postModel.findById(postId)
        if (!post) {
            return res.status(404).json({
                error: "Post not found."
            })
        }

        // Check if the user has already liked the post
        if (post.likes.includes(id)) {

            // Check if userId is included, not the entire user object
            return res.status(400).json({
                error: "You have already liked this post."
            })
        }

        // Add the user's ID to the likes array
        post.likes.push(id)


        // Check if post owner is different from the liker's owner
        if (id !== post.owner.toString()) {
            const owner = await (post.owner instanceof agentModel ? agentModel.findById(post.owner) : playerModel.findById(post.owner))
            if (!owner) {
                return res.status(404).json({
                    message: "Post owner not found"
                })
            }

            const notification = `${user.userName} likes your post`
            const Notification = {
                notification,
                recipient: post.owner,
                recipientModel: owner instanceof agentModel ? 'agent' : 'player'
            }

            // Create and save notification
            const message = new notificationModel(Notification)
            await message.save()

            // Add the notification to the post.owner's notifications list
            owner.notifications.push(message._id)
            await owner.save()
        }

        // Save the updated post
        const updatedPost = await post.save()

        // Return the updated post
        res.status(200).json({
            likes: updatedPost.likes.length
        })
    } catch (error) {
        res.status(500).json({
            error: "Internal server error"
        })
    }
}


exports.unlikePost = async (req, res) => {
    try {
        const id = req.user.userId
        const postId = req.params.postId

        // Search for user in both playerModel and agentModel
        const user = await playerModel.findById(id) || await agentModel.findById(id)
        if (!user) {
            return res.status(400).json({
                error: "No user found."
            })
        }

        // Find the post in the database by its ID
        const post = await postModel.findById(postId)
        if (!post) {
            return res.status(404).json({
                error: "Post not found."
            })
        }

        // Check if the user has already liked the post
        const indexOfUser = post.likes.indexOf(id)

        // to know if the user has not liked the post
        if (indexOfUser === -1) {
            return res.status(400).json({
                error: "You haven't liked this post."
            })
        }

        // Remove the user's ID from the likes array
        post.likes.splice(indexOfUser, 1)

        // Save the updated post
        const updatedPost = await post.save()

        // Return the updated post
        res.status(200).json({
            likes: updatedPost.likes.length
        })
    } catch (error) {
        res.status(500).json({
            error: "Internal server error"
        })
    }
}


exports.deletePost = async (req, res) => {
    try {
        const id = req.user.userId
        const postId = req.params.postId

        // Find the post by its ID
        const post = await postModel.findById(postId)
        if (!post) {
            return res.status(404).json({
                error: "Post was deleted"
            })
        }

        // Check if the user is the owner of the post
        if (post.owner.toString() !== id) {
            return res.status(403).json({
                error: "Unauthorized"
            })
        }

          // Delete media from Cloudinary if it exists
     if (post.post && post.post.length > 0) {
        await Promise.all(post.post.map(async (postUrl) => {
            const publicId = postUrl.split("/").pop().split(".")[0];
            // Determine the resource type (image or video)
            const resourceType = postUrl.includes('.mp4') || postUrl.includes('.avi') ? 'video' : 'image';
            await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
          }))  
      }

        // Delete the post
        await postModel.findByIdAndDelete(postId)

        // Return success message
        res.status(200).json({
            message: "Post deleted successfully",
        })
    } catch (error) {
        res.status(500).json({
            error: 'unable to delete post.Bad internet conection'
        })
    }
}