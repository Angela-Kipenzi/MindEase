import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  private socket: Socket | null = null;

  connect(token: string) {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  // ==================== SESSION EVENTS ====================

  joinSession(sessionId: string) {
    this.socket?.emit('join-session', { sessionId });
    console.log('Joining session:', sessionId);
  }

  leaveSession(sessionId: string) {
    this.socket?.emit('leave-session', { sessionId });
  }

  // Send a message in a session
  sendMessage(sessionId: string, text: string) {
    console.log('Sending message to session:', sessionId, text);
    this.socket?.emit('send-message', {
      sessionId,
      text,
      timestamp: new Date().toISOString(),
    });
  }

  // Listen for incoming messages
  onMessage(callback: (message: any) => void) {
    this.socket?.on('new-message', callback);
  }

  // Remove message listener
  offMessage() {
    this.socket?.off('new-message');
  }

  // ==================== SESSION ENDING EVENTS ====================

  // End session for all participants
  endSession(sessionId: string, endedBy: string, endedByRole: 'user' | 'therapist') {
    this.socket?.emit('end-session', { sessionId, endedBy, endedByRole });
    console.log('Ending session:', sessionId, 'by:', endedByRole);
  }

  // Submit rating
  submitRating(sessionId: string, rating: number, ratedBy: string, ratedByRole: 'user' | 'therapist') {
    this.socket?.emit('submit-rating', { sessionId, rating, ratedBy, ratedByRole });
    console.log('Submitting rating:', rating, 'for session:', sessionId);
  }

  // Listen for session ended events
  onSessionEnded(callback: (data: any) => void) {
    this.socket?.on('session-ended', callback);
  }

  offSessionEnded() {
    this.socket?.off('session-ended');
  }

  // Listen for rating submissions
  onRatingSubmitted(callback: (data: any) => void) {
    this.socket?.on('rating-submitted', callback);
  }

  offRatingSubmitted() {
    this.socket?.off('rating-submitted');
  }

  // ==================== VOICE SESSION EVENTS ====================

  // Join voice session
  joinVoiceSession(sessionId: string) {
    this.socket?.emit('join-voice-session', { sessionId });
  }

  // Leave voice session
  leaveVoiceSession(sessionId: string) {
    this.socket?.emit('leave-voice-session', { sessionId });
  }

  // Voice session events
  onUserJoinedVoice(callback: (data: any) => void) {
    this.socket?.on('user-joined-voice', callback);
  }

  onUserLeftVoice(callback: (data: any) => void) {
    this.socket?.on('user-left-voice', callback);
  }

  offUserJoinedVoice() {
    this.socket?.off('user-joined-voice');
  }

  offUserLeftVoice() {
    this.socket?.off('user-left-voice');
  }

  // ==================== WEBRTC SIGNALING ====================

  // Send WebRTC offer
  sendVoiceOffer(sessionId: string, offer: any, userId: string) {
    this.socket?.emit('voice-offer', { sessionId, offer, userId });
  }

  // Send WebRTC answer
  sendVoiceAnswer(sessionId: string, answer: any, userId: string) {
    this.socket?.emit('voice-answer', { sessionId, answer, userId });
  }

  // Send ICE candidate
  sendIceCandidate(sessionId: string, candidate: any, userId: string) {
    this.socket?.emit('ice-candidate', { sessionId, candidate, userId });
  }

  // Listen for WebRTC signaling
  onVoiceOffer(callback: (data: any) => void) {
    this.socket?.on('voice-offer', callback);
  }

  onVoiceAnswer(callback: (data: any) => void) {
    this.socket?.on('voice-answer', callback);
  }

  onIceCandidate(callback: (data: any) => void) {
    this.socket?.on('ice-candidate', callback);
  }

  offVoiceOffer() {
    this.socket?.off('voice-offer');
  }

  offVoiceAnswer() {
    this.socket?.off('voice-answer');
  }

  offIceCandidate() {
    this.socket?.off('ice-candidate');
  }

  // ==================== VOICE MASKING ====================

  // Toggle voice masking
  toggleVoiceMask(sessionId: string, enabled: boolean) {
    this.socket?.emit('toggle-voice-mask', { sessionId, enabled });
  }

  // Listen for voice mask toggles
  onVoiceMaskToggled(callback: (data: any) => void) {
    this.socket?.on('voice-mask-toggled', callback);
  }

  offVoiceMaskToggled() {
    this.socket?.off('voice-mask-toggled');
  }

  // ==================== AUDIO STATE ====================

  // Send audio state update
  sendAudioState(sessionId: string, isMuted: boolean, isSpeaking: boolean) {
    this.socket?.emit('audio-state-update', { sessionId, isMuted, isSpeaking });
  }

  // Listen for audio state updates
  onAudioStateUpdate(callback: (data: any) => void) {
    this.socket?.on('audio-state-update', callback);
  }

  offAudioStateUpdate() {
    this.socket?.off('audio-state-update');
  }

  // ==================== TYPING INDICATORS ====================

  sendTyping(sessionId: string, isTyping: boolean) {
    this.socket?.emit('typing', { sessionId, isTyping });
  }

  onTyping(callback: (data: { userId: string; isTyping: boolean }) => void) {
    this.socket?.on('user-typing', callback);
  }

  offTyping() {
    this.socket?.off('user-typing');
  }

  // ==================== PRESENCE ====================

  setOnline() {
    this.socket?.emit('user-online');
  }

  setAway() {
    this.socket?.emit('user-away');
  }

  onPresenceChange(callback: (data: { userId: string; status: 'online' | 'away' | 'offline' }) => void) {
    this.socket?.on('presence-change', callback);
  }

  offPresenceChange() {
    this.socket?.off('presence-change');
  }

  // ==================== CONNECTION STATUS ====================

  // Debug method to check connection status
  getConnectionStatus() {
    return {
      connected: this.socket?.connected,
      id: this.socket?.id,
      disconnected: this.socket?.disconnected
    };
  }

  // Check if socket is connected
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Get socket ID
  getSocketId(): string | null {
    return this.socket?.id || null;
  }

  // ==================== AUDIO SESSION EVENTS (for compatibility) ====================

  startAudioSession(sessionId: string) {
    this.socket?.emit('start-audio', { sessionId });
  }

  endAudioSession(sessionId: string) {
    this.socket?.emit('end-audio', { sessionId });
  }

  toggleMic(sessionId: string, isMuted: boolean) {
    this.socket?.emit('toggle-mic', { sessionId, isMuted });
  }

  toggleSpeaker(sessionId: string, isMuted: boolean) {
    this.socket?.emit('toggle-speaker', { sessionId, isMuted });
  }

  onAudioStateChange(callback: (state: any) => void) {
    this.socket?.on('audio-state-change', callback);
  }

  offAudioStateChange() {
    this.socket?.off('audio-state-change');
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;