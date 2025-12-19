
import React, { useState, useEffect, useRef } from 'react';
import { SupabaseService } from './services/supabase';
import { TeamRegistration, LiveChannel } from './types';
import { 
  Trophy, User, Mail, MapPin, Shield, CheckCircle2, AlertCircle, Loader2,
  Clock, ArrowRight, LogIn, LogOut, Edit2, Play, Radio, Plus, Trash2, Eye, 
  EyeOff, Users, Save, Award, Target, Camera, Image as ImageIcon, Share2, Lock
} from 'lucide-react';

type ViewState = 'home' | 'profile' | 'live' | 'admin' | 'login' | 'register' | 'public-team';

const MATCHES = [
  { id: 1, team1: "Thunderbolts", logo1: "https://ui-avatars.com/api/?name=T&background=ef4444&color=fff&rounded=true", team2: "Iron Dragons", logo2: "https://ui-avatars.com/api/?name=I&background=3b82f6&color=fff&rounded=true", time: "اليوم، 18:00", venue: "الملعب الرئيسي" },
  { id: 2, team1: "Golden Eagles", logo1: "https://ui-avatars.com/api/?name=G&background=eab308&color=fff&rounded=true", team2: "Shadow Ninjas", logo2: "https://ui-avatars.com/api/?name=S&background=1e293b&color=fff&rounded=true", time: "غداً، 14:00", venue: "الملعب الشمالي" }
];

const PublicTeamView = ({ team }: { team: TeamRegistration }) => (
  <div className="max-w-5xl mx-auto py-12 px-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
    <div className="relative mb-12">
      <div className="h-48 w-full bg-gradient-to-r from-slate-800 to-slate-900 rounded-[2.5rem] shadow-xl overflow-hidden relative border border-white/10">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent"></div>
      </div>
      <div className="absolute -bottom-6 right-10 flex flex-col md:flex-row items-end md:items-center gap-6">
        <img src={team.logo_url || `https://ui-avatars.com/api/?name=${team.team_name}&background=random`} className="w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] border-8 border-white shadow-2xl bg-white object-cover" alt={team.team_name} />
        <div className="mb-4 md:mb-0 text-right">
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-1">{team.team_name}</h1>
          <div className="flex items-center gap-3 text-slate-500 font-medium text-sm">
            <span className="flex items-center gap-1"><Shield className="w-4 h-4 text-blue-500" /> {team.region}</span>
            <span className="w-1.5 h-1.5 bg-slate-300 rounded-full"></span>
            <span className="flex items-center gap-1"><User className="w-4 h-4 text-slate-400" /> المدرب: {team.coach_name}</span>
          </div>
        </div>
      </div>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-16 md:mt-24">
      <div className="space-y-6">
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm text-center">
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2 justify-center"><Award className="w-5 h-5 text-yellow-500" /> السجل الرياضي</h3>
          <div className="flex justify-around">
             <div><p className="text-3xl font-black text-green-600">{team.wins || 0}</p><p className="text-[10px] font-bold text-slate-400 uppercase">فوز</p></div>
             <div className="w-px h-12 bg-slate-100"></div>
             <div><p className="text-3xl font-black text-red-600">{team.losses || 0}</p><p className="text-[10px] font-bold text-slate-400 uppercase">خسارة</p></div>
          </div>
        </div>
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2"><ImageIcon className="w-5 h-5 text-blue-600" /> معرض الصور</h3>
          <div className="grid grid-cols-2 gap-3">
            {(team.gallery || []).map((img, idx) => (
              <div key={idx} className="aspect-square rounded-2xl overflow-hidden bg-slate-100 shadow-inner group">
                <img src={img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
              </div>
            ))}
          </div>
          {(!team.gallery || team.gallery.length === 0) && <p className="text-xs text-slate-400 text-center py-4 italic">لا توجد صور حالياً</p>}
        </div>
      </div>
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-6"><Target className="w-5 h-5 text-orange-500" /> نبذة عن الفريق</h3>
          <p className="text-slate-600 leading-loose text-lg whitespace-pre-line">{team.bio || "هذا الفريق لم يضف نبذة تعريفية بعد."}</p>
        </div>
      </div>
    </div>
  </div>
);

const RegisterView = ({ onSuccess, onSwitchToLogin }: { onSuccess: () => void, onSwitchToLogin: () => void }) => {
  const [formData, setFormData] = useState({ team_name: '', coach_name: '', contact_email: '', password: '', region: '' });
  const [showPass, setShowPass] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    const { error } = await SupabaseService.registerTeam(formData);
    if (!error) {
      alert('تم تسجيل فريقك بنجاح! يمكنك الآن تسجيل الدخول.');
      onSuccess();
    } else { setError('حدث خطأ أثناء التسجيل. يرجى المحاولة مرة أخرى.'); }
    setIsSubmitting(false);
  };

  return (
    <div className="max-w-6xl mx-auto py-12 px-6">
      <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col lg:flex-row border border-slate-100">
        <div className="lg:w-2/5 bg-gradient-to-br from-blue-600 to-indigo-800 text-white p-12 flex flex-col justify-center relative overflow-hidden">
          <Trophy className="w-16 h-16 mb-8 text-blue-200" />
          <h2 className="text-4xl font-black mb-6 leading-tight">سجل فريقك وابدأ المنافسة</h2>
          <p className="text-blue-100 mb-10 text-lg opacity-80">كن جزءاً من أقوى البطولات الرياضية في المنطقة مع تغطية حية واحترافية.</p>
        </div>
        <div className="lg:w-3/5 p-12 md:p-16">
          <div className="max-w-md mx-auto">
            <h3 className="text-2xl font-black mb-8">تسجيل فريق جديد</h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="relative"><input required value={formData.team_name} onChange={e => setFormData({...formData, team_name: e.target.value})} placeholder="اسم الفريق" className="w-full pl-4 pr-11 py-4 bg-slate-50 border rounded-2xl outline-none focus:border-blue-500" /><Shield className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" /></div>
              <div className="relative"><input required value={formData.coach_name} onChange={e => setFormData({...formData, coach_name: e.target.value})} placeholder="اسم المدرب" className="w-full pl-4 pr-11 py-4 bg-slate-50 border rounded-2xl outline-none focus:border-blue-500" /><User className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" /></div>
              <div className="relative"><input type="email" required value={formData.contact_email} onChange={e => setFormData({...formData, contact_email: e.target.value})} placeholder="البريد الإلكتروني" className="w-full pl-4 pr-11 py-4 bg-slate-50 border rounded-2xl outline-none focus:border-blue-500" /><Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" /></div>
              <div className="relative"><input type={showPass ? "text" : "password"} required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="كلمة المرور" className="w-full pl-12 pr-11 py-4 bg-slate-50 border rounded-2xl outline-none focus:border-blue-500" /><Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" /><button type="button" onClick={() => setShowPass(!showPass)} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">{showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button></div>
              <div className="relative"><input required value={formData.region} onChange={e => setFormData({...formData, region: e.target.value})} placeholder="المنطقة" className="w-full pl-4 pr-11 py-4 bg-slate-50 border rounded-2xl outline-none focus:border-blue-500" /><MapPin className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" /></div>
              <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-xl">{isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "إكمال التسجيل"}</button>
            </form>
            <p className="mt-8 text-center text-slate-500 text-sm">لديك حساب؟ <button onClick={onSwitchToLogin} className="text-blue-600 font-bold">سجل دخولك</button></p>
          </div>
        </div>
      </div>
    </div>
  );
};

const LoginView = ({ onLoginSuccess, onSwitchToRegister, initialEmail = '' }: { onLoginSuccess: (user: TeamRegistration) => void, onSwitchToRegister: () => void, initialEmail?: string }) => {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    const { data, error } = await SupabaseService.login(email, password);
    if (!error && data) { onLoginSuccess(data); } else { setError(error?.message || 'خطأ في بيانات الدخول.'); }
    setIsLoading(false);
  };

  return (
    <div className="max-w-md mx-auto py-24 px-6 animate-in fade-in duration-500">
      <div className="bg-white rounded-[2.5rem] p-10 shadow-2xl border border-slate-100">
        <div className="text-center mb-10"><div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white shadow-xl"><LogIn className="w-8 h-8" /></div><h3 className="text-2xl font-black">تسجيل الدخول</h3></div>
        {error && <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-xs font-bold text-center">{error}</div>}
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="relative"><input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="البريد الإلكتروني" className="w-full pl-4 pr-11 py-4 bg-slate-50 border rounded-2xl outline-none focus:border-blue-500" /><Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" /></div>
          <div className="relative"><input type={showPass ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)} placeholder="كلمة المرور" className="w-full pl-12 pr-11 py-4 bg-slate-50 border rounded-2xl outline-none focus:border-blue-500" /><Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" /><button type="button" onClick={() => setShowPass(!showPass)} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">{showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button></div>
          <button type="submit" disabled={isLoading} className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-xl">{isLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "دخول"}</button>
        </form>
        <p className="mt-8 text-center text-slate-500 text-sm">ليس لديك حساب؟ <button onClick={onSwitchToRegister} className="text-blue-600 font-bold">سجل فريقك</button></p>
      </div>
    </div>
  );
};

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>('home');
  const [user, setUser] = useState<TeamRegistration | null>(null);
  const [publicTeam, setPublicTeam] = useState<TeamRegistration | null>(null);
  const [liveChannels, setLiveChannels] = useState<LiveChannel[]>([]);
  const [allTeams, setAllTeams] = useState<TeamRegistration[]>([]);
  const [secretClickCount, setSecretClickCount] = useState(0);

  const checkHash = async () => {
    const hash = window.location.hash;
    if (hash === '#admin-portal') {
      setCurrentView('login');
    } else if (hash.startsWith('#team-')) {
      const teamId = hash.replace('#team-', '');
      const teams = await SupabaseService.getAllTeams();
      const team = teams.find(t => t.id === teamId);
      if (team) { setPublicTeam(team); setCurrentView('public-team'); }
    }
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      const [channels, teams] = await Promise.all([SupabaseService.getLiveChannels(), SupabaseService.getAllTeams()]);
      setLiveChannels(channels);
      setAllTeams(teams);
      checkHash();
    };
    fetchInitialData();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, []);

  const isAdmin = user?.contact_email === 'admin@portal.com';

  const renderContent = () => {
    switch (currentView) {
      case 'admin': return isAdmin ? <div className="p-10 text-center text-slate-500 font-bold italic">لوحة الإدارة قيد التطوير...</div> : <LoginView onLoginSuccess={(u) => { setUser(u); setCurrentView(u.contact_email === 'admin@portal.com' ? 'admin' : 'profile'); }} onSwitchToRegister={() => setCurrentView('register')} />;
      case 'profile': return user ? <div className="p-10 text-center">واجهة الملف الشخصي للمدرب</div> : <LoginView onLoginSuccess={(u) => { setUser(u); setCurrentView('profile'); }} onSwitchToRegister={() => setCurrentView('register')} />;
      case 'live': return <div className="max-w-7xl mx-auto py-12 px-6"><h2 className="text-3xl font-black mb-8 flex items-center gap-2"><Radio className="text-red-600" /> البث المباشر</h2><div className="grid grid-cols-1 md:grid-cols-3 gap-8">{liveChannels.map(ch => <div key={ch.id} className="bg-white rounded-2xl overflow-hidden border p-4 shadow-sm hover:shadow-md transition-shadow"> <div className="h-40 bg-slate-100 rounded-xl mb-4 overflow-hidden"><img src={ch.thumbnail_url} className="w-full h-full object-cover" /></div><h4 className="font-bold">{ch.name}</h4><button onClick={() => window.open(ch.stream_url, '_blank')} className="w-full py-2 bg-slate-50 border rounded-lg mt-4 text-xs font-bold hover:bg-red-50 hover:text-red-600 transition-colors">شاهد الآن</button></div>)}</div></div>;
      case 'public-team': return publicTeam ? <PublicTeamView team={publicTeam} /> : <div className="p-20 text-center">فريق غير موجود</div>;
      case 'login': return <LoginView onLoginSuccess={(u) => { setUser(u); setCurrentView(u.contact_email === 'admin@portal.com' ? 'admin' : 'profile'); }} onSwitchToRegister={() => setCurrentView('register')} />;
      case 'register': return <RegisterView onSuccess={() => setCurrentView('login')} onSwitchToLogin={() => setCurrentView('login')} />;
      default: return (
        <>
          <section className="bg-slate-900 py-24 px-6 md:px-12 relative overflow-hidden">
             <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row items-center gap-12">
               <div className="md:w-1/2 text-right">
                  <span className="bg-blue-600/20 text-blue-400 text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest mb-6 inline-block">موسم البطولات 2024</span>
                  <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-[1.1]">احترافية في التنظيم، شغف في الأداء</h1>
                  <p className="text-slate-400 text-lg mb-10 max-w-xl">سجل فريقك اليوم واصنع التاريخ في أقوى المنافسات الرياضية المحلية.</p>
                  <div className="flex gap-4"><button onClick={() => setCurrentView('register')} className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl hover:bg-blue-700 transition-all active:scale-95">ابدأ الآن</button><button onClick={() => setCurrentView('live')} className="px-8 py-4 bg-white/10 text-white rounded-2xl font-black backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all">شاهد البث</button></div>
               </div>
               <div className="md:w-1/2 flex justify-center"><Trophy className="w-64 h-64 text-blue-600 relative z-10 drop-shadow-2xl animate-bounce duration-[3000ms]" /></div>
             </div>
          </section>
          <section className="py-20 px-6 md:px-12 bg-white">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-12"><h2 className="text-3xl font-black">الفرق المشاركة</h2><button onClick={() => setCurrentView('register')} className="text-blue-600 font-bold flex items-center gap-2 hover:gap-3 transition-all">سجل فريقك <ArrowRight className="w-4 h-4" /></button></div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {allTeams.map(team => (
                  <button key={team.id} onClick={() => { setPublicTeam(team); window.location.hash = `team-${team.id}`; }} className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 hover:border-blue-400 transition-all hover:-translate-y-2 group">
                    <img src={team.logo_url} className="w-20 h-20 rounded-full mx-auto mb-4 border-4 border-white shadow-md group-hover:scale-110 transition-transform" />
                    <p className="text-xs font-black text-slate-900 text-center truncate">{team.team_name}</p>
                    <p className="text-[9px] text-slate-400 text-center mt-1 uppercase font-bold">{team.region}</p>
                  </button>
                ))}
              </div>
            </div>
          </section>
        </>
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 scroll-smooth" dir="rtl">
      <nav className="bg-white/80 backdrop-blur-md border-b py-4 px-6 md:px-12 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2 font-black text-xl cursor-pointer" onClick={() => { window.location.hash = ''; setCurrentView('home'); }}>
          <div className="bg-blue-600 p-1.5 rounded-lg shadow-lg"><Trophy className="w-6 h-6 text-white" /></div>
          <span>بوابة البطولة</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-[11px] font-black uppercase text-slate-400 tracking-widest">
          <button onClick={() => { window.location.hash = ''; setCurrentView('home'); }} className={`hover:text-blue-600 ${currentView === 'home' ? 'text-blue-600' : ''}`}>الرئيسية</button>
          <button onClick={() => setCurrentView('live')} className={`hover:text-red-600 ${currentView === 'live' ? 'text-red-600' : ''}`}>البث المباشر</button>
          {isAdmin && <button onClick={() => setCurrentView('admin')} className="text-blue-600">الإدارة</button>}
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <button onClick={() => { setUser(null); setCurrentView('home'); }} className="p-2 text-slate-300 hover:text-red-600 transition-colors"><LogOut className="w-5 h-5" /></button>
          ) : (
            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentView('login')} className="px-5 py-2.5 text-slate-900 text-[11px] font-black border rounded-xl hover:bg-slate-50 transition-all">دخول</button>
              <button onClick={() => setCurrentView('register')} className="px-5 py-2.5 bg-slate-900 text-white text-[11px] font-black rounded-xl hover:bg-slate-800 transition-all shadow-lg">سجل فريقك</button>
            </div>
          )}
        </div>
      </nav>
      <main className="min-h-[80vh]">{renderContent()}</main>
      <footer className="bg-slate-900 text-slate-500 py-16 text-center border-t border-slate-800">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center justify-center gap-2 font-black text-xl text-white mb-6">
            <Trophy 
              onClick={() => { setSecretClickCount(s => { if(s+1>=3) { setCurrentView('login'); return 0; } return s+1; }); }} 
              className="w-8 h-8 text-blue-600 cursor-pointer hover:rotate-12 transition-transform" 
            /> 
            <span>TournamentPortal</span>
          </div>
          <p className="text-[10px] uppercase tracking-widest leading-loose max-w-lg mx-auto">نحن هنا لتمكين المواهب الرياضية وتوفير أفضل منصة للمنافسة والتميز.</p>
          <div className="mt-8 pt-8 border-t border-slate-800 text-[9px] font-bold">&copy; 2024 جميع الحقوق محفوظة لـ بوابة البطولة.</div>
        </div>
      </footer>
    </div>
  );
}
