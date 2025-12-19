
import React, { useState, useEffect, useRef } from 'react';
import { FirebaseService } from './services/firebase';
import { TeamRegistration, LiveChannel, Post, Comment } from './types';
import { 
  Trophy, Shield, Loader2, Radio, ExternalLink, RefreshCw, LogOut, Save, Copy, Check, User, 
  LayoutGrid, Image as ImageIcon, Send, MapPin, Users, Plus, Hash, Edit3, Camera, Heart, 
  MessageSquare, ChevronDown, Settings, Upload, X, Share2, Flame, Bell, Star, Zap, MessageCircle,
  Medal, Target, Activity, Calendar
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
    <div className="max-w-4xl mx-auto my-12 p-8 bg-white border-t-8 border-red-500 rounded-[3rem] shadow-2xl text-right relative overflow-hidden">
      <div className="flex items-center justify-end gap-4 text-red-600 mb-6 font-black text-3xl">
        <h2>تنبيه: تحديث قواعد Firebase</h2>
        <Shield className="w-12 h-12" />
      </div>
      <p className="mb-6 font-bold text-slate-700">يجب نسخ الكود التالي بالكامل ولصقه في تبويب <span className="text-blue-600">Rules</span> في Firebase Console لتعمل قاعدة البيانات:</p>
      <div className="bg-slate-900 text-emerald-400 p-8 rounded-[2rem] font-mono text-sm overflow-x-auto ltr shadow-inner border-4 border-slate-800 mb-8 relative">
        <button onClick={handleCopy} className="absolute top-4 left-4 p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all">
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </button>
        <pre>{rulesCode}</pre>
      </div>
      <button onClick={() => window.location.reload()} className="w-full py-6 bg-slate-900 text-white rounded-2xl font-black text-xl hover:bg-blue-600 transition-all flex items-center justify-center gap-4 shadow-2xl">
        <RefreshCw className="w-8 h-8" /> لقد قمت بلصق الكود، أعد تحميل الصفحة
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
        year: 'numeric', month: 'long', day: 'numeric', 
        hour: '2-digit', minute: '2-digit' 
      });
    };

    return (
      <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100/50 overflow-hidden hover:shadow-[0_20px_60px_rgba(37,99,235,0.08)] transition-all duration-700 group animate-in slide-in-from-bottom-6">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-5 text-right">
              <div className="order-2 text-right">
                <div className="flex items-center gap-2">
                   <h4 className="font-black text-xl text-slate-900 group-hover:text-blue-600 transition-colors">{post.teamName}</h4>
                   <Check className="w-4 h-4 text-blue-500 fill-blue-500/10" />
                </div>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5 flex items-center gap-1.5 justify-end">
                   {formatTimestamp(post.created_at)}
                </p>
              </div>
              <div className="relative order-1">
                <img src={post.teamLogo} className="w-14 h-14 rounded-2xl shadow-md border-2 border-slate-100 object-cover group-hover:scale-105 transition-transform" />
                <div className="absolute -bottom-1 -right-1 bg-blue-600 p-1 rounded-lg border-2 border-white">
                   <Star className="w-2.5 h-2.5 text-white fill-white" />
                </div>
              </div>
            </div>
            <button className="text-slate-300 hover:text-slate-600 transition-colors"><Plus className="w-5 h-5 rotate-45" /></button>
          </div>

          {post.content && (
            <div className="relative mb-8">
               <p className="text-slate-700 text-[1.1rem] leading-[1.8] font-medium pr-6 border-r-[5px] border-blue-500/10 text-right whitespace-pre-wrap">
                 {post.content}
               </p>
            </div>
          )}

          {post.imageUrl && (
            <div className="rounded-[2rem] overflow-hidden border-4 border-slate-50/50 shadow-sm group-hover:scale-[1.015] transition-transform duration-700 mb-8 bg-slate-50">
              <img src={post.imageUrl} className="w-full max-h-[600px] object-cover" loading="lazy" />
            </div>
          )}

          <div className="pt-6 border-t border-slate-50/80 flex items-center justify-between">
            <div className="flex items-center gap-8">
              <button 
                onClick={handleLike} 
                disabled={!currentUser} 
                className={`flex items-center gap-2.5 font-black transition-all transform active:scale-90 ${isLiked ? 'text-rose-500' : 'text-slate-400 hover:text-rose-500'}`}
              >
                <div className={`p-2.5 rounded-xl transition-colors ${isLiked ? 'bg-rose-50' : 'bg-slate-50 group-hover:bg-rose-50'}`}>
                  <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                </div>
                <span className="text-sm">{post.likes?.length || 0}</span>
              </button>
              
              <button 
                onClick={() => setShowComments(!showComments)} 
                className="flex items-center gap-2.5 text-slate-400 font-black hover:text-blue-600 transition-all group/btn"
              >
                <div className="p-2.5 rounded-xl bg-slate-50 group-hover/btn:bg-blue-50 transition-colors">
                   <MessageSquare className="w-5 h-5" />
                </div>
                <span className="text-sm">{post.comments?.length || 0}</span>
              </button>
            </div>
            
            <button className="p-2.5 rounded-xl bg-slate-50 text-slate-300 hover:text-blue-600 hover:bg-blue-50 transition-all">
               <Share2 className="w-5 h-5" />
            </button>
          </div>

          {showComments && (
            <div className="mt-8 pt-8 border-t border-slate-50 space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="max-h-[400px] overflow-y-auto space-y-6 pr-2 custom-scrollbar">
                {post.comments?.map((comment) => (
                  <div key={comment.id} className="flex gap-4 text-right group/comm">
                    <div className="flex-1 bg-slate-50/80 p-5 rounded-[1.5rem] border border-slate-100/50 text-right group-hover/comm:bg-white group-hover/comm:shadow-sm transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                          {formatTimestamp(comment.created_at)}
                        </span>
                        <p className="font-black text-sm text-slate-900">{comment.teamName}</p>
                      </div>
                      <p className="text-sm text-slate-600 font-medium leading-relaxed">{comment.text}</p>
                    </div>
                    <img src={comment.teamLogo} className="w-10 h-10 rounded-xl object-cover shadow-sm border border-white" />
                  </div>
                ))}
              </div>
              
              {currentUser ? (
                <form onSubmit={handleComment} className="flex gap-3 pt-4 border-t border-slate-50">
                  <button 
                    type="submit" 
                    disabled={isSubmittingComment || !commentText.trim()} 
                    className="bg-blue-600 text-white p-4 rounded-[1.2rem] font-black shadow-lg shadow-blue-500/20 disabled:opacity-50 transition-all hover:bg-blue-700 active:scale-95 flex items-center justify-center"
                  >
                    {isSubmittingComment ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  </button>
                  <input 
                    value={commentText} 
                    onChange={(e) => setCommentText(e.target.value)} 
                    placeholder="أضف تعليقاً احترافياً..." 
                    className="flex-1 bg-slate-50 p-4 rounded-[1.2rem] border border-slate-100 outline-none focus:ring-4 ring-blue-500/5 text-sm font-bold text-right transition-all focus:bg-white" 
                  />
                </form>
              ) : (
                <div className="text-center p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                   <p className="text-slate-400 text-xs font-black">يجب تسجيل الدخول للتفاعل مع التعليقات</p>
                </div>
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
      <div className="max-w-7xl mx-auto py-12 px-6 animate-in fade-in zoom-in duration-700">
        {/* Hero Section */}
        <div className="relative mb-16">
          <div className="h-96 w-full rounded-[4rem] bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 overflow-hidden relative shadow-2xl">
             <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
             <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
             
             {/* Stats Over Banner */}
             <div className="absolute top-12 left-12 flex gap-4">
                <div className="bg-white/10 backdrop-blur-xl px-6 py-4 rounded-3xl border border-white/20 text-center">
                   <p className="text-[10px] font-black text-blue-300 uppercase mb-1">المركز الحالي</p>
                   <p className="text-xl font-black text-white italic">#12</p>
                </div>
                <div className="bg-white/10 backdrop-blur-xl px-6 py-4 rounded-3xl border border-white/20 text-center">
                   <p className="text-[10px] font-black text-blue-300 uppercase mb-1">نقاط القوة</p>
                   <p className="text-xl font-black text-white italic">850</p>
                </div>
             </div>

             {/* Profile Header Contents */}
             <div className="absolute -bottom-10 right-16 flex items-end gap-10 z-20">
                <div className="relative group">
                   <div className="absolute -inset-2 bg-gradient-to-tr from-blue-600 to-indigo-400 rounded-[3.5rem] blur-xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
                   <img src={profileData.logo_url} className="w-56 h-56 rounded-[3.5rem] border-[12px] border-white shadow-2xl bg-white object-cover relative z-10" />
                   <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
                   <button 
                     onClick={() => logoInputRef.current?.click()} 
                     className="absolute bottom-4 left-4 bg-blue-600 p-4 rounded-2xl text-white shadow-xl hover:scale-110 transition-all z-30 border-4 border-white"
                   >
                     <Camera className="w-6 h-6" />
                   </button>
                </div>
                <div className="mb-14 text-right">
                  <div className="flex items-center gap-4 mb-3 justify-end">
                     <div className="bg-emerald-500/20 text-emerald-400 px-4 py-1.5 rounded-full text-xs font-black flex items-center gap-2 border border-emerald-500/30">
                        <Activity className="w-3.5 h-3.5" /> فريق نشط
                     </div>
                     <h2 className="text-6xl font-black text-white drop-shadow-2xl tracking-tighter italic">نادي {user.team_name}</h2>
                  </div>
                  <div className="flex items-center gap-4 justify-end">
                    <p className="text-blue-100 font-bold flex items-center gap-2 text-xl opacity-90">{user.municipality} <MapPin className="w-6 h-6 text-blue-400" /></p>
                    <div className="w-1.5 h-1.5 bg-blue-400/50 rounded-full"></div>
                    <p className="text-blue-100/60 font-bold text-lg">تأسس في {new Date(user.created_at?.seconds * 1000).getFullYear() || 2024}</p>
                  </div>
                </div>
             </div>
          </div>
          
          <div className="absolute top-12 right-12 flex gap-4 z-30">
             <button 
               onClick={() => setEditMode(!editMode)} 
               className={`px-10 py-5 rounded-[2rem] font-black flex items-center gap-4 transition-all shadow-2xl border ${editMode ? 'bg-rose-600 text-white border-rose-500' : 'bg-white text-slate-900 border-slate-100 hover:bg-slate-50'}`}
             >
               {editMode ? <X className="w-6 h-6" /> : <Edit3 className="w-6 h-6" />}
               {editMode ? 'إلغاء التعديل' : 'تحديث البيانات'}
             </button>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mt-24">
           {/* Sidebar */}
           <div className="lg:col-span-4 space-y-10">
              {/* Scoreboard Card */}
              <div className="bg-slate-900 rounded-[3.5rem] p-10 shadow-2xl text-white relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Medal className="w-48 h-48" />
                 </div>
                 <h3 className="text-2xl font-black mb-12 flex items-center gap-4 justify-end">
                    سجل الانتصارات
                    <Target className="text-rose-500 w-8 h-8" />
                 </h3>
                 <div className="grid grid-cols-2 gap-8 relative z-10">
                    <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 text-center">
                       <span className="text-5xl font-black text-emerald-400 block mb-2">{user.wins || 0}</span>
                       <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">مباراة رابحة</p>
                    </div>
                    <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 text-center">
                       <span className="text-5xl font-black text-rose-500 block mb-2">{user.losses || 0}</span>
                       <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">تعثرات</p>
                    </div>
                 </div>
                 <div className="mt-8 bg-blue-600 py-5 rounded-3xl text-center font-black text-xl hover:bg-blue-700 transition-colors cursor-pointer shadow-xl shadow-blue-600/20">
                    تحليل الأداء الكامل
                 </div>
              </div>

              {/* Details Card */}
              <div className="bg-white rounded-[3.5rem] p-10 border border-slate-100 shadow-xl text-right">
                 <h3 className="text-2xl font-black text-slate-900 mb-10 flex items-center gap-4 justify-end">
                    هوية النادي
                    <Shield className="text-blue-600 w-8 h-8" />
                 </h3>
                 {editMode ? (
                   <div className="space-y-6">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase pr-2">اسم الفريق</label>
                        <input value={profileData.team_name} onChange={e => setProfileData({...profileData, team_name: e.target.value})} className="w-full p-6 bg-slate-50 border border-slate-100 rounded-3xl outline-none font-bold text-right focus:ring-4 ring-blue-500/5 focus:bg-white transition-all" />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase pr-2">البلدية</label>
                        <input value={profileData.municipality} onChange={e => setProfileData({...profileData, municipality: e.target.value})} className="w-full p-6 bg-slate-50 border border-slate-100 rounded-3xl outline-none font-bold text-right focus:ring-4 ring-blue-500/5 focus:bg-white transition-all" />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase pr-2">اللاعبين</label>
                          <input type="number" value={profileData.players_count} onChange={e => setProfileData({...profileData, players_count: parseInt(e.target.value)})} className="w-full p-6 bg-slate-50 border border-slate-100 rounded-3xl outline-none font-bold text-right focus:ring-4 ring-blue-500/5 focus:bg-white transition-all" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase pr-2">الولاية</label>
                          <input value={profileData.region} disabled className="w-full p-6 bg-slate-100 border border-slate-100 rounded-3xl outline-none font-bold text-right opacity-60" />
                        </div>
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase pr-2">النبذة التعريفية</label>
                        <textarea value={profileData.bio} onChange={e => setProfileData({...profileData, bio: e.target.value})} className="w-full p-6 bg-slate-50 border border-slate-100 rounded-3xl outline-none h-40 resize-none font-medium text-right focus:ring-4 ring-blue-500/5 focus:bg-white transition-all" placeholder="أخبرنا عن تاريخ ناديك..." />
                     </div>
                     <button onClick={handleUpdate} disabled={isSaving} className="w-full py-6 bg-blue-600 text-white rounded-[2rem] font-black shadow-2xl shadow-blue-600/20 hover:bg-blue-700 flex items-center justify-center gap-4 text-xl transition-all active:scale-95">
                       {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
                       حفظ التعديلات
                     </button>
                   </div>
                 ) : (
                   <div className="space-y-8">
                      <div className="flex items-center justify-between p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 group hover:bg-white hover:shadow-lg transition-all">
                         <div className="text-right"><p className="text-2xl font-black text-slate-900">{user.players_count || 0}</p><p className="text-[10px] text-slate-400 font-bold uppercase">لاعب في التشكيلة</p></div>
                         <div className="p-4 bg-blue-600 text-white rounded-2xl"><Users className="w-7 h-7" /></div>
                      </div>
                      <div className="flex items-center justify-between p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 group hover:bg-white hover:shadow-lg transition-all">
                         <div className="text-right"><p className="text-2xl font-black text-slate-900">{user.municipality}</p><p className="text-[10px] text-slate-400 font-bold uppercase">البلدية المسجل بها</p></div>
                         <div className="p-4 bg-blue-600 text-white rounded-2xl"><MapPin className="w-7 h-7" /></div>
                      </div>
                      <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 relative group">
                         <div className="absolute top-6 right-6 text-blue-100 group-hover:text-blue-200 transition-colors">
                            <Star className="w-12 h-12 fill-current" />
                         </div>
                         <p className="text-slate-600 font-medium italic text-xl leading-relaxed pr-2 text-right relative z-10">
                            "{user.bio || 'نادي رياضي ملتزم بالقيم والروح التنافسية العالية.'}"
                         </p>
                      </div>
                   </div>
                 )}
              </div>
           </div>

           {/* Gallery Content */}
           <div className="lg:col-span-8 space-y-12">
              <div className="flex flex-col md:flex-row items-center justify-between gap-8 bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-xl">
                 <div className="text-right">
                    <h3 className="text-3xl font-black text-slate-900 italic tracking-tighter mb-2 flex items-center gap-4 justify-end">
                       ألبوم ذكريات النادي
                       <ImageIcon className="text-blue-600 w-10 h-10" />
                    </h3>
                    <p className="text-slate-400 font-bold">وثق أفضل اللقطات التاريخية ومباريات فريقك</p>
                 </div>
                 <div>
                    <input type="file" ref={galleryInputRef} multiple className="hidden" accept="image/*" onChange={handleGalleryUpload} />
                    <button 
                      onClick={() => galleryInputRef.current?.click()} 
                      disabled={isSaving} 
                      className="bg-slate-900 text-white px-12 py-5 rounded-[1.5rem] hover:bg-blue-600 transition-all flex items-center gap-4 font-black shadow-xl disabled:opacity-50 active:scale-95"
                    >
                      {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
                      رفع صور جديدة
                    </button>
                 </div>
              </div>

              {user.gallery && user.gallery.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
                   {user.gallery.map((img, i) => (
                     <div key={i} className="aspect-[4/5] rounded-[3rem] overflow-hidden border-[10px] border-white shadow-2xl group relative cursor-pointer hover:-translate-y-4 transition-all duration-700 bg-slate-100">
                        <img src={img} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-10">
                           <button 
                             onClick={() => handleShareGalleryImage(img)} 
                             className="bg-white text-blue-600 px-8 py-4 rounded-2xl shadow-2xl hover:scale-105 active:scale-95 transition-all font-black flex items-center gap-3"
                           >
                             <Share2 className="w-5 h-5" />
                             مشاركة في الملتقى
                           </button>
                        </div>
                     </div>
                   ))}
                </div>
              ) : (
                <div className="py-40 text-center bg-white rounded-[4rem] border-4 border-dashed border-slate-100 shadow-inner">
                   <div className="p-10 bg-slate-50 rounded-full inline-block mb-10">
                      <ImageIcon className="w-24 h-24 text-slate-200" />
                   </div>
                   <h3 className="text-3xl font-black text-slate-300">ألبوم الصور فارغ</h3>
                   <p className="text-slate-200 font-bold mt-4 text-xl">ابدأ بمشاركة لقطات فريقك الآن!</p>
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
        if (postCategory === 'news') finalContent = `📢 [خبر عاجل]\n${finalContent}`;
        if (postCategory === 'result') finalContent = `⚽ [نتيجة مباراة]\n${finalContent}`;
        if (postCategory === 'challenge') finalContent = `⚔️ [تحدي جديد]\n${finalContent}`;
        
        if (finalContent) postPayload.content = finalContent;
        if (newPostImage) postPayload.imageUrl = newPostImage;
        
        await FirebaseService.createPost(postPayload);
        setNewPostContent('');
        setNewPostImage('');
        setPostCategory('general');
        await fetchData(true);
      } catch (err: any) {
        console.error("Post Error:", err);
        alert("فشل النشر: " + (err.message?.includes("too large") ? "حجم الصورة كبير جداً" : "تأكد من اتصالك بالإنترنت"));
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
      <div className="max-w-4xl mx-auto py-12 px-6 animate-in fade-in duration-1000">
        <div className="flex flex-col items-center mb-16 text-center">
           <div className="p-4 bg-blue-600/5 rounded-full mb-6 animate-bounce">
              <Hash className="text-blue-600 w-12 h-12" />
           </div>
           <h2 className="text-5xl font-black text-slate-900 italic tracking-tighter mb-4">ملتقى الفرق النخبوية</h2>
           <p className="text-slate-400 font-bold max-w-lg">اكتشف آخر أخبار الأندية، نتائج المباريات، والتحديات القادمة في قلب البطولة.</p>
        </div>

        {user ? (
          <div className="bg-white p-10 rounded-[3rem] shadow-[0_30px_100px_rgba(0,0,0,0.08)] border border-slate-100 mb-20 relative overflow-hidden transition-all hover:shadow-[0_30px_100px_rgba(37,99,235,0.1)]">
            <div className="absolute top-0 right-0 left-0 h-2 bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-400"></div>
            
            <div className="flex flex-col gap-8">
              <div className="flex items-center gap-5 justify-end">
                <div className="text-right">
                  <h4 className="font-black text-lg text-slate-900">نادي {user.team_name}</h4>
                  <p className="text-xs text-blue-500 font-bold">ماذا يدور في ناديك اليوم؟</p>
                </div>
                <img src={user.logo_url} className="w-16 h-16 rounded-[1.5rem] shadow-xl border-2 border-white object-cover" />
              </div>

              <div className="relative group">
                <textarea 
                  value={newPostContent} 
                  onChange={e => setNewPostContent(e.target.value)} 
                  placeholder="اكتب هنا أخبار فريقك، نتائجك، أو تحدياتك..." 
                  className="w-full p-8 bg-slate-50 border-none rounded-[2rem] outline-none focus:ring-4 ring-blue-500/5 resize-none h-48 text-xl font-medium placeholder:text-slate-300 text-right transition-all focus:bg-white" 
                />
                <div className="absolute bottom-4 left-6 flex items-center gap-3">
                   <button 
                    onClick={() => setPostCategory(postCategory === 'news' ? 'general' : 'news')}
                    className={`p-2.5 rounded-xl transition-all flex items-center gap-2 font-bold text-xs ${postCategory === 'news' ? 'bg-amber-500 text-white shadow-lg' : 'bg-white text-slate-400 hover:text-amber-500'}`}
                   >
                     {postCategory === 'news' && <Bell className="w-3 h-3" />} أخبار
                   </button>
                   <button 
                    onClick={() => setPostCategory(postCategory === 'result' ? 'general' : 'result')}
                    className={`p-2.5 rounded-xl transition-all flex items-center gap-2 font-bold text-xs ${postCategory === 'result' ? 'bg-emerald-500 text-white shadow-lg' : 'bg-white text-slate-400 hover:text-emerald-500'}`}
                   >
                     {postCategory === 'result' && <Zap className="w-3 h-3" />} نتيجة
                   </button>
                   <button 
                    onClick={() => setPostCategory(postCategory === 'challenge' ? 'general' : 'challenge')}
                    className={`p-2.5 rounded-xl transition-all flex items-center gap-2 font-bold text-xs ${postCategory === 'challenge' ? 'bg-rose-500 text-white shadow-lg' : 'bg-white text-slate-400 hover:text-rose-500'}`}
                   >
                     {postCategory === 'challenge' && <Flame className="w-3 h-3" />} تحدي
                   </button>
                </div>
              </div>

              {isProcessingImage && (
                <div className="flex items-center gap-3 text-blue-600 font-black text-sm justify-end p-5 bg-blue-50/50 rounded-2xl border border-blue-100 animate-pulse">
                  <span>جاري معالجة اللقطة باحترافية...</span>
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
              )}

              {newPostImage && !isProcessingImage && (
                <div className="relative inline-block self-end group">
                  <img src={newPostImage} className="w-64 h-64 rounded-[2rem] object-cover border-4 border-white shadow-2xl transition-transform group-hover:scale-[1.02]" />
                  <button onClick={() => setNewPostImage('')} className="absolute -top-4 -right-4 bg-rose-500 text-white p-3 rounded-full shadow-xl hover:bg-rose-600 hover:scale-110 transition-all">
                    <X className="w-5 h-5" />
                  </button>
                  <div className="absolute inset-0 bg-black/20 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                     <ImageIcon className="text-white w-10 h-10" />
                  </div>
                </div>
              )}

              <div className="flex flex-col md:flex-row items-center gap-6 pt-6 border-t border-slate-50">
                <button 
                  onClick={handlePost} 
                  disabled={isPosting || isProcessingImage || (!newPostContent.trim() && !newPostImage)} 
                  className="w-full md:w-64 py-5 bg-blue-600 text-white rounded-[1.5rem] font-black flex items-center justify-center gap-3 hover:bg-blue-700 disabled:opacity-50 shadow-2xl shadow-blue-500/30 active:scale-95 transition-all text-lg"
                >
                  {isPosting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />} نشر المنشور
                </button>
                
                <div className="flex-1 w-full">
                  <input type="file" ref={postImageInputRef} className="hidden" accept="image/*" onChange={handlePostImageUpload} />
                  <button 
                    onClick={() => postImageInputRef.current?.click()} 
                    disabled={isProcessingImage || isPosting} 
                    className="w-full h-[68px] px-8 bg-slate-50 rounded-[1.5rem] text-sm font-black border border-transparent outline-none flex items-center gap-4 text-slate-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100 transition-all justify-end disabled:opacity-50"
                  >
                    <span className="flex-1 text-right">{newPostImage ? 'تغيير اللقطة المرفقة' : 'إضافة لقطة مميزة من المباراة'}</span>
                    <ImageIcon className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900 text-white p-16 rounded-[4rem] shadow-2xl text-center mb-20 relative overflow-hidden group">
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] group-hover:scale-110 transition-transform duration-1000"></div>
            <div className="relative z-10">
              <div className="bg-blue-600/20 p-5 rounded-3xl inline-block mb-8">
                 <Trophy className="w-12 h-12 text-blue-500" />
              </div>
              <h3 className="text-4xl font-black mb-6 italic tracking-tighter">شاركنا أمجاد فريقك!</h3>
              <p className="text-slate-400 mb-12 text-xl max-w-md mx-auto leading-relaxed">سجل دخولك الآن لتتمكن من نشر أخبار فريقك والتفاعل مع مجتمع البطولة الكبير.</p>
              <button onClick={() => setCurrentView('login')} className="px-16 py-5 bg-blue-600 text-white rounded-2xl font-black shadow-2xl shadow-blue-600/20 hover:scale-105 transition-transform active:scale-95 text-lg">سجل دخولك الآن</button>
            </div>
          </div>
        )}

        {isRefreshing && (
          <div className="flex justify-center mb-12">
            <div className="bg-white text-blue-600 px-8 py-4 rounded-full flex items-center gap-4 font-black text-sm shadow-xl border border-blue-50">
              <Loader2 className="w-5 h-5 animate-spin" /> 
              جاري تحديث الملتقى بأحدث الأخبار...
            </div>
          </div>
        )}

        <div className="space-y-16 pb-32">
          {posts.map(post => <PostCard key={post.id} post={post} currentUser={user} onRefresh={() => fetchData(true)} />)}
          
          {posts.length === 0 && (
            <div className="py-48 text-center bg-white rounded-[4rem] border-4 border-dashed border-slate-100">
               <div className="p-8 bg-slate-50 rounded-full inline-block mb-8">
                  <Hash className="w-20 h-20 text-slate-200" />
               </div>
               <h3 className="text-2xl font-black text-slate-300">الملتقى فارغ حالياً</h3>
               <p className="text-slate-200 font-bold mt-2">كن أول من ينشر خبراً عن فريقه اليوم!</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (isLoading) return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-8 text-center">
        <div className="relative">
           <div className="w-24 h-24 border-8 border-blue-600/10 border-t-blue-600 rounded-full animate-spin"></div>
           <Trophy className="w-10 h-10 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-800 italic">جاري تحميل البيانات</h2>
          <p className="text-slate-400 font-bold mt-2">لحظات ونكون جاهزين...</p>
        </div>
      </div>
    );
    if (permissionError) return <PermissionAlert />;
    switch (currentView) {
      case 'profile': return <ProfileView />;
      case 'hub': return <HubView />;
      case 'live': return (
        <div className="max-w-7xl mx-auto py-16 px-6">
          <h2 className="text-4xl font-black flex items-center gap-4 italic mb-16 justify-end">قنوات البث المباشر <Radio className="text-red-600 animate-pulse w-10 h-10" /></h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {liveChannels.map(ch => (
              <div key={ch.id} className="bg-white rounded-[3.5rem] border border-slate-100 p-6 shadow-xl hover:shadow-2xl group overflow-hidden relative text-right transition-all">
                <div className="h-56 w-full relative mb-6 rounded-[2.5rem] overflow-hidden">
                  <img src={ch.thumbnail_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1"><div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div> مباشر</div>
                </div>
                <h4 className="font-black text-2xl mb-4 text-slate-800 pr-2">{ch.name}</h4>
                <button onClick={() => window.open(ch.stream_url, '_blank')} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black hover:bg-blue-600 flex items-center justify-center gap-3 shadow-xl transition-all">انضم للبث <ExternalLink className="w-5 h-5" /></button>
              </div>
            ))}
          </div>
        </div>
      );
      case 'login': return (
        <div className="max-w-md mx-auto py-24 px-6">
          <div className="bg-white rounded-[3.5rem] p-12 shadow-2xl border border-slate-100 text-center animate-in zoom-in duration-500">
            <div className="bg-blue-600 w-20 h-20 rounded-3xl mx-auto mb-8 flex items-center justify-center shadow-xl rotate-3"><Trophy className="w-10 h-10 text-white" /></div>
            <h3 className="text-3xl font-black mb-10 text-slate-900 italic tracking-tight">دخول النادي</h3>
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
            }} className="space-y-5">
              <input type="email" required placeholder="البريد الإلكتروني" className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 ring-blue-500/10 focus:border-blue-500 font-bold text-right" />
              <input type="password" required placeholder="كلمة المرور" className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 ring-blue-500/10 focus:border-blue-500 font-bold text-right" />
              <button type="submit" className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 hover:bg-blue-700 active:scale-[0.98] transition-all">تأكيد الدخول</button>
            </form>
          </div>
        </div>
      );
      case 'register': return (
        <div className="max-w-md mx-auto py-24 px-6">
          <div className="bg-white rounded-[3.5rem] p-12 shadow-2xl border border-slate-100 text-center animate-in zoom-in duration-500">
            <h3 className="text-3xl font-black mb-10 text-slate-900 italic tracking-tight text-center">تسجيل فريق جديد</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const target = e.target as any;
              const res = await FirebaseService.registerTeam({
                team_name: target[0].value, coach_name: target[1].value, contact_email: target[2].value, password: target[3].value, region: target[4].value
              });
              if (res.error) alert(res.error);
              else { alert('تم التسجيل بنجاح!'); setCurrentView('login'); fetchData(true); }
            }} className="space-y-4">
              <input required placeholder="اسم الفريق" className="w-full p-5 bg-slate-50 border-slate-200 rounded-2xl font-bold text-right" />
              <input required placeholder="اسم المدرب" className="w-full p-5 bg-slate-50 border-slate-200 rounded-2xl font-bold text-right" />
              <input type="email" required placeholder="البريد الإلكتروني" className="w-full p-5 bg-slate-50 border-slate-200 rounded-2xl font-bold text-right" />
              <input type="password" required placeholder="كلمة المرور" className="w-full p-5 bg-slate-50 border-slate-200 rounded-2xl font-bold text-right" />
              <input required placeholder="الولاية/المنطقة" className="w-full p-5 bg-slate-50 border-slate-200 rounded-2xl font-bold text-right" />
              <button type="submit" className="w-full py-5 bg-slate-900 text-white font-black rounded-2xl shadow-xl active:scale-[0.98] transition-all">إرسال طلب الانضمام</button>
            </form>
          </div>
        </div>
      );
      default: return (
        <>
          <section className="bg-slate-900 pt-32 pb-48 px-6 text-center text-white relative overflow-hidden">
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
             <div className="relative z-10 max-w-5xl mx-auto">
               <div className="inline-block px-6 py-2 bg-blue-600/20 backdrop-blur-md rounded-full text-blue-400 font-black text-xs uppercase tracking-widest mb-8 border border-blue-600/30">الموسم الرياضي الجديد 2024</div>
               <h1 className="text-7xl md:text-9xl font-black mb-10 leading-tight tracking-tighter italic text-center">بوابة البطولة</h1>
               <p className="text-slate-400 text-2xl mb-16 font-light max-w-3xl mx-auto leading-relaxed italic text-center">مجتمع رياضي رقمي متكامل لإدارة الفرق، النتائج، والبث المباشر بأعلى التقنيات.</p>
               <div className="flex flex-wrap justify-center gap-6">
                 <button onClick={() => setCurrentView('register')} className="px-14 py-6 bg-blue-600 rounded-[2.5rem] font-black text-xl shadow-2xl shadow-blue-600/20 hover:scale-105 transition-transform active:scale-95">سجل فريقك مجاناً</button>
                 <button onClick={() => setCurrentView('hub')} className="px-14 py-6 bg-white/10 rounded-[2.5rem] font-black text-xl border border-white/20 hover:bg-white/20 transition-all backdrop-blur-md">ملتقى الفرق</button>
               </div>
             </div>
          </section>
          <section className="py-32 px-6 bg-white relative">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-24 text-right">
                <div className="bg-slate-50 px-8 py-4 rounded-3xl border border-slate-100 order-2 md:order-1"><span className="font-black text-3xl text-blue-600">{allTeams.length}</span> <span className="text-slate-400 font-bold mr-2">فريق</span></div>
                <div className="order-1 md:order-2 text-right"><h2 className="text-5xl font-black text-slate-900 flex items-center gap-5 italic justify-end">النخبة المشاركة <Users className="text-blue-600 w-12 h-12" /></h2><p className="text-slate-400 font-bold mt-2">الفرق الرياضية المسجلة رسمياً</p></div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-10">
                {allTeams.map(team => (
                  <div key={team.id} className="text-center group cursor-pointer">
                    <div className="relative mx-auto mb-6">
                      <img src={team.logo_url} className="w-28 h-28 md:w-36 md:h-36 rounded-[2.5rem] border-4 border-white shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 bg-white object-cover" />
                      <div className="absolute -bottom-2 -left-2 bg-emerald-500 w-8 h-8 rounded-2xl border-4 border-white shadow-lg"></div>
                    </div>
                    <p className="font-black text-slate-800 text-lg group-hover:text-blue-600 transition-colors">{team.team_name}</p>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1 bg-slate-50 inline-block px-3 py-1 rounded-full">{team.region}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      );
    }
  };

  return (
    <div className="min-h-screen font-sans selection:bg-blue-600 selection:text-white" dir="rtl">
      <nav className="bg-white/90 backdrop-blur-xl border-b border-slate-100 py-4 px-6 md:px-12 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3 font-black text-2xl cursor-pointer hover:scale-105 transition-transform group" onClick={() => {setCurrentView('home'); setIsUserMenuOpen(false);}}>
          <div className="bg-blue-600 p-2 rounded-2xl shadow-xl shadow-blue-500/20 group-hover:rotate-12 transition-transform"><Trophy className="w-7 h-7 text-white" /></div>
          <span className="tracking-tighter italic">بوابة البطولة</span>
        </div>
        <div className="hidden lg:flex gap-12 text-[12px] font-black uppercase tracking-widest text-slate-400">
           <button onClick={() => {setCurrentView('home'); setIsUserMenuOpen(false);}} className={`hover:text-blue-600 transition-colors ${currentView === 'home' ? 'text-blue-600' : ''}`}>الرئيسية</button>
           <button onClick={() => {setCurrentView('hub'); setIsUserMenuOpen(false);}} className={`hover:text-blue-600 transition-colors ${currentView === 'hub' ? 'text-blue-600' : ''}`}>الملتقى</button>
           <button onClick={() => {setCurrentView('live'); setIsUserMenuOpen(false);}} className={`hover:text-blue-600 transition-colors ${currentView === 'live' ? 'text-red-600' : ''}`}>البث المباشر</button>
        </div>
        <div className="flex items-center gap-5">
          {user ? (
            <div className="relative" ref={menuRef}>
              <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="flex items-center gap-4 p-1.5 pr-5 pl-2 bg-slate-50 border border-slate-200 rounded-[1.5rem] hover:bg-white hover:shadow-lg transition-all">
                <div className="text-right"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">مسجل كفريق</p><p className="text-xs font-black text-slate-900">{user.team_name}</p></div>
                <div className="relative"><img src={user.logo_url} className="w-10 h-10 rounded-2xl shadow-md border-2 border-white object-cover" /><div className="absolute -bottom-1 -right-1 bg-emerald-500 w-3.5 h-3.5 rounded-full border-2 border-white"></div></div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {isUserMenuOpen && (
                <div className="absolute top-full left-0 mt-3 w-72 bg-white rounded-[2rem] shadow-2xl border border-slate-100 p-3 z-[100] animate-in slide-in-from-top-2 duration-200 text-right">
                  <div className="p-4 mb-2 border-b border-slate-50 text-right">
                    <p className="text-sm font-black text-slate-900">{user.team_name}</p>
                    <p className="text-[10px] text-slate-400 font-bold">{user.contact_email}</p>
                  </div>
                  <div className="space-y-1">
                    <button onClick={() => {setCurrentView('profile'); setIsUserMenuOpen(false);}} className="w-full flex items-center justify-end gap-3 p-4 hover:bg-slate-50 rounded-2xl transition-colors text-slate-600 hover:text-blue-600 group text-sm font-bold text-right">
                      بروفايل النادي 
                      <User className="w-5 h-5 opacity-50 group-hover:opacity-100" />
                    </button>
                    
                    <button onClick={() => {setCurrentView('hub'); setIsUserMenuOpen(false);}} className="w-full flex items-center justify-end gap-3 p-4 hover:bg-blue-50/50 rounded-2xl transition-colors text-slate-600 hover:text-blue-600 group text-sm font-bold text-right">
                      ملتقى الفرق
                      <Hash className="w-5 h-5 opacity-50 group-hover:opacity-100 text-blue-500" />
                    </button>

                    <button onClick={() => {setCurrentView('hub'); setIsUserMenuOpen(false);}} className="w-full flex items-center justify-end gap-3 p-4 hover:bg-slate-50 rounded-2xl transition-colors text-slate-600 hover:text-blue-600 group text-sm font-bold text-right">
                      مشاركاتي 
                      <LayoutGrid className="w-5 h-5 opacity-50 group-hover:opacity-100" />
                    </button>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-50">
                    <button onClick={handleLogout} className="w-full flex items-center justify-end gap-3 p-4 hover:bg-red-50 rounded-2xl transition-colors text-red-500 group text-sm font-bold text-right">
                      تسجيل الخروج 
                      <LogOut className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex gap-3">
              <button onClick={() => setCurrentView('login')} className="px-8 py-3 bg-slate-100 text-[12px] font-black rounded-2xl hover:bg-slate-200 transition-all uppercase tracking-widest border border-slate-200">دخول</button>
              <button onClick={() => setCurrentView('register')} className="px-8 py-3 bg-blue-600 text-white text-[12px] font-black rounded-2xl hover:bg-blue-700 transition-all uppercase tracking-widest shadow-xl shadow-blue-500/20 active:scale-95">انضمام</button>
            </div>
          )}
        </div>
      </nav>
      <main className="min-h-[80vh]">{renderContent()}</main>
      <footer className="bg-slate-900 text-slate-500 py-32 text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-6 relative z-10">
          <Trophy className="w-20 h-20 text-blue-600 mx-auto mb-10 opacity-20" />
          <h3 className="text-white font-black text-2xl mb-4 italic tracking-tight text-center">نظام إدارة البطولة الذكي</h3>
          <p className="text-sm opacity-60 font-bold tracking-widest uppercase mb-12 text-center">مدعوم بتقنية Google Firebase &bull; جميع الحقوق محفوظة 2024</p>
        </div>
      </footer>
    </div>
  );
}
