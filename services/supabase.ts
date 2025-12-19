
import { createClient } from '@supabase/supabase-js';
import { TeamRegistration, Message, LiveChannel } from '../types';

const getEnv = (key: string) => {
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
       // @ts-ignore
       return import.meta.env[key] || import.meta.env[`VITE_${key}`];
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
}

export const SupabaseService = {
  getLiveChannels: async (all: boolean = false): Promise<LiveChannel[]> => {
    if (isMock || !supabase) return [];
    let query = supabase.from('live_channels').select('*').order('created_at', { ascending: false });
    if (!all) query = query.eq('is_active', true);
    
    const { data, error } = await query;
    if (error) return [];
    return data;
  },

  addLiveChannel: async (channel: Omit<LiveChannel, 'id' | 'created_at'>) => {
    if (isMock || !supabase) return { error: 'Supabase not initialized' };
    const { data, error } = await supabase.from('live_channels').insert([channel]).select();
    return { data, error };
  },

  updateLiveChannel: async (id: string, updates: Partial<LiveChannel>) => {
    if (isMock || !supabase) return { error: 'Supabase not initialized' };
    const { data, error } = await supabase.from('live_channels').update(updates).eq('id', id).select();
    return { data, error };
  },

  deleteLiveChannel: async (id: string) => {
    if (isMock || !supabase) return { error: 'Supabase not initialized' };
    const { error } = await supabase.from('live_channels').delete().eq('id', id);
    return { error };
  },

  getAllTeams: async (): Promise<TeamRegistration[]> => {
    if (isMock || !supabase) return [];
    const { data, error } = await supabase.from('teams').select('*').order('created_at', { ascending: false });
    if (error) return [];
    return data;
  },

  registerTeam: async (team: Omit<TeamRegistration, 'created_at' | 'id'>) => {
    const enhancedTeam = {
      ...team,
      logo_url: `https://ui-avatars.com/api/?name=${team.team_name}&background=random&color=fff&rounded=true`,
      wins: 0,
      losses: 0,
      bio: "Ready to compete!"
    };
    const { data, error } = await supabase.from('teams').insert([enhancedTeam]).select();
    return { data, error };
  },

  login: async (email: string) => {
    const { data, error } = await supabase.from('teams').select('*').eq('contact_email', email).single();
    return { data, error };
  },

  updateProfile: async (id: string, updates: Partial<TeamRegistration>) => {
    const { data, error } = await supabase.from('teams').update(updates).eq('id', id).select();
    return { data, error };
  },

  getMessages: async (userId: string) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: true });
    return (data || []).map((m: any) => ({
      id: m.id,
      senderId: m.sender_id,
      receiverId: m.receiver_id,
      content: m.content,
      timestamp: m.created_at,
      isRead: m.is_read
    }));
  },

  sendMessage: async (msg: Omit<Message, 'id' | 'timestamp' | 'isRead'>) => {
    const { data, error } = await supabase.from('messages').insert([{
      sender_id: msg.senderId,
      receiver_id: msg.receiverId,
      content: msg.content,
      is_read: false
    }]).select().single();
    return data ? {
      id: data.id,
      senderId: data.sender_id,
      receiverId: data.receiver_id,
      content: data.content,
      timestamp: data.created_at,
      isRead: data.is_read
    } : null;
  }
};
