
import React, { useState, useEffect, useRef } from 'react';
import { SupabaseService } from './services/supabase';
import { TeamRegistration, LiveChannel } from './types';
import { 
  Trophy, User, Mail, MapPin, Shield, CheckCircle2, AlertCircle, Loader2,
  Clock, ArrowRight, LogIn, LogOut, Edit2, Play, Radio, Plus, Trash2, Eye, 
  EyeOff, Users, Save, Award, Target, Camera, Image as ImageIcon, Share2, Lock, ExternalLink
} from 'lucide-react';

type ViewState = 'home' | 'profile' | 'live' | 'admin' | 'login' | 'register' | 'public-team';

// المكونات الفرعية لضمان تنظيم الكود ومنع الانهيار
const PublicTeamView: React.FC<{ team: TeamRegistration }> = ({ team }) => (
  <div className="max-w-5xl mx-auto py-12 px-6">
    <div className="relative mb-12">
      <div className="h-48 w-full bg-slate-900 rounded-[2.5rem] shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
      </div>
      <div className="absolute -bottom-6 right-10 flex flex-col md:flex-row items-end md:items-center gap-6">
        <img src={team.logo_url || `https://ui-avatars.com/api/?name=${team.team_name}&background=random`} className="w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] border-8 border-white shadow-2xl bg-white object-cover" />
        <div className="mb-4 md:mb-0 text-right">
          <h1 className="text-3xl md:text-4xl font-black text-slate-900">{team.team_name}</h1>
          <p className="text-slate-500 font-medium">{team.region} | المدرب: {team.coach_name}</p>
        </div>
      </div>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-24">
      <div className="bg-white p-8 rounded-[2rem] border shadow-sm text-center">
        <h3 className="font-bold mb-4">الإحصائيات</h3>
        <div className="flex justify-around">
          <div><p className="text-2xl font-black text-green-600">{team.wins || 0}</p><span className="text-xs text-slate-400">فوز</span></div>
          <div className="w-px h-10 bg-slate-100"></div>
          <div><p className="text-2xl font-black text-red-600">{team.losses || 0}</p><span className="text-xs text-slate-400">خسارة</span></div>
        </div>
      </div>
      <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] border shadow-sm">
        <h3 className="font-bold mb-4">نبذة الفريق</h3>
        <p className="text-slate-600 leading-relaxed">{team.bio || "لا توجد نبذة."}</p>
      </div>
    </div>
  </div>
);

const AdminDashboard: React.FC<{ teams: TeamRegistration[], channels: LiveChannel[] }> = ({ teams, channels }) => (
  <div className="max-w-7xl mx-auto py-10 px-6">
    <h1 className="text-3xl font-black mb-10">لوحة الإدارة</h1>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-white rounded-[2rem] border overflow-hidden">
        <div className="p-6 border-b font-bold">إدارة القنوات</div>
        <div className="divide-y">
          {channels.length > 0 ? channels.map(ch => (
            <div key={ch.id} className="p-4 flex items-center justify-between">
              <span className="font-bold">{ch.name}</span>
              <span className={`px-2 py-1 rounded-full text-[10px] ${ch.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{ch.is_active ? 'نشط' : 'متوقف'}</span>
            </div>
          )) : <p className="p-10 text-center text-slate-400">لا توجد قنوات.</p>}
        </div>
      </div>
      <div className="bg-white rounded-[2rem] border p-6">
        <h2 className="font-bold mb-6">الفرق المسجلة ({teams.length})</h2>
        <div className="space-y-3">
          {teams.map(t => (
            <div key={t.id} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
              <span className="text-sm font-bold">{t.team_name}</span>
              <span className="text-[10px] text-slate-400">{t.region}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>('home');
  const [user, setUser] = useState<TeamRegistration | null>(null);
  const [publicTeam, setPublicTeam] = useState<TeamRegistration | null>(null);
  const [liveChannels, setLiveChannels] = useState<LiveChannel[]>([]);
  const [allTeams, setAllTeams] = useState<TeamRegistration[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const checkHash = async () => {
    const hash = window.location.hash;
    if (hash === '#admin-portal') {
      setCurrentView('login');
    } else if (hash.startsWith('#team-')) {
      const teamId = hash.replace('#team-', '');
      const teams = await SupabaseService.getAllTeams();
      const team = teams.find(t => t.id === teamId);
      if (team) { setPublicTeam(team); setCurrentView('public-team'); }
    } else {
      setCurrentView('home');
    }
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [channels, teams] = await Promise.all([
          SupabaseService.getLiveChannels(),
          SupabaseService.getAllTeams()
        ]);
        setLiveChannels(channels || []);
        setAllTeams(teams || []);
      } catch (err) {
        console.error("Initial load error:", err);
      } finally {
        setIsLoading(false);
        checkHash();
      }
    };
    fetchInitialData();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, []);

  const isAdmin = user?.contact_email === 'admin@portal.com';

  const renderContent = () => {
    if (isLoading) return <div className="h-[60vh] flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-blue-600" /></div>;

    switch (currentView) {
      case 'admin': return <AdminDashboard teams={allTeams} channels={liveChannels} />;
      case 'public-team': return publicTeam ? <PublicTeamView team={publicTeam} /> : <div className="p-20 text-center text-slate-400">الفريق غير موجود.</div>;
      case 'live': return (
        <div className="max-w-7xl mx-auto py-12 px-6">
          <h2 className="text-3xl font-black mb-10 flex items-center gap-2"><Radio className="text-red-600" /> البث المباشر</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {liveChannels.map(ch => (
              <div key={ch.id} className="bg-white rounded-2xl border p-4 shadow-sm group">
                <img src={ch.thumbnail_url} className="h-40 w-full object-cover rounded-xl mb-4" />
                <h4 className="font-bold">{ch.name}</h4>
                <button onClick={() => window.open(ch.stream_url, '_blank')} className="w-full mt-4 py-2 bg-slate-50 border rounded-lg text-xs font-bold hover:bg-red-50 hover:text-red-600 transition-colors">مشاهدة</button>
              </div>
            ))}
          </div>
        </div>
      );
      case 'login': return (
        <div className="max-w-md mx-auto py-24 px-6">
          <div className="bg-white rounded-[2.5rem] p-10 shadow-2xl border text-center">
            <h3 className="text-2xl font-black mb-8">تسجيل الدخول</h3>
            <button onClick={() => { setUser({ team_name: 'فريق تجريبي', coach_name: 'مدرب', contact_email: 'test@test.com', region: 'الدوحة' } as any); setCurrentView('home'); }} className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl mb-4">دخول تجريبي (للمعاينة)</button>
            <button onClick={() => setCurrentView('home')} className="text-slate-400 text-sm underline">رجوع للرئيسية</button>
          </div>
        </div>
      );
      default: return (
        <>
          <section className="bg-slate-900 py-32 px-6 md:px-12 text-center text-white relative overflow-hidden">
             <div className="relative z-10">
               <h1 className="text-5xl md:text-8xl font-black mb-6">بوابة البطولة</h1>
               <p className="text-slate-400 text-xl max-w-2xl mx-auto mb-12">سجل، تابع، واحتفل بكل لحظة رياضية.</p>
               <div className="flex justify-center gap-4">
                 <button onClick={() => setCurrentView('login')} className="px-10 py-5 bg-blue-600 rounded-2xl font-black shadow-xl">سجل فريقك</button>
                 <button onClick={() => setCurrentView('live')} className="px-10 py-5 bg-white/10 rounded-2xl font-black border border-white/20">شاهد البث</button>
               </div>
             </div>
             <Trophy className="absolute bottom-0 right-0 w-96 h-96 text-white/5 -mb-20 -mr-20" />
          </section>
          <section className="py-24 px-6 md:px-12 bg-white">
            <div className="max-w-7xl mx-auto">
              <h2 className="text-3xl font-black mb-12">الفرق المشاركة</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
                {allTeams.length > 0 ? allTeams.map(team => (
                  <button key={team.id} onClick={() => { setPublicTeam(team); window.location.hash = `team-${team.id}`; }} className="text-center group">
                    <img src={team.logo_url} className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-white shadow-xl group-hover:scale-110 transition-transform" />
                    <p className="font-bold text-slate-900">{team.team_name}</p>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{team.region}</p>
                  </button>
                )) : <p className="col-span-full text-center text-slate-400">لا توجد فرق مسجلة حالياً.</p>}
              </div>
            </div>
          </section>
        </>
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans" dir="rtl">
      <nav className="bg-white/90 backdrop-blur-md border-b py-4 px-6 md:px-12 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2 font-black text-xl cursor-pointer" onClick={() => { window.location.hash = ''; setCurrentView('home'); }}>
          <Trophy className="w-8 h-8 text-blue-600" /> <span>بوابة البطولة</span>
        </div>
        <div className="hidden md:flex gap-8 text-[11px] font-black uppercase tracking-widest text-slate-400">
           <button onClick={() => setCurrentView('home')} className={currentView === 'home' ? 'text-blue-600' : ''}>الرئيسية</button>
           <button onClick={() => setCurrentView('live')} className={currentView === 'live' ? 'text-red-600' : ''}>البث المباشر</button>
           {user && <button onClick={() => setCurrentView('profile')} className="text-slate-900">فريقي</button>}
           {isAdmin && <button onClick={() => setCurrentView('admin')} className="text-blue-600">الإدارة</button>}
        </div>
        <div>
          {user ? (
            <button onClick={() => setUser(null)} className="text-red-500 font-bold text-xs">خروج</button>
          ) : (
            <button onClick={() => setCurrentView('login')} className="px-6 py-2.5 bg-slate-900 text-white text-[11px] font-black rounded-xl">دخول</button>
          )}
        </div>
      </nav>
      <main className="min-h-[70vh]">{renderContent()}</main>
      <footer className="bg-slate-900 text-slate-500 py-20 text-center">
        <div className="max-w-4xl mx-auto px-6">
          <Trophy className="w-12 h-12 text-blue-600 mx-auto mb-8" />
          <p className="text-sm leading-relaxed max-w-lg mx-auto mb-8">المنصة المتكاملة لتنظيم ومتابعة البطولات الرياضية الاحترافية.</p>
          <div className="pt-8 border-t border-slate-800 text-[10px] uppercase font-bold tracking-widest">&copy; 2024 بوابة البطولة. جميع الحقوق محفوظة.</div>
        </div>
      </footer>
    </div>
  );
}
