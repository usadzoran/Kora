import React, { useState, useEffect, useRef } from 'react';
import { FirebaseService } from './services/firebase';
import { TeamRegistration, LiveChannel, Post, Comment } from './types';
import { 
  Trophy, Shield, Loader2, Radio, ExternalLink, RefreshCw, LogOut, Save, Copy, Check, User, 
  LayoutGrid, Image as ImageIcon, Send, MapPin, Users, Plus, Hash, Edit3, Camera, Heart, 
  MessageSquare, ChevronDown, Settings, Upload, X, Share2
} from 'lucide-react';

type ViewState = 'home' | 'profile' | 'live' | 'hub' | 'login' | 'register';

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
  const [permissionError, setPermissionError] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setPermissionError(false);
    try {
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
      setIsLoading(false);
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

    return (
      <div className="bg-white rounded-[3rem] shadow-xl border border-slate-50 overflow-hidden hover:shadow-2xl transition-all duration-500 group animate-in slide-in-from-bottom-4">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4 text-right">
              <div className="order-2">
                <h4 className="font-black text-xl text-slate-900 group-hover:text-blue-600 transition-colors">{post.teamName}</h4>
                <p className="text-[11px] text-slate-400 font-black uppercase tracking-widest mt-0.5">
                  {new Date(post.created_at?.toDate ? post.created_at.toDate() : post.created_at).toLocaleString('ar-DZ')}
                </p>
              </div>
              <img src={post.teamLogo} className="w-14 h-14 rounded-2xl shadow-md border border-slate-100 object-cover order-1" />
            </div>
          </div>
          <p className="text-slate-700 text-lg leading-relaxed mb-8 font-semibold pr-4 border-r-4 border-blue-500/10 text-right whitespace-pre-wrap">{post.content}</p>
          {post.imageUrl && (
            <div className="rounded-[2.5rem] overflow-hidden border-4 border-slate-50 shadow-inner group-hover:scale-[1.01] transition-transform duration-500 mb-8">
              <img src={post.imageUrl} className="w-full max-h-[600px] object-cover" />
            </div>
          )}
          <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-8">
              <button 
                onClick={handleLike}
                disabled={!currentUser}
                className={`flex items-center gap-2 font-black transition-colors ${isLiked ? 'text-red-500' : 'text-slate-400 hover:text-red-500'}`}
              >
                <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
                <span>{post.likes?.length || 0}</span>
              </button>
              <button 
                onClick={() => setShowComments(!showComments)}
                className="flex items-center gap-2 text-slate-400 font-black hover:text-blue-600 transition-colors"
              >
                <MessageSquare className="w-6 h-6" />
                <span>{post.comments?.length || 0}</span>
              </button>
            </div>
            <button className="text-slate-300 hover:text-blue-600 transition-colors"><Share2 className="w-5 h-5" /></button>
          </div>

          {showComments && (
            <div className="mt-8 pt-8 border-t border-slate-50 space-y-6 animate-in fade-in slide-in-from-top-2">
              {post.comments?.map((comment) => (
                <div key={comment.id} className="flex gap-3 text-right">
                  <div className="flex-1 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">
                        {new Date(comment.created_at?.toDate ? comment.created_at.toDate() : comment.created_at).toLocaleTimeString('ar-DZ')}
                      </span>
                      <p className="font-black text-sm text-slate-900">{comment.teamName}</p>
                    </div>
                    <p className="text-sm text-slate-600 font-medium">{comment.text}</p>
                  </div>
                  <img src={comment.teamLogo} className="w-10 h-10 rounded-xl object-cover shadow-sm" />
                </div>
              ))}
              
              {currentUser ? (
                <form onSubmit={handleComment} className="flex gap-3">
                  <button 
                    type="submit" 
                    disabled={isSubmittingComment || !commentText.trim()}
                    className="bg-blue-600 text-white p-3 px-6 rounded-2xl font-black shadow-lg shadow-blue-500/20 disabled:opacity-50 transition-all hover:bg-blue-700 active:scale-95"
                  >
                    {isSubmittingComment ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  </button>
                  <input 
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="اكتب تعليقاً..."
                    className="flex-1 bg-slate-50 p-4 rounded-2xl border border-slate-100 outline-none focus:ring-4 ring-blue-500/5 text-sm font-bold text-right"
                  />
                </form>
              ) : (
                <p className="text-center text-slate-400 text-xs font-bold py-4">يجب تسجيل الدخول للتعليق</p>
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
      const res = await FirebaseService.updateTeamProfile(user.id, {
        team_name: profileData.team_name,
        municipality: profileData.municipality,
        players_count: profileData.players_count,
        bio: profileData.bio,
        logo_url: profileData.logo_url
      });
      setIsSaving(false);
      if (!res.error) {
        setUser({...user, ...profileData});
        setEditMode(false);
        fetchData();
      }
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        try {
          const base64 = await fileToBase64(file);
          setProfileData(prev => ({ ...prev, logo_url: base64 }));
        } catch (err) {
          console.error("Logo upload error:", err);
        }
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
            await FirebaseService.addToGallery(user.id, base64);
          }
          fetchData();
        } catch (err) {
          console.error("Gallery upload error:", err);
        } finally {
          setIsSaving(false);
        }
      }
    };

    return (
      <div className="max-w-6xl mx-auto py-12 px-6 animate-in slide-in-from-bottom duration-500">
        <div className="bg-white rounded-[3.5rem] shadow-2xl overflow-hidden border border-slate-100">
          <div className="h-80 bg-gradient-to-br from-blue-700 via-indigo-800 to-slate-900 relative">
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
            
            <div className="absolute -bottom-20 right-12 flex items-end gap-8 z-10">
              <div className="relative group">
                <div className="absolute inset-0 bg-blue-600 rounded-[3rem] blur-2xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                <img 
                  src={profileData.logo_url} 
                  className="w-48 h-48 rounded-[3rem] border-[10px] border-white shadow-2xl bg-white object-cover transition-all group-hover:scale-[1.02] relative" 
                />
                <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
                <button 
                  onClick={() => logoInputRef.current?.click()}
                  className="absolute bottom-4 left-4 bg-blue-600 p-3 rounded-2xl text-white shadow-lg cursor-pointer hover:scale-110 transition-all z-20"
                >
                  <Camera className="w-6 h-6" />
                </button>
              </div>
              <div className="mb-8 text-right">
                <h2 className="text-5xl font-black text-white drop-shadow-2xl">{user.team_name}</h2>
                <p className="text-blue-100 font-bold flex items-center gap-2 mt-2 text-lg opacity-90 justify-end">
                  {user.municipality || user.region} <MapPin className="w-5 h-5 text-blue-300" />
                </p>
              </div>
            </div>

            <div className="absolute top-8 left-12 flex gap-3">
              <button 
                onClick={() => setEditMode(!editMode)} 
                className={`px-8 py-4 ${editMode ? 'bg-red-500 text-white' : 'bg-white/10 text-white'} backdrop-blur-xl rounded-3xl font-black flex items-center gap-3 border border-white/20 hover:bg-white/20 transition-all shadow-xl`}
              >
                {editMode ? <X className="w-5 h-5" /> : <Edit3 className="w-5 h-5" />}
                {editMode ? 'إلغاء' : 'تعديل البيانات'}
              </button>
            </div>
          </div>
          
          <div className="pt-32 px-12 pb-16 grid grid-cols-1 lg:grid-cols-3 gap-16">
            <div className="lg:col-span-1 space-y-10">
              <div className="bg-slate-900 text-white p-10 rounded-[3.5rem] shadow-2xl text-center">
                <h3 className="font-black text-2xl mb-10 flex items-center gap-3 justify-center">السجل الذهبي <Trophy className="text-yellow-400 w-8 h-8" /></h3>
                <div className="grid grid-cols-2 gap-8">
                  <div><span className="text-4xl font-black text-emerald-400 block">{user.wins || 0}</span><p className="text-xs text-slate-400 font-black uppercase mt-2">فوز</p></div>
                  <div><span className="text-4xl font-black text-red-400 block">{user.losses || 0}</span><p className="text-xs text-slate-400 font-black uppercase mt-2">خسارة</p></div>
                </div>
              </div>

              <div className="bg-slate-50 p-10 rounded-[3.5rem] border border-slate-100 shadow-sm text-right">
                <h3 className="font-black text-2xl mb-8 text-slate-800 border-b pb-6">بيانات النادي</h3>
                {editMode ? (
                  <div className="space-y-6">
                    <input value={profileData.team_name} onChange={e => setProfileData({...profileData, team_name: e.target.value})} className="w-full p-5 bg-white border border-slate-200 rounded-[1.5rem] outline-none font-bold text-right" placeholder="اسم الفريق" />
                    <input value={profileData.municipality} onChange={e => setProfileData({...profileData, municipality: e.target.value})} className="w-full p-5 bg-white border border-slate-200 rounded-[1.5rem] outline-none font-bold text-right" placeholder="البلدية" />
                    <input type="number" value={profileData.players_count} onChange={e => setProfileData({...profileData, players_count: parseInt(e.target.value)})} className="w-full p-5 bg-white border border-slate-200 rounded-[1.5rem] outline-none font-bold text-right" placeholder="عدد اللاعبين" />
                    <textarea value={profileData.bio} onChange={e => setProfileData({...profileData, bio: e.target.value})} className="w-full p-5 bg-white border border-slate-200 rounded-[1.5rem] outline-none h-32 resize-none font-medium text-right" placeholder="نبذة..." />
                    <button onClick={handleUpdate} disabled={isSaving} className="w-full py-5 bg-blue-600 text-white rounded-[1.5rem] font-black shadow-xl hover:bg-blue-700 flex items-center justify-center gap-3">
                      {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />} حفظ
                    </button>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className="flex items-center justify-between p-6 bg-white rounded-3xl border border-slate-100"><span className="text-xl font-black text-slate-800">{user.players_count || 0} لاعب</span><Users className="w-7 h-7 text-blue-600" /></div>
                    <div className="flex items-center justify-between p-6 bg-white rounded-3xl border border-slate-100"><span className="text-xl font-black text-slate-800">{user.municipality || user.region}</span><MapPin className="w-7 h-7 text-blue-600" /></div>
                    <p className="text-slate-600 font-semibold italic text-lg pr-4 border-r-4 border-blue-500/20">"{user.bio || 'لا يوجد وصف متاح حالياً.'}"</p>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-2 space-y-12">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 text-right">
                <div className="order-2 md:order-1">
                  <div className="flex items-center gap-4 mb-2 justify-end">
                    <h3 className="text-4xl font-black text-slate-900 italic tracking-tighter">معرض الفريق</h3>
                    <ImageIcon className="text-blue-600 w-10 h-10" />
                  </div>
                  <p className="text-slate-400 font-bold">أفضل اللقطات والمباريات التاريخية</p>
                </div>
                <div className="order-1 md:order-2">
                  <input type="file" ref={galleryInputRef} multiple className="hidden" accept="image/*" onChange={handleGalleryUpload} />
                  <button onClick={() => galleryInputRef.current?.click()} disabled={isSaving} className="bg-slate-900 text-white px-8 py-4 rounded-[1.5rem] hover:bg-blue-600 transition-all flex items-center gap-3 font-black shadow-xl disabled:opacity-50">
                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />} رفع صور
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {user.gallery?.map((img, i) => (
                  <div key={i} className="aspect-[4/5] rounded-[2.5rem] overflow-hidden border-[6px] border-white shadow-2xl group relative cursor-pointer hover:-translate-y-2 transition-all duration-500">
                    <img src={img} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                  </div>
                ))}
              </div>
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
      if (!user || !newPostContent) return;
      setIsPosting(true);
      try {
        await FirebaseService.createPost({
          teamId: user.id!,
          teamName: user.team_name,
          teamLogo: user.logo_url!,
          content: newPostContent,
          imageUrl: newPostImage || undefined
        });
        setNewPostContent('');
        setNewPostImage('');
        fetchData();
      } finally {
        setIsPosting(false);
      }
    };

    const handlePostImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        try {
          const base64 = await fileToBase64(file);
          setNewPostImage(base64);
        } catch (err) {
          console.error("Post image upload error:", err);
        }
      }
    };

    return (
      <div className="max-w-4xl mx-auto py-12 px-6 animate-in fade-in duration-700">
        <div className="flex items-center justify-between mb-12 text-right">
          <div className="w-full">
            <h2 className="text-4xl font-black text-slate-900 flex items-center gap-4 italic justify-end">ملتقى الفرق <Hash className="text-blue-600 w-10 h-10" /></h2>
            <p className="text-slate-400 font-bold mr-0">تواصل وشارك أخبارك مع مجتمع البطولة</p>
          </div>
        </div>
        
        {user ? (
          <div className="bg-white p-8 rounded-[3rem] shadow-2xl border border-slate-100 mb-12 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-2 h-full bg-blue-600 group-hover:w-3 transition-all"></div>
            <div className="flex gap-6 text-right">
              <div className="flex-1 space-y-4">
                <textarea 
                  value={newPostContent} 
                  onChange={e => setNewPostContent(e.target.value)} 
                  placeholder={`ما الجديد في فريق ${user.team_name}؟`} 
                  className="w-full p-6 bg-slate-50 border-none rounded-[2rem] outline-none focus:ring-4 ring-blue-500/5 resize-none h-40 text-lg font-medium placeholder:text-slate-300 text-right" 
                />
                
                {newPostImage && (
                  <div className="relative inline-block group float-right">
                    <img src={newPostImage} className="w-32 h-32 rounded-2xl object-cover border-4 border-white shadow-lg" />
                    <button onClick={() => setNewPostImage('')} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-lg"><X className="w-4 h-4" /></button>
                  </div>
                )}

                <div className="flex flex-col md:flex-row items-center gap-4 clear-both pt-4">
                  <button 
                    onClick={handlePost} 
                    disabled={isPosting || !newPostContent} 
                    className="w-full md:w-auto px-12 py-4 bg-blue-600 text-white rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-blue-700 disabled:opacity-50 shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
                  >
                    {isPosting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />} نشر الآن
                  </button>
                  <div className="flex-1 w-full">
                    <input type="file" ref={postImageInputRef} className="hidden" accept="image/*" onChange={handlePostImageUpload} />
                    <button 
                      onClick={() => postImageInputRef.current?.click()}
                      className="w-full pr-6 pl-4 py-4 bg-slate-50 rounded-2xl text-sm font-bold border-none outline-none flex items-center gap-3 text-slate-400 hover:bg-slate-100 transition-all justify-end"
                    >
                      {newPostImage ? 'تغيير الصورة المرفقة' : 'إرفاق صورة من الجهاز'} <ImageIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
              <img src={user.logo_url} className="w-16 h-16 rounded-[1.5rem] shadow-lg border-2 border-slate-50 object-cover" />
            </div>
          </div>
        ) : (
          <div className="bg-blue-600 text-white p-12 rounded-[3.5rem] shadow-xl text-center mb-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
            <h3 className="text-3xl font-black mb-4">سجل دخولك لتشارك في الملتقى</h3>
            <p className="text-blue-100 mb-10 text-lg opacity-80">انضم إلى مجتمع الفرق الرياضية وشارك أخبارك وصورك وتفاعل مع الفرق الأخرى.</p>
            <button onClick={() => setCurrentView('login')} className="px-14 py-4 bg-white text-blue-600 rounded-2xl font-black shadow-xl hover:scale-105 transition-transform active:scale-95">تسجيل الدخول الآن</button>
          </div>
        )}

        <div className="space-y-12 pb-24">
          {posts.map(post => (
            <PostCard key={post.id} post={post} currentUser={user} onRefresh={fetchData} />
          ))}
          {posts.length === 0 && (
            <div className="py-32 text-center text-slate-300 font-black text-2xl border-4 border-dashed rounded-[4rem] bg-slate-50">
              <Hash className="w-20 h-20 mx-auto mb-4 opacity-10" />
              لا يوجد نشاط في الملتقى حالياً
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (isLoading) return <div className="h-[70vh] flex flex-col items-center justify-center gap-4"><Loader2 className="w-16 h-16 animate-spin text-blue-600 opacity-20" /><p className="text-slate-400 font-black animate-pulse">جاري المزامنة مع السحاب...</p></div>;
    if (permissionError) return <PermissionAlert />;

    switch (currentView) {
      case 'profile': return <ProfileView />;
      case 'hub': return <HubView />;
      case 'live': return (
        <div className="max-w-7xl mx-auto py-16 px-6">
          <h2 className="text-4xl font-black flex items-center gap-4 italic mb-16 justify-end">قنوات البث المباشر <Radio className="text-red-600 animate-pulse w-10 h-10" /></h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {liveChannels.map(ch => (
              <div key={ch.id} className="bg-white rounded-[3.5rem] border border-slate-100 p-6 shadow-xl hover:shadow-2xl transition-all group overflow-hidden relative text-right">
                <div className="h-56 w-full relative mb-6 rounded-[2.5rem] overflow-hidden">
                  <img src={ch.thumbnail_url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1"><div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div> مباشر</div>
                </div>
                <h4 className="font-black text-2xl mb-4 text-slate-800 pr-2">{ch.name}</h4>
                <button onClick={() => window.open(ch.stream_url, '_blank')} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black hover:bg-blue-600 flex items-center justify-center gap-3 transition-all shadow-xl shadow-slate-900/10">
                  انضم للبث <ExternalLink className="w-5 h-5" />
                </button>
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
              else { setUser(data); setCurrentView('profile'); }
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
            <h3 className="text-3xl font-black mb-10 text-slate-900 italic tracking-tight">تسجيل فريق جديد</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const target = e.target as any;
              const res = await FirebaseService.registerTeam({
                team_name: target[0].value,
                coach_name: target[1].value,
                contact_email: target[2].value,
                password: target[3].value,
                region: target[4].value
              });
              if (res.error) alert(res.error);
              else { alert('تم التسجيل بنجاح!'); setCurrentView('login'); fetchData(); }
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
               <h1 className="text-7xl md:text-9xl font-black mb-10 leading-tight tracking-tighter italic">بوابة البطولة</h1>
               <p className="text-slate-400 text-2xl mb-16 font-light max-w-3xl mx-auto leading-relaxed italic">مجتمع رياضي رقمي متكامل لإدارة الفرق، النتائج، والبث المباشر بأعلى التقنيات.</p>
               <div className="flex flex-wrap justify-center gap-6">
                 <button onClick={() => setCurrentView('register')} className="px-14 py-6 bg-blue-600 rounded-[2.5rem] font-black text-xl shadow-2xl shadow-blue-600/20 hover:scale-105 transition-transform active:scale-95">سجل فريقك مجاناً</button>
                 <button onClick={() => setCurrentView('hub')} className="px-14 py-6 bg-white/10 rounded-[2.5rem] font-black text-xl border border-white/20 hover:bg-white/20 transition-all backdrop-blur-md">ملتقى الفرق</button>
               </div>
             </div>
          </section>
          
          <section className="py-32 px-6 bg-white relative">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-24 text-right">
                <div className="bg-slate-50 px-8 py-4 rounded-3xl border border-slate-100 order-2 md:order-1">
                  <span className="font-black text-3xl text-blue-600">{allTeams.length}</span> <span className="text-slate-400 font-bold mr-2">فريق</span>
                </div>
                <div className="order-1 md:order-2">
                  <h2 className="text-5xl font-black text-slate-900 flex items-center gap-5 italic justify-end">النخبة المشاركة <Users className="text-blue-600 w-12 h-12" /></h2>
                  <p className="text-slate-400 font-bold mt-2">الفرق الرياضية المسجلة رسمياً في المنصة</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-10">
                {allTeams.map(team => (
                  <div key={team.id} className="text-center group cursor-pointer">
                    <div className="relative mx-auto mb-6">
                      <img src={team.logo_url} className="w-28 h-28 md:w-36 md:h-36 rounded-[2.5rem] border-4 border-white shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 bg-white object-cover" />
                      <div className="absolute -bottom-2 -left-2 bg-emerald-500 w-8 h-8 rounded-2xl border-4 border-white shadow-lg"></div>
                    </div>
                    <p className="font-black text-slate-800 text-lg tracking-tight group-hover:text-blue-600 transition-colors">{team.team_name}</p>
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
              <button 
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-4 p-1.5 pr-5 pl-2 bg-slate-50 border border-slate-200 rounded-[1.5rem] hover:bg-white hover:shadow-lg transition-all"
              >
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">مسجل كفريق</p>
                  <p className="text-xs font-black text-slate-900">{user.team_name}</p>
                </div>
                <div className="relative">
                  <img src={user.logo_url} className="w-10 h-10 rounded-2xl shadow-md border-2 border-white object-cover" />
                  <div className="absolute -bottom-1 -right-1 bg-emerald-500 w-3.5 h-3.5 rounded-full border-2 border-white"></div>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isUserMenuOpen && (
                <div className="absolute top-full left-0 mt-3 w-72 bg-white rounded-[2rem] shadow-2xl border border-slate-100 p-3 z-[100] animate-in slide-in-from-top-2 duration-200 text-right">
                  <div className="p-4 mb-2 border-b border-slate-50">
                    <p className="text-sm font-black text-slate-900">{user.team_name}</p>
                    <p className="text-[10px] text-slate-400 font-bold">{user.contact_email}</p>
                  </div>
                  <div className="space-y-1">
                    <button onClick={() => {setCurrentView('profile'); setIsUserMenuOpen(false);}} className="w-full flex items-center justify-end gap-3 p-4 hover:bg-slate-50 rounded-2xl transition-colors text-slate-600 hover:text-blue-600 group text-sm font-bold">
                      بروفايل النادي <User className="w-5 h-5 opacity-50 group-hover:opacity-100" />
                    </button>
                    <button onClick={() => {setCurrentView('hub'); setIsUserMenuOpen(false);}} className="w-full flex items-center justify-end gap-3 p-4 hover:bg-slate-50 rounded-2xl transition-colors text-slate-600 hover:text-blue-600 group text-sm font-bold">
                      مشاركاتي <LayoutGrid className="w-5 h-5 opacity-50 group-hover:opacity-100" />
                    </button>
                    <button className="w-full flex items-center justify-end gap-3 p-4 hover:bg-slate-50 rounded-2xl transition-colors text-slate-600 hover:text-blue-600 group text-sm font-bold">
                      الإعدادات <Settings className="w-5 h-5 opacity-50 group-hover:opacity-100" />
                    </button>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-50">
                    <button onClick={() => { setUser(null); setCurrentView('home'); setIsUserMenuOpen(false); }} className="w-full flex items-center justify-end gap-3 p-4 hover:bg-red-50 rounded-2xl transition-colors text-red-500 group text-sm font-bold">
                      تسجيل الخروج <LogOut className="w-5 h-5" />
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
          <h3 className="text-white font-black text-2xl mb-4 italic tracking-tight">نظام إدارة البطولة الذكي</h3>
          <p className="text-sm opacity-60 font-bold tracking-widest uppercase mb-12">مدعوم بتقنية Google Firebase &bull; جميع الحقوق محفوظة 2024</p>
          <div className="flex justify-center gap-8 text-[11px] font-black uppercase tracking-widest">
            <a href="#" className="hover:text-white transition-colors">عن المنصة</a>
            <a href="#" className="hover:text-white transition-colors">قوانين المشاركة</a>
            <a href="#" className="hover:text-white transition-colors">الدعم الفني</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
