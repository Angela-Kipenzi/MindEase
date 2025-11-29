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
  Shield,
  ShieldOff
} from "lucide-react";
import { getCurrentUser } from "../lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { toast } from "sonner";
import { voiceService } from "../lib/voiceService";
import socketService from "../lib/socket";

interface Message {
  id: string;
  sender: 'user' | 'therapist';
  text: string;
  timestamp: Date;
}

interface LiveSessionProps {
  therapistName: string;
  therapistInitials: string;
  sessionType: 'chat' | 'audio';
  onBack: () => void;
  sessionId?: string;
}

export function LiveSession({
  therapistName,
  therapistInitials,
  sessionType,
  onBack,
  sessionId
}: LiveSessionProps) {
  const user = getCurrentUser();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'therapist',
      text: `Hello ${user?.anonymousName}, welcome to our session. I'm here to listen and support you. How are you feeling today?`,
      timestamp: new Date()
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [isMicOn, setIsMicOn] = useState(true);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isAudioStarted, setIsAudioStarted] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [isVoiceMasked, setIsVoiceMasked] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [actualSessionId, setActualSessionId] = useState<string>('');
  const [sessionEnded, setSessionEnded] = useState(false);
  const [_endedBy, setEndedBy] = useState<string>('');
  const [endedByRole, setEndedByRole] = useState<'user' | 'therapist'>('therapist');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // Get session ID from localStorage or props
  useEffect(() => {
    // Try to get session ID from multiple sources
    const savedSession = localStorage.getItem('currentSession');
    if (savedSession) {
      try {
        const sessionData = JSON.parse(savedSession);
        if (sessionData.sessionId) {
          setActualSessionId(sessionData.sessionId);
          console.log('User - Using session ID from localStorage:', sessionData.sessionId);
          return;
        }
      } catch (error) {
        console.error('Error parsing session data:', error);
      }
    }
    
    // Use prop sessionId if available and valid
    if (sessionId && sessionId !== 'default-session' && sessionId !== 'default-sesion') {
      setActualSessionId(sessionId);
      console.log('User - Using session ID from props:', sessionId);
      return;
    }
    
    // Fallback: try to get from URL or generate a consistent one
    const urlParams = new URLSearchParams(window.location.search);
    const urlSessionId = urlParams.get('sessionId');
    if (urlSessionId) {
      setActualSessionId(urlSessionId);
    } else {
      // Generate a session ID based on therapist and user
      const generatedSessionId = `session-${therapistName.replace(/\s+/g, '-')}-${user?.id || 'user'}`;
      setActualSessionId(generatedSessionId);
      console.log('User - Generated session ID:', generatedSessionId);
    }
  }, [sessionId, therapistName, user?.id]);

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
    if (sessionType === 'chat' || (sessionType === 'audio' && isAudioStarted)) {
      timer = setInterval(() => {
        setSessionTime((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [sessionType, isAudioStarted]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const initializeSocket = () => {
    const token = localStorage.getItem('authToken');
    if (token && actualSessionId) {
      const socket = socketService.connect(token);
      
      socket.on('connect', () => {
        console.log('User - Socket connected successfully, ID:', socket.id);
        setIsConnected(true);
        
        // Use the actual session ID
        console.log('User - Joining session with ID:', actualSessionId);
        
        socketService.joinSession(actualSessionId);
        socketService.joinVoiceSession(actualSessionId);
        
        console.log('User - Socket connection status:', socketService.getConnectionStatus());
      });
      
      socket.on('disconnect', () => {
        console.log('User - Socket disconnected');
        setIsConnected(false);
      });

      socket.on('connect_error', (error) => {
        console.error('User - Socket connection error:', error);
        setIsConnected(false);
        toast.error("Connection error. Please try again.");
      });
      
      setupSocketListeners();
    } else {
      console.error('No auth token or session ID found');
      toast.error("Authentication error. Please log in again.");
    }
  };

  const setupSocketListeners = () => {
    // Message listeners -  Handle own messages properly
    socketService.onMessage((message) => {
      console.log('User - Received message:', message);
      
      // Check if this is our own message that we've already added locally
      const isOwnMessage = message.isOwn;
      const isDuplicate = messages.some(m => m.id === message._id);
      
      if (!isOwnMessage && !isDuplicate) {
        setMessages(prev => [...prev, {
          id: message._id || message.id,
          sender: message.senderType as 'user' | 'therapist',
          text: message.text,
          timestamp: new Date(message.timestamp)
        }]);
      }
    });

    // Session ended listener
    socketService.onSessionEnded((data) => {
      console.log('User - Session ended by:', data.endedByRole);
      setSessionEnded(true);
      setEndedBy(data.endedBy);
      setEndedByRole(data.endedByRole);
      
      if (data.endedByRole === 'therapist') {
        toast.info("Therapist has ended the session");
      }
      
      // Clean up voice call if active
      if (sessionType === 'audio' && isAudioStarted) {
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
      console.log('User - Therapist joined voice session:', data);
      toast.info(`Therapist joined voice session`);
    });

    socketService.onUserLeftVoice((data) => {
      console.log('User - Therapist left voice session:', data);
      toast.info(`Therapist left voice session`);
    });

    // Voice masking events
    socketService.onVoiceMaskToggled((data) => {
      console.log('User - Voice mask toggled:', data);
      if (data.userId !== user?.id) {
        toast.info(`Therapist ${data.enabled ? 'enabled' : 'disabled'} voice masking`);
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

  const startVoiceCall = async () => {
    try {
      // Initialize audio system
      const audioInitialized = await voiceService.initializeAudio();
      if (!audioInitialized) {
        throw new Error('Failed to initialize audio system');
      }

      // Get masked audio stream
      const localStream = await voiceService.getUserAudio();
      localStreamRef.current = localStream;
      
      // Setup WebRTC connection
      await setupPeerConnection(localStream);
      
      setIsAudioStarted(true);
      toast.success("Voice session started with voice masking");
      
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
        console.log('Remote stream received');
      }
    };

    // ICE candidate handling
    peerConnectionRef.current.onicecandidate = (event) => {
      if (event.candidate) {
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
    if (!newMessage.trim() || !actualSessionId || sessionEnded) return;

    const message: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: newMessage,
      timestamp: new Date()
    };

    // Add message locally immediately - FIXED: This prevents the need for echo
    setMessages(prev => [...prev, message]);
    
    // Send via socket
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
    if (actualSessionId && user) {
      // End session for all participants
      socketService.endSession(actualSessionId, user.id, 'user');
      
      // Local cleanup
      setSessionEnded(true);
      setEndedBy(user.id);
      setEndedByRole('user');
      
      if (sessionType === 'audio' && isAudioStarted) {
        cleanupVoiceCall();
        setIsAudioStarted(false);
      }
      
      setShowRating(true);
    }
  };

  const handleStartAudio = () => {
    startVoiceCall();
  };

  const handleSubmitRating = () => {
    if (actualSessionId && user && rating > 0) {
      // Submit rating to server
      socketService.submitRating(actualSessionId, rating, user.id, 'user');
    }
    
    setShowRating(false);
    
    // Wait a bit before going back to show confirmation
    setTimeout(() => {
      onBack();
    }, 1000);
  };

  const toggleMicrophone = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !isMicOn;
      });
      setIsMicOn(!isMicOn);
      socketService.sendAudioState(actualSessionId, !isMicOn, true);
    }
  };

  // Debug connection
  const debugConnection = () => {
    console.log('=== USER DEBUG INFO ===');
    console.log('Session ID:', actualSessionId);
    console.log('User:', user);
    console.log('Socket Status:', socketService.getConnectionStatus());
    console.log('Connected:', isConnected);
    console.log('Messages:', messages);
    console.log('Session Ended:', sessionEnded);
    console.log('Ended By:', endedByRole);
    console.log('=====================');
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-5 w-5 mr-2" />
              Dashboard
            </Button>
            <Button variant="outline" size="sm" onClick={debugConnection}>
              Debug
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <h3 className="font-medium">Session with {therapistName}</h3>
            {sessionType === 'audio' && isVoiceMasked && (
              <Badge variant="secondary" className="ml-2">
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
          </div>
        </div>
      </div>

      {/* Session Ended Overlay */}
      {sessionEnded && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-96">
            <CardContent className="pt-6 text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <PhoneOff className="h-8 w-8 text-yellow-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Session Ended</h3>
              <p className="text-muted-foreground mb-4">
                {endedByRole === 'therapist' 
                  ? 'The therapist has ended the session.' 
                  : 'You have ended the session.'}
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
                  onClick={onBack}
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
          Talk Anonymously
        </h1>
        <p className="text-muted-foreground">You are safe here</p>
        <p className="text-xs text-muted-foreground mt-2">Session ID: {actualSessionId}</p>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden px-6 pb-6">
        <div className="max-w-5xl mx-auto h-full flex flex-col">
          {sessionType === 'audio' && (
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
                          <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-3xl">
                            {therapistInitials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="text-2xl mb-2">{therapistName}</h3>
                          <p className="text-muted-foreground">Ready to start your voice session</p>
                          <p className="text-sm text-muted-foreground mt-2">
                            Your voice will be masked for privacy
                          </p>
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

                      {/* Therapist Info */}
                      <div className="text-center space-y-4">
                        <div className="flex items-center justify-center gap-2">
                          <Avatar className="w-6 h-6">
                            <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xs">
                              {therapistInitials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="text-left">
                            <h3 className="text-xl">{therapistName}</h3>
                            <p className="text-muted-foreground">Connected...</p>
                          </div>
                        </div>

                        {/* Audio Waveform Visualization */}
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

                        {/* User Status */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-center gap-2">
                            <Avatar className="w-5 h-5">
                              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white text-xs">
                                {user?.anonymousName?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xl">You:</span>
                          </div>
                          <p className="text-muted-foreground">
                            Voice Active {isVoiceMasked && '(Masked)'}
                          </p>
                        </div>
                      </div>

                      {/* Audio Controls */}
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
                          title="End call"
                        >
                          <PhoneOff className="h-6 w-6" />
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
              
              {/* Hidden audio element for remote audio */}
              <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />
            </div>
          )}

          {sessionType === 'chat' && (
            <div className="flex flex-col gap-4 min-h-0 h-full">
              <div className="flex items-center justify-center">
                <Badge className="px-6 py-2 bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 border-purple-200">
                  Chat Session
                </Badge>
              </div>

              <Card className="flex-1 bg-white/60 backdrop-blur-sm border-purple-100 flex flex-col min-h-0">
                <CardContent className="p-6 flex-1 flex flex-col min-h-0">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-muted-foreground">Session with {therapistName}</p>
                    <p className="font-semibold text-indigo-600">{formatTime(sessionTime)}</p>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto pr-4 min-h-0">
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex flex-col ${message.sender === 'user' ? 'items-end' : 'items-start'}`}
                        >
                          <p className="text-xs text-muted-foreground mb-1">
                            {message.sender === 'user' ? 'You' : therapistName}
                          </p>
                          <div
                            className={`rounded-lg px-4 py-2 max-w-[80%] ${
                              message.sender === 'user'
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
                        placeholder="Type message..."
                        className="flex-1 bg-white border-indigo-200 focus:border-indigo-400"
                        disabled={!actualSessionId}
                      />
                      <Button 
                        type="submit" 
                        className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 px-8"
                        disabled={!actualSessionId}
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

      {/* Rating Dialog */}
      <Dialog open={showRating} onOpenChange={setShowRating}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">How was your session?</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center gap-2 py-6">
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
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={handleSubmitRating}>
              Not Now
            </Button>
            <Button className="bg-green-500 hover:bg-green-600" onClick={handleSubmitRating}>
              Submit
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