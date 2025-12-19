
import React, { useState, useEffect, useRef } from 'react';
import { FirebaseService } from './services/firebase';
import { TeamRegistration, LiveChannel, Post, Comment } from './types';
import { 
  Trophy, Shield, Loader2, Radio, ExternalLink, RefreshCw, LogOut, Save, Copy, Check, User, 
  LayoutGrid, Image as ImageIcon, Send, MapPin, Users, Plus, Hash, Edit3, Camera, Heart, 
  MessageSquare, ChevronDown, Settings, Upload, X, Share2, Flame, Bell, Star, Zap, MessageCircle,
  Medal, Target, Activity, Calendar, Home, Menu
} from 'lucide-react';

type ViewState = 'home' | 'profile' | 'live' | 'hub' | 'login' | 'register';

const SESSION_KEY = 'kora_logged_team_id';

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

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>('home');
  const [user, setUser] = useState<TeamRegistration | null>(null);
  const [liveChannels, setLiveChannels] = useState<LiveChannel[]>([]);
  const [allTeams, setAllTeams] = useState<TeamRegistration[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [permissionError, setPermissionError] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const compressImage = (base64Str: string, maxWidth = 800, maxHeight = 800): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);
        }
        resolve(canvas.toDataURL('image/jpeg', 0.5));
      };
    });
  };

  const fetchData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);
    setPermissionError(false);
    try {
      const savedTeamId = localStorage.getItem(SESSION_KEY);
      if (savedTeamId && !user) {
        const teamData = await FirebaseService.getTeamById(savedTeamId);
        if (teamData) setUser(teamData);
      }

      const [channels, teams, hubPosts] = await Promise.all([
        FirebaseService.getLiveChannels(),
        FirebaseService.getAllTeams(),
        FirebaseService.getPosts()
      ]);
      setLiveChannels(channels);
      setAllTeams(teams);
      setPosts(hubPosts);
    } catch (err: any) {
      if (err.message === "PERMISSION_DENIED") setPermissionError(true);
    } finally {
      if (!silent) setIsLoading(false);
      else setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
    setCurrentView('home');
    setIsUserMenuOpen(false);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const PostCard: React.FC<{ post: Post; currentUser: TeamRegistration | null; onRefresh: () => void }> = ({ post, currentUser, onRefresh }) => {
    const [showComments, setShowComments] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);
    const isLiked = currentUser ? post.likes?.includes(currentUser.id!) : false;

    const handleLike = async () => {
      if (!currentUser || !post.id) return;
      await FirebaseService.toggleLike(post.id, currentUser.id!, isLiked || false);
      onRefresh();
    };

    const handleComment = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!currentUser || !commentText.trim() || !post.id) return;
      setIsSubmittingComment(true);
      const newComment: Comment = {
        id: Date.now().toString(),
        teamId: currentUser.id!,
        teamName: currentUser.team_name,
        teamLogo: currentUser.logo_url!,
        text: commentText,
        created_at: new Date()
      };
      await FirebaseService.addComment(post.id, newComment);
      setCommentText('');
      setIsSubmittingComment(false);
      onRefresh();
    };

    const formatTimestamp = (ts: any) => {
      if (!ts) return '';
      const date = ts.toDate ? ts.toDate() : new Date(ts);
      return date.toLocaleString('ar-DZ', { 
        year: 'numeric', month: 'short', day: 'numeric', 
        hour: '2-digit', minute: '2-digit' 
      });
    };

    return (
      <div className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] shadow-[0_10px_30px_rgba(0,0,0,0.04)] border border-slate-100/50 overflow-hidden hover:shadow-[0_20px_50px_rgba(37,99,235,0.06)] transition-all duration-500 group animate-in slide-in-from-bottom-6 mx-0 md:mx-0">
        <div className="p-5 md:p-8">
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <div className="flex items-center gap-3 md:gap-5 text-right">
              <div className="order-2 text-right">
                <div className="flex items-center gap-1.5">
                   <h4 className="font-black text-base md:text-xl text-slate-900 group-hover:text-blue-600 transition-colors truncate max-w-[150px] md:max-w-none">{post.teamName}</h4>
                   <Check className="w-3.5 h-3.5 text-blue-500 fill-blue-500/10 shrink-0" />
                </div>
                <p className="text-[9px] md:text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5 flex items-center gap-1 justify-end">
                   {formatTimestamp(post.created_at)}
                </p>
              </div>
              <div className="relative order-1 shrink-0">
                <img src={post.teamLogo} className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl shadow-sm border-2 border-slate-50 object-cover group-hover:scale-105 transition-transform" />
                <div className="absolute -bottom-1 -right-1 bg-blue-600 p-0.5 md:p-1 rounded-lg border-2 border-white">
                   <Star className="w-2 md:w-2.5 h-2 md:h-2.5 text-white fill-white" />
                </div>
              </div>
            </div>
          </div>

          {post.content && (
            <div className="relative mb-6 md:mb-8 px-2 md:px-0">
               <p className="text-slate-700 text-base md:text-[1.1rem] leading-[1.6] md:leading-[1.8] font-medium pr-4 md:pr-6 border-r-[4px] md:border-r-[5px] border-blue-500/10 text-right whitespace-pre-wrap">
                 {post.content}
               </p>
            </div>
          )}

          {post.imageUrl && (
            <div className="rounded-[1.2rem] md:rounded-[2rem] overflow-hidden border-2 md:border-4 border-slate-50 shadow-sm mb-6 md:mb-8 bg-slate-50">
              <img src={post.imageUrl} className="w-full max-h-[400px] md:max-h-[600px] object-cover" loading="lazy" />
            </div>
          )}

          <div className="pt-4 md:pt-6 border-t border-slate-50/80 flex items-center justify-between px-2">
            <div className="flex items-center gap-6 md:gap-8">
              <button 
                onClick={handleLike} 
                disabled={!currentUser} 
                className={`flex items-center gap-2 font-black transition-all transform active:scale-90 ${isLiked ? 'text-rose-500' : 'text-slate-400 hover:text-rose-500'}`}
              >
                <div className={`p-2 md:p-2.5 rounded-xl transition-colors ${isLiked ? 'bg-rose-50' : 'bg-slate-50 group-hover:bg-rose-50'}`}>
                  <Heart className={`w-4 h-4 md:w-5 md:h-5 ${isLiked ? 'fill-current' : ''}`} />
                </div>
                <span className="text-xs md:text-sm">{post.likes?.length || 0}</span>
              </button>
              
              <button 
                onClick={() => setShowComments(!showComments)} 
                className="flex items-center gap-2 text-slate-400 font-black hover:text-blue-600 transition-all group/btn"
              >
                <div className="p-2 md:p-2.5 rounded-xl bg-slate-50 group-hover/btn:bg-blue-50 transition-colors">
                   <MessageSquare className="w-4 h-4 md:w-5 md:h-5" />
                </div>
                <span className="text-xs md:text-sm">{post.comments?.length || 0}</span>
              </button>
            </div>
            
            <button className="p-2 md:p-2.5 rounded-xl bg-slate-50 text-slate-300 hover:text-blue-600 transition-all">
               <Share2 className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>

          {showComments && (
            <div className="mt-6 md:mt-8 pt-6 md:pt-8 border-t border-slate-50 space-y-4 md:space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="max-h-[300px] md:max-h-[400px] overflow-y-auto space-y-4 md:space-y-6 pr-1 md:pr-2 custom-scrollbar">
                {post.comments?.map((comment) => (
                  <div key={comment.id} className="flex gap-3 md:gap-4 text-right">
                    <div className="flex-1 bg-slate-50/80 p-3 md:p-5 rounded-[1.2rem] md:rounded-[1.5rem] border border-slate-100/50 text-right">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[8px] md:text-[10px] text-slate-400 font-bold uppercase">{formatTimestamp(comment.created_at)}</span>
                        <p className="font-black text-xs md:text-sm text-slate-900">{comment.teamName}</p>
                      </div>
                      <p className="text-xs md:text-sm text-slate-600 font-medium leading-relaxed">{comment.text}</p>
                    </div>
                    <img src={comment.teamLogo} className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl object-cover shadow-sm shrink-0" />
                  </div>
                ))}
              </div>
              
              {currentUser && (
                <form onSubmit={handleComment} className="flex gap-2 pt-4 border-t border-slate-50">
                  <button 
                    type="submit" 
                    disabled={isSubmittingComment || !commentText.trim()} 
                    className="bg-blue-600 text-white p-3 md:p-4 rounded-[1rem] font-black shadow-lg disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center shrink-0"
                  >
                    {isSubmittingComment ? <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" /> : <Send className="w-4 h-4 md:w-5 md:h-5" />}
                  </button>
                  <input 
                    value={commentText} 
                    onChange={(e) => setCommentText(e.target.value)} 
                    placeholder="أضف تعليقاً..." 
                    className="flex-1 bg-slate-50 p-3 md:p-4 rounded-[1rem] border border-slate-100 outline-none text-xs md:text-sm font-bold text-right transition-all focus:bg-white" 
                  />
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const ProfileView = () => {
    if (!user) return null;
    const [editMode, setEditMode] = useState(false);
    const [profileData, setProfileData] = useState({...user});
    const [isSaving, setIsSaving] = useState(false);
    const logoInputRef = useRef<HTMLInputElement>(null);
    const galleryInputRef = useRef<HTMLInputElement>(null);

    const handleUpdate = async () => {
      if (!user.id) return;
      setIsSaving(true);
      let finalLogo = profileData.logo_url;
      if (finalLogo && finalLogo.startsWith('data:image')) {
        finalLogo = await compressImage(finalLogo, 300, 300);
      }
      const res = await FirebaseService.updateTeamProfile(user.id, {
        team_name: profileData.team_name,
        municipality: profileData.municipality,
        players_count: profileData.players_count,
        bio: profileData.bio,
        logo_url: finalLogo
      });
      setIsSaving(false);
      if (!res.error) {
        setUser({...user, ...profileData, logo_url: finalLogo});
        setEditMode(false);
        fetchData(true);
      }
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        try {
          const base64 = await fileToBase64(file);
          const compressed = await compressImage(base64, 300, 300);
          setProfileData(prev => ({ ...prev, logo_url: compressed }));
        } catch (err) { console.error(err); }
      }
    };

    const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0 && user.id) {
        setIsSaving(true);
        try {
          const fileArray = Array.from(files) as File[];
          for (const file of fileArray) {
            const base64 = await fileToBase64(file);
            const compressed = await compressImage(base64);
            await FirebaseService.addToGallery(user.id, compressed);
          }
          await fetchData(true);
        } catch (err) { alert("خطأ في رفع الصور"); } finally { setIsSaving(false); }
      }
    };

    const handleShareGalleryImage = async (imgUrl: string) => {
      if (!user) return;
      setIsSaving(true);
      try {
        await FirebaseService.createPost({
          teamId: user.id!,
          teamName: user.team_name,
          teamLogo: user.logo_url!,
          content: 'شارك صورة من ألبوم الفريق 🏆',
          imageUrl: imgUrl
        });
        setCurrentView('hub');
        await fetchData(true);
      } finally { setIsSaving(false); }
    };

    return (
      <div className="max-w-7xl mx-auto py-6 md:py-12 px-4 md:px-6 animate-in fade-in zoom-in duration-700 pb-24 md:pb-12">
        {/* Hero Section */}
        <div className="relative mb-12 md:mb-16">
          <div className="h-64 md:h-96 w-full rounded-[2rem] md:rounded-[4rem] bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 overflow-hidden relative shadow-2xl">
             <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
             <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
             
             {/* Stats Over Banner - Hidden on Mobile to avoid clutter */}
             <div className="absolute top-6 left-6 hidden md:flex gap-4">
                <div className="bg-white/10 backdrop-blur-xl px-6 py-4 rounded-3xl border border-white/20 text-center">
                   <p className="text-[10px] font-black text-blue-300 uppercase mb-1">المركز الحالي</p>
                   <p className="text-xl font-black text-white italic">#12</p>
                </div>
             </div>

             {/* Profile Header Contents */}
             <div className="absolute -bottom-16 md:-bottom-10 right-1/2 translate-x-1/2 md:translate-x-0 md:right-16 flex flex-col md:flex-row items-center gap-6 md:gap-10 z-20 w-full md:w-auto">
                <div className="relative group shrink-0">
                   <div className="absolute -inset-2 bg-gradient-to-tr from-blue-600 to-indigo-400 rounded-[2rem] md:rounded-[3.5rem] blur-xl opacity-50 transition-opacity"></div>
                   <img src={profileData.logo_url} className="w-40 h-40 md:w-56 md:h-56 rounded-[2.5rem] md:rounded-[3.5rem] border-[8px] md:border-[12px] border-white shadow-2xl bg-white object-cover relative z-10" />
                   <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
                   <button 
                     onClick={() => logoInputRef.current?.click()} 
                     className="absolute bottom-2 left-2 md:bottom-4 md:left-4 bg-blue-600 p-3 md:p-4 rounded-xl md:rounded-2xl text-white shadow-xl hover:scale-110 transition-all z-30 border-2 md:border-4 border-white"
                   >
                     <Camera className="w-5 h-5 md:w-6 md:h-6" />
                   </button>
                </div>
                <div className="mb-4 md:mb-14 text-center md:text-right w-full px-4">
                  <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 mb-3 justify-center md:justify-end">
                     <div className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-[10px] md:text-xs font-black flex items-center gap-1.5 border border-emerald-500/30">
                        <Activity className="w-3 h-3 md:w-3.5 md:h-3.5" /> فريق نشط
                     </div>
                     <h2 className="text-3xl md:text-6xl font-black text-white md:text-white drop-shadow-2xl tracking-tighter italic leading-tight">نادي {user.team_name}</h2>
                  </div>
                  <div className="flex items-center gap-3 justify-center md:justify-end">
                    <p className="text-blue-100 font-bold flex items-center gap-1.5 text-base md:text-xl opacity-90">{user.municipality} <MapPin className="w-4 h-4 md:w-6 md:h-6 text-blue-400" /></p>
                    <div className="w-1.5 h-1.5 bg-blue-400/50 rounded-full"></div>
                    <p className="text-blue-100/60 font-bold text-sm md:text-lg">تأسس {new Date(user.created_at?.seconds * 1000).getFullYear() || 2024}</p>
                  </div>
                </div>
             </div>
          </div>
          
          <div className="absolute top-6 right-6 flex gap-4 z-30">
             <button 
               onClick={() => setEditMode(!editMode)} 
               className={`p-3 md:px-10 md:py-5 rounded-2xl md:rounded-[2rem] font-black flex items-center gap-3 transition-all shadow-2xl border ${editMode ? 'bg-rose-600 text-white border-rose-500' : 'bg-white/10 backdrop-blur-md text-white border-white/20 hover:bg-white/20'}`}
             >
               {editMode ? <X className="w-5 h-5 md:w-6 md:h-6" /> : <Edit3 className="w-5 h-5 md:w-6 md:h-6" />}
               <span className="hidden md:inline">{editMode ? 'إلغاء' : 'تعديل البيانات'}</span>
             </button>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 mt-20 md:mt-24">
           {/* Sidebar */}
           <div className="lg:col-span-4 space-y-8 md:space-y-10">
              {/* Scoreboard Card */}
              <div className="bg-slate-900 rounded-[2rem] md:rounded-[3.5rem] p-6 md:p-10 shadow-2xl text-white relative overflow-hidden group">
                 <h3 className="text-lg md:text-2xl font-black mb-8 md:mb-12 flex items-center gap-3 justify-end">
                    سجل الانتصارات
                    <Target className="text-rose-500 w-6 h-6 md:w-8 md:h-8" />
                 </h3>
                 <div className="grid grid-cols-2 gap-4 md:gap-8 relative z-10">
                    <div className="bg-white/5 p-4 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-white/10 text-center">
                       <span className="text-3xl md:text-5xl font-black text-emerald-400 block mb-1">{user.wins || 0}</span>
                       <p className="text-[8px] md:text-[10px] text-slate-400 font-black uppercase tracking-widest">فوز</p>
                    </div>
                    <div className="bg-white/5 p-4 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border border-white/10 text-center">
                       <span className="text-3xl md:text-5xl font-black text-rose-500 block mb-1">{user.losses || 0}</span>
                       <p className="text-[8px] md:text-[10px] text-slate-400 font-black uppercase tracking-widest">خسارة</p>
                    </div>
                 </div>
              </div>

              {/* Details Card */}
              <div className="bg-white rounded-[2rem] md:rounded-[3.5rem] p-6 md:p-10 border border-slate-100 shadow-xl text-right">
                 <h3 className="text-lg md:text-2xl font-black text-slate-900 mb-8 md:mb-10 flex items-center gap-3 justify-end">
                    هوية النادي
                    <Shield className="text-blue-600 w-6 h-6 md:w-8 md:h-8" />
                 </h3>
                 {editMode ? (
                   <div className="space-y-4 md:space-y-6">
                     <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase pr-2">اسم الفريق</label>
                        <input value={profileData.team_name} onChange={e => setProfileData({...profileData, team_name: e.target.value})} className="w-full p-4 md:p-6 bg-slate-50 border border-slate-100 rounded-2xl md:rounded-3xl outline-none font-bold text-right text-sm md:text-base" />
                     </div>
                     <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-slate-400 uppercase pr-2">اللاعبين</label>
                          <input type="number" value={profileData.players_count} onChange={e => setProfileData({...profileData, players_count: parseInt(e.target.value)})} className="w-full p-4 md:p-6 bg-slate-50 border border-slate-100 rounded-2xl md:rounded-3xl outline-none font-bold text-right text-sm" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-slate-400 uppercase pr-2">البلدية</label>
                          <input value={profileData.municipality} onChange={e => setProfileData({...profileData, municipality: e.target.value})} className="w-full p-4 md:p-6 bg-slate-50 border border-slate-100 rounded-2xl md:rounded-3xl outline-none font-bold text-right text-sm" />
                        </div>
                     </div>
                     <textarea value={profileData.bio} onChange={e => setProfileData({...profileData, bio: e.target.value})} className="w-full p-4 md:p-6 bg-slate-50 border border-slate-100 rounded-2xl md:rounded-3xl outline-none h-32 md:h-40 resize-none font-medium text-right text-sm" placeholder="نبذة النادي..." />
                     <button onClick={handleUpdate} disabled={isSaving} className="w-full py-4 md:py-6 bg-blue-600 text-white rounded-[1.5rem] md:rounded-[2rem] font-black shadow-xl hover:bg-blue-700 flex items-center justify-center gap-3 text-base md:text-xl transition-all">
                       {isSaving ? <Loader2 className="w-5 h-5 md:w-6 md:h-6 animate-spin" /> : <Save className="w-5 h-5 md:w-6 md:h-6" />}
                       حفظ البيانات
                     </button>
                   </div>
                 ) : (
                   <div className="space-y-6 md:space-y-8">
                      <div className="flex items-center justify-between p-4 md:p-8 bg-slate-50 rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-100">
                         <div className="text-right"><p className="text-xl md:text-2xl font-black text-slate-900">{user.players_count || 0}</p><p className="text-[8px] md:text-[10px] text-slate-400 font-bold uppercase">لاعب</p></div>
                         <div className="p-3 md:p-4 bg-blue-600 text-white rounded-xl md:rounded-2xl shrink-0"><Users className="w-5 h-5 md:w-7 md:h-7" /></div>
                      </div>
                      <div className="p-5 md:p-8 bg-slate-50 rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-100 relative text-right">
                         <p className="text-slate-600 font-medium italic text-base md:text-xl leading-relaxed pr-2">
                            "{user.bio || 'نادي رياضي طموح.'}"
                         </p>
                      </div>
                   </div>
                 )}
              </div>
           </div>

           {/* Gallery Content */}
           <div className="lg:col-span-8 space-y-8 md:space-y-12">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8 bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[3.5rem] border border-slate-100 shadow-xl">
                 <div className="text-center md:text-right w-full md:w-auto">
                    <h3 className="text-xl md:text-3xl font-black text-slate-900 italic tracking-tighter mb-1 flex items-center gap-3 justify-center md:justify-end">
                       ألبوم الذكريات
                       <ImageIcon className="text-blue-600 w-7 h-7 md:w-10 md:h-10" />
                    </h3>
                    <p className="text-slate-400 font-bold text-sm">أجمل لحظات فريقك</p>
                 </div>
                 <div className="w-full md:w-auto">
                    <input type="file" ref={galleryInputRef} multiple className="hidden" accept="image/*" onChange={handleGalleryUpload} />
                    <button 
                      onClick={() => galleryInputRef.current?.click()} 
                      disabled={isSaving} 
                      className="w-full md:w-auto bg-slate-900 text-white px-8 md:px-12 py-4 md:py-5 rounded-2xl md:rounded-[1.5rem] hover:bg-blue-600 transition-all flex items-center justify-center gap-3 font-black shadow-xl"
                    >
                      {isSaving ? <Loader2 className="w-5 h-5 md:w-6 md:h-6 animate-spin" /> : <Upload className="w-5 h-5 md:w-6 md:h-6" />}
                      رفع صور
                    </button>
                 </div>
              </div>

              {user.gallery && user.gallery.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-10">
                   {user.gallery.map((img, i) => (
                     <div key={i} className="aspect-square md:aspect-[4/5] rounded-[1.5rem] md:rounded-[3rem] overflow-hidden border-[6px] md:border-[10px] border-white shadow-xl group relative cursor-pointer bg-slate-100">
                        <img src={img} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
                           <button 
                             onClick={() => handleShareGalleryImage(img)} 
                             className="bg-white text-blue-600 p-3 md:px-6 md:py-3 rounded-xl md:rounded-2xl shadow-2xl font-black flex items-center gap-2 text-[10px] md:text-sm"
                           >
                             <Share2 className="w-4 h-4" />
                             <span className="hidden md:inline">مشاركة</span>
                           </button>
                        </div>
                     </div>
                   ))}
                </div>
              ) : (
                <div className="py-20 md:py-40 text-center bg-white rounded-[2rem] md:rounded-[4rem] border-4 border-dashed border-slate-100 shadow-inner">
                   <ImageIcon className="w-16 h-16 md:w-24 md:h-24 text-slate-200 mx-auto mb-6" />
                   <h3 className="text-xl md:text-3xl font-black text-slate-300">الألبوم فارغ</h3>
                </div>
              )}
           </div>
        </div>
      </div>
    );
  };

  const HubView = () => {
    const [newPostContent, setNewPostContent] = useState('');
    const [newPostImage, setNewPostImage] = useState('');
    const [postCategory, setPostCategory] = useState<'news' | 'result' | 'challenge' | 'general'>('general');
    const [isPosting, setIsPosting] = useState(false);
    const [isProcessingImage, setIsProcessingImage] = useState(false);
    const postImageInputRef = useRef<HTMLInputElement>(null);

    const handlePost = async () => {
      const trimmedContent = newPostContent.trim();
      if (!user || (!trimmedContent && !newPostImage)) return;
      setIsPosting(true);
      try {
        const postPayload: any = {
          teamId: user.id!,
          teamName: user.team_name,
          teamLogo: user.logo_url!,
        };
        
        let finalContent = trimmedContent;
        if (postCategory === 'news') finalContent = `📢 [عاجل]\n${finalContent}`;
        if (postCategory === 'result') finalContent = `⚽ [نتيجة]\n${finalContent}`;
        if (postCategory === 'challenge') finalContent = `⚔️ [تحدي]\n${finalContent}`;
        
        if (finalContent) postPayload.content = finalContent;
        if (newPostImage) postPayload.imageUrl = newPostImage;
        
        await FirebaseService.createPost(postPayload);
        setNewPostContent('');
        setNewPostImage('');
        setPostCategory('general');
        await fetchData(true);
      } catch (err: any) {
        alert("فشل النشر: حاول تقليل حجم الصورة");
      } finally { setIsPosting(false); }
    };

    const handlePostImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setIsProcessingImage(true);
        try {
          const base64 = await fileToBase64(file);
          const compressed = await compressImage(base64, 800, 800);
          setNewPostImage(compressed);
        } catch (err) { alert("خطأ في معالجة الصورة"); } finally { setIsProcessingImage(false); }
      }
    };

    return (
      <div className="max-w-4xl mx-auto py-8 md:py-12 px-4 md:px-6 animate-in fade-in duration-1000 pb-24 md:pb-12">
        <div className="flex flex-col items-center mb-10 md:mb-16 text-center">
           <div className="p-3 md:p-4 bg-blue-600/5 rounded-full mb-4 md:mb-6 animate-bounce">
              <Hash className="text-blue-600 w-8 h-8 md:w-12 md:h-12" />
           </div>
           <h2 className="text-3xl md:text-5xl font-black text-slate-900 italic tracking-tighter mb-3">ملتقى الفرق</h2>
           <p className="text-slate-400 font-bold max-w-sm text-sm md:text-base px-4">آخر أخبار الأندية والنتائج في قلب البطولة.</p>
        </div>

        {user ? (
          <div className="bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-xl border border-slate-100 mb-12 md:mb-20 relative overflow-hidden transition-all">
            <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-400"></div>
            
            <div className="flex flex-col gap-6 md:gap-8">
              <div className="flex items-center gap-3 md:gap-5 justify-end">
                <div className="text-right">
                  <h4 className="font-black text-sm md:text-lg text-slate-900">{user.team_name}</h4>
                  <p className="text-[10px] md:text-xs text-blue-500 font-bold">انشر تحديثاً جديداً</p>
                </div>
                <img src={user.logo_url} className="w-12 h-12 md:w-16 md:h-16 rounded-2xl shadow-lg border-2 border-white object-cover" />
              </div>

              <div className="relative group">
                <textarea 
                  value={newPostContent} 
                  onChange={e => setNewPostContent(e.target.value)} 
                  placeholder="ما الجديد في فريقك؟" 
                  className="w-full p-4 md:p-8 bg-slate-50 border-none rounded-[1.5rem] md:rounded-[2rem] outline-none focus:ring-4 ring-blue-500/5 resize-none h-32 md:h-48 text-base md:text-xl font-medium text-right transition-all focus:bg-white" 
                />
                <div className="flex flex-wrap items-center gap-2 mt-3 justify-end px-2">
                   <button onClick={() => setPostCategory('news')} className={`px-4 py-2 rounded-xl transition-all text-[10px] md:text-xs font-bold ${postCategory === 'news' ? 'bg-amber-500 text-white shadow-md' : 'bg-slate-50 text-slate-400'}`}>أخبار</button>
                   <button onClick={() => setPostCategory('result')} className={`px-4 py-2 rounded-xl transition-all text-[10px] md:text-xs font-bold ${postCategory === 'result' ? 'bg-emerald-500 text-white shadow-md' : 'bg-slate-50 text-slate-400'}`}>نتيجة</button>
                   <button onClick={() => setPostCategory('challenge')} className={`px-4 py-2 rounded-xl transition-all text-[10px] md:text-xs font-bold ${postCategory === 'challenge' ? 'bg-rose-500 text-white shadow-md' : 'bg-slate-50 text-slate-400'}`}>تحدي</button>
                </div>
              </div>

              {newPostImage && (
                <div className="relative inline-block self-end group">
                  <img src={newPostImage} className="w-32 h-32 md:w-64 md:h-64 rounded-2xl md:rounded-[2rem] object-cover border-4 border-white shadow-xl" />
                  <button onClick={() => setNewPostImage('')} className="absolute -top-3 -right-3 bg-rose-500 text-white p-2 rounded-full shadow-lg hover:scale-110 transition-all">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="flex flex-col md:flex-row items-center gap-4 pt-4 md:pt-6 border-t border-slate-50">
                <button 
                  onClick={handlePost} 
                  disabled={isPosting || isProcessingImage || (!newPostContent.trim() && !newPostImage)} 
                  className="w-full md:w-64 py-4 md:py-5 bg-blue-600 text-white rounded-[1.2rem] md:rounded-[1.5rem] font-black flex items-center justify-center gap-3 hover:bg-blue-700 shadow-xl transition-all text-base md:text-lg"
                >
                  {isPosting ? <Loader2 className="w-5 h-5 md:w-6 md:h-6 animate-spin" /> : <Send className="w-5 h-5 md:w-6 md:h-6" />} نشر الآن
                </button>
                
                <div className="flex-1 w-full">
                  <input type="file" ref={postImageInputRef} className="hidden" accept="image/*" onChange={handlePostImageUpload} />
                  <button 
                    onClick={() => postImageInputRef.current?.click()} 
                    className="w-full h-14 md:h-[68px] px-6 md:px-8 bg-slate-50 rounded-[1.2rem] md:rounded-[1.5rem] text-xs md:text-sm font-black text-slate-500 flex items-center gap-3 transition-all justify-end"
                  >
                    <span>إرفاق لقطة مباراة</span>
                    <ImageIcon className="w-5 h-5 md:w-6 md:h-6" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900 text-white p-10 md:p-16 rounded-[2.5rem] md:rounded-[4rem] shadow-2xl text-center mb-12 md:mb-20">
              <h3 className="text-2xl md:text-4xl font-black mb-4 italic">شاركنا أمجاد فريقك!</h3>
              <p className="text-slate-400 mb-8 md:mb-12 text-sm md:text-xl max-w-xs mx-auto">سجل دخولك الآن لتتمكن من النشر والتفاعل.</p>
              <button onClick={() => setCurrentView('login')} className="w-full md:w-auto px-12 py-4 md:py-5 bg-blue-600 text-white rounded-2xl font-black shadow-2xl hover:scale-105 transition-transform text-base md:text-lg">سجل دخولك</button>
          </div>
        )}

        <div className="space-y-10 md:space-y-16 pb-12">
          {posts.map(post => <PostCard key={post.id} post={post} currentUser={user} onRefresh={() => fetchData(true)} />)}
          {posts.length === 0 && <div className="py-20 text-center text-slate-300 font-black">لا توجد منشورات حتى الآن</div>}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (isLoading) return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-6 text-center px-6">
        <div className="relative">
           <div className="w-20 h-20 md:w-24 md:h-24 border-8 border-blue-600/10 border-t-blue-600 rounded-full animate-spin"></div>
           <Trophy className="w-8 h-8 md:w-10 md:h-10 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
        </div>
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-800">جاري تحميل البيانات</h2>
          <p className="text-slate-400 font-bold mt-1 text-sm md:text-base">لحظات ونكون جاهزين...</p>
        </div>
      </div>
    );
    if (permissionError) return <PermissionAlert />;
    switch (currentView) {
      case 'profile': return <ProfileView />;
      case 'hub': return <HubView />;
      case 'live': return (
        <div className="max-w-7xl mx-auto py-10 md:py-16 px-4 md:px-6 pb-24 md:pb-12">
          <h2 className="text-3xl md:text-4xl font-black flex items-center gap-3 italic mb-10 md:mb-16 justify-end">قنوات البث المباشر <Radio className="text-red-600 animate-pulse w-8 h-8 md:w-10 md:h-10" /></h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
            {liveChannels.map(ch => (
              <div key={ch.id} className="bg-white rounded-[2rem] md:rounded-[3.5rem] border border-slate-100 p-5 md:p-6 shadow-xl relative text-right transition-all">
                <div className="h-48 md:h-56 w-full relative mb-5 md:mb-6 rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden bg-slate-100">
                  <img src={ch.thumbnail_url} className="w-full h-full object-cover" />
                  <div className="absolute top-3 right-3 bg-red-600 text-white px-2.5 py-1 rounded-full text-[9px] font-black uppercase flex items-center gap-1">مباشر</div>
                </div>
                <h4 className="font-black text-xl md:text-2xl mb-4 text-slate-800 pr-2 truncate">{ch.name}</h4>
                <button onClick={() => window.open(ch.stream_url, '_blank')} className="w-full py-4 md:py-5 bg-slate-900 text-white rounded-2xl font-black hover:bg-blue-600 flex items-center justify-center gap-2 shadow-xl transition-all">شاهد الآن <ExternalLink className="w-4 h-4 md:w-5 md:h-5" /></button>
              </div>
            ))}
          </div>
          {liveChannels.length === 0 && <p className="text-center text-slate-400 font-bold py-20">لا توجد قنوات نشطة حالياً</p>}
        </div>
      );
      case 'login': return (
        <div className="max-w-md mx-auto py-12 md:py-24 px-6 pb-24 md:pb-12">
          <div className="bg-white rounded-[2.5rem] md:rounded-[3.5rem] p-8 md:p-12 shadow-2xl border border-slate-100 text-center">
            <div className="bg-blue-600 w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-3xl mx-auto mb-8 flex items-center justify-center shadow-xl rotate-3"><Trophy className="w-8 h-8 md:w-10 md:h-10 text-white" /></div>
            <h3 className="text-2xl md:text-3xl font-black mb-10 text-slate-900 italic tracking-tight">دخول النادي</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const target = e.target as any;
              const { data, error } = await FirebaseService.loginTeam(target[0].value, target[1].value);
              if (error) alert(error);
              else { 
                setUser(data); 
                localStorage.setItem(SESSION_KEY, data.id!);
                setCurrentView('profile'); 
                fetchData(true); 
              }
            }} className="space-y-4 md:space-y-5">
              <input type="email" required placeholder="البريد الإلكتروني" className="w-full p-4 md:p-5 bg-slate-50 border border-slate-100 rounded-xl md:rounded-2xl outline-none font-bold text-right text-sm" />
              <input type="password" required placeholder="كلمة المرور" className="w-full p-4 md:p-5 bg-slate-50 border border-slate-100 rounded-xl md:rounded-2xl outline-none font-bold text-right text-sm" />
              <button type="submit" className="w-full py-4 md:py-5 bg-blue-600 text-white font-black rounded-xl md:rounded-2xl shadow-xl hover:bg-blue-700 transition-all text-base">تأكيد الدخول</button>
            </form>
          </div>
        </div>
      );
      case 'register': return (
        <div className="max-w-md mx-auto py-12 md:py-24 px-6 pb-24 md:pb-12">
          <div className="bg-white rounded-[2.5rem] md:rounded-[3.5rem] p-8 md:p-12 shadow-2xl border border-slate-100 text-center animate-in zoom-in duration-500">
            <h3 className="text-2xl md:text-3xl font-black mb-8 md:mb-10 text-slate-900 italic text-center">تسجيل فريق جديد</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const target = e.target as any;
              const res = await FirebaseService.registerTeam({
                team_name: target[0].value, coach_name: target[1].value, contact_email: target[2].value, password: target[3].value, region: target[4].value
              });
              if (res.error) alert(res.error);
              else { alert('تم التسجيل بنجاح!'); setCurrentView('login'); fetchData(true); }
            }} className="space-y-4">
              <input required placeholder="اسم الفريق" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl md:rounded-2xl font-bold text-right text-sm" />
              <input required placeholder="اسم المدرب" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl md:rounded-2xl font-bold text-right text-sm" />
              <input type="email" required placeholder="البريد الإلكتروني" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl md:rounded-2xl font-bold text-right text-sm" />
              <input type="password" required placeholder="كلمة المرور" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl md:rounded-2xl font-bold text-right text-sm" />
              <input required placeholder="الولاية/المنطقة" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl md:rounded-2xl font-bold text-right text-sm" />
              <button type="submit" className="w-full py-4 bg-slate-900 text-white font-black rounded-xl md:rounded-2xl shadow-xl transition-all text-base">تقديم الطلب</button>
            </form>
          </div>
        </div>
      );
      default: return (
        <>
          <section className="bg-slate-900 pt-20 md:pt-32 pb-32 md:pb-48 px-4 md:px-6 text-center text-white relative overflow-hidden">
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
             <div className="relative z-10 max-w-5xl mx-auto px-4">
               <div className="inline-block px-4 py-1.5 md:px-6 md:py-2 bg-blue-600/20 backdrop-blur-md rounded-full text-blue-400 font-black text-[9px] md:text-xs uppercase tracking-widest mb-6 md:mb-8 border border-blue-600/30">الموسم الرياضي 2024</div>
               <h1 className="text-4xl sm:text-6xl md:text-8xl lg:text-9xl font-black mb-8 md:mb-10 leading-[1.1] tracking-tighter italic text-center">بوابة البطولة</h1>
               <p className="text-slate-400 text-base md:text-2xl mb-12 md:mb-16 font-light max-w-2xl mx-auto leading-relaxed italic text-center px-4">مجتمع رياضي رقمي متكامل لإدارة الفرق، النتائج، والبث المباشر بأعلى التقنيات.</p>
               <div className="flex flex-col sm:flex-row justify-center gap-4 md:gap-6 px-4">
                 <button onClick={() => setCurrentView('register')} className="w-full sm:w-auto px-10 py-5 md:px-14 md:py-6 bg-blue-600 rounded-2xl md:rounded-[2.5rem] font-black text-lg md:text-xl shadow-2xl shadow-blue-600/20 active:scale-95 transition-all">سجل فريقك</button>
                 <button onClick={() => setCurrentView('hub')} className="w-full sm:w-auto px-10 py-5 md:px-14 md:py-6 bg-white/10 rounded-2xl md:rounded-[2.5rem] font-black text-lg md:text-xl border border-white/20 hover:bg-white/20 transition-all backdrop-blur-md">ملتقى الفرق</button>
               </div>
             </div>
          </section>
          
          <section className="py-20 md:py-32 px-4 md:px-6 bg-white relative">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 md:mb-24 text-center md:text-right px-4">
                <div className="bg-slate-50 px-6 py-3 md:px-8 md:py-4 rounded-2xl md:rounded-3xl border border-slate-100 inline-block self-center md:self-auto"><span className="font-black text-2xl md:text-3xl text-blue-600">{allTeams.length}</span> <span className="text-slate-400 font-bold mr-1">فريق</span></div>
                <div className="text-center md:text-right"><h2 className="text-3xl md:text-5xl font-black text-slate-900 flex items-center gap-3 md:gap-5 italic justify-center md:justify-end">النخبة المشاركة <Users className="text-blue-600 w-8 h-8 md:w-12 md:h-12" /></h2><p className="text-slate-400 font-bold mt-1 text-sm md:text-base">الفرق الرياضية المسجلة رسمياً</p></div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 md:gap-10">
                {allTeams.map(team => (
                  <div key={team.id} className="text-center group cursor-pointer animate-in fade-in duration-500">
                    <div className="relative mx-auto mb-4 md:mb-6">
                      <img src={team.logo_url} className="w-24 h-24 md:w-36 md:h-36 rounded-[2rem] md:rounded-[2.5rem] border-4 border-white shadow-lg md:shadow-xl group-hover:scale-110 transition-all duration-500 bg-white object-cover" />
                      <div className="absolute -bottom-1 -left-1 md:-bottom-2 md:-left-2 bg-emerald-500 w-6 h-6 md:w-8 md:h-8 rounded-xl border-2 md:border-4 border-white shadow-lg"></div>
                    </div>
                    <p className="font-black text-slate-800 text-sm md:text-lg group-hover:text-blue-600 transition-colors truncate px-2">{team.team_name}</p>
                    <p className="text-[8px] md:text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5 bg-slate-50 inline-block px-2 py-1 rounded-full">{team.region}</p>
                  </div>
                ))}
              </div>
              {allTeams.length === 0 && <p className="text-center text-slate-300 font-bold py-12">لا يوجد فرق مسجلة بعد</p>}
            </div>
          </section>
        </>
      );
    }
  };

  return (
    <div className="min-h-screen font-sans selection:bg-blue-600 selection:text-white bg-[#fcfdfe]" dir="rtl">
      {/* Desktop Header */}
      <nav className="bg-white/90 backdrop-blur-xl border-b border-slate-100 py-3 md:py-4 px-4 md:px-12 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2 md:gap-3 font-black text-xl md:text-2xl cursor-pointer hover:scale-105 transition-transform" onClick={() => {setCurrentView('home'); setIsUserMenuOpen(false);}}>
          <div className="bg-blue-600 p-1.5 md:p-2 rounded-xl md:rounded-2xl shadow-lg"><Trophy className="w-5 h-5 md:w-7 md:h-7 text-white" /></div>
          <span className="tracking-tighter italic hidden sm:inline">بوابة البطولة</span>
        </div>
        
        {/* Desktop Links */}
        <div className="hidden lg:flex gap-10 text-[11px] font-black uppercase tracking-widest text-slate-400">
           <button onClick={() => {setCurrentView('home');}} className={`hover:text-blue-600 transition-colors ${currentView === 'home' ? 'text-blue-600' : ''}`}>الرئيسية</button>
           <button onClick={() => {setCurrentView('hub');}} className={`hover:text-blue-600 transition-colors ${currentView === 'hub' ? 'text-blue-600' : ''}`}>الملتقى</button>
           <button onClick={() => {setCurrentView('live');}} className={`hover:text-blue-600 transition-colors ${currentView === 'live' ? 'text-red-600' : ''}`}>مباشر</button>
        </div>

        <div className="flex items-center gap-3 md:gap-5">
          {user ? (
            <div className="relative" ref={menuRef}>
              <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="flex items-center gap-3 p-1 pr-3 md:pr-5 pl-1 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-white hover:shadow-md transition-all">
                <div className="text-right hidden sm:block"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">ناديك</p><p className="text-xs font-black text-slate-900 truncate max-w-[100px]">{user.team_name}</p></div>
                <img src={user.logo_url} className="w-8 h-8 md:w-10 md:h-10 rounded-xl shadow-md border-2 border-white object-cover" />
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {isUserMenuOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 md:w-72 bg-white rounded-[1.5rem] md:rounded-[2rem] shadow-2xl border border-slate-100 p-2 md:p-3 z-[100] text-right">
                  <div className="p-4 mb-2 border-b border-slate-50">
                    <p className="text-sm font-black text-slate-900 truncate">{user.team_name}</p>
                    <p className="text-[10px] text-slate-400 font-bold truncate">{user.contact_email}</p>
                  </div>
                  <div className="space-y-1">
                    <button onClick={() => {setCurrentView('profile'); setIsUserMenuOpen(false);}} className="w-full flex items-center justify-end gap-3 p-3 hover:bg-slate-50 rounded-xl transition-colors text-slate-600 text-sm font-bold">بروفايل النادي <User className="w-4 h-4" /></button>
                    <button onClick={() => {setCurrentView('hub'); setIsUserMenuOpen(false);}} className="w-full flex items-center justify-end gap-3 p-3 hover:bg-slate-50 rounded-xl transition-colors text-slate-600 text-sm font-bold">ملتقى الفرق <Hash className="w-4 h-4 text-blue-500" /></button>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-50">
                    <button onClick={handleLogout} className="w-full flex items-center justify-end gap-3 p-3 hover:bg-red-50 rounded-xl transition-colors text-red-500 text-sm font-bold">تسجيل الخروج <LogOut className="w-4 h-4" /></button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex gap-2 md:gap-3">
              <button onClick={() => setCurrentView('login')} className="px-4 py-2 md:px-8 md:py-3 bg-slate-100 text-[10px] md:text-[12px] font-black rounded-xl md:rounded-2xl transition-all uppercase tracking-widest">دخول</button>
              <button onClick={() => setCurrentView('register')} className="px-4 py-2 md:px-8 md:py-3 bg-blue-600 text-white text-[10px] md:text-[12px] font-black rounded-xl md:rounded-2xl transition-all shadow-lg active:scale-95">انضمام</button>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="min-h-[80vh] relative">{renderContent()}</main>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-4">
        <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 h-16 rounded-2xl shadow-2xl flex items-center justify-around px-2">
           <button onClick={() => setCurrentView('home')} className={`flex flex-col items-center gap-1 transition-all ${currentView === 'home' ? 'text-blue-400' : 'text-slate-500'}`}>
              <Home className="w-5 h-5" />
              <span className="text-[9px] font-bold">الرئيسية</span>
           </button>
           <button onClick={() => setCurrentView('hub')} className={`flex flex-col items-center gap-1 transition-all ${currentView === 'hub' ? 'text-blue-400' : 'text-slate-500'}`}>
              <Hash className="w-5 h-5" />
              <span className="text-[9px] font-bold">الملتقى</span>
           </button>
           <button onClick={() => setCurrentView('live')} className={`flex flex-col items-center gap-1 transition-all ${currentView === 'live' ? 'text-red-400' : 'text-slate-500'}`}>
              <Radio className="w-5 h-5" />
              <span className="text-[9px] font-bold">مباشر</span>
           </button>
           {user && (
             <button onClick={() => setCurrentView('profile')} className={`flex flex-col items-center gap-1 transition-all ${currentView === 'profile' ? 'text-blue-400' : 'text-slate-500'}`}>
                <User className="w-5 h-5" />
                <span className="text-[9px] font-bold">بروفايلي</span>
             </button>
           )}
        </div>
      </div>

      <footer className="bg-slate-900 text-slate-500 py-16 md:py-32 text-center relative overflow-hidden pb-32 md:pb-32">
        <div className="max-w-4xl mx-auto px-6 relative z-10">
          <Trophy className="w-12 h-12 md:w-20 md:h-20 text-blue-600 mx-auto mb-6 md:mb-10 opacity-20" />
          <h3 className="text-white font-black text-lg md:text-2xl mb-4 italic text-center">بوابة البطولة الرقمية</h3>
          <p className="text-[10px] md:text-sm opacity-60 font-bold tracking-widest uppercase mb-12 text-center px-4">مدعوم بتقنية Google Firebase &bull; 2024</p>
        </div>
      </footer>
    </div>
  );
}
