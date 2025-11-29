import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Calendar, Users, Clock, TrendingUp, Phone, MessageCircle, LogOut, MessageSquare, RefreshCw } from "lucide-react";
import { getCurrentUser, logout, refreshCurrentUser } from "../lib/api";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { sessionsAPI, type Session } from "../lib/api";
import { toast } from "sonner";

interface TherapistDashboardProps {
  onLogout: () => void;
  onNavigate?: (page: string, sessionType?: 'chat' | 'audio') => void;
}

interface AvailabilitySlot {
  day: string;
  startTime: string;
  endTime: string;
}

interface SessionWithUser extends Session {
  userDisplayName?: string;
  userInitials?: string;
}

export function TherapistDashboard({ onLogout, onNavigate }: TherapistDashboardProps) {
  const [user, setUser] = useState(getCurrentUser());
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingSlot, setEditingSlot] = useState<AvailabilitySlot | null>(null);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([
    { day: 'Monday - Friday', startTime: '09:00', endTime: '18:00' },
    { day: 'Saturday', startTime: '10:00', endTime: '14:00' }
  ]);
  const [upcomingSessions, setUpcomingSessions] = useState<SessionWithUser[]>([]);
  const [allSessions, setAllSessions] = useState<SessionWithUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (user?.id) {
      loadTherapistSessions();
    }
  }, [user?.id]);

  const loadUserData = async () => {
    try {
      const refreshedUser = await refreshCurrentUser();
      if (refreshedUser) {
        setUser(refreshedUser);
      }
    } catch (error) {
      console.error('Error refreshing therapist user data:', error);
      setUser(getCurrentUser());
    }
  };

  const loadTherapistSessions = async () => {
  try {
    setLoading(true);
    let sessions: Session[] = [];
    
    try {
      // Load all therapist sessions first
      sessions = await sessionsAPI.getTherapistSessions();
      console.log('Loaded therapist sessions:', sessions);
    } catch (apiError) {
      console.log('API failed, loading from localStorage:', apiError);
      sessions = getAllSessionsFromLocalStorage();
    }

    // Transform sessions
    const sessionsWithUserData: SessionWithUser[] = sessions.map(session => ({
      ...session,
      userDisplayName: session.userAnonymousName || 'Anonymous User',
      userInitials: session.userInitials || 'AU'
    }));

    // Set all sessions for total count
    setAllSessions(sessionsWithUserData);
    
    // FIXED: Type-safe filter for upcoming sessions
    const today = new Date().toISOString().split('T')[0];
    const upcoming = sessionsWithUserData.filter(session => {
      const isUpcomingDate = session.date >= today;
      
      // Only include sessions with these specific active statuses
      const allowedStatuses = ['confirmed', 'pending', 'scheduled'];
      const hasActiveStatus = allowedStatuses.includes(session.status || '');
      
      return isUpcomingDate && hasActiveStatus;
    });
    
    setUpcomingSessions(upcoming);
    
  } catch (error) {
    console.error('Error loading therapist sessions:', error);
    setUpcomingSessions([]);
    setAllSessions([]);
  } finally {
    setLoading(false);
  }
};

  // Helper function for localStorage fallback
  const getAllSessionsFromLocalStorage = (): Session[] => {
    const storedSessions = localStorage.getItem('user-sessions');
    if (!storedSessions) {
      console.log('No sessions found in localStorage');
      return [];
    }

    try {
      const allSessions = JSON.parse(storedSessions);
      console.log('Found sessions in localStorage:', allSessions);
      
      const therapistSessions = allSessions
        .filter((session: any) => {
          const matchesTherapist = session.therapistName === getTherapistName();
          console.log(`Session ${session.id} matches therapist:`, matchesTherapist, session.therapistName, getTherapistName());
          return matchesTherapist;
        })
        .map((session: any) => ({
          _id: session.id || session._id,
          therapistId: user?.id || '',
          therapistName: session.therapistName || getTherapistName(),
          therapistInitials: getTherapistInitials(),
          date: session.date || new Date().toISOString().split('T')[0],
          time: session.time || '10:00',
          sessionType: session.sessionType || 'chat',
          status: session.status || 'confirmed',
          duration: session.duration || '50 minutes',
          userId: session.userId || 'user-' + Date.now(),
          userAnonymousName: session.userAnonymousName || 'Anonymous User',
          userInitials: session.userInitials || 'AU',
          rating: session.rating || 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }));

      console.log('Processed therapist sessions:', therapistSessions);
      return therapistSessions;
    } catch (error) {
      console.error('Error parsing localStorage sessions:', error);
      return [];
    }
  };

  // Calculate therapist rating from session ratings
  const calculateTherapistRating = (): string => {
    const ratedSessions = allSessions.filter(session => 
      session.status === 'completed' && session.rating && session.rating > 0
    );
    
    if (ratedSessions.length === 0) return '0.0'; 
    
    const totalRating = ratedSessions.reduce((acc, session) => acc + (session.rating || 0), 0);
    const averageRating = totalRating / ratedSessions.length;
    
    return averageRating.toFixed(1);
  };

  // Get count of rated sessions
  const getRatedSessionsCount = (): number => {
    return allSessions.filter(session => 
      session.status === 'completed' && session.rating && session.rating > 0
    ).length;
  };

  const handleManualRefresh = async () => {
    setLoading(true);
    try {
      await loadUserData();
      await loadTherapistSessions();
      toast.success("Dashboard refreshed");
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
      toast.error("Failed to refresh dashboard");
    } finally {
      setLoading(false);
    }
  };

  const getTherapistName = (): string => {
    if (user?.fullName) {
      const cleanName = user.fullName.replace(/^Dr\.?\s*/i, '').trim();
      return `Dr. ${cleanName}`;
    }
    return user?.name || 'Dr. Therapist';
  };

  const getTherapistInitials = (): string => {
    const name = getTherapistName();
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getDisplayName = (session: SessionWithUser): string => {
    return session.userDisplayName || 'Anonymous User';
  };

  const getUserInitials = (session: SessionWithUser): string => {
    return session.userInitials || 'AU';
  };

  const handleLogout = () => {
    logout();
    onLogout();
  };

  const handleEditAvailability = (slot: AvailabilitySlot) => {
    setEditingSlot({ ...slot });
    setShowEditDialog(true);
  };

  const handleSaveEdit = () => {
    if (editingSlot) {
      setAvailability(availability.map(slot => 
        slot.day === editingSlot.day ? editingSlot : slot
      ));
      setShowEditDialog(false);
      setEditingSlot(null);
      toast.success("Availability updated");
    }
  };

  const handleUpdateAvailability = () => {
    localStorage.setItem('therapist-availability', JSON.stringify(availability));
    toast.success("Availability saved successfully!");
  };

  const handleJoinSession = (session: SessionWithUser) => {
    if (!onNavigate) return;

    const sessionData = {
      sessionId: session._id,
      sessionType: session.sessionType,
      clientName: getDisplayName(session),
      therapistName: getTherapistName(),
      therapistInitials: getTherapistInitials(),
      isTherapist: true
    };
    
    localStorage.setItem('currentSession', JSON.stringify(sessionData));
    onNavigate('therapist-live-session', session.sessionType);
  };

  const handleStartInstantSession = (sessionType: 'chat' | 'audio') => {
    if (!onNavigate) return;

    const sessionData = {
      sessionId: `instant-session-${Date.now()}`,
      sessionType: sessionType,
      clientName: 'Anonymous Client',
      therapistName: getTherapistName(),
      therapistInitials: getTherapistInitials(),
      isTherapist: true,
      isInstant: true
    };
    
    localStorage.setItem('currentSession', JSON.stringify(sessionData));
    onNavigate('therapist-live-session', sessionType);
  };

  const handleViewSessionHistory = () => {
    onNavigate?.('session-history');
  };

  const formatSessionDateTime = (session: Session) => {
    if (session.date && session.time) {
      const sessionDate = new Date(session.date);
      const formattedDate = sessionDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
      
      // Format time properly
      let formattedTime = session.time;
      if (session.time.includes(':')) {
        const [hours, minutes] = session.time.split(':');
        const hourNum = parseInt(hours);
        const period = hourNum >= 12 ? 'PM' : 'AM';
        const displayHour = hourNum % 12 || 12;
        formattedTime = `${displayHour}:${minutes} ${period}`;
      }
      
      return `${formattedDate} at ${formattedTime}`;
    }
    return 'Time not specified';
  };

  const isSessionToday = (session: Session) => {
    if (!session.date) return false;
    const today = new Date().toISOString().split('T')[0];
    return session.date === today;
  };

  const getTherapistAvatarInitials = () => {
    return getTherapistInitials();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="font-semibold">MindEase Therapist Dashboard</h2>
                <p className="text-sm text-muted-foreground">
                  {getTherapistName()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xs">
                    {getTherapistAvatarInitials()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{getTherapistName()}</span>
              </div>

              <Button 
                variant="outline" 
                onClick={handleManualRefresh}
                className="text-xs"
                size="sm"
                disabled={loading}
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Loading...' : 'Refresh'}
              </Button>

              <Button 
                variant="outline" 
                onClick={handleViewSessionHistory}
                className="text-xs"
                size="sm"
              >
                <Clock className="h-3 w-3 mr-1" />
                Session History
              </Button>
              
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                Available
              </Badge>
              <Button variant="ghost" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome, {getTherapistName()}
          </h1>
          <p className="text-muted-foreground mt-2">Manage your sessions and support clients</p>
        </div>

        {/* Quick Session Start */}
        <Card className="mb-8 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
          <CardHeader>
            <CardTitle className="text-white">Start Instant Session</CardTitle>
            <CardDescription className="text-indigo-100">
              Begin a session immediately for urgent client support
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={() => handleStartInstantSession('chat')}
                className="bg-white text-indigo-600 hover:bg-indigo-50 flex items-center gap-2 flex-1"
                size="lg"
              >
                <MessageSquare className="h-5 w-5" />
                Start Chat Session
              </Button>
              <Button 
                onClick={() => handleStartInstantSession('audio')}
                className="bg-white text-purple-600 hover:bg-purple-50 flex items-center gap-2 flex-1"
                size="lg"
              >
                <Phone className="h-5 w-5" />
                Start Voice Session
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Upcoming Sessions</CardTitle>
                <Calendar className="h-4 w-4 text-indigo-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {upcomingSessions.length}
              </div>
              <p className="text-sm text-muted-foreground">
                {upcomingSessions.filter(s => isSessionToday(s)).length} today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Total Sessions</CardTitle>
                <Users className="h-4 w-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {allSessions.length}
              </div>
              <p className="text-sm text-muted-foreground">All booked sessions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Completed</CardTitle>
                <Clock className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {allSessions.filter(s => s.status === 'completed').length}
              </div>
              <p className="text-sm text-muted-foreground">Finished sessions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Rating</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{calculateTherapistRating()}</div>
              <p className="text-sm text-muted-foreground">
                Based on {getRatedSessionsCount()} reviews
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Today's Schedule */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Upcoming Sessions</CardTitle>
            <CardDescription>Your scheduled anonymous sessions</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Loading sessions...</p>
              </div>
            ) : upcomingSessions.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No upcoming sessions</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Booked sessions will appear here
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingSessions.map((session) => {
                  const displayName = getDisplayName(session);
                  const userInitials = getUserInitials(session);
                  
                  return (
                    <div
                      key={session._id}
                      className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <Avatar className="w-12 h-12">
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
                            {userInitials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-semibold">{displayName}</h4>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatSessionDateTime(session)}
                            </span>
                            <span className="flex items-center gap-1">
                              {session.sessionType === 'audio' ? (
                                <>
                                  <Phone className="h-3 w-3" />
                                  Audio Call
                                </>
                              ) : (
                                <>
                                  <MessageCircle className="h-3 w-3" />
                                  Chat
                                </>
                              )}
                            </span>
                            {isSessionToday(session) && (
                              <Badge variant="outline" className="bg-green-50 text-green-700 text-xs">
                                Today
                              </Badge>
                            )}
                          </div>
                          {session.duration && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Duration: {session.duration}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge
                          variant={
                            session.status === 'confirmed' ? 'default' :
                            session.status === 'completed' ? 'secondary' :
                            session.status === 'cancelled' ? 'destructive' : 'outline'
                          }
                          className={
                            session.status === 'confirmed' 
                              ? 'bg-green-100 text-green-800 hover:bg-green-100' 
                              : session.status === 'completed'
                              ? 'bg-blue-100 text-blue-800'
                              : ''
                          }
                        >
                          {session.status?.charAt(0).toUpperCase() + session.status?.slice(1) || 'Scheduled'}
                        </Badge>
                        {session.status === 'confirmed' && (
                          <Button 
                            onClick={() => handleJoinSession(session)}
                            className="bg-gradient-to-r from-indigo-500 to-purple-600"
                          >
                            Join Session
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Two Column Grid */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Client Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Notes</CardTitle>
              <CardDescription>Your private session notes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground">No notes yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Notes from your sessions will appear here
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Availability */}
          <Card>
            <CardHeader>
              <CardTitle>Your Availability</CardTitle>
              <CardDescription>Manage your schedule</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {availability.map((slot, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                    <div>
                      <h4 className="font-medium">{slot.day}</h4>
                      <p className="text-sm text-muted-foreground">
                        {slot.startTime} - {slot.endTime}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleEditAvailability(slot)}>
                      Edit
                    </Button>
                  </div>
                ))}
                <Button 
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700" 
                  onClick={handleUpdateAvailability}
                >
                  Update Availability
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Availability Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Availability</DialogTitle>
            <DialogDescription>
              Update your working hours for {editingSlot?.day}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="start-time">Start Time</Label>
              <Input
                id="start-time"
                type="time"
                value={editingSlot?.startTime || ''}
                onChange={(e) => setEditingSlot(prev => prev ? { ...prev, startTime: e.target.value } : null)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-time">End Time</Label>
              <Input
                id="end-time"
                type="time"
                value={editingSlot?.endTime || ''}
                onChange={(e) => setEditingSlot(prev => prev ? { ...prev, endTime: e.target.value } : null)}
              />
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