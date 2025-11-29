import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import Message from '../models/Message';

export const setupSocketHandlers = (io: SocketIOServer) => {
  // Authenticate socket connections
  io.use(async (socket: Socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
      (socket as any).userId = decoded.userId;
      (socket as any).userRole = decoded.role;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: Socket) => {
    console.log('User connected:', socket.id, 'Role:', (socket as any).userRole);
    const userId = (socket as any).userId;
    const userRole = (socket as any).userRole;

    // Join session room
    socket.on('join-session', ({ sessionId }) => {
      const roomName = `session-${sessionId}`;
      socket.join(roomName);
      console.log(`User ${userId} (${userRole}) joined session ${sessionId}`);
      
      // Notify others in the room
      socket.to(roomName).emit('user-joined', {
        userId,
        userRole,
        timestamp: new Date()
      });
    });

    // Join voice session
    socket.on('join-voice-session', ({ sessionId }) => {
      const roomName = `voice-${sessionId}`;
      socket.join(roomName);
      console.log(`User ${userId} joined voice session ${sessionId}`);
      
      socket.to(roomName).emit('user-joined-voice', {
        userId,
        userRole,
        timestamp: new Date()
      });
    });

    // Leave voice session
    socket.on('leave-voice-session', ({ sessionId }) => {
      const roomName = `voice-${sessionId}`;
      socket.leave(roomName);
      console.log(`User ${userId} left voice session ${sessionId}`);
      
      socket.to(roomName).emit('user-left-voice', {
        userId,
        userRole,
        timestamp: new Date()
      });
    });

    // Handle chat messages - FIXED: Prevent message echoing
    socket.on('send-message', async ({ sessionId, text, timestamp }) => {
      try {
        const senderType = userRole === 'therapist' ? 'therapist' : 'user';
        
        const message = await Message.create({
          sessionId,
          senderId: userId,
          senderType: senderType,
          text,
          timestamp: timestamp || new Date(),
        });

        const messageData = {
          _id: message._id,
          senderId: userId,
          senderType: senderType,
          text: message.text,
          timestamp: message.timestamp,
        };

        // Broadcast to others in the room, NOT back to sender
        socket.broadcast.to(`session-${sessionId}`).emit('new-message', messageData);
        
        // Send confirmation back to sender only with isOwn flag
        socket.emit('new-message', {
          ...messageData,
          isOwn: true
        });
        
        console.log(`Message sent by ${senderType} in session ${sessionId}`);
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('message-error', { error: 'Failed to send message' });
      }
    });

    // ==================== SESSION ENDING EVENTS ====================

    socket.on('end-session', async ({ sessionId, endedBy, endedByRole }) => {
      try {
        const roomName = `session-${sessionId}`;
        const voiceRoomName = `voice-${sessionId}`;
        
        console.log(`Session ${sessionId} ended by ${endedByRole} ${endedBy}`);
        
        // Notify all participants in both rooms
        io.to(roomName).to(voiceRoomName).emit('session-ended', {
          sessionId,
          endedBy,
          endedByRole,
          timestamp: new Date(),
          message: `${endedByRole} has ended the session`
        });

        console.log(`Session ended notification sent for session ${sessionId}`);
        
      } catch (error) {
        console.error('Error ending session:', error);
        socket.emit('session-error', { error: 'Failed to end session' });
      }
    });

    // ==================== RATING EVENTS ====================

    socket.on('submit-rating', async ({ sessionId, rating, ratedBy, ratedByRole }) => {
      try {
        console.log(`Rating received for session ${sessionId}: ${rating} stars by ${ratedByRole}`);
        
        // Broadcast rating to other participants
        socket.broadcast.to(`session-${sessionId}`).emit('rating-submitted', {
          sessionId,
          rating,
          ratedBy,
          ratedByRole,
          timestamp: new Date()
        });

        console.log(`Rating notification sent for session ${sessionId}`);
        
      } catch (error) {
        console.error('Error submitting rating:', error);
        socket.emit('rating-error', { error: 'Failed to submit rating' });
      }
    });

    // ==================== WEBRTC SIGNALING EVENTS ====================

    socket.on('voice-offer', ({ sessionId, offer, userId: targetUserId }) => {
      console.log('Voice offer received for session:', sessionId);
      socket.to(`voice-${sessionId}`).emit('voice-offer', {
        offer,
        userId: userId,
        targetUserId
      });
    });

    socket.on('voice-answer', ({ sessionId, answer, userId: targetUserId }) => {
      console.log('Voice answer received for session:', sessionId);
      socket.to(`voice-${sessionId}`).emit('voice-answer', {
        answer,
        userId: userId,
        targetUserId
      });
    });

    socket.on('ice-candidate', ({ sessionId, candidate, userId: targetUserId }) => {
      socket.to(`voice-${sessionId}`).emit('ice-candidate', {
        candidate,
        userId: userId,
        targetUserId
      });
    });

    // ==================== VOICE MASKING EVENTS ====================

    socket.on('toggle-voice-mask', ({ sessionId, enabled }) => {
      socket.to(`voice-${sessionId}`).emit('voice-mask-toggled', {
        userId,
        enabled,
        timestamp: new Date()
      });
    });

    // ==================== AUDIO STATE EVENTS ====================

    socket.on('audio-state-update', ({ sessionId, isMuted, isSpeaking }) => {
      socket.to(`voice-${sessionId}`).emit('audio-state-update', {
        userId,
        isMuted,
        isSpeaking,
        timestamp: new Date()
      });
    });

    // Audio session events (compatibility with existing code)
    socket.on('start-audio', ({ sessionId }) => {
      io.to(`session-${sessionId}`).emit('audio-started', { userId });
    });

    socket.on('end-audio', ({ sessionId }) => {
      io.to(`session-${sessionId}`).emit('audio-ended', { userId });
    });

    socket.on('toggle-mic', ({ sessionId, isMuted }) => {
      io.to(`session-${sessionId}`).emit('audio-state-change', {
        userId,
        type: 'mic',
        isMuted,
      });
    });

    socket.on('toggle-speaker', ({ sessionId, isMuted }) => {
      io.to(`session-${sessionId}`).emit('audio-state-change', {
        userId,
        type: 'speaker',
        isMuted,
      });
    });

    // Typing indicators
    socket.on('typing', ({ sessionId, isTyping }) => {
      socket.to(`session-${sessionId}`).emit('user-typing', {
        userId,
        isTyping,
      });
    });

    // Presence
    socket.on('user-online', () => {
      socket.broadcast.emit('presence-change', {
        userId,
        status: 'online',
      });
    });

    socket.on('user-away', () => {
      socket.broadcast.emit('presence-change', {
        userId,
        status: 'away',
      });
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      socket.broadcast.emit('presence-change', {
        userId,
        status: 'offline',
      });
    });
  });
};