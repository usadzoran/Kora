
import React, { useState, useEffect } from 'react';
import { SupabaseService } from './services/supabase';
import { TeamRegistration, LiveChannel } from './types';
import { 
  Trophy, User, Mail, MapPin, Shield, CheckCircle2, Loader2,
  ArrowRight, LogIn, LogOut, Radio, Lock, ExternalLink, Eye, EyeOff, Save, Smartphone
} from 'lucide-react';

type ViewState = 'home' | 'profile' | 'live' | 'admin' | 'login' | 'register' | 'public-team';

const PublicTeamView: React.FC<{ team: TeamRegistration }> = ({ team }) => (
  <div className="max-w-5xl mx-auto py-12 px-6 animate-in fade-in duration-700">
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
        <p className="text-slate-600 leading-relaxed">{team.bio || "لا توجد نبذة تعريفية متوفرة لهذا الفريق حالياً."}</p>
      </div>
    </div>
  </div>
);

const RegisterView: React.FC<{ onSwitch: () => void, onSuccess: () => void }> = ({ onSwitch, onSuccess }) => {
  const [formData, setFormData] = useState({
    team_name: '',
    coach_name: '',
    contact_email: '',
    password: '',
    region: ''
  });
  const [showPass, setShowPass] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      const { error } = await SupabaseService.registerTeam(formData);
      if (error) throw error;
      alert('تم تسجيل فريقك بنجاح! يمكنك الآن تسجيل الدخول.');
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء التسجيل');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-12 px-6 animate-in slide-in-from-bottom-8 duration-500">
      <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col lg:flex-row border border-slate-100">
        {/* الجانب الجمالي */}
        <div className="lg:w-2/5 bg-slate-900 text-white p-12 flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <Trophy className="w-16 h-16 text-blue-500 mb-8" />
            <h2 className="text-4xl font-black mb-6 leading-tight">انضم إلى <br/>نخبة الفرق</h2>
            <p className="text-slate-400 text-lg leading-relaxed">بخطوات بسيطة، سجل فريقك في منصتنا وابدأ رحلة المنافسة والاحترافية.</p>
          </div>
          <div className="relative z-10 space-y-6 mt-12">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center"><CheckCircle2 className="text-blue-500 w-5 h-5" /></div>
              <span className="font-bold text-sm">صفحة خاصة لكل فريق</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center"><Smartphone className="text-blue-500 w-5 h-5" /></div>
              <span className="font-bold text-sm">تغطية مباشرة لنتائجك</span>
            </div>
          </div>
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl"></div>
        </div>

        {/* نموذج التسجيل */}
        <div className="lg:w-3/5 p-12 lg:p-16">
          <div className="max-w-md mx-auto">
            <h3 className="text-2xl font-black mb-2">إنشاء حساب فريق</h3>
            <p className="text-slate-400 mb-10">املأ البيانات التالية للانضمام للبطولة</p>

            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl flex items-center gap-3 text-sm font-bold animate-shake">
                <Lock className="w-4 h-4" /> {error}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 mr-2">اسم الفريق</label>
                  <div className="relative">
                    <input required value={formData.team_name} onChange={e => setFormData({...formData, team_name: e.target.value})} placeholder="البرق، الفرسان..." className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-500 focus:bg-white transition-all" />
                    <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 mr-2">اسم المدرب</label>
                  <div className="relative">
                    <input required value={formData.coach_name} onChange={e => setFormData({...formData, coach_name: e.target.value})} placeholder="الاسم الكامل" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-500 focus:bg-white transition-all" />
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 mr-2">البريد الإلكتروني</label>
                <div className="relative">
                  <input type="email" required value={formData.contact_email} onChange={e => setFormData({...formData, contact_email: e.target.value})} placeholder="coach@example.com" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-500 focus:bg-white transition-all" />
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 mr-2">كلمة المرور</label>
                <div className="relative">
                  <input type={showPass ? "text" : "password"} required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="••••••••" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-500 focus:bg-white transition-all" />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-blue-500 transition-colors">
                    {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 mr-2">المنطقة / المدينة</label>
                <div className="relative">
                  <input required value={formData.region} onChange={e => setFormData({...formData, region: e.target.value})} placeholder="الدوحة، الرياض..." className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-500 focus:bg-white transition-all" />
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                </div>
              </div>

              <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 mt-4 disabled:opacity-50">
                {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Save className="w-5 h-5" /> تأكيد التسجيل</>}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-slate-400 text-sm">لديك حساب بالفعل؟ <button onClick={onSwitch} className="text-blue-600 font-black hover:underline">سجل دخولك</button></p>
            </div>
          </div>
        </div>
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
  const [isLoading, setIsLoading] = useState(true);

  const checkHash = async () => {
    const hash = window.location.hash;
    console.log("Current Hash:", hash);
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
        console.log("Fetching initial data...");
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

  const handleLogin = async (email: string, pass: string) => {
    const { data, error } = await SupabaseService.login(email, pass);
    if (!error && data) {
      setUser(data);
      setCurrentView('home');
    } else {
      alert('خطأ في البريد أو كلمة المرور');
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="h-[70vh] flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
          <p className="text-slate-400 font-bold animate-pulse">جاري تحميل بوابة البطولة...</p>
        </div>
      );
    }

    switch (currentView) {
      case 'register': return <RegisterView onSuccess={() => setCurrentView('login')} onSwitch={() => setCurrentView('login')} />;
      case 'public-team': return publicTeam ? <PublicTeamView team={publicTeam} /> : <div className="p-20 text-center">الفريق غير موجود.</div>;
      case 'live': return (
        <div className="max-w-7xl mx-auto py-12 px-6">
          <h2 className="text-3xl font-black mb-10 flex items-center gap-2"><Radio className="text-red-600" /> قنوات البث المباشر</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {liveChannels.length > 0 ? liveChannels.map(ch => (
              <div key={ch.id} className="bg-white rounded-3xl border p-5 shadow-sm hover:shadow-xl transition-all group">
                <div className="h-44 w-full bg-slate-100 rounded-2xl mb-5 overflow-hidden relative">
                  <img src={ch.thumbnail_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute top-3 right-3 bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded-full animate-pulse">LIVE</div>
                </div>
                <h4 className="font-bold text-lg mb-4">{ch.name}</h4>
                <button onClick={() => window.open(ch.stream_url, '_blank')} className="w-full py-3 bg-slate-900 text-white rounded-xl text-sm font-black hover:bg-blue-600 transition-colors flex items-center justify-center gap-2">شاهد الآن <ExternalLink className="w-4 h-4" /></button>
              </div>
            )) : <p className="col-span-full text-center py-20 text-slate-400">لا توجد بثوث مباشرة حالياً.</p>}
          </div>
        </div>
      );
      case 'login': return (
        <div className="max-w-md mx-auto py-24 px-6 animate-in fade-in duration-500">
          <div className="bg-white rounded-[2.5rem] p-10 shadow-2xl border text-center">
            <Trophy className="w-16 h-16 text-blue-600 mx-auto mb-6" />
            <h3 className="text-2xl font-black mb-4">تسجيل الدخول</h3>
            <p className="text-slate-400 text-sm mb-8">يرجى استخدام حساب المدرب أو الأدمن</p>
            <form onSubmit={(e) => {
              e.preventDefault();
              const target = e.target as any;
              handleLogin(target[0].value, target[1].value);
            }} className="space-y-4">
              <input type="email" required placeholder="البريد الإلكتروني" className="w-full p-4 bg-slate-50 border rounded-2xl outline-none focus:border-blue-500" />
              <input type="password" required placeholder="كلمة المرور" className="w-full p-4 bg-slate-50 border rounded-2xl outline-none focus:border-blue-500" />
              <button type="submit" className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-lg hover:bg-blue-700">دخول</button>
            </form>
            <div className="mt-8 flex flex-col gap-3">
              <button onClick={() => setCurrentView('register')} className="text-blue-600 text-xs font-black uppercase tracking-widest hover:underline">لا تملك حساباً؟ سجل فريقك</button>
              <button onClick={() => setCurrentView('home')} className="text-slate-400 text-xs underline">العودة للرئيسية</button>
            </div>
          </div>
        </div>
      );
      default: return (
        <>
          <section className="bg-slate-900 pt-24 pb-32 px-6 md:px-12 text-center text-white relative overflow-hidden">
             <div className="relative z-10 max-w-4xl mx-auto">
               <span className="bg-blue-600 text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest mb-8 inline-block">المنصة الرياضية المتكاملة</span>
               <h1 className="text-5xl md:text-8xl font-black mb-8 leading-tight tracking-tighter">بوابة البطولة</h1>
               <p className="text-slate-400 text-xl mb-12 leading-relaxed font-light">سجل فريقك، تابع إحصائياتك، وشاهد البث المباشر لأهم المباريات في مكان واحد وباحترافية عالية.</p>
               <div className="flex flex-wrap justify-center gap-4">
                 <button onClick={() => setCurrentView('register')} className="px-10 py-5 bg-blue-600 rounded-2xl font-black text-lg shadow-2xl hover:scale-105 transition-transform active:scale-95">سجل فريقك الآن</button>
                 <button onClick={() => setCurrentView('live')} className="px-10 py-5 bg-white/10 rounded-2xl font-black text-lg border border-white/20 hover:bg-white/20 backdrop-blur-md transition-all">مشاهدة البث</button>
               </div>
             </div>
             <Trophy className="absolute -bottom-20 -right-20 w-[400px] h-[400px] text-white/5 rotate-12 pointer-events-none" />
          </section>
          
          <section className="py-24 px-6 md:px-12 bg-white">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-16">
                <h2 className="text-4xl font-black">الفرق المشاركة</h2>
                <div className="h-1 flex-1 mx-8 bg-slate-50 rounded-full hidden md:block"></div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
                {allTeams.length > 0 ? allTeams.map(team => (
                  <button key={team.id} onClick={() => { setPublicTeam(team); window.location.hash = `team-${team.id}`; }} className="group text-center animate-in fade-in zoom-in duration-500">
                    <div className="relative mb-6 inline-block">
                       <img src={team.logo_url} className="w-24 h-24 md:w-32 md:h-32 rounded-full mx-auto border-4 border-white shadow-xl group-hover:shadow-blue-200 group-hover:scale-110 transition-all duration-500 bg-white object-cover" />
                       <div className="absolute inset-0 rounded-full bg-blue-600/0 group-hover:bg-blue-600/10 transition-colors"></div>
                    </div>
                    <p className="font-black text-slate-900 group-hover:text-blue-600 transition-colors">{team.team_name}</p>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">{team.region}</p>
                  </button>
                )) : (
                  <div className="col-span-full py-16 text-center bg-slate-50 rounded-[3rem] border border-dashed">
                    <p className="text-slate-400 font-bold">لا توجد فرق مسجلة حالياً. كن أول من يسجل!</p>
                  </div>
                )}
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
        <div className="flex items-center gap-3 font-black text-xl cursor-pointer" onClick={() => { window.location.hash = ''; setCurrentView('home'); }}>
          <div className="bg-blue-600 p-2 rounded-xl shadow-lg"><Trophy className="w-6 h-6 text-white" /></div>
          <span className="tracking-tight">بوابة البطولة</span>
        </div>
        <div className="hidden md:flex gap-10 text-[11px] font-black uppercase tracking-widest text-slate-400">
           <button onClick={() => { window.location.hash = ''; setCurrentView('home'); }} className={currentView === 'home' ? 'text-blue-600' : 'hover:text-slate-900 transition-colors'}>الرئيسية</button>
           <button onClick={() => setCurrentView('live')} className={currentView === 'live' ? 'text-red-600' : 'hover:text-slate-900 transition-colors'}>البث المباشر</button>
           {user && <button onClick={() => setCurrentView('profile')} className="text-slate-900">ملف فريقي</button>}
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="text-[10px] font-black text-slate-400 hidden lg:block">{user.team_name}</span>
              <button onClick={() => setUser(null)} className="p-2.5 text-red-500 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"><LogOut className="w-5 h-5" /></button>
            </>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => setCurrentView('login')} className="px-5 py-2.5 text-slate-900 text-[11px] font-black border rounded-xl hover:bg-slate-50 transition-all">دخول</button>
              <button onClick={() => setCurrentView('register')} className="px-6 py-2.5 bg-slate-900 text-white text-[11px] font-black rounded-xl hover:bg-blue-600 transition-all shadow-lg">سجل الآن</button>
            </div>
          )}
        </div>
      </nav>
      <main className="min-h-[75vh]">{renderContent()}</main>
      <footer className="bg-slate-900 text-slate-500 py-24 text-center">
        <div className="max-w-4xl mx-auto px-6">
          <Trophy className="w-14 h-14 text-blue-600 mx-auto mb-10" />
          <h4 className="text-white font-black text-xl mb-6 tracking-tight">بوابة البطولة الرقمية</h4>
          <p className="text-sm leading-relaxed max-w-lg mx-auto mb-12 opacity-80 font-medium">المنصة الأولى والوحيدة المتخصصة في إدارة وتغطية البطولات الرياضية بأعلى معايير الجودة والاحترافية.</p>
          <div className="pt-10 border-t border-white/5 text-[10px] uppercase font-black tracking-[0.2em]">&copy; 2024 جميع الحقوق محفوظة لـ بوابة البطولة الرياضية</div>
        </div>
      </footer>
    </div>
  );
}
