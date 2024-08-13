const express = require("express")
const socket = require("socket.io")
const cors = require("cors")
const http = require("http")

const Calls = require("./controllers/calls")
const userRouter = require("./routers/userRouter")
const postRouter = require("./routers/postRouter")
const commentRouter = require("./routers/commentRouter")
const chatRouter = require("./routers/chatRouter")
const storyRouter = require("./routers/storyRouter")
const notificationRouter = require("./routers/notificationRouter")


require("./config/config")
require("dotenv").config()

const port = process.env.port || 1999
const app = express()
const server = http.createServer(app)

app.use(express.json())
app.use(cors())

// Routers
app.use(userRouter)
app.use(postRouter)
app.use(chatRouter)
app.use(storyRouter)
app.use(notificationRouter)
app.use(commentRouter)


const io = socket(server, {
  cors: {
    origin: "*",
    credentials: true,
  },
})

new Calls(server)

const messages = new Map()
const onlineUsers = new Map()

io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`)

  socket.on("add-user", (userId) => {
    messages.set(userId, socket.id)
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


  socket.on("call-user", (data) => {
    const sendUserSocket = messages.get(data.to)
    if (sendUserSocket) {
      socket.to(sendUserSocket).emit("receive-call", {
        signal: data.signalData,
        from: data.from,
        callType: data.callType
      })
    }
  })

  socket.on("answer-call", (data) => {
    const sendUserSocket = messages.get(data.to)
    if (sendUserSocket) {
      socket.to(sendUserSocket).emit("call-accepted", { signal: data.signalData })
    }
  })

  socket.on("end-call", (data) => {
    const sendUserSocket = messages.get(data.to)
    if (sendUserSocket) {
      socket.to(sendUserSocket).emit("call-ended")
    }
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
