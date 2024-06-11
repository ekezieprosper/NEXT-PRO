// server dependecies
const express = require("express")
const socket = require("socket.io")
const cors = require("cors")
const http = require("http")

// handle routes
const callController = require("./controllers/calls")
const userRouter = require("./routers/userRouter")
const postRouter = require("./routers/postRouter")
const commentRouter = require("./routers/commentRouter")
const chatRouter = require("./routers/chatRouter")
const storyRouter = require("./routers/storyRouter")
const notificationController = require('./controllers/notificationController')

// import database configuration file
require("./config/config")
require("dotenv").config()


const port = process.env.port || 1999
const app = express()
const server = http.createServer(app)

app.use(express.json())
app.use(cors())


global.onlineUsers = new Map()
global.messages = new Map()

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

 new callController(server);

io.on("connection", (socket) => {
  global.chatSocket = socket
  
  socket.on("add-user", (userId) => {
    messages.set(userId, socket.id)
  })

  socket.on("send-msg", (data) => {
    const sendUserSocket = messages.get(data.to)
    if (sendUserSocket) {
      socket.to(sendUserSocket).emit("msg-recieve", data.msg)
      
      // Sending a notification to the receiver
      notificationController.sendNotification(data.to, "You have a new message!", messages)
    }
  })

  socket.on("new-user", (data) => {
    onlineUsers.set(data.userId, data)
    // onlineUsers.set("newUser", data)
  })

socket.on("get-users", () => {
  const allUsers = Array.from(onlineUsers.values())
  if (allUsers.length > 0) {
    socket.emit("users-recieve", allUsers)
  }
})

//  retrieving stored notifications
  socket.on("get-notifications", (userId) => {
    const userNotifications = notificationController.getNotifications(userId)
    socket.emit("notifications-recieve", userNotifications)
  })

  // Clean up when a user disconnects
  socket.on("disconnect", () => {
    messages.forEach((value, key) => {
      if (value === socket.id) {
        messages.delete(key)
      }
    })
    if (socket.userId && onlineUsers.has(socket.userId)) {
      onlineUsers.delete(socket.userId)
    }
  })
})

server.listen(port, () => {
  console.log(`server is active on port: ${port}`)
})
