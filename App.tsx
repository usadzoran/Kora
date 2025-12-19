
import React, { useState, useEffect, useRef } from 'react';
import { FirebaseService } from './services/firebase';
import { TeamRegistration, LiveChannel, Post, Comment } from './types';
import { 
  Trophy, Shield, Loader2, Radio, ExternalLink, RefreshCw, LogOut, Save, Copy, Check, User, 
  LayoutGrid, Image as ImageIcon, Send, MapPin, Users, Plus, Hash, Edit3, Camera, Heart, 
  MessageSquare, ChevronDown, Settings, Upload, X, Share2, Flame, Bell, Star, Zap, MessageCircle,
  Medal, Target, Activity, Calendar, Home, Menu, Trash2, Eye, EyeOff, Lock, ShieldAlert
} from 'lucide-react';

type ViewState = 'home' | 'profile' | 'live' | 'hub' | 'login' | 'register' | 'admin' | 'admin-login';

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

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>('home');
  const [user, setUser] = useState<TeamRegistration | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [liveChannels, setLiveChannels] = useState<LiveChannel[]>([]);
  const [allTeams, setAllTeams] = useState<TeamRegistration[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [permissionError, setPermissionError] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [adminClickCount, setAdminClickCount] = useState(0);
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
          if (width > maxWidth) { height *= maxWidth / width; width = maxWidth; }
        } else {
          if (height > maxHeight) { width *= maxHeight / height; height = maxHeight; }
        }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) { ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high'; ctx.drawImage(img, 0, 0, width, height); }
        resolve(canvas.toDataURL('image/jpeg', 0.5));
      };
    });
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

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

      const [channels, teams, hubPosts] = await Promise.all([
        FirebaseService.getLiveChannels(isAdmin || savedAdmin === 'true'),
        FirebaseService.getAllTeams(),
        FirebaseService.getPosts()
      ]);
      setLiveChannels(channels);
      // إخفاء حساب المشرف من العرض العام
      setAllTeams(teams.filter(t => t.contact_email !== ADMIN_CREDS.email));
      setPosts(hubPosts);
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

  // Fixed: handleSecretClick added to allow admin portal access after 7 clicks on the footer trophy.
  const handleSecretClick = () => {
    const newCount = adminClickCount + 1;
    setAdminClickCount(newCount);
    if (newCount >= 7) {
      setCurrentView('admin-login');
      setAdminClickCount(0);
      window.location.hash = 'admin-access';
    }
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
      return date.toLocaleString('ar-DZ', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    };

    return (
      <div className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden mb-6 text-right">
        <div className="p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="text-right">
                <h4 className="font-black text-lg">{post.teamName}</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase">{formatTimestamp(post.created_at)}</p>
              </div>
              <img src={post.teamLogo} className="w-12 h-12 rounded-xl object-cover border-2 border-slate-50" />
            </div>
            {isAdmin && (
              <button onClick={async () => { if(confirm('حذف؟')) { await FirebaseService.deletePost(post.id!); onRefresh(); } }} className="text-rose-500 p-2 bg-rose-50 rounded-xl">
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
          {post.content && <p className="text-slate-700 text-lg mb-6 leading-relaxed whitespace-pre-wrap">{post.content}</p>}
          {post.imageUrl && <img src={post.imageUrl} className="w-full rounded-[1.5rem] mb-6 border border-slate-100" />}
          <div className="flex items-center gap-6 pt-4 border-t border-slate-50">
            <button onClick={handleLike} disabled={!currentUser} className={`flex items-center gap-2 font-black ${isLiked ? 'text-rose-500' : 'text-slate-400'}`}>
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} /> {post.likes?.length || 0}
            </button>
            <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-2 text-slate-400 font-black">
              <MessageSquare className="w-5 h-5" /> {post.comments?.length || 0}
            </button>
          </div>
          {showComments && (
            <div className="mt-6 space-y-4">
              {post.comments?.map(c => (
                <div key={c.id} className="flex gap-3 text-right bg-slate-50 p-3 rounded-xl">
                  <div className="flex-1">
                    <p className="font-black text-xs mb-1">{c.teamName}</p>
                    <p className="text-xs text-slate-600">{c.text}</p>
                  </div>
                  <img src={c.teamLogo} className="w-8 h-8 rounded-lg object-cover" />
                </div>
              ))}
              {currentUser && (
                <form onSubmit={handleComment} className="flex gap-2 pt-4">
                  <button type="submit" disabled={isSubmittingComment} className="bg-blue-600 text-white p-3 rounded-xl shrink-0"><Send className="w-4 h-4" /></button>
                  <input value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="اكتب تعليقاً..." className="flex-1 bg-slate-50 p-3 rounded-xl text-xs font-bold text-right outline-none" />
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
      if (finalLogo?.startsWith('data:image')) finalLogo = await compressImage(finalLogo, 300, 300);
      const res = await FirebaseService.updateTeamProfile(user.id, {
        team_name: profileData.team_name, municipality: profileData.municipality, players_count: profileData.players_count, bio: profileData.bio, logo_url: finalLogo
      });
      setIsSaving(false);
      if (!res.error) { setUser({...user, ...profileData, logo_url: finalLogo}); setEditMode(false); fetchData(true); }
    };

    const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && user.id) {
        setIsSaving(true);
        // Fixed: Argument of type 'unknown' is not assignable to parameter of type 'File' by adding explicit cast to File[]
        for (const file of Array.from(e.target.files) as File[]) {
          const base64 = await fileToBase64(file);
          const compressed = await compressImage(base64);
          await FirebaseService.addToGallery(user.id, compressed);
        }
        await fetchData(true); setIsSaving(false);
      }
    };

    return (
      <div className="max-w-7xl mx-auto py-12 px-4 pb-24 md:pb-12 text-right">
        <div className="bg-slate-900 h-64 md:h-96 rounded-[3rem] relative overflow-hidden mb-16 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>
          <div className="absolute -bottom-12 right-12 flex flex-col md:flex-row items-center gap-8 text-white">
            <div className="relative group">
              <img src={profileData.logo_url} className="w-40 h-40 md:w-56 md:h-56 rounded-[3rem] border-8 border-white bg-white object-cover shadow-2xl" />
              <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={async e => {
                if (e.target.files?.[0]) {
                  const b64 = await fileToBase64(e.target.files[0]);
                  setProfileData({...profileData, logo_url: b64});
                }
              }} />
              <button onClick={() => logoInputRef.current?.click()} className="absolute bottom-2 left-2 bg-blue-600 p-3 rounded-2xl border-4 border-white shadow-xl hover:scale-110 transition-all"><Camera className="w-6 h-6" /></button>
            </div>
            <div className="mb-14 text-center md:text-right">
              <h2 className="text-4xl md:text-6xl font-black italic tracking-tighter">نادي {user.team_name}</h2>
              <p className="text-blue-200 font-bold flex items-center gap-2 justify-center md:justify-end mt-2"><MapPin className="w-5 h-5" /> {user.municipality || user.region}</p>
            </div>
          </div>
          <button onClick={() => setEditMode(!editMode)} className="absolute top-8 right-8 bg-white/10 backdrop-blur-md text-white px-8 py-4 rounded-2xl font-black border border-white/20">
            {editMode ? 'إلغاء' : 'تعديل البروفايل'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mt-24">
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-xl text-white">
               <h3 className="text-xl font-black mb-6 flex items-center gap-3 justify-end">سجل النتائج <Target className="text-rose-500" /></h3>
               <div className="grid grid-cols-2 gap-4">
                 <div className="bg-white/5 p-6 rounded-2xl border border-white/10 text-center"><p className="text-4xl font-black text-emerald-400">{user.wins || 0}</p><p className="text-[10px] text-slate-400 font-black">فوز</p></div>
                 <div className="bg-white/5 p-6 rounded-2xl border border-white/10 text-center"><p className="text-4xl font-black text-rose-500">{user.losses || 0}</p><p className="text-[10px] text-slate-400 font-black">خسارة</p></div>
               </div>
            </div>
            {editMode ? (
              <div className="bg-white p-8 rounded-[2.5rem] shadow-xl space-y-4">
                <input value={profileData.team_name} onChange={e => setProfileData({...profileData, team_name: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl outline-none font-bold text-right text-sm" placeholder="اسم الفريق" />
                <input value={profileData.municipality} onChange={e => setProfileData({...profileData, municipality: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl outline-none font-bold text-right text-sm" placeholder="البلدية/الولاية" />
                <textarea value={profileData.bio} onChange={e => setProfileData({...profileData, bio: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl outline-none font-bold text-right text-sm h-32" placeholder="نبذة عن الفريق" />
                <button onClick={handleUpdate} disabled={isSaving} className="w-full py-4 bg-blue-600 text-white rounded-xl font-black shadow-lg">حفظ التعديلات</button>
              </div>
            ) : (
              <div className="bg-white p-8 rounded-[2.5rem] shadow-xl space-y-6">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl"><p className="text-2xl font-black">{user.players_count || 0}</p><p className="text-[10px] text-slate-400 font-black">عدد اللاعبين</p></div>
                <p className="text-slate-600 font-bold italic leading-relaxed text-lg">"{user.bio || 'نادي طموح مشارك في البطولة.'}"</p>
              </div>
            )}
          </div>
          <div className="lg:col-span-8 space-y-12">
            <div className="flex items-center justify-between bg-white p-8 rounded-[2rem] shadow-xl">
               <div className="text-right"><h3 className="text-2xl font-black italic">ألبوم الفريق</h3><p className="text-slate-400 font-bold text-sm">أجمل لحظات فريقك</p></div>
               <button onClick={() => galleryInputRef.current?.click()} className="bg-slate-900 text-white px-8 py-4 rounded-xl font-black shadow-lg">إضافة صور</button>
               <input type="file" ref={galleryInputRef} multiple className="hidden" accept="image/*" onChange={handleGalleryUpload} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {user.gallery?.map((img, i) => (
                <div key={i} className="aspect-square rounded-[2rem] overflow-hidden border-8 border-white shadow-xl bg-slate-100 group relative">
                   <img src={img} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                   <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                     <button onClick={async () => {
                        await FirebaseService.createPost({ teamId: user.id!, teamName: user.team_name, teamLogo: user.logo_url!, content: 'شارك صورة جديدة من الألبوم 🏆', imageUrl: img });
                        setCurrentView('hub'); fetchData(true);
                     }} className="bg-white text-blue-600 px-4 py-2 rounded-xl font-black text-xs">نشر في الملتقى</button>
                   </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

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
      <div className="max-w-4xl mx-auto py-12 px-4 pb-24 md:pb-12 text-right">
        <h2 className="text-4xl font-black mb-12 italic text-center">ملتقى الفرق</h2>
        {user ? (
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 mb-12">
            <textarea value={newPostContent} onChange={e => setNewPostContent(e.target.value)} placeholder="ما الجديد في فريقك؟" className="w-full p-6 bg-slate-50 rounded-2xl outline-none font-bold text-right text-lg resize-none h-40" />
            {newPostImage && <div className="relative inline-block mt-4"><img src={newPostImage} className="w-32 h-32 rounded-xl object-cover" /><button onClick={() => setNewPostImage('')} className="absolute -top-2 -right-2 bg-rose-500 text-white p-1 rounded-full"><X className="w-4 h-4" /></button></div>}
            <div className="flex items-center justify-between mt-6">
               <button onClick={handlePost} disabled={isPosting} className="bg-blue-600 text-white px-12 py-4 rounded-xl font-black shadow-lg">{isPosting ? 'جاري النشر...' : 'نشر الآن'}</button>
               <button onClick={() => postImageInputRef.current?.click()} className="flex items-center gap-3 text-slate-400 font-black hover:text-blue-600 transition-all"><span>صورة مباراة</span> <ImageIcon /></button>
               <input type="file" ref={postImageInputRef} className="hidden" accept="image/*" onChange={async e => {
                 if (e.target.files?.[0]) {
                   const b64 = await fileToBase64(e.target.files[0]);
                   setNewPostImage(await compressImage(b64, 800, 800));
                 }
               }} />
            </div>
          </div>
        ) : (
          <div className="bg-slate-900 text-white p-12 rounded-[2.5rem] text-center mb-12">
            <h3 className="text-2xl font-black mb-4 italic">كن جزءاً من الحدث!</h3>
            <p className="text-slate-400 mb-8 font-bold">سجل دخولك الآن للتفاعل مع الفرق الرياضية.</p>
            <button onClick={() => setCurrentView('login')} className="bg-blue-600 px-10 py-4 rounded-xl font-black">تسجيل الدخول</button>
          </div>
        )}
        <div className="space-y-8">
          {posts.map(post => <PostCard key={post.id} post={post} currentUser={user} onRefresh={() => fetchData(true)} />)}
          {posts.length === 0 && <div className="text-center py-20 text-slate-300 font-black text-2xl italic">لا توجد منشورات حتى الآن</div>}
        </div>
      </div>
    );
  };

  const AdminLogin = () => {
    return (
      <div className="max-w-md mx-auto py-24 px-6 text-center">
        <div className="bg-slate-900 rounded-[3.5rem] p-12 shadow-2xl border border-slate-800 text-white">
          <div className="bg-blue-600 w-20 h-20 rounded-3xl mx-auto mb-8 flex items-center justify-center rotate-3 shadow-xl"><ShieldAlert className="w-10 h-10" /></div>
          <h3 className="text-3xl font-black mb-10 italic">بوابة المشرف السرية</h3>
          <form onSubmit={async (e) => {
            e.preventDefault();
            const target = e.target as any;
            if (target[0].value === ADMIN_CREDS.email && target[1].value === ADMIN_CREDS.pass) {
              setIsAdmin(true); localStorage.setItem(ADMIN_KEY, 'true'); setCurrentView('admin'); fetchData(true); 
            } else alert("خطأ في البيانات السرية.");
          }} className="space-y-5">
            <input type="email" required placeholder="البريد السري" className="w-full p-5 bg-slate-800 border border-slate-700 rounded-2xl outline-none font-bold text-right" />
            <input type="password" required placeholder="كلمة المرور" className="w-full p-5 bg-slate-800 border border-slate-700 rounded-2xl outline-none font-bold text-right" />
            <button type="submit" className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl hover:bg-blue-700 transition-all">دخول لوحة التحكم</button>
          </form>
          <button onClick={() => { setCurrentView('home'); window.location.hash = ''; }} className="mt-8 text-slate-500 font-bold hover:text-white transition-colors">إلغاء</button>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (isLoading) return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-6">
        <div className="w-20 h-20 border-8 border-blue-600/10 border-t-blue-600 rounded-full animate-spin"></div>
        <h2 className="text-2xl font-black text-slate-800">جاري التحميل...</h2>
      </div>
    );
    if (permissionError) return <PermissionAlert />;
    if (currentView === 'admin' && isAdmin) return (
       <div className="max-w-7xl mx-auto py-10 px-6">
         <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12 bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 text-right">
           <div><h2 className="text-3xl font-black flex items-center gap-3 justify-end">الإدارة المركزية <Lock className="text-blue-600" /></h2><p className="text-slate-400 font-bold">أهلاً بك مشرف البطولة، لديك الصلاحية الكاملة.</p></div>
           <div className="flex gap-4"><div className="bg-blue-50 px-6 py-2 rounded-xl text-center"><p className="text-xl font-black text-blue-600">{allTeams.length}</p><p className="text-[10px] text-slate-400">أندية</p></div><div className="bg-rose-50 px-6 py-2 rounded-xl text-center"><p className="text-xl font-black text-rose-600">{posts.length}</p><p className="text-[10px] text-slate-400">منشورات</p></div></div>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {allTeams.map(t => (
             <div key={t.id} className="bg-white p-6 rounded-[2rem] shadow-lg text-right">
               <div className="flex items-center gap-4 mb-6 justify-end"><div><h4 className="font-black">{t.team_name}</h4><p className="text-[10px] text-slate-400">{t.region}</p></div><img src={t.logo_url} className="w-12 h-12 rounded-xl object-cover" /></div>
               <div className="flex gap-2"><button onClick={() => FirebaseService.deleteTeam(t.id!).then(() => fetchData(true))} className="flex-1 py-3 bg-rose-50 text-rose-500 rounded-xl font-black text-xs">حذف الفريق</button></div>
             </div>
           ))}
         </div>
       </div>
    );
    if (currentView === 'admin-login') return <AdminLogin />;
    
    switch (currentView) {
      case 'profile': return <ProfileView />;
      case 'hub': return <HubView />;
      case 'live': return (
        <div className="max-w-7xl mx-auto py-12 px-6 pb-24 md:pb-12 text-right">
          <h2 className="text-4xl font-black flex items-center gap-4 justify-end italic mb-12">قنوات البث المباشر <Radio className="text-red-600 animate-pulse" /></h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {liveChannels.map(ch => (
              <div key={ch.id} className="bg-white rounded-[2.5rem] p-6 shadow-xl border border-slate-100">
                <div className="h-56 w-full rounded-[2rem] overflow-hidden mb-6 relative"><img src={ch.thumbnail_url} className="w-full h-full object-cover" /><div className="absolute top-3 right-3 bg-red-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase">مباشر</div></div>
                <h4 className="font-black text-xl mb-4 truncate">{ch.name}</h4>
                <button onClick={() => window.open(ch.stream_url, '_blank')} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black hover:bg-blue-600 transition-all">شاهد الآن</button>
              </div>
            ))}
          </div>
        </div>
      );
      case 'login': return (
        <div className="max-w-md mx-auto py-24 px-6 text-center">
          <div className="bg-white rounded-[3rem] p-12 shadow-2xl border border-slate-100">
            <div className="bg-blue-600 w-20 h-20 rounded-3xl mx-auto mb-8 flex items-center justify-center rotate-3"><Trophy className="w-10 h-10 text-white" /></div>
            <h3 className="text-3xl font-black mb-10 italic">دخول النادي</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const target = e.target as any;
              const { data, error } = await FirebaseService.loginTeam(target[0].value, target[1].value);
              if (error) alert(error);
              else { setUser(data); localStorage.setItem(SESSION_KEY, data.id!); setCurrentView('profile'); fetchData(true); }
            }} className="space-y-5">
              <input type="email" required placeholder="البريد الإلكتروني" className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-right" />
              <input type="password" required placeholder="كلمة المرور" className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-right" />
              <button type="submit" className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl hover:bg-blue-700 transition-all">تأكيد الدخول</button>
            </form>
          </div>
        </div>
      );
      case 'register': return (
        <div className="max-w-md mx-auto py-24 px-6 text-center">
          <div className="bg-white rounded-[3rem] p-12 shadow-2xl border border-slate-100">
            <h3 className="text-3xl font-black mb-10 italic">تسجيل فريق جديد</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const target = e.target as any;
              const res = await FirebaseService.registerTeam({ team_name: target[0].value, coach_name: target[1].value, contact_email: target[2].value, password: target[3].value, region: target[4].value });
              if (res.error) alert(res.error);
              else { alert('تم التسجيل بنجاح!'); setCurrentView('login'); fetchData(true); }
            }} className="space-y-4">
              <input required placeholder="اسم الفريق" className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-right" />
              <input required placeholder="اسم المدرب" className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-right" />
              <input type="email" required placeholder="البريد الإلكتروني" className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-right" />
              <input type="password" required placeholder="كلمة المرور" className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-right" />
              <input required placeholder="الولاية" className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-right" />
              <button type="submit" className="w-full py-5 bg-slate-900 text-white font-black rounded-2xl shadow-xl transition-all">تقديم الطلب</button>
            </form>
          </div>
        </div>
      );
      default: return (
        <>
          <section className="bg-slate-900 pt-32 pb-48 px-4 text-center text-white relative">
             <div className="relative z-10 max-w-5xl mx-auto">
               <div className="inline-block px-6 py-2 bg-blue-600/20 backdrop-blur-md rounded-full text-blue-400 font-black text-xs uppercase mb-8 border border-blue-600/30">الموسم الرياضي 2024</div>
               <h1 className="text-6xl md:text-9xl font-black mb-10 leading-[1.1] tracking-tighter italic">بوابة البطولة</h1>
               <p className="text-slate-400 text-2xl mb-16 font-light max-w-2xl mx-auto leading-relaxed italic px-4">مجتمع رياضي رقمي متكامل لإدارة الفرق، النتائج، والبث المباشر بأعلى التقنيات.</p>
               <div className="flex flex-col md:flex-row justify-center gap-6 px-4">
                 <button onClick={() => setCurrentView('register')} className="w-full md:w-auto px-14 py-6 bg-blue-600 rounded-[2rem] font-black text-xl shadow-2xl active:scale-95 transition-all">سجل فريقك</button>
                 <button onClick={() => setCurrentView('hub')} className="w-full md:w-auto px-14 py-6 bg-white/10 rounded-[2rem] font-black text-xl border border-white/20 hover:bg-white/20 transition-all backdrop-blur-md">ملتقى الفرق</button>
               </div>
             </div>
          </section>
          <section className="py-32 px-4 bg-white">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between gap-6 mb-24 text-right px-4">
                <div className="bg-slate-50 px-8 py-4 rounded-3xl border border-slate-100 font-black text-3xl text-blue-600">{allTeams.length} <span className="text-slate-400 text-lg">فريق</span></div>
                <h2 className="text-5xl font-black text-slate-900 flex items-center gap-5 italic justify-end">النخبة المشاركة <Users className="text-blue-600 w-12 h-12" /></h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-10">
                {allTeams.map(team => (
                  <div key={team.id} className="text-center group">
                    <img src={team.logo_url} className="w-36 h-36 mx-auto rounded-[2.5rem] border-4 border-white shadow-xl group-hover:scale-110 transition-all duration-500 bg-white object-cover mb-6" />
                    <p className="font-black text-slate-800 text-lg group-hover:text-blue-600 transition-colors truncate px-2">{team.team_name}</p>
                    <p className="text-[10px] text-slate-400 font-black uppercase mt-1 bg-slate-50 inline-block px-3 py-1 rounded-full">{team.region}</p>
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
    <div className="min-h-screen font-sans bg-[#fcfdfe]" dir="rtl">
      <nav className="bg-white/90 backdrop-blur-xl border-b border-slate-100 py-4 px-4 md:px-12 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3 font-black text-2xl cursor-pointer hover:scale-105 transition-transform" onClick={() => {setCurrentView('home'); window.location.hash = '';}}>
          <div className="bg-blue-600 p-2 rounded-2xl shadow-lg"><Trophy className="w-7 h-7 text-white" /></div>
          <span className="tracking-tighter italic hidden sm:inline">بوابة البطولة</span>
        </div>
        <div className="hidden lg:flex gap-12 text-[11px] font-black uppercase tracking-widest text-slate-400">
           <button onClick={() => {setCurrentView('home'); window.location.hash = '';}} className={`hover:text-blue-600 transition-colors ${currentView === 'home' ? 'text-blue-600' : ''}`}>الرئيسية</button>
           <button onClick={() => setCurrentView('hub')} className={`hover:text-blue-600 transition-colors ${currentView === 'hub' ? 'text-blue-600' : ''}`}>الملتقى</button>
           <button onClick={() => setCurrentView('live')} className={`hover:text-blue-600 transition-colors ${currentView === 'live' ? 'text-red-600' : ''}`}>مباشر</button>
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
                 <div className="absolute top-full left-0 mt-3 w-64 bg-white rounded-[2rem] shadow-2xl border border-slate-100 p-2 z-[100] text-right">
                   <button onClick={() => {setCurrentView('admin'); setIsUserMenuOpen(false);}} className="w-full flex items-center justify-end gap-3 p-4 hover:bg-slate-50 rounded-2xl transition-colors text-slate-600 font-bold">لوحة التحكم المركزية <Lock className="w-5 h-5" /></button>
                   <button onClick={() => {setCurrentView('hub'); setIsUserMenuOpen(false);}} className="w-full flex items-center justify-end gap-3 p-4 hover:bg-slate-50 rounded-2xl transition-colors text-slate-600 font-bold">مراقبة المنشورات <Hash className="w-5 h-5" /></button>
                   <div className="mt-2 pt-2 border-t border-slate-50"><button onClick={handleLogout} className="w-full flex items-center justify-end gap-3 p-4 hover:bg-red-50 rounded-2xl transition-colors text-red-500 font-bold">خروج المسؤول <LogOut className="w-5 h-5" /></button></div>
                 </div>
               )}
             </div>
          ) : user ? (
            <div className="relative" ref={menuRef}>
              <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="flex items-center gap-4 p-1 pr-5 pl-1 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-white transition-all">
                <div className="text-right hidden sm:block"><p className="text-[9px] font-black text-slate-400">ناديك</p><p className="text-sm font-black truncate max-w-[120px]">{user.team_name}</p></div>
                <img src={user.logo_url} className="w-10 h-10 rounded-xl shadow-md border-2 border-white object-cover" />
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {isUserMenuOpen && (
                <div className="absolute top-full left-0 mt-3 w-64 bg-white rounded-[2rem] shadow-2xl border border-slate-100 p-2 z-[100] text-right">
                  <button onClick={() => {setCurrentView('profile'); setIsUserMenuOpen(false);}} className="w-full flex items-center justify-end gap-3 p-4 hover:bg-slate-50 rounded-2xl transition-colors text-slate-600 font-bold">بروفايل النادي <User className="w-5 h-5" /></button>
                  <div className="mt-2 pt-2 border-t border-slate-50"><button onClick={handleLogout} className="w-full flex items-center justify-end gap-3 p-4 hover:bg-red-50 rounded-2xl transition-colors text-red-500 font-bold">تسجيل الخروج <LogOut className="w-5 h-5" /></button></div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex gap-3">
              <button onClick={() => setCurrentView('login')} className="px-8 py-3 bg-slate-100 text-[12px] font-black rounded-xl transition-all uppercase">دخول</button>
              <button onClick={() => setCurrentView('register')} className="px-8 py-3 bg-blue-600 text-white text-[12px] font-black rounded-xl shadow-lg active:scale-95">انضمام</button>
            </div>
          )}
        </div>
      </nav>
      <main className="min-h-[80vh] relative">{renderContent()}</main>
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-4">
        <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 h-16 rounded-2xl shadow-2xl flex items-center justify-around px-2 text-slate-500">
           <button onClick={() => { setCurrentView('home'); window.location.hash = ''; }} className={`flex flex-col items-center gap-1 ${currentView === 'home' ? 'text-blue-400' : ''}`}><Home className="w-5 h-5" /><span className="text-[9px] font-bold">الرئيسية</span></button>
           <button onClick={() => setCurrentView('hub')} className={`flex flex-col items-center gap-1 ${currentView === 'hub' ? 'text-blue-400' : ''}`}><Hash className="w-5 h-5" /><span className="text-[9px] font-bold">الملتقى</span></button>
           <button onClick={() => setCurrentView('live')} className={`flex flex-col items-center gap-1 ${currentView === 'live' ? 'text-red-400' : ''}`}><Radio className="w-5 h-5" /><span className="text-[9px] font-bold">مباشر</span></button>
           {(user || isAdmin) && ( <button onClick={() => setCurrentView(isAdmin ? 'admin' : 'profile')} className={`flex flex-col items-center gap-1 ${currentView === 'profile' || currentView === 'admin' ? 'text-blue-400' : ''}`}>{isAdmin ? <Lock className="w-5 h-5" /> : <User className="w-5 h-5" />}<span className="text-[9px] font-bold">{isAdmin ? 'إدارة' : 'بروفايل'}</span></button> )}
        </div>
      </div>
      <footer className="bg-slate-900 text-slate-500 py-24 text-center relative overflow-hidden pb-40">
        <div className="max-w-4xl mx-auto px-6 relative z-10">
          <button onClick={handleSecretClick} className="focus:outline-none transition-opacity opacity-10 hover:opacity-100 active:rotate-12 mb-8">
            <Trophy className="w-16 h-16 text-blue-600" />
          </button>
          <h3 className="text-white font-black text-2xl mb-4 italic text-center">بوابة البطولة الرقمية</h3>
          <p className="text-xs opacity-60 font-bold uppercase mb-12 text-center px-4">مدعوم بتقنية Google Firebase &bull; 2024</p>
        </div>
      </footer>
    </div>
  );
}
