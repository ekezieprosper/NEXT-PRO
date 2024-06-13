const express = require("express")
const socket = require("socket.io")
const cors = require("cors")
const http = require("http")

const CallsController = require("./controllers/calls")
const notificationController = require('./controllers/notificationController')
const userRouter = require("./routers/userRouter")
const postRouter = require("./routers/postRouter")
const commentRouter = require("./routers/commentRouter")
const chatRouter = require("./routers/chatRouter")
const storyRouter = require("./routers/storyRouter")

require("./config/config")
require("dotenv").config()

const port = process.env.PORT || 1999
const app = express()
const server = http.createServer(app)

app.use(express.json())
app.use(cors())

// Routers
app.use("/elitefootball", userRouter)
app.use("/elitefootball", postRouter)
app.use("/elitefootball", commentRouter)
app.use("/elitefootball", chatRouter)
app.use("/elitefootball", storyRouter)

const io = socket(server, {
  cors: {
    origin: "*",
    credentials: true,
  },
})

new CallsController(server)

io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`)

  socket.on("add-user", (userId) => {
    messages.set(userId, socket.id)
  })

  socket.on("send-msg", (data) => {
    const sendUserSocket = messages.get(data.to)
    if (sendUserSocket) {
      socket.to(sendUserSocket).emit("msg-recieve", data.msg)
      
      // Example notification sending
      notificationController.sendNotification(data.to, "You have a new message!", messages)
    }
  })

  socket.on("new-user", (data) => {
    onlineUsers.set(data.userId, data)
  })

  socket.on("get-users", () => {
    const allUsers = Array.from(onlineUsers.values())
    if (allUsers.length > 0) {
      socket.emit("users-recieve", allUsers)
    }
  })

  socket.on("get-notifications", (userId) => {
    const userNotifications = notificationController.getNotifications(userId)
    socket.emit("notifications-recieve", userNotifications)
  })

  socket.on("disconnect", () => {
    messages.forEach((value, key) => {
      if (value === socket.id) {
        messages.delete(key)
      }
    })

    if (socket.userId && onlineUsers.has(socket.userId)) {
      onlineUsers.delete(socket.userId)
    }

    console.log(`Socket disconnected: ${socket.id}`)
  })
})

server.listen(port, () => {
  console.log(`Server is active on port: ${port}`)
})