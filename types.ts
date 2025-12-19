
export interface TeamRegistration {
  id?: string;
  team_name: string;
  coach_name: string;
  contact_email: string;
  region: string;
  created_at?: string;
  logo_url?: string;
  bio?: string;
  wins?: number;
  losses?: number;
  gallery?: string[]; // مصفوفة لصور الفريق
}

export interface RegistrationState {
  status: 'idle' | 'submitting' | 'success' | 'error';
  errorMessage: string | null;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}

export interface ChatContact {
  id: string;
  name: string;
  avatar: string;
  role: 'Admin' | 'Coach';
  lastMessage?: string;
  unreadCount?: number;
}

export interface LiveChannel {
  id: string;
  name: string;
  description: string;
  thumbnail_url: string;
  stream_url: string;
  is_active: boolean;
  created_at: string;
}
