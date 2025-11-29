// API Configuration - Use relative URLs for both environments
const API_BASE_URL = '/api';

console.log(' API Base URL:', API_BASE_URL, 'Current origin:', window.location.origin);

// Helper function to get auth token
const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

// Helper function to handle API responses
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(error.message || 'Request failed');
  }
  return response.json();
}

// Generic fetch wrapper with auth
async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  return fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  });
}

// ==================== USER INTERFACE ====================

export interface User {
  id: string;
  anonymousName: string;
  username: string;
  role: 'user' | 'therapist';
  email?: string;
  name?: string;
  fullName?: string;
  phone?: string;
  licenseNumber?: string;
  specialization?: string;
  yearsOfExperience?: number;
  bio?: string;
  createdAt: string;
}

// ==================== AUTH API ====================

export interface LoginCredentials {
  username: string; 
  password: string;
  role: 'user' | 'therapist';
}

export interface SignupData extends LoginCredentials {
  email?: string;
  name?: string;
  fullName?: string;
  phone?: string;
  licenseNumber?: string;
  specialization?: string;
  yearsOfExperience?: number;
  credentials?: string;
  bio?: string;
  anonymousName?: string; // Only for users
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface AnonymousNameCheck {
  available: boolean;
  message: string;
}

export interface AnimalNameSuggestions {
  suggestions: string[];
}

export const authAPI = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await fetchWithAuth('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    const data = await handleResponse<AuthResponse>(response);
    
    // Store both token and user data consistently
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('currentUser', JSON.stringify(data.user));
    
    console.log('Login successful, user stored:', data.user);
    return data;
  },

  signup: async (data: SignupData): Promise<AuthResponse> => {
    const response = await fetchWithAuth('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const authData = await handleResponse<AuthResponse>(response);
    
    // Store both token and user data consistently
    localStorage.setItem('authToken', authData.token);
    localStorage.setItem('currentUser', JSON.stringify(authData.user));
    
    console.log('Signup successful, user stored:', authData.user);
    return authData;
  },

  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('currentSession');
    console.log('User logged out, localStorage cleared');
  },

  getCurrentUser: (): User | null => {
    try {
      const userStr = localStorage.getItem('currentUser');
      if (!userStr) {
        console.log('No user found in localStorage');
        return null;
      }
      
      const user = JSON.parse(userStr);
      console.log('Retrieved user from localStorage:', user);
      return user;
    } catch (error) {
      console.error('Error parsing user from localStorage:', error);
      return null;
    }
  },

  // New method to refresh user data from server
  refreshCurrentUser: async (): Promise<User | null> => {
    try {
      const token = getAuthToken();
      if (!token) return null;

      const response = await fetchWithAuth('/auth/me');
      const data = await handleResponse<{ user: User }>(response);
      
      localStorage.setItem('currentUser', JSON.stringify(data.user));
      console.log('Refreshed user data:', data.user);
      return data.user;
    } catch (error) {
      console.error('Error refreshing user data:', error);
      return null;
    }
  },

  // Check anonymous name availability (for users only)
  checkAnonymousName: async (anonymousName: string): Promise<AnonymousNameCheck> => {
    const response = await fetchWithAuth('/auth/check-anonymous-name', {
      method: 'POST',
      body: JSON.stringify({ anonymousName }),
    });
    return handleResponse<AnonymousNameCheck>(response);
  },

  // Get animal name suggestions (for users only)
  getAnimalNameSuggestions: async (count: number = 5): Promise<AnimalNameSuggestions> => {
    const response = await fetchWithAuth(`/auth/animal-name-suggestions?count=${count}`);
    return handleResponse<AnimalNameSuggestions>(response);
  },
};

// Re-export auth functions for convenience
export const login = authAPI.login;
export const signupUser = authAPI.signup;
export const signupTherapist = authAPI.signup;
export const logout = authAPI.logout;
export const getCurrentUser = authAPI.getCurrentUser;
export const refreshCurrentUser = authAPI.refreshCurrentUser;
export const checkAnonymousName = authAPI.checkAnonymousName;
export const getAnimalNameSuggestions = authAPI.getAnimalNameSuggestions;

export const usersAPI = {
  // Get user by ID
  getById: async (id: string): Promise<User> => {
    const response = await fetchWithAuth(`/users/${id}`);
    return handleResponse<User>(response);
  },

  // Get multiple users by IDs
  getByIds: async (ids: string[]): Promise<User[]> => {
    const response = await fetchWithAuth(`/users?ids=${ids.join(',')}`);
    return handleResponse<User[]>(response);
  },

  // Update user profile
  update: async (updates: Partial<User>): Promise<User> => {
    const response = await fetchWithAuth('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return handleResponse<User>(response);
  },
};

// ==================== SESSIONS API ====================

export interface Session {
  _id?: string;
  userId: string;
  therapistId: string;
  therapistName: string;
  therapistInitials: string;
  // User data fields for direct access
  userName?: string;
  userAnonymousName?: string;
  userInitials?: string;
  date: string;
  time: string;
  sessionType: 'chat' | 'audio';
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  rating?: number;
  duration?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const sessionsAPI = {
  // Book a new session
  create: async (sessionData: Omit<Session, '_id' | 'userId'>): Promise<Session> => {
    const response = await fetchWithAuth('/sessions', {
      method: 'POST',
      body: JSON.stringify(sessionData),
    });
    return handleResponse<Session>(response);
  },

  // Get user's upcoming sessions
  getUpcoming: async (): Promise<Session[]> => {
    const response = await fetchWithAuth('/sessions/upcoming');
    return handleResponse<Session[]>(response);
  },

  // Get user's joinable sessions
  getJoinable: async (): Promise<Session[]> => {
    const response = await fetchWithAuth('/sessions/joinable');
    return handleResponse<Session[]>(response);
  },

  // Get user's past sessions
  getPast: async (): Promise<Session[]> => {
    const response = await fetchWithAuth('/sessions/past');
    return handleResponse<Session[]>(response);
  },

  // Get all user sessions
  getAll: async (): Promise<Session[]> => {
    const response = await fetchWithAuth('/sessions');
    return handleResponse<Session[]>(response);
  },

  // Get therapist's upcoming sessions
  getTherapistUpcoming: async (): Promise<Session[]> => {
    const response = await fetchWithAuth('/sessions/therapist/upcoming');
    return handleResponse<Session[]>(response);
  },

  // Get therapist's joinable sessions
  getTherapistJoinable: async (): Promise<Session[]> => {
    const response = await fetchWithAuth('/sessions/therapist/joinable');
    return handleResponse<Session[]>(response);
  },
  // Get therapist's past sessions
  getTherapistPast: async (): Promise<Session[]> => {
    const response = await fetchWithAuth('/sessions/therapist/past');
    return handleResponse<Session[]>(response);
  },

  // Get all therapist sessions
  getTherapistSessions: async (): Promise<Session[]> => {
    const response = await fetchWithAuth('/sessions/therapist/sessions');
    return handleResponse<Session[]>(response);
  },

  // Update a session
  update: async (sessionId: string, updates: Partial<Session>): Promise<Session> => {
    const response = await fetchWithAuth(`/sessions/${sessionId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return handleResponse<Session>(response);
  },

  // Cancel a session
  cancel: async (sessionId: string): Promise<void> => {
    const response = await fetchWithAuth(`/sessions/${sessionId}`, {
      method: 'DELETE',
    });
    return handleResponse<void>(response);
  },

  // Rate a session
  rate: async (sessionId: string, rating: number): Promise<Session> => {
    const response = await fetchWithAuth(`/sessions/${sessionId}/rate`, {
      method: 'POST',
      body: JSON.stringify({ rating }),
    });
    return handleResponse<Session>(response);
  },

  // Check if session can be joined
  canJoinSession: async (sessionId: string): Promise<{ 
    canJoin: boolean; 
    reason: string;
    sessionTime: string;
    currentTime: string;
    status: string;
  }> => {
    const response = await fetchWithAuth(`/sessions/${sessionId}/can-join`);
    return handleResponse<any>(response);
  },

  // Auto-complete past sessions
  autoCompletePastSessions: async (): Promise<{ 
    message: string; 
    completedCount: number;
  }> => {
    const response = await fetchWithAuth('/sessions/auto-complete-past', {
      method: 'POST',
    });
    return handleResponse<any>(response);
  },
};

// ==================== THERAPISTS API ====================

export interface Therapist {
  _id: string;
  userId: string;
  name: string;
  fullName?: string;
  email?: string;
  phone?: string;
  licenseNumber?: string;
  specialization?: string;
  yearsOfExperience?: number;
  initials: string;
  specialty: string[];
  rating: number;
  reviews: number;
  availability: string;
  about: string;
  description?: string;
  credentials: string;
  color: string;
  hourlyRate?: number;
  languages?: string[];
  experience?: number;
  realName: string;
}

export interface TherapistAvailability {
  dayOfWeek: string;
  timeSlots: string[];
}

export const therapistsAPI = {
  // Get current therapist profile
  getCurrent: async (): Promise<Therapist> => {
    const response = await fetchWithAuth('/therapists/me');
    return handleResponse<Therapist>(response);
  },

  // Get therapists for discovery with filters
  discover: async (filters?: {
    specialization?: string;
    minRating?: number;
    maxRate?: number;
    language?: string;
  }): Promise<Therapist[]> => {
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const response = await fetchWithAuth(`/therapists/discover?${queryParams}`);
    return handleResponse<Therapist[]>(response);
  },

  // Get all therapists
  getAll: async (): Promise<Therapist[]> => {
    try {
      console.log("Fetching therapists from DISCOVER endpoint...");
      const response = await fetchWithAuth('/therapists/discover');
      const therapists = await handleResponse<Therapist[]>(response);
      console.log("Therapists API response:", therapists);
      return therapists;
    } catch (error) {
      console.error("Error fetching therapists from API:", error);
      throw error;
    }
  },

  // Get therapist by ID
  getById: async (id: string): Promise<Therapist> => {
    const response = await fetchWithAuth(`/therapists/${id}`);
    return handleResponse<Therapist>(response);
  },

  // Get therapist availability
  getAvailability: async (therapistId: string): Promise<TherapistAvailability[]> => {
    const response = await fetchWithAuth(`/therapists/${therapistId}/availability`);
    return handleResponse<TherapistAvailability[]>(response);
  },

  // Update therapist availability (therapist only)
  updateAvailability: async (availability: TherapistAvailability[]): Promise<void> => {
    const response = await fetchWithAuth('/therapists/availability', {
      method: 'PUT',
      body: JSON.stringify({ availability }),
    });
    return handleResponse<void>(response);
  },

  // Get all registered therapists (compatible with old interface)
  getAllTherapists: async (): Promise<Therapist[]> => {
    return therapistsAPI.getAll();
  }
};

// ==================== MOOD LOGS API ====================

export interface MoodLog {
  _id?: string;
  userId: string;
  date: string;
  mood: 'Great' | 'Good' | 'Okay' | 'Not Great' | 'Bad';
  note: string;
  createdAt?: string;
}

export const moodAPI = {
  // Create a mood log
  create: async (moodData: Omit<MoodLog, '_id' | 'userId'>): Promise<MoodLog> => {
    const response = await fetchWithAuth('/mood', {
      method: 'POST',
      body: JSON.stringify(moodData),
    });
    return handleResponse<MoodLog>(response);
  },

  // Get all mood logs
  getAll: async (): Promise<MoodLog[]> => {
    const response = await fetchWithAuth('/mood');
    return handleResponse<MoodLog[]>(response);
  },

  // Get mood logs by date range
  getByDateRange: async (startDate: string, endDate: string): Promise<MoodLog[]> => {
    const response = await fetchWithAuth(`/mood?startDate=${startDate}&endDate=${endDate}`);
    return handleResponse<MoodLog[]>(response);
  },

  // Get mood statistics
  getStats: async (): Promise<{ averageMood: number; totalLogs: number; moodDistribution: Record<string, number> }> => {
    const response = await fetchWithAuth('/mood/stats');
    return handleResponse<any>(response);
  },
};

// ==================== JOURNAL API ====================

export interface JournalEntry {
  _id?: string;
  userId: string;
  title: string;
  content: string;
  mood: string;
  tags: string[];
  date: string;
  createdAt?: string;
  updatedAt?: string;
}

export const journalAPI = {
  // Create a journal entry
  create: async (entryData: Omit<JournalEntry, '_id' | 'userId'>): Promise<JournalEntry> => {
    const response = await fetchWithAuth('/journal', {
      method: 'POST',
      body: JSON.stringify(entryData),
    });
    return handleResponse<JournalEntry>(response);
  },

  // Get all journal entries
  getAll: async (): Promise<JournalEntry[]> => {
    const response = await fetchWithAuth('/journal');
    return handleResponse<JournalEntry[]>(response);
  },

  // Get journal entry by ID
  getById: async (id: string): Promise<JournalEntry> => {
    const response = await fetchWithAuth(`/journal/${id}`);
    return handleResponse<JournalEntry>(response);
  },

  // Update a journal entry
  update: async (id: string, updates: Partial<JournalEntry>): Promise<JournalEntry> => {
    const response = await fetchWithAuth(`/journal/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return handleResponse<JournalEntry>(response);
  },

  // Delete a journal entry
  delete: async (id: string): Promise<void> => {
    const response = await fetchWithAuth(`/journal/${id}`, {
      method: 'DELETE',
    });
    return handleResponse<void>(response);
  },
};

// ==================== MESSAGES API (for live sessions) ====================

export interface Message {
  _id?: string;
  sessionId: string;
  senderId: string;
  senderType: 'user' | 'therapist';
  text: string;
  timestamp: string;
}

export const messagesAPI = {
  // Get messages for a session
  getBySession: async (sessionId: string): Promise<Message[]> => {
    const response = await fetchWithAuth(`/messages/${sessionId}`);
    return handleResponse<Message[]>(response);
  },

  // Send a message (typically done via Socket.io, but API fallback)
  send: async (messageData: Omit<Message, '_id'>): Promise<Message> => {
    const response = await fetchWithAuth('/messages', {
      method: 'POST',
      body: JSON.stringify(messageData),
    });
    return handleResponse<Message>(response);
  },
};

// ==================== EXERCISES API ====================

export interface Exercise {
  _id: string;
  title: string;
  description: string;
  duration: string;
  category: string;
  instructions: string[];
  benefits: string[];
}

export const exercisesAPI = {
  // Get all exercises
  getAll: async (): Promise<Exercise[]> => {
    const response = await fetchWithAuth('/exercises');
    return handleResponse<Exercise[]>(response);
  },

  // Get exercises by category
  getByCategory: async (category: string): Promise<Exercise[]> => {
    const response = await fetchWithAuth(`/exercises?category=${category}`);
    return handleResponse<Exercise[]>(response);
  },
};

// ==================== RESOURCES API ====================

export interface Resource {
  _id: string;
  title: string;
  description: string;
  category: string;
  url?: string;
  content?: string;
  type: 'article' | 'video' | 'podcast' | 'guide';
}

export const resourcesAPI = {
  // Get all resources
  getAll: async (): Promise<Resource[]> => {
    const response = await fetchWithAuth('/resources');
    return handleResponse<Resource[]>(response);
  },

  // Get resources by category
  getByCategory: async (category: string): Promise<Resource[]> => {
    const response = await fetchWithAuth(`/resources?category=${category}`);
    return handleResponse<Resource[]>(response);
  },
};

// Export all APIs
export default {
  auth: authAPI,
  sessions: sessionsAPI,
  therapists: therapistsAPI,
  mood: moodAPI,
  journal: journalAPI,
  messages: messagesAPI,
  exercises: exercisesAPI,
  resources: resourcesAPI,
  users: usersAPI, 
};