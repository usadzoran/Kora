import React, { useState, useEffect } from 'react';
import { FirebaseService } from './services/firebase';
import { TeamRegistration, LiveChannel } from './types';
import { 
  Trophy, Shield, Loader2, Radio, ExternalLink, AlertCircle, Terminal, RefreshCw, LogOut, Save, Copy, Check
} from 'lucide-react';

type ViewState = 'home' | 'profile' | 'live' | 'admin' | 'login' | 'register' | 'public-team';

const PermissionAlert: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const rulesCode = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // السماح بالوصول الكامل للمجموعات المطلوبة (للتطوير)
    match /teams/{document=**} {
      allow read, write: if true;
    }
    match /live_channels/{document=**} {
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
        <h2>تحتاج لتحديث قواعد Firebase</h2>
      </div>
      
      <div className="space-y-6 text-slate-700 leading-relaxed mb-8">
        <p className="font-bold text-xl bg-red-50 p-6 rounded-2xl border border-red-100 text-red-700">
          خطأ "Permission Denied" يظهر لأن قاعدة البيانات محمية. يجب نسخ القواعد أدناه ولصقها في مشروعك.
        </p>
        
        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
          <h3 className="font-black text-slate-900 mb-4 flex items-center gap-2">
            <Terminal className="w-6 h-6 text-blue-600" /> خطوات الحل النهائي:
          </h3>
          <ol className="list-decimal list-inside space-y-4 pr-4 font-bold text-slate-600">
            <li>اذهب إلى <a href="https://console.firebase.google.com/" target="_blank" className="text-blue-600 underline">Firebase Console</a>.</li>
            <li>ادخل إلى <strong>Firestore Database</strong>.</li>
            <li>انقر على تبويب <strong>Rules</strong> في الأعلى.</li>
            <li>انسخ الكود الأخضر أدناه واستبدل الكود القديم به.</li>
            <li>اضغط <strong>Publish</strong> وانتظر دقيقة.</li>
          </ol>
        </div>
      </div>

      <div className="relative group">
        <div className="absolute top-4 left-4 z-10">
          <button 
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all shadow-lg"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'تم النسخ!' : 'نسخ الكود'}
          </button>
        </div>
        <div className="bg-slate-900 text-emerald-400 p-8 rounded-[2rem] font-mono text-sm overflow-x-auto ltr shadow-inner border-4 border-slate-800 mb-8 pt-16">
          <pre>{rulesCode}</pre>
        </div>
      </div>
      
      <button 
        onClick={() => window.location.reload()} 
        className="w-full py-6 bg-slate-900 text-white rounded-2xl font-black text-xl hover:bg-blue-600 transition-all flex items-center justify-center gap-4 shadow-2xl"
      >
        <RefreshCw className="w-8 h-8" /> لقد قمت بتحديث القواعد، أعد تحميل الصفحة
      </button>
    </div>
  );
};

const RegisterView: React.FC<{ onSwitch: () => void, onSuccess: () => void }> = ({ onSwitch, onSuccess }) => {
  const [formData, setFormData] = useState({
    team_name: '',
    coach_name: '',
    contact_email: '',
    password: '',
    region: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      const result = await FirebaseService.registerTeam(formData);
      if (result.error) {
        if (result.error === "PERMISSION_DENIED") throw new Error("PERMISSION_DENIED");
        throw new Error(result.error);
      }
      
      alert('تم التسجيل بنجاح في Firestore!');
      onSuccess();
    } catch (err: any) {
      if (err.message === "PERMISSION_DENIED") {
        setError("خطأ في الصلاحيات: يرجى تحديث قواعد الحماية في Firebase.");
      } else {
        setError(err.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-12 px-6">
      <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col lg:flex-row border border-slate-100">
        <div className="lg:w-2/5 bg-slate-900 text-white p-12 flex flex-col justify-between">
          <div>
            <Trophy className="w-16 h-16 text-blue-500 mb-8" />
            <h2 className="text-4xl font-black mb-6 leading-tight">سجل فريقك <br/>الآن</h2>
            <p className="text-slate-400 text-lg">انضم إلى البطولة وقم بإدارة فريقك مباشرة عبر Firebase.</p>
          </div>
        </div>

        <div className="lg:w-3/5 p-12 lg:p-16">
          <div className="max-w-md mx-auto">
            <h3 className="text-2xl font-black mb-6">طلب انضمام جديد</h3>
            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl flex items-center gap-3 text-sm font-bold border border-red-100 animate-shake">
                <AlertCircle className="w-5 h-5 flex-shrink-0" /> <p>{error}</p>
              </div>
            )}
            <form onSubmit={handleRegister} className="space-y-4">
              <input required value={formData.team_name} onChange={e => setFormData({...formData, team_name: e.target.value})} placeholder="اسم الفريق" className="w-full p-4 bg-slate-50 border rounded-2xl outline-none focus:ring-2 ring-blue-500/20 focus:border-blue-500" />
              <input required value={formData.coach_name} onChange={e => setFormData({...formData, coach_name: e.target.value})} placeholder="اسم المدرب" className="w-full p-4 bg-slate-50 border rounded-2xl outline-none focus:ring-2 ring-blue-500/20 focus:border-blue-500" />
              <input type="email" required value={formData.contact_email} onChange={e => setFormData({...formData, contact_email: e.target.value})} placeholder="البريد الإلكتروني" className="w-full p-4 bg-slate-50 border rounded-2xl outline-none focus:ring-2 ring-blue-500/20 focus:border-blue-500" />
              <input type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="كلمة المرور" className="w-full p-4 bg-slate-50 border rounded-2xl outline-none focus:ring-2 ring-blue-500/20 focus:border-blue-500" />
              <input required value={formData.region} onChange={e => setFormData({...formData, region: e.target.value})} placeholder="المنطقة" className="w-full p-4 bg-slate-50 border rounded-2xl outline-none focus:ring-2 ring-blue-500/20 focus:border-blue-500" />
              <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl flex items-center justify-center gap-3 transition-all disabled:opacity-50">
                {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Save className="w-5 h-5" /> تسجيل الفريق</>}
              </button>
            </form>
            <div className="mt-8 text-center"><button onClick={onSwitch} className="text-blue-600 font-black hover:underline text-sm">لديك حساب؟ سجل دخولك</button></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>('home');
  const [user, setUser] = useState<TeamRegistration | null>(null);
  const [liveChannels, setLiveChannels] = useState<LiveChannel[]>([]);
  const [allTeams, setAllTeams] = useState<TeamRegistration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [permissionError, setPermissionError] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    setPermissionError(false);
    try {
      const [channels, teams] = await Promise.all([
        FirebaseService.getLiveChannels(),
        FirebaseService.getAllTeams()
      ]);
      setLiveChannels(channels);
      setAllTeams(teams);
    } catch (err: any) {
      console.error("Fetch Data Error:", err);
      if (err.message === "PERMISSION_DENIED") {
        setPermissionError(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const renderContent = () => {
    if (isLoading) return (
      <div className="h-[70vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
        <p className="text-slate-400 font-bold">جاري المزامنة مع Firestore...</p>
      </div>
    );

    if (permissionError) return <PermissionAlert />;

    switch (currentView) {
      case 'register': return <RegisterView onSuccess={() => { fetchData(); setCurrentView('home'); }} onSwitch={() => setCurrentView('login')} />;
      case 'login': return (
        <div className="max-w-md mx-auto py-24 px-6">
          <div className="bg-white rounded-[2.5rem] p-10 shadow-2xl border text-center">
            <Trophy className="w-16 h-16 text-blue-600 mx-auto mb-6" />
            <h3 className="text-2xl font-black mb-8">تسجيل الدخول</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const target = e.target as any;
              const { data, error } = await FirebaseService.loginTeam(target[0].value, target[1].value);
              if (error) {
                if (error === "PERMISSION_DENIED") setPermissionError(true);
                else alert(error);
              } else { 
                setUser(data); 
                setCurrentView('home'); 
              }
            }} className="space-y-4">
              <input type="email" required placeholder="البريد الإلكتروني" className="w-full p-4 bg-slate-50 border rounded-2xl outline-none focus:border-blue-500" />
              <input type="password" required placeholder="كلمة المرور" className="w-full p-4 bg-slate-50 border rounded-2xl outline-none focus:border-blue-500" />
              <button type="submit" className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-lg hover:bg-blue-700">دخول</button>
            </form>
            <button onClick={() => setCurrentView('register')} className="mt-6 text-blue-600 text-xs font-black hover:underline">سجل فريقك الآن</button>
          </div>
        </div>
      );
      case 'live': return (
        <div className="max-w-7xl mx-auto py-12 px-6">
          <h2 className="text-3xl font-black mb-10 flex items-center gap-2 text-slate-900"><Radio className="text-red-600 animate-pulse" /> قنوات البث المباشر</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {liveChannels.length > 0 ? liveChannels.map(ch => (
              <div key={ch.id} className="bg-white rounded-3xl border p-5 shadow-sm group">
                <div className="h-44 w-full bg-slate-100 rounded-2xl mb-5 overflow-hidden">
                  <img src={ch.thumbnail_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                </div>
                <h4 className="font-bold text-lg mb-4">{ch.name}</h4>
                <button onClick={() => window.open(ch.stream_url, '_blank')} className="w-full py-3 bg-slate-900 text-white rounded-xl text-sm font-black hover:bg-blue-600 transition-all flex items-center justify-center gap-2">مشاهدة <ExternalLink className="w-4 h-4" /></button>
              </div>
            )) : <div className="col-span-full py-20 text-center text-slate-400 font-bold border-2 border-dashed rounded-3xl">لا توجد بثوث نشطة حالياً في Firestore</div>}
          </div>
        </div>
      );
      default: return (
        <>
          <section className="bg-slate-900 pt-32 pb-40 px-6 text-center text-white relative overflow-hidden">
             <div className="relative z-10 max-w-4xl mx-auto">
               <h1 className="text-6xl md:text-8xl font-black mb-8 leading-tight tracking-tighter">بوابة البطولة</h1>
               <p className="text-slate-400 text-xl mb-12 font-light">إدارة متكاملة للفرق والنتائج عبر تقنية Cloud Firestore.</p>
               <div className="flex flex-wrap justify-center gap-4">
                 <button onClick={() => setCurrentView('register')} className="px-10 py-5 bg-blue-600 rounded-2xl font-black text-lg shadow-2xl hover:scale-105 transition-transform active:scale-95">سجل فريقك</button>
                 <button onClick={() => setCurrentView('live')} className="px-10 py-5 bg-white/10 rounded-2xl font-black text-lg border border-white/20 hover:bg-white/20 transition-all">البث المباشر</button>
               </div>
             </div>
             <Trophy className="absolute -bottom-20 -right-20 w-[400px] h-[400px] text-white/5 rotate-12" />
          </section>
          
          <section className="py-24 px-6 bg-white">
            <div className="max-w-7xl mx-auto">
              <h2 className="text-4xl font-black mb-16 text-slate-900">الفرق المسجلة</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
                {allTeams.length > 0 ? allTeams.map(team => (
                  <div key={team.id} className="text-center group">
                    <img src={team.logo_url} className="w-24 h-24 md:w-32 md:h-32 rounded-full mx-auto border-4 border-white shadow-xl group-hover:scale-110 transition-all duration-500 bg-white object-cover" />
                    <p className="font-black text-slate-900 mt-4">{team.team_name}</p>
                    <p className="text-[10px] text-slate-400 font-black uppercase mt-1">{team.region}</p>
                  </div>
                )) : (
                  <div className="col-span-full py-20 text-center text-slate-400 font-bold bg-slate-50 rounded-3xl border-2 border-dashed">قائمة الفرق فارغة (تأكد من إضافة بيانات في Firestore).</div>
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
            <button onClick={() => setUser(null)} className="p-2.5 text-red-500 bg-red-50 rounded-xl flex items-center gap-2 transition-all hover:bg-red-100">
              <span className="text-xs font-bold text-slate-900">{user.team_name}</span> 
              <LogOut className="w-5 h-5" />
            </button>
          ) : (
            <button onClick={() => setCurrentView('login')} className="px-7 py-3 bg-slate-900 text-white text-[11px] font-black rounded-2xl hover:bg-blue-600 transition-all">دخول</button>
          )}
        </div>
      </nav>
      <main className="min-h-[75vh]">{renderContent()}</main>
      <footer className="bg-slate-900 text-slate-500 py-20 text-center">
        <div className="max-w-4xl mx-auto px-6">
          <Trophy className="w-14 h-14 text-blue-600 mx-auto mb-10 opacity-50" />
          <p className="text-sm opacity-80 font-bold tracking-wide">نظام إدارة البطولة - مدعوم بـ Google Firebase &copy; 2024</p>
        </div>
      </footer>
    </div>
  );
}