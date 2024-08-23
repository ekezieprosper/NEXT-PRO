const router = require("express").Router()
const {
    reactOnChat, copyMessage, editMessage, startChat, getChat, sendMessage, getChatmessage, exitGroup, createGroupChat,
    sendVoiceNote, createGroupImage, forwardMessage, blockChat, unblockChat, deleteChat, addMembers,editAdmin,deleteMessage,
    removeMembers, deleteGroupImg} = require("../controllers/chatController")

const upload = require("../media/multer")
const uploader = require("../media/multerFiles")
const authenticate = require("../auth/authenticate")

router.post('/start_chat',authenticate, startChat)
router.post('/group', authenticate, createGroupChat)
router.post('/group_image', authenticate, upload.single("groupImage"), createGroupImage)
router.delete('/groupImg/:groupId', authenticate, deleteGroupImg)
router.get('/direct/inbox', authenticate, getChat)
router.post('/chat/message', authenticate, uploader.array("media", 30), sendMessage)
router.post('/chat/voice', authenticate, upload.single("voice"), sendVoiceNote)
router.put('/edit_text', authenticate, editMessage)
router.post('/copy', authenticate, copyMessage)
router.post('/react', authenticate, reactOnChat)
router.get('/direct/m/:chatId', authenticate, getChatmessage)
router.post('/block', authenticate, blockChat)
router.post('/unblock', authenticate, unblockChat)
router.delete('/delete_message', authenticate, deleteMessage)
router.post('/add_users', authenticate, addMembers)
router.post('/forward', authenticate, forwardMessage)
router.post('/editAdmin', authenticate, editAdmin)
router.post('/remove_member', authenticate, removeMembers)
router.post('/exit', authenticate, exitGroup)
router.delete('/delete_chat', authenticate, deleteChat)

module.exports = router