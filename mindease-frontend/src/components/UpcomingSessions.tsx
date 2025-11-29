import { useState, useEffect } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { ArrowLeft, Calendar, Clock, Phone, MessageCircle, Edit, Trash2 } from "lucide-react";
import { sessionsAPI, getCurrentUser } from "../lib/api";
import { toast } from "sonner";

interface Session {
  id: string;
  _id?: string;
  therapistName: string;
  therapistInitials: string;
  date: string;
  time: string;
  sessionType: 'chat' | 'audio';
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
  therapistId?: string;
  duration?: string;
}

interface UpcomingSessionsProps {
  onBack: () => void;
  onJoinSession: (sessionType: 'chat' | 'audio', therapistName: string, therapistInitials: string) => void;
}

export function UpcomingSessions({ onBack, onJoinSession }: UpcomingSessionsProps) {
  const user = getCurrentUser();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
  try {
    setLoading(true);
    // Try to load from API first
    const upcomingSessions = await sessionsAPI.getUpcoming(); // This should only return future sessions
    
    // Transform API sessions to match our interface
    const transformedSessions: Session[] = upcomingSessions.map(session => ({
      id: session._id || `session-${Date.now()}`, 
      therapistName: session.therapistName,
      therapistInitials: session.therapistInitials,
      date: session.date,
      time: session.time,
      sessionType: session.sessionType,
      status: session.status as 'confirmed' | 'pending' | 'completed' | 'cancelled',
      therapistId: session.therapistId,
      duration: session.duration
    }));
    
    setSessions(transformedSessions);
    
    // Also update localStorage for fallback
    localStorage.setItem('user-sessions', JSON.stringify(transformedSessions));
  } catch (error) {
    console.error('Failed to load sessions from API:', error);
    // Fallback to localStorage with proper filtering
    const storedSessions = localStorage.getItem('user-sessions');
    if (storedSessions) {
      const allSessions = JSON.parse(storedSessions);
      const today = new Date().toISOString().split('T')[0];
      
      // Only show future sessions and sessions that aren't completed/cancelled
      const futureSessions = allSessions.filter((session: any) => 
        session.date >= today && 
        session.status !== 'completed' && 
        session.status !== 'cancelled'
      );
      
      setSessions(futureSessions);
    } else {
      setSessions([]);
    }
  } finally {
    setLoading(false);
  }
};

  const handleEditSession = (session: Session) => {
    setEditingSession({ ...session });
    setShowEditDialog(true);
  };

 const handleSaveEdit = async () => {
  if (editingSession) {
    try {
      console.log('Updating session:', editingSession);
      
      // Prepare update data
      const updateData = {
        date: editingSession.date,
        time: editingSession.time,
        sessionType: editingSession.sessionType
      };

      let updatedSession;
      
      try {
        // Try API update first
        updatedSession = await sessionsAPI.update(editingSession.id, updateData);
        console.log('Session updated via API:', updatedSession);
      } catch (apiError) {
        console.error('API update failed, updating locally:', apiError);
        updatedSession = { ...editingSession, ...updateData };
      }

      // Update local state
      const updatedSessions = sessions.map(s => 
        s.id === editingSession.id ? { ...editingSession, ...updateData } : s
      );
      setSessions(updatedSessions);
      
      // Update localStorage
      localStorage.setItem('user-sessions', JSON.stringify(updatedSessions));
      
      setShowEditDialog(false);
      setEditingSession(null);
      toast.success('Session updated successfully!');
      
    } catch (error) {
      console.error('Failed to update session:', error);
      toast.error('Failed to update session. Please try again.');
    }
  }
};

  const handleDeleteSession = async (sessionId: string) => {
    try {
      // Cancel via API
      await sessionsAPI.cancel(sessionId);
      
      // Update local state
      const updatedSessions = sessions.filter(s => s.id !== sessionId);
      setSessions(updatedSessions);
      localStorage.setItem('user-sessions', JSON.stringify(updatedSessions));
      toast.success('Session cancelled successfully!');
    } catch (error) {
      console.error('Failed to cancel session:', error);
      toast.error('Failed to cancel session. Please try again.');
    }
  };

  const isSessionToday = (date: string) => {
    const today = new Date().toISOString().split('T')[0];
    return date === today;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (timeString: string) => {
    // Convert 24h time to 12h format if needed
    if (timeString.includes(':')) {
      const [hours, minutes] = timeString.split(':');
      const hourNum = parseInt(hours);
      const period = hourNum >= 12 ? 'PM' : 'AM';
      const displayHour = hourNum % 12 || 12;
      return `${displayHour}:${minutes} ${period}`;
    }
    return timeString;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading sessions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-indigo-100 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                My Sessions
              </h1>
              <p className="text-sm text-muted-foreground">View and manage your upcoming sessions</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
                {user?.anonymousName?.split(' ').map(n => n[0]).join('') || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{user?.anonymousName || 'User'}</p>
              <p className="text-xs text-muted-foreground">Your identity is protected</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="space-y-6">
          {sessions.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-xl font-semibold mb-2">No Upcoming Sessions</h3>
                <p className="text-muted-foreground mb-6">You haven't booked any sessions yet.</p>
                <Button onClick={onBack} className="bg-gradient-to-r from-indigo-500 to-purple-600">
                  Book a Session
                </Button>
              </CardContent>
            </Card>
          ) : (
            sessions.map((session) => (
              <Card key={session.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-16 h-16">
                        <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                          {session.therapistInitials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-lg font-semibold">{session.therapistName}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(session.date)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {formatTime(session.time)}
                          </span>
                          <span className="flex items-center gap-1">
                            {session.sessionType === 'audio' ? (
                              <>
                                <Phone className="h-4 w-4" />
                                Voice Call
                              </>
                            ) : (
                              <>
                                <MessageCircle className="h-4 w-4" />
                                Chat Session
                              </>
                            )}
                          </span>
                          {session.duration && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {session.duration}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge 
                        variant={
                          session.status === 'confirmed' ? 'default' :
                          session.status === 'completed' ? 'secondary' :
                          session.status === 'cancelled' ? 'destructive' : 'outline'
                        }
                      >
                        {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                      </Badge>
                      {isSessionToday(session.date) && session.status === 'confirmed' && (
                        <Button 
                          onClick={() => onJoinSession(session.sessionType, session.therapistName, session.therapistInitials)}
                          className="bg-gradient-to-r from-indigo-500 to-purple-600"
                        >
                          Join Session
                        </Button>
                      )}
                      {session.status === 'confirmed' && (
                        <>
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={() => handleEditSession(session)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={() => handleDeleteSession(session.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Edit Session Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Session</DialogTitle>
            <DialogDescription>
              Update your session details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={editingSession?.date || ''}
                onChange={(e) => setEditingSession(prev => prev ? { ...prev, date: e.target.value } : null)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                type="time"
                value={editingSession?.time || ''}
                onChange={(e) => setEditingSession(prev => prev ? { ...prev, time: e.target.value } : null)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="session-type">Session Type</Label>
              <Select
                value={editingSession?.sessionType}
                onValueChange={(value) => setEditingSession(prev => prev ? { ...prev, sessionType: value as 'chat' | 'audio' } : null)}
              >
                <SelectTrigger id="session-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="chat">Chat Session</SelectItem>
                  <SelectItem value="audio">Voice Call</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} className="bg-gradient-to-r from-indigo-500 to-purple-600">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}