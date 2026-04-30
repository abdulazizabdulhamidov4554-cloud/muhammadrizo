import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Car, 
  Clock, 
  CreditCard, 
  Star,
  User,
  Users,
  Truck,
  Zap,
  Mic,
  MicOff,
  Menu,
  X,
  Navigation,
  ChevronRight,
  Maximize,
  Minimize,
  MessageSquare,
  Phone
} from 'lucide-react';
import L from 'leaflet';

const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [24, 36],
    iconAnchor: [12, 36]
});
L.Marker.prototype.options.icon = DefaultIcon;

const ServiceCard = ({ 
  type, 
  label, 
  price, 
  time, 
  eta,
  active, 
  onClick 
}: { 
  type: string, 
  label: string, 
  price: string, 
  time: string, 
  eta?: string,
  active: boolean, 
  onClick: () => void 
}) => {
  const getIcon = () => {
    switch(type) {
      case 'economy': return <Car size={16} />;
      case 'comfort': return <Star size={16} />;
      case 'business': return <User size={16} />;
      case 'minivan': return <Users size={16} />;
      case 'cargo': return <Truck size={16} />;
      default: return <Car size={16} />;
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`relative flex flex-col items-start justify-between p-4 rounded-2xl border-2 transition-all duration-300 min-w-[135px] h-[110px] shrink-0 ${
        active 
          ? 'bg-zinc-950 text-white border-zinc-950 shadow-lg' 
          : 'bg-white text-zinc-400 border-zinc-100 hover:border-zinc-300'
      }`}
    >
      <div className="flex justify-between w-full items-start">
        <span className="text-[10px] font-black uppercase tracking-wider text-left">{label}</span>
        <div className={`${active ? 'text-[#FFD600]' : 'text-zinc-200'}`}>
          {getIcon()}
        </div>
      </div>
      <div className="flex flex-col items-start">
        <span className={`text-xl font-black leading-none ${active ? 'text-white' : 'text-zinc-900'}`}>{price}k</span>
        <div className="flex items-center gap-1.5 mt-1">
          <span className={`text-[9px] uppercase font-bold ${active ? 'opacity-40' : 'text-zinc-400'}`}>
            {time} min
          </span>
          {eta && (
            <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${active ? 'bg-[#FFD600] text-black' : 'bg-zinc-100 text-zinc-500'}`}>
              {eta} gacha
            </span>
          )}
        </div>
      </div>
    </motion.button>
  );
};

export default function App() {
  const [pickup, setPickup] = useState('Uychi ko\'chasi, Namangan');
  const [destination, setDestination] = useState('');
  const [activeTier, setActiveTier] = useState('economy');
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderStep, setOrderStep] = useState(0); 
  const [pos, setPos] = useState<[number, number]>([40.9983, 71.6726]);
  const [destPos, setDestPos] = useState<[number, number] | null>(null);
  const [activeTab, setActiveTab] = useState('rides');
  const [paymentMethod, setPaymentMethod] = useState('VISA');
  const [zoom, setZoom] = useState(13);
  const [trafficFactor, setTrafficFactor] = useState(1.0);
  const [trafficStatus, setTrafficStatus] = useState('O\'rta');
  const [showError, setShowError] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0); 
  const [isPromoInputVisible, setIsPromoInputVisible] = useState(false);
  const [carColor, setCarColor] = useState('#FFD600');
  const [carModel, setCarModel] = useState('sedan');
  const [isListening, setIsListening] = useState(false);
  const [showUI, setShowUI] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedHistoryRide, setSelectedHistoryRide] = useState<any>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeDriverPhone, setActiveDriverPhone] = useState('+998901234567');
  const recognitionRef = useRef<any>(null);

  const historyRides = [
    { 
      id: 1,
      from: 'Aeroport', 
      to: 'Markaziy Park', 
      cost: '22,400', 
      date: 'Kecha, 14:20', 
      type: 'Komfort',
      driver: { name: 'Javohir', rating: 4.9, car: 'Chevrolet Gentra', color: 'Oq', phone: '+998905553322' },
      breakdown: { base: '5,000', dist: '14,200', wait: '3,200', promo: '0' },
      duration: '18 min',
      distance: '8.4 km',
      coords: [[41.0016, 71.6726], [41.0116, 71.6826]]
    },
    { 
      id: 2,
      from: 'Uychi ko\'chasi', 
      to: 'Sardoba', 
      cost: '12,000', 
      date: '12-Apr, 09:15', 
      type: 'Ekonom',
      driver: { name: 'Alisher', rating: 4.7, car: 'Chevrolet Nexia 3', color: 'Kulrang', phone: '+998937775522' },
      breakdown: { base: '4,000', dist: '8,000', wait: '0', promo: '0' },
      duration: '12 min',
      distance: '4.2 km',
      coords: [[40.9916, 71.6626], [41.0116, 71.6726]]
    },
    { 
      id: 3,
      from: 'Chorsu', 
      to: 'Namangan City', 
      cost: '36,000', 
      date: '10-Apr, 18:45', 
      type: 'Biznes',
      driver: { name: 'Sanjar', rating: 5.0, car: 'Chevrolet Malibu 2', color: 'Qora', phone: '+998974441188' },
      breakdown: { base: '10,000', dist: '25,000', wait: '10,000', promo: '9,000' },
      duration: '25 min',
      distance: '12.1 km',
      coords: [[41.0216, 71.6926], [41.0516, 71.7226]]
    },
  ];

  // Calculate distance in km
  const getDistance = (p1: [number, number], p2: [number, number] | null) => {
    if (!p2) return 0;
    const R = 6371; 
    const dLat = (p2[0] - p1[0]) * Math.PI / 180;
    const dLon = (p2[1] - p1[1]) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(p1[0] * Math.PI / 180) * Math.cos(p2[0] * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const travelDistance = getDistance(pos, destPos);

  const getETA = (pickupMinutes: number) => {
    // Travel time estimate: ~2 min per km in city, adjusted by traffic
    const travelMinutes = travelDistance * 2.5 * trafficFactor;
    const totalMinutes = pickupMinutes + travelMinutes;
    
    const now = new Date();
    now.setMinutes(now.getMinutes() + totalMinutes);
    return now.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
  };

  const toggleVoiceCommand = () => {
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Sizning brauzeringiz ovozli buyruqlarni qo'llab-quvvatlamaydi.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = 'uz-UZ';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };
    recognition.onerror = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      console.log('Voice transcript:', transcript);

      // Natural language parsing for Uzbek
      // Pattern 1: [Pickup]dan [Destination]ga
      const fromToMatch = transcript.match(/(.+?)\s*dan\s+(.+?)\s*[gk]a/);
      if (fromToMatch) {
        setPickup(fromToMatch[1].trim());
        setDestination(fromToMatch[2].trim());
      } else {
        // Pattern 2: [Destination]ga [Pickup]dan
        const toFromMatch = transcript.match(/(.+?)\s*[gk]a\s+(.+?)\s*dan/);
        if (toFromMatch) {
          setDestination(toFromMatch[1].trim());
          setPickup(toFromMatch[2].trim());
        } else {
          // Individual extracts if combined patterns fail
          const pickupMatch = transcript.match(/(.+?)\s*dan/);
          const destMatch = transcript.match(/(.+?)\s*[gk]a/);
          
          if (destMatch && !pickupMatch) {
            // Only destination specified: e.g. "Aeroportga boramiz"
            setPickup("Hozirgi joylashuv");
            setDestination(destMatch[1].trim());
          } else {
            if (pickupMatch) setPickup(pickupMatch[1].trim());
            if (destMatch) setDestination(destMatch[1].trim());
          }
        }
      }

      // Handle specific commands
      if (transcript.includes('meni') && transcript.includes('dan olib ket')) {
        const takeMeMatch = transcript.match(/meni\s+(.+?)\s*dan/);
        if (takeMeMatch) setPickup(takeMeMatch[1].trim());
      }

      // Tier selection
      const tiers = [
        { key: 'economy', keywords: ['ekonom', 'arzon'] },
        { key: 'comfort', keywords: ['komfort', 'qulay'] },
        { key: 'business', keywords: ['biznes', 'qimmat', 'lyuks'] },
        { key: 'minivan', keywords: ['miniven', 'katta', 'ko\'p'] },
        { key: 'cargo', keywords: ['yuk', 'gruzovoy'] }
      ];

      tiers.forEach(t => {
        if (t.keywords.some(kw => transcript.includes(kw))) {
          setActiveTier(t.key);
        }
      });

      // Auto order phrases
      if (transcript.includes('buyurtma') || transcript.includes('taksi chaqir') || transcript.includes('boramiz')) {
        if (destination || transcript.includes('ga')) {
          setTimeout(handleOrder, 1200);
        }
      }
    };

    recognition.start();
  };

  // Generate random mock drivers around Namangan center
  const [drivers] = useState(() => {
    return Array.from({ length: 25 }).map((_, i) => ({
      id: i,
      position: [
        40.9983 + (Math.random() - 0.5) * 0.05,
        71.6726 + (Math.random() - 0.5) * 0.05
      ] as [number, number],
      rotation: Math.random() * 360
    }));
  });

  const carColors = [
    { name: 'Sariq', value: '#FFD600' },
    { name: 'Oq', value: '#FFFFFF' },
    { name: 'Qora', value: '#121212' },
    { name: 'Qizil', value: '#ff4b4b' }
  ];

  const carModels = [
    { id: 'sedan', name: 'Sedan', icon: <Car size={14} /> },
    { id: 'suv', name: 'SUV', icon: <Truck size={14} /> },
    { id: 'electric', name: 'Elektr', icon: <Zap size={14} /> }
  ];

  const createTaxiIcon = (color: string, rotation: number, model: string) => {
    let iconSvg = '';
    const strokeColor = color === '#FFFFFF' || color === '#FFD600' ? 'black' : 'white';

    if (model === 'suv') {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${strokeColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-5h-7v6h4Z"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>`;
    } else if (model === 'electric') {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${strokeColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M13 14h.01"/><path d="M16 14h.01"/><path d="M10 14h.01"/><path d="M12 18l-2 3h4l-2 3"/></svg>`;
    } else {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${strokeColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>`;
    }

    return L.divIcon({
      className: 'custom-taxi-icon',
      html: `
        <div style="transform: rotate(${rotation}deg); background: ${color}; border: 2px solid ${color === '#FFFFFF' ? '#e2e8f0' : 'rgba(255,255,255,0.2)'}; padding: 6px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); display: flex; align-items: center; justify-content: center;">
          ${iconSvg}
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });
  };

  const applyPromo = () => {
    if (promoCode.toUpperCase() === 'RM2026' || promoCode.toUpperCase() === 'TAXINAM') {
      setDiscount(0.2);
      setIsPromoInputVisible(false);
      alert('Promo-kod muvaffaqiyatli qo\'llanildi! 20% chegirma.');
    } else {
      alert('Noto\'g\'ri promo-kod');
    }
  };

  const getPrice = (base: string) => {
    const val = parseFloat(base);
    if (discount > 0) {
      return (val * (1 - discount)).toFixed(1);
    }
    return base;
  };

  useEffect(() => {
    if (!destination.trim() || destination.length < 3) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(destination)}&addressdetails=1&limit=5&bounded=1&viewbox=71.50,41.10,71.85,40.90`);
        const data = await res.json();
        setSuggestions(data);
      } catch (e) {
        console.error('Search error:', e);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [destination]);

  const selectLocation = (loc: any) => {
    const newDestPos: [number, number] = [parseFloat(loc.lat), parseFloat(loc.lon)];
    setDestination(loc.display_name);
    setDestPos(newDestPos);
    setZoom(14);
    setSuggestions([]);
  };

  function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
    const map = useMap();
    useEffect(() => {
      map.setView(center, zoom);
    }, [center, zoom, map]);
    return null;
  }

  function MapBoundsHandler({ ride }: { ride: any }) {
    const map = useMap();
    useEffect(() => {
      if (ride && ride.coords && ride.coords.length > 1) {
        const bounds = L.latLngBounds(ride.coords as [number, number][]);
        map.fitBounds(bounds, { padding: [80, 80], maxZoom: 15 });
      }
    }, [ride, map]);
    return null;
  }

  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate traffic fluctuations every 5 seconds
      const jitter = 0.8 + Math.random() * 0.7; // Factor between 0.8 and 1.5
      setTrafficFactor(jitter);
      
      if (jitter < 1.0) setTrafficStatus('Erkin yo\'l');
      else if (jitter < 1.3) setTrafficStatus('O\'rtacha tirbandlik');
      else setTrafficStatus('Katta tirbandlik');
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((p) => {
        setPos([p.coords.latitude, p.coords.longitude]);
      });
    }
  }, []);

  const handleOrder = () => {
    if (!destination.trim()) {
      setShowError(true);
      return;
    }

    // Generate random phone number for the new driver
    const prefixes = ['90', '91', '93', '94', '95', '97', '98', '99', '88', '77'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const num = Math.floor(1000000 + Math.random() * 9000000);
    setActiveDriverPhone(`+998${prefix}${num}`);

    setShowError(false);
    setIsOrdering(true);
    setOrderStep(2);
    
    // Simulate searching
    setTimeout(() => {
      setOrderStep(3);
    }, 3000);
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 1, 18));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 1, 3));

  const togglePayment = () => {
    const methods = ['VISA', 'Naqd', 'UzCard'];
    const nextIdx = (methods.indexOf(paymentMethod) + 1) % methods.length;
    setPaymentMethod(methods[nextIdx]);
  };

  return (
    <div className="relative h-screen w-full bg-[#F2F2F2] flex flex-row select-none overflow-hidden font-sans text-zinc-900">
      
      {/* Left Navigation Rail */}
      <nav className={`${isFullscreen ? 'hidden' : 'w-24'} bg-zinc-950 flex flex-col items-center py-8 gap-10 z-50 shrink-0`}>
        <div className="w-12 h-12 bg-[#FFD600] rounded-xl flex items-center justify-center font-black text-2xl italic tracking-tighter">RM</div>
        <div className="flex flex-col gap-10 text-white">
          <div 
            onClick={() => { setActiveTab('map'); setShowUI(false); }}
            className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${activeTab === 'map' ? 'text-[#FFD600] opacity-100' : 'opacity-60 hover:opacity-100'}`}
          >
            <Navigation size={22} className="rotate-45" />
            <span className="text-[9px] uppercase font-bold tracking-widest">Xarita</span>
          </div>
          <div 
            onClick={() => { setActiveTab('rides'); setShowUI(true); }}
            className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${activeTab === 'rides' ? 'text-[#FFD600] opacity-100' : 'opacity-60 hover:opacity-100'}`}
          >
            <Car size={22} />
            <span className="text-[9px] uppercase font-bold tracking-widest">Safarlar</span>
          </div>
          <div 
            onClick={() => { setActiveTab('history'); setShowUI(true); }}
            className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${activeTab === 'history' ? 'text-[#FFD600] opacity-100' : 'opacity-60 hover:opacity-100'}`}
          >
            <Clock size={22} />
            <span className="text-[9px] uppercase font-bold tracking-widest">Tarix</span>
          </div>
        </div>
        <div className="mt-auto">
          <button className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 overflow-hidden hover:border-[#FFD600] transition-colors">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Profil" />
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 relative bg-zinc-100">
        {/* Map Layer */}
        <div className="absolute inset-0 z-0">
          <MapContainer center={pos} zoom={zoom} zoomControl={false} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
            <ChangeView center={pos} zoom={zoom} />
            <MapBoundsHandler ride={selectedHistoryRide} />
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker position={pos} />
            {destPos && (
              <Marker position={destPos}>
                <Popup>Boriladigan manzil</Popup>
              </Marker>
            )}

            {isOrdering && pos && destPos && (
              <Polyline positions={[pos, destPos]} color="#FFD600" weight={4} dashArray="10, 10" />
            )}

            {selectedHistoryRide && (
              <Polyline positions={selectedHistoryRide.coords} color="#000000" weight={5} opacity={0.6} />
            )}
            
            {drivers.map(driver => (
              <Marker 
                key={driver.id} 
                position={driver.position} 
                icon={createTaxiIcon(carColor, driver.rotation, carModel)}
              />
            ))}
          </MapContainer>
        </div>

        {/* Overlay Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'rides' && !isOrdering && showUI && !isFullscreen && (
            <motion.div 
              key="rides-tab"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              className="absolute top-8 left-8 z-40 w-[420px] pointer-events-none"
            >
              <div className="w-full bg-white rounded-[32px] pointer-events-auto border border-zinc-200 shadow-2xl flex flex-col p-8 overflow-hidden">
                <div className="flex items-center justify-between mb-8">
                  <h1 className="text-4xl font-black tracking-tighter uppercase italic">RM TAXI</h1>
                  <div className="flex items-center gap-2">
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={toggleVoiceCommand}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                        isListening ? 'bg-rose-500 text-white animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.5)]' : 'bg-zinc-100 text-zinc-400 hover:bg-zinc-200'
                      }`}
                    >
                      {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                    </motion.button>
                    <span className="bg-zinc-100 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-zinc-400">Namangan</span>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                    <input 
                      type="text" 
                      value={pickup}
                      onChange={(e) => setPickup(e.target.value)}
                      className="w-full pl-10 pr-4 py-4 bg-zinc-50 border-none rounded-2xl text-sm font-bold placeholder:text-zinc-300 focus:ring-2 focus:ring-[#FFD600] outline-none"
                    />
                  </div>

                  <div className="relative">
                      <motion.div 
                        animate={showError ? { x: [-4, 4, -4, 4, 0] } : {}}
                        className={`relative flex items-center bg-zinc-100 rounded-2xl border-2 transition-all overflow-hidden ${
                          showError ? 'border-rose-500 bg-rose-50' : 'border-transparent focus-within:border-[#FFD600]'
                        }`}
                      >
                        <div className={`absolute left-4 w-2 h-2 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.5)] ${showError ? 'bg-rose-600' : 'bg-rose-500'}`}></div>
                        <input 
                          type="text" 
                          value={destination}
                          onChange={(e) => {
                            setDestination(e.target.value);
                            if (e.target.value) setShowError(false);
                          }}
                          placeholder="Qayerga borasiz?"
                          className="w-full pl-10 pr-10 py-4 bg-transparent border-none rounded-2xl text-sm font-bold placeholder:text-zinc-400 outline-none"
                        />
                        {isSearching && (
                          <div className="absolute right-12 animate-spin text-zinc-300">
                             <Clock size={14} />
                          </div>
                        )}
                        {destination && (
                          <button onClick={() => { setDestination(''); setSuggestions([]); }} className="absolute right-4 text-zinc-300 hover:text-zinc-900 transition-colors">
                            <X size={18} />
                          </button>
                        )}
                      </motion.div>
                      
                      <AnimatePresence>
                        {suggestions.length > 0 && (
                          <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-zinc-100 z-[60] overflow-hidden"
                          >
                            {suggestions.map((loc, idx) => (
                              <button 
                                key={idx}
                                onClick={() => selectLocation(loc)}
                                className="w-full px-5 py-3 text-left hover:bg-zinc-50 border-b border-zinc-50 last:border-none flex items-start gap-3 transition-colors shrink-0"
                              >
                                <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center shrink-0 mt-0.5">
                                  <Navigation size={14} className="text-zinc-400 rotate-45" />
                                </div>
                                <div>
                                  <span className="block text-sm font-bold text-zinc-900 truncate max-w-[280px]">{loc.display_name.split(',')[0]}</span>
                                  <span className="block text-[10px] text-zinc-400 truncate max-w-[280px]">{loc.display_name}</span>
                                </div>
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {showError && (
                      <motion.span 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-[10px] text-rose-500 font-bold ml-4 mt-1 block"
                      >
                        Iltimos, boradigan manzilingizni kiriting
                      </motion.span>
                    )}
                  </div>
                </div>

                {/* Traffic Status Info */}
                <div className="flex items-center gap-2 mb-4 px-1">
                  <div className={`w-2 h-2 rounded-full animate-pulse ${
                    trafficStatus.includes('Erkin') ? 'bg-emerald-500' : 
                    trafficStatus.includes('O\'rtacha') ? 'bg-amber-500' : 'bg-rose-500'
                  }`} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                    Trafik: <span className="text-zinc-900 italic">{trafficStatus}</span>
                  </span>
                </div>

                {/* Service Classes */}
                <div className="flex gap-3 mb-6 overflow-x-auto pb-4 no-scrollbar scroll-smooth">
                  <ServiceCard 
                    type="economy" 
                    label="Ekonom" 
                    price={getPrice("12.5")} 
                    time={Math.max(1, Math.round(3 * trafficFactor)).toString()} 
                    eta={destPos ? getETA(Math.max(1, Math.round(3 * trafficFactor))) : undefined}
                    active={activeTier === 'economy'} 
                    onClick={() => setActiveTier('economy')} 
                  />
                  <ServiceCard 
                    type="comfort" 
                    label="Komfort" 
                    price={getPrice("18.0")} 
                    time={Math.max(1, Math.round(5 * trafficFactor)).toString()} 
                    eta={destPos ? getETA(Math.max(1, Math.round(5 * trafficFactor))) : undefined}
                    active={activeTier === 'comfort'} 
                    onClick={() => setActiveTier('comfort')} 
                  />
                  <ServiceCard 
                    type="business" 
                    label="Biznes" 
                    price={getPrice("32.0")} 
                    time={Math.max(1, Math.round(8 * trafficFactor)).toString()} 
                    eta={destPos ? getETA(Math.max(1, Math.round(8 * trafficFactor))) : undefined}
                    active={activeTier === 'business'} 
                    onClick={() => setActiveTier('business')} 
                  />
                  <ServiceCard 
                    type="minivan" 
                    label="Miniven" 
                    price={getPrice("25.0")} 
                    time={Math.max(1, Math.round(6 * trafficFactor)).toString()} 
                    eta={destPos ? getETA(Math.max(1, Math.round(6 * trafficFactor))) : undefined}
                    active={activeTier === 'minivan'} 
                    onClick={() => setActiveTier('minivan')} 
                  />
                  <ServiceCard 
                    type="cargo" 
                    label="Yuk" 
                    price={getPrice("45.0")} 
                    time={Math.max(1, Math.round(12 * trafficFactor)).toString()} 
                    eta={destPos ? getETA(Math.max(1, Math.round(12 * trafficFactor))) : undefined}
                    active={activeTier === 'cargo'} 
                    onClick={() => setActiveTier('cargo')} 
                  />
                </div>

                {/* Promo Code Section */}
                <div className="flex gap-6 mb-6">
                  <div className="flex-1">
                    {!isPromoInputVisible ? (
                      <button 
                        onClick={() => setIsPromoInputVisible(true)}
                        className="flex items-center gap-2 text-[10px] font-black uppercase text-[#FFD600] tracking-widest hover:opacity-80 transition-opacity whitespace-nowrap"
                      >
                        <Star size={12} fill="currentColor" />
                        <span>{discount > 0 ? 'Promo-kod qo\'llandi (20%)' : 'Promo-kod bormi?'}</span>
                      </button>
                    ) : (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-2"
                      >
                        <input 
                          type="text" 
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value)}
                          placeholder="KOD..."
                          className="flex-1 bg-zinc-100 border-none rounded-xl px-4 py-2 text-xs font-bold uppercase outline-none focus:ring-2 focus:ring-[#FFD600]"
                        />
                        <button 
                          onClick={applyPromo}
                          className="bg-zinc-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest"
                        >
                          OK
                        </button>
                        <button 
                          onClick={() => setIsPromoInputVisible(false)}
                          className="bg-zinc-100 text-zinc-400 p-2 rounded-xl"
                        >
                          <X size={14} />
                        </button>
                      </motion.div>
                    )}
                  </div>

                  {/* Car Customization Picker */}
                  <div className="flex gap-2 items-center bg-zinc-50 p-1.5 rounded-2xl border border-zinc-100 shrink-0">
                    {/* Model Picker */}
                    <div className="flex bg-white rounded-lg p-0.5 border border-zinc-100 mr-1">
                      {carModels.map(m => (
                        <button
                          key={m.id}
                          onClick={() => setCarModel(m.id)}
                          title={m.name}
                          className={`p-1.5 rounded-md transition-all ${carModel === m.id ? 'bg-[#FFD600] text-black shadow-sm' : 'text-zinc-400 hover:text-zinc-600'}`}
                        >
                          {m.icon}
                        </button>
                      ))}
                    </div>
                    {/* Color Picker */}
                    <div className="flex gap-1.5 pr-1">
                      {carColors.map(c => (
                        <button
                          key={c.value}
                          onClick={() => setCarColor(c.value)}
                          title={c.name}
                          className={`w-5 h-5 rounded-full border-2 transition-transform hover:scale-110 ${carColor === c.value ? 'border-zinc-900 scale-110' : 'border-transparent'}`}
                          style={{ backgroundColor: c.value }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-8 px-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-6 bg-zinc-100 rounded-md flex items-center justify-center font-black text-[9px] border border-zinc-200 tracking-tighter">{paymentMethod}</div>
                    <span className="text-sm font-bold text-zinc-500 italic tracking-tight">{paymentMethod === 'VISA' ? '•••• 4291' : paymentMethod === 'UzCard' ? '•••• 5102' : 'Sizning hamyoningiz'}</span>
                  </div>
                  <button 
                    onClick={togglePayment}
                    className="text-[10px] font-black uppercase text-zinc-400 hover:text-zinc-900 transition-colors tracking-tighter underline underline-offset-4"
                  >
                    O'zgartirish
                  </button>
                </div>

                <button
                  onClick={handleOrder}
                  className={`w-full py-5 rounded-2xl text-black font-black text-xl uppercase tracking-tighter transition-all ${
                    destination.trim() ? 'bg-[#FFD600] shadow-xl shadow-yellow-200' : 'bg-zinc-100 text-zinc-300'
                  }`}
                >
                  Taxsi Buyurtma Qilish
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === 'history' && showUI && !isFullscreen && (
            <motion.div 
              key="history-tab"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              className="absolute top-8 left-8 z-40 w-[420px] bg-white rounded-[32px] border border-zinc-200 shadow-2xl flex flex-col p-8 overflow-hidden"
            >
              <AnimatePresence mode="wait">
                {!selectedHistoryRide ? (
                  <motion.div
                    key="history-list"
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 20, opacity: 0 }}
                  >
                    <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-8 italic">Safarlar Tarixi</h2>
                    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 no-scrollbar">
                      {historyRides.map((item) => (
                        <div 
                          key={item.id} 
                          onClick={() => setSelectedHistoryRide(item)}
                          className="p-4 bg-zinc-50 rounded-[24px] border border-zinc-100 group hover:border-[#FFD600] transition-all cursor-pointer hover:shadow-lg active:scale-[0.98]"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{item.date}</span>
                            <span className="font-black text-xl italic tracking-tighter">{item.cost} s.</span>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                              <span className="text-sm font-bold text-zinc-600 truncate">{item.from}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                              <span className="text-sm font-bold text-zinc-900 truncate">{item.to}</span>
                            </div>
                          </div>
                          <div className="mt-4 flex items-center justify-between">
                             <div className="flex items-center gap-2">
                               <span className="text-[9px] font-black uppercase bg-zinc-900 text-[#FFD600] px-2 py-0.5 rounded-full tracking-widest">{item.type}</span>
                             </div>
                             <ChevronRight size={16} className="text-zinc-300 group-hover:text-zinc-900 transition-colors" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="ride-detail"
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    className="flex flex-col"
                  >
                    <button 
                      onClick={() => setSelectedHistoryRide(null)}
                      className="flex items-center gap-2 text-[10px] font-black uppercase text-zinc-400 hover:text-zinc-900 transition-colors mb-6 tracking-widest"
                    >
                      <ChevronRight size={14} className="rotate-180" />
                      Yana ro'yxatga qaytish
                    </button>
                    
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h2 className="text-2xl font-black italic tracking-tighter uppercase">{selectedHistoryRide.to}</h2>
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{selectedHistoryRide.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-black italic tracking-tighter">{selectedHistoryRide.cost} s.</p>
                        <span className="text-[10px] font-black uppercase bg-[#FFD600] px-2 py-0.5 rounded-full tracking-widest">To'langan</span>
                      </div>
                    </div>

                    <div className="space-y-6 mb-8">
                      <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                        <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-3">Marshrut</p>
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0"></div>
                            <div>
                              <p className="text-xs font-bold text-zinc-400 leading-none mb-1">Qayerdan</p>
                              <p className="text-sm font-bold text-zinc-900">{selectedHistoryRide.from}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 shrink-0"></div>
                            <div>
                              <p className="text-xs font-bold text-zinc-400 leading-none mb-1">Qayerga</p>
                              <p className="text-sm font-bold text-zinc-900">{selectedHistoryRide.to}</p>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-zinc-200 flex justify-between">
                          <div>
                            <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Masofa</p>
                            <p className="text-sm font-black">{selectedHistoryRide.distance}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Vaqt</p>
                            <p className="text-sm font-black">{selectedHistoryRide.duration}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-zinc-100 shadow-sm">
                        <div className="w-14 h-14 bg-zinc-100 rounded-full flex items-center justify-center overflow-hidden">
                           <User size={32} className="text-zinc-300" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-black text-zinc-900">{selectedHistoryRide.driver.name}</p>
                                <div className="flex items-center gap-1">
                                  <Star size={10} fill="#FFD600" className="text-[#FFD600]" />
                                  <span className="text-[10px] font-black text-zinc-600">{selectedHistoryRide.driver.rating}</span>
                                </div>
                              </div>
                              <p className="text-xs font-bold text-zinc-400">{selectedHistoryRide.driver.car} • {selectedHistoryRide.driver.color}</p>
                            </div>
                            <div className="flex items-center gap-2">
                               <motion.button 
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={(e) => { e.stopPropagation(); window.open(`tel:${selectedHistoryRide.driver.phone || '+998900000000'}`); }}
                                  className="flex items-center gap-2 h-10 px-4 bg-emerald-500 text-white rounded-xl shadow-md active:bg-emerald-600 transition-colors"
                               >
                                 <Phone size={16} fill="currentColor" />
                                 <span className="text-[10px] font-black uppercase tracking-widest">Qo'ng'iroq</span>
                               </motion.button>
                               <motion.button 
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={(e) => { e.stopPropagation(); setIsChatOpen(true); }}
                                  className="w-10 h-10 bg-[#FFD600] text-black rounded-xl flex items-center justify-center shadow-md hover:bg-yellow-400 shrink-0"
                               >
                                 <MessageSquare size={18} fill="currentColor" />
                               </motion.button>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 px-2">
                        <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-2">To'lov tafsilotlari</p>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-zinc-500 font-bold">Asosiy narx</span>
                          <span className="font-black text-zinc-900">{selectedHistoryRide.breakdown.base} s.</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-zinc-500 font-bold">Masofa uchun</span>
                          <span className="font-black text-zinc-900">{selectedHistoryRide.breakdown.dist} s.</span>
                        </div>
                        {selectedHistoryRide.breakdown.wait !== '0' && (
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-zinc-500 font-bold">Kutish vaqti</span>
                            <span className="font-black text-zinc-900">{selectedHistoryRide.breakdown.wait} s.</span>
                          </div>
                        )}
                        {selectedHistoryRide.breakdown.promo !== '0' && (
                          <div className="flex justify-between items-center text-xs text-emerald-600">
                            <span className="font-bold cursor-help border-b border-dashed border-emerald-300">Promo-kod (chegirma)</span>
                            <span className="font-black">- {selectedHistoryRide.breakdown.promo} s.</span>
                          </div>
                        )}
                        <div className="pt-2 mt-2 border-t border-zinc-100 flex justify-between items-center">
                          <span className="text-sm font-black uppercase tracking-tighter">Jami</span>
                          <span className="text-xl font-black italic tracking-tighter">{selectedHistoryRide.cost} s.</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Stats */}
        {showUI && !isFullscreen && (
          <div className="absolute top-10 right-10 z-40 hidden md:block">
            <motion.div 
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="bg-white p-4 rounded-2xl shadow-xl flex items-center gap-4 border border-zinc-100 cursor-help"
            >
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                <Car size={20} />
              </div>
              <div>
                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">Yaqin atrofdagilar</p>
                <p className="text-xl font-black leading-none italic">14 ta haydovchi</p>
              </div>
            </motion.div>
          </div>
        )}

        {/* Zoom Controls */}
        <div className="absolute bottom-10 right-10 z-40 flex flex-col gap-2">
          <button 
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center font-black border border-zinc-100 hover:bg-zinc-50 outline-none transition-transform active:scale-95 mb-4"
            title={isFullscreen ? "Kichraytirish" : "To'liq ekran"}
          >
            {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
          </button>
          <button 
            onClick={handleZoomIn}
            className="w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center font-black border border-zinc-100 hover:bg-zinc-50 outline-none transition-transform active:scale-95"
          >
            +
          </button>
          <button 
            onClick={handleZoomOut}
            className="w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center font-black border border-zinc-100 hover:bg-zinc-50 outline-none transition-transform active:scale-95"
          >
            -
          </button>
        </div>
      </main>

      {/* Floating Mock Cars (Stylized) */}
      <div className="absolute bottom-20 right-[30%] w-8 h-8 bg-zinc-900 rounded-full flex items-center justify-center text-white shadow-xl rotate-45 z-10 pointer-events-none">
        <Navigation size={16} fill="currentColor" />
      </div>

      <AnimatePresence>
        {isOrdering && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] bg-white/60 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center"
          >
            {orderStep === 2 ? (
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center"
              >
                <div className="relative w-40 h-40 mb-12 flex items-center justify-center">
                  <motion.div 
                    animate={{ scale: [1, 2], opacity: [0.3, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
                    className="absolute inset-0 bg-[#FFD600] rounded-full"
                  />
                  <div className="relative z-10 w-20 h-20 bg-[#FFD600] rounded-[24px] flex items-center justify-center shadow-2xl shadow-yellow-400/50">
                    <Car size={40} className="text-black" />
                  </div>
                </div>
                <h2 className="text-4xl font-black italic tracking-tighter mb-2">QIDIRILMOQDA...</h2>
                <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest">Eng yaqin haydovchini topyapmiz</p>
                <button 
                  onClick={() => setIsOrdering(false)}
                  className="mt-16 bg-zinc-900 text-white px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl"
                >
                  Bekor qilish
                </button>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-white p-12 rounded-[56px] border border-zinc-200 w-full max-w-sm flex flex-col items-center shadow-[0_50px_100px_rgba(0,0,0,0.1)] relative"
              >
                <div className="w-24 h-24 rounded-[32px] flex items-center justify-center mb-10 shadow-xl transition-colors" style={{ backgroundColor: carColor }}>
                  <Star size={44} className="fill-current" style={{ color: carColor === '#FFFFFF' || carColor === '#FFD600' ? 'black' : 'white' }} />
                </div>
                <h2 className="text-5xl font-black italic tracking-tighter mb-4">TOPILDI!</h2>
                <p className="text-zinc-400 mb-10 font-bold leading-tight">
                  Chevrolet Gentra <br />
                  <span className="text-zinc-900 font-black text-2xl tracking-tighter italic">01 A 777 AA</span>
                </p>
                
                <div className="w-full bg-zinc-50 rounded-3xl p-6 flex items-center gap-4 mb-10 border border-zinc-100 group">
                  <div className="w-16 h-16 bg-zinc-200 rounded-2xl overflow-hidden border-2 border-zinc-100">
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Javohir" alt="Driver" className="w-full h-full object-cover" />
                  </div>
                  <div className="text-left flex-1">
                    <div className="flex items-center justify-between">
                      <span className="block font-black text-xl italic tracking-tight uppercase">Javohir R.</span>
                      <div className="flex items-center gap-2">
                        <motion.button 
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => window.open(`tel:${activeDriverPhone}`)}
                          className="flex items-center gap-2 h-10 px-4 bg-emerald-500 text-white rounded-xl shadow-lg transition-transform"
                        >
                          <Phone size={16} fill="currentColor" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Qo'ng'iroq</span>
                        </motion.button>
                        <motion.button 
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setIsChatOpen(true)}
                          className="w-10 h-10 bg-[#FFD600] text-black rounded-xl flex items-center justify-center shadow-lg transition-transform shrink-0"
                        >
                          <MessageSquare size={18} fill="currentColor" />
                        </motion.button>
                        <motion.button 
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="w-10 h-10 bg-zinc-900 text-white rounded-xl flex items-center justify-center shadow-lg opacity-40 grayscale cursor-not-allowed shrink-0"
                        >
                          <Navigation size={18} fill="currentColor" />
                        </motion.button>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5">
                      <div className="flex items-center gap-1.5 text-[10px] text-[#FFD600] bg-zinc-900 px-2 py-0.5 rounded-full w-fit">
                        <Star size={10} fill="currentColor" />
                        <span className="font-black text-white">4.98</span>
                      </div>
                      <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none">2,482 safar</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 w-full mb-10">
                  <div className="bg-zinc-50 rounded-2xl p-4 text-center">
                    <span className="block text-[9px] text-zinc-400 uppercase font-black tracking-widest mb-1">Vaqt</span>
                    <span className="block text-2xl font-black italic">4 min</span>
                  </div>
                  <div className="bg-zinc-50 rounded-2xl p-4 text-center">
                    <span className="block text-[9px] text-zinc-400 uppercase font-black tracking-widest mb-1">Rangi</span>
                    <span className="block text-2xl font-black italic">OQ</span>
                  </div>
                </div>

                <button 
                  onClick={() => { setIsOrdering(false); setDestination(''); }}
                  className="w-full py-6 bg-[#FFD600] text-black font-black rounded-3xl text-xl uppercase tracking-tighter shadow-xl shadow-yellow-200 hover:scale-[1.02] transition-all"
                >
                  Tayyorman
                </button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Overlay */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 w-full max-w-md z-[110] px-4"
          >
            <div className="bg-white rounded-[40px] shadow-[0_30px_60px_rgba(0,0,0,0.2)] border border-zinc-100 overflow-hidden flex flex-col h-[500px]">
              {/* Chat Header */}
              <div className="bg-zinc-950 p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-zinc-800 rounded-full overflow-hidden border border-zinc-700">
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Javohir" alt="Driver" />
                  </div>
                  <div>
                    <h3 className="text-white font-black text-lg italic tracking-tight leading-none mb-1">Javohir R.</h3>
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                       <span className="text-[9px] font-black uppercase text-zinc-500 tracking-widest">Onlayn</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setIsChatOpen(false)}
                  className="w-10 h-10 bg-zinc-800 text-white rounded-2xl flex items-center justify-center hover:bg-zinc-700 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4 no-scrollbar bg-zinc-50">
                <div className="flex justify-center">
                  <span className="text-[9px] font-black uppercase text-zinc-400 tracking-[0.2em] bg-zinc-100 px-4 py-1.5 rounded-full">Bugun</span>
                </div>
                
                <div className="flex flex-col gap-1 items-start max-w-[80%]">
                  <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-zinc-100 text-sm font-bold text-zinc-600 shadow-sm leading-relaxed">
                    Assalomu alaykum! Men yo'ldaman, 3-4 daqiqada boraman.
                  </div>
                  <span className="text-[9px] font-black text-zinc-400 pl-1 uppercase tracking-widest">{new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                <div className="flex flex-col gap-1 items-end ml-auto max-w-[80%]">
                  <div className="bg-zinc-900 p-4 rounded-2xl rounded-tr-none text-sm font-bold text-white shadow-xl shadow-zinc-200 leading-relaxed">
                    Va alaykum assalom. Yaxshi, kutaman.
                  </div>
                  <div className="flex items-center gap-1.5 pr-1">
                    <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">O'qildi</span>
                    <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest leading-none">•</span>
                    <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>

              {/* Chat Input */}
              <div className="p-4 bg-white border-t border-zinc-100 flex gap-3">
                <div className="flex-1 relative">
                  <input 
                    type="text" 
                    placeholder="Xabar yozing..."
                    className="w-full bg-zinc-100 border-none rounded-2xl px-6 py-4 text-sm font-bold placeholder:text-zinc-400 outline-none focus:ring-2 focus:ring-[#FFD600]"
                  />
                  <button className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-300 hover:text-zinc-500">
                    <Star size={18} />
                  </button>
                </div>
                <button className="w-14 h-14 bg-[#FFD600] text-black rounded-2xl flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all">
                  <Navigation size={22} className="rotate-90 fill-current" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
