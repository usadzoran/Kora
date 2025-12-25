import React, { useState, useEffect } from 'react';
import { 
  Search, MapPin, Star, ChevronRight, ChevronLeft, 
  Home, Heart, Map as MapIcon, User, Bell, Share2, 
  Settings, Clock, Compass, Info, Navigation, Calendar,
  CheckCircle2, ArrowRight, LocateFixed, Bed, Building, Wifi
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ViewState, City, Place, Hotel } from './types';

// بيانات المدن والمعالم والفنادق
const CITIES_DATA: City[] = [
  { 
    id: '1', 
    name: 'دبي', 
    image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&q=80&w=400', 
    places: [
      { id: 'd1', name: 'برج خليفة', image: 'https://images.unsplash.com/photo-1526495124232-a04e1849168c?auto=format&fit=crop&q=80&w=400', rating: 4.8, description: 'أطول برج في العالم، أيقونة دبي المعمارية.', category: 'tourist', mapX: 75, mapY: 25 },
      { id: 'd2', name: 'دبي مارينا', image: 'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&q=80&w=400', rating: 4.7, price: '120$', description: 'منطقة حيوية تضم ناطحات سحاب ويخوت فاخرة.', category: 'featured', mapX: 25, mapY: 65 },
      { id: 'd3', name: 'برج العرب', image: 'https://images.unsplash.com/photo-1518684079-3c830dcef090?auto=format&fit=crop&q=80&w=400', rating: 4.9, price: '250$', description: 'أفخم فندق في العالم بتصميم الشراع المميز.', category: 'tourist', mapX: 45, mapY: 45 },
    ],
    hotels: [
      { id: 'h1', name: 'فندق العنوان سكاى فيو', image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=400', rating: 4.9, pricePerNight: '450$', description: 'إطلالة مذهلة على برج خليفة مع مسبح إنفينيتي.', mapX: 68, mapY: 30 },
      { id: 'h2', name: 'أتلانتس النخلة', image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&q=80&w=400', rating: 4.8, pricePerNight: '600$', description: 'منتجع متكامل على جزيرة النخلة يضم حديقة مائية.', mapX: 15, mapY: 40 }
    ]
  },
  { 
    id: '4', 
    name: 'تونس', 
    image: 'https://images.unsplash.com/photo-1559586653-909780006296?auto=format&fit=crop&q=80&w=400', 
    places: [
      { id: 't1', name: 'سيدي بوسعيد', image: 'https://images.unsplash.com/photo-1555526153-6a9876e58f00?auto=format&fit=crop&q=80&w=400', rating: 4.9, description: 'القرية الزرقاء والبيضاء الساحرة المطلة على البحر المتوسط.', category: 'tourist', mapX: 60, mapY: 20 },
      { id: 't2', name: 'مسرح الجم', image: 'https://images.unsplash.com/photo-1582234053303-3889158525b3?auto=format&fit=crop&q=80&w=400', rating: 4.8, price: '10$', description: 'ثالث أكبر مدرج روماني في العالم، تحفة معمارية تاريخية.', category: 'featured', mapX: 50, mapY: 70 },
      { id: 't3', name: 'قرطاج الأثرية', image: 'https://images.unsplash.com/photo-1548135804-b99787265103?auto=format&fit=crop&q=80&w=400', rating: 4.7, price: '8$', description: 'عاصمة الإمبراطورية القرطاجية القديمة ومعالمها التاريخية.', category: 'tourist', mapX: 65, mapY: 25 },
    ],
    hotels: [
      { id: 'h_t1', name: 'لا باديرا الحمامات', image: 'https://images.unsplash.com/photo-1544124499-58912cbddaad?auto=format&fit=crop&q=80&w=400', rating: 4.9, pricePerNight: '220$', description: 'إقامة فاخرة وهادئة في الحمامات مع إطلالة بحرية بانورامية.', mapX: 75, mapY: 45 },
      { id: 'h_t2', name: 'موفنبيك سوسة', image: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&q=80&w=400', rating: 4.7, pricePerNight: '150$', description: 'منتجع عائلي مميز على شاطئ سوسة الخلاب.', mapX: 55, mapY: 55 }
    ]
  },
  { 
    id: '2', 
    name: 'باريس', 
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&q=80&w=400', 
    places: [
      { id: 'p1', name: 'برج إيفل', image: 'https://images.unsplash.com/photo-1543349689-9a4d426bee8e?auto=format&fit=crop&q=80&w=400', rating: 4.9, description: 'رمز فرنسا الأشهر في قلب باريس.', category: 'tourist', mapX: 30, mapY: 30 },
      { id: 'p2', name: 'متحف اللوفر', image: 'https://images.unsplash.com/photo-1550106422-990818290279?auto=format&fit=crop&q=80&w=400', rating: 4.7, price: '20$', description: 'أكبر متحف فني في العالم.', category: 'featured', mapX: 65, mapY: 40 },
      { id: 'p3', name: 'قوس النصر', image: 'https://images.unsplash.com/photo-1509439581779-6298f75bf6e5?auto=format&fit=crop&q=80&w=400', rating: 4.6, price: '12$', description: 'معلم تاريخي يخلد انتصارات فرنسا.', category: 'tourist', mapX: 45, mapY: 20 },
    ],
    hotels: [
      { id: 'h3', name: 'فندق ريتز باريس', image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=400', rating: 4.9, pricePerNight: '900$', description: 'عنوان الفخامة الكلاسيكية في قلب باريس.', mapX: 55, mapY: 35 },
      { id: 'h4', name: 'شانغريلا باريس', image: 'https://images.unsplash.com/photo-1551882547-ff43c63be5c2?auto=format&fit=crop&q=80&w=400', rating: 4.8, pricePerNight: '750$', description: 'إقامة ملكية مع إطلالات مباشرة على البرج.', mapX: 35, mapY: 45 }
    ]
  },
  { 
    id: '3', 
    name: 'روما', 
    image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&q=80&w=400', 
    places: [
      { id: 'r1', name: 'الكولوسيوم', image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&q=80&w=400', rating: 4.8, description: 'المدرج الروماني العملاق في قلب روما.', category: 'tourist', mapX: 55, mapY: 55 },
      { id: 'r2', name: 'نافورة تريفي', image: 'https://images.unsplash.com/photo-1525874684015-58379d421a52?auto=format&fit=crop&q=80&w=400', rating: 4.9, description: 'أجمل النوافورات الباروكية في العالم.', category: 'featured', mapX: 50, mapY: 35 },
      { id: 'r3', name: 'متحف الفاتيكان', image: 'https://images.unsplash.com/photo-1531572753322-ad063cecc140?auto=format&fit=crop&q=80&w=400', rating: 4.8, price: '25$', description: 'يضم كنوزاً فنية وتاريخية لا تقدر بثمن.', category: 'tourist', mapX: 25, mapY: 25 },
    ],
    hotels: [
      { id: 'h5', name: 'فندق هاسلر روما', image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=400', rating: 4.9, pricePerNight: '550$', description: 'يقع فوق السلالم الإسبانية الشهيرة.', mapX: 52, mapY: 30 },
      { id: 'h6', name: 'فندق إنديجو روما', image: 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&q=80&w=400', rating: 4.7, pricePerNight: '320$', description: 'تصميم عصري في حي تاريخي عريق.', mapX: 45, mapY: 50 }
    ]
  },
];

const USER_LOC = { x: 15, y: 85 };

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('home');
  const [selectedCity, setSelectedCity] = useState<City>(CITIES_DATA[0]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [navTarget, setNavTarget] = useState<Place | Hotel | null>(null);

  const renderHome = () => (
    <div className="flex flex-col h-full bg-slate-50 overflow-y-auto hide-scrollbar pb-24">
      <div className="p-6 flex justify-between items-center bg-white border-b">
        <div className="bg-slate-100 p-2 rounded-xl"><Bell className="w-6 h-6 text-slate-600" /></div>
        <h1 className="text-xl font-black text-blue-600">دليلك السياحي</h1>
        <div className="bg-slate-100 p-2 rounded-xl"><Share2 className="w-6 h-6 text-slate-600" /></div>
      </div>

      <div className="p-6">
        <div className="relative">
          <input 
            type="text" 
            placeholder="ابحث عن وجهتك..." 
            className="w-full bg-white border border-slate-200 py-4 px-12 rounded-2xl text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          />
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
        </div>
      </div>

      <div className="px-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-black text-slate-800">استكشاف المدن</h2>
          <button className="text-blue-600 text-sm font-bold">رؤية المزيد</button>
        </div>
        <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-4">
          {CITIES_DATA.map(city => (
            <div 
              key={city.id} 
              onClick={() => { setSelectedCity(city); setView('city'); setNavTarget(null); }}
              className="relative min-w-[140px] h-[180px] rounded-3xl overflow-hidden shadow-md cursor-pointer group"
            >
              <img src={city.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                <span className="text-white font-black">{city.name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-6 mt-4">
        <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center">
            <Compass className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h3 className="font-black text-slate-800">خطة رحلة مقترحة</h3>
            <p className="text-slate-400 text-sm">استكشف {selectedCity.name} في 3 أيام</p>
          </div>
          <ChevronLeft className="mr-auto text-slate-300" />
        </div>
      </div>

      <div className="p-6 mt-auto">
        <button 
          onClick={() => { setView('map'); setNavTarget(null); }}
          className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-lg shadow-lg shadow-blue-200 active:scale-95 transition-all"
        >
          اختار لي رحلة
        </button>
      </div>
    </div>
  );

  const renderCity = () => (
    <div className="flex flex-col h-full bg-slate-50 overflow-y-auto hide-scrollbar pb-24">
      <div className="relative h-[400px]">
        <img src={selectedCity.image} className="w-full h-full object-cover" />
        <div className="absolute top-6 left-6 right-6 flex justify-between items-center">
          <button onClick={() => setView('home')} className="bg-white/20 backdrop-blur-md p-3 rounded-2xl text-white"><ChevronRight className="w-6 h-6" /></button>
          <button className="bg-white/20 backdrop-blur-md p-3 rounded-2xl text-white"><Heart className="w-6 h-6" /></button>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-50 via-transparent to-transparent"></div>
        <div className="absolute bottom-10 right-6">
          <h1 className="text-6xl font-black text-slate-800 tracking-tighter">{selectedCity.name}</h1>
        </div>
      </div>

      {/* أماكن سياحية */}
      <div className="px-6 -mt-4 relative z-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-black text-slate-800">أهم الأماكن السياحية</h2>
          <button onClick={() => setView('itinerary')} className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-xs font-black shadow-sm flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            خطط لرحلتك
          </button>
        </div>
        <div className="flex gap-4 overflow-x-auto hide-scrollbar">
          {selectedCity.places.map(place => (
            <div 
              key={place.id} 
              onClick={() => { setSelectedPlace(place); setView('place'); }}
              className="bg-white min-w-[180px] rounded-3xl overflow-hidden shadow-sm border border-slate-100 cursor-pointer"
            >
              <img src={place.image} className="w-full h-32 object-cover" />
              <div className="p-4">
                <h3 className="font-black text-slate-800 text-sm mb-1">{place.name}</h3>
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <Star className="w-3 h-3 text-amber-400 fill-current" />
                  <span>{place.rating}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* فنادق مقترحة */}
      <div className="px-6 mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-black text-slate-800">أماكن إقامة موصى بها</h2>
          <span className="text-blue-600 text-xs font-bold">فنادق متميزة</span>
        </div>
        <div className="space-y-4">
          {selectedCity.hotels.map(hotel => (
            <div 
              key={hotel.id} 
              onClick={() => { setNavTarget(hotel); setView('map'); }}
              className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4 cursor-pointer hover:border-blue-200 transition-colors"
            >
              <img src={hotel.image} className="w-24 h-24 rounded-2xl object-cover" />
              <div className="flex-1">
                <div className="flex items-center gap-1 mb-1">
                  <Star className="w-3 h-3 text-amber-400 fill-current" />
                  <span className="text-xs font-black text-slate-700">{hotel.rating}</span>
                </div>
                <h3 className="font-black text-slate-800 leading-tight">{hotel.name}</h3>
                <div className="flex items-center gap-2 mt-2">
                   <Wifi className="w-3 h-3 text-blue-500" />
                   <Bed className="w-3 h-3 text-blue-500" />
                   <span className="text-[10px] text-slate-400">مرافق كاملة</span>
                </div>
              </div>
              <div className="text-left">
                <div className="text-blue-600 font-black text-lg">{hotel.pricePerNight}</div>
                <div className="text-[10px] text-slate-400 uppercase font-bold">لليلة</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 mt-4 flex flex-col gap-3">
        <button onClick={() => setView('itinerary')} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-xl">
          <Calendar className="w-6 h-6" />
          إنشاء جدول رحلة مقترح
        </button>
      </div>
    </div>
  );

  const renderPlace = () => (
    <div className="flex flex-col h-full bg-white overflow-y-auto hide-scrollbar pb-24">
      <div className="relative h-[450px]">
        <img src={selectedPlace?.image} className="w-full h-full object-cover" />
        <div className="absolute top-6 left-6 right-6 flex justify-between items-center">
          <button onClick={() => setView('city')} className="bg-white p-3 rounded-2xl text-slate-800 shadow-xl"><ChevronRight className="w-6 h-6" /></button>
          <button className="bg-white p-3 rounded-2xl text-slate-800 shadow-xl"><Heart className="w-6 h-6" /></button>
        </div>
      </div>

      <div className="p-8 -mt-10 bg-white rounded-t-[40px] relative z-10">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-black text-slate-800">{selectedPlace?.name}</h1>
          <div className="flex items-center gap-2 bg-amber-50 px-4 py-2 rounded-xl text-amber-600 font-bold">
            <Star className="w-5 h-5 fill-current" />
            <span>{selectedPlace?.rating}</span>
          </div>
        </div>

        <p className="text-slate-500 leading-relaxed text-lg mb-8">
          {selectedPlace?.description}
        </p>

        <button 
          onClick={() => {
            if (selectedPlace) setNavTarget(selectedPlace);
            setView('map');
          }}
          className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3"
        >
          <Navigation className="w-6 h-6" />
          ارسم لي الطريق
        </button>
      </div>
    </div>
  );

  const renderItinerary = () => (
    <div className="flex flex-col h-full bg-slate-50 overflow-y-auto hide-scrollbar pb-24">
      <div className="p-6 bg-white border-b sticky top-0 z-50 flex items-center justify-between">
        <button onClick={() => setView('city')} className="p-2 rounded-xl bg-slate-50 text-slate-600"><ChevronRight className="w-6 h-6" /></button>
        <h2 className="text-xl font-black text-slate-800">رحلة {selectedCity.name}</h2>
        <div className="w-10"></div>
      </div>

      <div className="px-8 mt-6">
        <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2">
          <Bed className="text-blue-600 w-5 h-5" />
          الإقامة المقترحة
        </h3>
        <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
           <img src={selectedCity.hotels[0].image} className="w-16 h-16 rounded-2xl object-cover" />
           <div>
              <h4 className="font-black text-slate-800 text-sm">{selectedCity.hotels[0].name}</h4>
              <p className="text-slate-400 text-xs mt-1">إقامة ممتازة بالقرب من المعالم</p>
           </div>
        </div>
      </div>

      <div className="px-8 mt-10 relative">
        <div className="absolute top-0 right-10 bottom-0 w-1 bg-slate-200 rounded-full"></div>
        <div className="space-y-12 relative">
          {selectedCity.places.map((place, i) => (
            <div key={place.id} className="relative pr-10">
              <div className="absolute top-2 right-0 -mr-2.5 w-6 h-6 bg-white border-4 border-blue-600 rounded-full z-10"></div>
              <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4 cursor-pointer" onClick={() => { setSelectedPlace(place); setView('place'); }}>
                <img src={place.image} className="w-20 h-20 rounded-2xl object-cover" />
                <div className="flex-1">
                  <h4 className="font-black text-slate-800">{place.name}</h4>
                  <p className="text-slate-400 text-xs mt-1">زيارة تستغرق 2 ساعة</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 mt-8">
        <div className="bg-slate-900 rounded-[32px] p-8 text-white">
          <h3 className="text-xl font-black mb-2">جاهز للانطلاق؟</h3>
          <p className="text-slate-400 text-sm mb-6">لقد صممنا لك أفضل مسار يربط بين فندقك وأهم المعالم.</p>
          <button 
            onClick={() => { setView('map'); setNavTarget(null); }}
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-black flex items-center justify-center gap-2"
          >
            فتح الملاحة
            <Navigation className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  const renderMap = () => (
    <div className="flex flex-col h-full bg-slate-100">
      <div className="relative flex-1 overflow-hidden">
        <div className="absolute inset-0 bg-[#f8f5f1] overflow-hidden" style={{ 
          backgroundImage: 'radial-gradient(#ddd 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}>
          {/* مسار الملاحة */}
          {navTarget && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
              <motion.path 
                d={`M ${USER_LOC.x} ${USER_LOC.y} Q ${(USER_LOC.x + navTarget.mapX)/2} ${(USER_LOC.y + navTarget.mapY)/2 - 10}, ${navTarget.mapX} ${navTarget.mapY}`} 
                stroke={('pricePerNight' in navTarget) ? "#8b5cf6" : "#3b82f6"} 
                strokeWidth="0.8" 
                fill="none" 
                strokeDasharray="2, 2"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5 }}
              />
            </svg>
          )}

          {/* المعالم السياحية (دبابيس حمراء) */}
          {selectedCity.places.map((place) => (
            <div 
              key={place.id}
              className="absolute flex flex-col items-center cursor-pointer z-10"
              style={{ top: `${place.mapY}%`, left: `${place.mapX}%`, transform: 'translate(-50%, -100%)' }}
              onClick={() => setNavTarget(place)}
            >
              <div className={`p-1 rounded-full bg-white shadow-md border-2 ${navTarget?.id === place.id ? 'border-blue-600 scale-125' : 'border-slate-100'} transition-all`}>
                <MapPin className={`${navTarget?.id === place.id ? 'text-blue-600' : 'text-red-500'} w-5 h-5`} fill="currentColor" />
              </div>
            </div>
          ))}

          {/* الفنادق (دبابيس بنفسجية بأيقونة سرير) */}
          {selectedCity.hotels.map((hotel) => (
            <div 
              key={hotel.id}
              className="absolute flex flex-col items-center cursor-pointer z-10"
              style={{ top: `${hotel.mapY}%`, left: `${hotel.mapX}%`, transform: 'translate(-50%, -100%)' }}
              onClick={() => setNavTarget(hotel)}
            >
              <div className={`p-1.5 rounded-full bg-white shadow-md border-2 ${navTarget?.id === hotel.id ? 'border-purple-600 scale-125' : 'border-purple-100'} transition-all`}>
                <Bed className={`${navTarget?.id === hotel.id ? 'text-purple-600' : 'text-purple-400'} w-5 h-5`} />
              </div>
            </div>
          ))}

          {/* موقع المستخدم */}
          <div className="absolute" style={{ top: `${USER_LOC.y}%`, left: `${USER_LOC.x}%`, transform: 'translate(-50%, -50%)' }}>
            <div className="relative bg-blue-600 p-2 rounded-full border-4 border-white shadow-xl">
              <LocateFixed className="text-white w-4 h-4" />
            </div>
          </div>
        </div>

        {/* لوحة التحكم العلوية */}
        <div className="absolute top-6 left-6 right-6 flex justify-between items-center">
          <button onClick={() => setView('city')} className="bg-white p-3 rounded-2xl text-slate-800 shadow-xl"><ChevronRight className="w-6 h-6" /></button>
          <div className="bg-white px-6 py-3 rounded-2xl shadow-xl font-black text-slate-800 flex items-center gap-2">
            <MapIcon className="w-4 h-4 text-blue-600" />
            خارطة الاستكشاف
          </div>
          <button className="bg-white p-3 rounded-2xl text-slate-800 shadow-xl"><LocateFixed className="w-6 h-6 text-blue-600" /></button>
        </div>

        {/* تفاصيل الوجهة المختارة */}
        <div className="absolute bottom-6 left-6 right-6">
          <AnimatePresence>
            {navTarget && (
              <motion.div 
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="bg-white p-6 rounded-[32px] shadow-2xl border border-slate-100"
              >
                 <div className="flex items-center gap-4 mb-4">
                    <img src={navTarget.image} className="w-16 h-16 rounded-2xl object-cover" />
                    <div className="flex-1">
                       <h3 className="font-black text-slate-800">{navTarget.name}</h3>
                       <p className="text-slate-400 text-xs">
                         {('pricePerNight' in navTarget) ? 'فندق موصى به' : 'معلم سياحي رئيسي'}
                       </p>
                    </div>
                    <div className="bg-blue-50 px-3 py-1 rounded-lg text-blue-600 text-xs font-black">
                       {('pricePerNight' in navTarget) ? navTarget.pricePerNight : 'مفتوح'}
                    </div>
                 </div>
                 <button className="w-full bg-blue-600 text-white py-4 rounded-xl font-black flex items-center justify-center gap-2">
                   بدء الملاحة الحية
                   <Navigation className="w-4 h-4" />
                 </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );

  return (
    <div className="phone-frame">
      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="h-full"
        >
          {view === 'home' && renderHome()}
          {view === 'city' && renderCity()}
          {view === 'place' && renderPlace()}
          {view === 'map' && renderMap()}
          {view === 'itinerary' && renderItinerary()}
          {view === 'profile' && renderProfile() /* RenderProfile existing from previous context */}
        </motion.div>
      </AnimatePresence>

      <div className="absolute bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-100 px-8 py-4 flex justify-between items-center z-50">
        <button onClick={() => setView('home')} className={`p-3 rounded-2xl ${view === 'home' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>
          <Home className="w-6 h-6" />
        </button>
        <button onClick={() => setView('itinerary')} className={`p-3 rounded-2xl ${view === 'itinerary' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>
          <Calendar className="w-6 h-6" />
        </button>
        <button onClick={() => { setView('map'); setNavTarget(null); }} className={`p-3 rounded-2xl ${view === 'map' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>
          <MapIcon className="w-6 h-6" />
        </button>
        <button onClick={() => setView('profile' as ViewState)} className={`p-3 rounded-2xl ${view === 'profile' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>
          <User className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

// Profile rendering logic (Simplified for space)
const renderProfile = () => (
  <div className="flex flex-col h-full bg-white overflow-y-auto hide-scrollbar pb-24">
    <div className="bg-blue-600 pt-16 pb-24 px-8 text-white rounded-b-[60px] relative">
      <div className="flex items-center gap-6">
        <Building className="w-16 h-16 opacity-50" />
        <div>
          <h1 className="text-2xl font-black">حساب السائح</h1>
          <p className="text-blue-100">مرحباً بك في رحلتك القادمة</p>
        </div>
      </div>
    </div>
    <div className="p-8 space-y-4">
       <div className="bg-slate-50 p-6 rounded-3xl flex justify-between items-center">
          <span className="font-bold">الإعدادات</span>
          <Settings className="text-slate-400" />
       </div>
    </div>
  </div>
);

export default App;