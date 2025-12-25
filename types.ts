export interface City {
  id: string;
  name: string;
  image: string;
  places: Place[];
  hotels: Hotel[];
}

export interface Place {
  id: string;
  name: string;
  image: string;
  rating: number;
  price?: string;
  description: string;
  category: 'tourist' | 'featured';
  mapX: number;
  mapY: number;
}

export interface Hotel {
  id: string;
  name: string;
  image: string;
  rating: number;
  pricePerNight: string;
  description: string;
  mapX: number;
  mapY: number;
}

export type ViewState = 'home' | 'city' | 'place' | 'map' | 'profile' | 'itinerary';

export interface TeamRegistration {
  id: string;
  team_name: string;
  contact_email: string;
  logo_url?: string;
  wins?: number;
  losses?: number;
  bio?: string;
  created_at?: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}

export interface NewsItem {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

export interface SiteAd {
  zone: string;
  content: string;
  is_active: boolean;
}

export interface Match {
  id: string;
  team1_id?: string;
  team2_id?: string;
  score1?: number;
  score2?: number;
}