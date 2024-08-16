const router = require('express').Router()

const { newComment, getOnePostComment, getAllPostComment, deleteCommentOnPost, editComment } = require("../controllers/commentController")
const authenticate = require("../auth/authenticate")



router.post('/comment/:postId', authenticate, newComment)
router.put("/edit/comment/:postId", authenticate, editComment)
router.get('/:commentId', authenticate, getOnePostComment)
router.get('/post/:postId/comments', authenticate, getAllPostComment)
router.delete('/delete_comment/:commentId', authenticate, deleteCommentOnPost)



module.exports = router