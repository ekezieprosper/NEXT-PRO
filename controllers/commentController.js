const commentModel = require('../models/commentModel')
const playerModel = require("../models/playerModel")
const agentModel = require("../models/agentModel")
const notificationModel = require("../models/notificationModel")
const postModel = require('../models/postModel')
const storyModel = require('../models/stories')
const emoji = require('node-emoji')


exports.newComment = async (req, res) => {
  try {
    const id = req.user.userId
    const postId = req.params.postId
    let { comment } = req.body

    if (!comment) {
      return res.status(400).json({
         message: "input comment" 
        })
    }

    // Fetch user and post
    const user = await playerModel.findById(id) || await agentModel.findById(id)
    if (!user) {
      return res.status(404).json({
         message: "User not found" 
        })
    }

    let post = await postModel.findById(postId) || await storyModel.findById(postId)
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
      time: new Date()
    })

    post.comments.push(newComment._id)

    // Check if post owner is different from the comment owner
    if (id !== post.owner.toString()) {
 const owner = await (post.owner instanceof agentModel ? agentModel.findById(post.owner) : playerModel.findById(post.owner))
      if (!owner) {
        return res.status(404).json({
           message: "Post owner not found" 
          })
      }

      const notification = `${user.userName} commented:${comment} on your post`
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
       error: 'Internal Server Error' 
      })
  }
}



exports.getOnePostComment = async (req, res) => {
  try {
    const id = req.user.userId
    const postId = req.params.postId

    if (!id) {
      return res.status(401).json({
        error: "Session expired. Please log in."
      })
    }

    // Find the post in both models
    let post = await postModel.findById(postId)
    if (!post) {
      post = await storyModel.findById(postId)
    }

    // Check if the post exists
    if (!post) {
      return res.status(404).json({
        message: "Post not found"
      })
    }

    // Retrieve comments for the post
    const comments = await commentModel.findOne({ post: postId })

    res.status(200).json({
      id: comments._id,
      comment: comments.comment
    })
  } catch (error) {
    res.status(500).json({
      error: "Internal server error"
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
    let post = await postModel.findById(postId)
    if (!post) {
      post = await storyModel.findById(postId)
    }

    // Check if the post exists
    if (!post) {
      return res.status(404).json({
        message: "Post not found"
      })
    }

    // Retrieve all comments for the post
    const allComments = await commentModel.find({ post: postId })

    // If no comments found
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
      error: "Internal server error"
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
    const post = await postModel.findById(postId) || await storyModel.findById(postId)
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

    // Check if the user is the owner of the comment
    if (comment.owner.toString() !== id) {
      return res.status(403).json({
        error: "Unauthorized"
      })
    }

    // Update the comment
    comment.comment = newComment
    const updatedComment = await comment.save()

    res.status(200).json(updatedComment.comment)
  } catch (error) {
    res.status(500).json({
      error: "Internal server error"
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
    // Check if the comment exists
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
    let post = await postModel.findOne({ comments: commentId }) || await storyModel.findOne({ comments: commentId })
    //delete comment if found in the comment array of the post
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
      error: "Internal server error"
    })
  }
}