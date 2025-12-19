
import { createClient } from '@supabase/supabase-js';
import { TeamRegistration, Message, LiveChannel } from '../types';

/* 
  تنبيه للمطور: إذا ظهر خطأ "Table not found"، يرجى تشغيل الكود التالي في SQL Editor داخل Supabase:

  CREATE TABLE teams (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    team_name TEXT NOT NULL,
    coach_name TEXT NOT NULL,
    contact_email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    region TEXT,
    logo_url TEXT,
    bio TEXT,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
*/

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

try {
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
} catch (e) {
  console.error("Supabase Init Error:", e);
}

// تخزين محلي احتياطي في حال فشل السيرفر
const getLocalTeams = (): TeamRegistration[] => {
  const saved = localStorage.getItem('local_teams');
  return saved ? JSON.parse(saved) : [];
};

const saveLocalTeam = (team: TeamRegistration) => {
  const teams = getLocalTeams();
  teams.push({ ...team, id: crypto.randomUUID(), created_at: new Date().toISOString() });
  localStorage.setItem('local_teams', JSON.stringify(teams));
};

export const SupabaseService = {
  getLiveChannels: async (all: boolean = false): Promise<LiveChannel[]> => {
    try {
      let query = supabase.from('live_channels').select('*').order('created_at', { ascending: false });
      if (!all) query = query.eq('is_active', true);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    } catch (e) {
      return [];
    }
  },

  getAllTeams: async (): Promise<TeamRegistration[]> => {
    try {
      const { data, error } = await supabase.from('teams').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    } catch (e) {
      // إذا فشل Supabase، نرجع البيانات المحلية
      return getLocalTeams();
    }
  },

  registerTeam: async (team: Omit<TeamRegistration, 'created_at' | 'id'>) => {
    const enhancedTeam = {
      ...team,
      logo_url: `https://ui-avatars.com/api/?name=${team.team_name}&background=random&color=fff&rounded=true`,
      wins: 0,
      losses: 0,
      bio: "فريق جديد جاهز للتحدي!"
    };

    try {
      const { data, error } = await supabase.from('teams').insert([enhancedTeam]).select();
      if (error) throw error;
      return { data, error: null };
    } catch (err: any) {
      console.error("Supabase Registration Error:", err);
      // في حال كان الجدول غير موجود، نحفظ محلياً لنمنع توقف التطبيق
      if (err.message?.includes('cache') || err.message?.includes('not found')) {
        saveLocalTeam(enhancedTeam as any);
        return { data: [enhancedTeam], error: null, isLocal: true };
      }
      return { data: null, error: err };
    }
  },

  login: async (email: string, password?: string) => {
    try {
      const { data, error } = await supabase.from('teams').select('*').eq('contact_email', email).single();
      if (error) throw error;
      if (password && data.password !== password) throw new Error('كلمة المرور غير صحيحة');
      return { data, error: null };
    } catch (err: any) {
      // البحث في البيانات المحلية إذا فشل السيرفر
      const local = getLocalTeams().find(t => t.contact_email === email);
      if (local && local.password === password) return { data: local, error: null };
      return { data: null, error: err };
    }
  }
};
