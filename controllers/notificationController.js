const WebSocket = require('ws')
const Notification = require('../models/notificationModel')
const playerModel = require('../models/playerModel')
const agentModel = require('../models/agentModel')
const EventEmitter = require('events')

class notificationController extends EventEmitter {
  constructor(server) {
    super()
    this.wss = new WebSocket.Server({ server })
    this.clients = {}
    this.notifications = new Map()

    this.wss.on('connection', (ws) => {
      this.handleConnection(ws)
    })
  }

  handleConnection(ws) {
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message)

        if (data.type === 'userId') {
          this.clients[data.userId] = ws
          ws.userId = data.userId
          this.sendToClient(ws, { type: 'init', time: new Date() })
          return
        }

        switch (data.type) {
          case 'new_post':
            await this.saveNotification('new_post_notification', data.data)
            this.broadcast({ type: 'new_post_notification', data: data.data })
            break
          case 'new_story':
            await this.saveNotification('new_story_notification', data.data)
            this.broadcast({ type: 'new_story_notification', data: data.data })
            break
          case 'new_like':
          case 'new_comment':
          case 'follow':
          case 'unfollow':
            await this.handleUserActionNotification(data.type, data.data)
            break
          case 'new_chat_message':
            await this.handleNewChatMessage(data.data)
            break
          default:
            console.warn(`Unhandled message type: ${data.type}`)
            break
        }
      } catch (error) {
        console.error('Error handling message:', error)
      }
    })

    ws.on('close', () => {
      if (ws.userId) {
        delete this.clients[ws.userId]
      }
    })

    ws.on('error', (error) => {
      console.error('WebSocket error:', error)
    })
  }

  async handleUserActionNotification(actionType, data) {
    try {
      const user = await playerModel.findById(data.userId) || await agentModel.findById(data.userId)
      await this.saveNotification(`${actionType}_notification`, data)
      this.sendToUser(user._id.toString(), { type: `${actionType}_notification`, data })
    } catch (error) {
      console.error('Error handling user action notification:', error)
    }
  }

  async handleNewChatMessage(data) {
    try {
      const { userId, message } = data
      await this.saveNotification('new_chat_message_notification', data)
      this.sendToUser(userId.toString(), { type: 'new_chat_message_notification', data: message })
    } catch (error) {
      console.error('Error handling new chat message notification:', error)
    }
  }

  async saveNotification(type, data) {
    try {
      const notification = new Notification({ type, data })
      await notification.save()
    } catch (error) {
      console.error('Error saving notification:', error)
    }
  }

  sendToUser(userId, message) {
    const ws = this.clients[userId]
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message))
    } else {
      console.warn(`WebSocket not open for user ${userId}`)
      if (!this.notifications.has(userId)) {
        this.notifications.set(userId, [])
      }
      this.notifications.get(userId).push(message)
    }
  }

  broadcast(message) {
    Object.values(this.clients).forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message))
      }
    })
  }

  sendToClient(ws, message) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message))
    }
  }
}

module.exports = notificationController