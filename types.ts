
export interface TeamRegistration {
  id?: string;
  team_name: string;
  coach_name: string;
  contact_email: string;
  password?: string;
  region: string;
  municipality?: string; 
  players_count?: number; 
  created_at?: any;
  logo_url?: string;
  bio?: string;
  wins?: number;
  losses?: number;
  gallery?: string[]; 
}

export interface Comment {
  id: string;
  teamId: string;
  teamName: string;
  teamLogo: string;
  text: string;
  created_at: any;
}

export interface Post {
  id?: string;
  teamId: string;
  teamName: string;
  teamLogo: string;
  content?: string; 
  imageUrl?: string;
  likes?: string[]; 
  comments?: Comment[];
  created_at: any;
}

export interface LiveChannel {
  id?: string;
  name: string;
  description: string;
  thumbnail_url: string;
  stream_url: string;
  is_active: boolean;
  created_at?: any;
}

export interface AdConfig {
  under_header: string;
  after_draw: string;
  hub_top: string;
  hub_bottom: string;
}

export interface Match {
  id?: string;
  homeTeamId: string;
  homeTeamName: string;
  homeTeamLogo: string;
  awayTeamId: string;
  awayTeamName: string;
  awayTeamLogo: string;
  date: string; // مثال: 2024-05-20
  time: string; // مثال: 18:00
  scoreHome: number;
  scoreAway: number;
  status: 'upcoming' | 'finished' | 'live';
  tournament_round?: string; // مثال: نصف النهائي
  created_at: any;
}

export interface VisitorStats {
  total_visits: number;
}
