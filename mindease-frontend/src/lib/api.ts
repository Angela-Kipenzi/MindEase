// API Configuration - Use absolute URLs for Render deployment
const getApiBaseUrl = () => {
  // Priority 1: Environment variable (set in Render dashboard)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Priority 2: Hardcoded for Render
  if (window.location.hostname.includes('onrender.com')) {
    return 'https://mindease-backend-pze6.onrender.com/api';
  }
  
  // Priority 3: Default local development
  return '/api';
};

const API_BASE_URL = getApiBaseUrl();

console.log('API Base URL:', API_BASE_URL, 'Current origin:', window.location.origin);

// Helper function to get auth token
const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

// Helper function to handle API responses
async function handleResponse<T>(response: Response): Promise<T> {
  console.log('Response status:', response.status);
  console.log('Response headers:', Object.fromEntries(response.headers.entries()));
  
  if (!response.ok) {
    // Try to get error text first
    const errorText = await response.text();
    console.error('Error response text:', errorText);
    
    let errorData;
    try {
      errorData = JSON.parse(errorText);
    } catch {
      errorData = { message: errorText || 'An error occurred' };
    }
    
    // Check for CORS errors
    if (response.status === 0) {
      throw new Error('Network error or CORS blocked the request. Check if backend is running and CORS is configured.');
    }
    
    throw new Error(errorData.message || `Request failed with status ${response.status}`);
  }
  
  try {
    return await response.json();
  } catch (error) {
    console.error('JSON parse error:', error);
    throw new Error('Invalid JSON response from server');
  }
}

// Generic fetch wrapper with auth
async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  console.log('Making request to:', `${API_BASE_URL}${url}`);
  
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

export interface SignupData {
  email: string;
  password: string;
  role: 'user' | 'therapist';
  anonymousName?: string;
  fullName?: string;
  phone?: string;
  licenseNumber?: string;
  specialization?: string;
  yearsOfExperience?: number;
  credentials?: string;
  bio?: string;
  languages?: string[];
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
    console.log('Attempting login to:', `${API_BASE_URL}/auth/login`);
    console.log('Credentials:', { ...credentials, password: '***' });
    
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
    console.log('Attempting signup to:', `${API_BASE_URL}/auth/signup`);
    
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

  checkAnonymousName: async (anonymousName: string): Promise<AnonymousNameCheck> => {
    const response = await fetchWithAuth('/auth/check-anonymous-name', {
      method: 'POST',
      body: JSON.stringify({ anonymousName }),
    });
    return handleResponse<AnonymousNameCheck>(response);
  },

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
  getById: async (id: string): Promise<User> => {
    const response = await fetchWithAuth(`/users/${id}`);
    return handleResponse<User>(response);
  },

  getByIds: async (ids: string[]): Promise<User[]> => {
    const response = await fetchWithAuth(`/users?ids=${ids.join(',')}`);
    return handleResponse<User[]>(response);
  },

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
  rate?: number; // Added for $49 standard rate
}

export const sessionsAPI = {
  create: async (sessionData: Omit<Session, '_id' | 'userId'>): Promise<Session> => {
    console.log('Creating session with data:', sessionData);
    
    const response = await fetchWithAuth('/sessions', {
      method: 'POST',
      body: JSON.stringify(sessionData),
    });
    return handleResponse<Session>(response);
  },

  getUpcoming: async (): Promise<Session[]> => {
    const response = await fetchWithAuth('/sessions/upcoming');
    return handleResponse<Session[]>(response);
  },

  getJoinable: async (): Promise<Session[]> => {
    const response = await fetchWithAuth('/sessions/joinable');
    return handleResponse<Session[]>(response);
  },

  getPast: async (): Promise<Session[]> => {
    const response = await fetchWithAuth('/sessions/past');
    return handleResponse<Session[]>(response);
  },

  getAll: async (): Promise<Session[]> => {
    const response = await fetchWithAuth('/sessions');
    return handleResponse<Session[]>(response);
  },

  getTherapistUpcoming: async (): Promise<Session[]> => {
    const response = await fetchWithAuth('/sessions/therapist/upcoming');
    return handleResponse<Session[]>(response);
  },

  getTherapistJoinable: async (): Promise<Session[]> => {
    const response = await fetchWithAuth('/sessions/therapist/joinable');
    return handleResponse<Session[]>(response);
  },

  getTherapistPast: async (): Promise<Session[]> => {
    const response = await fetchWithAuth('/sessions/therapist/past');
    return handleResponse<Session[]>(response);
  },

  getTherapistSessions: async (): Promise<Session[]> => {
    const response = await fetchWithAuth('/sessions/therapist/sessions');
    return handleResponse<Session[]>(response);
  },

  update: async (sessionId: string, updates: Partial<Session>): Promise<Session> => {
    const response = await fetchWithAuth(`/sessions/${sessionId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return handleResponse<Session>(response);
  },

  cancel: async (sessionId: string): Promise<void> => {
    const response = await fetchWithAuth(`/sessions/${sessionId}`, {
      method: 'DELETE',
    });
    return handleResponse<void>(response);
  },

  rate: async (sessionId: string, rating: number): Promise<Session> => {
    const response = await fetchWithAuth(`/sessions/${sessionId}/rate`, {
      method: 'POST',
      body: JSON.stringify({ rating }),
    });
    return handleResponse<Session>(response);
  },

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
  bio?: string;
}

export interface TherapistAvailability {
  dayOfWeek: string;
  timeSlots: string[];
}

export const therapistsAPI = {
  getCurrent: async (): Promise<Therapist> => {
    const response = await fetchWithAuth('/therapists/me');
    return handleResponse<Therapist>(response);
  },

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

  getById: async (id: string): Promise<Therapist> => {
    const response = await fetchWithAuth(`/therapists/${id}`);
    return handleResponse<Therapist>(response);
  },

  getAvailability: async (therapistId: string): Promise<TherapistAvailability[]> => {
    const response = await fetchWithAuth(`/therapists/${therapistId}/availability`);
    return handleResponse<TherapistAvailability[]>(response);
  },

  updateAvailability: async (availability: TherapistAvailability[]): Promise<void> => {
    const response = await fetchWithAuth('/therapists/availability', {
      method: 'PUT',
      body: JSON.stringify({ availability }),
    });
    return handleResponse<void>(response);
  },

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
  create: async (moodData: Omit<MoodLog, '_id' | 'userId'>): Promise<MoodLog> => {
    const response = await fetchWithAuth('/mood', {
      method: 'POST',
      body: JSON.stringify(moodData),
    });
    return handleResponse<MoodLog>(response);
  },

  getAll: async (): Promise<MoodLog[]> => {
    const response = await fetchWithAuth('/mood');
    return handleResponse<MoodLog[]>(response);
  },

  getByDateRange: async (startDate: string, endDate: string): Promise<MoodLog[]> => {
    const response = await fetchWithAuth(`/mood?startDate=${startDate}&endDate=${endDate}`);
    return handleResponse<MoodLog[]>(response);
  },

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
  create: async (entryData: Omit<JournalEntry, '_id' | 'userId'>): Promise<JournalEntry> => {
    const response = await fetchWithAuth('/journal', {
      method: 'POST',
      body: JSON.stringify(entryData),
    });
    return handleResponse<JournalEntry>(response);
  },

  getAll: async (): Promise<JournalEntry[]> => {
    const response = await fetchWithAuth('/journal');
    return handleResponse<JournalEntry[]>(response);
  },

  getById: async (id: string): Promise<JournalEntry> => {
    const response = await fetchWithAuth(`/journal/${id}`);
    return handleResponse<JournalEntry>(response);
  },

  update: async (id: string, updates: Partial<JournalEntry>): Promise<JournalEntry> => {
    const response = await fetchWithAuth(`/journal/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return handleResponse<JournalEntry>(response);
  },

  delete: async (id: string): Promise<void> => {
    const response = await fetchWithAuth(`/journal/${id}`, {
      method: 'DELETE',
    });
    return handleResponse<void>(response);
  },
};

// ==================== MESSAGES API ====================

export interface Message {
  _id?: string;
  sessionId: string;
  senderId: string;
  senderType: 'user' | 'therapist';
  text: string;
  timestamp: string;
}

export const messagesAPI = {
  getBySession: async (sessionId: string): Promise<Message[]> => {
    const response = await fetchWithAuth(`/messages/${sessionId}`);
    return handleResponse<Message[]>(response);
  },

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
  getAll: async (): Promise<Exercise[]> => {
    const response = await fetchWithAuth('/exercises');
    return handleResponse<Exercise[]>(response);
  },

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
  getAll: async (): Promise<Resource[]> => {
    const response = await fetchWithAuth('/resources');
    return handleResponse<Resource[]>(response);
  },

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