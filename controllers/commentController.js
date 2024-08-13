const commentModel = require('../models/commentModel')
const playerModel = require("../models/playerModel")
const agentModel = require("../models/agentModel")
const notificationModel = require("../models/notificationModel")
const postModel = require('../models/postModel')
const emoji = require('node-emoji')


exports.newComment = async (req, res) => {
  try {
    const id = req.user.userId
    const postId = req.params.postId
    let { comment } = req.body

    if (!comment) {
      return res.status(400).json({
         message: "This feild can't be empty" 
        })
    }

    // Fetch user and post
    const user = await playerModel.findById(id) || await agentModel.findById(id)
    if (!user) {
      return res.status(404).json({
         message: "User not found" 
        })
    }

    const post = await postModel.findById(postId)
    if (!post) {
      return res.status(404).json({
         message: "Post not found" 
        })
    }

    comment = emoji.emojify(comment)

    // Create new comment
    const newComment = new commentModel({
      comment,
      owner: id,
      post: postId,
      time: new Date()
    })

    post.comments.push(newComment._id)

    if (id !== post.owner.toString()) {
 const owner = await (post.owner instanceof agentModel ? agentModel.findById(post.owner) : playerModel.findById(post.owner))
      if (!owner) {
        return res.status(404).json({
           message: "Post owner not found" 
        })
      }

      const notification = `${user.userName} commented on your post :${comment}`
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

    await Promise.all([
      post.save(), newComment.save()
    ])

    res.status(201).json({ 
      comment: newComment.comment 
    })
  } catch (error) {
    res.status(500).json({
       error: error.message
      })
  }
}


exports.getOnePostComment = async (req, res) => {
  try {
    const id = req.user.userId
    const { commentId } = req.params

    if (!id) {
      return res.status(401).json({
        error: "Session expired. Please log in.",
      })
    }

    // Check if the post exists and has the comment in its comments field
    const post = await postModel.findOne({ comments: commentId })
    if (!post) {
      return res.status(404).json({
        message: "Post does not have any comment yet"
      })
    }

    // Retrieve the comment associated with the post or story
    const comment = await commentModel.findById(commentId)
    if (!comment) {
      return res.status(404).json({
        message: "Comment not found",
      })
    }

    res.status(200).json({
      id: comment._id,
      comment: comment.comment,
    })
  } catch (error) {
    res.status(500).json({
      error: error.message
    })
  }
}


exports.getAllPostComment = async (req, res) => {
  try {
    const id = req.user.userId
    const postId = req.params.postId

    if (!id) {
      return res.status(401).json({
        error: "Session expired. Please log in."
      })
    }

    // Find the post in both models
    const post = await postModel.findById(postId)
    if (!post) {
      return res.status(404).json({
        message: "Post not found"
      })
    }

    // Retrieve all comments for the post
    const allComments = await commentModel.find({post: postId})
    if (allComments.length === 0) {
      return res.status(404).json({
        message: "No comments yet"
      })
    }

    const commentsData = allComments.map(comment => ({
      id: comment._id,
      comment: comment.comment
    }))

    res.status(200).json(commentsData)
  } catch (error) {
    res.status(500).json({
      error: error.message
    })
  }
}


exports.editComment = async (req, res) => {
  try {
    const id = req.user.userId
    const postId = req.params.postId
    const { commentId, newComment } = req.body

    // Validate input
    if (!newComment) {
      return res.status(400).json({
        error: "change must be made, if not comment wont be edited"
      })
    }

    // Find the post
    const post = await postModel.findById(postId)
    if (!post) {
      return res.status(404).json({
        error: "Post not found."
      })
    }

    // Find the comment
    const comment = await commentModel.findById(commentId)
    if (!comment) {
      return res.status(404).json({
        error: "Comment not found."
      })
    }

    if (comment.owner.toString() !== id) {
      return res.status(403).json({
        error: "Unauthorized"
      })
    }

    comment.comment = newComment
    const updatedComment = await comment.save()

    res.status(200).json(updatedComment.comment)
    
  } catch (error) {
    res.status(500).json({
      error: error.message
    })
  }
}


exports.deleteCommentOnPost = async (req, res) => {
  try {
    const id = req.user.userId
    const commentId = req.params.commentId

    if (!id) {
      return res.status(401).json({
        error: "Session expired. Please log in."
      })
    }

    // Find the comment by ID
    const comment = await commentModel.findById(commentId)
    if (!comment) {
      return res.status(404).json({
        message: "Comment not found"
      })
    }

    if (comment.owner.toString() !== id) {
      return res.status(403).json({
        message: "Unauthorized"
      })
    }

    // Find commentId in the postModel
    const post = await postModel.findOne({ comments: commentId })
    if (post) {
      post.comments.pull(commentId)
      await post.save()
    }

    // Delete the comment
    await commentModel.findByIdAndDelete(commentId)

    res.status(200).json({
      message: "deleted successfully"
    })
  } catch (error) {
    res.status(500).json({
      error: error.message
    })
  }
}