const router = require("express").Router()
const { 
    createPost, 
    getPost, 
    getPostByDescription, 
    getAllPosts, 
    likePost, 
    unlikePost, 
    deletePost } = require("../controllers/postController")

const uploader = require("../media/multerFiles")
const authenticate = require("../auth/authenticate")


router.post('/create_post', authenticate, uploader.array('post', 30), createPost)
router.get('/post/:postId', authenticate, getPost)
router.get('/posts', authenticate, getAllPosts)
router.post('/posts/search', authenticate, getPostByDescription)
router.post('/', authenticate, likePost)
router.post('/unlike/:postId', authenticate, unlikePost)
router.delete('/delete/post/:postId', authenticate, deletePost)


module.exports = router