

import React, { useState, useEffect, useRef } from 'react';
import { FirebaseService } from './services/firebase';
import { TeamRegistration, LiveChannel, Post, Comment, AdConfig, Match } from './types';
import { 
  Trophy, Shield, Loader2, Radio, ExternalLink, RefreshCw, LogOut, Save, Copy, Check, User, 
  LayoutGrid, Image as ImageIcon, Send, MapPin, Users, Plus, Hash, Edit3, Camera, Heart, 
  MessageSquare, ChevronDown, Settings, Upload, X, Share2, Flame, Bell, Star, Zap, MessageCircle,
  Medal, Target, Activity, Calendar, Home, Menu, Trash2, Eye, EyeOff, Lock, ShieldAlert, Shuffle,
  Megaphone, UserPlus, BarChart3, Clock, AlertCircle, Layers, Database
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
  const [user, setUser] = useState<TeamRegistration | null>(null);
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
      if (savedTeamId && !user) {
        const teamData = await FirebaseService.getTeamById(savedTeamId);
        if (teamData) setUser(teamData);
      }

      const [channels, teams, hubPosts, adsData, matchesData, statsData] = await Promise.all([
        FirebaseService.getLiveChannels(isAdmin || savedAdmin === 'true'),
        FirebaseService.getAllTeams(),
        FirebaseService.getPosts(),
        FirebaseService.getAds(),
        FirebaseService.getMatches(),
        FirebaseService.getStats()
      ]);
      setLiveChannels(channels);
      setAllTeams(teams.filter(t => t.contact_email !== ADMIN_CREDS.email));
      setPosts(hubPosts);
      setAds(adsData);
      setMatches(matchesData);
      setVisitorCount(statsData);
      
      if (!silent) await FirebaseService.trackVisit();
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

  const handleSecretClick = () => {
    const newCount = adminClickCount + 1;
    setAdminClickCount(newCount);
    if (newCount >= 7) {
      setCurrentView('admin-login');
      setAdminClickCount(0);
      window.location.hash = 'admin-access';
    }
  };

  const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState<'stats' | 'teams' | 'matches' | 'posts' | 'channels' | 'ads'>('stats');
    const [isSaving, setIsSaving] = useState(false);
    const [isSeeding, setIsSeeding] = useState(false);
    const [tempAds, setTempAds] = useState<AdConfig>({...ads});
    const [editingMatch, setEditingMatch] = useState<Match | null>(null);

    const [bulkAdCode, setBulkAdCode] = useState("");
    const [selectedSlots, setSelectedSlots] = useState<string[]>([]);

    const adSlots = [
      { id: 'under_header', label: 'تحت الهيدر (العام)' },
      { id: 'home_hero_bottom', label: 'أسفل الهيرو (الرئيسية)' },
      { id: 'after_draw', label: 'بعد القرعة (الرئيسية)' },
      { id: 'hub_top', label: 'أعلى الملتقى' },
      { id: 'hub_bottom', label: 'أسفل الملتقى' },
      { id: 'matches_top', label: 'أعلى المباريات' },
      { id: 'matches_bottom', label: 'أسفل المباريات' },
      { id: 'live_top', label: 'أعلى البث المباشر' },
      { id: 'profile_top', label: 'أعلى بروفايل النادي' },
    ];

    const seedData = async () => {
      if (!confirm("هل أنت متأكد؟ سيتم إنشاء 6 أندية جزائرية ومنشوراتهم الآن.")) return;
      setIsSeeding(true);
      
      const seedTeams = [
        { name: "مولودية الجزائر", coach: "باتريس بوميل", email: "mca@kora.dz", region: "الجزائر العاصمة", color: "047857" },
        { name: "شبيبة القبائل", coach: "عبد الحق بن شيخة", email: "jsk@kora.dz", region: "تيزي وزو", color: "ca8a04" },
        { name: "وفاق سطيف", coach: "رضا بن دريس", email: "ess@kora.dz", region: "سطيف", color: "1e293b" },
        { name: "شباب بلوزداد", coach: "كورينتين مارتينز", email: "crb@kora.dz", region: "الجزائر العاصمة", color: "be123c" },
        { name: "اتحاد الجزائر", coach: "نبيل معلول", email: "usma@kora.dz", region: "الجزائر العاصمة", color: "991b1b" },
        { name: "مولودية وهران", coach: "إيريك شيل", email: "mco@kora.dz", region: "وهران", color: "dc2626" }
      ];

      const postsTexts = [
        "نحن هنا للمنافسة على اللقب! الموسم الجديد يبدو واعداً جداً 🏆",
        "تدريبات شاقة اليوم تحضيراً للمباراة القادمة. الروح المعنوية في القمة 💪",
        "شكراً لكل الجماهير على الدعم المتواصل. نحن فريق واحد 🟢🔴",
        "مستعدون لرفع التحدي في الملتقى. من يتحدى النادي اليوم؟ ⚽",
        "عمل كبير ينتظرنا، لكننا نملك أفضل اللاعبين في البطولة 🌟",
        "تاريخ النادي يدفعنا دائماً للأمام. لن نرضى بغير الفوز 🚩"
      ];

      try {
        for (let i = 0; i < seedTeams.length; i++) {
          const t = seedTeams[i];
          // Added as any to fix Property 'id' does not exist error on the return union type of registerTeam
          const res: any = await FirebaseService.registerTeam({
            team_name: t.name,
            coach_name: t.coach,
            contact_email: t.email,
            password: "password123",
            region: t.region
          });

          if (res && res.id) {
            // تحديث اللوغو ليكون مميزاً بلون النادي
            const logoUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(t.name)}&background=${t.color}&color=fff&size=200&bold=true`;
            await FirebaseService.updateTeamProfile(res.id, { logo_url: logoUrl });

            // إنشاء منشور للنادي
            await FirebaseService.createPost({
              teamId: res.id,
              teamName: t.name,
              teamLogo: logoUrl,
              content: postsTexts[i],
              imageUrl: ""
            });
          }
        }
        alert("تم إنشاء الأندية والمنشورات بنجاح!");
        fetchData(true);
      } catch (e) {
        alert("حدث خطأ أثناء التوليد.");
      } finally {
        setIsSeeding(false);
      }
    };

    const applyBulkAd = () => {
      if (!bulkAdCode.trim()) { alert("يرجى إدخال كود الإعلان أولاً."); return; }
      if (selectedSlots.length === 0) { alert("يرجى تحديد مكان واحد على الأقل."); return; }
      const newTempAds = { ...tempAds };
      selectedSlots.forEach(slotId => { (newTempAds as any)[slotId] = bulkAdCode; });
      setTempAds(newTempAds);
      setBulkAdCode("");
      setSelectedSlots([]);
      alert("تم التطبيق مؤقتاً. اضغط حفظ بالأسفل.");
    };

    const toggleSlotSelection = (id: string) => {
      setSelectedSlots(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    return (
      <div className="max-w-7xl mx-auto py-10 px-6 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12 bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 text-right">
          <div><h2 className="text-3xl font-black flex items-center gap-3 justify-end">الإدارة المركزية <Lock className="text-blue-600" /></h2><p className="text-slate-400 font-bold">تحكم كامل في إحصائيات، مباريات وإعلانات البطولة.</p></div>
          <div className="flex gap-4">
             <div className="bg-blue-600 text-white px-8 py-3 rounded-2xl flex items-center gap-3 shadow-lg"><BarChart3 className="w-5 h-5" /><span className="font-black text-xl">{visitorCount}</span><p className="text-[10px] opacity-70">زائر</p></div>
          </div>
        </div>

        <div className="flex gap-2 mb-8 bg-slate-100 p-1.5 rounded-2xl w-max mr-0 ml-auto overflow-x-auto max-w-full custom-scrollbar">
          {['stats', 'teams', 'matches', 'posts', 'channels', 'ads'].map((tab: any) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === tab ? 'bg-white text-blue-600 shadow-md' : 'text-slate-500'}`}>
              {tab === 'stats' ? 'الإحصائيات' : tab === 'teams' ? 'الأندية' : tab === 'matches' ? 'المباريات' : tab === 'posts' ? 'المنشورات' : tab === 'channels' ? 'البث' : 'الإعلانات'}
            </button>
          ))}
        </div>

        {activeTab === 'stats' && (
          <div className="space-y-8 animate-in slide-in-from-bottom duration-500">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
               <div className="bg-white p-8 rounded-[2rem] shadow-lg border-b-4 border-blue-500 text-center"><p className="text-4xl font-black text-slate-800">{visitorCount}</p><p className="text-xs text-slate-400 font-black mt-2">إجمالي الزيارات</p></div>
               <div className="bg-white p-8 rounded-[2rem] shadow-lg border-b-4 border-emerald-500 text-center"><p className="text-4xl font-black text-slate-800">{allTeams.length}</p><p className="text-xs text-slate-400 font-black mt-2">الأندية المسجلة</p></div>
               <div className="bg-white p-8 rounded-[2rem] shadow-lg border-b-4 border-amber-500 text-center"><p className="text-4xl font-black text-slate-800">{posts.length}</p><p className="text-xs text-slate-400 font-black mt-2">منشورات الملتقى</p></div>
               <div className="bg-white p-8 rounded-[2rem] shadow-lg border-b-4 border-rose-500 text-center"><p className="text-4xl font-black text-slate-800">{matches.length}</p><p className="text-xs text-slate-400 font-black mt-2">المباريات المبرمجة</p></div>
            </div>

            <div className="bg-amber-50 p-10 rounded-[2.5rem] border-2 border-dashed border-amber-200 text-center">
              <Database className="w-12 h-12 text-amber-500 mx-auto mb-4" />
              <h3 className="text-xl font-black text-amber-900 mb-2">تهيئة قاعدة البيانات</h3>
              <p className="text-amber-700 font-bold text-sm mb-8 max-w-lg mx-auto leading-relaxed">إذا كنت تبدأ للتو، يمكنك إنشاء 6 أندية جزائرية كبرى مع منشوراتها بضغطة زر واحدة لتجربة شكل الموقع.</p>
              <button 
                onClick={seedData}
                disabled={isSeeding}
                className="bg-amber-500 text-white px-10 py-4 rounded-2xl font-black shadow-xl hover:bg-amber-600 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-3 mx-auto"
              >
                {isSeeding ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Plus className="w-6 h-6" /> توليد 6 أندية ومنشورات</>}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'matches' && (
          <div className="space-y-8 text-right animate-in fade-in duration-500">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-50">
               <h3 className="text-xl font-black mb-6 flex items-center gap-2 justify-end">
                 {editingMatch ? 'تعديل مباراة قائمة' : 'إضافة مباراة جديدة'}
                 <Calendar className="text-blue-600" />
               </h3>
               <form onSubmit={async (e) => {
                 e.preventDefault(); setIsSaving(true);
                 const t = e.target as any;
                 const matchData: any = {
                   homeTeamId: t[0].value, homeTeamName: allTeams.find(x => x.id === t[0].value)?.team_name || "",
                   homeTeamLogo: allTeams.find(x => x.id === t[0].value)?.logo_url || "",
                   awayTeamId: t[1].value, awayTeamName: allTeams.find(x => x.id === t[1].value)?.team_name || "",
                   awayTeamLogo: allTeams.find(x => x.id === t[1].value)?.logo_url || "",
                   date: t[2].value, time: t[3].value, scoreHome: Number(t[4].value), scoreAway: Number(t[5].value),
                   status: t[6].value, tournament_round: t[7].value
                 };
                 if (editingMatch) await FirebaseService.updateMatch(editingMatch.id!, matchData);
                 else await FirebaseService.createMatch(matchData);
                 setEditingMatch(null); t.reset(); fetchData(true); setIsSaving(false);
               }} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                 <select required defaultValue={editingMatch?.homeTeamId} className="p-4 bg-slate-50 rounded-xl font-bold text-sm text-right outline-none">
                   <option value="">اختر الفريق الأول</option>
                   {allTeams.map(t => <option key={t.id} value={t.id}>{t.team_name}</option>)}
                 </select>
                 <select required defaultValue={editingMatch?.awayTeamId} className="p-4 bg-slate-50 rounded-xl font-bold text-sm text-right outline-none">
                   <option value="">اختر الفريق الثاني</option>
                   {allTeams.map(t => <option key={t.id} value={t.id}>{t.team_name}</option>)}
                 </select>
                 <input type="date" required defaultValue={editingMatch?.date} className="p-4 bg-slate-50 rounded-xl font-bold text-sm text-right outline-none" />
                 <input type="time" required defaultValue={editingMatch?.time} className="p-4 bg-slate-50 rounded-xl font-bold text-sm text-right outline-none" />
                 <input type="number" placeholder="أهداف الأول" defaultValue={editingMatch?.scoreHome || 0} className="p-4 bg-slate-50 rounded-xl font-bold text-sm text-right outline-none" />
                 <input type="number" placeholder="أهداف الثاني" defaultValue={editingMatch?.scoreAway || 0} className="p-4 bg-slate-50 rounded-xl font-bold text-sm text-right outline-none" />
                 <select defaultValue={editingMatch?.status} className="p-4 bg-slate-50 rounded-xl font-bold text-sm text-right outline-none">
                   <option value="upcoming">قادمة</option>
                   <option value="live">مباشر</option>
                   <option value="finished">انتهت</option>
                 </select>
                 <input placeholder="الدور (مثال: ربع النهائي)" defaultValue={editingMatch?.tournament_round} className="p-4 bg-slate-50 rounded-xl font-bold text-sm text-right outline-none" />
                 <div className="md:col-span-4 flex gap-3">
                   <button className="flex-1 py-4 bg-blue-600 text-white rounded-xl font-black shadow-lg">حفظ المباراة</button>
                   {editingMatch && <button type="button" onClick={() => setEditingMatch(null)} className="px-8 py-4 bg-slate-100 text-slate-500 rounded-xl font-black">إلغاء</button>}
                 </div>
               </form>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {matches.map(m => (
                <div key={m.id} className="bg-white p-6 rounded-[2rem] shadow-lg flex flex-col gap-4 border border-slate-50">
                   <div className="flex items-center justify-between">
                     <div className="flex gap-2">
                        <button onClick={() => setEditingMatch(m)} className="text-blue-500 p-2 hover:bg-blue-50 rounded-lg"><Edit3 className="w-4 h-4" /></button>
                        <button onClick={() => FirebaseService.deleteMatch(m.id!).then(() => fetchData(true))} className="text-rose-500 p-2 hover:bg-rose-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                     </div>
                     <div className="bg-slate-100 px-4 py-1 rounded-full text-[10px] font-black">{m.tournament_round}</div>
                   </div>
                   <div className="flex items-center justify-around py-2">
                      <div className="text-center w-24"><img src={m.homeTeamLogo} className="w-10 h-10 mx-auto rounded-lg mb-1 object-contain" /><p className="text-[9px] font-black truncate">{m.homeTeamName}</p></div>
                      <div className="text-center font-black text-xl px-5 py-2 bg-slate-50 rounded-xl">{m.scoreHome} - {m.scoreAway}</div>
                      <div className="text-center w-24"><img src={m.awayTeamLogo} className="w-10 h-10 mx-auto rounded-lg mb-1 object-contain" /><p className="text-[9px] font-black truncate">{m.awayTeamName}</p></div>
                   </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'ads' && (
          <div className="space-y-10 animate-in fade-in duration-500 text-right">
            <div className="bg-blue-600 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
               <div className="relative z-10">
                  <div className="flex items-center gap-3 justify-end mb-6"><h3 className="text-2xl font-black italic">أداة النشر السريع</h3><Zap className="w-8 h-8 text-amber-400 fill-current" /></div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                     <div className="space-y-4">
                        <textarea value={bulkAdCode} onChange={(e) => setBulkAdCode(e.target.value)} placeholder="ألصق كود الإعلان هنا..." className="w-full h-48 p-5 bg-white/10 border-2 border-white/20 rounded-[1.5rem] outline-none font-mono text-xs placeholder:text-blue-200/50" />
                        <button onClick={applyBulkAd} className="w-full py-5 bg-white text-blue-600 rounded-2xl font-black text-lg shadow-xl hover:bg-blue-50 transition-all flex items-center justify-center gap-3"><Layers className="w-6 h-6" /> تطبيق على الأماكن المحددة</button>
                     </div>
                     <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                           {adSlots.map(slot => (
                             <label key={slot.id} className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${selectedSlots.includes(slot.id) ? 'bg-white/20 border-white/40' : 'bg-transparent border-white/10'}`}>
                               <div className={`w-4 h-4 rounded-md border flex items-center justify-center ${selectedSlots.includes(slot.id) ? 'bg-amber-400 border-amber-400' : 'border-white/30'}`}>{selectedSlots.includes(slot.id) && <Check className="w-3 h-3 text-blue-900" />}</div>
                               <span className="text-[10px] font-bold">{slot.label}</span>
                               <input type="checkbox" className="hidden" checked={selectedSlots.includes(slot.id)} onChange={() => toggleSlotSelection(slot.id)} />
                             </label>
                           ))}
                        </div>
                     </div>
                  </div>
               </div>
            </div>
            <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-50">
               <form onSubmit={async (e) => { e.preventDefault(); setIsSaving(true); await FirebaseService.updateAds(tempAds); alert('تم الحفظ!'); setAds(tempAds); setIsSaving(false); fetchData(true); }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {adSlots.map((slot) => (
                  <div key={slot.id} className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <label className="text-[10px] font-black text-slate-400 uppercase block">{slot.label}</label>
                    <textarea value={(tempAds as any)[slot.id]} onChange={e => setTempAds({...tempAds, [slot.id]: e.target.value})} className="w-full h-32 p-3 bg-slate-900 text-emerald-400 font-mono text-[9px] rounded-xl outline-none" />
                  </div>
                ))}
                <div className="lg:col-span-3 pt-6"><button type="submit" className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black text-xl shadow-2xl flex items-center justify-center gap-3"><Save className="w-6 h-6" /> حفظ وتفعيل الإعلانات</button></div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  };

  const MatchCenterView = () => (
    <div className="max-w-7xl mx-auto py-12 px-6 pb-24 text-right animate-in fade-in duration-500">
      <AdDisplay html={ads.matches_top} />
      <div className="flex items-center justify-between mb-12">
         <div className="bg-slate-900 px-6 py-3 rounded-2xl text-white font-black text-xs uppercase flex items-center gap-3"><Activity className="w-4 h-4 text-emerald-400" /> مركز المباريات المباشر</div>
         <h2 className="text-4xl md:text-5xl font-black italic">جدول البطولة</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {matches.map(m => (
          <div key={m.id} className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100 flex flex-col gap-6 relative overflow-hidden group hover:translate-y-[-5px] transition-all">
             <div className="flex justify-between items-center relative z-10">
               <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-tighter shadow-sm border ${m.status === 'live' ? 'bg-rose-600 text-white border-rose-500 animate-pulse' : m.status === 'finished' ? 'bg-slate-800 text-white border-slate-700' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                 {m.status === 'live' ? 'مباشر الآن' : m.status === 'finished' ? 'انتهت' : 'قادمة'}
               </div>
               <div className="text-[10px] font-black text-slate-400">{m.tournament_round}</div>
             </div>
             <div className="flex items-center justify-around py-4 relative z-10">
                <div className="text-center flex-1">
                  <div className="w-20 h-20 mx-auto bg-slate-50 rounded-[1.5rem] p-3 border-4 border-white shadow-lg mb-4 flex items-center justify-center overflow-hidden">
                     <img src={m.homeTeamLogo} className="w-full h-full object-contain" />
                  </div>
                  <p className="font-black text-sm truncate text-slate-800">{m.homeTeamName}</p>
                </div>
                <div className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 bg-slate-50 px-6 py-4 rounded-[2rem] border border-slate-100">
                   {m.scoreHome} <span className="text-slate-200">-</span> {m.scoreAway}
                </div>
                <div className="text-center flex-1">
                  <div className="w-20 h-20 mx-auto bg-slate-50 rounded-[1.5rem] p-3 border-4 border-white shadow-lg mb-4 flex items-center justify-center overflow-hidden">
                     <img src={m.awayTeamLogo} className="w-full h-full object-contain" />
                  </div>
                  <p className="font-black text-sm truncate text-slate-800">{m.awayTeamName}</p>
                </div>
             </div>
             <div className="flex items-center justify-center gap-4 pt-6 border-t border-slate-50 text-[10px] font-black text-slate-400">
                <span className="flex items-center gap-2"><Calendar className="w-4 h-4 text-blue-500" /> {m.date}</span>
                <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-blue-500" /> {m.time}</span>
             </div>
          </div>
        ))}
      </div>
      <AdDisplay html={ads.matches_bottom} />
    </div>
  );

  const renderContent = () => {
    if (isLoading) return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-6">
        <div className="w-24 h-24 border-8 border-blue-600/10 border-t-blue-600 rounded-full animate-spin"></div>
        <div className="text-center"><h2 className="text-2xl font-black text-slate-800 italic">بوابة البطولة</h2><p className="text-slate-400 font-bold text-sm mt-2">جاري مزامنة البيانات...</p></div>
      </div>
    );
    if (permissionError) return <div className="p-20 text-center"><h2 className="text-red-500 font-black">حدث خطأ في الصلاحيات. يرجى مراجعة المشرف.</h2></div>;
    
    if (currentView === 'admin' && isAdmin) return <AdminDashboard />;
    if (currentView === 'matches') return <MatchCenterView />;
    
    switch (currentView) {
      case 'profile': return (
        <div className="max-w-7xl mx-auto py-12 px-4 text-right">
           <AdDisplay html={ads.profile_top} />
           {user && (
             <div className="bg-slate-900 h-64 md:h-96 rounded-[3rem] relative overflow-hidden mb-16 shadow-2xl">
               <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>
               <div className="absolute -bottom-12 right-12 flex flex-col md:flex-row items-center gap-8 text-white">
                 <img src={user.logo_url} className="w-40 h-40 md:w-56 md:h-56 rounded-[3rem] border-8 border-white bg-white shadow-2xl object-cover" />
                 <div className="mb-14 text-center md:text-right">
                   <h2 className="text-4xl md:text-6xl font-black italic tracking-tighter">نادي {user.team_name}</h2>
                   <p className="text-blue-200 font-bold flex items-center gap-2 justify-center md:justify-end mt-2"><MapPin className="w-5 h-5" /> {user.municipality || user.region}</p>
                 </div>
               </div>
             </div>
           )}
        </div>
      );
      case 'hub': return (
        <div className="max-w-4xl mx-auto py-12 px-4 pb-24 text-right animate-in fade-in duration-500">
           <AdDisplay html={ads.hub_top} />
           <h2 className="text-4xl font-black mb-12 italic text-center">ملتقى الفرق</h2>
           <div className="space-y-8">
             {posts.map(post => (
               <div key={post.id} className="bg-white rounded-[2rem] shadow-xl border border-slate-100 p-8 text-right animate-in slide-in-from-bottom duration-500">
                  <div className="flex items-center gap-4 mb-6 justify-end">
                    <div className="text-right">
                       <h4 className="font-black text-lg text-slate-900">{post.teamName}</h4>
                       <p className="text-[10px] text-slate-400 font-black">تم النشر في {new Date(post.created_at.toDate()).toLocaleDateString('ar-DZ')}</p>
                    </div>
                    <img src={post.teamLogo} className="w-12 h-12 rounded-xl object-cover shadow-sm" />
                  </div>
                  <p className="text-slate-700 text-lg mb-6 leading-relaxed whitespace-pre-wrap">{post.content}</p>
                  {post.imageUrl && <img src={post.imageUrl} className="w-full rounded-[1.5rem] mb-6 shadow-sm object-cover max-h-[500px]" />}
               </div>
             ))}
           </div>
           <AdDisplay html={ads.hub_bottom} />
        </div>
      );
      case 'live': return (
        <div className="max-w-7xl mx-auto py-12 px-6 pb-24 text-right">
          <AdDisplay html={ads.live_top} />
          <h2 className="text-4xl font-black flex items-center gap-4 justify-end italic mb-12">قنوات البث المباشر <Radio className="text-red-600 animate-pulse" /></h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {liveChannels.map(ch => (
              <div key={ch.id} className="bg-white rounded-[2.5rem] p-6 shadow-xl border border-slate-100">
                <div className="h-56 w-full rounded-[2rem] overflow-hidden mb-6 relative"><img src={ch.thumbnail_url} className="w-full h-full object-cover" /></div>
                <h4 className="font-black text-xl mb-4 truncate">{ch.name}</h4>
                <button onClick={() => window.open(ch.stream_url, '_blank')} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black shadow-lg">شاهد الآن</button>
              </div>
            ))}
          </div>
        </div>
      );
      case 'draw': return <DrawView />;
      case 'login': return <LoginView />;
      case 'register': return <RegisterView />;
      case 'admin-login': return <AdminLoginView />;
      default: return (
        <>
          <HeroSection />
          <AdDisplay html={ads.home_hero_bottom} />
          <AdDisplay html={ads.after_draw} className="px-4" />
          <TeamsSection />
        </>
      );
    }
  };

  const HeroSection = () => (
    <section className="bg-slate-900 pt-32 pb-48 px-4 text-center text-white relative overflow-hidden">
       <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
       <div className="relative z-10 max-w-5xl mx-auto">
         <div className="inline-block px-6 py-2 bg-blue-600/20 backdrop-blur-md rounded-full text-blue-400 font-black text-xs uppercase mb-8 border border-blue-600/30">الموسم الرياضي 2024 / 2025</div>
         <h1 className="text-6xl md:text-9xl font-black mb-10 leading-[1.1] tracking-tighter italic animate-in slide-in-from-top duration-700">بوابة البطولة</h1>
         <p className="text-slate-400 text-2xl mb-16 font-light max-w-2xl mx-auto leading-relaxed italic px-4">إدارة الفرق، النتائج الحية، والبث المباشر. كن جزءاً من أضخم حدث رياضي رقمي.</p>
         <div className="flex flex-col md:flex-row justify-center gap-6 px-4">
           <button onClick={() => setCurrentView('register')} className="w-full md:w-auto px-14 py-6 bg-blue-600 rounded-[2rem] font-black text-xl shadow-2xl active:scale-95 transition-all">سجل فريقك</button>
           <button onClick={() => setCurrentView('matches')} className="w-full md:w-auto px-14 py-6 bg-white/10 rounded-[2rem] font-black text-xl border border-white/20 hover:bg-white/20 transition-all backdrop-blur-md flex items-center justify-center gap-2">مركز المباريات <Clock className="w-6 h-6" /></button>
         </div>
       </div>
    </section>
  );

  const TeamsSection = () => (
    <section className="py-32 px-4 bg-white relative">
      <div className="max-w-7xl mx-auto text-right">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-24 px-4">
          <div className="bg-slate-50 px-8 py-4 rounded-3xl border border-slate-100 font-black text-3xl text-blue-600">{allTeams.length} <span className="text-slate-400 text-lg">فريق</span></div>
          <h2 className="text-5xl font-black text-slate-900 flex items-center gap-5 italic justify-end">النخبة المشاركة <Users className="text-blue-600 w-12 h-12" /></h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-10">
          {allTeams.map(team => (
            <div key={team.id} className="text-center group animate-in zoom-in duration-500">
              <img src={team.logo_url} className="w-36 h-36 mx-auto rounded-[2.5rem] border-4 border-white shadow-xl group-hover:scale-110 transition-all duration-500 bg-white object-cover mb-6" />
              <p className="font-black text-slate-800 text-lg group-hover:text-blue-600 transition-colors truncate px-2">{team.team_name}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );

  const DrawView = () => {
    const [isDrawing, setIsDrawing] = useState(false);
    const [opponent, setOpponent] = useState<TeamRegistration | null>(null);
    const [shufflingIndex, setShufflingIndex] = useState(0);

    const startDraw = () => {
      if (allTeams.length <= 1) { alert("لا يوجد فرق كافية."); return; }
      setIsDrawing(true); setOpponent(null);
      const available = allTeams.filter(t => t.id !== user?.id);
      let count = 0;
      const interval = setInterval(() => {
        setShufflingIndex(Math.floor(Math.random() * available.length));
        count++;
        if (count > 20) { clearInterval(interval); setOpponent(available[Math.floor(Math.random() * available.length)]); setIsDrawing(false); }
      }, 100);
    };

    if (!user) return <div className="max-w-md mx-auto py-24 text-center"><button onClick={() => setCurrentView('login')} className="bg-blue-600 text-white px-10 py-4 rounded-xl font-black shadow-lg">دخول النادي لإجراء القرعة</button></div>;

    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center animate-in zoom-in duration-500">
        <h2 className="text-4xl md:text-5xl font-black italic mb-12">قرعة البطولة الآلية</h2>
        <div className="bg-white rounded-[3rem] p-16 shadow-2xl border border-slate-100 flex flex-col items-center justify-center min-h-[500px]">
          {!opponent && !isDrawing ? (
            <button onClick={startDraw} className="px-14 py-6 bg-blue-600 text-white rounded-[2rem] font-black text-2xl shadow-2xl active:scale-95 transition-all">ابدأ القرعة الآن</button>
          ) : (
            <div className="w-full flex items-center justify-around">
               <div className="text-center flex-1 animate-in slide-in-from-right duration-500"><img src={user.logo_url} className="w-32 h-32 mx-auto rounded-3xl mb-4 object-cover border-4 border-white shadow-xl" /><p className="font-black">{user.team_name}</p></div>
               <div className="text-6xl font-black text-slate-100 italic">VS</div>
               <div className="text-center flex-1 animate-in slide-in-from-left duration-500"><img src={isDrawing ? allTeams[shufflingIndex]?.logo_url : (opponent?.logo_url || '')} className="w-32 h-32 mx-auto rounded-3xl mb-4 object-cover border-4 border-white shadow-xl" /><p className="font-black">{isDrawing ? 'جاري السحب...' : (opponent?.team_name || '')}</p></div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const LoginView = () => (
    <div className="max-w-md mx-auto py-24 px-6 text-center">
       <div className="bg-white rounded-[3.5rem] p-12 shadow-2xl border border-slate-100">
          <div className="bg-blue-600 w-20 h-20 rounded-3xl mx-auto mb-8 flex items-center justify-center shadow-xl"><Trophy className="w-10 h-10 text-white" /></div>
          <h3 className="text-3xl font-black mb-10 italic">دخول النادي</h3>
          <form onSubmit={async (e) => { e.preventDefault(); const t = e.target as any; const { data, error } = await FirebaseService.loginTeam(t[0].value, t[1].value); if (error) alert(error); else { setUser(data); localStorage.setItem(SESSION_KEY, data.id!); setCurrentView('profile'); fetchData(true); } }} className="space-y-5">
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
          <h3 className="text-3xl font-black mb-10 italic text-slate-900">تسجيل فريق جديد</h3>
          <form onSubmit={async (e) => { e.preventDefault(); const t = e.target as any; const res = await FirebaseService.registerTeam({ team_name: t[0].value, coach_name: t[1].value, contact_email: t[2].value, password: t[3].value, region: t[4].value }); if (res.error) alert(res.error); else { alert('تم التسجيل بنجاح!'); setCurrentView('login'); fetchData(true); } }} className="space-y-4">
            <input placeholder="اسم الفريق" className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-right" />
            <input placeholder="اسم المدرب" className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-right" />
            <input type="email" placeholder="البريد الإلكتروني" className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-right" />
            <input type="password" placeholder="كلمة المرور" className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-right" />
            <input placeholder="الولاية / المنطقة" className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-right" />
            <button type="submit" className="w-full py-5 bg-slate-900 text-white font-black rounded-2xl shadow-xl hover:bg-black transition-all">إرسال طلب الانضمام</button>
          </form>
       </div>
    </div>
  );

  const AdminLoginView = () => (
    <div className="max-w-md mx-auto py-24 px-6 text-center">
      <div className="bg-slate-900 rounded-[3.5rem] p-12 shadow-2xl border border-slate-800 text-white animate-in zoom-in duration-500">
        <div className="bg-blue-600 w-20 h-20 rounded-3xl mx-auto mb-8 flex items-center justify-center rotate-3 shadow-xl"><ShieldAlert className="w-10 h-10" /></div>
        <h3 className="text-3xl font-black mb-10 italic">بوابة المشرف السرية</h3>
        <form onSubmit={async (e) => { e.preventDefault(); const t = e.target as any; if (t[0].value === ADMIN_CREDS.email && t[1].value === ADMIN_CREDS.pass) { setIsAdmin(true); localStorage.setItem(ADMIN_KEY, 'true'); setCurrentView('admin'); fetchData(true); } else alert("خطأ في البيانات السرية."); }} className="space-y-5">
          <input type="email" placeholder="البريد السري" className="w-full p-5 bg-slate-800 border border-slate-700 rounded-2xl outline-none font-bold text-right" />
          <input type="password" placeholder="كلمة المرور" className="w-full p-5 bg-slate-800 border border-slate-700 rounded-2xl outline-none font-bold text-right" />
          <button type="submit" className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl hover:bg-blue-700 transition-all">دخول لوحة التحكم</button>
        </form>
        <button onClick={() => { setCurrentView('home'); window.location.hash = ''; }} className="mt-8 text-slate-500 font-bold hover:text-white transition-colors">إلغاء</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen font-sans bg-[#fcfdfe]" dir="rtl">
      <nav className="bg-white/90 backdrop-blur-xl border-b border-slate-100 py-4 px-4 md:px-12 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3 font-black text-2xl cursor-pointer hover:scale-105 transition-transform" onClick={() => {setCurrentView('home'); window.location.hash = '';}}>
          <div className="bg-blue-600 p-2 rounded-2xl shadow-lg"><Trophy className="w-7 h-7 text-white" /></div>
          <span className="tracking-tighter italic hidden sm:inline text-slate-900">بوابة البطولة</span>
        </div>
        <div className="hidden lg:flex gap-12 text-[11px] font-black uppercase tracking-widest text-slate-400">
           <button onClick={() => setCurrentView('home')} className={`hover:text-blue-600 ${currentView === 'home' ? 'text-blue-600 font-black underline underline-offset-8 decoration-2' : ''}`}>الرئيسية</button>
           <button onClick={() => setCurrentView('matches')} className={`hover:text-blue-600 ${currentView === 'matches' ? 'text-blue-600 font-black underline underline-offset-8 decoration-2' : ''}`}>مركز المباريات</button>
           <button onClick={() => setCurrentView('hub')} className={`hover:text-blue-600 ${currentView === 'hub' ? 'text-blue-600 font-black underline underline-offset-8 decoration-2' : ''}`}>الملتقى</button>
           <button onClick={() => setCurrentView('draw')} className={`hover:text-blue-600 ${currentView === 'draw' ? 'text-blue-600 font-black underline underline-offset-8 decoration-2' : ''}`}>القرعة</button>
           <button onClick={() => setCurrentView('live')} className={`hover:text-blue-600 ${currentView === 'live' ? 'text-red-600 font-black' : ''}`}>مباشر</button>
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
                 <div className="absolute top-full left-0 mt-3 w-64 bg-white rounded-[2rem] shadow-2xl border border-slate-100 p-2 z-[100] text-right animate-in slide-in-from-top duration-300">
                   <button onClick={() => {setCurrentView('admin'); setIsUserMenuOpen(false);}} className="w-full flex items-center justify-end gap-3 p-4 hover:bg-slate-50 rounded-2xl transition-colors text-slate-600 font-bold">لوحة التحكم المركزية <Lock className="w-5 h-5" /></button>
                   <div className="mt-2 pt-2 border-t border-slate-50"><button onClick={handleLogout} className="w-full flex items-center justify-end gap-3 p-4 hover:bg-red-50 rounded-2xl transition-colors text-red-500 font-bold">خروج المسؤول <LogOut className="w-5 h-5" /></button></div>
                 </div>
               )}
             </div>
          ) : user ? (
            <div className="relative" ref={menuRef}>
              <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="flex items-center gap-4 p-1 pr-5 pl-1 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-white transition-all shadow-sm">
                <div className="text-right hidden sm:block"><p className="text-[9px] font-black text-slate-400 uppercase">ناديكم</p><p className="text-sm font-black truncate max-w-[120px] text-slate-900">{user.team_name}</p></div>
                <img src={user.logo_url} className="w-10 h-10 rounded-xl shadow-md border-2 border-white object-cover" />
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {isUserMenuOpen && (
                <div className="absolute top-full left-0 mt-3 w-64 bg-white rounded-[2rem] shadow-2xl border border-slate-100 p-2 z-[100] text-right animate-in slide-in-from-top duration-300">
                  <button onClick={() => {setCurrentView('profile'); setIsUserMenuOpen(false);}} className="w-full flex items-center justify-end gap-3 p-4 hover:bg-slate-50 rounded-2xl transition-colors text-slate-600 font-bold">بروفايل النادي <User className="w-5 h-5" /></button>
                  <div className="mt-2 pt-2 border-t border-slate-50"><button onClick={handleLogout} className="w-full flex items-center justify-end gap-3 p-4 hover:bg-red-50 rounded-2xl transition-colors text-red-500 font-bold">تسجيل الخروج <LogOut className="w-5 h-5" /></button></div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex gap-3">
              <button onClick={() => setCurrentView('login')} className="px-8 py-3 bg-slate-100 text-[12px] font-black rounded-xl transition-all uppercase text-slate-600 hover:bg-slate-200">دخول</button>
              <button onClick={() => setCurrentView('register')} className="px-8 py-3 bg-blue-600 text-white text-[12px] font-black rounded-xl shadow-lg hover:bg-blue-700 active:scale-95 transition-all">انضمام</button>
            </div>
          )}
        </div>
      </nav>

      <AdDisplay html={ads.under_header} />

      <main className="min-h-[80vh] relative">{renderContent()}</main>
      
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-4">
        <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 h-20 rounded-[2rem] shadow-2xl flex items-center justify-around px-4 text-slate-500">
           <button onClick={() => setCurrentView('home')} className={`flex flex-col items-center gap-1.5 transition-all ${currentView === 'home' ? 'text-blue-400' : 'hover:text-white'}`}><Home className="w-6 h-6" /><span className="text-[9px] font-black uppercase">الرئيسية</span></button>
           <button onClick={() => setCurrentView('matches')} className={`flex flex-col items-center gap-1.5 transition-all ${currentView === 'matches' ? 'text-blue-400' : 'hover:text-white'}`}><Clock className="w-6 h-6" /><span className="text-[9px] font-black uppercase">المباريات</span></button>
           <button onClick={() => setCurrentView('hub')} className={`flex flex-col items-center gap-1.5 transition-all ${currentView === 'hub' ? 'text-blue-400' : 'hover:text-white'}`}><Hash className="w-6 h-6" /><span className="text-[9px] font-black uppercase">الملتقى</span></button>
           <button onClick={() => setCurrentView('live')} className={`flex flex-col items-center gap-1.5 transition-all ${currentView === 'live' ? 'text-red-500' : 'hover:text-white'}`}><Radio className="w-6 h-6" /><span className="text-[9px] font-black uppercase">مباشر</span></button>
           {(user || isAdmin) && ( 
             <button onClick={() => setCurrentView(isAdmin ? 'admin' : 'profile')} className={`flex flex-col items-center gap-1.5 transition-all ${currentView === 'profile' || currentView === 'admin' ? 'text-blue-400' : 'hover:text-white'}`}>
               {isAdmin ? <Lock className="w-6 h-6" /> : <User className="w-6 h-6" />}
               <span className="text-[9px] font-black uppercase">{isAdmin ? 'إدارة' : 'نادينا'}</span>
             </button> 
           )}
        </div>
      </div>

      <footer className="bg-slate-900 text-slate-500 py-24 text-center relative overflow-hidden pb-40">
        <div className="max-w-4xl mx-auto px-6 relative z-10">
          <button onClick={handleSecretClick} className="focus:outline-none transition-all opacity-10 hover:opacity-100 hover:scale-110 mb-8"><Trophy className="w-16 h-16 text-blue-600" /></button>
          <h3 className="text-white font-black text-2xl mb-4 italic">بوابة البطولة الرقمية</h3>
          <p className="text-xs opacity-60 font-bold uppercase mb-12 tracking-widest">جميع الحقوق محفوظة &bull; 2024</p>
        </div>
      </footer>
    </div>
  );
}
