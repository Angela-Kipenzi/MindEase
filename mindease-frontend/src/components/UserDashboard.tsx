import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Heart, Calendar, MessageCircle, TrendingUp, Shield, LogOut, BookOpen, Activity, Sparkles, Menu, Clock, AlertCircle } from "lucide-react";
import { getCurrentUser, logout, sessionsAPI, refreshCurrentUser } from "../lib/api";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { useState, useEffect } from "react";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { toast } from "sonner";

interface UserDashboardProps {
  onNavigate: (page: string, sessionType?: 'chat' | 'audio') => void;
  onLogout: () => void;
}

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
  canJoin?: boolean;
  joinReason?: string;
}

export function UserDashboard({ onNavigate, onLogout }: UserDashboardProps) {
  const [user, setUser] = useState(getCurrentUser());
  const [upcomingSessions, setUpcomingSessions] = useState<Session[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (user?.id) {
      loadUpcomingSessions();
    }
  }, [user?.id]);

  const loadUserData = async () => {
    try {
      const refreshedUser = await refreshCurrentUser();
      if (refreshedUser) {
        setUser(refreshedUser);
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
      setUser(getCurrentUser());
    }
  };

  const loadUpcomingSessions = async () => {
    try {
      setLoadingSessions(true);
      // DATABASE ONLY - no fallbacks
      const sessions = await sessionsAPI.getJoinable();
      
      // Check joinability for each session
      const sessionsWithJoinCheck = await Promise.all(
        sessions.map(async (session) => {
          try {
            const joinCheck = await sessionsAPI.canJoinSession(session._id!);
            return {
              id: session._id || `session-${Date.now()}`,
              _id: session._id,
              therapistName: session.therapistName,
              therapistInitials: session.therapistInitials,
              date: session.date,
              time: session.time,
              sessionType: session.sessionType,
              status: session.status as 'confirmed' | 'pending' | 'completed' | 'cancelled',
              therapistId: session.therapistId,
              duration: session.duration,
              canJoin: joinCheck.canJoin,
              joinReason: joinCheck.reason
            };
          } catch (error) {
            console.error('Error checking session joinability:', error);
            return {
              id: session._id || `session-${Date.now()}`,
              _id: session._id,
              therapistName: session.therapistName,
              therapistInitials: session.therapistInitials,
              date: session.date,
              time: session.time,
              sessionType: session.sessionType,
              status: session.status as 'confirmed' | 'pending' | 'completed' | 'cancelled',
              therapistId: session.therapistId,
              duration: session.duration,
              canJoin: false,
              joinReason: 'Unable to verify session availability'
            };
          }
        })
      );
      
      setUpcomingSessions(sessionsWithJoinCheck);
      
    } catch (error: any) {
      console.error('Failed to load sessions from API:', error);
      
      // PROPER ERROR HANDLING - NO FALLBACK
      if (error.message.includes('Network') || error.message.includes('fetch')) {
        toast.error('Connection issue. Please check your internet connection.');
      } else if (error.message.includes('401')) {
        toast.error('Please login again to view your sessions.');
      } else {
        toast.error('Failed to load your sessions.');
      }
      
      // EMPTY STATE - no fallback data
      setUpcomingSessions([]);
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleRefreshSessions = () => {
    loadUpcomingSessions();
  };

  const handleLogout = () => {
    logout();
    onLogout();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTime = (timeString: string) => {
    if (timeString.includes(':')) {
      const [hours, minutes] = timeString.split(':');
      const hourNum = parseInt(hours);
      const period = hourNum >= 12 ? 'PM' : 'AM';
      const displayHour = hourNum % 12 || 12;
      return `${displayHour}:${minutes} ${period}`;
    }
    return timeString;
  };

  const isSessionToday = (date: string) => {
    const today = new Date().toISOString().split('T')[0];
    return date === today;
  };

  const handleJoinSession = async (session: Session) => {
    try {
      // Double-check if session can be joined
      const sessionId = session._id || session.id;
      const canJoinResult = await sessionsAPI.canJoinSession(sessionId);
      
      if (!canJoinResult.canJoin) {
        toast.error(`Cannot join session: ${canJoinResult.reason}`);
        return;
      }

      // Proceed with joining session
      onNavigate('live-session', session.sessionType);
    } catch (error) {
      console.error('Error joining session:', error);
      toast.error('Failed to join session. Please try again.');
    }
  };

  const menuItems = [
    { icon: Heart, label: "Mood Tracker", page: "mood" },
    { icon: Calendar, label: "Find Therapists", page: "therapist-discovery" },
    { icon: BookOpen, label: "Journal", page: "journal" },
    { icon: Activity, label: "Exercises", page: "exercises" },
    { icon: Sparkles, label: "Resources", page: "resources" },
    { icon: TrendingUp, label: "Progress", page: "progress" },
    { icon: Clock, label: "Session History", page: "session-history" },
  ];

  const displaySessions = upcomingSessions.slice(0, 2);

  const getUserInitials = () => {
    if (!user?.anonymousName) return 'U';
    return user.anonymousName
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Heart className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="font-semibold">MindEase</h2>
                <p className="text-sm text-muted-foreground">
                  Welcome, {user?.anonymousName || 'User'} - Your chosen identity
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white text-xs">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{user?.anonymousName}</span>
              </div>

              <Button 
                variant="outline" 
                onClick={handleRefreshSessions}
                className="text-xs"
                size="sm"
                disabled={loadingSessions}
              >
                <Clock className={`h-3 w-3 mr-1 ${loadingSessions ? 'animate-spin' : ''}`} />
                {loadingSessions ? 'Loading...' : 'Refresh'}
              </Button>

              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <div className="mt-8 space-y-4">
                    <h3 className="font-semibold mb-4">Quick Access</h3>
                    {menuItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Button
                          key={item.page}
                          variant="ghost"
                          className="w-full justify-start"
                          onClick={() => onNavigate(item.page)}
                        >
                          <Icon className="h-5 w-5 mr-3" />
                          {item.label}
                        </Button>
                      );
                    })}
                  </div>
                </SheetContent>
              </Sheet>
              <div className="flex items-center gap-2 px-4 py-2 bg-indigo-100 rounded-full">
                <Shield className="h-4 w-4 text-indigo-600" />
                <span className="text-sm text-indigo-900">Your Anonymous Identity</span>
              </div>
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
          <h1 className="text-3xl font-bold text-gray-900">Your Wellness Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.anonymousName}! Your chosen identity is protected.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-indigo-100">Your Identity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{user?.anonymousName || 'Anonymous'}</div>
              <p className="text-sm text-indigo-100 mt-1">Your Chosen Name</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onNavigate('mood')}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Mood Tracking</CardTitle>
                <Heart className="h-4 w-4 text-pink-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Track</div>
              <p className="text-sm text-muted-foreground">Log your feelings</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onNavigate('therapist-discovery')}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Find Therapists</CardTitle>
                <Calendar className="h-4 w-4 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Discover</div>
              <p className="text-sm text-muted-foreground">Verified professionals</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onNavigate('session-history')}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Session History</CardTitle>
                <Clock className="h-4 w-4 text-green-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Review</div>
              <p className="text-sm text-muted-foreground">Past sessions</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Actions */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          <Card className="border-2 border-indigo-100 hover:border-indigo-300 transition-all">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <Button onClick={() => onNavigate('therapist-discovery')}>
                  Browse Therapists
                </Button>
              </div>
              <CardTitle>Find a Therapist</CardTitle>
              <CardDescription>
                Discover licensed therapists with real names and credentials. Choose based on specialization, experience, and reviews.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-muted-foreground">Verified professionals</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm">Real Names</span>
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">Verified Credentials</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">Ratings & Reviews</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-100 hover:border-purple-300 transition-all">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Heart className="h-6 w-6 text-white" />
                </div>
                <Button variant="outline" onClick={() => onNavigate('mood')}>
                  Track Mood
                </Button>
              </div>
              <CardTitle>Daily Mood Check</CardTitle>
              <CardDescription>
                Track your emotional well-being over time. See patterns and progress in your mental health journey.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  Understanding your mood patterns is the first step to better mental health.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Joinable Sessions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Joinable Sessions</CardTitle>
                <CardDescription>Your therapy appointments that can be joined now</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => onNavigate('session-history')} variant="outline">
                  <Clock className="h-4 w-4 mr-2" />
                  Session History
                </Button>
                <Button onClick={() => onNavigate('upcoming-sessions')} variant="outline">
                  View All
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loadingSessions ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-2 text-muted-foreground text-sm">Loading sessions from server...</p>
              </div>
            ) : displaySessions.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No joinable sessions available</p>
                <Button onClick={() => onNavigate('therapist-discovery')}>
                  Find a Therapist
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {displaySessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                          {session.therapistInitials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h4 className="font-semibold">{session.therapistName}</h4>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(session.date)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTime(session.time)}
                          </span>
                          <span className="flex items-center gap-1">
                            {session.sessionType === 'audio' ? (
                              <MessageCircle className="h-3 w-3" />
                            ) : (
                              <MessageCircle className="h-3 w-3" />
                            )}
                            {session.sessionType === 'audio' ? 'Voice Call' : 'Chat'}
                          </span>
                        </div>
                        {isSessionToday(session.date) && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 text-xs mt-1">
                            Today
                          </Badge>
                        )}
                        {!session.canJoin && (
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 text-xs mt-1 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Cannot Join
                          </Badge>
                        )}
                        {!session.canJoin && session.joinReason && (
                          <p className="text-xs text-yellow-600 mt-1">
                            {session.joinReason}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge 
                        variant={
                          session.status === 'confirmed' ? 'default' :
                          session.status === 'pending' ? 'outline' :
                          session.status === 'completed' ? 'secondary' : 'destructive'
                        }
                        className={
                          session.status === 'confirmed' 
                            ? 'bg-green-100 text-green-800 hover:bg-green-100' 
                            : ''
                        }
                      >
                        {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                      </Badge>
                      {session.canJoin ? (
                        <Button 
                          size="sm"
                          onClick={() => handleJoinSession(session)}
                          className="bg-gradient-to-r from-indigo-500 to-purple-600"
                        >
                          Join
                        </Button>
                      ) : (
                        <Button 
                          size="sm"
                          disabled
                          variant="outline"
                          className="text-muted-foreground"
                        >
                          Not Available
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                
                {upcomingSessions.length > 2 && (
                  <div className="text-center pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      +{upcomingSessions.length - 2} more sessions
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}