const router = require("express").Router()
const {
    reactOnChat, copyMessage, editMessage, startChat, getChat, sendMessage, getChatmessage, exitGroup, createGroupChat,
    sendVoiceNote, createGroupImage, forwardMessage, blockChat, unblockChat, deleteChat, addMembers,editAdmin,deleteMessage,
    removeMembers} = require("../controllers/chatController")

const upload = require("../media/multer")
const uploader = require("../media/multerFiles")
const authenticate = require("../auth/authenticate")

router.post('/start_chat', authenticate, startChat)
router.post('/send_message', authenticate, uploader.array("media", 30), sendMessage)
router.post('/voice_note', authenticate, upload.single("voice"), sendVoiceNote)
router.post('/group', authenticate, createGroupChat)
router.post('/add_users', authenticate, addMembers)
router.post('/exit', authenticate, exitGroup)
router.post('/editAdmin', authenticate, editAdmin)
router.post('/block', authenticate, blockChat)
router.post('/unblock', authenticate, unblockChat)
router.get('/direct/inbox', authenticate, getChat)
router.get('/direct/m/:chatId', authenticate, getChatmessage)
router.post('/remove_member', authenticate, removeMembers)
router.post('/group_image', authenticate, upload.single("groupImage"), createGroupImage)
router.put('/edit_text', authenticate, editMessage)
router.post('/copy', authenticate, copyMessage)
router.post('/react', authenticate, reactOnChat)
router.post('/forward', authenticate, forwardMessage)
router.delete('/delete_message', authenticate, deleteMessage)
router.delete('/delete_chat', authenticate, deleteChat)

module.exports = router