const router = require("express").Router()
const { getPost, deletePost, getPostByDescription, getAllPosts, likePost, unlikePost, createPost } = require("../controllers/postController")
const uploader = require("../media/multerFiles")
const authenticate = require("../auth/authenticate")


router.post('/create_post',authenticate, uploader.array('post', 30), createPost)
router.get('/post/:postId',authenticate, getPost)
router.get('/posts',authenticate, getAllPosts)
router.get('/post',authenticate, getPostByDescription)
router.post('/like/:postId',authenticate, likePost)
router.post('/unlike/:postId',authenticate, unlikePost)
router.delete('/delete/post/:postId',authenticate, deletePost)


module.exports = router
