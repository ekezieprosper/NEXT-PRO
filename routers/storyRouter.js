const router = require("express").Router()
const { createstory, getstory, getAllStories, likestory, unlikestory, deletestory, replyStory } = require("../controllers/storyController")
const uploader = require("../media/multerFiles")
const authenticate = require("../auth/authenticate")



router.post("/create_story", authenticate,  uploader.array('story', 30), createstory)
router.get("/stories",authenticate, getAllStories)
router.get("/story/:storyId",authenticate, getstory)
router.post("/reply_story/:storyId", authenticate, replyStory)
router.post("/like_story/:storyId",authenticate, likestory)
router.post("/unlike_story/:storyId",authenticate, unlikestory)
router.delete("/delete/:storyId",authenticate, deletestory)

module.exports = router