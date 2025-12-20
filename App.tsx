
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
    const [isUploadingToGallery, setIsUploadingToGallery] = useState(false);
    const logoInputRef = useRef<HTMLInputElement>(null);
    const galleryInputRef = useRef<HTMLInputElement>(null);

    if (!user) return null;

    const startEditing = () => {
      setEditData({
        team_name: user.team_name,
        coach_name: user.coach_name,
        bio: user.bio || "فريق رياضي طموح.",
        region: user.region,
        municipality: user.municipality || user.region,
        players_count: user.players_count || 0,
        logo_url: user.logo_url
      });
      setIsEditing(true);
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        try {
          const base64 = await convertToBase64(e.target.files[0]);
          setEditData(prev => ({ ...prev, logo_url: base64 }));
        } catch (error) {
          alert("خطأ في معالجة الصورة.");
        }
      }
    };

    const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0] && user.id) {
        setIsUploadingToGallery(true);
        try {
          const base64 = await convertToBase64(e.target.files[0]);
          const res = await FirebaseService.addToGallery(user.id, base64);
          if (res.success) {
            setUser({
              ...user,
              gallery: [...(user.gallery || []), base64]
            });
          } else {
            alert("فشل رفع الصورة.");
          }
        } catch (error) {
          alert("خطأ في رفع الصورة.");
        } finally {
          setIsUploadingToGallery(false);
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
      <div className="max-w-7xl mx-auto py-12 px-4 text-right animate-in fade-in duration-500 pb-32">
         <AdDisplay html={ads.profile_top} />
         
         <div className="bg-slate-900 h-64 md:h-[450px] rounded-[3rem] relative overflow-hidden mb-16 shadow-2xl">
           <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent"></div>
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
           
           <div className="absolute bottom-10 right-10 left-10 flex flex-col md:flex-row items-end gap-8 text-white">
             <div className="relative group shrink-0">
                <div className="w-40 h-40 md:w-56 md:h-56 rounded-[3rem] border-8 border-white bg-white shadow-2xl overflow-hidden">
                  <img 
                    src={isEditing ? (editData.logo_url || user.logo_url) : user.logo_url} 
                    className="w-full h-full object-cover" 
                    alt="Logo"
                  />
                </div>
                {isEditing && (
                  <button 
                    onClick={() => logoInputRef.current?.click()} 
                    className="absolute inset-0 bg-black/60 rounded-[3rem] flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm"
                  >
                    <Camera className="w-12 h-12 text-white mb-2" />
                    <span className="text-xs font-black">تغيير الشعار</span>
                  </button>
                )}
                <input type="file" ref={logoInputRef} onChange={handleLogoUpload} className="hidden" accept="image/*" />
             </div>

             <div className="flex-1 mb-4">
               <div className="flex items-center gap-3 mb-2 justify-end">
                 <div className="px-3 py-1 bg-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest">نادي رسمي</div>
                 {isEditing ? (
                   <input 
                     value={editData.team_name} 
                     onChange={e => setEditData({...editData, team_name: e.target.value})}
                     className="text-4xl md:text-6xl font-black italic tracking-tighter bg-white/10 border-b-4 border-white/30 outline-none w-full max-w-lg px-2 text-right focus:border-blue-500 transition-colors"
                   />
                 ) : (
                   <h2 className="text-4xl md:text-7xl font-black italic tracking-tighter leading-tight drop-shadow-lg">نادي {user.team_name}</h2>
                 )}
               </div>
               
               <div className="flex items-center gap-4 justify-end mt-4">
                 <div className="flex items-center gap-2 text-blue-300 font-bold bg-white/5 px-4 py-2 rounded-2xl backdrop-blur-md border border-white/10">
                   <MapPin className="w-5 h-5" />
                   {isEditing ? (
                      <input 
                        value={editData.region} 
                        onChange={e => setEditData({...editData, region: e.target.value})}
                        className="bg-transparent border-none outline-none text-white font-bold w-24 text-right"
                      />
                   ) : (
                      <span>{user.municipality || user.region}</span>
                   )}
                 </div>
                 <div className="flex items-center gap-2 text-emerald-400 font-bold bg-white/5 px-4 py-2 rounded-2xl backdrop-blur-md border border-white/10">
                   <Users className="w-5 h-5" />
                   <span>{user.players_count || 0} لاعب</span>
                 </div>
               </div>
             </div>

             <div className="hidden md:flex gap-4 mb-4">
                {!isEditing ? (
                  <button 
                    onClick={startEditing} 
                    className="bg-white text-slate-900 px-10 py-5 rounded-[2rem] font-black text-lg flex items-center gap-3 hover:bg-blue-50 transition-all shadow-xl active:scale-95"
                  >
                    <Edit3 className="w-6 h-6 text-blue-600" />
                    تعديل البيانات
                  </button>
                ) : (
                  <>
                    <button 
                      onClick={saveChanges} 
                      disabled={isSaving} 
                      className="bg-emerald-500 text-white px-10 py-5 rounded-[2rem] font-black text-lg flex items-center gap-3 hover:bg-emerald-600 disabled:opacity-50 shadow-xl active:scale-95 transition-all"
                    >
                      {isSaving ? <Loader2 className="animate-spin w-6 h-6" /> : <Save className="w-6 h-6" />}
                      حفظ التغييرات
                    </button>
                    <button 
                      onClick={() => setIsEditing(false)} 
                      className="bg-white/10 backdrop-blur-md text-white px-10 py-5 rounded-[2rem] font-black text-lg hover:bg-white/20 transition-all active:scale-95"
                    >
                      إلغاء
                    </button>
                  </>
                )}
             </div>
           </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-10">
              {/* About Section */}
              <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
                <h3 className="text-2xl font-black mb-8 flex items-center gap-3 relative z-10 text-slate-900">
                  <Info className="w-7 h-7 text-blue-600" />
                  نبذة عن النادي
                </h3>
                {isEditing ? (
                  <textarea 
                    value={editData.bio}
                    onChange={e => setEditData({...editData, bio: e.target.value})}
                    placeholder="اكتب شيئاً عن تاريخ النادي وأهدافه..."
                    className="w-full h-48 bg-slate-50 rounded-3xl p-6 border-2 border-slate-100 outline-none focus:border-blue-500 transition-all text-lg font-bold text-slate-700 leading-relaxed text-right"
                  />
                ) : (
                  <p className="text-slate-600 leading-relaxed text-xl font-medium relative z-10 whitespace-pre-wrap">{user.bio || "لا يوجد وصف متوفر للنادي حالياً."}</p>
                )}
              </div>

              {/* Gallery Section */}
              <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100">
                <div className="flex items-center justify-between mb-10">
                  <button 
                    onClick={() => galleryInputRef.current?.click()}
                    disabled={isUploadingToGallery}
                    className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                  >
                    {isUploadingToGallery ? <Loader2 className="animate-spin w-5 h-5" /> : <Upload className="w-5 h-5" />}
                    تحميل صور
                  </button>
                  <h3 className="text-2xl font-black flex items-center gap-3 text-slate-900">
                    <ImageIcon className="w-7 h-7 text-blue-600" />
                    معرض صور النادي
                  </h3>
                </div>
                
                <input type="file" ref={galleryInputRef} onChange={handleGalleryUpload} className="hidden" accept="image/*" />

                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {user.gallery && user.gallery.length > 0 ? (
                    user.gallery.map((img, i) => (
                      <div key={i} className="group relative aspect-square overflow-hidden rounded-3xl shadow-lg border-4 border-slate-50 cursor-pointer">
                        <img src={img} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={`Gallery ${i}`} />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                           <Eye className="text-white w-10 h-10" />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full py-20 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200 text-center">
                       <ImageIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                       <p className="text-slate-400 font-black italic">لا توجد صور في المعرض حالياً.</p>
                       <p className="text-slate-300 text-sm font-bold">ابدأ بمشاركة لحظات ناديك مع الجميع!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-10">
              {/* Stats & Management Card */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-600"></div>
                <h3 className="text-2xl font-black mb-8 flex items-center gap-3 relative z-10">
                  <TrendingUp className="w-7 h-7 text-blue-400" />
                  إحصائيات الموسم
                </h3>
                
                <div className="grid grid-cols-2 gap-6 relative z-10">
                  <div className="bg-white/5 backdrop-blur-md p-6 rounded-3xl text-center border border-white/10 group-hover:bg-white/10 transition-colors">
                    <div className="text-4xl font-black text-emerald-400 mb-1">{user.wins || 0}</div>
                    <div className="text-[10px] opacity-60 font-black uppercase tracking-widest">فوز</div>
                  </div>
                  <div className="bg-white/5 backdrop-blur-md p-6 rounded-3xl text-center border border-white/10 group-hover:bg-white/10 transition-colors">
                    <div className="text-4xl font-black text-rose-400 mb-1">{user.losses || 0}</div>
                    <div className="text-[10px] opacity-60 font-black uppercase tracking-widest">هزائم</div>
                  </div>
                  <div className="bg-white/5 backdrop-blur-md p-8 rounded-3xl text-center border border-white/10 group-hover:bg-white/10 transition-colors col-span-2">
                    <div className="flex items-center justify-between">
                       <div className="text-right">
                         <div className="text-3xl font-black text-blue-400">{user.players_count || 0}</div>
                         <div className="text-[10px] opacity-60 font-black uppercase tracking-widest">لاعب مسجل</div>
                       </div>
                       <Users className="w-10 h-10 text-white/20" />
                    </div>
                    {isEditing && (
                      <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between gap-4">
                        <span className="text-xs font-bold opacity-60">تعديل العدد:</span>
                        <input 
                          type="number"
                          value={editData.players_count} 
                          onChange={e => setEditData({...editData, players_count: Number(e.target.value)})}
                          className="bg-white/10 border border-white/20 rounded-xl px-3 py-1 w-20 text-center font-black outline-none focus:border-blue-500"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Management Info */}
              <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100">
                <h3 className="text-2xl font-black mb-8 flex items-center gap-3 text-slate-900">
                  <Shield className="w-7 h-7 text-blue-600" />
                  إدارة النادي
                </h3>
                <div className="space-y-6">
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                    <div className="text-[10px] text-slate-400 font-black mb-1 uppercase tracking-widest">المدرب الرئيسي</div>
                    {isEditing ? (
                      <input 
                        value={editData.coach_name} 
                        onChange={e => setEditData({...editData, coach_name: e.target.value})}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 font-black text-slate-800 outline-none focus:border-blue-500"
                      />
                    ) : (
                      <div className="text-xl font-black text-slate-900 italic">الكابتن {user.coach_name}</div>
                    )}
                  </div>
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                    <div className="text-[10px] text-slate-400 font-black mb-1 uppercase tracking-widest">الولاية / المنطقة</div>
                    <div className="text-lg font-bold text-slate-700">{user.region}</div>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 overflow-hidden">
                    <div className="text-[10px] text-slate-400 font-black mb-1 uppercase tracking-widest">البريد الإلكتروني</div>
                    <div className="text-sm font-bold text-blue-600 truncate">{user.contact_email}</div>
                  </div>
                </div>
              </div>
              
              {/* Mobile Edit Button */}
              <div className="md:hidden">
                 {!isEditing ? (
                    <button onClick={startEditing} className="w-full py-6 bg-blue-600 text-white rounded-[2rem] font-black text-xl shadow-2xl active:scale-95">تعديل البروفايل</button>
                 ) : (
                    <div className="grid grid-cols-2 gap-4">
                       <button onClick={saveChanges} disabled={isSaving} className="py-6 bg-emerald-500 text-white rounded-[2rem] font-black text-lg shadow-xl">حفظ</button>
                       <button onClick={() => setIsEditing(false)} className="py-6 bg-slate-200 text-slate-600 rounded-[2rem] font-black text-lg shadow-xl">إلغاء</button>
                    </div>
                 )}
              </div>
            </div>
         </div>
      </div>
    );
  };

  const HubView = () => {
    const [newPostContent, setNewPostContent] = useState("");
    const [isPosting, setIsPosting] = useState(false);

    const handleCreatePost = async () => {
      if (!user || !newPostContent.trim()) return;
      setIsPosting(true);
      try {
        await FirebaseService.createPost({
          teamId: user.id!,
          teamName: user.team_name,
          teamLogo: user.logo_url!,
          content: newPostContent,
          imageUrl: ""
        });
        setNewPostContent("");
        fetchData(true);
      } catch (e) {
        alert("فشل نشر المنشور.");
      } finally {
        setIsPosting(false);
      }
    };

    return (
      <div className="max-w-4xl mx-auto py-12 px-4 pb-24 text-right animate-in fade-in duration-500">
         <AdDisplay html={ads.hub_top} />
         <div className="text-center mb-16">
            <h2 className="text-5xl font-black italic mb-4 text-slate-900">ملتقى الفرق</h2>
            <p className="text-slate-400 font-bold">المساحة الرسمية لتفاعل الأندية والمنشورات الحية</p>
         </div>

         {user && (
           <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 p-8 mb-12 animate-in slide-in-from-top duration-500">
             <div className="flex items-center gap-4 mb-6 justify-end">
                <span className="font-black text-slate-900">{user.team_name}</span>
                <img src={user.logo_url} className="w-10 h-10 rounded-xl object-cover" />
             </div>
             <textarea 
               value={newPostContent}
               onChange={e => setNewPostContent(e.target.value)}
               placeholder="ماذا يدور في كواليس فريقك اليوم؟" 
               className="w-full h-32 p-5 bg-slate-50 border border-slate-100 rounded-3xl outline-none font-bold text-right text-slate-800"
             />
             <div className="flex justify-start mt-4">
                <button 
                  onClick={handleCreatePost}
                  disabled={isPosting || !newPostContent.trim()}
                  className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                >
                  {isPosting ? <Loader2 className="animate-spin" /> : <Send className="w-5 h-5" />} نشر الآن
                </button>
             </div>
           </div>
         )}
         
         <div className="space-y-10">
           {posts.length === 0 ? (
             <div className="h-64 flex flex-col items-center justify-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
               <MessageSquare className="w-12 h-12 text-slate-300 mb-4" />
               <p className="text-slate-400 font-black italic">لا توجد منشورات حالياً.. كن أول من ينشر!</p>
               <button onClick={() => fetchData(true)} className="mt-4 text-blue-500 font-bold flex items-center gap-2 hover:underline"><RefreshCw className="w-4 h-4" /> تحديث الصفحة</button>
             </div>
           ) : (
             posts.map(post => (
               <div key={post.id} className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 p-10 text-right animate-in slide-in-from-bottom duration-500 hover:shadow-2xl transition-all">
                  <div className="flex items-center gap-5 mb-8 justify-end">
                    <div className="text-right">
                       <h4 className="font-black text-xl text-slate-900">{post.teamName}</h4>
                       <p className="text-[10px] text-slate-400 font-black">
                         {post.created_at ? `نشر في ${new Date(post.created_at.toDate()).toLocaleDateString('ar-DZ')}` : 'نشط الآن'}
                       </p>
                    </div>
                    <img src={post.teamLogo} className="w-16 h-16 rounded-3xl object-cover shadow-lg border-2 border-slate-50" />
                  </div>
                  <p className="text-slate-700 text-xl mb-6 leading-relaxed whitespace-pre-wrap font-medium">{post.content}</p>
                  {post.imageUrl && <img src={post.imageUrl} className="w-full rounded-[2rem] shadow-sm object-cover max-h-[600px] border border-slate-50" />}
               </div>
             ))
           )}
         </div>
         <AdDisplay html={ads.hub_bottom} />
    </div>
  );

  const MatchCenterView = () => (
    <div className="max-w-5xl mx-auto py-12 px-4 text-right animate-in fade-in duration-500">
      <AdDisplay html={ads.matches_top} />
      <div className="text-center mb-16">
        <h2 className="text-5xl font-black italic mb-4 text-slate-900">مركز المباريات</h2>
        <p className="text-slate-400 font-bold">النتائج، المواعيد، وحالة المباريات المباشرة</p>
      </div>

      <div className="space-y-8">
        {matches.length === 0 ? (
          <div className="bg-slate-50 p-16 rounded-[3rem] text-center border-2 border-dashed border-slate-200">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-400 font-black italic">لا توجد مباريات مبرمجة حالياً.</p>
          </div>
        ) : (
          matches.map(match => (
            <div key={match.id} className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 p-8 flex flex-col md:flex-row items-center justify-between gap-8 transition-all hover:shadow-2xl">
              <div className="flex items-center gap-6 flex-1 justify-end">
                <span className="font-black text-xl text-slate-800">{match.homeTeamName}</span>
                <img src={match.homeTeamLogo} className="w-20 h-20 rounded-2xl object-cover shadow-md border-2 border-slate-50" />
              </div>
              
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-4 bg-slate-900 text-white px-8 py-4 rounded-[2rem] shadow-lg">
                  <span className="text-4xl font-black">{match.scoreHome}</span>
                  <span className="text-slate-500 font-black text-2xl">-</span>
                  <span className="text-4xl font-black">{match.scoreAway}</span>
                </div>
                <div className={`mt-2 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                  match.status === 'live' ? 'bg-red-100 text-red-600 animate-pulse' : 
                  match.status === 'finished' ? 'bg-slate-100 text-slate-500' : 
                  'bg-blue-100 text-blue-600'
                }`}>
                  {match.status === 'live' ? 'مباشر الآن' : match.status === 'finished' ? 'انتهت' : 'قادمة'}
                </div>
                <div className="text-[11px] font-bold text-slate-400 mt-1 flex items-center gap-1">
                  {match.date} | {match.time} <Clock className="w-3 h-3" />
                </div>
              </div>

              <div className="flex items-center gap-6 flex-1 justify-start">
                <img src={match.awayTeamLogo} className="w-20 h-20 rounded-2xl object-cover shadow-md border-2 border-slate-50" />
                <span className="font-black text-xl text-slate-800">{match.awayTeamName}</span>
              </div>
            </div>
          ))
        )}
      </div>
      <AdDisplay html={ads.matches_bottom} className="mt-12" />
    </div>
  );

  const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState<'stats' | 'teams' | 'matches' | 'posts' | 'channels' | 'ads'>('stats');
    const [isSaving, setIsSaving] = useState(false);
    const [isSeeding, setIsSeeding] = useState(false);
    const [tempAds, setTempAds] = useState<AdConfig>({...ads});
    const [editingMatch, setEditingMatch] = useState<Match | null>(null);

    const [bulkAdCode, setBulkAdCode] = useState("");
    const [selectedSlots, setSelectedSlots] = useState<string[]>([]);

    const adSlots = [
      { id: 'under_header', label: 'تحت الهيدر (العام)' },
      { id: 'home_hero_bottom', label: 'أسفل الهيرو (الرئيسية)' },
      { id: 'after_draw', label: 'بعد القرعة (الرئيسية)' },
      { id: 'hub_top', label: 'أعلى الملتقى' },
      { id: 'hub_bottom', label: 'أسفل الملتقى' },
      { id: 'matches_top', label: 'أعلى المباريات' },
      { id: 'matches_bottom', label: 'أسفل المباريات' },
      { id: 'live_top', label: 'أعلى البث المباشر' },
      { id: 'profile_top', label: 'أعلى بروفايل النادي' },
    ];

    const seedData = async () => {
      if (!confirm("هل أنت متأكد؟ سيتم إنشاء 6 أندية جزائرية ومنشوراتهم الآن.")) return;
      setIsSeeding(true);
      
      const seedTeams = [
        { name: "مولودية الجزائر", coach: "باتريس بوميل", email: "mca@kora.dz", region: "الجزائر العاصمة", color: "047857" },
        { name: "شبيبة القبائل", coach: "عبد الحق بن شيخة", email: "jsk@kora.dz", region: "تيزي وزو", color: "ca8a04" },
        { name: "وفاق سطيف", coach: "رضا بن دريس", email: "ess@kora.dz", region: "سطيف", color: "1e293b" },
        { name: "شباب بلوزداد", coach: "كورينتين مارتينز", email: "crb@kora.dz", region: "الجزائر العاصمة", color: "be123c" },
        { name: "اتحاد الجزائر", coach: "نبيل معلول", email: "usma@kora.dz", region: "الجزائر العاصمة", color: "991b1b" },
        { name: "مولودية وهران", coach: "إيريك شيل", email: "mco@kora.dz", region: "وهران", color: "dc2626" }
      ];

      const postsTexts = [
        "نحن هنا للمنافسة على اللقب! الموسم الجديد يبدو واعداً جداً 🏆",
        "تدريبات شاقة اليوم تحضيراً للمباراة القادمة. الروح المعنوية في القمة 💪",
        "شكراً لكل الجماهير على الدعم المتواصل. نحن فريق واحد 🟢🔴",
        "مستعدون لرفع التحدي في الملتقى. من يتحدى النادي اليوم؟ ⚽",
        "عمل كبير ينتظرنا، لكننا نملك أفضل اللاعبين في البطولة 🌟",
        "تاريخ النادي يدفعنا دائماً للأمام. لن نرضى بغير الفوز 🚩"
      ];

      try {
        for (let i = 0; i < seedTeams.length; i++) {
          const t = seedTeams[i];
          const res: any = await FirebaseService.registerTeam({
            team_name: t.name,
            coach_name: t.coach,
            contact_email: t.email,
            password: "password123",
            region: t.region
          });

          if (res && res.id) {
            const logoUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(t.name)}&background=${t.color}&color=fff&size=200&bold=true`;
            await FirebaseService.updateTeamProfile(res.id, { 
              logo_url: logoUrl,
              wins: Math.floor(Math.random() * 10),
              losses: Math.floor(Math.random() * 5),
              players_count: 22 + Math.floor(Math.random() * 5),
              bio: `نادي ${t.name} العريق من مدينة ${t.region}. نسعى دائماً لتحقيق الأفضل في هذه البطولة.`
            });

            await FirebaseService.createPost({
              teamId: res.id,
              teamName: t.name,
              teamLogo: logoUrl,
              content: postsTexts[i],
              imageUrl: ""
            });
          }
        }
        alert("تم توليد البيانات بنجاح!");
        fetchData(true);
      } catch (e) {
        alert("حدث خطأ أثناء التوليد.");
      } finally {
        setIsSeeding(false);
      }
    };

    const applyBulkAd = () => {
      if (!bulkAdCode.trim()) { alert("يرجى إدخال كود الإعلان أولاً."); return; }
      if (selectedSlots.length === 0) { alert("يرجى تحديد مكان واحد على الأقل."); return; }
      const newTempAds = { ...tempAds };
      selectedSlots.forEach(slotId => { (newTempAds as any)[slotId] = bulkAdCode; });
      setTempAds(newTempAds);
      setBulkAdCode("");
      setSelectedSlots([]);
      alert("تم التطبيق مؤقتاً. اضغط حفظ بالأسفل.");
    };

    const toggleSlotSelection = (id: string) => {
      setSelectedSlots(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    return (
      <div className="max-w-7xl mx-auto py-10 px-6 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12 bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 text-right">
          <div><h2 className="text-3xl font-black flex items-center gap-3 justify-end text-slate-900">الإدارة المركزية <Lock className="text-blue-600" /></h2><p className="text-slate-400 font-bold">تحكم كامل في إحصائيات، مباريات وإعلانات البطولة.</p></div>
          <div className="flex gap-4">
             <div className="bg-blue-600 text-white px-8 py-3 rounded-2xl flex items-center gap-3 shadow-lg"><BarChart3 className="w-5 h-5" /><span className="font-black text-xl">{visitorCount}</span><p className="text-[10px] opacity-70">زائر</p></div>
          </div>
        </div>

        <div className="flex gap-2 mb-8 bg-slate-100 p-1.5 rounded-2xl w-max mr-0 ml-auto overflow-x-auto max-w-full custom-scrollbar">
          {['stats', 'teams', 'matches', 'posts', 'channels', 'ads'].map((tab: any) => (
            <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === tab ? 'bg-white text-blue-600 shadow-md' : 'text-slate-500'}`}>
              {tab === 'stats' ? 'الإحصائيات' : tab === 'teams' ? 'الأندية' : tab === 'matches' ? 'المباريات' : tab === 'posts' ? 'المنشورات' : tab === 'channels' ? 'البث' : 'الإعلانات'}
            </button>
          ))}
        </div>

        {activeTab === 'stats' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
               <div className="bg-white p-8 rounded-[2rem] shadow-lg border-b-4 border-blue-500 text-center"><p className="text-4xl font-black text-slate-800">{visitorCount}</p><p className="text-xs text-slate-400 font-black mt-2">إجمالي الزيارات</p></div>
               <div className="bg-white p-8 rounded-[2rem] shadow-lg border-b-4 border-emerald-500 text-center"><p className="text-4xl font-black text-slate-800">{allTeams.length}</p><p className="text-xs text-slate-400 font-black mt-2">الأندية المسجلة</p></div>
               <div className="bg-white p-8 rounded-[2rem] shadow-lg border-b-4 border-amber-500 text-center"><p className="text-4xl font-black text-slate-800">{posts.length}</p><p className="text-xs text-slate-400 font-black mt-2">منشورات الملتقى</p></div>
               <div className="bg-white p-8 rounded-[2rem] shadow-lg border-b-4 border-rose-500 text-center"><p className="text-4xl font-black text-slate-800">{matches.length}</p><p className="text-xs text-slate-400 font-black mt-2">المباريات المبرمجة</p></div>
            </div>
            <div className="bg-amber-50 p-10 rounded-[2.5rem] border-2 border-dashed border-amber-200 text-center">
              <Database className="w-12 h-12 text-amber-500 mx-auto mb-4" />
              <h3 className="text-xl font-black text-amber-900 mb-2">توليد بيانات افتراضية</h3>
              <p className="text-amber-700 font-bold text-sm mb-8 mx-auto leading-relaxed">سيتم إنشاء 6 أندية ومنشوراتها ترحيبية فوراً.</p>
              <button onClick={seedData} disabled={isSeeding} className="bg-amber-500 text-white px-10 py-4 rounded-2xl font-black shadow-xl flex items-center gap-3 mx-auto transition-all active:scale-95">
                {isSeeding ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Plus className="w-6 h-6" /> توليد الأندية والمنشورات</>}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'matches' && (
          <div className="space-y-8 text-right">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-50">
               <h3 className="text-xl font-black mb-6 flex items-center gap-2 justify-end text-slate-900">جدولة مباراة <Calendar className="text-blue-600" /></h3>
               <form onSubmit={async (e) => {
                 e.preventDefault(); setIsSaving(true);
                 const t = e.target as any;
                 const matchData: any = {
                   homeTeamId: t[0].value, homeTeamName: allTeams.find(x => x.id === t[0].value)?.team_name || "",
                   homeTeamLogo: allTeams.find(x => x.id === t[0].value)?.logo_url || "",
                   awayTeamId: t[1].value, awayTeamName: allTeams.find(x => x.id === t[1].value)?.team_name || "",
                   awayTeamLogo: allTeams.find(x => x.id === t[1].value)?.logo_url || "",
                   date: t[2].value, time: t[3].value, scoreHome: Number(t[4].value), scoreAway: Number(t[5].value),
                   status: t[6].value, tournament_round: t[7].value
                 };
                 await FirebaseService.createMatch(matchData);
                 fetchData(true); setIsSaving(false); (e.target as any).reset();
               }} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                 <select required className="p-4 bg-slate-50 rounded-xl font-bold text-sm text-right outline-none">
                   <option value="">الفريق الأول</option>
                   {allTeams.map(t => <option key={t.id} value={t.id}>{t.team_name}</option>)}
                 </select>
                 <select required className="p-4 bg-slate-50 rounded-xl font-bold text-sm text-right outline-none">
                   <option value="">الفريق الثاني</option>
                   {allTeams.map(t => <option key={t.id} value={t.id}>{t.team_name}</option>)}
                 </select>
                 <input type="date" required className="p-4 bg-slate-50 rounded-xl font-bold text-sm text-right outline-none" />
                 <input type="time" required className="p-4 bg-slate-50 rounded-xl font-bold text-sm text-right outline-none" />
                 <input type="number" placeholder="أهداف الأول" className="p-4 bg-slate-50 rounded-xl font-bold text-sm text-right outline-none" />
                 <input type="number" placeholder="أهداف الثاني" className="p-4 bg-slate-50 rounded-xl font-bold text-sm text-right outline-none" />
                 <select className="p-4 bg-slate-50 rounded-xl font-bold text-sm text-right outline-none">
                   <option value="upcoming">قادمة</option>
                   <option value="live">مباشر</option>
                   <option value="finished">انتهت</option>
                 </select>
                 <input placeholder="الدور" className="p-4 bg-slate-50 rounded-xl font-bold text-sm text-right outline-none" />
                 <button className="md:col-span-4 py-4 bg-blue-600 text-white rounded-xl font-black shadow-lg">حفظ المباراة</button>
               </form>
            </div>
          </div>
        )}
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

    if (currentView === 'admin' && isAdmin) return <AdminDashboard />;

    switch(currentView) {
      case 'profile': return <ProfileView />;
      case 'hub': return <HubView />;
      case 'matches': return <MatchCenterView />;
      case 'live': return (
        <div className="max-w-7xl mx-auto py-12 px-6 pb-24 text-right">
          <AdDisplay html={ads.live_top} />
          <h2 className="text-4xl font-black flex items-center gap-4 justify-end italic mb-12 text-slate-900">قنوات البث المباشر <Radio className="text-red-600 animate-pulse" /></h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {liveChannels.map(ch => (
              <div key={ch.id} className="bg-white rounded-[2.5rem] p-6 shadow-xl border border-slate-100">
                <div className="h-56 w-full rounded-[2rem] overflow-hidden mb-6 relative"><img src={ch.thumbnail_url} className="w-full h-full object-cover" alt="Channel" /></div>
                <h4 className="font-black text-xl mb-4 truncate">{ch.name}</h4>
                <button onClick={() => window.open(ch.stream_url, '_blank')} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black shadow-lg transition-all active:scale-95">شاهد الآن</button>
              </div>
            ))}
          </div>
        </div>
      );
      case 'login': return <LoginView />;
      case 'register': return <RegisterView />;
      case 'admin-login': return <AdminLoginView />;
      case 'home':
      default:
        return (
          <div className="max-w-7xl mx-auto py-12 px-4 text-center">
            <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter mb-4 text-slate-900">كأس النخبة <span className="text-blue-600">DZ</span></h1>
            <p className="text-xl text-slate-500 mb-12 font-bold max-w-2xl mx-auto">المنصة الرسمية لتنظيم وإدارة الدورات الرياضية في الجزائر. النتائج المباشرة، ملتقى الفرق، والبث الحي في مكان واحد.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
               <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 hover:scale-105 transition-transform cursor-pointer group" onClick={() => setCurrentView('hub')}>
                  <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-600 transition-colors">
                    <LayoutGrid className="w-10 h-10 text-blue-600 group-hover:text-white" />
                  </div>
                  <h3 className="text-2xl font-black mb-3">منصة الفرق</h3>
                  <p className="text-slate-400 font-bold text-sm">تفاعل مع المنشورات والنتائج الحصرية للفرق المشاركة</p>
               </div>
               <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 hover:scale-105 transition-transform cursor-pointer group" onClick={() => setCurrentView('matches')}>
                  <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:bg-emerald-600 transition-colors">
                    <Calendar className="w-10 h-10 text-emerald-600 group-hover:text-white" />
                  </div>
                  <h3 className="text-2xl font-black mb-3">المباريات</h3>
                  <p className="text-slate-400 font-bold text-sm">جدول المواجهات المحدث لحظة بلحظة مع النتائج النهائية</p>
               </div>
               <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 hover:scale-105 transition-transform cursor-pointer group" onClick={() => setCurrentView('live')}>
                  <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:bg-rose-600 transition-colors">
                    <Radio className="w-10 h-10 text-rose-600 group-hover:text-white" />
                  </div>
                  <h3 className="text-2xl font-black mb-3">البث المباشر</h3>
                  <p className="text-slate-400 font-bold text-sm">شاهد المباريات مباشرة عبر قنوات البث الحصرية</p>
               </div>
            </div>
            <AdDisplay html={ads.home_hero_bottom} />
            
            <section className="py-20 text-right">
               <h2 className="text-4xl font-black mb-10 text-slate-900 flex items-center gap-4 justify-end">النخبة المشاركة <Users className="text-blue-600" /></h2>
               <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
                  {allTeams.map(team => (
                    <div key={team.id} className="text-center group cursor-pointer" onClick={() => { setUser(team); setCurrentView('profile'); }}>
                       <div className="w-32 h-32 md:w-40 md:h-40 bg-white rounded-[2.5rem] p-2 shadow-lg border-2 border-slate-50 group-hover:scale-110 transition-all mb-4 overflow-hidden">
                          <img src={team.logo_url} className="w-full h-full object-cover rounded-[2rem]" alt={team.team_name} />
                       </div>
                       <p className="font-black text-slate-800 text-sm group-hover:text-blue-600 transition-colors">{team.team_name}</p>
                    </div>
                  ))}
               </div>
            </section>
          </div>
        );
    }
  };

  const LoginView = () => (
    <div className="max-w-md mx-auto py-24 px-6 text-center animate-in zoom-in duration-500">
       <div className="bg-white rounded-[3.5rem] p-12 shadow-2xl border border-slate-100">
          <div className="bg-blue-600 w-20 h-20 rounded-3xl mx-auto mb-8 flex items-center justify-center shadow-xl"><Trophy className="w-10 h-10 text-white" /></div>
          <h3 className="text-3xl font-black mb-10 italic text-slate-900">دخول النادي</h3>
          <form onSubmit={async (e) => { e.preventDefault(); const t = e.target as any; const { data, error } = await FirebaseService.loginTeam(t[0].value, t[1].value); if (error) alert(error); else { setUser(data); localStorage.setItem(SESSION_KEY, data.id!); setCurrentView('profile'); fetchData(true); } }} className="space-y-5">
            <input type="email" placeholder="البريد الإلكتروني" className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-right focus:border-blue-500 transition-all" />
            <input type="password" placeholder="كلمة المرور" className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-right focus:border-blue-500 transition-all" />
            <button type="submit" className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl hover:bg-blue-700 transition-all active:scale-95">تأكيد الدخول</button>
          </form>
       </div>
    </div>
  );

  const RegisterView = () => (
    <div className="max-w-md mx-auto py-24 px-6 text-center animate-in zoom-in duration-500">
       <div className="bg-white rounded-[3.5rem] p-12 shadow-2xl border border-slate-100">
          <h3 className="text-3xl font-black mb-10 italic text-slate-900">تسجيل فريق جديد</h3>
          <form onSubmit={async (e) => { e.preventDefault(); const t = e.target as any; const res = await FirebaseService.registerTeam({ team_name: t[0].value, coach_name: t[1].value, contact_email: t[2].value, password: t[3].value, region: t[4].value }); if (res.error) alert(res.error); else { alert('تم التسجيل بنجاح!'); setCurrentView('login'); fetchData(true); } }} className="space-y-4">
            <input placeholder="اسم الفريق" className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-right outline-none focus:border-blue-500 transition-all" />
            <input placeholder="اسم المدرب" className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-right outline-none focus:border-blue-500 transition-all" />
            <input type="email" placeholder="البريد الإلكتروني" className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-right outline-none focus:border-blue-500 transition-all" />
            <input type="password" placeholder="كلمة المرور" className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-right outline-none focus:border-blue-500 transition-all" />
            <input placeholder="الولاية / المنطقة" className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-right outline-none focus:border-blue-500 transition-all" />
            <button type="submit" className="w-full py-5 bg-slate-900 text-white font-black rounded-2xl shadow-xl hover:bg-black transition-all active:scale-95">إرسال طلب الانضمام</button>
          </form>
       </div>
    </div>
  );

  const AdminLoginView = () => (
    <div className="max-w-md mx-auto py-24 px-6 text-center">
      <div className="bg-slate-900 rounded-[3.5rem] p-12 shadow-2xl border border-slate-800 text-white animate-in zoom-in duration-500">
        <div className="bg-blue-600 w-20 h-20 rounded-3xl mx-auto mb-8 flex items-center justify-center rotate-3 shadow-xl"><ShieldAlert className="w-10 h-10" /></div>
        <h3 className="text-3xl font-black mb-10 italic">بوابة المشرف السرية</h3>
        <form onSubmit={async (e) => { e.preventDefault(); const t = e.target as any; if (t[0].value === ADMIN_CREDS.email && t[1].value === ADMIN_CREDS.pass) { setIsAdmin(true); localStorage.setItem(ADMIN_KEY, 'true'); setCurrentView('admin'); fetchData(true); } else alert("خطأ في البيانات السرية."); }} className="space-y-5">
          <input type="email" placeholder="البريد السري" className="w-full p-5 bg-slate-800 border border-slate-700 rounded-2xl outline-none font-bold text-right" />
          <input type="password" placeholder="كلمة المرور" className="w-full p-5 bg-slate-800 border border-slate-700 rounded-2xl outline-none font-bold text-right" />
          <button type="submit" className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl hover:bg-blue-700 transition-all">دخول لوحة التحكم</button>
        </form>
        <button onClick={() => { setCurrentView('home'); window.location.hash = ''; }} className="mt-8 text-slate-500 font-bold hover:text-white transition-colors">إلغاء</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-right selection:bg-blue-600 selection:text-white" dir="rtl">
      <nav className="bg-white/80 backdrop-blur-xl border-b border-slate-100 sticky top-0 z-50 px-4 md:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setCurrentView('home')}>
               <div className="bg-blue-600 p-2 rounded-2xl group-hover:rotate-12 transition-transform shadow-lg shadow-blue-200">
                  <Trophy className="w-6 h-6 text-white" />
               </div>
               <span className="text-2xl font-black italic tracking-tighter">KORA<span className="text-blue-600">DZ</span></span>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
               <button onClick={() => setCurrentView('hub')} className={`font-black text-xs uppercase tracking-widest transition-all ${currentView === 'hub' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-900'}`}>المنصة</button>
               <button onClick={() => setCurrentView('matches')} className={`font-black text-xs uppercase tracking-widest transition-all ${currentView === 'matches' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-900'}`}>المباريات</button>
               <button onClick={() => setCurrentView('live')} className={`font-black text-xs uppercase tracking-widest transition-all ${currentView === 'live' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-900'}`}>البث المباشر</button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-2xl">
               <Eye className="w-4 h-4 text-slate-400" />
               <span className="font-black text-slate-600 text-xs">{visitorCount}</span>
            </div>

            {user ? (
               <div className="relative" ref={menuRef}>
                  <button 
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-3 bg-white p-1.5 pr-4 rounded-2xl border border-slate-200 hover:border-blue-200 transition-all shadow-sm"
                  >
                    <span className="font-black text-slate-700 hidden sm:block text-xs">نادي {user.team_name}</span>
                    <img src={user.logo_url} className="w-10 h-10 rounded-xl object-cover border-2 border-white shadow-sm" alt="User logo" />
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {isUserMenuOpen && (
                    <div className="absolute left-0 mt-3 w-64 bg-white rounded-3xl shadow-2xl border border-slate-100 py-3 animate-in slide-in-from-top-2 duration-200 overflow-hidden z-[60]">
                       <div className="px-6 py-4 bg-slate-50 mb-2">
                         <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">مسجل كـ</div>
                         <div className="font-black text-slate-900 truncate">{user.team_name}</div>
                       </div>
                       <button onClick={() => { setCurrentView('profile'); setIsUserMenuOpen(false); }} className="w-full flex items-center justify-end gap-3 px-6 py-3 hover:bg-slate-50 transition-colors text-right group">
                          <span className="font-bold text-slate-700 group-hover:text-blue-600">الملف الشخصي</span>
                          <User className="w-5 h-5 text-blue-600" />
                       </button>
                       <div className="h-px bg-slate-100 my-2 mx-6" />
                       <button onClick={handleLogout} className="w-full flex items-center justify-end gap-3 px-6 py-3 hover:bg-red-50 transition-colors text-red-500 text-right group">
                          <span className="font-bold">تسجيل الخروج</span>
                          <LogOut className="w-5 h-5" />
                       </button>
                    </div>
                  )}
               </div>
            ) : (
               <div className="flex gap-2">
                 <button onClick={() => setCurrentView('login')} className="bg-slate-100 text-slate-900 px-6 py-2.5 rounded-2xl font-black text-xs hover:bg-slate-200 transition-colors">دخول</button>
                 <button onClick={() => setCurrentView('register')} className="bg-blue-600 text-white px-6 py-2.5 rounded-2xl font-black text-xs hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95">سجل فريقك</button>
               </div>
            )}
            
            <button onClick={handleSecretClick} className="w-8 h-8 opacity-0 pointer-events-auto absolute" />
          </div>
        </div>
      </nav>

      <main className="min-h-[70vh]">
        {renderContent()}
      </main>

      <footer className="bg-slate-900 text-white py-20 mt-20 relative overflow-hidden">
         <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-emerald-500 to-blue-600"></div>
         <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 md:grid-cols-4 gap-16 relative z-10">
            <div className="col-span-1 md:col-span-2">
               <div className="flex items-center gap-2 mb-8">
                  <div className="bg-blue-600 p-2 rounded-2xl"><Trophy className="w-8 h-8 text-white" /></div>
                  <span className="text-3xl font-black italic tracking-tighter">KORA<span className="text-blue-500">DZ</span></span>
               </div>
               <p className="text-slate-400 font-bold leading-relaxed max-w-md text-lg">
                  المنصة الأولى والوحيدة في الجزائر المخصصة لإدارة وتغطية الدورات الكروية بلمسة احترافية رقمية. 
               </p>
               <div className="mt-8 flex gap-4">
                  <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center hover:bg-blue-600 transition-all cursor-pointer border border-white/5"><Share2 className="w-6 h-6" /></div>
                  <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center hover:bg-blue-600 transition-all cursor-pointer border border-white/5"><MessageCircle className="w-6 h-6" /></div>
                  <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center hover:bg-blue-600 transition-all cursor-pointer border border-white/5"><Bell className="w-6 h-6" /></div>
               </div>
            </div>
            <div>
               <h4 className="text-xl font-black mb-8 border-r-4 border-blue-600 pr-4">روابط سريعة</h4>
               <ul className="space-y-4 text-slate-400 font-bold">
                  <li className="hover:text-blue-400 cursor-pointer transition-colors" onClick={() => setCurrentView('home')}>الرئيسية</li>
                  <li className="hover:text-blue-400 cursor-pointer transition-colors" onClick={() => setCurrentView('hub')}>ملتقى الفرق</li>
                  <li className="hover:text-blue-400 cursor-pointer transition-colors" onClick={() => setCurrentView('matches')}>مركز المباريات</li>
                  <li className="hover:text-blue-400 cursor-pointer transition-colors" onClick={() => setCurrentView('live')}>البث الحي</li>
               </ul>
            </div>
            <div>
               <h4 className="text-xl font-black mb-8 border-r-4 border-emerald-500 pr-4">إحصائيات</h4>
               <div className="space-y-6">
                  <div className="flex items-center gap-3">
                     <Users className="text-blue-400 w-6 h-6" />
                     <div>
                        <div className="text-2xl font-black">{allTeams.length}</div>
                        <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest">فريق مشارك</div>
                     </div>
                  </div>
                  <div className="flex items-center gap-3">
                     <Eye className="text-emerald-400 w-6 h-6" />
                     <div>
                        <div className="text-2xl font-black">{visitorCount}</div>
                        <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest">زائر للمنصة</div>
                     </div>
                  </div>
               </div>
            </div>
         </div>
         <div className="max-w-7xl mx-auto px-8 mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 text-slate-500 font-bold text-xs">
            <p>© 2024 جميع الحقوق محفوظة لـ KORA DZ Digital Portal</p>
            <p>صنع بشغف لخدمة الكرة الجزائرية 🇩🇿</p>
         </div>
      </footer>
      
      {/* Fixed bottom nav for mobile */}
      <div className="lg:hidden fixed bottom-6 left-6 right-6 z-[100]">
         <div className="bg-slate-900/90 backdrop-blur-2xl border border-white/10 h-20 rounded-[2.5rem] shadow-2xl flex items-center justify-around px-4">
            <button onClick={() => setCurrentView('home')} className={`flex flex-col items-center gap-1 transition-all ${currentView === 'home' ? 'text-blue-400' : 'text-slate-500 hover:text-white'}`}>
               <Home className="w-6 h-6" />
               <span className="text-[9px] font-black uppercase tracking-widest">الرئيسية</span>
            </button>
            <button onClick={() => setCurrentView('hub')} className={`flex flex-col items-center gap-1 transition-all ${currentView === 'hub' ? 'text-blue-400' : 'text-slate-500 hover:text-white'}`}>
               <LayoutGrid className="w-6 h-6" />
               <span className="text-[9px] font-black uppercase tracking-widest">الملتقى</span>
            </button>
            <button onClick={() => setCurrentView('matches')} className={`flex flex-col items-center gap-1 transition-all ${currentView === 'matches' ? 'text-blue-400' : 'text-slate-500 hover:text-white'}`}>
               <Calendar className="w-6 h-6" />
               <span className="text-[9px] font-black uppercase tracking-widest">المباريات</span>
            </button>
            {user && (
              <button onClick={() => setCurrentView('profile')} className={`flex flex-col items-center gap-1 transition-all ${currentView === 'profile' ? 'text-blue-400' : 'text-slate-500 hover:text-white'}`}>
                 <User className="w-6 h-6" />
                 <span className="text-[9px] font-black uppercase tracking-widest">نادينا</span>
              </button>
            )}
         </div>
      </div>
    </div>
  );
}
