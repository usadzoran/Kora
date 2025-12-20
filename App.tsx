
import React, { useState, useEffect, useRef } from 'react';
import { FirebaseService } from './services/firebase';
import { TeamRegistration, LiveChannel, Post, Comment, AdConfig, Match, Challenge } from './types';
import { 
  Trophy, Shield, Loader2, Radio, ExternalLink, RefreshCw, LogOut, Save, Copy, Check, User, 
  LayoutGrid, Image as ImageIcon, Send, MapPin, Users, Plus, Hash, Edit3, Camera, Heart, 
  MessageSquare, ChevronDown, Settings, Upload, X, Share2, Flame, Bell, Star, Zap, MessageCircle,
  Medal, Target, Activity, Calendar, Home, Menu, Trash2, Eye, EyeOff, Lock, ShieldAlert, Shuffle,
  Megaphone, UserPlus, BarChart3, Clock, AlertCircle, Layers, Database, Info, TrendingUp, SaveAll,
  Swords, CheckCircle2, XCircle
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
      if (!currentUser || !team.id) return;
      setIsSendingChallenge(true);
      const res = await FirebaseService.sendChallenge({
        fromId: currentUser.id!,
        fromName: currentUser.team_name,
        fromLogo: currentUser.logo_url!,
        toId: team.id
      });
      if (res.success) {
        alert("تم إرسال التحدي بنجاح! بانتظار رد الفريق.");
      } else {
        alert(res.error || "فشل إرسال التحدي.");
      }
      setIsSendingChallenge(false);
    };

    const handleChallengeResponse = async (challengeId: string, status: 'accepted' | 'declined') => {
      const res = await FirebaseService.updateChallengeStatus(challengeId, status);
      if (res.success) {
        setIncomingChallenges(prev => prev.map(c => c.id === challengeId ? {...c, status} : c));
        alert(status === 'accepted' ? "تم قبول التحدي! استعد للمواجهة." : "تم رفض التحدي.");
      }
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
                    src={isEditing ? (editData.logo_url || team.logo_url) : team.logo_url} 
                    className="w-full h-full object-cover" 
                    alt="Logo"
                  />
                </div>
                {isEditing && isOwnProfile && (
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
                   <h2 className="text-4xl md:text-7xl font-black italic tracking-tighter leading-tight drop-shadow-lg">نادي {team.team_name}</h2>
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
                      <span>{team.municipality || team.region}</span>
                   )}
                 </div>
                 <div className="flex items-center gap-2 text-emerald-400 font-bold bg-white/5 px-4 py-2 rounded-2xl backdrop-blur-md border border-white/10">
                   <Users className="w-5 h-5" />
                   <span>{team.players_count || 0} لاعب</span>
                 </div>
               </div>
             </div>

             <div className="hidden md:flex gap-4 mb-4">
               {isOwnProfile ? (
                  !isEditing ? (
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
                  )
               ) : currentUser && (
                  <button 
                    onClick={handleChallengeClick}
                    disabled={isSendingChallenge}
                    className="bg-gradient-to-r from-rose-600 to-orange-600 text-white px-12 py-5 rounded-[2rem] font-black text-xl flex items-center gap-3 hover:from-rose-700 hover:to-orange-700 transition-all shadow-2xl active:scale-95 disabled:opacity-50"
                  >
                    {isSendingChallenge ? <Loader2 className="animate-spin" /> : <Swords className="w-8 h-8" />}
                    تحدي النادي
                  </button>
               )}
             </div>
           </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-10">
              {isOwnProfile && incomingChallenges.length > 0 && (
                <div className="bg-white p-10 rounded-[3rem] shadow-xl border-l-8 border-rose-500 relative overflow-hidden">
                   <h3 className="text-2xl font-black mb-8 flex items-center gap-3 text-slate-900">
                     <Flame className="w-7 h-7 text-rose-500 animate-bounce" />
                     تحديات واردة
                   </h3>
                   <div className="space-y-4">
                      {incomingChallenges.map(c => (
                        <div key={c.id} className="bg-slate-50 p-6 rounded-[2rem] flex items-center justify-between border border-slate-100">
                           <div className="flex gap-4 justify-start">
                             {c.status === 'pending' ? (
                               <>
                                 <button onClick={() => handleChallengeResponse(c.id!, 'accepted')} className="bg-emerald-500 text-white p-3 rounded-full hover:bg-emerald-600 active:scale-90 transition-all"><CheckCircle2 className="w-6 h-6" /></button>
                                 <button onClick={() => handleChallengeResponse(c.id!, 'declined')} className="bg-rose-500 text-white p-3 rounded-full hover:bg-rose-600 active:scale-90 transition-all"><XCircle className="w-6 h-6" /></button>
                               </>
                             ) : (
                               <span className={`px-4 py-2 rounded-full text-[10px] font-black uppercase ${c.status === 'accepted' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                 {c.status === 'accepted' ? 'تم القبول' : 'تم الرفض'}
                               </span>
                             )}
                           </div>
                           <div className="flex items-center gap-4 text-right">
                              <div className="font-black text-slate-800">تحدي من {c.fromName}</div>
                              <img src={c.fromLogo} className="w-12 h-12 rounded-xl object-cover border-2 border-white shadow-sm" />
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
              )}

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
                  <p className="text-slate-600 leading-relaxed text-xl font-medium relative z-10 whitespace-pre-wrap">{team.bio || "لا يوجد وصف متوفر للنادي حالياً."}</p>
                )}
              </div>

              <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100">
                <div className="flex items-center justify-between mb-10">
                  {isOwnProfile && (
                    <button 
                      onClick={() => galleryInputRef.current?.click()}
                      disabled={isUploadingToGallery}
                      className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                    >
                      {isUploadingToGallery ? <Loader2 className="animate-spin w-5 h-5" /> : <Upload className="w-5 h-5" />}
                      تحميل صور
                    </button>
                  )}
                  <h3 className="text-2xl font-black flex items-center gap-3 text-slate-900">
                    <ImageIcon className="w-7 h-7 text-blue-600" />
                    معرض صور النادي
                  </h3>
                </div>
                
                <input type="file" ref={galleryInputRef} onChange={handleGalleryUpload} className="hidden" accept="image/*" />

                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {team.gallery && team.gallery.length > 0 ? (
                    team.gallery.map((img, i) => (
                      <div key={i} className="group relative aspect-square overflow-hidden rounded-3xl shadow-lg border-4 border-slate-50 cursor-pointer">
                        <img src={img} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={`Gallery ${i}`} />
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full py-20 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200 text-center">
                       <ImageIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                       <p className="text-slate-400 font-black italic">لا توجد صور في المعرض حالياً.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-10">
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-600"></div>
                <h3 className="text-2xl font-black mb-8 flex items-center gap-3 relative z-10">
                  <TrendingUp className="w-7 h-7 text-blue-400" />
                  إحصائيات الموسم
                </h3>
                
                <div className="grid grid-cols-2 gap-6 relative z-10">
                  <div className="bg-white/5 backdrop-blur-md p-6 rounded-3xl text-center border border-white/10 group-hover:bg-white/10 transition-colors">
                    <div className="text-4xl font-black text-emerald-400 mb-1">{team.wins || 0}</div>
                    <div className="text-[10px] opacity-60 font-black uppercase tracking-widest">فوز</div>
                  </div>
                  <div className="bg-white/5 backdrop-blur-md p-6 rounded-3xl text-center border border-white/10 group-hover:bg-white/10 transition-colors">
                    <div className="text-4xl font-black text-rose-400 mb-1">{team.losses || 0}</div>
                    <div className="text-[10px] opacity-60 font-black uppercase tracking-widest">هزائم</div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100">
                <h3 className="text-2xl font-black mb-8 flex items-center gap-3 text-slate-900">
                  <Shield className="w-7 h-7 text-blue-600" />
                  إدارة النادي
                </h3>
                <div className="space-y-6">
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                    <div className="text-[10px] text-slate-400 font-black mb-1 uppercase tracking-widest">المدرب الرئيسي</div>
                    <div className="text-xl font-black text-slate-900 italic">الكابتن {team.coach_name}</div>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                    <div className="text-[10px] text-slate-400 font-black mb-1 uppercase tracking-widest">المنطقة</div>
                    <div className="text-lg font-bold text-slate-700">{team.region}</div>
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
      <div className="max-w-4xl mx-auto py-12 px-4 pb-24 text-right">
         <AdDisplay html={ads.hub_top} />
         <div className="text-center mb-16">
            <h2 className="text-5xl font-black italic mb-4 text-slate-900">ملتقى الفرق</h2>
            <p className="text-slate-400 font-bold">المساحة الرسمية لتفاعل الأندية والمنشورات الحية</p>
         </div>

         {currentUser && (
           <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 p-8 mb-12">
             <div className="flex items-center gap-4 mb-6 justify-end">
                <span className="font-black text-slate-900">{currentUser.team_name}</span>
                <img src={currentUser.logo_url} className="w-10 h-10 rounded-xl object-cover" />
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
                  className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black flex items-center gap-2 hover:bg-blue-700 transition-all disabled:opacity-50"
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
               <p className="text-slate-400 font-black italic">لا توجد منشورات حالياً.</p>
             </div>
           ) : (
             posts.map(post => {
               const isLiked = currentUser && post.likes?.includes(currentUser.id!);
               return (
                 <div key={post.id} className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 p-8 md:p-10 text-right">
                    <div className="flex items-center gap-5 mb-8 justify-end">
                      <div className="text-right">
                         <h4 className="font-black text-xl text-slate-900 cursor-pointer hover:text-blue-600" onClick={() => {
                           const team = allTeams.find(t => t.id === post.teamId);
                           if (team) navigateToProfile(team);
                         }}>{post.teamName}</h4>
                         <p className="text-[10px] text-slate-400 font-black">نُشر مؤخراً</p>
                      </div>
                      <img src={post.teamLogo} className="w-16 h-16 rounded-3xl object-cover shadow-lg border-2 border-slate-50" />
                    </div>
                    
                    <p className="text-slate-700 text-xl mb-8 leading-relaxed whitespace-pre-wrap font-medium">{post.content}</p>
                    
                    <div className="flex items-center gap-6 border-t border-slate-50 pt-6">
                       <button 
                        onClick={() => handleLike(post)}
                        disabled={!currentUser}
                        className={`flex items-center gap-2 font-black transition-colors ${isLiked ? 'text-rose-500' : 'text-slate-400 hover:text-rose-400'}`}
                       >
                          <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
                          <span>{post.likes?.length || 0}</span>
                       </button>
                       
                       <button 
                         onClick={() => setActiveCommentPostId(activeCommentPostId === post.id ? null : post.id!)}
                         className={`flex items-center gap-2 font-black transition-colors ${activeCommentPostId === post.id ? 'text-blue-600' : 'text-slate-400 hover:text-blue-600'}`}
                       >
                          <MessageSquare className="w-6 h-6" />
                          <span>{post.comments?.length || 0}</span>
                       </button>
                    </div>

                    {activeCommentPostId === post.id && (
                      <div className="mt-8 space-y-6 animate-in slide-in-from-top-4 duration-300 border-t border-slate-50 pt-6">
                        <div className="space-y-4 max-h-80 overflow-y-auto custom-scrollbar pr-2">
                           {post.comments && post.comments.length > 0 ? (
                             post.comments.map((comment) => (
                               <div key={comment.id} className="flex gap-3 justify-end items-start">
                                  <div className="bg-slate-50 p-4 rounded-2xl rounded-tr-none flex-1">
                                     <div className="flex items-center justify-between mb-1">
                                        <span className="text-[10px] text-slate-400">منذ قليل</span>
                                        <span className="font-black text-xs text-slate-800 cursor-pointer hover:text-blue-600" onClick={() => {
                                          const team = allTeams.find(t => t.id === comment.teamId);
                                          if (team) navigateToProfile(team);
                                        }}>{comment.teamName}</span>
                                     </div>
                                     <p className="text-sm font-medium text-slate-600">{comment.text}</p>
                                  </div>
                                  <img src={comment.teamLogo} className="w-8 h-8 rounded-lg object-cover shrink-0" />
                               </div>
                             ))
                           ) : (
                             <p className="text-center text-slate-400 text-xs font-bold py-4 italic">لا توجد تعليقات بعد.</p>
                           )}
                        </div>

                        {currentUser ? (
                           <div className="flex gap-3 mt-4 items-center justify-end">
                              <button 
                                onClick={() => handleAddComment(post.id!)}
                                disabled={isSubmittingComment || !newCommentText.trim()}
                                className="bg-blue-600 text-white p-3 rounded-xl disabled:opacity-50 active:scale-95 transition-all"
                              >
                                {isSubmittingComment ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                              </button>
                              <input 
                                value={newCommentText}
                                onChange={(e) => setNewCommentText(e.target.value)}
                                placeholder="اكتب تعليقك هنا..."
                                className="bg-slate-100 border-none outline-none p-3 rounded-xl flex-1 text-sm font-bold text-right"
                                onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post.id!)}
                              />
                           </div>
                        ) : (
                          <p className="text-center text-xs font-bold text-slate-400 bg-slate-50 p-3 rounded-xl">يرجى تسجيل الدخول للتعليق.</p>
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
    <div className="max-w-5xl mx-auto py-12 px-4 text-right">
      <AdDisplay html={ads.matches_top} />
      <div className="text-center mb-16">
        <h2 className="text-5xl font-black italic mb-4 text-slate-900">مركز المباريات</h2>
      </div>

      <div className="space-y-8">
        {matches.map(match => (
          <div key={match.id} className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 p-8 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-6 flex-1 justify-end cursor-pointer" onClick={() => {
              const team = allTeams.find(t => t.id === match.homeTeamId);
              if (team) navigateToProfile(team);
            }}>
              <span className="font-black text-xl text-slate-800">{match.homeTeamName}</span>
              <img src={match.homeTeamLogo} className="w-20 h-20 rounded-2xl object-cover border-2 border-slate-50 shadow-sm" />
            </div>
            
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-4 bg-slate-900 text-white px-8 py-4 rounded-[2rem] shadow-lg">
                <span className="text-4xl font-black">{match.scoreHome}</span>
                <span className="text-slate-500 font-black text-2xl">-</span>
                <span className="text-4xl font-black">{match.scoreAway}</span>
              </div>
              <div className="text-[11px] font-bold text-slate-400 mt-1">{match.date} | {match.time}</div>
            </div>

            <div className="flex items-center gap-6 flex-1 justify-start cursor-pointer" onClick={() => {
              const team = allTeams.find(t => t.id === match.awayTeamId);
              if (team) navigateToProfile(team);
            }}>
              <img src={match.awayTeamLogo} className="w-20 h-20 rounded-2xl object-cover border-2 border-slate-50 shadow-sm" />
              <span className="font-black text-xl text-slate-800">{match.awayTeamName}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState<'stats' | 'teams' | 'matches' | 'ads'>('stats');
    const [isSaving, setIsSaving] = useState(false);
    const [isSeeding, setIsSeeding] = useState(false);
    const [tempAds, setTempAds] = useState<AdConfig>({...ads});

    const handleSaveAds = async () => {
      setIsSaving(true);
      await FirebaseService.updateAds(tempAds);
      setIsSaving(false);
      fetchData(true);
    };

    const seedData = async () => {
      if (!confirm("سيتم إنشاء أندية افتراضية ومنشورات ترحيبية. هل أنت متأكد؟")) return;
      setIsSeeding(true);
      const seedTeams = [
        { name: "مولودية الجزائر", coach: "بوميل", email: "mca@kora.dz", region: "الجزائر" },
        { name: "شبيبة القبائل", coach: "بن شيخة", email: "jsk@kora.dz", region: "تيزي وزو" },
        { name: "وفاق سطيف", coach: "بن دريس", email: "ess@kora.dz", region: "سطيف" }
      ];
      for (const t of seedTeams) {
        const res: any = await FirebaseService.registerTeam({
          team_name: t.name, coach_name: t.coach, contact_email: t.email, password: "123", region: t.region
        });
        if (res.id) {
          await FirebaseService.createPost({
            teamId: res.id, teamName: t.name, teamLogo: res.logo_url, content: `نادي ${t.name} يسجل حضوره في البطولة!`
          });
        }
      }
      setIsSeeding(false);
      fetchData(true);
    };

    return (
      <div className="max-w-6xl mx-auto py-12 px-6 animate-in fade-in duration-500 text-right">
        <h2 className="text-4xl font-black mb-10 flex items-center gap-4 justify-end">لوحة الإدارة <Lock className="text-blue-600" /></h2>
        
        <div className="flex gap-4 mb-10 bg-slate-100 p-2 rounded-2xl w-max mr-0 ml-auto">
          {['stats', 'teams', 'matches', 'ads'].map((tab: any) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-3 rounded-xl font-black text-xs uppercase ${activeTab === tab ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>
              {tab === 'stats' ? 'الإحصائيات' : tab === 'teams' ? 'الأندية' : tab === 'matches' ? 'المباريات' : 'الإعلانات'}
            </button>
          ))}
        </div>

        {activeTab === 'stats' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-50 text-center">
              <div className="text-4xl font-black text-slate-800">{visitorCount}</div>
              <div className="text-xs text-slate-400 font-black mt-2">إجمالي الزيارات</div>
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-50 text-center">
              <div className="text-4xl font-black text-slate-800">{allTeams.length}</div>
              <div className="text-xs text-slate-400 font-black mt-2">الأندية المسجلة</div>
            </div>
            <div className="bg-blue-600 p-8 rounded-3xl shadow-xl text-white text-center cursor-pointer" onClick={seedData}>
              {isSeeding ? <Loader2 className="animate-spin mx-auto" /> : <Plus className="mx-auto w-10 h-10 mb-2" />}
              <div className="font-black">توليد بيانات تجريبية</div>
            </div>
          </div>
        )}

        {activeTab === 'matches' && (
          <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-50">
            <h3 className="text-xl font-black mb-6">إضافة مباراة جديدة</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const t = e.target as any;
              const hId = t[0].value;
              const aId = t[1].value;
              const home = allTeams.find(x => x.id === hId);
              const away = allTeams.find(x => x.id === aId);
              if (!home || !away) return;
              await FirebaseService.createMatch({
                homeTeamId: hId, homeTeamName: home.team_name, homeTeamLogo: home.logo_url!,
                awayTeamId: aId, awayTeamName: away.team_name, awayTeamLogo: away.logo_url!,
                date: t[2].value, time: t[3].value, scoreHome: Number(t[4].value), scoreAway: Number(t[5].value),
                status: 'upcoming'
              });
              fetchData(true);
              (e.target as any).reset();
            }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select className="p-4 bg-slate-50 rounded-2xl font-bold">
                <option value="">الفريق المستضيف</option>
                {allTeams.map(t => <option key={t.id} value={t.id}>{t.team_name}</option>)}
              </select>
              <select className="p-4 bg-slate-50 rounded-2xl font-bold">
                <option value="">الفريق الضيف</option>
                {allTeams.map(t => <option key={t.id} value={t.id}>{t.team_name}</option>)}
              </select>
              <input type="date" className="p-4 bg-slate-50 rounded-2xl font-bold" />
              <input type="time" className="p-4 bg-slate-50 rounded-2xl font-bold" />
              <input type="number" placeholder="أهداف المستضيف" className="p-4 bg-slate-50 rounded-2xl font-bold" />
              <input type="number" placeholder="أهداف الضيف" className="p-4 bg-slate-50 rounded-2xl font-bold" />
              <button className="md:col-span-2 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-lg">حفظ المباراة</button>
            </form>
          </div>
        )}

        {activeTab === 'ads' && (
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-50">
              <h3 className="text-xl font-black mb-6">إدارة المساحات الإعلانية (HTML)</h3>
              <div className="grid grid-cols-1 gap-6">
                {(Object.keys(tempAds) as (keyof AdConfig)[]).map(key => (
                  <div key={key}>
                    <label className="block text-xs font-black text-slate-400 mb-2 uppercase">{key.replace(/_/g, ' ')}</label>
                    <textarea 
                      value={tempAds[key]} 
                      onChange={e => setTempAds({...tempAds, [key]: e.target.value})}
                      className="w-full h-24 p-4 bg-slate-50 border border-slate-100 rounded-2xl font-mono text-xs outline-none focus:border-blue-500 transition-all"
                      placeholder="Insert HTML/Script here..."
                    />
                  </div>
                ))}
              </div>
              <button onClick={handleSaveAds} disabled={isSaving} className="mt-8 w-full py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl flex items-center justify-center gap-3">
                {isSaving ? <Loader2 className="animate-spin" /> : <Save />} حفظ كافة الإعلانات
              </button>
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
      case 'live': return (
        <div className="max-w-7xl mx-auto py-12 px-6 pb-24 text-right">
          <h2 className="text-4xl font-black flex items-center gap-4 justify-end italic mb-12 text-slate-900">قنوات البث المباشر <Radio className="text-red-600 animate-pulse" /></h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {liveChannels.map(ch => (
              <div key={ch.id} className="bg-white rounded-[2.5rem] p-6 shadow-xl border border-slate-100">
                <div className="h-56 w-full rounded-[2rem] overflow-hidden mb-6"><img src={ch.thumbnail_url} className="w-full h-full object-cover" alt="Channel" /></div>
                <h4 className="font-black text-xl mb-4 truncate">{ch.name}</h4>
                <button onClick={() => window.open(ch.stream_url, '_blank')} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black shadow-lg">شاهد الآن</button>
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
            <p className="text-xl text-slate-500 mb-12 font-bold max-w-2xl mx-auto">المنصة الرسمية لتنظيم وإدارة الدورات الرياضية في الجزائر.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
               <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 hover:scale-105 transition-transform cursor-pointer group" onClick={() => setCurrentView('hub')}>
                  <LayoutGrid className="w-10 h-10 text-blue-600 mx-auto mb-6" />
                  <h3 className="text-2xl font-black mb-3">منصة الفرق</h3>
               </div>
               <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 hover:scale-105 transition-transform cursor-pointer group" onClick={() => setCurrentView('matches')}>
                  <Calendar className="w-10 h-10 text-emerald-600 mx-auto mb-6" />
                  <h3 className="text-2xl font-black mb-3">المباريات</h3>
               </div>
               <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 hover:scale-105 transition-transform cursor-pointer group" onClick={() => setCurrentView('live')}>
                  <Radio className="w-10 h-10 text-rose-600 mx-auto mb-6" />
                  <h3 className="text-2xl font-black mb-3">البث المباشر</h3>
               </div>
            </div>
            
            <section className="py-20 text-right">
               <h2 className="text-4xl font-black mb-10 text-slate-900 flex items-center gap-4 justify-end">النخبة المشاركة <Users className="text-blue-600" /></h2>
               <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
                  {allTeams.map(team => (
                    <div key={team.id} className="text-center group cursor-pointer" onClick={() => navigateToProfile(team)}>
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
    <div className="max-w-md mx-auto py-24 px-6 text-center">
       <div className="bg-white rounded-[3.5rem] p-12 shadow-2xl border border-slate-100">
          <h3 className="text-3xl font-black mb-10 text-slate-900">دخول النادي</h3>
          <form onSubmit={async (e) => { e.preventDefault(); const t = e.target as any; const { data, error } = await FirebaseService.loginTeam(t[0].value, t[1].value); if (error) alert(error); else { setCurrentUser(data); localStorage.setItem(SESSION_KEY, data.id!); setViewedTeam(data); setCurrentView('profile'); fetchData(true); } }} className="space-y-5">
            <input type="email" placeholder="البريد الإلكتروني" className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-right" />
            <input type="password" placeholder="كلمة المرور" className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-right" />
            <button type="submit" className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl hover:bg-blue-700 transition-all">تأكيد الدخول</button>
          </form>
       </div>
    </div>
  );

  const RegisterView = () => (
    <div className="max-w-md mx-auto py-24 px-6 text-center">
       <div className="bg-white rounded-[3.5rem] p-12 shadow-2xl border border-slate-100">
          <h3 className="text-3xl font-black mb-10 text-slate-900">تسجيل فريق جديد</h3>
          <form onSubmit={async (e) => { e.preventDefault(); const t = e.target as any; const res = await FirebaseService.registerTeam({ team_name: t[0].value, coach_name: t[1].value, contact_email: t[2].value, password: t[3].value, region: t[4].value }); if (res.error) alert(res.error); else { alert('تم التسجيل بنجاح!'); setCurrentView('login'); fetchData(true); } }} className="space-y-4">
            <input placeholder="اسم الفريق" className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-right outline-none" />
            <input placeholder="اسم المدرب" className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-right outline-none" />
            <input type="email" placeholder="البريد الإلكتروني" className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-right outline-none" />
            <input type="password" placeholder="كلمة المرور" className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-right outline-none" />
            <input placeholder="الولاية / المنطقة" className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-right outline-none" />
            <button type="submit" className="w-full py-5 bg-slate-900 text-white font-black rounded-2xl shadow-xl hover:bg-black transition-all">إرسال طلب الانضمام</button>
          </form>
       </div>
    </div>
  );

  const AdminLoginView = () => (
    <div className="max-w-md mx-auto py-24 px-6 text-center">
      <div className="bg-slate-900 rounded-[3.5rem] p-12 shadow-2xl border border-slate-800 text-white">
        <h3 className="text-3xl font-black mb-10">بوابة المشرف السرية</h3>
        <form onSubmit={async (e) => { e.preventDefault(); const t = e.target as any; if (t[0].value === ADMIN_CREDS.email && t[1].value === ADMIN_CREDS.pass) { setIsAdmin(true); localStorage.setItem(ADMIN_KEY, 'true'); setCurrentView('admin'); fetchData(true); } else alert("خطأ في البيانات السرية."); }} className="space-y-5">
          <input type="email" placeholder="البريد السري" className="w-full p-5 bg-slate-800 border border-slate-700 rounded-2xl outline-none font-bold text-right" />
          <input type="password" placeholder="كلمة المرور" className="w-full p-5 bg-slate-800 border border-slate-700 rounded-2xl outline-none font-bold text-right" />
          <button type="submit" className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl hover:bg-blue-700 transition-all">دخول لوحة التحكم</button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-right selection:bg-blue-600 selection:text-white" dir="rtl">
      <nav className="bg-white/80 backdrop-blur-xl border-b border-slate-100 sticky top-0 z-50 px-4 md:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2 cursor-pointer group" onClick={() => { setCurrentView('home'); setViewedTeam(null); }}>
               <div className="bg-blue-600 p-2 rounded-2xl shadow-lg shadow-blue-200">
                  <Trophy className="w-6 h-6 text-white" />
               </div>
               <span className="text-2xl font-black italic tracking-tighter">KORA<span className="text-blue-600">DZ</span></span>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
               <button onClick={() => { setCurrentView('hub'); setViewedTeam(null); }} className={`font-black text-xs uppercase transition-all ${currentView === 'hub' ? 'text-blue-600' : 'text-slate-400'}`}>المنصة</button>
               <button onClick={() => { setCurrentView('matches'); setViewedTeam(null); }} className={`font-black text-xs uppercase transition-all ${currentView === 'matches' ? 'text-blue-600' : 'text-slate-400'}`}>المباريات</button>
               <button onClick={() => { setCurrentView('live'); setViewedTeam(null); }} className={`font-black text-xs uppercase transition-all ${currentView === 'live' ? 'text-blue-600' : 'text-slate-400'}`}>البث المباشر</button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {currentUser ? (
               <div className="relative" ref={menuRef}>
                  <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="flex items-center gap-3 bg-white p-1.5 pr-4 rounded-2xl border border-slate-200 shadow-sm">
                    <span className="font-black text-slate-700 hidden sm:block text-xs">نادي {currentUser.team_name}</span>
                    <img src={currentUser.logo_url} className="w-10 h-10 rounded-xl object-cover border-2 border-white" />
                  </button>
                  {isUserMenuOpen && (
                    <div className="absolute left-0 mt-3 w-64 bg-white rounded-3xl shadow-2xl border border-slate-100 py-3 z-[60]">
                       <button onClick={() => navigateToProfile(currentUser)} className="w-full flex items-center justify-end gap-3 px-6 py-3 hover:bg-slate-50 transition-colors">
                          <span className="font-bold text-slate-700">الملف الشخصي</span>
                          <User className="w-5 h-5 text-blue-600" />
                       </button>
                       <div className="h-px bg-slate-100 my-2 mx-6" />
                       <button onClick={handleLogout} className="w-full flex items-center justify-end gap-3 px-6 py-3 hover:bg-red-50 text-red-500">
                          <span className="font-bold">تسجيل الخروج</span>
                          <LogOut className="w-5 h-5" />
                       </button>
                    </div>
                  )}
               </div>
            ) : (
               <div className="flex gap-2">
                 <button onClick={() => setCurrentView('login')} className="bg-slate-100 px-6 py-2.5 rounded-2xl font-black text-xs">دخول</button>
                 <button onClick={() => setCurrentView('register')} className="bg-blue-600 text-white px-6 py-2.5 rounded-2xl font-black text-xs">سجل فريقك</button>
               </div>
            )}
            <button onClick={handleSecretClick} className="w-8 h-8 opacity-0" />
          </div>
        </div>
      </nav>

      <main className="min-h-[70vh]">
        {renderContent()}
      </main>

      <footer className="bg-slate-900 text-white py-20 mt-20 text-center">
         <p className="text-slate-500 font-bold">© 2024 جميع الحقوق محفوظة لـ KORA DZ Digital Portal</p>
      </footer>
      
      <div className="lg:hidden fixed bottom-6 left-6 right-6 z-[100]">
         <div className="bg-slate-900/90 backdrop-blur-2xl border border-white/10 h-20 rounded-[2.5rem] shadow-2xl flex items-center justify-around px-4">
            <button onClick={() => { setCurrentView('home'); setViewedTeam(null); }} className={`flex flex-col items-center gap-1 transition-all ${currentView === 'home' ? 'text-blue-400' : 'text-slate-500'}`}><Home className="w-6 h-6" /><span className="text-[9px] font-black uppercase">الرئيسية</span></button>
            <button onClick={() => { setCurrentView('hub'); setViewedTeam(null); }} className={`flex flex-col items-center gap-1 transition-all ${currentView === 'hub' ? 'text-blue-400' : 'text-slate-500'}`}><LayoutGrid className="w-6 h-6" /><span className="text-[9px] font-black uppercase">الملتقى</span></button>
            <button onClick={() => { setCurrentView('matches'); setViewedTeam(null); }} className={`flex flex-col items-center gap-1 transition-all ${currentView === 'matches' ? 'text-blue-400' : 'text-slate-500'}`}><Calendar className="w-6 h-6" /><span className="text-[9px] font-black uppercase">المباريات</span></button>
            {currentUser && <button onClick={() => navigateToProfile(currentUser)} className={`flex flex-col items-center gap-1 transition-all ${currentView === 'profile' && viewedTeam?.id === currentUser.id ? 'text-blue-400' : 'text-slate-500'}`}><User className="w-6 h-6" /><span className="text-[9px] font-black uppercase">نادينا</span></button>}
         </div>
      </div>
    </div>
  );
}
