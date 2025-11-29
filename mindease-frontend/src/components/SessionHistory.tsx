import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ArrowLeft, Calendar, Clock, Phone, MessageCircle, Star, TrendingUp } from "lucide-react";
import { getCurrentUser, sessionsAPI, type Session, moodAPI, type MoodLog as APIMoodLog } from "../lib/api";

interface PastSession {
  id: string;
  therapistName: string;
  therapistInitials: string;
  userAnonymousName: string;
  userInitials: string;
  date: string;
  time: string;
  sessionType: 'chat' | 'audio';
  rating: number;
  duration: string;
  status: string;
  userId: string;
}

interface SessionHistoryProps {
  onBack: () => void;
}

export function SessionHistory({ onBack }: SessionHistoryProps) {
  const user = getCurrentUser();
  const [pastSessions, setPastSessions] = useState<PastSession[]>([]);
  const [moodLogs, setMoodLogs] = useState<APIMoodLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [moodLoading, setMoodLoading] = useState(true);

  useEffect(() => {
    loadSessionHistory();
    if (user?.role !== 'therapist') {
      loadMoodLogs();
    }
  }, []);

  const loadSessionHistory = async () => {
    try {
      setLoading(true);
      let sessions: Session[] = [];
      
      // Load from API first
      try {
        if (user?.role === 'therapist') {
          sessions = await sessionsAPI.getTherapistPast();
        } else {
          sessions = await sessionsAPI.getPast();
        }
      } catch (apiError) {
        console.log('API failed, trying localStorage:', apiError);
        // Fallback to localStorage
        const storedSessions = localStorage.getItem('user-sessions');
        if (storedSessions) {
          const allSessions = JSON.parse(storedSessions);
          const today = new Date().toISOString().split('T')[0];
          
          if (user?.role === 'therapist') {
            // Get therapist profile to filter sessions
            const therapistProfile = JSON.parse(localStorage.getItem('therapist-profile') || '{}');
            sessions = allSessions.filter((session: any) => 
              session.therapistId === therapistProfile._id && 
              (session.status === 'completed' || session.date < today)
            );
          } else {
            sessions = allSessions.filter((session: any) => 
              session.status === 'completed' || session.date < today
            );
          }
        }
      }

      // Transform data
      const pastSessionsData = sessions.map(session => ({
        id: session._id || `session-${Date.now()}`,
        therapistName: session.therapistName,
        therapistInitials: session.therapistInitials,
        userAnonymousName: session.userAnonymousName || 'Anonymous User',
        userInitials: session.userInitials || 'AU',
        date: session.date,
        time: session.time,
        sessionType: session.sessionType,
        rating: session.rating || 0,
        duration: session.duration || '50 minutes',
        status: session.status,
        userId: session.userId || ''
      }));

      setPastSessions(pastSessionsData);
    } catch (error) {
      console.error('Error loading session history:', error);
      setPastSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMoodLogs = async () => {
    try {
      setMoodLoading(true);
      
      // Try to load mood logs from API
      try {
        const moodData = await moodAPI.getAll();
        setMoodLogs(moodData);
      } catch (apiError) {
        console.log('Mood API failed, trying localStorage:', apiError);
        
        // Fallback to localStorage
        const storedMoodLogs = localStorage.getItem('moodEntries');
        if (storedMoodLogs) {
          setMoodLogs(JSON.parse(storedMoodLogs));
        } else {
          setMoodLogs([]);
        }
      }
    } catch (error) {
      console.error('Error loading mood logs:', error);
      setMoodLogs([]);
    } finally {
      setMoodLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getMoodColor = (mood: string) => {
    switch (mood) {
      case 'Great': return 'bg-green-100 text-green-700 border-green-200';
      case 'Good': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Okay': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Not Great': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Bad': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getAverageRating = () => {
    if (pastSessions.length === 0) return 0;
    const ratedSessions = pastSessions.filter(session => session.rating > 0);
    if (ratedSessions.length === 0) return 0;
    const totalRating = ratedSessions.reduce((acc, session) => acc + session.rating, 0);
    return Math.round((totalRating / ratedSessions.length) * 10) / 10;
  };

  const getTotalDuration = () => {
    return pastSessions.reduce((acc, session) => {
      const durationMatch = session.duration.match(/(\d+)/);
      return acc + (durationMatch ? parseInt(durationMatch[1]) : 50);
    }, 0);
  };

  const getRatedSessionsCount = () => {
    return pastSessions.filter(session => session.rating > 0).length;
  };

  // Get mood logs for a specific user
  const getUserMoodLogs = (userId: string) => {
    return moodLogs.filter(log => log.userId === userId);
  };

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
                Session History
              </h1>
              <p className="text-sm text-muted-foreground">
                {user?.role === 'therapist' ? 'Your therapy sessions with clients' : 'View your past sessions and mood logs'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
                {user?.anonymousName?.split(' ').map(n => n[0]).join('') || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{user?.anonymousName}</p>
              <p className="text-xs text-muted-foreground">
                {user?.role === 'therapist' ? 'Professional Account' : 'Your identity is protected'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        <Tabs defaultValue="sessions" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="sessions">
              {user?.role === 'therapist' ? 'Client Sessions' : 'Past Sessions'}
            </TabsTrigger>
            {user?.role !== 'therapist' && (
              <TabsTrigger value="mood">Mood Logs</TabsTrigger>
            )}
          </TabsList>

          {/* Past Sessions Tab */}
          <TabsContent value="sessions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>
                  {user?.role === 'therapist' ? 'Client Session History' : 'Session History'}
                </CardTitle>
                <CardDescription>
                  {user?.role === 'therapist' 
                    ? 'Review all your completed therapy sessions with clients' 
                    : 'Review your completed therapy sessions'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-2 text-muted-foreground">Loading session history...</p>
                  </div>
                ) : pastSessions.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No completed sessions yet</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Your completed sessions will appear here
                    </p>
                  </div>
                ) : (
                  pastSessions.map((session) => (
                    <div
                      key={session.id}
                      className="p-4 rounded-lg border hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <Avatar className="w-12 h-12">
                            <AvatarFallback className={
                              user?.role === 'therapist' 
                                ? "bg-gradient-to-br from-blue-500 to-cyan-500 text-white"
                                : "bg-gradient-to-br from-indigo-500 to-purple-600 text-white"
                            }>
                              {user?.role === 'therapist' ? session.userInitials : session.therapistInitials}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-semibold">
                              {user?.role === 'therapist' ? session.userAnonymousName : session.therapistName}
                            </h4>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(session.date)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {session.time}
                              </span>
                              <span className="flex items-center gap-1">
                                {session.sessionType === 'audio' ? (
                                  <>
                                    <Phone className="h-3 w-3" />
                                    Voice Call
                                  </>
                                ) : (
                                  <>
                                    <MessageCircle className="h-3 w-3" />
                                    Chat Session
                                  </>
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Duration</p>
                            <p className="font-medium">{session.duration}</p>
                          </div>
                          {session.rating > 0 && (
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < session.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Mood Logs for this user (therapist view only) */}
                      {user?.role === 'therapist' && session.userId && (
                        <div className="mt-4 pt-4 border-t">
                          <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            Client's Recent Mood Logs
                          </h5>
                          <div className="space-y-2">
                            {getUserMoodLogs(session.userId).slice(0, 3).map((log) => (
                              <div key={log._id} className="flex items-center justify-between text-sm">
                                <span>{formatDate(log.date)}</span>
                                <Badge className={getMoodColor(log.mood)}>
                                  {log.mood}
                                </Badge>
                                {log.note && (
                                  <span className="text-muted-foreground truncate max-w-xs">
                                    {log.note}
                                  </span>
                                )}
                              </div>
                            ))}
                            {getUserMoodLogs(session.userId).length === 0 && (
                              <p className="text-sm text-muted-foreground">
                                No mood logs available for this client
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Statistics */}
            {pastSessions.length > 0 && (
              <div className="grid md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                      {pastSessions.length}
                    </div>
                    <p className="text-sm text-muted-foreground">Total Sessions</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
                      {getAverageRating()}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Avg Rating ({getRatedSessionsCount()}/{pastSessions.length})
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">
                      {getTotalDuration()} mins
                    </div>
                    <p className="text-sm text-muted-foreground">Total Time</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Mood Logs Tab (Users only) */}
          {user?.role !== 'therapist' && (
            <TabsContent value="mood" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Mood Tracking History</CardTitle>
                  <CardDescription>Monitor your emotional well-being over time</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {moodLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                      <p className="mt-2 text-muted-foreground">Loading mood logs...</p>
                    </div>
                  ) : moodLogs.length === 0 ? (
                    <div className="text-center py-8">
                      <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No mood logs yet</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Start tracking your mood to see insights here
                      </p>
                    </div>
                  ) : (
                    moodLogs.map((log) => (
                      <div
                        key={log._id || `mood-${Date.now()}`}
                        className="p-4 rounded-lg border hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">{formatDate(log.date)}</span>
                          </div>
                          <Badge className={getMoodColor(log.mood)}>
                            {log.mood}
                          </Badge>
                        </div>
                        <p className="text-sm pl-7">{log.note}</p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}