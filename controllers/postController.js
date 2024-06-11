const postModel = require("../models/postModel")
const cloudinary = require("../media/cloudinary")
const playerModel = require("../models/playerModel")
const agentModel = require("../models/agentModel")
const emoji = require('node-emoji')


exports.createPost = async (req, res) => {
    try {
        const id = req.user.userId
        let {text} = req.body

        let user = await playerModel.findById(id) || await agentModel.findById(id)
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
                error: "No text or post was provided."
            })
        }

         // Process text to convert emoji shortcodes to actual emojis
         if (text) {
            text = emoji.emojify(text)
        }

        // Create a new post
        const post = new postModel({
            text,
            post: media,
            owner: id
        })
        await post.save()

        const response = {
            postId: post._id,
            post: post.post,
            likes: post.likes,
            comments: post.comments
        }

        // Add text to response if it was provided
        if (text) {
            response.text = text
        }
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

        res.status(200).json(post)

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
                error: "session expired.Login"
            })
        }

        const {text} = req.body

        if (!text || text.trim() === '') {
            return res.status(400).json({
                 error: "text is required"
          })
        }

        const post = await postModel.findOne({text: { $regex: new RegExp(text, "i") }})
        if (!post) {
            return res.status(404).json({
                error: `No post with description '${text}' was found`
            })
        }

        res.status(200).json(post)

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
        let user = await playerModel.findById(id) || await agentModel.findById(id)
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
 
        // Save the updated post
        const updatedPost = await post.save()

        // Return the updated post
        res.status(200).json({
            post: updatedPost.likes.length
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
        let user = await playerModel.findById(id) || await agentModel.findById(id)
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
            post: updatedPost.likes.length
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
                error: "Post not found"
            })
        }

    // Check if the user is the owner of the post
        if (post.owner.toString() !== id) {
            return res.status(403).json({
                error: "Unauthorized"
            })
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