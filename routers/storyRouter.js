const router = require("express").Router()
const { createstory, getstory, getAllStories, likestory, unlikestory, deletestory } = require("../controllers/storyController")
const uploader = require("../media/multerFiles")
const authenticate = require("../auth/authenticate")



router.post("/create_story", authenticate,  uploader.array('story', 30), createstory)
router.get("/story/:storyId",authenticate, getstory)
router.get("/stories",authenticate, getAllStories)
router.post("/like_story/:storyId",authenticate, likestory)
router.post("/unlike_story/:storyId",authenticate, unlikestory)
router.delete("/delete/:storyId",authenticate, deletestory)

module.exports = router