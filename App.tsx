
import React, { useState, useEffect, useRef } from 'react';
import { FirebaseService } from './services/firebase';
import { TeamRegistration, LiveChannel, Post, Comment, AdConfig, Match } from './types';
import { 
  Trophy, Shield, Loader2, Radio, ExternalLink, RefreshCw, LogOut, Save, Copy, Check, User, 
  LayoutGrid, Image as ImageIcon, Send, MapPin, Users, Plus, Hash, Edit3, Camera, Heart, 
  MessageSquare, ChevronDown, Settings, Upload, X, Share2, Flame, Bell, Star, Zap, MessageCircle,
  Medal, Target, Activity, Calendar, Home, Menu, Trash2, Eye, EyeOff, Lock, ShieldAlert, Shuffle,
  Megaphone, UserPlus, BarChart3, Clock, AlertCircle, Layers, Database, Info, TrendingUp, SaveAll
} from 'lucide-react';

type ViewState = 'home' | 'profile' | 'live' | 'hub' | 'login' | 'register' | 'admin' | 'admin-login' | 'draw' | 'matches';

const SESSION_KEY = 'kora_logged_team_id';
const ADMIN_KEY = 'kora_is_admin';

const ADMIN_CREDS = {
  email: "koradz@tournament.com",
  pass: "vampirewahab31"
};

const AdDisplay: React.FC<{ html?: string; className?: string }> = ({ html, className = "" }) => {
  if (!html || html.trim() === "") return null;
  return (
    <div 
      className={`ad-container max-w-7xl mx-auto my-4 overflow-hidden rounded-2xl flex justify-center ${className}`}
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
  const [ads, setAds] = useState<AdConfig>({ 
    under_header: "", 
    home_hero_bottom: "",
    after_draw: "", 
    hub_top: "", 
    hub_bottom: "", 
    matches_top: "",
    matches_bottom: "",
    live_top: "",
    profile_top: ""
  });
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
      if (savedTeamId) {
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

  // Function to convert image to Base64
  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const ProfileView = () => {
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<Partial<TeamRegistration>>({});
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!user) return null;

    const startEditing = () => {
      setEditData({
        team_name: user.team_name,
        coach_name: user.coach_name,
        bio: user.bio || "فريق رياضي طموح.",
        region: user.region,
        municipality: user.municipality,
        players_count: user.players_count || 0,
        logo_url: user.logo_url
      });
      setIsEditing(true);
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        try {
          const base64 = await convertToBase64(e.target.files[0]);
          setEditData(prev => ({ ...prev, logo_url: base64 }));
        } catch (error) {
          alert("خطأ في معالجة الصورة.");
        }
      }
    };

    const saveChanges = async () => {
      if (!user.id) return;
      setIsSaving(true);
      const res = await FirebaseService.updateTeamProfile(user.id, editData);
      if (res.success) {
        setUser({ ...user, ...editData });
        setIsEditing(false);
        fetchData(true);
      } else {
        alert("فشل تحديث البيانات.");
      }
      setIsSaving(false);
    };

    return (
      <div className="max-w-7xl mx-auto py-12 px-4 text-right animate-in fade-in duration-500">
         <AdDisplay html={ads.profile_top} />
         
         <div className="bg-slate-900 h-64 md:h-96 rounded-[3rem] relative overflow-hidden mb-16 shadow-2xl">
           <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
           <div className="absolute -bottom-12 right-12 flex flex-col md:flex-row items-center gap-8 text-white w-full px-4 md:px-0">
             <div className="relative group">
                <img src={editData.logo_url || user.logo_url} className="w-40 h-40 md:w-56 md:h-56 rounded-[3rem] border-8 border-white bg-white shadow-2xl object-cover" />
                {isEditing && (
                  <button onClick={() => fileInputRef.current?.click()} className="absolute inset-0 bg-black/50 rounded-[3rem] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-10 h-10 text-white" />
                  </button>
                )}
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
             </div>
             <div className="mb-14 text-center md:text-right flex-1">
               {isEditing ? (
                 <input 
                   value={editData.team_name} 
                   onChange={e => setEditData({...editData, team_name: e.target.value})}
                   className="text-4xl md:text-6xl font-black italic tracking-tighter bg-white/10 border-b-2 border-white/30 outline-none w-full max-w-lg px-2"
                 />
               ) : (
                 <h2 className="text-4xl md:text-6xl font-black italic tracking-tighter">نادي {user.team_name}</h2>
               )}
               <div className="flex items-center gap-2 justify-center md:justify-end mt-2">
                 <MapPin className="w-5 h-5 text-blue-400" />
                 {isEditing ? (
                    // Fix line 220: Completed the onChange handler and closed the input tag.
                    <input 
                      value={editData.region} 
                      onChange={e => setEditData({...editData, region: e.target.value})}
                      className="bg-white/10 border-b border-white/30 outline-none px-2 text-xl"
                    />
                 ) : (
                    <span className="text-xl font-bold">{user.region}</span>
                 )}
               </div>
             </div>
             <div className="mb-14 px-12 hidden md:block">
                {!isEditing ? (
                  <button onClick={startEditing} className="bg-white text-slate-900 px-8 py-4 rounded-2xl font-bold flex items-center gap-2 hover:bg-blue-50 transition-colors shadow-lg">
                    <Edit3 className="w-5 h-5" />
                    تعديل الملف
                  </button>
                ) : (
                  <div className="flex gap-4">
                    <button onClick={saveChanges} disabled={isSaving} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50 shadow-lg">
                      {isSaving ? <Loader2 className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />}
                      حفظ
                    </button>
                    <button onClick={() => setIsEditing(false)} className="bg-white/20 backdrop-blur-md text-white px-8 py-4 rounded-2xl font-bold hover:bg-white/30 transition-colors shadow-lg">
                      إلغاء
                    </button>
                  </div>
                )}
             </div>
           </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-8">
              <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
                <h3 className="text-2xl font-black mb-6 flex items-center gap-3">
                  <Info className="w-6 h-6 text-blue-600" />
                  عن النادي
                </h3>
                {isEditing ? (
                  <textarea 
                    value={editData.bio}
                    onChange={e => setEditData({...editData, bio: e.target.value})}
                    className="w-full h-40 bg-slate-50 rounded-2xl p-6 border-2 border-slate-100 outline-none focus:border-blue-500 transition-all text-lg"
                  />
                ) : (
                  <p className="text-slate-600 leading-relaxed text-lg">{user.bio || "لا يوجد وصف متوفر."}</p>
                )}
              </div>

              <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
                <h3 className="text-2xl font-black mb-6 flex items-center gap-3">
                  <ImageIcon className="w-6 h-6 text-blue-600" />
                  معرض الصور
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {user.gallery?.map((img, i) => (
                    <img key={i} src={img} className="w-full aspect-square object-cover rounded-2xl shadow-md" alt={`Gallery ${i}`} />
                  ))}
                  <button className="aspect-square rounded-2xl border-4 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all bg-slate-50">
                    <Plus className="w-8 h-8" />
                    <span className="font-bold">أضف صورة</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-[2.5rem] text-white shadow-2xl">
                <h3 className="text-2xl font-black mb-6 flex items-center gap-3">
                  <BarChart3 className="w-6 h-6" />
                  الإحصائيات
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl text-center border border-white/10">
                    <div className="text-3xl font-black">{user.wins || 0}</div>
                    <div className="text-sm opacity-80 font-bold">انتصارات</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl text-center border border-white/10">
                    <div className="text-3xl font-black">{user.losses || 0}</div>
                    <div className="text-sm opacity-80 font-bold">هزائم</div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
                <h3 className="text-2xl font-black mb-6 flex items-center gap-3">
                  <Users className="w-6 h-6 text-blue-600" />
                  معلومات الفريق
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                    <span className="text-slate-500 font-bold">المدرب</span>
                    <span className="font-black text-slate-900">{user.coach_name}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                    <span className="text-slate-500 font-bold">عدد اللاعبين</span>
                    <span className="font-black text-slate-900">{user.players_count || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                    <span className="text-slate-500 font-bold">البريد الإلكتروني</span>
                    <span className="font-black text-slate-900 text-sm truncate max-w-[150px]">{user.contact_email}</span>
                  </div>
                </div>
              </div>
            </div>
         </div>
      </div>
    );
  };

  const renderContent = () => {
    if (isLoading) return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        <p className="font-bold text-slate-400">جاري تحميل البطولة...</p>
      </div>
    );

    if (permissionError) return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4">
        <ShieldAlert className="w-16 h-16 text-red-500" />
        <h2 className="text-2xl font-black">خطأ في الأذونات</h2>
        <p className="text-slate-500 font-bold max-w-md">لا تملك الصلاحية للوصول إلى قاعدة البيانات. يرجى مراجعة إعدادات الأمان في Firebase.</p>
        <button onClick={() => fetchData()} className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 mt-4 hover:bg-blue-700">
          <RefreshCw className="w-5 h-5" />
          إعادة المحاولة
        </button>
      </div>
    );

    switch(currentView) {
      case 'profile': return <ProfileView />;
      case 'home':
      default:
        return (
          <div className="max-w-7xl mx-auto py-12 px-4 text-center">
            <h1 className="text-6xl font-black italic tracking-tighter mb-4">كأس النخبة الجزائرية</h1>
            <p className="text-xl text-slate-500 mb-8 font-bold">المنصة الرسمية لتنظيم وإدارة الدورات الرياضية</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
               <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 hover:scale-105 transition-transform cursor-pointer" onClick={() => setCurrentView('hub')}>
                  <LayoutGrid className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-2xl font-black mb-2">منصة الفرق</h3>
                  <p className="text-slate-500 font-bold">آخر الأخبار والمنشورات من الفرق المشاركة</p>
               </div>
               <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 hover:scale-105 transition-transform cursor-pointer" onClick={() => setCurrentView('matches')}>
                  <Calendar className="w-12 h-12 text-green-600 mx-auto mb-4" />
                  <h3 className="text-2xl font-black mb-2">المباريات</h3>
                  <p className="text-slate-500 font-bold">جدول المواجهات والنتائج المباشرة</p>
               </div>
               <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 hover:scale-105 transition-transform cursor-pointer" onClick={() => setCurrentView('live')}>
                  <Radio className="w-12 h-12 text-red-600 mx-auto mb-4" />
                  <h3 className="text-2xl font-black mb-2">البث المباشر</h3>
                  <p className="text-slate-500 font-bold">شاهد المباريات مباشرة عبر قنواتنا</p>
               </div>
            </div>
            <AdDisplay html={ads.home_hero_bottom} />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-right selection:bg-blue-600 selection:text-white" dir="rtl">
      <nav className="bg-white/80 backdrop-blur-xl border-b border-slate-100 sticky top-0 z-50 px-4 md:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setCurrentView('home')}>
               <div className="bg-blue-600 p-2 rounded-2xl group-hover:rotate-12 transition-transform">
                  <Trophy className="w-6 h-6 text-white" />
               </div>
               <span className="text-2xl font-black italic tracking-tighter">KORA<span className="text-blue-600">DZ</span></span>
            </div>
            
            <div className="hidden md:flex items-center gap-6">
               <button onClick={() => setCurrentView('hub')} className={`font-bold transition-colors ${currentView === 'hub' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-900'}`}>المنصة</button>
               <button onClick={() => setCurrentView('matches')} className={`font-bold transition-colors ${currentView === 'matches' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-900'}`}>المباريات</button>
               <button onClick={() => setCurrentView('live')} className={`font-bold transition-colors ${currentView === 'live' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-900'}`}>البث المباشر</button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-2xl">
               <Eye className="w-4 h-4 text-slate-400" />
               <span className="font-black text-slate-600">{visitorCount}</span>
            </div>

            {user ? (
               <div className="relative" ref={menuRef}>
                  <button 
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-3 bg-slate-50 p-1.5 pr-4 rounded-2xl border border-slate-200 hover:border-blue-200 transition-all"
                  >
                    <span className="font-bold text-slate-700 hidden sm:block">نادي {user.team_name}</span>
                    <img src={user.logo_url} className="w-10 h-10 rounded-xl object-cover border-2 border-white shadow-sm" alt="User logo" />
                  </button>
                  
                  {isUserMenuOpen && (
                    <div className="absolute left-0 mt-3 w-64 bg-white rounded-3xl shadow-2xl border border-slate-100 py-3 animate-in slide-in-from-top-2 duration-200">
                       <button onClick={() => { setCurrentView('profile'); setIsUserMenuOpen(false); }} className="w-full flex items-center gap-3 px-6 py-3 hover:bg-slate-50 transition-colors text-right">
                          <User className="w-5 h-5 text-blue-600" />
                          <span className="font-bold text-slate-700">الملف الشخصي</span>
                       </button>
                       <div className="h-px bg-slate-100 my-2 mx-6" />
                       <button onClick={handleLogout} className="w-full flex items-center gap-3 px-6 py-3 hover:bg-red-50 transition-colors text-red-500 text-right">
                          <LogOut className="w-5 h-5" />
                          <span className="font-bold">تسجيل الخروج</span>
                       </button>
                    </div>
                  )}
               </div>
            ) : (
               <div className="flex gap-2">
                 <button onClick={() => setCurrentView('login')} className="bg-slate-100 text-slate-900 px-6 py-2.5 rounded-2xl font-bold hover:bg-slate-200 transition-colors">دخول</button>
                 <button onClick={() => setCurrentView('register')} className="bg-blue-600 text-white px-6 py-2.5 rounded-2xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all">سجل فريقك</button>
               </div>
            )}
            
            <button onClick={handleSecretClick} className="w-8 h-8 opacity-0 pointer-events-auto" />
          </div>
        </div>
      </nav>

      <main className="min-h-[70vh]">
        {renderContent()}
      </main>

      <footer className="bg-slate-900 text-white py-16 mt-20">
         <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="col-span-1 md:col-span-2">
               <div className="flex items-center gap-2 mb-6">
                  <Trophy className="w-8 h-8 text-blue-500" />
                  <span className="text-3xl font-black italic tracking-tighter">KORA<span className="text-blue-500">DZ</span></span>
               </div>
               <p className="text-slate-400 font-bold leading-relaxed max-w-md">
                  المنصة الأولى في الجزائر لتنظيم البطولات الكروية وتغطيتها إعلامياً بأحدث التقنيات. نحن نؤمن بمستقبل كرة القدم في أحياءنا.
               </p>
            </div>
            <div>
               <h4 className="text-xl font-black mb-6">روابط سريعة</h4>
               <ul className="space-y-4 text-slate-400 font-bold">
                  <li className="hover:text-white cursor-pointer" onClick={() => setCurrentView('home')}>الرئيسية</li>
                  <li className="hover:text-white cursor-pointer" onClick={() => setCurrentView('hub')}>المنصة الاجتماعية</li>
                  <li className="hover:text-white cursor-pointer" onClick={() => setCurrentView('matches')}>المباريات</li>
               </ul>
            </div>
            <div>
               <h4 className="text-xl font-black mb-6">تواصل معنا</h4>
               <div className="flex gap-4">
                  <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center hover:bg-blue-600 transition-colors cursor-pointer">
                     <Share2 className="w-6 h-6" />
                  </div>
                  <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center hover:bg-blue-600 transition-colors cursor-pointer">
                     <MessageCircle className="w-6 h-6" />
                  </div>
               </div>
            </div>
         </div>
      </footer>
    </div>
  );
}
