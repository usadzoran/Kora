
import React, { useState, useEffect, useRef } from 'react';
import { SupabaseService } from './services/supabase';
import { RegistrationState, TeamRegistration, Message, ChatContact, LiveChannel } from './types';
import { 
  Trophy, User, Mail, MapPin, Shield, CheckCircle2, AlertCircle, Loader2,
  Calendar, Clock, ArrowRight, Menu, X, LogIn, LayoutDashboard, MessageSquare,
  Settings, Send, LogOut, Edit2, Play, Radio, Activity, Plus, Trash2, Eye, EyeOff, Users, BarChart3, Save, Award, Target, Camera, Image as ImageIcon, UserPlus
} from 'lucide-react';

type ViewState = 'home' | 'profile' | 'messages' | 'live' | 'admin' | 'login' | 'register';

const MATCHES = [
  { id: 1, team1: "Thunderbolts", logo1: "https://ui-avatars.com/api/?name=T&background=ef4444&color=fff&rounded=true", team2: "Iron Dragons", logo2: "https://ui-avatars.com/api/?name=I&background=3b82f6&color=fff&rounded=true", time: "اليوم، 18:00", venue: "الملعب الرئيسي" },
  { id: 2, team1: "Golden Eagles", logo1: "https://ui-avatars.com/api/?name=G&background=eab308&color=fff&rounded=true", team2: "Shadow Ninjas", logo2: "https://ui-avatars.com/api/?name=S&background=1e293b&color=fff&rounded=true", time: "غداً، 14:00", venue: "الملعب الشمالي" }
];

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
    } else {
      setError('حدث خطأ أثناء التسجيل. يرجى المحاولة مرة أخرى.');
    }
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
              {[
                { icon: Shield, text: "نظام حماية وإدارة بيانات احترافي" },
                { icon: Radio, text: "بث مباشر لجميع مباريات فريقك" },
                { icon: Award, text: "إحصائيات دقيقة وتتبع للأداء" }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-sm">{item.text}</span>
                </div>
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
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">اسم الفريق</label>
                <div className="relative">
                  <input required value={formData.team_name} onChange={e => setFormData({...formData, team_name: e.target.value})} placeholder="مثلاً: صقور الدوحة" className="w-full pl-4 pr-11 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all" />
                  <Shield className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">اسم المدرب</label>
                <div className="relative">
                  <input required value={formData.coach_name} onChange={e => setFormData({...formData, coach_name: e.target.value})} placeholder="الاسم الكامل" className="w-full pl-4 pr-11 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all" />
                  <User className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">البريد الإلكتروني</label>
                <div className="relative">
                  <input type="email" required value={formData.contact_email} onChange={e => setFormData({...formData, contact_email: e.target.value})} placeholder="example@domain.com" className="w-full pl-4 pr-11 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all" />
                  <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">المنطقة / المدينة</label>
                <div className="relative">
                  <input required value={formData.region} onChange={e => setFormData({...formData, region: e.target.value})} placeholder="مثلاً: المنطقة الغربية" className="w-full pl-4 pr-11 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all" />
                  <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                </div>
              </div>
              
              <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-200 hover:bg-blue-700 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50">
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />} تسجيل الفريق الآن
              </button>
            </form>
            
            <p className="mt-8 text-center text-slate-500 text-sm font-medium">
              لديك حساب بالفعل؟ <button onClick={onSwitchToLogin} className="text-blue-600 font-bold hover:underline">سجل دخولك هنا</button>
            </p>
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
    if (!error && data) {
      onLoginSuccess(data);
    } else {
      setError('البريد الإلكتروني غير مسجل أو هناك خطأ في الاتصال.');
    }
    setIsLoggingIn(false);
  };

  return (
    <div className="max-w-md mx-auto py-24 px-6">
      <div className="bg-white rounded-[2.5rem] p-10 shadow-2xl shadow-slate-200 border border-slate-100">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white shadow-xl shadow-blue-100">
            <LogIn className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-black text-slate-900">تسجيل الدخول</h3>
          <p className="text-slate-500 text-sm mt-1">أهلاً بك مجدداً، أدخل بياناتك للمتابعة</p>
        </div>

        {error && <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {error}</div>}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">البريد الإلكتروني</label>
            <div className="relative">
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="example@domain.com" className="w-full pl-4 pr-11 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all" />
              <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
            </div>
          </div>
          <button type="submit" disabled={isLoggingIn} className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50">
            {isLoggingIn ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />} دخول الحساب
          </button>
        </form>

        <p className="mt-8 text-center text-slate-500 text-sm font-medium">
          ليس لديك حساب؟ <button onClick={onSwitchToRegister} className="text-blue-600 font-bold hover:underline">سجل فريقك الآن</button>
        </p>
      </div>
    </div>
  );
};

const ProfileView = ({ user, onUpdate }: { user: TeamRegistration, onUpdate: (updatedUser: TeamRegistration) => void }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState({ ...user, gallery: user.gallery || [] });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    if (!user.id) return;
    setIsSaving(true);
    const { data, error } = await SupabaseService.updateProfile(user.id, editData);
    if (!error && data) {
      onUpdate(data[0]);
      setIsEditing(false);
    }
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

  const removeFromGallery = (index: number) => {
    const newGallery = [...(editData.gallery || [])];
    newGallery.splice(index, 1);
    setEditData({ ...editData, gallery: newGallery });
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
            <img src={editData.logo_url || `https://ui-avatars.com/api/?name=${user.team_name}&background=random`} className="w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] border-8 border-white shadow-2xl bg-white object-cover transition-transform group-hover:scale-[1.02]" alt={user.team_name} />
            <div className="absolute inset-0 bg-black/40 rounded-[2.5rem] opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><Camera className="text-white w-8 h-8" /></div>
            <div className="absolute -bottom-2 -left-2 bg-green-500 w-8 h-8 rounded-full border-4 border-white shadow-lg"></div>
          </div>
          
          <div className="mb-4 md:mb-0 text-right">
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-1">{user.team_name}</h1>
            <div className="flex items-center gap-3 text-slate-500 font-medium">
              <span className="flex items-center gap-1"><Shield className="w-4 h-4 text-blue-500" /> {user.region}</span>
              <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
              <span className="flex items-center gap-1"><User className="w-4 h-4 text-slate-400" /> المدرب: {user.coach_name}</span>
            </div>
          </div>
        </div>

        <div className="absolute bottom-4 left-10 hidden md:block">
          {!isEditing ? (
            <button onClick={() => setIsEditing(true)} className="px-6 py-2.5 bg-white text-slate-900 border border-slate-200 rounded-xl font-bold shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2"><Edit2 className="w-4 h-4" /> تعديل الملف</button>
          ) : (
            <div className="flex gap-2">
              <button onClick={handleSave} disabled={isSaving} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center gap-2">{isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} حفظ التغييرات</button>
              <button onClick={() => { setIsEditing(false); setEditData({...user, gallery: user.gallery || []}); }} className="px-6 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all">إلغاء</button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-16 md:mt-24">
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm text-center">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2 justify-center"><Award className="w-5 h-5 text-yellow-500" /> الحالة الرياضية</h3>
            <div className="flex justify-around">
               <div><p className="text-3xl font-black text-green-600">{user.wins || 0}</p><p className="text-[10px] font-bold text-slate-400 uppercase">فوز</p></div>
               <div className="w-px h-12 bg-slate-100"></div>
               <div><p className="text-3xl font-black text-red-600">{user.losses || 0}</p><p className="text-[10px] font-bold text-slate-400 uppercase">خسارة</p></div>
            </div>
          </div>
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2"><ImageIcon className="w-5 h-5 text-blue-600" /> معرض صور الفريق</h3>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {(editData.gallery || []).map((img, idx) => (
                <div key={idx} className="relative aspect-square group rounded-2xl overflow-hidden bg-slate-100">
                  <img src={img} className="w-full h-full object-cover" alt="" />
                  {isEditing && <button onClick={() => removeFromGallery(idx)} className="absolute top-2 left-2 p-1.5 bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3 h-3" /></button>}
                </div>
              ))}
              {isEditing && <button onClick={() => galleryInputRef.current?.click()} className="aspect-square border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-all"><Plus className="w-6 h-6 mb-1" /><span className="text-[10px] font-bold">أضف صورة</span></button>}
            </div>
            {!isEditing && (!user.gallery || user.gallery.length === 0) && <p className="text-xs text-slate-400 text-center py-4 italic">لا توجد صور في المعرض حالياً</p>}
          </div>
        </div>
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-6"><Target className="w-5 h-5 text-orange-500" /> نبذة الفريق</h3>
            {!isEditing ? <p className="text-slate-600 leading-loose text-lg whitespace-pre-line">{user.bio || "لم يتم إضافة نبذة تعريفية."}</p> : <div className="space-y-4"><textarea value={editData.bio} onChange={e => setEditData({...editData, bio: e.target.value})} rows={6} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none" placeholder="اكتب شيئاً عن تاريخ فريقك..." /><div className="grid md:grid-cols-2 gap-4"><input value={editData.coach_name} onChange={e => setEditData({...editData, coach_name: e.target.value})} placeholder="اسم المدرب" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none" /><input value={editData.region} onChange={e => setEditData({...editData, region: e.target.value})} placeholder="المنطقة" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none" /></div></div>}
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
        <div><h1 className="text-3xl font-black text-slate-900">لوحة الإدارة</h1><p className="text-slate-500">تحكم في محتوى المنصة والفرق والشركاء</p></div>
        <div className="flex gap-4">
          <div className="bg-white px-6 py-3 rounded-2xl border flex items-center gap-3"><Users className="w-5 h-5 text-blue-600" /><div><p className="text-[10px] uppercase font-bold text-slate-400">الفرق</p><p className="font-bold">{teams.length}</p></div></div>
          <div className="bg-white px-6 py-3 rounded-2xl border flex items-center gap-3"><Radio className="w-5 h-5 text-red-600" /><div><p className="text-[10px] uppercase font-bold text-slate-400">القنوات</p><p className="font-bold">{channels.length}</p></div></div>
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
                <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-400"><tr className="border-b"><th className="px-6 py-4">القناة</th><th className="px-6 py-4">الحالة</th><th className="px-6 py-4">الإجراءات</th></tr></thead>
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
        <div className="bg-white rounded-[2rem] border p-6"><h2 className="font-bold mb-6 flex items-center gap-2"><Users className="w-5 h-5 text-blue-600" /> الفرق المسجلة</h2><div className="space-y-4">{teams.slice(0, 5).map(team => (<div key={team.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl"><img src={team.logo_url} className="w-10 h-10 rounded-full border shadow-sm" alt="" /><p className="font-bold text-xs">{team.team_name}</p></div>))}</div></div>
      </div>
      {isAddingChannel && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-8 shadow-2xl">
            <h3 className="text-xl font-bold mb-6">إضافة قناة بث</h3>
            <form onSubmit={handleAddChannel} className="space-y-4">
              <input required value={newChannel.name} onChange={e => setNewChannel({...newChannel, name: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none" placeholder="اسم القناة" />
              <input required value={newChannel.stream_url} onChange={e => setNewChannel({...newChannel, stream_url: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none" placeholder="رابط البث" />
              <button type="submit" className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl">حفظ</button>
            </form>
          </div>
        </div>
      )}
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

const LiveChannelsView = ({ channels }: { channels: LiveChannel[] }) => {
  return (
    <div className="max-w-7xl mx-auto py-12 px-6">
      <div className="flex items-center gap-3 mb-8"><div className="bg-red-600 p-2 rounded-lg"><Radio className="w-6 h-6 text-white" /></div><h2 className="text-3xl font-bold text-slate-900">البث المباشر</h2></div>
      {channels.length === 0 ? (<div className="bg-white rounded-2xl p-12 text-center border-2 border-dashed border-slate-200"><p className="text-slate-500 font-bold">لا يوجد قنوات نشطة حالياً.</p></div>) : (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">{channels.map(channel => (<LiveChannelCard key={channel.id} channel={channel} onWatch={() => { window.open(channel.stream_url, '_blank'); }} />))}</div>)}
    </div>
  );
};

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>('home');
  const [user, setUser] = useState<TeamRegistration | null>(null);
  const [liveChannels, setLiveChannels] = useState<LiveChannel[]>([]);
  const [secretClickCount, setSecretClickCount] = useState(0);

  useEffect(() => {
    const fetchChannels = async () => { setLiveChannels(await SupabaseService.getLiveChannels()); };
    fetchChannels();
    
    // Check for secret hash on load
    if (window.location.hash === '#admin-portal') {
      setCurrentView('login');
      alert('مرحباً بك في بوابة الإدارة السرية. يرجى تسجيل الدخول بحساب الأدمن.');
    }
  }, []);

  const handleSecretTrigger = () => {
    setSecretClickCount(prev => prev + 1);
    if (secretClickCount >= 2) {
      setSecretClickCount(0);
      setCurrentView('login');
      alert('تم تفعيل الوصول السري للأدمن.');
    }
  };

  const isAdmin = user?.contact_email === 'admin@portal.com';

  const renderContent = () => {
    switch (currentView) {
      case 'admin': return isAdmin ? <AdminDashboard /> : <LoginView onLoginSuccess={(u) => { setUser(u); setCurrentView('admin'); }} onSwitchToRegister={() => setCurrentView('register')} />;
      case 'profile': return user ? <ProfileView user={user} onUpdate={setUser} /> : <LoginView onLoginSuccess={(u) => { setUser(u); setCurrentView('profile'); }} onSwitchToRegister={() => setCurrentView('register')} />;
      case 'live': return <LiveChannelsView channels={liveChannels} />;
      case 'login': return <LoginView initialEmail={window.location.hash === '#admin-portal' ? 'admin@portal.com' : ''} onLoginSuccess={(u) => { setUser(u); setCurrentView(u.contact_email === 'admin@portal.com' ? 'admin' : 'profile'); }} onSwitchToRegister={() => setCurrentView('register')} />;
      case 'register': return <RegisterView onSuccess={() => setCurrentView('login')} onSwitchToLogin={() => setCurrentView('login')} />;
      default: return (
        <>
          <section className="bg-slate-900 py-16 px-6 md:px-12 relative overflow-hidden">
            <div className="max-w-7xl mx-auto relative z-10"><h2 className="text-3xl font-black text-white mb-8">مركز المباريات</h2><div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide">{MATCHES.map(match => (<div key={match.id} className="bg-slate-800 rounded-2xl p-6 min-w-[300px] border border-slate-700 flex flex-col items-center"><div className="flex justify-between w-full mb-4 px-2"><div className="text-center"><img src={match.logo1} className="w-12 h-12 rounded-full mb-2 mx-auto"/><span className="text-[10px] text-white font-bold">{match.team1}</span></div><div className="self-center font-black text-slate-600">VS</div><div className="text-center"><img src={match.logo2} className="w-12 h-12 rounded-full mb-2 mx-auto"/><span className="text-[10px] text-white font-bold">{match.team2}</span></div></div><div className="text-[10px] text-blue-400 font-bold bg-blue-400/10 px-4 py-1.5 rounded-full"><Clock className="w-3.5 h-3.5 inline mr-1"/> {match.time}</div></div>))}</div></div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full -mr-48 -mt-48 blur-3xl"></div>
          </section>
          {liveChannels.length > 0 && (<section className="py-20 px-6 md:px-12 bg-white"><div className="max-w-7xl mx-auto"><h2 className="text-3xl font-black mb-10 flex items-center gap-3">بث مباشر الآن <span className="w-2.5 h-2.5 bg-red-600 rounded-full animate-ping"></span></h2><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">{liveChannels.slice(0, 4).map(channel => (<LiveChannelCard key={channel.id} channel={channel} onWatch={() => { window.open(channel.stream_url, '_blank'); }} />))}</div></div></section>)}
          <section className="py-24 px-6 md:px-12 bg-slate-50 text-center"><h2 className="text-4xl font-black mb-6 text-slate-900 leading-tight">جاهز للمنافسة؟</h2><p className="text-slate-500 mb-10 max-w-2xl mx-auto text-lg">سجل فريقك اليوم وكن جزءاً من تجربة رياضية استثنائية تجمع أفضل الفرق في المنطقة.</p><button onClick={() => setCurrentView('register')} className="px-12 py-5 bg-blue-600 text-white rounded-2xl font-black shadow-2xl shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95">سجل فريقك الآن</button></section>
        </>
      );
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 scroll-smooth" dir="rtl">
      <nav className="bg-white/80 backdrop-blur-md border-b py-4 px-6 md:px-12 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2 font-black text-xl cursor-pointer" onClick={() => setCurrentView('home')}>
          <div className="bg-blue-600 p-1.5 rounded-lg shadow-lg shadow-blue-100"><Trophy className="w-6 h-6 text-white" /></div>
          <span>بوابة البطولة</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-[11px] font-black uppercase text-slate-400 tracking-widest">
          <button onClick={() => setCurrentView('home')} className={`hover:text-blue-600 transition-colors ${currentView === 'home' ? 'text-blue-600' : ''}`}>الرئيسية</button>
          <button onClick={() => setCurrentView('live')} className={`hover:text-red-600 transition-colors ${currentView === 'live' ? 'text-red-600' : ''}`}>البث المباشر</button>
          {user && <button onClick={() => setCurrentView('profile')} className={`hover:text-blue-600 transition-colors ${currentView === 'profile' ? 'text-blue-600' : ''}`}>فريقي</button>}
          {isAdmin && <button onClick={() => setCurrentView('admin')} className={`hover:text-blue-600 transition-colors ${currentView === 'admin' ? 'text-blue-600' : ''}`}>لوحة الإدارة</button>}
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3 border-r pr-4">
              <div className="hidden sm:block text-left"><p className="text-[10px] font-black leading-tight">{user.team_name}</p><p className="text-[9px] text-slate-400">مدرب</p></div>
              <img src={user.logo_url} className="w-9 h-9 rounded-full border shadow-sm" alt="Logo" />
              <button onClick={() => { setUser(null); setCurrentView('home'); }} className="p-2 text-slate-300 hover:text-red-600 transition-colors"><LogOut className="w-5 h-5" /></button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentView('login')} className="px-5 py-2.5 text-slate-900 text-[11px] font-black border rounded-xl hover:bg-slate-50 transition-all">دخول</button>
              <button onClick={() => setCurrentView('register')} className="px-5 py-2.5 bg-slate-900 text-white text-[11px] font-black rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">سجل فريقك</button>
            </div>
          )}
        </div>
      </nav>
      <main className="pb-20">{renderContent()}</main>
      <footer className="bg-slate-900 text-slate-500 py-16 text-center border-t border-slate-800">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center justify-center gap-2 font-black text-xl text-white mb-6">
            <Trophy 
              onClick={handleSecretTrigger} 
              className="w-8 h-8 text-blue-600 cursor-help transition-transform active:scale-125" 
            /> 
            <span>TournamentPortal</span>
          </div>
          <p className="text-[10px] uppercase tracking-widest leading-loose">منصة إدارة البطولات الرياضية الاحترافية. نحن نؤمن بأن كل لاعب يستحق أن يظهر موهبته للعالم.</p>
          <div className="mt-8 pt-8 border-t border-slate-800 text-[9px] font-bold">&copy; 2024 جميع الحقوق محفوظة.</div>
        </div>
      </footer>
    </div>
  );
}
