
import React, { useState, useEffect, useRef } from 'react';
import { FirebaseService } from './services/firebase';
import { TeamRegistration, LiveChannel, Post, Comment, AdConfig, Match } from './types';
import { 
  Trophy, Shield, Loader2, Radio, ExternalLink, RefreshCw, LogOut, Save, Copy, Check, User, 
  LayoutGrid, Image as ImageIcon, Send, MapPin, Users, Plus, Hash, Edit3, Camera, Heart, 
  MessageSquare, ChevronDown, Settings, Upload, X, Share2, Flame, Bell, Star, Zap, MessageCircle,
  Medal, Target, Activity, Calendar, Home, Menu, Trash2, Eye, EyeOff, Lock, ShieldAlert, Shuffle,
  Megaphone, UserPlus, BarChart3, Clock
} from 'lucide-react';

type ViewState = 'home' | 'profile' | 'live' | 'hub' | 'login' | 'register' | 'admin' | 'admin-login' | 'draw' | 'matches';

const SESSION_KEY = 'kora_logged_team_id';
const ADMIN_KEY = 'kora_is_admin';

const ADMIN_CREDS = {
  email: "koradz@tournament.com",
  pass: "vampirewahab31"
};

const PermissionAlert: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const rulesCode = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(rulesCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto my-6 md:my-12 p-6 md:p-8 bg-white border-t-8 border-red-500 rounded-[2rem] md:rounded-[3rem] shadow-2xl text-right relative overflow-hidden mx-4">
      <div className="flex items-center justify-end gap-3 md:gap-4 text-red-600 mb-6 font-black text-xl md:text-3xl">
        <h2>تنبيه: تحديث قواعد Firebase</h2>
        <Shield className="w-8 h-8 md:w-12 md:h-12" />
      </div>
      <p className="mb-4 font-bold text-slate-700 text-sm md:text-base">يجب نسخ الكود التالي ولصقه في تبويب <span className="text-blue-600">Rules</span> في Firebase Console:</p>
      <div className="bg-slate-900 text-emerald-400 p-4 md:p-8 rounded-[1.5rem] md:rounded-[2rem] font-mono text-xs md:text-sm overflow-x-auto ltr shadow-inner border-4 border-slate-800 mb-6 relative">
        <button onClick={handleCopy} className="absolute top-2 left-2 p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all">
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </button>
        <pre>{rulesCode}</pre>
      </div>
      <button onClick={() => window.location.reload()} className="w-full py-4 md:py-6 bg-slate-900 text-white rounded-2xl font-black text-lg md:text-xl hover:bg-blue-600 transition-all flex items-center justify-center gap-3 shadow-2xl">
        <RefreshCw className="w-6 h-6 md:w-8 md:h-8" /> تحديث الصفحة
      </button>
    </div>
  );
};

const AdDisplay: React.FC<{ html?: string; className?: string }> = ({ html, className = "" }) => {
  if (!html || html.trim() === "") return null;
  return (
    <div 
      className={`ad-container max-w-7xl mx-auto my-4 overflow-hidden rounded-2xl ${className}`}
      dangerouslySetInnerHTML={{ __html: html }} 
    />
  );
};

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>('home');
  const [user, setUser] = useState<TeamRegistration | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [liveChannels, setLiveChannels] = useState<LiveChannel[]>([]);
  const [allTeams, setAllTeams] = useState<TeamRegistration[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [visitorCount, setVisitorCount] = useState(0);
  const [ads, setAds] = useState<AdConfig>({ under_header: "", after_draw: "", hub_top: "", hub_bottom: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [permissionError, setPermissionError] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [adminClickCount, setAdminClickCount] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  const fetchData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    setPermissionError(false);
    try {
      const savedAdmin = localStorage.getItem(ADMIN_KEY);
      if (savedAdmin === 'true') setIsAdmin(true);

      const savedTeamId = localStorage.getItem(SESSION_KEY);
      if (savedTeamId && !user) {
        const teamData = await FirebaseService.getTeamById(savedTeamId);
        if (teamData) setUser(teamData);
      }

      const [channels, teams, hubPosts, adsData, matchesData, statsData] = await Promise.all([
        FirebaseService.getLiveChannels(isAdmin || savedAdmin === 'true'),
        FirebaseService.getAllTeams(),
        FirebaseService.getPosts(),
        FirebaseService.getAds(),
        FirebaseService.getMatches(),
        FirebaseService.getStats()
      ]);
      setLiveChannels(channels);
      setAllTeams(teams.filter(t => t.contact_email !== ADMIN_CREDS.email));
      setPosts(hubPosts);
      setAds(adsData);
      setMatches(matchesData);
      setVisitorCount(statsData);
      
      if (!silent) await FirebaseService.trackVisit();
    } catch (err: any) {
      if (err.message === "PERMISSION_DENIED") setPermissionError(true);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const handleHashChange = () => {
      if (window.location.hash === '#admin-access') setCurrentView('admin-login');
    };
    window.addEventListener('hashchange', handleHashChange);
    if (window.location.hash === '#admin-access') setCurrentView('admin-login');

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setIsUserMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [isAdmin]);

  const handleLogout = () => {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(ADMIN_KEY);
    setUser(null);
    setIsAdmin(false);
    setCurrentView('home');
    setIsUserMenuOpen(false);
    window.location.hash = '';
  };

  const handleSecretClick = () => {
    const newCount = adminClickCount + 1;
    setAdminClickCount(newCount);
    if (newCount >= 7) {
      setCurrentView('admin-login');
      setAdminClickCount(0);
      window.location.hash = 'admin-access';
    }
  };

  const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState<'stats' | 'teams' | 'matches' | 'posts' | 'channels' | 'ads'>('stats');
    const [isSaving, setIsSaving] = useState(false);
    const [tempAds, setTempAds] = useState<AdConfig>({...ads});

    const handleMatchSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSaving(true);
      const t = e.target as any;
      const home = allTeams.find(x => x.id === t[0].value);
      const away = allTeams.find(x => x.id === t[1].value);
      if (!home || !away) return;

      await FirebaseService.createMatch({
        homeTeamId: home.id!, homeTeamName: home.team_name, homeTeamLogo: home.logo_url!,
        awayTeamId: away.id!, awayTeamName: away.team_name, awayTeamLogo: away.logo_url!,
        date: t[2].value, time: t[3].value, scoreHome: Number(t[4].value), scoreAway: Number(t[5].value),
        status: t[6].value, tournament_round: t[7].value
      });
      t.reset(); fetchData(true); setIsSaving(false);
    };

    return (
      <div className="max-w-7xl mx-auto py-10 px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12 bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 text-right">
          <div><h2 className="text-3xl font-black flex items-center gap-3 justify-end">الإدارة المركزية <Lock className="text-blue-600" /></h2><p className="text-slate-400 font-bold">تحكم كامل في كافة مفاصل البطولة والملتقى.</p></div>
          <div className="flex gap-4">
             <div className="bg-blue-600 text-white px-8 py-3 rounded-2xl flex items-center gap-3"><BarChart3 className="w-5 h-5" /><span className="font-black text-xl">{visitorCount}</span><p className="text-[10px] opacity-70">زائر</p></div>
          </div>
        </div>

        <div className="flex gap-2 mb-8 bg-slate-100 p-1.5 rounded-2xl w-max mr-0 ml-auto overflow-x-auto max-w-full custom-scrollbar">
          {['stats', 'teams', 'matches', 'posts', 'channels', 'ads'].map((tab: any) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === tab ? 'bg-white text-blue-600 shadow-md' : 'text-slate-500'}`}>
              {tab === 'stats' ? 'الإحصائيات' : tab === 'teams' ? 'الأندية' : tab === 'matches' ? 'المباريات' : tab === 'posts' ? 'المنشورات' : tab === 'channels' ? 'البث' : 'الإعلانات'}
            </button>
          ))}
        </div>

        {activeTab === 'stats' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
             <div className="bg-white p-8 rounded-[2rem] shadow-lg border-b-4 border-blue-500 text-center"><p className="text-4xl font-black text-slate-800">{visitorCount}</p><p className="text-xs text-slate-400 font-black mt-2">إجمالي الزيارات</p></div>
             <div className="bg-white p-8 rounded-[2rem] shadow-lg border-b-4 border-emerald-500 text-center"><p className="text-4xl font-black text-slate-800">{allTeams.length}</p><p className="text-xs text-slate-400 font-black mt-2">الأندية المسجلة</p></div>
             <div className="bg-white p-8 rounded-[2rem] shadow-lg border-b-4 border-amber-500 text-center"><p className="text-4xl font-black text-slate-800">{posts.length}</p><p className="text-xs text-slate-400 font-black mt-2">منشورات الملتقى</p></div>
             <div className="bg-white p-8 rounded-[2rem] shadow-lg border-b-4 border-rose-500 text-center"><p className="text-4xl font-black text-slate-800">{matches.length}</p><p className="text-xs text-slate-400 font-black mt-2">المباريات المبرمجة</p></div>
          </div>
        )}

        {activeTab === 'matches' && (
          <div className="space-y-8 text-right">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-50">
               <h3 className="text-xl font-black mb-6">إضافة مباراة جديدة</h3>
               <form onSubmit={handleMatchSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                 <select required className="p-4 bg-slate-50 rounded-xl font-bold text-sm text-right outline-none">
                   <option value="">اختر الفريق الأول</option>
                   {allTeams.map(t => <option key={t.id} value={t.id}>{t.team_name}</option>)}
                 </select>
                 <select required className="p-4 bg-slate-50 rounded-xl font-bold text-sm text-right outline-none">
                   <option value="">اختر الفريق الثاني</option>
                   {allTeams.map(t => <option key={t.id} value={t.id}>{t.team_name}</option>)}
                 </select>
                 <input type="date" required className="p-4 bg-slate-50 rounded-xl font-bold text-sm text-right outline-none" />
                 <input type="time" required className="p-4 bg-slate-50 rounded-xl font-bold text-sm text-right outline-none" />
                 <input type="number" placeholder="أهداف الأول" defaultValue={0} className="p-4 bg-slate-50 rounded-xl font-bold text-sm text-right outline-none" />
                 <input type="number" placeholder="أهداف الثاني" defaultValue={0} className="p-4 bg-slate-50 rounded-xl font-bold text-sm text-right outline-none" />
                 <select className="p-4 bg-slate-50 rounded-xl font-bold text-sm text-right outline-none">
                   <option value="upcoming">قادمة</option>
                   <option value="live">مباشر</option>
                   <option value="finished">انتهت</option>
                 </select>
                 <input placeholder="الدور (مثال: الربع النهائي)" className="p-4 bg-slate-50 rounded-xl font-bold text-sm text-right outline-none" />
                 <button className="md:col-span-4 py-4 bg-blue-600 text-white rounded-xl font-black shadow-lg">جدولة المباراة</button>
               </form>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {matches.map(m => (
                <div key={m.id} className="bg-white p-6 rounded-[2rem] shadow-lg flex flex-col gap-4 border border-slate-50">
                   <div className="flex items-center justify-between">
                     <button onClick={() => FirebaseService.deleteMatch(m.id!).then(() => fetchData(true))} className="text-rose-500 p-2 hover:bg-rose-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                     <div className="bg-slate-100 px-4 py-1 rounded-full text-[10px] font-black">{m.tournament_round}</div>
                   </div>
                   <div className="flex items-center justify-around">
                      <div className="text-center w-24"><img src={m.homeTeamLogo} className="w-12 h-12 mx-auto rounded-lg mb-2" /><p className="text-[10px] font-black">{m.homeTeamName}</p></div>
                      <div className="text-center font-black text-2xl px-6 py-2 bg-slate-50 rounded-2xl">{m.scoreHome} - {m.scoreAway}</div>
                      <div className="text-center w-24"><img src={m.awayTeamLogo} className="w-12 h-12 mx-auto rounded-lg mb-2" /><p className="text-[10px] font-black">{m.awayTeamName}</p></div>
                   </div>
                   <div className="text-center text-[10px] font-bold text-slate-400 border-t pt-2 flex justify-center gap-4">
                     <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {m.date}</span>
                     <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {m.time}</span>
                   </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'posts' && (
          <div className="space-y-6">
            <h3 className="text-xl font-black text-right">إدارة منشورات الملتقى</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {posts.map(post => (
                <div key={post.id} className="bg-white p-6 rounded-[2rem] shadow-lg border border-slate-50 flex items-center justify-between gap-4">
                   <div className="flex items-center gap-4 text-right">
                     <img src={post.teamLogo} className="w-10 h-10 rounded-lg" />
                     <div><p className="font-black text-xs">{post.teamName}</p><p className="text-[10px] text-slate-400 line-clamp-1">{post.content}</p></div>
                   </div>
                   <button onClick={() => FirebaseService.deletePost(post.id!).then(() => fetchData(true))} className="p-3 bg-rose-50 text-rose-500 rounded-xl"><Trash2 className="w-5 h-5" /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* الأقسام القديمة المتبقية كالإعلانات والبث... */}
        {activeTab === 'ads' && (
          <div className="bg-white p-10 rounded-[2.5rem] shadow-xl text-right">
            <form onSubmit={async (e) => { e.preventDefault(); await FirebaseService.updateAds(tempAds); alert('تم الحفظ'); fetchData(true); }} className="space-y-6">
              <textarea value={tempAds.under_header} onChange={e => setTempAds({...tempAds, under_header: e.target.value})} placeholder="Ad Header HTML" className="w-full h-32 p-4 bg-slate-900 text-emerald-400 font-mono text-xs rounded-2xl" />
              <textarea value={tempAds.after_draw} onChange={e => setTempAds({...tempAds, after_draw: e.target.value})} placeholder="Ad After Draw HTML" className="w-full h-32 p-4 bg-slate-900 text-emerald-400 font-mono text-xs rounded-2xl" />
              <button className="w-full py-4 bg-blue-600 text-white rounded-xl font-black">حفظ التغييرات</button>
            </form>
          </div>
        )}
      </div>
    );
  };

  const MatchCenterView = () => {
    return (
      <div className="max-w-7xl mx-auto py-12 px-6 pb-24 text-right animate-in fade-in duration-500">
        <div className="flex items-center justify-between mb-12">
           <div className="bg-slate-900 px-6 py-3 rounded-2xl text-white font-black text-xs uppercase tracking-widest flex items-center gap-3"><Activity className="w-4 h-4 text-emerald-400" /> مركز المباريات</div>
           <h2 className="text-4xl md:text-5xl font-black italic">جدول البطولة</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {matches.map(m => (
            <div key={m.id} className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100 flex flex-col gap-6 relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-all duration-700"></div>
               <div className="flex justify-between items-center relative z-10">
                 <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-tighter shadow-sm border ${m.status === 'live' ? 'bg-rose-600 text-white border-rose-500 animate-pulse' : m.status === 'finished' ? 'bg-slate-800 text-white border-slate-700' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                   {m.status === 'live' ? 'مباشر الآن' : m.status === 'finished' ? 'انتهت' : 'قادمة'}
                 </div>
                 <div className="text-[10px] font-black text-slate-400">{m.tournament_round}</div>
               </div>
               <div className="flex items-center justify-around py-4 relative z-10">
                  <div className="text-center flex-1">
                    <div className="w-20 h-20 mx-auto bg-slate-50 rounded-[1.5rem] p-3 border-4 border-white shadow-lg mb-4 flex items-center justify-center overflow-hidden">
                       <img src={m.homeTeamLogo} className="w-full h-full object-contain" />
                    </div>
                    <p className="font-black text-sm truncate">{m.homeTeamName}</p>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                     <div className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 bg-slate-50 px-6 py-4 rounded-[2rem] border border-slate-100 shadow-inner">
                        {m.scoreHome} <span className="text-slate-200">-</span> {m.scoreAway}
                     </div>
                  </div>
                  <div className="text-center flex-1">
                    <div className="w-20 h-20 mx-auto bg-slate-50 rounded-[1.5rem] p-3 border-4 border-white shadow-lg mb-4 flex items-center justify-center overflow-hidden">
                       <img src={m.awayTeamLogo} className="w-full h-full object-contain" />
                    </div>
                    <p className="font-black text-sm truncate">{m.awayTeamName}</p>
                  </div>
               </div>
               <div className="flex items-center justify-center gap-4 pt-6 border-t border-slate-50 text-[10px] font-black text-slate-400 relative z-10">
                  <span className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl"><Calendar className="w-4 h-4 text-blue-500" /> {m.date}</span>
                  <span className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl"><Clock className="w-4 h-4 text-blue-500" /> {m.time}</span>
               </div>
            </div>
          ))}
          {matches.length === 0 && (
            <div className="col-span-full py-32 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
              <Calendar className="w-16 h-16 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-400 font-black italic">لم يتم جدولة أي مباريات حتى اللحظة</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (isLoading) return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-6">
        <div className="w-24 h-24 border-8 border-blue-600/10 border-t-blue-600 rounded-full animate-spin"></div>
        <div className="text-center"><h2 className="text-2xl font-black text-slate-800 italic">بوابة البطولة</h2><p className="text-slate-400 font-bold text-sm mt-2">جاري مزامنة البيانات...</p></div>
      </div>
    );
    if (permissionError) return <PermissionAlert />;
    if (currentView === 'admin' && isAdmin) return <AdminDashboard />;
    if (currentView === 'matches') return <MatchCenterView />;
    
    // الأقسام السابقة كما هي (Hub, Profile, Draw...)
    switch (currentView) {
      case 'profile': return <ProfileView />;
      case 'hub': return <HubView />;
      case 'draw': return <DrawView />;
      case 'live': return <LiveView />;
      case 'login': return <LoginView />;
      case 'register': return <RegisterView />;
      case 'admin-login': return <AdminLoginView />;
      default: return (
        <>
          <HeroSection />
          <AdDisplay html={ads.after_draw} className="px-4" />
          <TeamsSection />
        </>
      );
    }
  };

  const HeroSection = () => (
    <section className="bg-slate-900 pt-32 pb-48 px-4 text-center text-white relative">
       <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
       <div className="relative z-10 max-w-5xl mx-auto">
         <div className="inline-block px-6 py-2 bg-blue-600/20 backdrop-blur-md rounded-full text-blue-400 font-black text-xs uppercase mb-8 border border-blue-600/30">الموسم الرياضي 2024 / 2025</div>
         <h1 className="text-6xl md:text-9xl font-black mb-10 leading-[1.1] tracking-tighter italic animate-in slide-in-from-top duration-700">بوابة البطولة</h1>
         <p className="text-slate-400 text-2xl mb-16 font-light max-w-2xl mx-auto leading-relaxed italic px-4 animate-in fade-in duration-1000">مجتمع رياضي رقمي متكامل لإدارة الفرق، النتائج، والبث المباشر بأعلى التقنيات الرقمية.</p>
         <div className="flex flex-col md:flex-row justify-center gap-6 px-4">
           <button onClick={() => setCurrentView('register')} className="w-full md:w-auto px-14 py-6 bg-blue-600 rounded-[2rem] font-black text-xl shadow-2xl active:scale-95 transition-all">سجل فريقك</button>
           <button onClick={() => setCurrentView('matches')} className="w-full md:w-auto px-14 py-6 bg-white/10 rounded-[2rem] font-black text-xl border border-white/20 hover:bg-white/20 transition-all backdrop-blur-md flex items-center justify-center gap-2">مركز المباريات <Clock className="w-6 h-6" /></button>
         </div>
       </div>
    </section>
  );

  const TeamsSection = () => (
    <section className="py-32 px-4 bg-white relative">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-24 text-right px-4">
          <div className="bg-slate-50 px-8 py-4 rounded-3xl border border-slate-100 font-black text-3xl text-blue-600 shadow-sm">{allTeams.length} <span className="text-slate-400 text-lg">فريق مسجل</span></div>
          <h2 className="text-5xl font-black text-slate-900 flex items-center gap-5 italic justify-end">النخبة المشاركة <Users className="text-blue-600 w-12 h-12" /></h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-10">
          {allTeams.map(team => (
            <div key={team.id} className="text-center group animate-in zoom-in duration-500">
              <div className="relative mb-6">
                <img src={team.logo_url} className="w-36 h-36 mx-auto rounded-[2.5rem] border-4 border-white shadow-xl group-hover:scale-110 transition-all duration-500 bg-white object-cover" />
              </div>
              <p className="font-black text-slate-800 text-lg group-hover:text-blue-600 transition-colors truncate px-2">{team.team_name}</p>
              <p className="text-[10px] text-slate-400 font-black uppercase mt-1 bg-slate-50 inline-block px-3 py-1 rounded-full group-hover:bg-blue-50 transition-colors">{team.region}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );

  // Helper views (Simplified to keep code block clean)
  const LoginView = () => (
    <div className="max-w-md mx-auto py-24 px-6 text-center">
       <div className="bg-white rounded-[3.5rem] p-12 shadow-2xl border border-slate-100">
          <div className="bg-blue-600 w-20 h-20 rounded-3xl mx-auto mb-8 flex items-center justify-center shadow-xl"><Trophy className="w-10 h-10 text-white" /></div>
          <h3 className="text-3xl font-black mb-10 italic">دخول النادي</h3>
          <form onSubmit={async (e) => { e.preventDefault(); const t = e.target as any; const { data, error } = await FirebaseService.loginTeam(t[0].value, t[1].value); if (error) alert(error); else { setUser(data); localStorage.setItem(SESSION_KEY, data.id!); setCurrentView('profile'); fetchData(true); } }} className="space-y-5">
            <input type="email" placeholder="البريد الإلكتروني" className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-right" />
            <input type="password" placeholder="كلمة المرور" className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-right" />
            <button type="submit" className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl">تأكيد الدخول</button>
          </form>
       </div>
    </div>
  );

  const RegisterView = () => (
    <div className="max-w-md mx-auto py-24 px-6 text-center">
       <div className="bg-white rounded-[3.5rem] p-12 shadow-2xl border border-slate-100">
          <h3 className="text-3xl font-black mb-10 italic">تسجيل فريق جديد</h3>
          <form onSubmit={async (e) => { e.preventDefault(); const t = e.target as any; const res = await FirebaseService.registerTeam({ team_name: t[0].value, coach_name: t[1].value, contact_email: t[2].value, password: t[3].value, region: t[4].value }); if (res.error) alert(res.error); else { alert('تم التسجيل بنجاح!'); setCurrentView('login'); fetchData(true); } }} className="space-y-4">
            <input placeholder="اسم الفريق" className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-right" />
            <input placeholder="اسم المدرب" className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-right" />
            <input type="email" placeholder="البريد الإلكتروني" className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-right" />
            <input type="password" placeholder="كلمة المرور" className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-right" />
            <input placeholder="الولاية" className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-right" />
            <button type="submit" className="w-full py-5 bg-slate-900 text-white font-black rounded-2xl shadow-xl">تقديم الطلب</button>
          </form>
       </div>
    </div>
  );

  const AdminLoginView = () => (
    <div className="max-w-md mx-auto py-24 px-6 text-center">
      <div className="bg-slate-900 rounded-[3.5rem] p-12 shadow-2xl border border-slate-800 text-white">
        <div className="bg-blue-600 w-20 h-20 rounded-3xl mx-auto mb-8 flex items-center justify-center rotate-3 shadow-xl"><ShieldAlert className="w-10 h-10" /></div>
        <h3 className="text-3xl font-black mb-10 italic">بوابة المشرف السرية</h3>
        <form onSubmit={async (e) => { e.preventDefault(); const t = e.target as any; if (t[0].value === ADMIN_CREDS.email && t[1].value === ADMIN_CREDS.pass) { setIsAdmin(true); localStorage.setItem(ADMIN_KEY, 'true'); setCurrentView('admin'); fetchData(true); } else alert("خطأ في البيانات."); }} className="space-y-5">
          <input type="email" placeholder="البريد السري" className="w-full p-5 bg-slate-800 border border-slate-700 rounded-2xl outline-none font-bold text-right" />
          <input type="password" placeholder="كلمة المرور" className="w-full p-5 bg-slate-800 border border-slate-700 rounded-2xl outline-none font-bold text-right" />
          <button type="submit" className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl">دخول لوحة التحكم</button>
        </form>
        <button onClick={() => { setCurrentView('home'); window.location.hash = ''; }} className="mt-8 text-slate-500 font-bold">إلغاء</button>
      </div>
    </div>
  );

  // Remaining simplified components (Live, Hub, Draw, Profile) follow the same logic as before...
  const LiveView = () => (
    <div className="max-w-7xl mx-auto py-12 px-6 pb-24 text-right">
      <h2 className="text-4xl font-black flex items-center gap-4 justify-end italic mb-12">قنوات البث المباشر <Radio className="text-red-600 animate-pulse" /></h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {liveChannels.map(ch => (
          <div key={ch.id} className="bg-white rounded-[2.5rem] p-6 shadow-xl border border-slate-100">
            <div className="h-56 w-full rounded-[2rem] overflow-hidden mb-6 relative"><img src={ch.thumbnail_url} className="w-full h-full object-cover" /></div>
            <h4 className="font-black text-xl mb-4 truncate">{ch.name}</h4>
            <button onClick={() => window.open(ch.stream_url, '_blank')} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black shadow-lg">شاهد الآن</button>
          </div>
        ))}
      </div>
    </div>
  );

  const HubView = () => {
    const [newPostContent, setNewPostContent] = useState('');
    const [newPostImage, setNewPostImage] = useState('');
    const [isPosting, setIsPosting] = useState(false);
    const postImageInputRef = useRef<HTMLInputElement>(null);

    const handlePost = async () => {
      if (!user || (!newPostContent.trim() && !newPostImage)) return;
      setIsPosting(true);
      await FirebaseService.createPost({ teamId: user.id!, teamName: user.team_name, teamLogo: user.logo_url!, content: newPostContent, imageUrl: newPostImage });
      setNewPostContent(''); setNewPostImage(''); await fetchData(true); setIsPosting(false);
    };

    return (
      <div className="max-w-4xl mx-auto py-12 px-4 pb-24 text-right">
        <h2 className="text-4xl font-black mb-12 italic text-center">ملتقى الفرق</h2>
        {user ? (
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 mb-12">
            <textarea value={newPostContent} onChange={e => setNewPostContent(e.target.value)} placeholder="ما الجديد في فريقك؟" className="w-full p-6 bg-slate-50 rounded-2xl outline-none font-bold text-right text-lg resize-none h-40 focus:bg-white transition-all" />
            {newPostImage && <div className="relative inline-block mt-4"><img src={newPostImage} className="w-40 h-40 rounded-2xl object-cover border-4 border-slate-100 shadow-lg" /><button onClick={() => setNewPostImage('')} className="absolute -top-3 -right-3 bg-rose-500 text-white p-2 rounded-full shadow-lg"><X className="w-4 h-4" /></button></div>}
            <div className="flex items-center justify-between mt-6">
               <button onClick={handlePost} disabled={isPosting} className="bg-blue-600 text-white px-12 py-4 rounded-2xl font-black shadow-lg flex items-center gap-2">{isPosting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'نشر الآن'}</button>
               <button onClick={() => postImageInputRef.current?.click()} className="flex items-center gap-3 text-slate-500 font-black hover:text-blue-600 transition-all p-2 rounded-xl"><span>صورة المباراة</span> <ImageIcon className="w-6 h-6" /></button>
               <input type="file" ref={postImageInputRef} className="hidden" accept="image/*" onChange={async e => { if (e.target.files?.[0]) { const b64 = await fileToBase64(e.target.files[0]); setNewPostImage(b64); } }} />
            </div>
          </div>
        ) : (
          <div className="bg-slate-900 text-white p-12 rounded-[2.5rem] text-center mb-12 shadow-2xl">
            <h3 className="text-2xl font-black mb-4 italic">كن جزءاً من الحدث!</h3>
            <p className="text-slate-400 mb-8 font-bold">سجل دخولك الآن للتفاعل مع الفرق الرياضية ومشاركة أخبارك.</p>
            <button onClick={() => setCurrentView('login')} className="bg-blue-600 px-12 py-4 rounded-xl font-black shadow-xl">تسجيل الدخول</button>
          </div>
        )}
        <div className="space-y-8">
          {posts.map(post => <PostCard key={post.id} post={post} currentUser={user} onRefresh={() => fetchData(true)} />)}
        </div>
      </div>
    );
  };

  const DrawView = () => {
    const [isDrawing, setIsDrawing] = useState(false);
    const [opponent, setOpponent] = useState<TeamRegistration | null>(null);
    const [shufflingIndex, setShufflingIndex] = useState(0);

    const startDraw = () => {
      if (allTeams.length <= 1) { alert("لا يوجد فرق كافية."); return; }
      setIsDrawing(true); setOpponent(null);
      const available = allTeams.filter(t => t.id !== user?.id);
      let count = 0;
      const interval = setInterval(() => {
        setShufflingIndex(Math.floor(Math.random() * available.length));
        count++;
        if (count > 20) { clearInterval(interval); setOpponent(available[Math.floor(Math.random() * available.length)]); setIsDrawing(false); }
      }, 100);
    };

    if (!user) return <div className="max-w-md mx-auto py-24 text-center"><button onClick={() => setCurrentView('login')} className="bg-blue-600 text-white px-10 py-4 rounded-xl font-black">دخول النادي لإجراء القرعة</button></div>;

    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <h2 className="text-4xl md:text-5xl font-black italic mb-12">قرعة البطولة الآلية</h2>
        <div className="bg-white rounded-[3rem] p-16 shadow-2xl border border-slate-100 flex flex-col items-center justify-center min-h-[500px]">
          {!opponent && !isDrawing ? (
            <button onClick={startDraw} className="px-14 py-6 bg-blue-600 text-white rounded-[2rem] font-black text-2xl shadow-2xl">ابدأ القرعة الآن</button>
          ) : (
            <div className="w-full flex items-center justify-around">
               <div className="text-center flex-1"><img src={user.logo_url} className="w-32 h-32 mx-auto rounded-3xl mb-4" /><p className="font-black">{user.team_name}</p></div>
               <div className="text-6xl font-black text-slate-100 italic">VS</div>
               <div className="text-center flex-1"><img src={isDrawing ? allTeams[shufflingIndex]?.logo_url : (opponent?.logo_url || '')} className="w-32 h-32 mx-auto rounded-3xl mb-4" /><p className="font-black">{isDrawing ? 'جاري السحب...' : (opponent?.team_name || '')}</p></div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const ProfileView = () => {
    if (!user) return null;
    return (
      <div className="max-w-7xl mx-auto py-12 px-4 text-right">
        <div className="bg-slate-900 h-64 md:h-96 rounded-[3rem] relative overflow-hidden mb-16 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>
          <div className="absolute -bottom-12 right-12 flex flex-col md:flex-row items-center gap-8 text-white">
            <img src={user.logo_url} className="w-40 h-40 md:w-56 md:h-56 rounded-[3rem] border-8 border-white bg-white shadow-2xl" />
            <div className="mb-14 text-center md:text-right">
              <h2 className="text-4xl md:text-6xl font-black italic tracking-tighter">نادي {user.team_name}</h2>
              <p className="text-blue-200 font-bold flex items-center gap-2 justify-center md:justify-end mt-2"><MapPin className="w-5 h-5" /> {user.municipality || user.region}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const PostCard = ({ post, currentUser, onRefresh }: any) => {
    const isLiked = currentUser ? post.likes?.includes(currentUser.id!) : false;
    return (
      <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden mb-6 text-right">
        <div className="p-8">
          <div className="flex items-center gap-4 mb-6 justify-end">
            <div className="text-right"><h4 className="font-black text-lg text-slate-900">{post.teamName}</h4></div>
            <img src={post.teamLogo} className="w-12 h-12 rounded-xl object-cover shadow-sm" />
          </div>
          {post.content && <p className="text-slate-700 text-lg mb-6 leading-relaxed">{post.content}</p>}
          {post.imageUrl && <img src={post.imageUrl} className="w-full rounded-[1.5rem] mb-6 shadow-sm object-cover max-h-[500px]" />}
          <div className="flex items-center gap-6 pt-4 border-t border-slate-50">
            <button onClick={async () => { if(!currentUser) return; await FirebaseService.toggleLike(post.id, currentUser.id!, isLiked); onRefresh(); }} className={`flex items-center gap-2 font-black transition-all ${isLiked ? 'text-rose-500' : 'text-slate-400'}`}>
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} /> {post.likes?.length || 0}
            </button>
            <div className="flex items-center gap-2 text-slate-400 font-black"><MessageSquare className="w-5 h-5" /> {post.comments?.length || 0}</div>
          </div>
        </div>
      </div>
    );
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  return (
    <div className="min-h-screen font-sans bg-[#fcfdfe]" dir="rtl">
      <nav className="bg-white/90 backdrop-blur-xl border-b border-slate-100 py-4 px-4 md:px-12 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3 font-black text-2xl cursor-pointer hover:scale-105 transition-transform" onClick={() => {setCurrentView('home'); window.location.hash = '';}}>
          <div className="bg-blue-600 p-2 rounded-2xl shadow-lg"><Trophy className="w-7 h-7 text-white" /></div>
          <span className="tracking-tighter italic hidden sm:inline text-slate-900">بوابة البطولة</span>
        </div>
        <div className="hidden lg:flex gap-12 text-[11px] font-black uppercase tracking-widest text-slate-400">
           <button onClick={() => setCurrentView('home')} className={`hover:text-blue-600 ${currentView === 'home' ? 'text-blue-600' : ''}`}>الرئيسية</button>
           <button onClick={() => setCurrentView('matches')} className={`hover:text-blue-600 ${currentView === 'matches' ? 'text-blue-600 font-black' : ''}`}>مركز المباريات</button>
           <button onClick={() => setCurrentView('hub')} className={`hover:text-blue-600 ${currentView === 'hub' ? 'text-blue-600' : ''}`}>الملتقى</button>
           <button onClick={() => setCurrentView('draw')} className={`hover:text-blue-600 ${currentView === 'draw' ? 'text-blue-600' : ''}`}>القرعة</button>
           <button onClick={() => setCurrentView('live')} className={`hover:text-blue-600 ${currentView === 'live' ? 'text-red-600 font-black' : ''}`}>مباشر</button>
        </div>
        <div className="flex items-center gap-5">
          {isAdmin ? (
             <div className="relative" ref={menuRef}>
               <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="flex items-center gap-3 p-1 pr-4 pl-1 bg-blue-600 text-white rounded-2xl shadow-lg hover:bg-blue-700 transition-all">
                 <div className="text-right hidden sm:block"><p className="text-[9px] font-black text-blue-100 uppercase">المشرف العام</p><p className="text-xs font-black">لوحة الإدارة</p></div>
                 <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><ShieldAlert className="w-6 h-6" /></div>
                 <ChevronDown className={`w-4 h-4 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
               </button>
               {isUserMenuOpen && (
                 <div className="absolute top-full left-0 mt-3 w-64 bg-white rounded-[2rem] shadow-2xl border border-slate-100 p-2 z-[100] text-right animate-in slide-in-from-top duration-300">
                   <button onClick={() => {setCurrentView('admin'); setIsUserMenuOpen(false);}} className="w-full flex items-center justify-end gap-3 p-4 hover:bg-slate-50 rounded-2xl transition-colors text-slate-600 font-bold">لوحة التحكم المركزية <Lock className="w-5 h-5" /></button>
                   <div className="mt-2 pt-2 border-t border-slate-50"><button onClick={handleLogout} className="w-full flex items-center justify-end gap-3 p-4 hover:bg-red-50 rounded-2xl transition-colors text-red-500 font-bold">خروج المسؤول <LogOut className="w-5 h-5" /></button></div>
                 </div>
               )}
             </div>
          ) : user ? (
            <div className="relative" ref={menuRef}>
              <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="flex items-center gap-4 p-1 pr-5 pl-1 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-white transition-all shadow-sm">
                <div className="text-right hidden sm:block"><p className="text-[9px] font-black text-slate-400 uppercase">ناديك</p><p className="text-sm font-black truncate max-w-[120px] text-slate-900">{user.team_name}</p></div>
                <img src={user.logo_url} className="w-10 h-10 rounded-xl shadow-md border-2 border-white object-cover" />
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {isUserMenuOpen && (
                <div className="absolute top-full left-0 mt-3 w-64 bg-white rounded-[2rem] shadow-2xl border border-slate-100 p-2 z-[100] text-right animate-in slide-in-from-top duration-300">
                  <button onClick={() => {setCurrentView('profile'); setIsUserMenuOpen(false);}} className="w-full flex items-center justify-end gap-3 p-4 hover:bg-slate-50 rounded-2xl transition-colors text-slate-600 font-bold">بروفايل النادي <User className="w-5 h-5" /></button>
                  <div className="mt-2 pt-2 border-t border-slate-50"><button onClick={handleLogout} className="w-full flex items-center justify-end gap-3 p-4 hover:bg-red-50 rounded-2xl transition-colors text-red-500 font-bold">تسجيل الخروج <LogOut className="w-5 h-5" /></button></div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex gap-3">
              <button onClick={() => setCurrentView('login')} className="px-8 py-3 bg-slate-100 text-[12px] font-black rounded-xl transition-all uppercase text-slate-600 hover:bg-slate-200">دخول</button>
              <button onClick={() => setCurrentView('register')} className="px-8 py-3 bg-blue-600 text-white text-[12px] font-black rounded-xl shadow-lg hover:bg-blue-700 transition-all">انضمام</button>
            </div>
          )}
        </div>
      </nav>

      <AdDisplay html={ads.under_header} className="px-4" />

      <main className="min-h-[80vh] relative">{renderContent()}</main>
      
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-4">
        <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 h-20 rounded-[2rem] shadow-2xl flex items-center justify-around px-4 text-slate-500">
           <button onClick={() => setCurrentView('home')} className={`flex flex-col items-center gap-1.5 transition-all ${currentView === 'home' ? 'text-blue-400' : ''}`}><Home className="w-6 h-6" /><span className="text-[9px] font-black">الرئيسية</span></button>
           <button onClick={() => setCurrentView('matches')} className={`flex flex-col items-center gap-1.5 transition-all ${currentView === 'matches' ? 'text-blue-400' : ''}`}><Clock className="w-6 h-6" /><span className="text-[9px] font-black">المباريات</span></button>
           <button onClick={() => setCurrentView('hub')} className={`flex flex-col items-center gap-1.5 transition-all ${currentView === 'hub' ? 'text-blue-400' : ''}`}><Hash className="w-6 h-6" /><span className="text-[9px] font-black">الملتقى</span></button>
           <button onClick={() => setCurrentView('live')} className={`flex flex-col items-center gap-1.5 transition-all ${currentView === 'live' ? 'text-red-500' : ''}`}><Radio className="w-6 h-6" /><span className="text-[9px] font-black">مباشر</span></button>
           {(user || isAdmin) && ( 
             <button onClick={() => setCurrentView(isAdmin ? 'admin' : 'profile')} className={`flex flex-col items-center gap-1.5 transition-all ${currentView === 'profile' || currentView === 'admin' ? 'text-blue-400' : ''}`}>
               {isAdmin ? <Lock className="w-6 h-6" /> : <User className="w-6 h-6" />}
               <span className="text-[9px] font-black">{isAdmin ? 'إدارة' : 'نادينا'}</span>
             </button> 
           )}
        </div>
      </div>

      <footer className="bg-slate-900 text-slate-500 py-24 text-center relative overflow-hidden pb-40">
        <div className="max-w-4xl mx-auto px-6 relative z-10">
          <button onClick={handleSecretClick} className="focus:outline-none transition-all opacity-10 hover:opacity-100 mb-8"><Trophy className="w-16 h-16 text-blue-600" /></button>
          <h3 className="text-white font-black text-2xl mb-4 italic">بوابة البطولة الرقمية</h3>
          <p className="text-xs opacity-60 font-bold uppercase mb-12 tracking-widest">مدعوم بتقنية Google Firebase &bull; 2024</p>
        </div>
      </footer>
    </div>
  );
}
