
import { createClient } from '@supabase/supabase-js';
import { TeamRegistration, Message, NewsItem, SiteAd, Match } from '../types';

// ------------------------------------------------------------------
// CONFIGURATION
// ------------------------------------------------------------------
const getEnv = (key: string) => {
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
       // @ts-ignore
       return import.meta.env[key] || import.meta.env[`VITE_${key}`];
    }
  } catch (e) {}
  
  try {
    if (typeof process !== 'undefined' && process.env) {
      return process.env[key];
    }
  } catch (e) {}
  
  return undefined;
};

const SUPABASE_URL = getEnv('SUPABASE_URL') || "https://uuqpmecqupbhwuxmgnwm.supabase.co";
const SUPABASE_KEY = getEnv('SUPABASE_ANON_KEY') || getEnv('API_KEY') || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1cXBtZWNxdXBiaHd1eG1nbndtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3MjU5NTgsImV4cCI6MjA4MTMwMTk1OH0.WAj07Dax4TPLuct6CnGaOKtOmgZSI4VuCF0l4vDtlGQ";

const isMock = !SUPABASE_URL || !SUPABASE_KEY;

let supabase: any;

if (!isMock) {
  try {
    supabase = createClient(SUPABASE_URL!, SUPABASE_KEY!);
  } catch (e) {
    console.error("Failed to initialize Supabase client:", e);
    supabase = null; 
  }
} else {
  console.log("Supabase keys not found. Running in MOCK mode.");
}

const STORAGE_KEY = 'tournament_teams_db';
const MESSAGES_KEY = 'tournament_messages_db';
const NEWS_KEY = 'tournament_news_db';
const ADS_KEY = 'tournament_ads_db';
const MATCHES_KEY = 'tournament_matches_db';

export const SupabaseService = {
  // --- TEAMS ---
  registerTeam: async (team: Omit<TeamRegistration, 'created_at' | 'id'>) => {
    await new Promise(resolve => setTimeout(resolve, 800));
    const enhancedTeam = {
      ...team,
      logo_url: team.logo_url || `https://ui-avatars.com/api/?name=${team.team_name}&background=random&color=fff&rounded=true`,
      wins: 0,
      losses: 0,
      bio: "Ready to compete!"
    };

    if (isMock || !supabase) {
      const stored = localStorage.getItem(STORAGE_KEY);
      const teams: TeamRegistration[] = stored ? JSON.parse(stored) : [];
      if (teams.some(t => t.team_name.trim().toLowerCase() === team.team_name.trim().toLowerCase())) {
        return { data: null, error: { message: 'Team name already exists.' } };
      }
      const newTeam = { ...enhancedTeam, id: crypto.randomUUID(), created_at: new Date().toISOString() };
      teams.push(newTeam);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(teams));
      return { data: [newTeam], error: null };
    } else {
      const { data, error } = await supabase.from('teams').insert([enhancedTeam]).select();
      return { data, error };
    }
  },

  getTeams: async () => {
    if (isMock || !supabase) {
      const stored = localStorage.getItem(STORAGE_KEY);
      return { data: stored ? JSON.parse(stored) : [], error: null };
    } else {
      return await supabase.from('teams').select('*');
    }
  },

  login: async (email: string) => {
    await new Promise(resolve => setTimeout(resolve, 600));
    if (isMock || !supabase) {
      const stored = localStorage.getItem(STORAGE_KEY);
      const teams: TeamRegistration[] = stored ? JSON.parse(stored) : [];
      const team = teams.find(t => t.contact_email.toLowerCase() === email.toLowerCase());
      if (team) return { data: team, error: null };
      return { data: null, error: { message: "Team not found." } };
    } else {
      return await supabase.from('teams').select('*').eq('contact_email', email).single();
    }
  },

  updateProfile: async (id: string, updates: Partial<TeamRegistration>) => {
    if (isMock || !supabase) {
      const stored = localStorage.getItem(STORAGE_KEY);
      let teams = stored ? JSON.parse(stored) : [];
      const index = teams.findIndex((t: any) => t.id === id);
      if (index === -1) return { error: { message: "Not found" } };
      teams[index] = { ...teams[index], ...updates };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(teams));
      return { data: teams[index], error: null };
    } else {
      return await supabase.from('teams').update(updates).eq('id', id).select();
    }
  },

  // --- MESSAGES ---
  getMessages: async (userId: string) => {
    if (isMock || !supabase) {
      const stored = localStorage.getItem(MESSAGES_KEY);
      const msgs = stored ? JSON.parse(stored) : [];
      return msgs.filter((m: any) => m.senderId === userId || m.receiverId === userId);
    }
    const { data } = await supabase.from('messages').select('*').or(`sender_id.eq.${userId},receiver_id.eq.${userId}`).order('created_at', { ascending: true });
    return (data || []).map((m: any) => ({
      id: m.id, senderId: m.sender_id, receiverId: m.receiver_id, content: m.content, timestamp: m.created_at, isRead: m.is_read
    }));
  },

  sendMessage: async (msg: Omit<Message, 'id' | 'timestamp' | 'isRead'>) => {
    if (isMock || !supabase) {
      const stored = localStorage.getItem(MESSAGES_KEY);
      const msgs = stored ? JSON.parse(stored) : [];
      const newMsg = { ...msg, id: crypto.randomUUID(), timestamp: new Date().toISOString(), isRead: false };
      msgs.push(newMsg);
      localStorage.setItem(MESSAGES_KEY, JSON.stringify(msgs));
      return newMsg;
    }
    const { data } = await supabase.from('messages').insert([{
      sender_id: msg.senderId, receiver_id: msg.receiverId, content: msg.content, is_read: false
    }]).select().single();
    return data ? {
      id: data.id, senderId: data.sender_id, receiverId: data.receiver_id, content: data.content, timestamp: data.created_at, isRead: data.is_read
    } : null;
  },

  // --- ADMIN: NEWS ---
  getNews: async () => {
    if (isMock || !supabase) {
      const stored = localStorage.getItem(NEWS_KEY);
      return stored ? JSON.parse(stored) : [];
    }
    const { data } = await supabase.from('news').select('*').order('created_at', { ascending: false });
    return data || [];
  },

  addNews: async (news: Omit<NewsItem, 'id' | 'created_at'>) => {
    if (isMock || !supabase) {
      const stored = localStorage.getItem(NEWS_KEY);
      const list = stored ? JSON.parse(stored) : [];
      const item = { ...news, id: crypto.randomUUID(), created_at: new Date().toISOString() };
      list.unshift(item);
      localStorage.setItem(NEWS_KEY, JSON.stringify(list));
      return item;
    }
    const { data } = await supabase.from('news').insert([news]).select().single();
    return data;
  },

  deleteNews: async (id: string) => {
    if (isMock || !supabase) {
      const stored = localStorage.getItem(NEWS_KEY);
      const list = stored ? JSON.parse(stored) : [];
      const filtered = list.filter((n: any) => n.id !== id);
      localStorage.setItem(NEWS_KEY, JSON.stringify(filtered));
      return true;
    }
    await supabase.from('news').delete().eq('id', id);
    return true;
  },

  // --- ADMIN: ADS ---
  getAds: async () => {
    if (isMock || !supabase) {
      const stored = localStorage.getItem(ADS_KEY);
      return stored ? JSON.parse(stored) : [];
    }
    const { data } = await supabase.from('site_ads').select('*');
    return data || [];
  },

  updateAd: async (zone: string, content: string) => {
    if (isMock || !supabase) {
      const stored = localStorage.getItem(ADS_KEY);
      let list: SiteAd[] = stored ? JSON.parse(stored) : [];
      const index = list.findIndex(a => a.zone === zone);
      if (index >= 0) {
        list[index].content = content;
      } else {
        // @ts-ignore
        list.push({ zone, content, is_active: true });
      }
      localStorage.setItem(ADS_KEY, JSON.stringify(list));
      return true;
    }
    
    // Upsert equivalent
    const { data: existing } = await supabase.from('site_ads').select('*').eq('zone', zone).single();
    if (existing) {
      await supabase.from('site_ads').update({ content }).eq('zone', zone);
    } else {
      await supabase.from('site_ads').insert([{ zone, content }]);
    }
    return true;
  },

  // --- ADMIN: MATCHES (DRAW) ---
  getMatches: async () => {
    if (isMock || !supabase) {
      const stored = localStorage.getItem(MATCHES_KEY);
      return stored ? JSON.parse(stored) : [];
    }
    const { data } = await supabase.from('matches').select('*');
    return data || [];
  },

  saveMatches: async (matches: Omit<Match, 'id'>[]) => {
    // Clear old matches for a new tournament draw
    if (isMock || !supabase) {
      const formatted = matches.map(m => ({ ...m, id: crypto.randomUUID() }));
      localStorage.setItem(MATCHES_KEY, JSON.stringify(formatted));
      return formatted;
    }
    
    // In real DB, we might want to keep history, but for this simple tool we'll replace
    await supabase.from('matches').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    const { data } = await supabase.from('matches').insert(matches).select();
    return data;
  }
};
