import React, { useState, useEffect } from 'react';
import { FirebaseService } from './services/firebase';
import { TeamRegistration, LiveChannel, Post } from './types';
import { 
  Trophy, Shield, Loader2, Radio, ExternalLink, AlertCircle, Terminal, 
  RefreshCw, LogOut, Save, Copy, Check, User, LayoutGrid, Image as ImageIcon, 
  Send, MapPin, Users, Plus, Hash, Edit3, Camera, Heart, MessageSquare
} from 'lucide-react';

type ViewState = 'home' | 'profile' | 'live' | 'hub' | 'login' | 'register';

const PermissionAlert: React.FC = () => {
  const [copied, setCopied] = useState(false);
  // تم تصحيح الكود ليكون مكتملاً ولا يسبب خطأ EOF
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
      <div className="flex items-center gap-4 text-red-600 mb-6 font-black text-3xl">
        <Shield className="w-12 h-12" />
        <h2>تنبيه: تحديث قواعد Firebase</h2>
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

  useEffect(() => { fetchData(); }, []);

  const ProfileView = () => {
    if (!user) return null;
    const [editMode, setEditMode] = useState(false);
    const [profileData, setProfileData] = useState({...user});
    const [newImageUrl, setNewImageUrl] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleUpdate = async () => {
      if (!user.id) return;
      setIsSaving(true);
      const res = await FirebaseService.updateTeamProfile(user.id, {
        team_name: profileData.team_name,
        municipality: profileData.municipality,
        players_count: profileData.players_count,
        bio: profileData.bio
      });
      setIsSaving(false);
      if (!res.error) {
        setUser({...user, ...profileData});
        setEditMode(false);
        fetchData();
      }
    };

    const handleAddImage = async () => {
      if (!user.id || !newImageUrl) return;
      await FirebaseService.addToGallery(user.id, newImageUrl);
      setUser({...user, gallery: [...(user.gallery || []), newImageUrl]});
      setNewImageUrl('');
    };

    return (
      <div className="max-w-6xl mx-auto py-12 px-6 animate-in slide-in-from-bottom duration-500">
        <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100">
          <div className="h-64 bg-gradient-to-r from-blue-600 to-indigo-900 relative">
            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
            <div className="absolute -bottom-16 right-12 flex items-end gap-6">
              <div className="relative group">
                <img src={user.logo_url} className="w-44 h-44 rounded-[2.5rem] border-8 border-white shadow-2xl bg-white object-cover transition-transform group-hover:scale-105" />
                <div className="absolute bottom-4 left-4 bg-blue-600 p-2 rounded-xl text-white shadow-lg cursor-pointer">
                  <Camera className="w-5 h-5" />
                </div>
              </div>
              <div className="mb-4">
                <h2 className="text-4xl font-black text-white drop-shadow-xl flex items-center gap-3">
                  {user.team_name}
                  {user.wins! > 10 && <Trophy className="w-6 h-6 text-yellow-400" />}
                </h2>
                <p className="text-blue-100 font-bold flex items-center gap-2 mt-1"><MapPin className="w-4 h-4" /> {user.municipality || user.region}</p>
              </div>
            </div>
            <button 
              onClick={() => setEditMode(!editMode)} 
              className="absolute bottom-6 left-12 px-6 py-3 bg-white/20 backdrop-blur-md text-white rounded-2xl font-bold flex items-center gap-2 hover:bg-white/30 transition-all"
            >
              <Edit3 className="w-5 h-5" /> {editMode ? 'إلغاء' : 'تعديل البروفايل'}
            </button>
          </div>
          
          <div className="pt-24 px-12 pb-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-1 space-y-8">
              <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <h3 className="font-black text-2xl mb-6 text-slate-800 border-b pb-4">بيانات النادي</h3>
                {editMode ? (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase mb-1 px-1">اسم الفريق</label>
                      <input value={profileData.team_name} onChange={e => setProfileData({...profileData, team_name: e.target.value})} className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 ring-blue-500/20" placeholder="اسم الفريق" />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase mb-1 px-1">البلدية</label>
                      <input value={profileData.municipality} onChange={e => setProfileData({...profileData, municipality: e.target.value})} className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 ring-blue-500/20" placeholder="البلدية" />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase mb-1 px-1">عدد اللاعبين</label>
                      <input type="number" value={profileData.players_count} onChange={e => setProfileData({...profileData, players_count: parseInt(e.target.value)})} className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 ring-blue-500/20" placeholder="عدد اللاعبين" />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase mb-1 px-1">نبذة عن الفريق</label>
                      <textarea value={profileData.bio} onChange={e => setProfileData({...profileData, bio: e.target.value})} className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 ring-blue-500/20 h-24 resize-none" placeholder="نبذة قصيرة..." />
                    </div>
                    <button onClick={handleUpdate} disabled={isSaving} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl hover:bg-blue-700 flex items-center justify-center gap-2">
                      {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} حفظ التعديلات
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-3"><Users className="w-6 h-6 text-blue-500" /> <span className="font-bold text-slate-700">اللاعبين</span></div>
                      <span className="font-black text-blue-600 bg-blue-50 px-4 py-1 rounded-full">{user.players_count || 0}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-3"><MapPin className="w-6 h-6 text-blue-500" /> <span className="font-bold text-slate-700">البلدية</span></div>
                      <span className="font-bold text-slate-500">{user.municipality || 'غير محدد'}</span>
                    </div>
                    <div className="p-4 bg-white rounded-2xl border border-slate-100">
                      <p className="text-xs font-black text-slate-300 uppercase mb-2">عن النادي</p>
                      <p className="text-slate-600 leading-relaxed font-medium">{user.bio || 'لم يتم إضافة وصف بعد لهذا الفريق الرياضي الطموح.'}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                <h3 className="font-black text-2xl mb-8 flex items-center gap-2 relative"><Trophy className="text-yellow-400" /> لوحة الإنجازات</h3>
                <div className="grid grid-cols-2 gap-6 relative">
                  <div className="bg-white/5 p-6 rounded-3xl border border-white/10 flex flex-col items-center">
                    <p className="text-4xl font-black text-emerald-400">{user.wins || 0}</p>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-2">انتصار</p>
                  </div>
                  <div className="bg-white/5 p-6 rounded-3xl border border-white/10 flex flex-col items-center">
                    <p className="text-4xl font-black text-red-400">{user.losses || 0}</p>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-2">هزيمة</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-3xl font-black flex items-center gap-3 text-slate-800"><ImageIcon className="text-blue-600 w-8 h-8" /> معرض الصور</h3>
                  <p className="text-slate-400 font-medium mr-11">أجمل لحظات الفريق المسجلة</p>
                </div>
                <div className="flex gap-2">
                  <input value={newImageUrl} onChange={e => setNewImageUrl(e.target.value)} placeholder="رابط صورة..." className="px-4 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 ring-blue-500/20 w-48" />
                  <button onClick={handleAddImage} className="bg-blue-600 text-white p-2 px-4 rounded-xl hover:bg-blue-700 shadow-lg transition-all"><Plus className="w-6 h-6" /></button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {user.gallery && user.gallery.length > 0 ? user.gallery.map((img, i) => (
                  <div key={i} className="aspect-square rounded-[2rem] overflow-hidden border-4 border-white shadow-xl group relative cursor-pointer">
                    <img src={img} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button className="bg-white/20 backdrop-blur-md p-3 rounded-full text-white"><ImageIcon className="w-6 h-6" /></button>
                    </div>
                  </div>
                )) : (
                  <div className="col-span-full py-24 text-center border-4 border-dashed rounded-[3rem] bg-slate-50 border-slate-200 group hover:bg-slate-100 transition-colors">
                    <ImageIcon className="w-16 h-16 text-slate-200 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                    <p className="text-slate-300 font-black text-xl italic">ابدأ ببناء قصة فريقك البصرية</p>
                    <p className="text-slate-400 text-sm mt-2 font-bold">أضف روابط الصور من هنا</p>
                  </div>
                )}
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

    return (
      <div className="max-w-4xl mx-auto py-12 px-6 animate-in fade-in duration-700">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-4xl font-black text-slate-900 flex items-center gap-4 italic"><Hash className="text-blue-600 w-10 h-10" /> ملتقى الفرق</h2>
            <p className="text-slate-400 font-bold mr-14">تواصل وشارك مع مجتمع البطولة</p>
          </div>
        </div>
        
        {user ? (
          <div className="bg-white p-8 rounded-[3rem] shadow-2xl border border-slate-100 mb-12 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-2 h-full bg-blue-600 group-hover:w-3 transition-all"></div>
            <div className="flex gap-6">
              <img src={user.logo_url} className="w-16 h-16 rounded-[1.5rem] shadow-lg border-2 border-slate-50" />
              <div className="flex-1 space-y-4">
                <textarea 
                  value={newPostContent} 
                  onChange={e => setNewPostContent(e.target.value)} 
                  placeholder={`ما الجديد في فريق ${user.team_name}؟`} 
                  className="w-full p-6 bg-slate-50 border-none rounded-[2rem] outline-none focus:ring-4 ring-blue-500/5 resize-none h-40 text-lg font-medium placeholder:text-slate-300" 
                />
                <div className="flex flex-col md:flex-row items-center gap-4">
                  <div className="relative flex-1 w-full">
                    <ImageIcon className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                    <input 
                      value={newPostImage} 
                      onChange={e => setNewPostImage(e.target.value)} 
                      placeholder="رابط صورة المنشور (اختياري)" 
                      className="w-full pr-12 pl-4 py-4 bg-slate-50 rounded-2xl text-sm border-none outline-none focus:bg-white focus:ring-4 ring-blue-500/5" 
                    />
                  </div>
                  <button 
                    onClick={handlePost} 
                    disabled={isPosting || !newPostContent} 
                    className="w-full md:w-auto px-12 py-4 bg-blue-600 text-white rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-blue-700 disabled:opacity-50 shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
                  >
                    {isPosting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />} نشر الآن
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-blue-600 text-white p-8 rounded-[2.5rem] shadow-xl text-center mb-12">
            <h3 className="text-xl font-black mb-2">سجل دخولك لتشارك في الملتقى</h3>
            <p className="text-blue-100 mb-6">انضم إلى مجتمع الفرق الرياضية وشارك أخبارك وصورك.</p>
            <button onClick={() => setCurrentView('login')} className="px-10 py-3 bg-white text-blue-600 rounded-xl font-black shadow-lg">تسجيل الدخول</button>
          </div>
        )}

        <div className="space-y-10">
          {posts.map(post => (
            <div key={post.id} className="bg-white rounded-[3rem] shadow-xl border border-slate-50 overflow-hidden hover:shadow-2xl transition-all duration-500 group">
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <img src={post.teamLogo} className="w-14 h-14 rounded-2xl shadow-md border border-slate-100" />
                    <div>
                      <h4 className="font-black text-xl text-slate-900 group-hover:text-blue-600 transition-colors">{post.teamName}</h4>
                      <p className="text-[11px] text-slate-400 font-black uppercase tracking-widest mt-0.5">{new Date(post.created_at?.toDate()).toLocaleString('ar-DZ')}</p>
                    </div>
                  </div>
                  <button className="p-2 text-slate-300 hover:text-blue-600 transition-colors"><Edit3 className="w-5 h-5" /></button>
                </div>
                <p className="text-slate-700 text-lg leading-relaxed mb-8 font-semibold pr-2 border-r-4 border-blue-500/10">{post.content}</p>
                {post.imageUrl && (
                  <div className="rounded-[2.5rem] overflow-hidden border-4 border-slate-50 shadow-inner group-hover:scale-[1.01] transition-transform duration-500">
                    <img src={post.imageUrl} className="w-full max-h-[600px] object-cover" />
                  </div>
                )}
                <div className="mt-8 pt-6 border-t border-slate-50 flex items-center gap-8">
                  <button className="flex items-center gap-2 text-slate-400 font-black hover:text-red-500 transition-colors"><Heart className="w-5 h-5" /> 12</button>
                  <button className="flex items-center gap-2 text-slate-400 font-black hover:text-blue-500 transition-colors"><MessageSquare className="w-5 h-5" /> تعليق</button>
                </div>
              </div>
            </div>
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
          <div className="flex items-center justify-between mb-16">
            <h2 className="text-4xl font-black flex items-center gap-4 italic"><Radio className="text-red-600 animate-pulse w-10 h-10" /> قنوات البث المباشر</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {liveChannels.map(ch => (
              <div key={ch.id} className="bg-white rounded-[3rem] border border-slate-100 p-6 shadow-xl hover:shadow-2xl transition-all group overflow-hidden relative">
                <div className="h-56 w-full relative mb-6 rounded-[2rem] overflow-hidden">
                  <img src={ch.thumbnail_url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1"><div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div> مباشر</div>
                </div>
                <h4 className="font-black text-2xl mb-4 text-slate-800 pr-2">{ch.name}</h4>
                <p className="text-slate-500 mb-8 font-medium line-clamp-2 pr-2 leading-relaxed">{ch.description}</p>
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
          <div className="bg-white rounded-[3rem] p-12 shadow-2xl border border-slate-100 text-center animate-in zoom-in duration-500">
            <div className="bg-blue-600 w-20 h-20 rounded-3xl mx-auto mb-8 flex items-center justify-center shadow-xl rotate-3"><Trophy className="w-10 h-10 text-white" /></div>
            <h3 className="text-3xl font-black mb-10 text-slate-900 italic tracking-tight">دخول النادي</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const target = e.target as any;
              const { data, error } = await FirebaseService.loginTeam(target[0].value, target[1].value);
              if (error) alert(error);
              else { setUser(data); setCurrentView('profile'); }
            }} className="space-y-5">
              <input type="email" required placeholder="البريد الإلكتروني" className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 ring-blue-500/10 focus:border-blue-500 font-bold" />
              <input type="password" required placeholder="كلمة المرور" className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 ring-blue-500/10 focus:border-blue-500 font-bold" />
              <button type="submit" className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 hover:bg-blue-700 active:scale-[0.98] transition-all">تأكيد الدخول</button>
            </form>
            <p className="mt-8 text-slate-400 font-bold text-sm">ليس لديكم حساب؟ <button onClick={() => setCurrentView('register')} className="text-blue-600 underline">سجلوا الآن</button></p>
          </div>
        </div>
      );
      case 'register': return (
        <div className="max-w-md mx-auto py-24 px-6">
          <div className="bg-white rounded-[3rem] p-12 shadow-2xl border border-slate-100 text-center animate-in zoom-in duration-500">
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
              <input required placeholder="اسم الفريق" className="w-full p-5 bg-slate-50 border-slate-200 rounded-2xl font-bold" />
              <input required placeholder="اسم المدرب" className="w-full p-5 bg-slate-50 border-slate-200 rounded-2xl font-bold" />
              <input type="email" required placeholder="البريد الإلكتروني" className="w-full p-5 bg-slate-50 border-slate-200 rounded-2xl font-bold" />
              <input type="password" required placeholder="كلمة المرور" className="w-full p-5 bg-slate-50 border-slate-200 rounded-2xl font-bold" />
              <input required placeholder="الولاية/المنطقة" className="w-full p-5 bg-slate-50 border-slate-200 rounded-2xl font-bold" />
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
                 <button onClick={() => setCurrentView('register')} className="px-14 py-6 bg-blue-600 rounded-[2rem] font-black text-xl shadow-2xl shadow-blue-600/20 hover:scale-105 transition-transform active:scale-95">سجل فريقك مجاناً</button>
                 <button onClick={() => setCurrentView('hub')} className="px-14 py-6 bg-white/10 rounded-[2rem] font-black text-xl border border-white/20 hover:bg-white/20 transition-all backdrop-blur-md">ملتقى الفرق</button>
               </div>
             </div>
             <Trophy className="absolute -bottom-20 -right-20 w-[450px] h-[450px] text-white/5 rotate-12" />
          </section>
          
          <section className="py-32 px-6 bg-white relative">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-24">
                <div>
                  <h2 className="text-5xl font-black text-slate-900 flex items-center gap-5 italic"><Users className="text-blue-600 w-12 h-12" /> النخبة المشاركة</h2>
                  <p className="text-slate-400 font-bold mr-16 mt-2">الفرق الرياضية المسجلة رسمياً في المنصة</p>
                </div>
                <div className="bg-slate-50 px-8 py-4 rounded-3xl border border-slate-100">
                  <span className="font-black text-3xl text-blue-600">{allTeams.length}</span> <span className="text-slate-400 font-bold mr-2">فريق</span>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-10">
                {allTeams.map(team => (
                  <div key={team.id} className="text-center group cursor-pointer" onClick={() => { /* View public profile logic can go here */ }}>
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
        <div className="flex items-center gap-3 font-black text-2xl cursor-pointer hover:scale-105 transition-transform group" onClick={() => setCurrentView('home')}>
          <div className="bg-blue-600 p-2 rounded-2xl shadow-xl shadow-blue-500/20 group-hover:rotate-12 transition-transform"><Trophy className="w-7 h-7 text-white" /></div>
          <span className="tracking-tighter italic">بوابة البطولة</span>
        </div>
        <div className="hidden lg:flex gap-12 text-[12px] font-black uppercase tracking-widest text-slate-400">
           <button onClick={() => setCurrentView('home')} className={`hover:text-blue-600 transition-colors ${currentView === 'home' ? 'text-blue-600' : ''}`}>الرئيسية</button>
           <button onClick={() => setCurrentView('hub')} className={`hover:text-blue-600 transition-colors ${currentView === 'hub' ? 'text-blue-600' : ''}`}>الملتقى</button>
           <button onClick={() => setCurrentView('live')} className={`hover:text-blue-600 transition-colors ${currentView === 'live' ? 'text-blue-600' : ''}`}>البث المباشر</button>
        </div>
        <div className="flex items-center gap-5">
          {user ? (
            <div className="flex items-center gap-4">
              <button onClick={() => setCurrentView('profile')} className="flex items-center gap-3 p-2 pr-6 pl-2 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-all border border-slate-200">
                <span className="text-xs font-black text-slate-900">{user.team_name}</span>
                <img src={user.logo_url} className="w-8 h-8 rounded-xl shadow-md" />
              </button>
              <button onClick={() => { setUser(null); setCurrentView('home'); }} className="p-3 text-red-500 bg-red-50 rounded-2xl hover:bg-red-100 transition-all shadow-sm"><LogOut className="w-5 h-5" /></button>
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
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px]"></div>
      </footer>
    </div>
  );
}