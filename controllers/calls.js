const socketIO = require('socket.io');
const { RTCPeerConnection, RTCSessionDescription, RTCIceCandidate } = require('wrtc');

class Calls {
  constructor(server) {
    this.io = socketIO(server);
    this.peerConnections = new Map();

    this.io.on('connection', (socket) => {
      console.log('New client connected:', socket.id);

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        this.handleDisconnect(socket);
      });

      socket.on('offer', (data) => this.handleOffer(socket, data.offer));
      socket.on('answer', (data) => this.handleAnswer(socket, data.answer));
      socket.on('candidate', (data) => this.handleCandidate(socket, data.candidate));
      socket.on('error', (error) => this.handleError(socket, error));
    });
  }

  async handleOffer(socket, offer) {
    console.log('Received offer:', offer);

    const peerConnection = new RTCPeerConnection();
    this.peerConnections.set(socket.id, peerConnection);

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('candidate', { candidate: event.candidate });
      }
    };

    peerConnection.ontrack = (event) => {
      console.log('Received track:', event.streams[0]);
    };

    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.emit('answer', { answer: peerConnection.localDescription });
  }

  async handleAnswer(socket, answer) {
    console.log('Received answer:', answer);

    const peerConnection = this.peerConnections.get(socket.id);
    if (peerConnection) {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    } else {
      console.error('Peer connection not found for answer');
    }
  }

  async handleCandidate(socket, candidate) {
    console.log('Received ICE candidate:', candidate);

    const peerConnection = this.peerConnections.get(socket.id);
    if (peerConnection) {
      await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } else {
      console.error('Peer connection not found for candidate');
    }
  }

  handleDisconnect(socket) {
    this.peerConnections.delete(socket.id);
  }

  handleError(socket, error) {
    console.error('Socket error:', error);
    socket.emit('error', { error: 'Socket error' });
  }
}

module.exports = Calls