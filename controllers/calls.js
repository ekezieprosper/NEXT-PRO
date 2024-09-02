const socketIO = require('socket.io')
const chatModel = require('../models/chatModel')
const { RTCPeerConnection, RTCSessionDescription, RTCIceCandidate } = require('wrtc')

class Calls {
  constructor(server) {
    this.io = socketIO(server)
    this.peerConnections = new Map()

    this.io.on('connection', (socket) => {
      console.log('New client connected:', socket.id)

      socket.on('disconnect', () => this.handleDisconnect(socket))
      socket.on('offer', (data) => this.handleOffer(socket, data))
      socket.on('answer', (data) => this.handleAnswer(socket, data))
      socket.on('candidate', (data) => this.handleCandidate(socket, data))
      socket.on('error', (error) => this.handleError(socket, error))
    })
  }

  async handleOffer(socket, data) {
    try {
      const { offer, chatId } = data
      console.log('Received offer:', offer)

      const peerConnection = new RTCPeerConnection()
      this.peerConnections.set(socket.id, peerConnection)

      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('candidate', { candidate: event.candidate, chatId })
        }
      }

      peerConnection.ontrack = (event) => {
        console.log('Received track:', event.streams[0])
        this.handleTrack(socket, chatId, event.streams[0])
      }

      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer))
      const answer = await peerConnection.createAnswer()
      await peerConnection.setLocalDescription(answer)

      socket.emit('answer', { answer: peerConnection.localDescription })
    } catch (error) {
      console.error('Error handling offer:', error)
      socket.emit('error', { error: 'Failed to handle offer' })
    }
  }

  async handleAnswer(socket, data) {
    try {
      const { answer } = data
      console.log('Received answer:', answer)

      const peerConnection = this.peerConnections.get(socket.id)
      if (peerConnection) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer))
      } else {
        console.error('Peer connection not found for answer')
      }
    } catch (error) {
      console.error('Error handling answer:', error)
      socket.emit('error', { error: 'Failed to handle answer' })
    }
  }

  async handleCandidate(socket, data) {
    try {
      const { candidate } = data
      console.log('Received ICE candidate:', candidate)

      const peerConnection = this.peerConnections.get(socket.id)
      if (peerConnection) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
      } else {
        console.error('Peer connection not found for candidate')
      }
    } catch (error) {
      console.error('Error handling candidate:', error)
      socket.emit('error', { error: 'Failed to handle candidate' })
    }
  }

  handleTrack(socket, chatId, stream) {
    this.isGroupChat(chatId)
      .then((isGroup) => {
        if (isGroup) {
          this.getGroupMembers(chatId).then((members) => {
            members.forEach((memberId) => {
              const memberSocket = this.getSocketById(memberId)
              if (memberSocket) {
                memberSocket.emit('remoteStream', { id: socket.id, stream })
              }
            })
          })
        } else {
          this.getUserSocketId(chatId)
            .then((targetSocketId) => {
              if (targetSocketId) {
                this.io.to(targetSocketId).emit('remoteStream', { id: socket.id, stream })
              } else {
                socket.emit('error', { error: 'User not found in chat' })
              }
            })
            .catch((error) => {
              console.error('Error getting user socket ID:', error)
              socket.emit('error', { error: 'Failed to get user socket ID' })
            })
        }
      })
      .catch((error) => {
        console.error('Error checking if group chat:', error)
        socket.emit('error', { error: 'Failed to determine chat type' })
      })
  }

  handleDisconnect(socket) {
    const peerConnection = this.peerConnections.get(socket.id)
    if (peerConnection) {
      peerConnection.close()
      this.peerConnections.delete(socket.id)
      this.io.emit('userDisconnected', { socketId: socket.id })
    }
  }

  handleError(socket, error) {
    console.error('Socket error:', error)
    socket.emit('error', { error: 'Server error occurred' })
  }

  async isGroupChat(chatId) {
    try {
      const groupChat = await chatModel.findById(chatId)
      return groupChat.members.length > 2
    } catch (error) {
      console.error('Error checking if group chat:', error)
      throw new Error('Failed to check if group chat')
    }
  }

  async getGroupMembers(chatId) {
    try {
      const groupChat = await chatModel.findById(chatId)
      return groupChat.members.map(member => member.socketId)
    } catch (error) {
      console.error('Error getting group members:', error)
      throw new Error('Failed to get group members')
    }
  }

  async getUserSocketId(chatId) {
    try {
      const personalChat = await chatModel.findById(chatId)
      return personalChat.socketId
    } catch (error) {
      console.error('Error getting user socket ID:', error)
      throw new Error('Failed to get user socket ID')
    }
  }

  getSocketById(socketId) {
    return this.io.sockets.sockets.get(socketId)
  }
}

module.exports = Calls