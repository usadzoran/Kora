
import React, { useState, useEffect, useRef } from 'react';
import { SupabaseService } from './services/supabase';
import { RegistrationState, TeamRegistration, Message, ChatContact, LiveChannel } from './types';
import { 
  Trophy, User, Mail, MapPin, Shield, CheckCircle2, AlertCircle, Loader2,
  Calendar, Clock, ArrowRight, Menu, X, LogIn, LayoutDashboard, MessageSquare,
  Settings, Send, LogOut, Edit2, Play, Radio, Activity, Plus, Trash2, Eye, EyeOff, Users, BarChart3, Save, Award, Target, Camera, Image as ImageIcon, UserPlus, Share2, ExternalLink
} from 'lucide-react';

type ViewState = 'home' | 'profile' | 'messages' | 'live' | 'admin' | 'login' | 'register' | 'public-team';

const MATCHES = [
  { id: 1, team1: "Thunderbolts", logo1: "https://ui-avatars.com/api/?name=T&background=ef4444&color=fff&rounded=true", team2: "Iron Dragons", logo2: "https://ui-avatars.com/api/?name=I&background=3b82f6&color=fff&rounded=true", time: "اليوم، 18:00", venue: "الملعب الرئيسي" },
  { id: 2, team1: "Golden Eagles", logo1: "https://ui-avatars.com/api/?name=G&background=eab308&color=fff&rounded=true", team2: "Shadow Ninjas", logo2: "https://ui-avatars.com/api/?name=S&background=1e293b&color=fff&rounded=true", time: "غداً، 14:00", venue: "الملعب الشمالي" }
];

const PublicTeamView = ({ team }: { team: TeamRegistration }) => {
  return (
    <div className="max-w-5xl mx-auto py-12 px-6 animate-in fade-in duration-700">
      <div className="relative mb-12">
        <div className="h-48 w-full bg-gradient-to-r from-slate-800 to-slate-900 rounded-[2.5rem] shadow-xl overflow-hidden relative border border-white/10">
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent"></div>
        </div>
        
        <div className="absolute -bottom-6 right-10 flex flex-col md:flex-row items-end md:items-center gap-6">
          <img src={team.logo_url || `https://ui-avatars.com/api/?name=${team.team_name}&background=random`} className="w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] border-8 border-white shadow-2xl bg-white object-cover" alt={team.team_name} />
          <div className="mb-4 md:mb-0 text-right">
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-1">{team.team_name}</h1>
            <div className="flex items-center gap-3 text-slate-500 font-medium">
              <span className="flex items-center gap-1"><Shield className="w-4 h-4 text-blue-500" /> {team.region}</span>
              <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
              <span className="flex items-center gap-1"><User className="w-4 h-4 text-slate-400" /> المدرب: {team.coach_name}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-16 md:mt-24">
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm text-center">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2 justify-center"><Award className="w-5 h-5 text-yellow-500" /> السجل الرياضي</h3>
            <div className="flex justify-around">
               <div><p className="text-3xl font-black text-green-600">{team.wins || 0}</p><p className="text-[10px] font-bold text-slate-400 uppercase">فوز</p></div>
               <div className="w-px h-12 bg-slate-100"></div>
               <div><p className="text-3xl font-black text-red-600">{team.losses || 0}</p><p className="text-[10px] font-bold text-slate-400 uppercase">خسارة</p></div>
            </div>
          </div>
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2"><ImageIcon className="w-5 h-5 text-blue-600" /> معرض الصور</h3>
            <div className="grid grid-cols-2 gap-3">
              {(team.gallery || []).map((img, idx) => (
                <div key={idx} className="aspect-square rounded-2xl overflow-hidden bg-slate-100 shadow-inner">
                  <img src={img} className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" alt="" />
                </div>
              ))}
            </div>
            {(!team.gallery || team.gallery.length === 0) && <p className="text-xs text-slate-400 text-center py-4 italic">لا توجد صور في المعرض حالياً</p>}
          </div>
        </div>
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-6"><Target className="w-5 h-5 text-orange-500" /> نبذة عن الفريق</h3>
            <p className="text-slate-600 leading-loose text-lg whitespace-pre-line">{team.bio || "هذا الفريق لم يضف نبذة تعريفية بعد."}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const RegisterView = ({ onSuccess, onSwitchToLogin }: { onSuccess: () => void, onSwitchToLogin: () => void }) => {
  const [formData, setFormData] = useState({ team_name: '', coach_name: '', contact_email: '', region: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    const { data, error } = await SupabaseService.registerTeam(formData);
    if (!error) {
      alert('تم تسجيل فريقك بنجاح! يمكنك الآن تسجيل الدخول.');
      onSuccess();
    } else { setError('حدث خطأ أثناء التسجيل. يرجى المحاولة مرة أخرى.'); }
    setIsSubmitting(false);
  };

  return (
    <div className="max-w-6xl mx-auto py-12 px-6">
      <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200 overflow-hidden flex flex-col lg:flex-row border border-slate-100">
        <div className="lg:w-2/5 bg-gradient-to-br from-blue-600 to-indigo-800 text-white p-12 flex flex-col justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          <div className="relative z-10">
            <Trophy className="w-16 h-16 mb-8 text-blue-200" />
            <h2 className="text-4xl font-black mb-6 leading-tight">ابدأ رحلة البطولة مع فريقك</h2>
            <p className="text-blue-100 mb-10 text-lg">سجل فريقك اليوم واحصلي على فرصة للمنافسة في أكبر دوري رياضي مع تغطية حية واحترافية.</p>
            <div className="space-y-6">
              {[ { icon: Shield, text: "نظام حماية وإدارة بيانات احترافي" }, { icon: Radio, text: "بث مباشر لجميع مباريات فريقك" }, { icon: Award, text: "إحصائيات دقيقة وتتبع للأداء" } ].map((item, i) => (
                <div key={i} className="flex items-center gap-4"><div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0"><item.icon className="w-5 h-5" /></div><span className="font-bold text-sm">{item.text}</span></div>
              ))}
            </div>
          </div>
        </div>
        <div className="lg:w-3/5 p-12 md:p-16">
          <div className="max-w-md mx-auto">
            <h3 className="text-2xl font-black text-slate-900 mb-2">تسجيل فريق جديد</h3>
            <p className="text-slate-500 mb-8 font-medium">أدخل بيانات الفريق والمدرب للبدء</p>
            {error && <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {error}</div>}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase px-1">اسم الفريق</label><div className="relative"><input required value={formData.team_name} onChange={e => setFormData({...formData, team_name: e.target.value})} placeholder="مثلاً: صقور الدوحة" className="w-full pl-4 pr-11 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500" /><Shield className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" /></div></div>
              <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase px-1">اسم المدرب</label><div className="relative"><input required value={formData.coach_name} onChange={e => setFormData({...formData, coach_name: e.target.value})} placeholder="الاسم الكامل" className="w-full pl-4 pr-11 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500" /><User className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" /></div></div>
              <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase px-1">البريد الإلكتروني</label><div className="relative"><input type="email" required value={formData.contact_email} onChange={e => setFormData({...formData, contact_email: e.target.value})} placeholder="example@domain.com" className="w-full pl-4 pr-11 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500" /><Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" /></div></div>
              <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase px-1">المنطقة</label><div className="relative"><input required value={formData.region} onChange={e => setFormData({...formData, region: e.target.value})} placeholder="المنطقة" className="w-full pl-4 pr-11 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500" /><MapPin className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" /></div></div>
              <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-xl">{isSubmitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "تسجيل الفريق الآن"}</button>
            </form>
            <p className="mt-8 text-center text-slate-500 text-sm">لديك حساب؟ <button onClick={onSwitchToLogin} className="text-blue-600 font-bold hover:underline">سجل دخولك</button></p>
          </div>
        </div>
      </div>
    </div>
  );
};

const LoginView = ({ onLoginSuccess, onSwitchToRegister, initialEmail = '' }: { onLoginSuccess: (user: TeamRegistration) => void, onSwitchToRegister: () => void, initialEmail?: string }) => {
  const [email, setEmail] = useState(initialEmail);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setError('');
    const { data, error } = await SupabaseService.login(email);
    if (!error && data) { onLoginSuccess(data); } else { setError('البريد الإلكتروني غير مسجل.'); }
    setIsLoggingIn(false);
  };

  return (
    <div className="max-w-md mx-auto py-24 px-6">
      <div className="bg-white rounded-[2.5rem] p-10 shadow-2xl border border-slate-100">
        <div className="text-center mb-10"><div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white shadow-xl"><LogIn className="w-8 h-8" /></div><h3 className="text-2xl font-black">تسجيل الدخول</h3></div>
        {error && <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-xs font-bold">{error}</div>}
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase px-1">البريد الإلكتروني</label><div className="relative"><input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="example@domain.com" className="w-full pl-4 pr-11 py-4 bg-slate-50 border rounded-2xl outline-none" /><Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" /></div></div>
          <button type="submit" disabled={isLoggingIn} className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-xl">{isLoggingIn ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "دخول الحساب"}</button>
        </form>
        <p className="mt-8 text-center text-slate-500 text-sm">ليس لديك حساب؟ <button onClick={onSwitchToRegister} className="text-blue-600 font-bold hover:underline">سجل فريقك</button></p>
      </div>
    </div>
  );
};

const ProfileView = ({ user, onUpdate }: { user: TeamRegistration, onUpdate: (updatedUser: TeamRegistration) => void }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState({ ...user, gallery: user.gallery || [] });
  const [shareFeedback, setShareFeedback] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    if (!user.id) return;
    setIsSaving(true);
    const { data, error } = await SupabaseService.updateProfile(user.id, editData);
    if (!error && data) { onUpdate(data[0]); setIsEditing(false); }
    setIsSaving(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'gallery') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        if (type === 'logo') {
          setEditData({ ...editData, logo_url: base64String });
          if (!isEditing) autoSaveLogo(base64String);
        } else {
          setEditData({ ...editData, gallery: [...(editData.gallery || []), base64String] });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const autoSaveLogo = async (newLogo: string) => {
    if (!user.id) return;
    const { data, error } = await SupabaseService.updateProfile(user.id, { logo_url: newLogo });
    if (!error && data) onUpdate(data[0]);
  };

  const copyShareLink = () => {
    const baseUrl = window.location.origin + window.location.pathname;
    const shareLink = `${baseUrl}#team-${user.id}`;
    navigator.clipboard.writeText(shareLink);
    setShareFeedback('تم نسخ رابط الفريق!');
    setTimeout(() => setShareFeedback(''), 3000);
  };

  return (
    <div className="max-w-5xl mx-auto py-12 px-6">
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'logo')} />
      <input type="file" ref={galleryInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'gallery')} />

      <div className="relative mb-12">
        <div className="h-48 w-full bg-gradient-to-r from-blue-600 to-indigo-700 rounded-[2.5rem] shadow-xl overflow-hidden relative">
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        </div>
        
        <div className="absolute -bottom-6 right-10 flex flex-col md:flex-row items-end md:items-center gap-6">
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <img src={editData.logo_url || `https://ui-avatars.com/api/?name=${user.team_name}&background=random`} className="w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] border-8 border-white shadow-2xl bg-white object-cover" alt={user.team_name} />
            <div className="absolute inset-0 bg-black/40 rounded-[2.5rem] opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><Camera className="text-white w-8 h-8" /></div>
          </div>
          <div className="mb-4 md:mb-0 text-right">
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-1">{user.team_name}</h1>
            <div className="flex items-center gap-3 text-slate-500 font-medium">
              <span className="flex items-center gap-1"><Shield className="w-4 h-4 text-blue-500" /> {user.region}</span>
              <span className="flex items-center gap-1"><User className="w-4 h-4 text-slate-400" /> {user.coach_name}</span>
            </div>
          </div>
        </div>

        <div className="absolute bottom-4 left-10 flex gap-2">
          {!isEditing ? (
            <>
              <button onClick={() => setIsEditing(true)} className="px-5 py-2.5 bg-white text-slate-900 border rounded-xl font-bold shadow-sm hover:bg-slate-50 flex items-center gap-2"><Edit2 className="w-4 h-4" /> تعديل</button>
              <button onClick={copyShareLink} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 flex items-center gap-2 relative">
                {shareFeedback ? <CheckCircle2 className="w-4 h-4" /> : <Share2 className="w-4 h-4" />} 
                {shareFeedback || "رابط المشتركين"}
              </button>
            </>
          ) : (
            <div className="flex gap-2">
              <button onClick={handleSave} disabled={isSaving} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold shadow-lg flex items-center gap-2">{isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} حفظ</button>
              <button onClick={() => { setIsEditing(false); setEditData({...user, gallery: user.gallery || []}); }} className="px-6 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold">إلغاء</button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-16 md:mt-24">
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[2rem] border shadow-sm text-center">
             <h3 className="text-lg font-bold mb-6 flex items-center gap-2 justify-center"><Award className="w-5 h-5 text-yellow-500" /> السجل الرياضي</h3>
             <div className="flex justify-around">
               <div><p className="text-3xl font-black text-green-600">{user.wins || 0}</p><p className="text-[10px] font-bold text-slate-400 uppercase">فوز</p></div>
               <div className="w-px h-12 bg-slate-100"></div>
               <div><p className="text-3xl font-black text-red-600">{user.losses || 0}</p><p className="text-[10px] font-bold text-slate-400 uppercase">خسارة</p></div>
            </div>
          </div>
          <div className="bg-white p-8 rounded-[2rem] border shadow-sm">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2"><ImageIcon className="w-5 h-5 text-blue-600" /> معرض الصور</h3>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {(editData.gallery || []).map((img, idx) => (
                <div key={idx} className="relative aspect-square group rounded-2xl overflow-hidden bg-slate-100">
                  <img src={img} className="w-full h-full object-cover" alt="" />
                  {isEditing && <button onClick={() => { const ng = [...editData.gallery!]; ng.splice(idx,1); setEditData({...editData, gallery: ng}); }} className="absolute top-2 left-2 p-1.5 bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3 h-3" /></button>}
                </div>
              ))}
              {isEditing && <button onClick={() => galleryInputRef.current?.click()} className="aspect-square border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-all"><Plus className="w-6 h-6 mb-1" /><span className="text-[10px] font-bold">أضف</span></button>}
            </div>
          </div>
        </div>
        <div className="lg:col-span-2">
          <div className="bg-white p-8 rounded-[2rem] border shadow-sm">
            <h3 className="text-lg font-bold flex items-center gap-2 mb-6"><Target className="w-5 h-5 text-orange-500" /> نبذة الفريق</h3>
            {!isEditing ? <p className="text-slate-600 leading-loose text-lg whitespace-pre-line">{user.bio || "لم تضف نبذة بعد."}</p> : <textarea value={editData.bio} onChange={e => setEditData({...editData, bio: e.target.value})} rows={6} className="w-full px-5 py-4 bg-slate-50 border rounded-2xl outline-none" placeholder="اكتب شيئاً عن تاريخ فريقك..." />}
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const [channels, setChannels] = useState<LiveChannel[]>([]);
  const [teams, setTeams] = useState<TeamRegistration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingChannel, setIsAddingChannel] = useState(false);
  const [newChannel, setNewChannel] = useState({ name: '', description: '', stream_url: '', thumbnail_url: '', is_active: true });

  const fetchData = async () => {
    setIsLoading(true);
    const [ch, tm] = await Promise.all([SupabaseService.getLiveChannels(true), SupabaseService.getAllTeams()]);
    setChannels(ch); setTeams(tm); setIsLoading(false);
  };
  useEffect(() => { fetchData(); }, []);

  const handleAddChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await SupabaseService.addLiveChannel(newChannel);
    if (!error) { setIsAddingChannel(false); setNewChannel({ name: '', description: '', stream_url: '', thumbnail_url: '', is_active: true }); fetchData(); }
  };

  const handleToggleChannel = async (id: string, status: boolean) => { await SupabaseService.updateLiveChannel(id, { is_active: !status }); fetchData(); };
  const handleDeleteChannel = async (id: string) => { if (confirm('هل أنت متأكد؟')) { await SupabaseService.deleteLiveChannel(id); fetchData(); } };

  if (isLoading) return <div className="p-12 text-center"><Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-600" /></div>;

  return (
    <div className="max-w-7xl mx-auto py-10 px-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div><h1 className="text-3xl font-black text-slate-900">لوحة الإدارة</h1><p className="text-slate-500">تحكم كامل في المنصة</p></div>
        <div className="flex gap-4">
          <div className="bg-white px-6 py-3 rounded-2xl border flex items-center gap-3"><Users className="w-5 h-5 text-blue-600" /><div><p className="text-[10px] uppercase font-bold text-slate-400">الفرق</p><p className="font-bold">{teams.length}</p></div></div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[2rem] border overflow-hidden">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="font-bold text-slate-900 flex items-center gap-2"><Radio className="w-5 h-5 text-red-600" /> إدارة القنوات</h2>
              <button onClick={() => setIsAddingChannel(true)} className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"><Plus className="w-5 h-5" /></button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-400 border-b"><tr ><th className="px-6 py-4">القناة</th><th className="px-6 py-4">الحالة</th><th className="px-6 py-4">الإجراءات</th></tr></thead>
                <tbody className="divide-y">
                  {channels.map(ch => (
                    <tr key={ch.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 flex items-center gap-3"><img src={ch.thumbnail_url} className="w-10 h-10 rounded-lg object-cover" alt="" /><p className="font-bold text-sm">{ch.name}</p></td>
                      <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-[10px] font-bold ${ch.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{ch.is_active ? 'نشطة' : 'متوقفة'}</span></td>
                      <td className="px-6 py-4"><div className="flex gap-2"><button onClick={() => handleToggleChannel(ch.id, ch.is_active)} className="p-2 text-slate-400 hover:text-blue-600 transition-colors">{ch.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button><button onClick={() => handleDeleteChannel(ch.id)} className="p-2 text-slate-400 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-[2rem] border p-6"><h2 className="font-bold mb-6 flex items-center gap-2"><Users className="w-5 h-5 text-blue-600" /> الفرق المسجلة</h2><div className="space-y-4">{teams.slice(0, 10).map(team => (<div key={team.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl"><img src={team.logo_url} className="w-10 h-10 rounded-full border shadow-sm" alt="" /><div><p className="font-bold text-xs">{team.team_name}</p><p className="text-[10px] text-slate-400">#{team.id?.slice(0,8)}</p></div></div>))}</div></div>
      </div>
    </div>
  );
};

const LiveChannelCard: React.FC<{ channel: LiveChannel; onWatch: () => void }> = ({ channel, onWatch }) => (
  <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all border group relative">
    <div className="relative h-40 overflow-hidden">
      <img src={channel.thumbnail_url || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=600'} alt={channel.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
      <div className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1"><span className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></span> مباشر</div>
      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={onWatch} className="bg-white/20 backdrop-blur-md p-3 rounded-full border border-white/30 hover:scale-110 transition-transform text-white"><Play className="w-6 h-6 fill-current" /></button></div>
    </div>
    <div className="p-4"><h3 className="text-lg font-bold text-slate-900 mb-1">{channel.name}</h3><p className="text-slate-500 text-xs mb-4">{channel.description}</p><button onClick={onWatch} className="w-full py-2 bg-slate-50 hover:bg-red-50 text-slate-900 hover:text-red-600 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border">مشاهدة البث</button></div>
  </div>
);

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>('home');
  const [user, setUser] = useState<TeamRegistration | null>(null);
  const [publicTeam, setPublicTeam] = useState<TeamRegistration | null>(null);
  const [liveChannels, setLiveChannels] = useState<LiveChannel[]>([]);
  const [allTeams, setAllTeams] = useState<TeamRegistration[]>([]);
  const [secretClickCount, setSecretClickCount] = useState(0);

  const checkHash = async () => {
    const hash = window.location.hash;
    if (hash === '#admin-portal') {
      setCurrentView('login');
    } else if (hash.startsWith('#team-')) {
      const teamId = hash.replace('#team-', '');
      const teams = await SupabaseService.getAllTeams();
      const team = teams.find(t => t.id === teamId);
      if (team) {
        setPublicTeam(team);
        setCurrentView('public-team');
      }
    }
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      const [channels, teams] = await Promise.all([SupabaseService.getLiveChannels(), SupabaseService.getAllTeams()]);
      setLiveChannels(channels);
      setAllTeams(teams);
      checkHash();
    };
    fetchInitialData();

    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, []);

  const isAdmin = user?.contact_email === 'admin@portal.com';

  const renderContent = () => {
    switch (currentView) {
      case 'admin': return isAdmin ? <AdminDashboard /> : <LoginView onLoginSuccess={(u) => { setUser(u); setCurrentView('admin'); }} onSwitchToRegister={() => setCurrentView('register')} />;
      case 'profile': return user ? <ProfileView user={user} onUpdate={setUser} /> : <LoginView onLoginSuccess={(u) => { setUser(u); setCurrentView('profile'); }} onSwitchToRegister={() => setCurrentView('register')} />;
      case 'live': return (
        <div className="max-w-7xl mx-auto py-12 px-6">
          <div className="flex items-center gap-3 mb-8"><div className="bg-red-600 p-2 rounded-lg"><Radio className="w-6 h-6 text-white" /></div><h2 className="text-3xl font-bold">البث المباشر</h2></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">{liveChannels.map(ch => <LiveChannelCard key={ch.id} channel={ch} onWatch={() => window.open(ch.stream_url, '_blank')} />)}</div>
        </div>
      );
      case 'public-team': return publicTeam ? <PublicTeamView team={publicTeam} /> : <div className="p-20 text-center">فريق غير موجود</div>;
      case 'login': return <LoginView initialEmail={window.location.hash === '#admin-portal' ? 'admin@portal.com' : ''} onLoginSuccess={(u) => { setUser(u); setCurrentView(u.contact_email === 'admin@portal.com' ? 'admin' : 'profile'); }} onSwitchToRegister={() => setCurrentView('register')} />;
      case 'register': return <RegisterView onSuccess={() => setCurrentView('login')} onSwitchToLogin={() => setCurrentView('login')} />;
      default: return (
        <>
          <section className="bg-slate-900 py-24 px-6 md:px-12 relative overflow-hidden">
             <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row items-center gap-12">
               <div className="md:w-1/2 text-right">
                  <span className="bg-blue-600/20 text-blue-400 text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest mb-6 inline-block">موسم 2024 الآن متاح</span>
                  <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-[1.1]">بوابتك لعالم البطولة الرياضية</h1>
                  <p className="text-slate-400 text-lg mb-10 max-w-xl">المنصة المتكاملة لمتابعة الفرق، النتائج، والبث المباشر. كن جزءاً من الحدث الرياضي الأهم في المنطقة.</p>
                  <div className="flex gap-4">
                    <button onClick={() => setCurrentView('register')} className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl hover:bg-blue-700 transition-all">سجل فريقك</button>
                    <button onClick={() => setCurrentView('live')} className="px-8 py-4 bg-white/10 text-white rounded-2xl font-black backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all">شاهد البث</button>
                  </div>
               </div>
               <div className="md:w-1/2 flex justify-center">
                 <div className="relative group">
                    <div className="absolute -inset-4 bg-blue-600/20 rounded-full blur-3xl opacity-50"></div>
                    <Trophy className="w-64 h-64 text-blue-600 relative z-10 drop-shadow-2xl animate-bounce duration-[3000ms]" />
                 </div>
               </div>
             </div>
             <div className="absolute bottom-0 right-0 w-full h-32 bg-gradient-to-t from-slate-900 to-transparent"></div>
          </section>

          <section className="py-20 px-6 md:px-12 bg-white">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-12">
                <h2 className="text-3xl font-black">الفرق المشاركة</h2>
                <button onClick={() => setCurrentView('register')} className="text-blue-600 font-bold flex items-center gap-2 hover:gap-3 transition-all">سجل فريقك الآن <ArrowRight className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {allTeams.slice(0, 12).map(team => (
                  <button key={team.id} onClick={() => { setPublicTeam(team); window.location.hash = `team-${team.id}`; }} className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 hover:border-blue-400 transition-all hover:-translate-y-2 group">
                    <img src={team.logo_url} className="w-20 h-20 rounded-full mx-auto mb-4 border-4 border-white shadow-md group-hover:scale-110 transition-transform" />
                    <p className="text-xs font-black text-slate-900 text-center line-clamp-1">{team.team_name}</p>
                    <p className="text-[9px] text-slate-400 text-center mt-1 uppercase font-bold">{team.region}</p>
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="bg-slate-900 py-16 px-6 md:px-12">
            <div className="max-w-7xl mx-auto"><h2 className="text-2xl font-bold text-white mb-8">مركز المباريات</h2><div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide">{MATCHES.map(match => (<div key={match.id} className="bg-slate-800 rounded-2xl p-6 min-w-[300px] border border-slate-700 flex flex-col items-center"><div className="flex justify-between w-full mb-4 px-2"><div className="text-center"><img src={match.logo1} className="w-12 h-12 rounded-full mb-2 mx-auto"/><span className="text-[10px] text-white font-bold">{match.team1}</span></div><div className="self-center font-black text-slate-600">VS</div><div className="text-center"><img src={match.logo2} className="w-12 h-12 rounded-full mb-2 mx-auto"/><span className="text-[10px] text-white font-bold">{match.team2}</span></div></div><div className="text-[10px] text-blue-400 font-bold bg-blue-400/10 px-4 py-1.5 rounded-full"><Clock className="w-3.5 h-3.5 inline mr-1"/> {match.time}</div></div>))}</div></div>
          </section>
        </>
      );
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 scroll-smooth" dir="rtl">
      <nav className="bg-white/80 backdrop-blur-md border-b py-4 px-6 md:px-12 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2 font-black text-xl cursor-pointer" onClick={() => { window.location.hash = ''; setCurrentView('home'); }}>
          <div className="bg-blue-600 p-1.5 rounded-lg shadow-lg"><Trophy className="w-6 h-6 text-white" /></div>
          <span>بوابة البطولة</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-[11px] font-black uppercase text-slate-400 tracking-widest">
          <button onClick={() => { window.location.hash = ''; setCurrentView('home'); }} className={`hover:text-blue-600 ${currentView === 'home' ? 'text-blue-600' : ''}`}>الرئيسية</button>
          <button onClick={() => setCurrentView('live')} className={`hover:text-red-600 ${currentView === 'live' ? 'text-red-600' : ''}`}>البث المباشر</button>
          {user && <button onClick={() => setCurrentView('profile')} className={`hover:text-blue-600 ${currentView === 'profile' ? 'text-blue-600' : ''}`}>فريقي</button>}
          {isAdmin && <button onClick={() => setCurrentView('admin')} className={`hover:text-blue-600 ${currentView === 'admin' ? 'text-blue-600' : ''}`}>الإدارة</button>}
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3 border-r pr-4">
              <img src={user.logo_url} className="w-9 h-9 rounded-full border shadow-sm" alt="Logo" />
              <button onClick={() => { setUser(null); setCurrentView('home'); }} className="p-2 text-slate-300 hover:text-red-600"><LogOut className="w-5 h-5" /></button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentView('login')} className="px-5 py-2.5 text-slate-900 text-[11px] font-black border rounded-xl hover:bg-slate-50">دخول</button>
              <button onClick={() => setCurrentView('register')} className="px-5 py-2.5 bg-slate-900 text-white text-[11px] font-black rounded-xl hover:bg-slate-800">سجل فريقك</button>
            </div>
          )}
        </div>
      </nav>
      <main className="pb-20">{renderContent()}</main>
      <footer className="bg-slate-900 text-slate-500 py-16 text-center">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center justify-center gap-2 font-black text-xl text-white mb-6">
            <Trophy onClick={() => { setSecretClickCount(s => { if(s+1>=3) { setCurrentView('login'); return 0; } return s+1; }); }} className="w-8 h-8 text-blue-600 cursor-pointer" /> 
            <span>TournamentPortal</span>
          </div>
          <p className="text-[10px] uppercase tracking-widest leading-loose">منصة إدارة البطولات الاحترافية. شاركنا رحلة النجاح.</p>
          <div className="mt-8 pt-8 border-t border-slate-800 text-[9px] font-bold">&copy; 2024 جميع الحقوق محفوظة.</div>
        </div>
      </footer>
    </div>
  );
}
