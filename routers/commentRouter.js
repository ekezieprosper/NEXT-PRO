const router = require('express').Router()

const {newComment,getOnePostComment,getAllPostComment,deleteCommentOnPost, editComment} = require("../controllers/commentController")
const authenticate = require("../auth/authenticate")



router.post('/comment/:postId',authenticate, newComment)
router.put("/edit/comment/:postId",authenticate, editComment)
router.get('/comment/:postId',authenticate, getOnePostComment) 
router.get('/post/:postId/comments',authenticate, getAllPostComment)
router.delete('/delete_comment/:commentId',authenticate, deleteCommentOnPost)
// router.delete('/delete_comment/:postId/:commentId',authenticate, deleteCommentOnPost)


module.exports = router




