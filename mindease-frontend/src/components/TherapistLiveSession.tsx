import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback } from "./ui/avatar";
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Send,
  ArrowLeft,
  Star,
  Clock,
  Shield,
  ShieldOff
} from "lucide-react";
import { getCurrentUser, logout, sessionsAPI } from "../lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "./ui/dialog";
import { toast } from "sonner";
import { voiceService } from "../lib/voiceService";
import socketService from "../lib/socket";

interface Message {
  id: string;
  sender: 'client' | 'therapist';
  text: string;
  timestamp: Date;
}

interface TherapistLiveSessionProps {
  onLogout: () => void;
  onNavigate?: (page: string, sessionType?: 'chat' | 'audio') => void;
}

export function TherapistLiveSession({
  onLogout,
  onNavigate
}: TherapistLiveSessionProps) {
  const user = getCurrentUser();
  const [sessionData, setSessionData] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([
    
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [isMicOn, setIsMicOn] = useState(true);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isAudioStarted, setIsAudioStarted] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [showRating, setShowRating] = useState(false);
  const [showEndSessionConfirm, setShowEndSessionConfirm] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [isVoiceMasked, setIsVoiceMasked] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [actualSessionId, setActualSessionId] = useState<string>('');
  const [_endedBy, setEndedBy] = useState<string>('');
  const [endedByRole, setEndedByRole] = useState<'user' | 'therapist'>('user');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    // Load session data from localStorage
    const savedSession = localStorage.getItem('currentSession');
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession);
        setSessionData(session);
        setActualSessionId(session.sessionId);
        console.log('Therapist - Loaded session ID:', session.sessionId);
      } catch (error) {
        console.error('Error parsing session data:', error);
      }
    }
  }, []);

  useEffect(() => {
    if (actualSessionId) {
      initializeSocket();
    }
    return () => {
      cleanupVoiceCall();
      socketService.disconnect();
    };
  }, [actualSessionId]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    if (sessionData && !sessionEnded && (sessionData.sessionType === 'chat' || (sessionData.sessionType === 'audio' && isAudioStarted))) {
      timer = setInterval(() => {
        setSessionTime((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [sessionData, isAudioStarted, sessionEnded]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const initializeSocket = () => {
    const token = localStorage.getItem('authToken');
    if (token && actualSessionId) {
      socketService.connect(token);
      
      console.log('Therapist - Joining session with ID:', actualSessionId);
      
      socketService.joinSession(actualSessionId);
      socketService.joinVoiceSession(actualSessionId);
      
      setupSocketListeners();
      setIsConnected(true);
    } else {
      console.error('Therapist - No auth token or session ID found');
      toast.error("Authentication error. Please log in again.");
    }
  };

  const setupSocketListeners = () => {
    // Message listeners - FIXED: Handle all messages with isOwn flag
    socketService.onMessage((message) => {
      console.log('Therapist - Received message:', message);
      
      setMessages(prev => {
        // Check if message already exists to prevent duplicates
        const messageExists = prev.some(m => 
          m.id === message._id || 
          (m.text === message.text && Math.abs(new Date(m.timestamp).getTime() - new Date(message.timestamp).getTime()) < 1000)
        );
        
        if (!messageExists) {
          // Use isOwn flag to determine sender
          const sender = message.isOwn ? 'therapist' : 'client';
          
          return [...prev, {
            id: message._id || message.id,
            sender: sender,
            text: message.text,
            timestamp: new Date(message.timestamp)
          }];
        }
        return prev;
      });
    });

    // Session ended listener
    socketService.onSessionEnded((data) => {
      console.log('Therapist - Session ended by:', data.endedByRole);
      setSessionEnded(true);
      setEndedBy(data.endedBy);
      setEndedByRole(data.endedByRole);
      
      if (data.endedByRole === 'user') {
        toast.info("Client has ended the session");
      }
      
      // Clean up voice call if active
      if (sessionData.sessionType === 'audio' && isAudioStarted) {
        cleanupVoiceCall();
        setIsAudioStarted(false);
      }
    });

    // WebRTC listeners
    socketService.onVoiceOffer(handleVoiceOffer);
    socketService.onVoiceAnswer(handleVoiceAnswer);
    socketService.onIceCandidate(handleIceCandidate);

    // Voice session events
    socketService.onUserJoinedVoice((data) => {
      console.log('Therapist - User joined  session:', data);
      toast.info(`Client joined voice session`);
    });

    socketService.onUserLeftVoice((data) => {
      console.log('Therapist - User left  session:', data);
      toast.info(`Client left voice session`);
    });

    // Voice masking events
    socketService.onVoiceMaskToggled((data) => {
      console.log('Therapist - Voice mask toggled:', data);
      if (data.userId !== user?.id) {
        toast.info(`Client ${data.enabled ? 'enabled' : 'disabled'} voice masking`);
      }
    });
  };

  const handleVoiceOffer = async (data: any) => {
    if (!peerConnectionRef.current) return;

    try {
      await peerConnectionRef.current.setRemoteDescription(data.offer);
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);
      
      socketService.sendVoiceAnswer(actualSessionId, answer, user?.id || '');
    } catch (error) {
      console.error('Error handling voice offer:', error);
    }
  };

  const handleVoiceAnswer = async (data: any) => {
    if (!peerConnectionRef.current) return;
    
    try {
      await peerConnectionRef.current.setRemoteDescription(data.answer);
    } catch (error) {
      console.error('Error handling voice answer:', error);
    }
  };

  const handleIceCandidate = async (data: any) => {
    if (!peerConnectionRef.current) return;
    
    try {
      await peerConnectionRef.current.addIceCandidate(data.candidate);
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
    }
  };

  const getTherapistName = () => {
    if (user?.fullName) {
      const cleanName = user.fullName.replace(/^Dr\.?\s*/i, '').trim();
      return `Dr. ${cleanName}`;
    }
    if (user?.anonymousName) {
      return user.anonymousName;
    }
    return 'Therapist';
  };

  const startVoiceCall = async () => {
    try {
      // Initialize audio system
      const audioInitialized = await voiceService.initializeAudio();
      if (!audioInitialized) {
        throw new Error('Failed to initialize audio system');
      }

      // Get audio stream (therapists don't need voice masking by default)
      voiceService.toggleVoiceMask(isVoiceMasked);
      const localStream = await voiceService.getUserAudio();
      localStreamRef.current = localStream;
      
      // Setup WebRTC connection
      await setupPeerConnection(localStream);
      
      setIsAudioStarted(true);
      toast.success("Voice session started");
      
    } catch (error: any) {
      console.error('Error starting voice call:', error);
      toast.error(error.message || "Failed to start voice session");
    }
  };

  const setupPeerConnection = async (localStream: MediaStream) => {
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };

    peerConnectionRef.current = new RTCPeerConnection(configuration);

    // Add local stream
    localStream.getTracks().forEach(track => {
      peerConnectionRef.current!.addTrack(track, localStream);
    });

    // Handle incoming stream
    peerConnectionRef.current.ontrack = (event) => {
      const remoteStream = event.streams[0];
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteStream;
        console.log('Remote stream received from client');
      }
    };

    // ICE candidate handling
    peerConnectionRef.current.onicecandidate = (event) => {
      if (event.candidate && actualSessionId) {
        socketService.sendIceCandidate(actualSessionId, event.candidate, user?.id || '');
      }
    };

    // Connection state monitoring
    peerConnectionRef.current.onconnectionstatechange = () => {
      console.log('Peer connection state:', peerConnectionRef.current?.connectionState);
    };

    // Create and send offer
    const offer = await peerConnectionRef.current.createOffer();
    await peerConnectionRef.current.setLocalDescription(offer);
    
    socketService.sendVoiceOffer(actualSessionId, offer, user?.id || '');
  };

  const toggleVoiceMask = async () => {
    try {
      const newStream = await voiceService.toggleVoiceMask(!isVoiceMasked);
      if (newStream && peerConnectionRef.current) {
        // Replace audio track in peer connection
        const audioTrack = newStream.getAudioTracks()[0];
        const sender = peerConnectionRef.current.getSenders().find(
          s => s.track?.kind === 'audio'
        );
        if (sender) {
          await sender.replaceTrack(audioTrack);
          localStreamRef.current = newStream;
        }
      }
      setIsVoiceMasked(!isVoiceMasked);
      
      // Notify other participants
      socketService.toggleVoiceMask(actualSessionId, !isVoiceMasked);
      
      toast.success(`Voice masking ${!isVoiceMasked ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Error toggling voice mask:', error);
      toast.error("Failed to toggle voice masking");
    }
  };

  const cleanupVoiceCall = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    voiceService.stopAudio();
    localStreamRef.current = null;
    
    if (actualSessionId) {
      socketService.leaveVoiceSession(actualSessionId);
    }
    
    // Remove socket listeners
    socketService.offVoiceOffer();
    socketService.offVoiceAnswer();
    socketService.offIceCandidate();
    socketService.offUserJoinedVoice();
    socketService.offUserLeftVoice();
    socketService.offVoiceMaskToggled();
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sessionEnded || !actualSessionId) return;

    // Only send via socket, don't add locally 
    socketService.sendMessage(actualSessionId, newMessage);
    setNewMessage('');
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    setShowEndSessionConfirm(true);
  };

  const handleConfirmEndSession = async () => {
    if (actualSessionId && user) {
      // End session for all participants
      socketService.endSession(actualSessionId, user.id, 'therapist');
      
      // Local cleanup
      setSessionEnded(true);
      setEndedBy(user.id);
      setEndedByRole('therapist');
      
      if (sessionData.sessionType === 'audio' && isAudioStarted) {
        cleanupVoiceCall();
        setIsAudioStarted(false);
      }
      
      // Update session status in the database
      try {
        if (actualSessionId && sessionData && !sessionData.isInstant) {
          await sessionsAPI.update(actualSessionId, { status: 'completed' });
          console.log('Session marked as completed in database');
        }
      } catch (error) {
        console.error('Failed to update session status:', error);
      }
      
      setShowEndSessionConfirm(false);
      
      // Show rating dialog after a short delay
      setTimeout(() => {
        setShowRating(true);
      }, 1000);
      
      toast.success("Session ended successfully");
    }
  };

  const handleStartAudio = () => {
    startVoiceCall();
  };

  const handleSubmitRating = async () => {
    try {
      // Submit rating if provided
      if (rating > 0 && actualSessionId && sessionData && !sessionData.isInstant) {
        await sessionsAPI.rate(actualSessionId, rating);
        // Also emit via socket for real-time updates
        socketService.submitRating(actualSessionId, rating, user?.id || '', 'therapist');
        toast.success("Thank you for your rating!");
      }
    } catch (error) {
      console.error('Failed to submit rating:', error);
    }
    
    setShowRating(false);
    if (onNavigate) {
      onNavigate('therapist-dashboard');
    }
  };

  const handleBackToDashboard = () => {
    if (onNavigate) {
      onNavigate('therapist-dashboard');
    }
  };

  const handleLogout = () => {
    logout();
    onLogout();
  };

  const toggleMicrophone = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !isMicOn;
      });
      setIsMicOn(!isMicOn);
      if (actualSessionId) {
        socketService.sendAudioState(actualSessionId, !isMicOn, true);
      }
    }
  };

  // Debug connection
  const debugConnection = () => {
    console.log('=== THERAPIST DEBUG INFO ===');
    console.log('Session ID:', actualSessionId);
    console.log('Session Data:', sessionData);
    console.log('User:', user);
    console.log('Socket Status:', socketService.getConnectionStatus());
    console.log('Connected:', isConnected);
    console.log('Messages:', messages);
    console.log('Session Ended:', sessionEnded);
    console.log('Ended By:', endedByRole);
    console.log('=====================');
  };

  // Debug messages
  const debugMessages = () => {
    console.log('=== THERAPIST MESSAGES DEBUG ===');
    messages.forEach((msg, index) => {
      console.log(`Message ${index}:`, {
        text: msg.text,
        sender: msg.sender,
        timestamp: msg.timestamp
      });
    });
    console.log('==============================');
  };

  if (!sessionData) {
    return (
      <div className="h-screen flex flex-col bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50">
        <div className="flex-1 flex items-center justify-center">
          <Card className="w-96">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <h3 className="text-lg font-semibold">Loading Session...</h3>
                <p className="text-muted-foreground mt-2">Preparing your live session</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={handleBackToDashboard}>
              <ArrowLeft className="h-5 w-5 mr-2" />
              Dashboard
            </Button>
            <Button variant="outline" size="sm" onClick={debugConnection}>
              Client
            </Button>
            <Button variant="outline" size="sm" onClick={debugMessages}>
              Messages
            </Button>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-indigo-600" />
              <span className="font-medium">{formatTime(sessionTime)}</span>
            </div>
            {sessionEnded ? (
              <Badge variant="destructive" className="px-3 py-1">
                Session Ended
              </Badge>
            ) : (
              <Badge variant="default" className="px-3 py-1 bg-green-100 text-green-800">
                Session Active
              </Badge>
            )}
            {sessionData.sessionType === 'audio' && isVoiceMasked && (
              <Badge variant="secondary" className="px-3 py-1">
                <Shield className="h-3 w-3 mr-1" />
                Voice Masked
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="font-medium">{isConnected ? 'Connected' : 'Disconnected'}</span>
            </div>
            {!sessionEnded && (
              <Button variant="ghost" onClick={handleEndCall}>
                End Session
              </Button>
            )}
            <Button variant="ghost" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Session Ended Overlay (when ended by client) */}
      {sessionEnded && endedByRole === 'user' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-96">
            <CardContent className="pt-6 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <PhoneOff className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Session Ended</h3>
              <p className="text-muted-foreground mb-4">
                The client has ended the session.
              </p>
              <div className="space-y-3">
                <Button 
                  onClick={() => {
                    setShowRating(true);
                  }}
                  className="w-full"
                >
                  Rate Session
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => onNavigate?.('therapist-dashboard')}
                  className="w-full"
                >
                  Return to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Title Section */}
      <div className="text-center py-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
          Professional Session
        </h1>
        <p className="text-muted-foreground">
          {sessionEnded ? 'Session Completed' : 'You are providing professional support'}
        </p>
        <p className="text-xs text-muted-foreground mt-2">Session ID: {actualSessionId}</p>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden px-6 pb-6">
        <div className="max-w-5xl mx-auto h-full flex flex-col">
          {sessionData.sessionType === 'audio' && (
            <div className="flex flex-col gap-4 min-h-0 h-full">
              <div className="flex items-center justify-center">
                <Badge className="px-6 py-2 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 border-indigo-200">
                  Voice Session
                </Badge>
              </div>

              <Card className="flex-1 bg-white/60 backdrop-blur-sm border-indigo-100">
                <CardContent className="p-8 h-full flex flex-col items-center justify-between">
                  {!isAudioStarted ? (
                    <div className="flex-1 flex flex-col items-center justify-center space-y-6">
                      <div className="text-center space-y-4">
                        <Avatar className="w-24 h-24 mx-auto">
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white text-3xl">
                            {sessionData.clientName?.split(' ').map((n: string) => n[0]).join('') || 'C'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="text-2xl mb-2">{sessionData.clientName || 'Client'}</h3>
                          <p className="text-muted-foreground">
                            {sessionEnded ? 'Session completed' : 'Ready to start voice session'}
                          </p>
                          <p className="text-sm text-muted-foreground">You are: {getTherapistName()}</p>
                        </div>
                      </div>
                      {!sessionEnded && (
                        <Button
                          onClick={handleStartAudio}
                          size="lg"
                          className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-8 py-6 text-lg"
                        >
                          <Phone className="h-6 w-6 mr-2" />
                          Start Voice Session
                        </Button>
                      )}
                    </div>
                  ) : (
                    <>
                      {/* Timer */}
                      <div className="text-center">
                        <h2 className="text-3xl font-bold">{formatTime(sessionTime)}</h2>
                      </div>

                      {/* Client Info */}
                      <div className="text-center space-y-4">
                        <div className="flex items-center justify-center gap-2">
                          <Avatar className="w-6 h-6">
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white text-xs">
                              {sessionData.clientName?.split(' ').map((n: string) => n[0]).join('') || 'C'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="text-left">
                            <h3 className="text-xl">{sessionData.clientName || 'Client'}</h3>
                            <p className="text-muted-foreground">
                              {sessionEnded ? 'Session ended' : 'Connected...'}
                            </p>
                          </div>
                        </div>

                        {/* Audio Waveform Visualization */}
                        {!sessionEnded && (
                          <div className="flex items-center justify-center gap-1 h-32">
                            {[...Array(13)].map((_, i) => {
                              const animationDuration = Math.random() * 0.5 + 0.5;
                              return (
                                <div
                                  key={i}
                                  className="w-2 bg-gradient-to-t from-indigo-500 to-purple-500 rounded-full transition-all duration-300"
                                  style={{
                                    height: `${Math.random() * 80 + 20}px`,
                                    animationName: 'pulse',
                                    animationDuration: `${animationDuration}s`,
                                    animationTimingFunction: 'ease-in-out',
                                    animationIterationCount: 'infinite',
                                    animationDelay: `${i * 0.1}s`
                                  }}
                                />
                              );
                            })}
                          </div>
                        )}

                        {/* Therapist Status */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-center gap-2">
                            <Avatar className="w-5 h-5">
                              <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xs">
                                {getTherapistName().split(' ').map((n: string) => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xl">You ({getTherapistName()}):</span>
                          </div>
                          <p className="text-muted-foreground">
                            {sessionEnded ? 'Session completed' : `Voice Active ${isVoiceMasked ? '(Masked)' : ''}`}
                          </p>
                        </div>
                      </div>

                      {/* Audio Controls */}
                      {!sessionEnded && (
                        <div className="flex items-center justify-center gap-4 bg-white/80 backdrop-blur-sm p-4 rounded-lg border border-indigo-100">
                          <Button
                            size="icon"
                            variant={isVoiceMasked ? "default" : "outline"}
                            className="w-12 h-12 rounded-full"
                            onClick={toggleVoiceMask}
                            title={isVoiceMasked ? "Disable voice masking" : "Enable voice masking"}
                          >
                            {isVoiceMasked ? <Shield className="h-5 w-5" /> : <ShieldOff className="h-5 w-5" />}
                          </Button>

                          <Button
                            size="icon"
                            variant={isMicOn ? "ghost" : "destructive"}
                            className="w-14 h-14 rounded-full hover:bg-indigo-100"
                            onClick={toggleMicrophone}
                            title={isMicOn ? "Mute microphone" : "Unmute microphone"}
                          >
                            {isMicOn ? <Mic className="h-6 w-6 text-indigo-600" /> : <MicOff className="h-6 w-6" />}
                          </Button>

                          <Button
                            size="icon"
                            variant={isSpeakerOn ? "ghost" : "destructive"}
                            className="w-14 h-14 rounded-full hover:bg-purple-100"
                            onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                            title={isSpeakerOn ? "Mute speaker" : "Unmute speaker"}
                          >
                            {isSpeakerOn ? <Volume2 className="h-6 w-6 text-purple-600" /> : <VolumeX className="h-6 w-6" />}
                          </Button>

                          <Button
                            size="icon"
                            variant="destructive"
                            className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600"
                            onClick={handleEndCall}
                            title="End session"
                          >
                            <PhoneOff className="h-6 w-6" />
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
              
              {/* Hidden audio element for remote audio */}
              <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />
            </div>
          )}

          {sessionData.sessionType === 'chat' && (
            <div className="flex flex-col gap-4 min-h-0 h-full">
              <div className="flex items-center justify-center">
                <Badge className="px-6 py-2 bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 border-purple-200">
                  Chat Session
                </Badge>
              </div>

              <Card className="flex-1 bg-white/60 backdrop-blur-sm border-purple-100 flex flex-col min-h-0">
                <CardContent className="p-6 flex-1 flex flex-col min-h-0">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-muted-foreground">
                      Session with {sessionData.clientName || 'Client'} • You are: {getTherapistName()}
                    </p>
                    <div className="flex items-center gap-4">
                      <p className="font-semibold text-indigo-600">{formatTime(sessionTime)}</p>
                      
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto pr-4 min-h-0">
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex flex-col ${message.sender === 'therapist' ? 'items-end' : 'items-start'}`}
                        >
                          <p className="text-xs text-muted-foreground mb-1">
                            {message.sender === 'therapist' ? `You (${getTherapistName()})` : sessionData.clientName || 'Client'}
                          </p>
                          <div
                            className={`rounded-lg px-4 py-2 max-w-[80%] ${
                              message.sender === 'therapist'
                                ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white'
                                : 'bg-white border border-indigo-100'
                            }`}
                          >
                            <p className="text-sm">{message.text}</p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      ))}
                      {sessionEnded && (
                        <div className="text-center py-8">
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 inline-block">
                            <p className="text-yellow-800 font-medium">This session has ended</p>
                            <p className="text-yellow-700 text-sm">No further messages can be sent</p>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  </div>
                </CardContent>

                {/* Message Input */}
                {!sessionEnded && (
                  <div className="p-4 bg-white/80 backdrop-blur-sm border-t border-indigo-100">
                    <form onSubmit={handleSendMessage} className="flex gap-3 items-center">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your professional response..."
                        className="flex-1 bg-white border-indigo-200 focus:border-indigo-400"
                        disabled={sessionEnded || !actualSessionId}
                      />
                      <Button 
                        type="submit" 
                        className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 px-8"
                        disabled={sessionEnded || !actualSessionId}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </form>
                    {!actualSessionId && (
                      <p className="text-xs text-red-500 mt-2 text-center">
                        Waiting for session connection...
                      </p>
                    )}
                  </div>
                )}
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* End Session Confirmation Dialog */}
      <Dialog open={showEndSessionConfirm} onOpenChange={setShowEndSessionConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>End Session</DialogTitle>
            <DialogDescription>
              Are you sure you want to end this session? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-center text-muted-foreground">
              Session duration: <strong>{formatTime(sessionTime)}</strong>
            </p>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowEndSessionConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmEndSession}>
              End Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rating Dialog */}
      <Dialog open={showRating} onOpenChange={setShowRating}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">Session Completed</DialogTitle>
            <DialogDescription>
              Session with {sessionData.clientName || 'Client'} has ended.
              Total duration: <strong>{formatTime(sessionTime)}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-center text-muted-foreground mb-4">
              How would you rate this session?
            </p>
            <div className="flex justify-center gap-2 py-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= (hoverRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-center text-sm text-muted-foreground mt-2">
              Rate this session (optional)
            </p>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={handleSubmitRating}>
              Skip Rating
            </Button>
            <Button className="bg-green-500 hover:bg-green-600" onClick={handleSubmitRating}>
              Complete Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scaleY(0.5); }
          50% { transform: scaleY(1); }
        }
      `}</style>
    </div>
  );
}