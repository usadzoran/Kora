
import React, { useState, useEffect } from 'react';
import { SupabaseService } from './services/supabase';
import { TeamRegistration, LiveChannel } from './types';
import { 
  Trophy, User, Mail, MapPin, Shield, CheckCircle2, Loader2,
  ArrowRight, LogIn, LogOut, Radio, Lock, ExternalLink, Eye, EyeOff, Save, Smartphone, AlertCircle
} from 'lucide-react';

type ViewState = 'home' | 'profile' | 'live' | 'admin' | 'login' | 'register' | 'public-team';

const RegisterView: React.FC<{ onSwitch: () => void, onSuccess: () => void }> = ({ onSwitch, onSuccess }) => {
  const [formData, setFormData] = useState({
    team_name: '',
    coach_name: '',
    contact_email: '',
    password: '',
    region: ''
  });
  const [showPass, setShowPass] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [localMode, setLocalMode] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      const result = await SupabaseService.registerTeam(formData);
      if (result.error) {
        throw new Error(result.error.message || 'فشل الاتصال بقاعدة البيانات');
      }
      
      if ((result as any).isLocal) {
        setLocalMode(true);
        alert('تم حفظ البيانات محلياً في متصفحك لأن جدول قاعدة البيانات غير موجود حالياً. يمكنك الاستمرار في المعاينة!');
      } else {
        alert('تم تسجيل فريقك في السحابة بنجاح!');
      }
      
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-12 px-6 animate-in slide-in-from-bottom-8 duration-500">
      <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col lg:flex-row border border-slate-100">
        <div className="lg:w-2/5 bg-slate-900 text-white p-12 flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <Trophy className="w-16 h-16 text-blue-500 mb-8" />
            <h2 className="text-4xl font-black mb-6 leading-tight">سجل فريقك <br/>في ثوانٍ</h2>
            <p className="text-slate-400 text-lg leading-relaxed">كن جزءاً من أكبر تجمع رياضي رقمي. منصة احترافية لإدارة فريقك.</p>
          </div>
          <div className="relative z-10 space-y-6 mt-12">
            <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl">
              <Shield className="text-blue-500 w-6 h-6" />
              <span className="font-bold text-sm">بياناتك محمية ومشفرة</span>
            </div>
          </div>
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl"></div>
        </div>

        <div className="lg:w-3/5 p-12 lg:p-16">
          <div className="max-w-md mx-auto">
            <h3 className="text-2xl font-black mb-2">طلب انضمام جديد</h3>
            <p className="text-slate-400 mb-8">يرجى ملء كافة البيانات المطلوبة</p>

            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl flex flex-col gap-2 text-xs font-bold border border-red-100 animate-shake">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> <span>خطأ في التسجيل:</span>
                </div>
                <p className="opacity-80">{error}</p>
                {error.includes('cache') && (
                  <p className="text-[10px] bg-red-600 text-white p-2 rounded-lg mt-2">
                    تنبيه: جدول "teams" غير موجود في Supabase. يرجى إنشاؤه من لوحة التحكم.
                  </p>
                )}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 mr-2">اسم الفريق الرسمي</label>
                <input required value={formData.team_name} onChange={e => setFormData({...formData, team_name: e.target.value})} placeholder="مثال: نادي الصقور" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 ring-blue-500/20 focus:border-blue-500 transition-all" />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 mr-2">اسم المدرب المسؤول</label>
                <input required value={formData.coach_name} onChange={e => setFormData({...formData, coach_name: e.target.value})} placeholder="الاسم الرباعي" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 ring-blue-500/20 focus:border-blue-500 transition-all" />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 mr-2">البريد الإلكتروني</label>
                <input type="email" required value={formData.contact_email} onChange={e => setFormData({...formData, contact_email: e.target.value})} placeholder="coach@example.com" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 ring-blue-500/20 focus:border-blue-500 transition-all" />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 mr-2">كلمة المرور (للدخول لاحقاً)</label>
                <div className="relative">
                  <input type={showPass ? "text" : "password"} required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="••••••••" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 ring-blue-500/20 focus:border-blue-500 transition-all" />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300">
                    {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 mr-2">المنطقة</label>
                <input required value={formData.region} onChange={e => setFormData({...formData, region: e.target.value})} placeholder="المدينة أو المنطقة" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 ring-blue-500/20 focus:border-blue-500 transition-all" />
              </div>

              <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl hover:bg-blue-700 hover:shadow-blue-500/20 flex items-center justify-center gap-3 mt-4 transition-all disabled:opacity-50">
                {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Save className="w-5 h-5" /> إرسال طلب التسجيل</>}
              </button>
            </form>

            <div className="mt-8 text-center border-t pt-8">
              <p className="text-slate-400 text-sm">مسجل بالفعل؟ <button onClick={onSwitch} className="text-blue-600 font-black hover:underline">سجل دخولك هنا</button></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>('home');
  const [user, setUser] = useState<TeamRegistration | null>(null);
  const [publicTeam, setPublicTeam] = useState<TeamRegistration | null>(null);
  const [liveChannels, setLiveChannels] = useState<LiveChannel[]>([]);
  const [allTeams, setAllTeams] = useState<TeamRegistration[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [channels, teams] = await Promise.all([
        SupabaseService.getLiveChannels(),
        SupabaseService.getAllTeams()
      ]);
      setLiveChannels(channels || []);
      setAllTeams(teams || []);
    } catch (err) {
      console.error("Load error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogin = async (email: string, pass: string) => {
    const { data, error } = await SupabaseService.login(email, pass);
    if (!error && data) {
      setUser(data);
      setCurrentView('home');
    } else {
      alert(error?.message || 'فشل تسجيل الدخول. تأكد من البيانات.');
    }
  };

  const renderContent = () => {
    if (isLoading) return (
      <div className="h-[70vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
        <p className="text-slate-400 font-bold">جاري تحميل البيانات...</p>
      </div>
    );

    switch (currentView) {
      case 'register': return <RegisterView onSuccess={() => { fetchData(); setCurrentView('home'); }} onSwitch={() => setCurrentView('login')} />;
      case 'login': return (
        <div className="max-w-md mx-auto py-24 px-6 animate-in fade-in duration-500">
          <div className="bg-white rounded-[2.5rem] p-10 shadow-2xl border text-center">
            <Trophy className="w-16 h-16 text-blue-600 mx-auto mb-6" />
            <h3 className="text-2xl font-black mb-8">تسجيل الدخول</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const target = e.target as any;
              handleLogin(target[0].value, target[1].value);
            }} className="space-y-4">
              <input type="email" required placeholder="البريد الإلكتروني" className="w-full p-4 bg-slate-50 border rounded-2xl outline-none focus:border-blue-500" />
              <input type="password" required placeholder="كلمة المرور" className="w-full p-4 bg-slate-50 border rounded-2xl outline-none focus:border-blue-500" />
              <button type="submit" className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-lg hover:bg-blue-700">دخول</button>
            </form>
            <div className="mt-8 flex flex-col gap-3">
              <button onClick={() => setCurrentView('register')} className="text-blue-600 text-xs font-black hover:underline">سجل فريقك الآن</button>
              <button onClick={() => setCurrentView('home')} className="text-slate-400 text-xs underline">العودة للرئيسية</button>
            </div>
          </div>
        </div>
      );
      case 'live': return (
        <div className="max-w-7xl mx-auto py-12 px-6">
          <h2 className="text-3xl font-black mb-10 flex items-center gap-2 text-slate-900"><Radio className="text-red-600 animate-pulse" /> قنوات البث</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {liveChannels.length > 0 ? liveChannels.map(ch => (
              <div key={ch.id} className="bg-white rounded-3xl border p-5 shadow-sm group">
                <div className="h-44 w-full bg-slate-100 rounded-2xl mb-5 overflow-hidden">
                  <img src={ch.thumbnail_url} className="w-full h-full object-cover" />
                </div>
                <h4 className="font-bold text-lg mb-4">{ch.name}</h4>
                <button onClick={() => window.open(ch.stream_url, '_blank')} className="w-full py-3 bg-slate-900 text-white rounded-xl text-sm font-black hover:bg-blue-600 transition-all flex items-center justify-center gap-2">مشاهدة <ExternalLink className="w-4 h-4" /></button>
              </div>
            )) : <div className="col-span-full py-20 text-center text-slate-400 font-bold border-2 border-dashed rounded-3xl">لا توجد بثوث نشطة الآن</div>}
          </div>
        </div>
      );
      default: return (
        <>
          <section className="bg-slate-900 pt-32 pb-40 px-6 md:px-12 text-center text-white relative overflow-hidden">
             <div className="relative z-10 max-w-4xl mx-auto">
               <h1 className="text-6xl md:text-8xl font-black mb-8 leading-tight tracking-tighter">بوابة البطولة</h1>
               <p className="text-slate-400 text-xl mb-12 font-light">المنصة الأولى لإدارة الفرق الرياضية والنتائج والبث المباشر باحترافية.</p>
               <div className="flex flex-wrap justify-center gap-4">
                 <button onClick={() => setCurrentView('register')} className="px-10 py-5 bg-blue-600 rounded-2xl font-black text-lg shadow-2xl hover:scale-105 transition-transform active:scale-95">سجل فريقك</button>
                 <button onClick={() => setCurrentView('live')} className="px-10 py-5 bg-white/10 rounded-2xl font-black text-lg border border-white/20 hover:bg-white/20 backdrop-blur-md transition-all">البث المباشر</button>
               </div>
             </div>
             <Trophy className="absolute -bottom-20 -right-20 w-[400px] h-[400px] text-white/5 rotate-12" />
          </section>
          
          <section className="py-24 px-6 md:px-12 bg-white">
            <div className="max-w-7xl mx-auto">
              <h2 className="text-4xl font-black mb-16 text-slate-900">الفرق المسجلة</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
                {allTeams.length > 0 ? allTeams.map(team => (
                  <div key={team.id} className="text-center group">
                    <img src={team.logo_url} className="w-24 h-24 md:w-32 md:h-32 rounded-full mx-auto border-4 border-white shadow-xl group-hover:scale-110 transition-all duration-500 bg-white object-cover" />
                    <p className="font-black text-slate-900 mt-4">{team.team_name}</p>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">{team.region}</p>
                  </div>
                )) : (
                  <div className="col-span-full py-20 text-center text-slate-400 font-bold bg-slate-50 rounded-3xl border-2 border-dashed">كن أول فريق يسجل في البطولة!</div>
                )}
              </div>
            </div>
          </section>
        </>
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-600 selection:text-white" dir="rtl">
      <nav className="bg-white/90 backdrop-blur-md border-b py-4 px-6 md:px-12 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3 font-black text-xl cursor-pointer" onClick={() => setCurrentView('home')}>
          <div className="bg-blue-600 p-2 rounded-xl shadow-lg"><Trophy className="w-6 h-6 text-white" /></div>
          <span>بوابة البطولة</span>
        </div>
        <div className="hidden md:flex gap-10 text-[11px] font-black uppercase tracking-widest text-slate-400">
           <button onClick={() => setCurrentView('home')} className={currentView === 'home' ? 'text-blue-600' : ''}>الرئيسية</button>
           <button onClick={() => setCurrentView('live')} className={currentView === 'live' ? 'text-red-600' : ''}>البث</button>
        </div>
        <div>
          {user ? (
            <button onClick={() => setUser(null)} className="p-2.5 text-red-500 bg-red-50 rounded-xl"><LogOut className="w-5 h-5" /></button>
          ) : (
            <button onClick={() => setCurrentView('login')} className="px-7 py-3 bg-slate-900 text-white text-[11px] font-black rounded-2xl hover:bg-blue-600 transition-all">دخول</button>
          )}
        </div>
      </nav>
      <main className="min-h-[75vh]">{renderContent()}</main>
      <footer className="bg-slate-900 text-slate-500 py-24 text-center">
        <div className="max-w-4xl mx-auto px-6">
          <Trophy className="w-14 h-14 text-blue-600 mx-auto mb-10" />
          <p className="text-sm max-w-lg mx-auto mb-12 opacity-80">&copy; 2024 جميع الحقوق محفوظة لـ بوابة البطولة الرياضية. صُمم باحترافية لإدارة المنافسات.</p>
        </div>
      </footer>
    </div>
  );
}
