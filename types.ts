
export interface TeamRegistration {
  id?: string;
  team_name: string;
  coach_name: string;
  contact_email: string;
  password?: string;
  region: string;
  municipality?: string; // البلدية
  players_count?: number; // عدد اللاعبين
  created_at?: any;
  logo_url?: string;
  bio?: string;
  wins?: number;
  losses?: number;
  gallery?: string[]; // مصفوفة لصور الفريق
}

export interface Post {
  id?: string;
  teamId: string;
  teamName: string;
  teamLogo: string;
  content: string;
  imageUrl?: string;
  created_at: any;
}

export interface RegistrationState {
  status: 'idle' | 'submitting' | 'success' | 'error';
  errorMessage: string | null;
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
