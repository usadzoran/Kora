
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
  home_hero_bottom: string;
  after_draw: string;
  hub_top: string;
  hub_bottom: string;
  matches_top: string;
  matches_bottom: string;
  live_top: string;
  profile_top: string;
}

export interface Match {
  id?: string;
  homeTeamId: string;
  homeTeamName: string;
  homeTeamLogo: string;
  awayTeamId: string;
  awayTeamName: string;
  awayTeamLogo: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  scoreHome: number;
  scoreAway: number;
  status: 'upcoming' | 'finished' | 'live';
  tournament_round?: string;
  created_at: any;
}

export interface VisitorStats {
  total_visits: number;
}
