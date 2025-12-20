
import React, { useState, useEffect, useRef } from 'react';
import { FirebaseService } from './services/firebase';
import { TeamRegistration, LiveChannel, Post, Comment, AdConfig, Match, Challenge, AppNotification } from './types';
import { 
  Trophy, Shield, Loader2, Radio, ExternalLink, RefreshCw, LogOut, Save, Copy, Check, User, 
  LayoutGrid, Image as ImageIcon, Send, MapPin, Users, Plus, Hash, Edit3, Camera, Heart, 
  MessageSquare, ChevronDown, Settings, Upload, X, Share2, Flame, Bell, Star, Zap, MessageCircle,
  Medal, Target, Activity, Calendar, Home, Menu, Trash2, Eye, EyeOff, Lock, ShieldAlert, Shuffle,
  Megaphone, UserPlus, BarChart3, Clock, AlertCircle, Layers, Database, Info, TrendingUp, SaveAll,
  Swords, CheckCircle2, XCircle, MoreVertical, Search, Filter, Maximize2, Play
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
  const [currentUser, setCurrentUser] = useState<TeamRegistration | null>(null);
  const [viewedTeam, setViewedTeam] = useState<TeamRegistration | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [liveChannels, setLiveChannels] = useState<LiveChannel[]>([]);
  const [allTeams, setAllTeams] = useState<TeamRegistration[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
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
  const [isNotifMenuOpen, setIsNotifMenuOpen] = useState(false);
  const [adminClickCount, setAdminClickCount] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const fetchData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    setPermissionError(false);
    try {
      const savedAdmin = localStorage.getItem(ADMIN_KEY);
      if (savedAdmin === 'true') setIsAdmin(true);

      const savedTeamId = localStorage.getItem(SESSION_KEY);
      if (savedTeamId) {
        const teamData = await FirebaseService.getTeamById(savedTeamId);
        if (teamData) setCurrentUser(teamData);
      }

      const results = await Promise.allSettled([
        FirebaseService.getLiveChannels(isAdmin || savedAdmin === 'true'),
        FirebaseService.getAllTeams(),
        FirebaseService.getPosts(),
        FirebaseService.getAds(),
        FirebaseService.getMatches(),
        FirebaseService.getStats()
      ]);

      if (results[0].status === 'fulfilled') setLiveChannels(results[0].value);
      if (results[1].status === 'fulfilled') setAllTeams(results[1].value.filter((t: any) => t.contact_email !== ADMIN_CREDS.email));
      if (results[2].status === 'fulfilled') setPosts(results[2].value);
      if (results[3].status === 'fulfilled') setAds(results[3].value);
      if (results[4].status === 'fulfilled') setMatches(results[4].value);
      if (results[5].status === 'fulfilled') setVisitorCount(results[5].value);
      
      if (!silent) {
        try {
          await FirebaseService.trackVisit();
        } catch (e) {}
      }
    } catch (err: any) {
      console.error("Fetch Error:", err);
      if (err.message === "PERMISSION_DENIED") setPermissionError(true);
    } finally {
      setIsLoading(false);
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
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) setIsNotifMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [isAdmin]);

  useEffect(() => {
    if (currentUser?.id) {
      const unsubscribe = FirebaseService.listenNotifications(currentUser.id, (notifs) => {
        setNotifications(notifs);
      });
      return () => unsubscribe();
    }
  }, [currentUser?.id]);

  const handleLogout = () => {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(ADMIN_KEY);
    setCurrentUser(null);
    setViewedTeam(null);
    setIsAdmin(false);
    setCurrentView('home');
    setIsUserMenuOpen(false);
    window.location.hash = '';
  };

  const navigateToProfile = (team: TeamRegistration) => {
    setViewedTeam(team);
    setCurrentView('profile');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsUserMenuOpen(false);
    setIsNotifMenuOpen(false);
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
    const [incomingChallenges, setIncomingChallenges] = useState<Challenge[]>([]);
    const [isSendingChallenge, setIsSendingChallenge] = useState(false);
    const [selectedImg, setSelectedImg] = useState<string | null>(null);
    const logoInputRef = useRef<HTMLInputElement>(null);
    const galleryInputRef = useRef<HTMLInputElement>(null);

    const team = viewedTeam || currentUser;
    if (!team) return null;

    const isOwnProfile = currentUser?.id === team.id;

    useEffect(() => {
      if (isOwnProfile && team.id) {
        FirebaseService.getIncomingChallenges(team.id).then(setIncomingChallenges);
      }
    }, [isOwnProfile, team.id]);

    const startEditing = () => {
      setEditData({
        team_name: team.team_name,
        coach_name: team.coach_name,
        bio: team.bio || "فريق رياضي طموح.",
        region: team.region,
        municipality: team.municipality || team.region,
        players_count: team.players_count || 0,
        logo_url: team.logo_url
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
      if (e.target.files && e.target.files[0] && team.id) {
        setIsUploadingToGallery(true);
        try {
          const base64 = await convertToBase64(e.target.files[0]);
          const res = await FirebaseService.addToGallery(team.id, base64);
          if (res.success) {
            const updatedGallery = [...(team.gallery || []), base64];
            if (isOwnProfile) setCurrentUser({ ...currentUser!, gallery: updatedGallery });
            setViewedTeam({ ...team, gallery: updatedGallery });
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
      if (!team.id) return;
      setIsSaving(true);
      const res = await FirebaseService.updateTeamProfile(team.id, editData);
      if (res.success) {
        const updated = { ...team, ...editData };
        if (isOwnProfile) setCurrentUser(updated);
        setViewedTeam(updated);
        setIsEditing(false);
        fetchData(true);
      } else {
        alert("فشل تحديث البيانات.");
      }
      setIsSaving(false);
    };

    const handleChallengeClick = async () => {
      if (!currentUser || !team.id) {
        alert("يرجى تسجيل الدخول لتتمكن من تحدي هذا الفريق.");
        return;
      }
      setIsSendingChallenge(true);
      const res = await FirebaseService.sendChallenge({
        fromId: currentUser.id!,
        fromName: currentUser.team_name,
        fromLogo: currentUser.logo_url!,
        toId: team.id
      });
      if (res.success) {
        alert(`تم إرسال تحدي رسمي إلى نادي ${team.team_name}!`);
      } else {
        alert(res.error || "فشل إرسال التحدي.");
      }
      setIsSendingChallenge(false);
    };

    const handleChallengeResponse = async (challengeId: string, status: 'accepted' | 'declined') => {
      const res = await FirebaseService.updateChallengeStatus(challengeId, status);
      if (res.success) {
        setIncomingChallenges(prev => prev.map(c => c.id === challengeId ? {...c, status} : c));
        alert(status === 'accepted' ? "لقد قبلت التحدي! تواصل مع الفريق لترتيب المباراة." : "تم رفض التحدي.");
      }
    };

    return (
      <div className="max-w-7xl mx-auto py-6 md:py-12 px-4 text-right animate-in fade-in duration-500 pb-32">
         <AdDisplay html={ads.profile_top} />
         
         {/* Lightbox Modal */}
         {selectedImg && (
           <div 
             className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-10 animate-in fade-in zoom-in-95 duration-300"
             onClick={() => setSelectedImg(null)}
           >
             <div className="absolute inset-0 bg-black/95 backdrop-blur-md"></div>
             <button 
               className="absolute top-6 right-6 z-10 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all shadow-2xl"
               onClick={() => setSelectedImg(null)}
             >
               <X className="w-8 h-8" />
             </button>
             <div className="relative max-w-full max-h-full overflow-hidden rounded-3xl md:rounded-[3rem] shadow-[0_0_100px_rgba(37,99,235,0.3)]">
               <img 
                 src={selectedImg} 
                 className="max-w-full max-h-[85vh] object-contain select-none shadow-2xl" 
                 alt="Full Screen View" 
                 onClick={(e) => e.stopPropagation()}
               />
               <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-xl px-8 py-3 rounded-full border border-white/20 text-white font-black text-sm md:text-base">
                 {team.team_name} - معرض الصور
               </div>
             </div>
           </div>
         )}

         <div className="bg-slate-900 min-h-[400px] md:h-[600px] rounded-[2.5rem] md:rounded-[3rem] relative overflow-hidden mb-12 shadow-2xl flex flex-col justify-end">
           <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
           
           <div className="relative z-10 p-6 md:p-12 flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-10 text-white w-full">
             <div className="relative group shrink-0">
                <div className="w-32 h-32 md:w-64 md:h-64 rounded-[2rem] md:rounded-[3.5rem] border-4 md:border-8 border-white bg-white shadow-2xl overflow-hidden">
                   <img 
                    src={isEditing ? (editData.logo_url || team.logo_url) : team.logo_url} 
                    className="w-full h-full object-cover" 
                    alt="Logo"
                  />
                </div>
                {isEditing && isOwnProfile && (
                  <button 
                    onClick={() => logoInputRef.current?.click()} 
                    className="absolute inset-0 bg-black/60 rounded-[2rem] md:rounded-[3.5rem] flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm"
                  >
                    <Camera className="w-8 h-8 text-white mb-2" />
                    <span className="text-[10px] font-black uppercase">تغيير</span>
                  </button>
                )}
                <input type="file" ref={logoInputRef} onChange={handleLogoUpload} className="hidden" accept="image/*" />
             </div>

             <div className="flex-1 text-center md:text-right w-full">
               <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 mb-4 justify-center md:justify-end">
                 <div className="px-3 py-1 bg-blue-600 rounded-full text-[9px] md:text-[11px] font-black uppercase tracking-widest">نادي النخبة</div>
                 {isEditing ? (
                   <input 
                     value={editData.team_name} 
                     onChange={e => setEditData({...editData, team_name: e.target.value})}
                     className="text-2xl md:text-6xl font-black italic bg-white/10 border-b-2 border-white/30 outline-none w-full max-w-sm px-2 text-center md:text-right focus:border-blue-500"
                   />
                 ) : (
                   <h2 className="text-3xl md:text-7xl font-black italic tracking-tighter leading-tight drop-shadow-2xl">نادي {team.team_name}</h2>
                 )}
               </div>
               
               <div className="flex items-center gap-4 justify-center md:justify-end mt-4 flex-wrap">
                 <div className="flex items-center gap-2 text-blue-200 font-bold bg-white/5 px-4 py-2 rounded-xl backdrop-blur-md border border-white/10 text-sm md:text-base">
                   <MapPin className="w-4 h-4 md:w-5 md:h-5" />
                   <span>{team.municipality || team.region}</span>
                 </div>
                 <div className="flex items-center gap-2 text-emerald-400 font-bold bg-white/5 px-4 py-2 rounded-xl backdrop-blur-md border border-white/10 text-sm md:text-base">
                   <Users className="w-4 h-4 md:w-5 md:h-5" />
                   <span>{team.players_count || 0} لاعب</span>
                 </div>
               </div>
             </div>

             <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
               {isOwnProfile ? (
                  !isEditing ? (
                    <button 
                      onClick={startEditing} 
                      className="w-full md:w-auto bg-white text-slate-900 px-8 py-4 rounded-2xl md:rounded-[2rem] font-black text-sm md:text-lg flex items-center justify-center gap-2 hover:bg-blue-50 transition-all shadow-xl active:scale-95"
                    >
                      <Edit3 className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
                      إدارة الفريق
                    </button>
                  ) : (
                    <>
                      <button 
                        onClick={saveChanges} 
                        disabled={isSaving} 
                        className="w-full md:w-auto bg-emerald-500 text-white px-8 py-4 rounded-2xl md:rounded-[2rem] font-black text-sm md:text-lg flex items-center justify-center gap-2 hover:bg-emerald-600 disabled:opacity-50 transition-all"
                      >
                        {isSaving ? <Loader2 className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />}
                        حفظ
                      </button>
                      <button 
                        onClick={() => setIsEditing(false)} 
                        className="w-full md:w-auto bg-white/10 backdrop-blur-md text-white px-8 py-4 rounded-2xl md:rounded-[2rem] font-black text-sm md:text-lg hover:bg-white/20 transition-all"
                      >
                        إلغاء
                      </button>
                    </>
                  )
               ) : (
                  <button 
                    onClick={handleChallengeClick}
                    disabled={isSendingChallenge}
                    className="w-full md:w-auto bg-gradient-to-br from-rose-600 to-orange-600 text-white px-10 py-5 rounded-[2rem] font-black text-lg md:text-xl flex items-center justify-center gap-3 hover:scale-105 transition-all shadow-2xl active:scale-95 disabled:opacity-50"
                  >
                    {isSendingChallenge ? <Loader2 className="animate-spin" /> : <Swords className="w-7 h-7 md:w-8 md:h-8 animate-pulse" />}
                    أتحداكم!
                  </button>
               )}
             </div>
           </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
            <div className="lg:col-span-2 space-y-8 md:y-12">
              {isOwnProfile && incomingChallenges.length > 0 && (
                <div className="bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-xl border-l-8 border-rose-500">
                   <h3 className="text-xl md:text-2xl font-black mb-8 flex items-center gap-3 text-slate-900">
                     <Flame className="w-6 h-6 text-rose-500 animate-bounce" />
                     تحديات بانتظاركم
                   </h3>
                   <div className="space-y-4">
                      {incomingChallenges.map(c => (
                        <div key={c.id} className="bg-slate-50 p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] flex flex-col sm:flex-row items-center justify-between border border-slate-100 gap-4">
                           <div className="flex gap-2 items-center w-full sm:w-auto">
                             {c.status === 'pending' ? (
                               <>
                                 <button onClick={() => handleChallengeResponse(c.id!, 'accepted')} className="flex-1 sm:flex-none bg-emerald-500 text-white px-6 py-2 rounded-xl font-bold flex items-center justify-center gap-1"><CheckCircle2 className="w-4 h-4" /> قبول</button>
                                 <button onClick={() => handleChallengeResponse(c.id!, 'declined')} className="flex-1 sm:flex-none bg-white text-rose-500 border border-rose-100 px-6 py-2 rounded-xl font-bold flex items-center justify-center gap-1"><XCircle className="w-4 h-4" /> رفض</button>
                               </>
                             ) : (
                               <span className={`px-4 py-2 rounded-full text-[10px] font-black uppercase ${c.status === 'accepted' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                 {c.status === 'accepted' ? 'تم القبول' : 'تم الرفض'}
                               </span>
                             )}
                           </div>
                           <div className="flex items-center gap-4 text-right w-full sm:w-auto justify-end">
                              <div className="font-black text-slate-800 text-sm md:text-lg">{c.fromName}</div>
                              <img src={c.fromLogo} className="w-12 h-12 rounded-xl object-cover border border-white shadow-sm" />
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
              )}

              <div className="bg-white p-8 md:p-12 rounded-[2rem] md:rounded-[3.5rem] shadow-xl border border-slate-100 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700"></div>
                <h3 className="text-xl md:text-3xl font-black mb-6 md:mb-8 flex items-center gap-3 relative z-10 text-slate-900">
                  <Info className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
                  عن النادي
                </h3>
                {isEditing ? (
                  <textarea 
                    value={editData.bio}
                    onChange={e => setEditData({...editData, bio: e.target.value})}
                    placeholder="اكتب تاريخ النادي أو رؤيته..."
                    className="w-full h-48 bg-slate-50 rounded-[1.5rem] p-6 border-2 border-slate-100 outline-none text-base md:text-xl font-bold text-slate-700 leading-relaxed text-right"
                  />
                ) : (
                  <p className="text-slate-600 leading-relaxed text-lg md:text-2xl font-medium relative z-10 whitespace-pre-wrap">{team.bio || "لم يقم النادي بإضافة وصف بعد."}</p>
                )}
              </div>

              <div className="bg-white p-8 md:p-12 rounded-[2rem] md:rounded-[3.5rem] shadow-xl border border-slate-100">
                <div className="flex flex-col sm:flex-row items-center justify-between mb-8 md:mb-12 gap-4">
                  <h3 className="text-xl md:text-3xl font-black flex items-center gap-4 text-slate-900 order-1 sm:order-2">
                    <ImageIcon className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
                    معرض الصور
                  </h3>
                  {isOwnProfile && (
                    <button 
                      onClick={() => galleryInputRef.current?.click()}
                      disabled={isUploadingToGallery}
                      className="w-full sm:w-auto bg-blue-600 text-white px-6 py-3 rounded-xl font-black flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg order-2 sm:order-1"
                    >
                      {isUploadingToGallery ? <Loader2 className="animate-spin w-5 h-5" /> : <Upload className="w-5 h-5" />}
                      إضافة صور
                    </button>
                  )}
                </div>
                
                <input type="file" ref={galleryInputRef} onChange={handleGalleryUpload} className="hidden" accept="image/*" />

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
                  {team.gallery && team.gallery.length > 0 ? (
                    team.gallery.map((img, i) => (
                      <div 
                        key={i} 
                        className="group relative aspect-square overflow-hidden rounded-[1.5rem] md:rounded-[2.5rem] shadow-lg border-2 md:border-4 border-slate-50 cursor-pointer"
                        onClick={() => setSelectedImg(img)}
                      >
                        <img src={img} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={`Gallery ${i}`} />
                        <div className="absolute inset-0 bg-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                           <Maximize2 className="text-white w-8 h-8 drop-shadow-lg" />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full py-16 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 text-center">
                       <ImageIcon className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                       <p className="text-slate-400 font-black italic text-sm md:text-xl">المعرض فارغ حالياً.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-8 md:y-12">
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 md:p-12 rounded-[2rem] md:rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-2 bg-blue-600"></div>
                <h3 className="text-xl md:text-3xl font-black mb-8 flex items-center gap-4 relative z-10">
                  <TrendingUp className="w-6 h-6 md:w-8 md:h-8 text-blue-400" />
                  السجل الرياضي
                </h3>
                
                <div className="grid grid-cols-2 gap-4 md:gap-8 relative z-10">
                  <div className="bg-white/5 backdrop-blur-xl p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] text-center border border-white/10">
                    <div className="text-3xl md:text-5xl font-black text-emerald-400 mb-1">{team.wins || 0}</div>
                    <div className="text-[9px] opacity-60 font-black uppercase">فوز</div>
                  </div>
                  <div className="bg-white/5 backdrop-blur-xl p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] text-center border border-white/10">
                    <div className="text-3xl md:text-5xl font-black text-rose-400 mb-1">{team.losses || 0}</div>
                    <div className="text-[9px] opacity-60 font-black uppercase">هزائم</div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 md:p-12 rounded-[2rem] md:rounded-[3.5rem] shadow-xl border border-slate-100">
                <h3 className="text-xl md:text-3xl font-black mb-8 flex items-center gap-4 text-slate-900">
                  <Shield className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
                  الطاقم التقني
                </h3>
                <div className="space-y-6 md:space-y-8">
                  <div className="p-6 md:p-8 bg-slate-50 rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-100 text-right">
                    <div className="text-[10px] text-slate-400 font-black mb-1 uppercase tracking-widest">المدرب الرئيسي</div>
                    <div className="text-lg md:text-2xl font-black text-slate-900 italic">الكابتن {team.coach_name}</div>
                  </div>
                  <div className="p-6 md:p-8 bg-slate-50 rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-100 text-right">
                    <div className="text-[10px] text-slate-400 font-black mb-1 uppercase tracking-widest">مقر النادي</div>
                    <div className="text-base md:text-xl font-bold text-slate-700">{team.region}</div>
                  </div>
                </div>
              </div>
            </div>
         </div>
      </div>
    );
  };

  const HubView = () => {
    const [newPostContent, setNewPostContent] = useState("");
    const [isPosting, setIsPosting] = useState(false);
    const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
    const [newCommentText, setNewCommentText] = useState("");
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);

    const handleCreatePost = async () => {
      if (!currentUser || !newPostContent.trim()) return;
      setIsPosting(true);
      try {
        await FirebaseService.createPost({
          teamId: currentUser.id!,
          teamName: currentUser.team_name,
          teamLogo: currentUser.logo_url!,
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

    const handleLike = async (post: Post) => {
      if (!currentUser || !post.id) return;
      const isLiked = post.likes?.includes(currentUser.id);
      await FirebaseService.toggleLike(post.id, currentUser.id, !!isLiked);
      fetchData(true);
    };

    const handleAddComment = async (postId: string) => {
      if (!currentUser || !newCommentText.trim()) return;
      setIsSubmittingComment(true);
      try {
        const comment: Comment = {
          id: Math.random().toString(36).substr(2, 9),
          teamId: currentUser.id!,
          teamName: currentUser.team_name,
          teamLogo: currentUser.logo_url!,
          text: newCommentText,
          created_at: new Date()
        };
        await FirebaseService.addComment(postId, comment);
        setNewCommentText("");
        fetchData(true);
      } catch (e) {
        alert("فشل إضافة التعليق.");
      } finally {
        setIsSubmittingComment(false);
      }
    };

    return (
      <div className="max-w-4xl mx-auto py-8 md:py-12 px-4 pb-24 text-right">
         <AdDisplay html={ads.hub_top} />
         <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-black italic mb-2 md:mb-4 text-slate-900">ملتقى الفرق</h2>
            <p className="text-slate-400 font-bold text-sm md:text-base">تفاعل الأندية والمنشورات الحية</p>
         </div>

         {currentUser && (
           <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-xl border border-slate-100 p-6 md:p-8 mb-10">
             <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6 justify-end">
                <span className="font-black text-slate-900 text-sm md:text-base">{currentUser.team_name}</span>
                <img src={currentUser.logo_url} className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl object-cover" />
             </div>
             <textarea 
               value={newPostContent}
               onChange={e => setNewPostContent(e.target.value)}
               placeholder="ماذا يدور في كواليس فريقك اليوم؟" 
               className="w-full h-24 md:h-32 p-4 md:p-5 bg-slate-50 border border-slate-100 rounded-[1.5rem] md:rounded-[2rem] outline-none font-bold text-right text-slate-800 text-sm md:text-base"
             />
             <div className="flex justify-start mt-4">
                <button 
                  onClick={handleCreatePost}
                  disabled={isPosting || !newPostContent.trim()}
                  className="bg-blue-600 text-white px-8 py-3 rounded-xl md:rounded-2xl font-black flex items-center gap-2 hover:bg-blue-700 transition-all disabled:opacity-50 text-sm md:text-base"
                >
                  {isPosting ? <Loader2 className="animate-spin" /> : <Send className="w-4 h-4 md:w-5 md:h-5" />} نشر
                </button>
             </div>
           </div>
         )}
         
         <div className="space-y-8 md:space-y-10">
           {posts.length === 0 ? (
             <div className="h-48 md:h-64 flex flex-col items-center justify-center bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
               <MessageSquare className="w-10 h-10 text-slate-300 mb-4" />
               <p className="text-slate-400 font-black italic text-xs md:text-base">لا توجد منشورات حالياً.</p>
             </div>
           ) : (
             posts.map(post => {
               const isLiked = currentUser && post.likes?.includes(currentUser.id!);
               return (
                 <div key={post.id} className="bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-xl border border-slate-100 p-6 md:p-10 text-right">
                    <div className="flex items-center gap-4 md:gap-5 mb-6 md:mb-8 justify-end">
                      <div className="text-right">
                         <h4 className="font-black text-base md:text-xl text-slate-900 cursor-pointer hover:text-blue-600" onClick={() => {
                           const team = allTeams.find(t => t.id === post.teamId);
                           if (team) navigateToProfile(team);
                         }}>{post.teamName}</h4>
                         <p className="text-[9px] md:text-[10px] text-slate-400 font-black uppercase">منذ قليل</p>
                      </div>
                      <img src={post.teamLogo} className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-3xl object-cover shadow-lg border-2 border-slate-50" />
                    </div>
                    
                    <p className="text-slate-700 text-base md:text-xl mb-6 md:mb-8 leading-relaxed whitespace-pre-wrap font-medium">{post.content}</p>
                    
                    <div className="flex items-center gap-4 md:gap-6 border-t border-slate-50 pt-4 md:pt-6">
                       <button 
                        onClick={() => handleLike(post)}
                        disabled={!currentUser}
                        className={`flex items-center gap-1 md:gap-2 font-black transition-colors text-sm md:text-base ${isLiked ? 'text-rose-500' : 'text-slate-400'}`}
                       >
                          <Heart className={`w-5 h-5 md:w-6 md:h-6 ${isLiked ? 'fill-current' : ''}`} />
                          <span>{post.likes?.length || 0}</span>
                       </button>
                       
                       <button 
                         onClick={() => setActiveCommentPostId(activeCommentPostId === post.id ? null : post.id!)}
                         className={`flex items-center gap-1 md:gap-2 font-black transition-colors text-sm md:text-base ${activeCommentPostId === post.id ? 'text-blue-600' : 'text-slate-400'}`}
                       >
                          <MessageSquare className="w-5 h-5 md:w-6 md:h-6" />
                          <span>{post.comments?.length || 0}</span>
                       </button>
                    </div>

                    {activeCommentPostId === post.id && (
                      <div className="mt-6 md:mt-8 space-y-4 md:space-y-6 animate-in slide-in-from-top-4 duration-300 border-t border-slate-50 pt-4 md:pt-6">
                        <div className="space-y-4 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                           {post.comments && post.comments.length > 0 ? (
                             post.comments.map((comment) => (
                               <div key={comment.id} className="flex gap-2 md:gap-3 justify-end items-start">
                                  <div className="bg-slate-50 p-3 md:p-4 rounded-xl md:rounded-2xl rounded-tr-none flex-1">
                                     <div className="flex items-center justify-between mb-1">
                                        <span className="text-[9px] text-slate-400">منذ قليل</span>
                                        <span className="font-black text-[10px] md:text-xs text-slate-800 cursor-pointer hover:text-blue-600" onClick={() => {
                                          const team = allTeams.find(t => t.id === comment.teamId);
                                          if (team) navigateToProfile(team);
                                        }}>{comment.teamName}</span>
                                     </div>
                                     <p className="text-xs md:text-sm font-medium text-slate-600">{comment.text}</p>
                                  </div>
                                  <img src={comment.teamLogo} className="w-6 h-6 md:w-8 md:h-8 rounded-lg object-cover shrink-0" />
                               </div>
                             ))
                           ) : (
                             <p className="text-center text-slate-400 text-[10px] font-bold py-2 italic">لا توجد تعليقات.</p>
                           )}
                        </div>

                        {currentUser ? (
                           <div className="flex gap-2 mt-4 items-center justify-end">
                              <button 
                                onClick={() => handleAddComment(post.id!)}
                                disabled={isSubmittingComment || !newCommentText.trim()}
                                className="bg-blue-600 text-white p-2 rounded-lg md:rounded-xl disabled:opacity-50"
                              >
                                {isSubmittingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                              </button>
                              <input 
                                value={newCommentText}
                                onChange={(e) => setNewCommentText(e.target.value)}
                                placeholder="اكتب تعليقك..."
                                className="bg-slate-100 border-none outline-none p-2 md:p-3 rounded-lg md:rounded-xl flex-1 text-xs md:text-sm font-bold text-right"
                                onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post.id!)}
                              />
                           </div>
                        ) : (
                          <p className="text-center text-[10px] font-bold text-slate-400 bg-slate-50 p-2 rounded-lg">يرجى تسجيل الدخول.</p>
                        )}
                      </div>
                    )}
                 </div>
               );
             })
           )}
         </div>
      </div>
    );
  };

  const MatchCenterView = () => (
    <div className="max-w-5xl mx-auto py-8 md:py-12 px-4 text-right">
      <AdDisplay html={ads.matches_top} />
      <div className="text-center mb-10 md:mb-16">
        <h2 className="text-3xl md:text-5xl font-black italic mb-2 text-slate-900">مركز المباريات</h2>
      </div>

      <div className="space-y-6 md:space-y-8">
        {matches.map(match => (
          <div key={match.id} className="bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-xl border border-slate-100 p-6 md:p-8 flex flex-col items-center justify-between gap-6 md:gap-8">
            <div className="flex flex-row items-center justify-between w-full">
               <div className="flex flex-col items-center gap-2 flex-1 cursor-pointer" onClick={() => {
                 const team = allTeams.find(t => t.id === match.homeTeamId);
                 if (team) navigateToProfile(team);
               }}>
                 <img src={match.homeTeamLogo} className="w-16 h-16 md:w-20 md:h-20 rounded-xl md:rounded-2xl object-cover border-2 border-slate-50 shadow-sm" />
                 <span className="font-black text-xs md:text-xl text-slate-800 text-center">{match.homeTeamName}</span>
               </div>
               
               <div className="flex flex-col items-center gap-1 md:gap-2 px-4">
                 <div className="flex items-center gap-2 md:gap-4 bg-slate-900 text-white px-4 md:px-8 py-2 md:py-4 rounded-xl md:rounded-[2rem] shadow-lg">
                   <span className="text-2xl md:text-4xl font-black">{match.scoreHome}</span>
                   <span className="text-slate-500 font-black text-xl md:text-2xl">-</span>
                   <span className="text-2xl md:text-4xl font-black">{match.scoreAway}</span>
                 </div>
                 <div className="text-[9px] md:text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-tighter text-center">{match.date} | {match.time}</div>
               </div>

               <div className="flex flex-col items-center gap-2 flex-1 cursor-pointer" onClick={() => {
                 const team = allTeams.find(t => t.id === match.awayTeamId);
                 if (team) navigateToProfile(team);
               }}>
                 <img src={match.awayTeamLogo} className="w-16 h-16 md:w-20 md:h-20 rounded-xl md:rounded-2xl object-cover border-2 border-slate-50 shadow-sm" />
                 <span className="font-black text-xs md:text-xl text-slate-800 text-center">{match.awayTeamName}</span>
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState<'overview' | 'teams' | 'matches' | 'live' | 'ads'>('overview');
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [tempAds, setTempAds] = useState<AdConfig>({...ads});
    const [searchTerm, setSearchTerm] = useState("");

    const handleSaveAds = async () => {
      setIsActionLoading(true);
      await FirebaseService.updateAds(tempAds);
      setIsActionLoading(false);
      fetchData(true);
      alert("تم حفظ الإعلانات بنجاح.");
    };

    const handleDeleteTeam = async (id: string) => {
      if (!confirm("هل أنت متأكد من حذف هذا الفريق نهائياً؟")) return;
      setIsActionLoading(true);
      await FirebaseService.deleteTeam(id);
      setIsActionLoading(false);
      fetchData(true);
    };

    const handleDeleteMatch = async (id: string) => {
      if (!confirm("حذف هذه المباراة؟")) return;
      setIsActionLoading(true);
      await FirebaseService.deleteMatch(id);
      setIsActionLoading(false);
      fetchData(true);
    };

    const handleToggleLive = async (channel: LiveChannel) => {
      setIsActionLoading(true);
      await FirebaseService.updateLiveChannel(channel.id!, { is_active: !channel.is_active });
      setIsActionLoading(false);
      fetchData(true);
    };

    const filteredTeams = allTeams.filter(t => t.team_name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
      <div className="max-w-7xl mx-auto py-8 md:py-12 px-4 animate-in fade-in duration-500 text-right">
        <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
           <div className="flex items-center gap-4">
              <div className="bg-slate-900 text-white px-6 py-2 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2">
                 <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div> نظام الإدارة نشط
              </div>
           </div>
           <h2 className="text-3xl md:text-5xl font-black italic flex items-center gap-4 text-slate-900">
             لوحة التحكم الملكية <Lock className="text-blue-600 w-8 h-8 md:w-10 md:h-10" />
           </h2>
        </div>
        
        <div className="flex gap-2 mb-12 bg-white p-2 rounded-[2rem] shadow-xl border border-slate-100 w-full overflow-x-auto custom-scrollbar no-scrollbar">
          {[
            {id: 'overview', label: 'نظرة عامة', icon: LayoutGrid},
            {id: 'teams', label: 'إدارة الأندية', icon: Users},
            {id: 'matches', label: 'المباريات', icon: Calendar},
            {id: 'live', label: 'البث المباشر', icon: Radio},
            {id: 'ads', label: 'المساحات الإعلانية', icon: Megaphone},
          ].map((tab: any) => (
            <button 
              key={tab.id} 
              onClick={() => setActiveTab(tab.id)} 
              className={`shrink-0 flex items-center gap-2 px-6 py-4 rounded-[1.5rem] font-black text-xs uppercase transition-all ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'الزيارات الكلية', val: visitorCount, icon: Eye, color: 'blue' },
                { label: 'الأندية المسجلة', val: allTeams.length, icon: Users, color: 'emerald' },
                { label: 'المباريات المقررة', val: matches.length, icon: Calendar, color: 'amber' },
                { label: 'المنشورات', val: posts.length, icon: MessageSquare, color: 'rose' },
              ].map((stat, i) => (
                <div key={i} className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-50 flex flex-col items-center text-center group hover:scale-105 transition-transform">
                  <div className={`p-4 rounded-2xl bg-${stat.color}-50 text-${stat.color}-600 mb-4 group-hover:rotate-12 transition-transform`}>
                    <stat.icon className="w-8 h-8" />
                  </div>
                  <div className="text-4xl font-black text-slate-800">{stat.val}</div>
                  <div className="text-[10px] text-slate-400 font-black mt-2 uppercase tracking-widest">{stat.label}</div>
                </div>
              ))}
            </div>

            <div className="bg-blue-600 p-12 rounded-[3.5rem] shadow-2xl relative overflow-hidden text-white group">
               <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
               <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-right">
                  <div>
                     <h3 className="text-3xl font-black mb-3 italic">مركز البيانات</h3>
                     <p className="font-bold opacity-80 text-lg">توليد بيانات تجريبية للأندية والمنشورات.</p>
                  </div>
                  <button 
                    onClick={async () => {
                      setIsActionLoading(true);
                      const seedTeams = [
                        { name: "شباب بلوزداد", coach: "باكيتا", email: "crb@kora.dz", region: "الجزائر" },
                        { name: "اتحاد العاصمة", coach: "غاريدو", email: "usma@kora.dz", region: "الجزائر" }
                      ];
                      for (const t of seedTeams) {
                        const res: any = await FirebaseService.registerTeam({
                          team_name: t.name, coach_name: t.coach, contact_email: t.email, password: "123", region: t.region
                        });
                        if (res.id) {
                          await FirebaseService.createPost({
                            teamId: res.id, teamName: t.name, teamLogo: res.logo_url, content: `نادي ${t.name} مستعد للتحدي!`
                          });
                        }
                      }
                      setIsActionLoading(false);
                      fetchData(true);
                    }}
                    disabled={isActionLoading}
                    className="bg-white text-blue-600 px-12 py-5 rounded-[2rem] font-black text-xl shadow-xl flex items-center gap-3 active:scale-95 disabled:opacity-50"
                  >
                    {isActionLoading ? <Loader2 className="animate-spin" /> : <Database className="w-6 h-6" />}
                    توليد بيانات
                  </button>
               </div>
            </div>
          </div>
        )}
        
        {activeTab === 'live' && (
          <div className="space-y-12">
            <div className="bg-white p-8 md:p-12 rounded-[3.5rem] shadow-xl border border-slate-100">
               <h3 className="text-2xl font-black mb-10 italic flex items-center gap-3"><Plus className="text-blue-600" /> إضافة قناة بث مباشرة</h3>
               <form onSubmit={async (e) => {
                 e.preventDefault();
                 const t = e.target as any;
                 setIsActionLoading(true);
                 await FirebaseService.createLiveChannel({
                   name: t[0].value,
                   description: t[1].value,
                   thumbnail_url: t[2].value || "https://images.unsplash.com/photo-1574629810360-7efbbe195018",
                   embed_code: t[3].value, // هذا الحقل الآن يستقبل HTML
                   is_active: true
                 });
                 setIsActionLoading(false);
                 fetchData(true);
                 (e.target as any).reset();
                 alert("تمت إضافة القناة بنجاح.");
               }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 pr-2">اسم القناة</label>
                    <input placeholder="مثلاً: قناة الهداف" className="w-full p-5 bg-slate-50 rounded-2xl font-bold outline-none border-none" required />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 pr-2">وصف القناة</label>
                    <input placeholder="بث حصري للمباراة" className="w-full p-5 bg-slate-50 rounded-2xl font-bold outline-none border-none" required />
                 </div>
                 <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 pr-2">رابط صورة الغلاف (Thumbnail)</label>
                    <input placeholder="URL" className="w-full p-5 bg-slate-50 rounded-2xl font-bold outline-none border-none" />
                 </div>
                 <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 pr-2">كود التضمين HTML (Embed Code)</label>
                    <textarea 
                      placeholder="لصق كود Iframe هنا..." 
                      className="w-full h-48 p-5 bg-slate-50 rounded-2xl font-mono text-xs border-none outline-none focus:ring-2 ring-blue-500/20" 
                      required 
                    />
                    <p className="text-[9px] text-slate-400 font-bold pr-2">مثال: &lt;iframe src="..." ...&gt;&lt;/iframe&gt;</p>
                 </div>
                 <button className="md:col-span-2 py-6 bg-blue-600 text-white font-black rounded-3xl shadow-xl flex items-center justify-center gap-3">
                   {isActionLoading ? <Loader2 className="animate-spin" /> : <Save />} حفظ وتفعيل القناة
                 </button>
               </form>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               {liveChannels.map(ch => (
                 <div key={ch.id} className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100 flex flex-col">
                    <div className="h-40 rounded-2xl overflow-hidden mb-6 relative">
                       <img src={ch.thumbnail_url} className="w-full h-full object-cover" />
                       <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-[10px] font-black uppercase ${ch.is_active ? 'bg-emerald-500 text-white' : 'bg-slate-500 text-white'}`}>
                          {ch.is_active ? 'نشط' : 'متوقف'}
                       </div>
                    </div>
                    <h4 className="font-black text-xl mb-4 truncate text-slate-800">{ch.name}</h4>
                    <div className="flex gap-2 mt-auto">
                       <button onClick={() => handleToggleLive(ch)} className={`flex-1 py-4 rounded-xl font-black text-[10px] uppercase ${ch.is_active ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                          {ch.is_active ? 'إيقاف مؤقت' : 'تفعيل'}
                       </button>
                       <button onClick={async () => { if(confirm("حذف القناة؟")){ await FirebaseService.deleteLiveChannel(ch.id!); fetchData(true); } }} className="p-4 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all">
                          <Trash2 className="w-5 h-5" />
                       </button>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        )}

        {activeTab === 'teams' && (
          <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-xl border border-slate-100 overflow-hidden">
            <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-6">
              <div className="relative w-full md:w-96">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input 
                  type="text" 
                  placeholder="ابحث عن نادي..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full p-4 pr-12 bg-slate-50 rounded-2xl border border-slate-100 outline-none focus:border-blue-500 font-bold"
                />
              </div>
              <h3 className="text-2xl font-black italic">الأندية المسجلة ({allTeams.length})</h3>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-right">
                <thead className="border-b border-slate-50">
                  <tr className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                    <th className="pb-6 pr-4">النادي</th>
                    <th className="pb-6">المنطقة</th>
                    <th className="pb-6">البريد</th>
                    <th className="pb-6">اللاعبين</th>
                    <th className="pb-6 text-left pl-4">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredTeams.map(t => (
                    <tr key={t.id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="py-6 pr-4">
                        <div className="flex items-center gap-4">
                          <img src={t.logo_url} className="w-12 h-12 rounded-xl object-cover shadow-sm border border-slate-100" alt="Logo" />
                          <span className="font-black text-slate-800">{t.team_name}</span>
                        </div>
                      </td>
                      <td className="py-6 font-bold text-slate-600">{t.region}</td>
                      <td className="py-6 font-bold text-slate-600">{t.contact_email}</td>
                      <td className="py-6 font-bold text-slate-600">{t.players_count || 0}</td>
                      <td className="py-6 text-left pl-4">
                        <div className="flex items-center gap-2 justify-start">
                           <button onClick={() => navigateToProfile(t)} className="p-3 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all"><Eye className="w-4 h-4" /></button>
                           <button onClick={() => handleDeleteTeam(t.id!)} className="p-3 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* المكونات الأخرى للأدمن تتبع نفس النمط المستجيب */}
      </div>
    );
  };

  const renderContent = () => {
    if (isLoading) return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        <p className="font-bold text-slate-400">جاري تحميل البيانات...</p>
      </div>
    );

    if (permissionError) return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4">
        <ShieldAlert className="w-16 h-16 text-red-500" />
        <h2 className="text-2xl font-black">خطأ في الأذونات</h2>
        <button onClick={() => fetchData()} className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold mt-4">إعادة المحاولة</button>
      </div>
    );

    if (currentView === 'admin' && isAdmin) return <AdminDashboard />;

    switch(currentView) {
      case 'profile': return <ProfileView />;
      case 'hub': return <HubView />;
      case 'matches': return <MatchCenterView />;
      case 'live': 
        const LiveView = () => {
           const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
           
           return (
             <div className="max-w-7xl mx-auto py-8 md:py-12 px-4 md:px-6 pb-24 text-right">
               <AdDisplay html={ads.live_top} />
               <div className="text-center mb-12">
                  <h2 className="text-3xl md:text-5xl font-black italic mb-2 text-slate-900 flex items-center justify-center gap-4">
                    البث المباشر <Radio className="text-red-600 animate-pulse w-8 h-8 md:w-12 md:h-12" />
                  </h2>
                  <p className="text-slate-400 font-bold text-sm md:text-base">شاهد مباريات البطولة والبرامج الرياضية مباشرة</p>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                 {liveChannels.length === 0 ? (
                    <div className="col-span-full py-24 bg-white rounded-[3rem] shadow-xl border border-slate-100 text-center">
                       <Radio className="w-16 h-16 text-slate-100 mx-auto mb-6" />
                       <p className="text-slate-400 font-black italic text-xl">لا توجد قنوات بث نشطة حالياً.</p>
                    </div>
                 ) : (
                   liveChannels.map(ch => (
                    <div key={ch.id} className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden group">
                       <div className="aspect-video relative overflow-hidden bg-slate-900">
                          {activeChannelId === ch.id ? (
                             <div className="w-full h-full flex items-center justify-center" dangerouslySetInnerHTML={{ __html: ch.embed_code }} />
                          ) : (
                             <>
                                <img src={ch.thumbnail_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-60" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                   <button 
                                      onClick={() => setActiveChannelId(ch.id!)}
                                      className="w-16 h-16 md:w-20 md:h-20 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform active:scale-95"
                                   >
                                      <Play className="w-8 h-8 md:w-10 md:h-10 fill-current ml-1" />
                                   </button>
                                </div>
                                <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse">
                                   <div className="w-2 h-2 bg-white rounded-full"></div> مباشر
                                </div>
                             </>
                          )}
                       </div>
                       <div className="p-8">
                          <h4 className="font-black text-xl md:text-2xl mb-3 text-slate-800">{ch.name}</h4>
                          <p className="text-slate-500 font-bold text-sm md:text-base leading-relaxed">{ch.description}</p>
                       </div>
                    </div>
                   ))
                 )}
               </div>
             </div>
           );
        }
        return <LiveView />;
      case 'login': return <LoginView />;
      case 'register': return <RegisterView />;
      case 'admin-login': return <AdminLoginView />;
      case 'home':
      default:
        return (
          <div className="max-w-7xl mx-auto py-8 md:py-12 px-4 text-center">
            <h1 className="text-4xl md:text-8xl font-black italic tracking-tighter mb-4 text-slate-900">كأس النخبة <span className="text-blue-600">DZ</span></h1>
            <p className="text-base md:text-xl text-slate-500 mb-10 font-bold max-w-2xl mx-auto">المنصة الرسمية لتنظيم وإدارة الدورات الرياضية في الجزائر.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
               <div className="bg-white p-8 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-xl border border-slate-100 hover:scale-105 transition-transform cursor-pointer group" onClick={() => setCurrentView('hub')}>
                  <LayoutGrid className="w-8 h-8 md:w-10 md:h-10 text-blue-600 mx-auto mb-4 md:mb-6" />
                  <h3 className="text-lg md:text-2xl font-black mb-2">منصة الفرق</h3>
               </div>
               <div className="bg-white p-8 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-xl border border-slate-100 hover:scale-105 transition-transform cursor-pointer group" onClick={() => setCurrentView('matches')}>
                  <Calendar className="w-8 h-8 md:w-10 md:h-10 text-emerald-600 mx-auto mb-4 md:mb-6" />
                  <h3 className="text-lg md:text-2xl font-black mb-2">المباريات</h3>
               </div>
               <div className="bg-white p-8 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-xl border border-slate-100 hover:scale-105 transition-transform cursor-pointer group" onClick={() => setCurrentView('live')}>
                  <Radio className="w-8 h-8 md:w-10 md:h-10 text-rose-600 mx-auto mb-4 md:mb-6" />
                  <h3 className="text-lg md:text-2xl font-black mb-2">البث المباشر</h3>
               </div>
            </div>
            
            <section className="py-12 md:py-20 text-right">
               <h2 className="text-2xl md:text-4xl font-black mb-8 md:mb-10 text-slate-900 flex items-center gap-4 justify-end">النخبة المشاركة <Users className="text-blue-600" /></h2>
               <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-8">
                  {allTeams.map(team => (
                    <div key={team.id} className="text-center group cursor-pointer" onClick={() => navigateToProfile(team)}>
                       <div className="w-full aspect-square bg-white rounded-[1.5rem] md:rounded-[2.5rem] p-1.5 md:p-2 shadow-lg border-2 border-slate-50 group-hover:scale-110 transition-all mb-3 overflow-hidden">
                          <img src={team.logo_url} className="w-full h-full object-cover rounded-[1.2rem] md:rounded-[2rem]" alt={team.team_name} />
                       </div>
                       <p className="font-black text-slate-800 text-[10px] md:text-sm group-hover:text-blue-600 transition-colors truncate px-2">{team.team_name}</p>
                    </div>
                  ))}
               </div>
            </section>
          </div>
        );
    }
  };

  const LoginView = () => (
    <div className="max-w-md mx-auto py-16 md:py-24 px-6 text-center">
       <div className="bg-white rounded-[2.5rem] md:rounded-[3.5rem] p-8 md:p-12 shadow-2xl border border-slate-100">
          <h3 className="text-2xl md:text-3xl font-black mb-8 text-slate-900">دخول النادي</h3>
          <form onSubmit={async (e) => { e.preventDefault(); const t = e.target as any; const { data, error } = await FirebaseService.loginTeam(t[0].value, t[1].value); if (error) alert(error); else { setCurrentUser(data); localStorage.setItem(SESSION_KEY, data.id!); setViewedTeam(data); setCurrentView('profile'); fetchData(true); } }} className="space-y-4 md:space-y-5">
            <input type="email" placeholder="البريد الإلكتروني" className="w-full p-4 md:p-5 bg-slate-50 border border-slate-100 rounded-xl md:rounded-2xl outline-none font-bold text-right" />
            <input type="password" placeholder="كلمة المرور" className="w-full p-4 md:p-5 bg-slate-50 border border-slate-100 rounded-xl md:rounded-2xl outline-none font-bold text-right" />
            <button type="submit" className="w-full py-4 md:py-5 bg-blue-600 text-white font-black rounded-xl md:rounded-2xl shadow-xl hover:bg-blue-700 transition-all">دخول</button>
          </form>
       </div>
    </div>
  );

  const RegisterView = () => (
    <div className="max-w-md mx-auto py-16 md:py-24 px-6 text-center">
       <div className="bg-white rounded-[2.5rem] md:rounded-[3.5rem] p-8 md:p-12 shadow-2xl border border-slate-100">
          <h3 className="text-2xl md:text-3xl font-black mb-8 text-slate-900">تسجيل فريق</h3>
          <form onSubmit={async (e) => { e.preventDefault(); const t = e.target as any; const res = await FirebaseService.registerTeam({ team_name: t[0].value, coach_name: t[1].value, contact_email: t[2].value, password: t[3].value, region: t[4].value }); if (res.error) alert(res.error); else { alert('تم التسجيل!'); setCurrentView('login'); fetchData(true); } }} className="space-y-4">
            <input placeholder="اسم الفريق" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-bold text-right outline-none" />
            <input placeholder="اسم المدرب" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-bold text-right outline-none" />
            <input type="email" placeholder="البريد الإلكتروني" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-bold text-right outline-none" />
            <input type="password" placeholder="كلمة المرور" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-bold text-right outline-none" />
            <input placeholder="المنطقة" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-bold text-right outline-none" />
            <button type="submit" className="w-full py-4 bg-slate-900 text-white font-black rounded-xl shadow-xl">إرسال الطلب</button>
          </form>
       </div>
    </div>
  );

  const AdminLoginView = () => (
    <div className="max-w-md mx-auto py-24 px-6 text-center">
      <div className="bg-slate-900 rounded-[3rem] p-10 shadow-2xl border border-slate-800 text-white">
        <h3 className="text-2xl font-black mb-8 italic">بوابة المشرف</h3>
        <form onSubmit={async (e) => { e.preventDefault(); const t = e.target as any; if (t[0].value === ADMIN_CREDS.email && t[1].value === ADMIN_CREDS.pass) { setIsAdmin(true); localStorage.setItem(ADMIN_KEY, 'true'); setCurrentView('admin'); fetchData(true); } else alert("خطأ."); }} className="space-y-4">
          <input type="email" placeholder="البريد السري" className="w-full p-4 bg-slate-800 border border-slate-700 rounded-xl outline-none font-bold text-right" />
          <input type="password" placeholder="كلمة المرور" className="w-full p-4 bg-slate-800 border border-slate-700 rounded-xl outline-none font-bold text-right" />
          <button type="submit" className="w-full py-4 bg-blue-600 text-white font-black rounded-xl shadow-xl">دخول</button>
        </form>
      </div>
    </div>
  );

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="min-h-screen bg-slate-50 text-right selection:bg-blue-600 selection:text-white pb-24 md:pb-0" dir="rtl">
      <nav className="bg-white/80 backdrop-blur-xl border-b border-slate-100 sticky top-0 z-50 px-4 md:px-8 py-3 md:py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4 md:gap-8">
            <div className="flex items-center gap-2 cursor-pointer group" onClick={() => { setCurrentView('home'); setViewedTeam(null); }}>
               <div className="bg-blue-600 p-1.5 md:p-2 rounded-xl md:rounded-2xl shadow-lg">
                  <Trophy className="w-4 h-4 md:w-6 md:h-6 text-white" />
               </div>
               <span className="text-lg md:text-2xl font-black italic tracking-tighter">KORA<span className="text-blue-600">DZ</span></span>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
               <button onClick={() => { setCurrentView('hub'); setViewedTeam(null); }} className={`font-black text-[10px] uppercase transition-all ${currentView === 'hub' ? 'text-blue-600' : 'text-slate-400'}`}>المنصة</button>
               <button onClick={() => { setCurrentView('matches'); setViewedTeam(null); }} className={`font-black text-[10px] uppercase transition-all ${currentView === 'matches' ? 'text-blue-600' : 'text-slate-400'}`}>المباريات</button>
               <button onClick={() => { setCurrentView('live'); setViewedTeam(null); }} className={`font-black text-[10px] uppercase transition-all ${currentView === 'live' ? 'text-blue-600' : 'text-slate-400'}`}>البث المباشر</button>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {currentUser && (
               <div className="relative" ref={notifRef}>
                  <button 
                    onClick={() => setIsNotifMenuOpen(!isNotifMenuOpen)} 
                    className="relative p-2 md:p-3 bg-slate-50 rounded-xl md:rounded-2xl border border-slate-100 text-slate-600 hover:text-blue-600 transition-colors"
                  >
                    <Bell className="w-5 h-5 md:w-6 md:h-6" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -left-1 w-5 h-5 md:w-6 md:h-6 bg-rose-500 text-white text-[9px] md:text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white animate-pulse">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                  {isNotifMenuOpen && (
                    <div className="absolute left-0 mt-3 w-72 md:w-80 bg-white rounded-3xl shadow-2xl border border-slate-100 py-4 z-[60] animate-in slide-in-from-top-2">
                       <div className="px-6 pb-4 border-b border-slate-50 flex items-center justify-between">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">الإشعارات</span>
                          <span className="text-xs font-bold text-blue-600 cursor-pointer" onClick={() => notifications.forEach(n => FirebaseService.markNotificationRead(n.id!))}>تحديد الكل كمقروء</span>
                       </div>
                       <div className="max-h-96 overflow-y-auto custom-scrollbar">
                          {notifications.length === 0 ? (
                            <div className="py-12 text-center text-slate-400 font-bold italic text-sm">لا توجد إشعارات حالياً.</div>
                          ) : (
                            notifications.map(n => (
                              <div 
                                key={n.id} 
                                onClick={() => {
                                  FirebaseService.markNotificationRead(n.id!);
                                  if(n.type === 'challenge') navigateToProfile(currentUser);
                                  setIsNotifMenuOpen(false);
                                }}
                                className={`px-6 py-4 border-b border-slate-50 last:border-none cursor-pointer transition-colors ${n.isRead ? 'opacity-60' : 'bg-blue-50/30'}`}
                              >
                                 <div className="flex gap-3 items-start">
                                    <div className={`p-2 rounded-lg ${n.type === 'challenge' ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'}`}>
                                       {n.type === 'challenge' ? <Flame className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                                    </div>
                                    <div className="flex-1">
                                       <div className="text-sm font-black text-slate-800 mb-0.5">{n.title}</div>
                                       <div className="text-xs font-medium text-slate-500 leading-tight">{n.message}</div>
                                    </div>
                                 </div>
                              </div>
                            ))
                          )}
                       </div>
                    </div>
                  )}
               </div>
            )}

            {currentUser ? (
               <div className="relative" ref={menuRef}>
                  <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="flex items-center gap-2 md:gap-3 bg-white p-1 pr-3 md:p-1.5 md:pr-4 rounded-xl md:rounded-2xl border border-slate-200 shadow-sm">
                    <span className="font-black text-slate-700 hidden lg:block text-[10px] md:text-xs">نادي {currentUser.team_name}</span>
                    <img src={currentUser.logo_url} className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl object-cover" />
                  </button>
                  {isUserMenuOpen && (
                    <div className="absolute left-0 mt-3 w-48 md:w-64 bg-white rounded-2xl md:rounded-3xl shadow-2xl border border-slate-100 py-2 md:py-3 z-[60]">
                       <button onClick={() => navigateToProfile(currentUser)} className="w-full flex items-center justify-end gap-3 px-4 md:px-6 py-2 md:py-3 hover:bg-slate-50">
                          <span className="font-bold text-slate-700 text-xs md:text-sm">الملف الشخصي</span>
                          <User className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                       </button>
                       <div className="h-px bg-slate-100 my-1 md:my-2 mx-4 md:mx-6" />
                       <button onClick={handleLogout} className="w-full flex items-center justify-end gap-3 px-4 md:px-6 py-2 md:py-3 hover:bg-red-50 text-red-500">
                          <span className="font-bold text-xs md:text-sm">تسجيل الخروج</span>
                          <LogOut className="w-4 h-4 md:w-5 md:h-5" />
                       </button>
                    </div>
                  )}
               </div>
            ) : (
               <div className="flex gap-1 md:gap-2">
                 <button onClick={() => setCurrentView('login')} className="bg-slate-100 px-3 md:px-6 py-1.5 md:py-2.5 rounded-lg md:rounded-2xl font-black text-[10px] md:text-xs">دخول</button>
                 <button onClick={() => setCurrentView('register')} className="bg-blue-600 text-white px-3 md:px-6 py-1.5 md:py-2.5 rounded-lg md:rounded-2xl font-black text-[10px] md:text-xs">سجل</button>
               </div>
            )}
            <button onClick={handleSecretClick} className="w-6 h-6 opacity-0" />
          </div>
        </div>
      </nav>

      <main className="min-h-[70vh]">
        {renderContent()}
      </main>

      <footer className="bg-slate-900 text-white py-12 md:py-20 mt-12 md:mt-20 text-center px-4">
         <p className="text-slate-500 font-bold text-xs md:text-sm italic">© 2024 جميع الحقوق محفوظة لـ KORA DZ Digital Portal</p>
      </footer>
      
      <div className="md:hidden fixed bottom-4 left-4 right-4 z-[100]">
         <div className="bg-slate-900/90 backdrop-blur-2xl border border-white/10 h-16 rounded-[1.5rem] shadow-2xl flex items-center justify-around px-4">
            <button onClick={() => { setCurrentView('home'); setViewedTeam(null); }} className={`flex flex-col items-center gap-1 ${currentView === 'home' ? 'text-blue-400' : 'text-slate-500'}`}><Home className="w-5 h-5" /><span className="text-[8px] font-black">الرئيسية</span></button>
            <button onClick={() => { setCurrentView('hub'); setViewedTeam(null); }} className={`flex flex-col items-center gap-1 ${currentView === 'hub' ? 'text-blue-400' : 'text-slate-500'}`}><LayoutGrid className="w-5 h-5" /><span className="text-[8px] font-black">الملتقى</span></button>
            <button onClick={() => { setCurrentView('matches'); setViewedTeam(null); }} className={`flex flex-col items-center gap-1 ${currentView === 'matches' ? 'text-blue-400' : 'text-slate-500'}`}><Calendar className="w-5 h-5" /><span className="text-[8px] font-black">المباريات</span></button>
            {currentUser && <button onClick={() => navigateToProfile(currentUser)} className={`flex flex-col items-center gap-1 ${currentView === 'profile' && viewedTeam?.id === currentUser.id ? 'text-blue-400' : 'text-slate-500'}`}><User className="w-5 h-5" /><span className="text-[8px] font-black">نادينا</span></button>}
         </div>
      </div>
    </div>
  );
}
