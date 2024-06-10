const WebSocket = require('ws')
const Notification = require('../models/notificationModel')
const playerModel = require('../models/playerModel')
const agentModel = require('../models/agentModel')
const EventEmitter = require('events')

class NotificationController extends EventEmitter {
  constructor(server) {
    super()
    this.wss = new WebSocket.Server({ server })
    this.clients = {}

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
      let user = await playerModel.findOne({ _id: data.userId }) || await agentModel.findOne({ _id: data.userId })

      if (!user) {
        console.error('User not found.')
        return
      }

      await this.saveNotification(`${actionType}_notification`, data)
      this.sendToUser(user._id.toString(), { type: `${actionType}_notification`, data })
    } catch (error) {
      console.error('Error handling user action notification:', error)
    }
  }

  async saveNotification(type, data) {
    try {
      const notification = new Notification({
        type: type,
        data: data,
      })
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
      // Store the notification if the user is not online
      if (!global.notifications.has(userId)) {
        global.notifications.set(userId, [])
      }
      global.notifications.get(userId).push(message)
    }
  }

  // Additional method to send notification to all online users
  sendToAllOnlineUsers(message) {
    Object.values(this.clients).forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message))
      }
    })
  }
}

module.exports = NotificationController
