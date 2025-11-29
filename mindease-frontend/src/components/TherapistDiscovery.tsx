import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Calendar } from "./ui/calendar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Search, Filter, Star, Clock, DollarSign, Languages, UserCheck, AlertCircle, Phone, MessageCircle, Calendar as CalendarIcon, ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import { Input } from "./ui/input";
import { therapistsAPI, sessionsAPI, type Therapist, getCurrentUser } from "../lib/api";
import { toast } from "sonner";

interface TherapistDiscoveryProps {
  onBack: () => void;
  onSessionBooked: (therapistId: string, therapistName: string, therapistInitials: string, sessionType: 'chat' | 'audio', date: Date, time: string) => void;
}

interface TherapistAvailability {
  dayOfWeek: string;
  timeSlots: string[];
}

interface BookedSession {
  therapistId: string;
  date: string;
  time: string;
}

// Better date formatting that handles timezones correctly
const formatDateForBackend = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Get day of week from date
const getDayOfWeek = (date: Date): string => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
};

// Convert time to 24-hour format for comparison
const timeTo24Hour = (time: string): string => {
  const [timePart, modifier] = time.split(' ');
  let [hours, minutes] = timePart.split(':').map(Number);
  
  if (modifier === 'PM' && hours !== 12) hours += 12;
  if (modifier === 'AM' && hours === 12) hours = 0;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

// Simple helper functions
const getTherapistDisplayName = (therapist: Therapist): string => {
  return therapist.fullName || therapist.name || 'Therapist';
};

const getTherapistSpecialization = (therapist: Therapist): string => {
  return therapist.specialization || therapist.specialty?.[0] || 'General Therapy';
};

const getTherapistDescription = (therapist: Therapist): string => {
  return therapist.description || therapist.about || 'Licensed therapist';
};

const getTherapistHourlyRate = (therapist: Therapist): number => {
  return therapist.hourlyRate || 150;
};

const getTherapistLanguages = (therapist: Therapist): string[] => {
  return therapist.languages || ['English'];
};

const getTherapistExperience = (therapist: Therapist): number => {
  return therapist.experience || therapist.yearsOfExperience || 3;
};

// Default time slots for all therapists
const DEFAULT_TIME_SLOTS = [
  '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM'
];

export function TherapistDiscovery({ onBack, onSessionBooked }: TherapistDiscoveryProps) {
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [filteredTherapists, setFilteredTherapists] = useState<Therapist[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  
  // Filter states
  const [specialization, setSpecialization] = useState("all");
  const [maxRate, setMaxRate] = useState(200);
  const [language, setLanguage] = useState("all");
  const [minRating, setMinRating] = useState(0);

  // Booking modal states
  const [selectedTherapist, setSelectedTherapist] = useState<Therapist | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [sessionType, setSessionType] = useState<'chat' | 'audio'>('chat');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [therapistAvailability, setTherapistAvailability] = useState<TherapistAvailability[]>([]);
  const [bookedSessions, setBookedSessions] = useState<BookedSession[]>([]);

  useEffect(() => {
    loadTherapists();
    loadBookedSessions();
  }, []);

  useEffect(() => {
    filterTherapists();
  }, [therapists, searchTerm, specialization, maxRate, language, minRating]);

  // Load therapist availability when therapist is selected
  useEffect(() => {
    if (selectedTherapist) {
      loadTherapistAvailability(selectedTherapist._id);
    }
  }, [selectedTherapist]);

  const loadTherapists = async () => {
    try {
      setLoading(true);
      setError("");
      
      const therapistsData = await therapistsAPI.getAll();
      
      if (therapistsData && therapistsData.length > 0) {
        setTherapists(therapistsData);
      } else {
        setTherapists([]);
        setError("No therapists are currently available. Please check back later.");
      }
      
    } catch (error: any) {
      setError(`Failed to load therapists: ${error.message}. Please check if the backend server is running.`);
      setTherapists([]);
    } finally {
      setLoading(false);
    }
  };

  const loadTherapistAvailability = async (therapistId: string) => {
    try {
      // Try to get availability from API
      const availability = await therapistsAPI.getAvailability(therapistId);
      setTherapistAvailability(availability);
    } catch (error) {
      console.log('Could not load specific availability, using default schedule');
      // Fallback to default availability - ALL WEEKDAYS with all time slots
      setTherapistAvailability([
        { dayOfWeek: 'Monday', timeSlots: DEFAULT_TIME_SLOTS },
        { dayOfWeek: 'Tuesday', timeSlots: DEFAULT_TIME_SLOTS },
        { dayOfWeek: 'Wednesday', timeSlots: DEFAULT_TIME_SLOTS },
        { dayOfWeek: 'Thursday', timeSlots: DEFAULT_TIME_SLOTS },
        { dayOfWeek: 'Friday', timeSlots: DEFAULT_TIME_SLOTS },
      ]);
    }
  };

  const loadBookedSessions = async () => {
    try {
      // Load all sessions to check for conflicts
      const sessions = await sessionsAPI.getAll();
      const booked = sessions.map(session => ({
        therapistId: session.therapistId,
        date: session.date,
        time: session.time
      }));
      setBookedSessions(booked);
    } catch (error) {
      console.log('Could not load booked sessions, using empty array');
      setBookedSessions([]);
    }
  };

  const filterTherapists = () => {
    let filtered = therapists.filter(therapist => {
      const therapistName = getTherapistDisplayName(therapist);
      const therapistSpecialization = getTherapistSpecialization(therapist);
      const therapistDescription = getTherapistDescription(therapist);
      
      const matchesSearch = 
        therapistName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        therapistSpecialization.toLowerCase().includes(searchTerm.toLowerCase()) ||
        therapistDescription.toLowerCase().includes(searchTerm.toLowerCase());
      
      const therapistSpecialties = therapist.specialty || [];
      const matchesSpecialization = specialization === "all" || 
                                  therapistSpecialties.includes(specialization);
      
      const therapistRate = getTherapistHourlyRate(therapist);
      const matchesRate = therapistRate <= maxRate;
      
      const therapistLangs = getTherapistLanguages(therapist);
      const matchesLanguage = language === "all" || 
                            therapistLangs.includes(language);
      
      const matchesRating = therapist.rating >= minRating;

      return matchesSearch && matchesSpecialization && matchesRate && matchesLanguage && matchesRating;
    });

    setFilteredTherapists(filtered);
  };

  // SIMPLIFIED availability checking - Focus on basic time validation
  const isTimeSlotAvailable = (timeSlot: string, therapistId: string): boolean => {
    if (!selectedDate) return false;
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const selectedDateTime = new Date(selectedDate);
    
    // Check if date is in the past
    if (selectedDateTime < today) return false;
    
    // Check if it's today and time is in the past
    if (selectedDateTime.toDateString() === today.toDateString()) {
      const time24Hour = timeTo24Hour(timeSlot);
      const [hours, minutes] = time24Hour.split(':').map(Number);
      const slotDateTime = new Date(selectedDateTime);
      slotDateTime.setHours(hours, minutes, 0, 0);
      
      if (slotDateTime <= now) return false;
    }
    
    // SIMPLIFIED: Assume therapist is available if we don't have specific availability
    // Check if we have therapist availability data
    if (therapistAvailability.length > 0) {
      const dayOfWeek = getDayOfWeek(selectedDate);
      const dayAvailability = therapistAvailability.find(avail => 
        avail.dayOfWeek.toLowerCase() === dayOfWeek.toLowerCase()
      );
      
      // If we have specific availability for this day, use it
      if (dayAvailability) {
        if (!dayAvailability.timeSlots.includes(timeSlot)) {
          return false;
        }
      }
      // If no specific availability for this day but we have availability data, assume not available
      else {
        return false;
      }
    }
    
    // Check for existing bookings (only if we can load them)
    if (bookedSessions.length > 0) {
      const isAlreadyBooked = bookedSessions.some(session => 
        session.therapistId === therapistId &&
        session.date === formatDateForBackend(selectedDate) &&
        session.time === timeSlot
      );
      
      if (isAlreadyBooked) return false;
    }
    
    return true;
  };

  // Get available time slots for the selected therapist and date
  const availableTimeSlots = useMemo(() => {
    if (!selectedTherapist || !selectedDate) return [];
    
    // Use DEFAULT_TIME_SLOTS as fallback
    const possibleTimeSlots = therapistAvailability.length > 0 
      ? therapistAvailability.find(avail => 
          avail.dayOfWeek.toLowerCase() === getDayOfWeek(selectedDate).toLowerCase()
        )?.timeSlots || DEFAULT_TIME_SLOTS
      : DEFAULT_TIME_SLOTS;
    
    return possibleTimeSlots.filter(timeSlot => 
      isTimeSlotAvailable(timeSlot, selectedTherapist._id)
    );
  }, [selectedTherapist, selectedDate, therapistAvailability, bookedSessions]);

  // Reset selected time when date changes and current time is no longer available
  useEffect(() => {
    if (selectedTime && selectedTherapist && !isTimeSlotAvailable(selectedTime, selectedTherapist._id)) {
      setSelectedTime('');
    }
  }, [selectedDate, selectedTime, selectedTherapist]);

  const isBookingValid = (): boolean => {
    return !!(selectedTherapist && selectedDate && selectedTime && 
             isTimeSlotAvailable(selectedTime, selectedTherapist._id));
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedTime('');
  };

  const handleBookSession = async () => {
    if (!isBookingValid()) {
      toast.error('Please select a valid date and time');
      return;
    }

    setIsBooking(true);
    try {
      const currentUser = getCurrentUser();
      
      if (!currentUser) {
        throw new Error('User not found. Please log in again.');
      }

      const sessionDate = formatDateForBackend(selectedDate!);

      const sessionData = {
        therapistId: selectedTherapist!._id,
        therapistName: getTherapistDisplayName(selectedTherapist!),
        therapistInitials: getTherapistDisplayName(selectedTherapist!).split(' ').map(n => n[0]).join(''),
        date: sessionDate,
        time: selectedTime,
        sessionType: sessionType,
        status: 'confirmed' as const,
        duration: '50 minutes',
        userId: currentUser.id
      };

      console.log('Creating session with data:', sessionData);

      let savedSession;
      
      try {
        savedSession = await sessionsAPI.create(sessionData);
        console.log('Session created via API:', savedSession);
        
        // Update booked sessions
        setBookedSessions(prev => [...prev, {
          therapistId: selectedTherapist!._id,
          date: sessionDate,
          time: selectedTime
        }]);
      } catch (apiError) {
        console.error('API session creation failed, using localStorage:', apiError);
        savedSession = {
          _id: `local-${Date.now()}`,
          ...sessionData,
          userId: currentUser.id
        };
      }

      // Save to localStorage
      const storedSessions = localStorage.getItem('user-sessions');
      const sessions = storedSessions ? JSON.parse(storedSessions) : [];
      
      const sessionForStorage = {
        id: savedSession._id || Date.now().toString(),
        therapistId: sessionData.therapistId,
        therapistName: sessionData.therapistName,
        therapistInitials: sessionData.therapistInitials,
        date: sessionData.date,
        time: sessionData.time,
        sessionType: sessionData.sessionType,
        status: sessionData.status,
        duration: sessionData.duration,
        userId: currentUser.id
      };
      
      sessions.push(sessionForStorage);
      localStorage.setItem('user-sessions', JSON.stringify(sessions));

      const displayDate = selectedDate!.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric'
      });
      
      toast.success(`Session booked with ${getTherapistDisplayName(selectedTherapist!)} for ${displayDate} at ${selectedTime}!`);
      setDialogOpen(false);
      
      onSessionBooked(
        selectedTherapist!._id,
        getTherapistDisplayName(selectedTherapist!),
        getTherapistDisplayName(selectedTherapist!).split(' ').map(n => n[0]).join(''),
        sessionType,
        selectedDate!,
        selectedTime
      );
    } catch (error: any) {
      console.error('Booking error:', error);
      toast.error(error.message || 'Failed to book session. Please try again.');
    } finally {
      setIsBooking(false);
    }
  };

  const formatSelectedDate = (): string => {
    if (!selectedDate) return 'No date selected';
    return selectedDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Check if date is in the past (for calendar disabling)
  const isDateDisabled = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const allSpecializations = Array.from(
    new Set(
      therapists.flatMap(t => t.specialty || [])
    )
  ).filter(Boolean);

  const allLanguages = Array.from(
    new Set(therapists.flatMap(t => getTherapistLanguages(t)))
  );

  const refreshTherapists = () => {
    loadTherapists();
    loadBookedSessions();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50">
      {/* Enhanced Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-indigo-100 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                Find Your Therapist
              </h1>
              <p className="text-sm text-muted-foreground">All sessions are completely anonymous and confidential</p>
            </div>
          </div>
          <Button 
            onClick={refreshTherapists} 
            variant="outline" 
            className="flex items-center gap-2"
            disabled={loading}
          >
            <UserCheck className="h-4 w-4" />
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Enhanced Filters */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-3">
              <Badge 
                variant={specialization === "all" ? "default" : "outline"} 
                className="cursor-pointer hover:bg-accent"
                onClick={() => setSpecialization("all")}
              >
                All Specialties
              </Badge>
              {allSpecializations.map(spec => (
                <Badge 
                  key={spec}
                  variant={specialization === spec ? "default" : "outline"} 
                  className="cursor-pointer hover:bg-accent"
                  onClick={() => setSpecialization(spec)}
                >
                  {spec}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Error Message */}
        {error && (
          <Card className="mb-6 bg-red-50 border-red-200">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800">Unable to load therapists</p>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Enhanced Filters Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Specialization Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Specialization</label>
                  <select 
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="all">All Specializations</option>
                    {allSpecializations.map(spec => (
                      <option key={spec} value={spec}>{spec}</option>
                    ))}
                  </select>
                </div>

                {/* Max Rate Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Max Hourly Rate: ${maxRate}
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="300"
                    step="10"
                    value={maxRate}
                    onChange={(e) => setMaxRate(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>$50</span>
                    <span>$300</span>
                  </div>
                </div>

                {/* Language Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Language</label>
                  <select 
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="all">All Languages</option>
                    {allLanguages.map(lang => (
                      <option key={lang} value={lang}>{lang}</option>
                    ))}
                  </select>
                </div>

                {/* Rating Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Min Rating</label>
                  <select 
                    value={minRating}
                    onChange={(e) => setMinRating(Number(e.target.value))}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value={0}>Any Rating</option>
                    <option value={4.0}>4.0+ Stars</option>
                    <option value={4.5}>4.5+ Stars</option>
                  </select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Therapists List */}
          <div className="lg:col-span-3">
            {/* Search */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Search therapists, specializations, or descriptions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Loading therapists from database...</p>
              </div>
            ) : therapists.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <UserCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Therapists Available</h3>
                  <p className="text-muted-foreground">
                    There are currently no registered therapists on the platform.
                  </p>
                  <Button onClick={refreshTherapists} className="mt-4">
                    Check Again
                  </Button>
                </CardContent>
              </Card>
            ) : filteredTherapists.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No therapists found</h3>
                  <p className="text-muted-foreground">
                    Try adjusting your filters or search terms.
                  </p>
                  <Button 
                    onClick={() => {
                      setSearchTerm("");
                      setSpecialization("all");
                      setMaxRate(200);
                      setLanguage("all");
                      setMinRating(0);
                    }}
                    variant="outline"
                    className="mt-4"
                  >
                    Clear All Filters
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {filteredTherapists.map((therapist) => (
                  <Card key={therapist._id} className="hover:shadow-lg transition-all border-2 hover:border-indigo-200">
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        <Avatar className="w-16 h-16">
                          <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-lg">
                            {getTherapistDisplayName(therapist).split(' ').map((n: string) => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-xl font-semibold">{getTherapistDisplayName(therapist)}</h3>
                              <div className="flex items-center gap-4 mt-2">
                                <div className="flex items-center gap-1">
                                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                                  <span className="text-sm font-medium">{therapist.rating}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm text-muted-foreground">
                                    {getTherapistExperience(therapist)} years experience
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm text-muted-foreground">
                                    ${getTherapistHourlyRate(therapist)}/hr
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <Button 
                              onClick={() => {
                                setSelectedTherapist(therapist);
                                setSelectedDate(new Date());
                                setSelectedTime('');
                                setDialogOpen(true);
                              }}
                              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                            >
                              Book Session
                            </Button>
                          </div>

                          <div className="mt-4">
                            <div className="flex flex-wrap gap-2 mb-3">
                              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                {getTherapistSpecialization(therapist)}
                              </Badge>
                              {therapist.credentials && (
                                <Badge variant="outline" className="bg-green-50 text-green-700">
                                  Verified
                                </Badge>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-2 mb-2">
                              <Languages className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                {getTherapistLanguages(therapist).join(', ')}
                              </span>
                            </div>

                            <p className="text-muted-foreground mt-2">{getTherapistDescription(therapist)}</p>
                            
                            <div className="mt-3">
                              <p className="text-sm font-medium">Availability:</p>
                              <div className="flex flex-wrap gap-2 mt-1">
                                {(therapist.availability ? [therapist.availability] : ['Monday-Friday: 9AM-6PM']).map((slot, index) => (
                                  <Badge key={index} variant="outline" className="bg-green-50 text-green-700">
                                    {slot}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Info Card */}
        <Card className="mt-8 bg-gradient-to-br from-indigo-600 to-purple-600 text-white border-0">
          <CardContent className="p-8">
            <h3 className="text-2xl font-bold mb-4">How Anonymous Sessions Work</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mb-3">
                  <span className="text-xl">1</span>
                </div>
                <h4 className="mb-2">Choose a Therapist</h4>
                <p className="text-sm text-indigo-100">
                  Browse specialists and select based on their expertise
                </p>
              </div>
              <div>
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mb-3">
                  <span className="text-xl">2</span>
                </div>
                <h4 className="mb-2">Book Your Session</h4>
                <p className="text-sm text-indigo-100">
                  Select date, time, and session type (chat or audio call)
                </p>
              </div>
              <div>
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mb-3">
                  <span className="text-xl">3</span>
                </div>
                <h4 className="mb-2">Stay Anonymous</h4>
                <p className="text-sm text-indigo-100">
                  Connect using your anonymous name, identity protected
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Booking Dialog with Availability */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Book Session with {selectedTherapist ? getTherapistDisplayName(selectedTherapist) : ''}</DialogTitle>
            <DialogDescription>
              Choose your preferred date, time, and session type. Your identity will remain anonymous.
            </DialogDescription>
          </DialogHeader>
          <div className="grid md:grid-cols-2 gap-6 py-4">
            <div className="space-y-4">
              <div>
                <h4 className="mb-3 flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  Select Date
                </h4>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  disabled={isDateDisabled}
                  className="rounded-md border"
                />
                {selectedDate && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Selected: {formatSelectedDate()}
                  </p>
                )}
              </div>
              
              {/* Availability Information */}
              {selectedTherapist && (
                <Card>
                  <CardContent className="pt-4">
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Therapist Availability
                    </h4>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      {therapistAvailability.length > 0 ? (
                        therapistAvailability.map((avail, index) => (
                          <div key={index} className="flex justify-between">
                            <span>{avail.dayOfWeek}:</span>
                            <span>{avail.timeSlots.length} slots available</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-2">
                          <p>Standard business hours (Mon-Fri, 9AM-6PM)</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Select Time
                </h4>
                <Select 
                  value={selectedTime} 
                  onValueChange={setSelectedTime}
                  disabled={!selectedDate}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      !selectedDate 
                        ? "Select a date first" 
                        : availableTimeSlots.length === 0 
                          ? "No available slots"
                          : "Choose a time slot"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTimeSlots.map((time) => (
                      <SelectItem 
                        key={time} 
                        value={time}
                        className="flex items-center justify-between"
                      >
                        <span>{time}</span>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </SelectItem>
                    ))}
                    {availableTimeSlots.length === 0 && selectedDate && (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-500" />
                        No available time slots for this date
                      </div>
                    )}
                  </SelectContent>
                </Select>
                {selectedDate && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {availableTimeSlots.length} time slot{availableTimeSlots.length !== 1 ? 's' : ''} available
                    {selectedDate.toDateString() === new Date().toDateString() && ' (today)'}
                  </p>
                )}
              </div>
              <div>
                <h4 className="mb-3">Session Type</h4>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant={sessionType === 'chat' ? 'default' : 'outline'}
                    className="h-20 flex-col gap-2"
                    onClick={() => setSessionType('chat')}
                  >
                    <MessageCircle className="h-5 w-5" />
                    <span>Chat</span>
                  </Button>
                  <Button
                    variant={sessionType === 'audio' ? 'default' : 'outline'}
                    className="h-20 flex-col gap-2"
                    onClick={() => setSessionType('audio')}
                  >
                    <Phone className="h-5 w-5" />
                    <span>Audio Call</span>
                  </Button>
                </div>
              </div>
              <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                <h4 className="text-sm mb-2">Session Details</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Duration: 50 minutes</li>
                  <li>• Your identity: Anonymous</li>
                  <li>• Encrypted & Private</li>
                  {sessionType === 'audio' && <li>• Voice masking available</li>}
                </ul>
              </div>
              <Button 
                className="w-full" 
                size="lg"
                onClick={handleBookSession}
                disabled={!isBookingValid() || isBooking}
              >
                {isBooking ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Booking...
                  </>
                ) : (
                  'Confirm Booking'
                )}
              </Button>
              {!isBookingValid() && selectedDate && selectedTime && (
                <p className="text-xs text-red-500 text-center">
                  Selected time is not available. Please choose a different time.
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}