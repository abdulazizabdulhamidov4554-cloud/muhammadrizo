import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Clock, 
  CreditCard, 
  Star,
  Mic, 
  MicOff, 
  Menu, 
  X, 
  Navigation, 
  ChevronRight, 
  Maximize, 
  Minimize, 
  MessageSquare, 
  Phone, 
  AlertTriangle,
  Layers,
  Filter,
  Calendar,
  DollarSign,
  Check,
  Search,
  Wifi,
  Activity,
  User
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
  travelTime,
  active, 
  onClick 
}: { 
  type: string, 
  label: string, 
  price: string, 
  time: string, 
  eta?: string,
  travelTime?: string,
  active: boolean, 
  onClick: () => void,
  key?: string | number
}) => {
  const getIcon = () => {
    switch(type) {
      case 'economy': return <img src="https://img.icons8.com/color/96/taxi.png" alt="Ekonom" className="w-8 h-8 object-contain" />;
      case 'comfort': return <img src="https://img.icons8.com/color/96/sedan.png" alt="Komfort" className="w-8 h-8 object-contain" />;
      case 'business': return <img src="https://img.icons8.com/color/96/diplomatic-car.png" alt="Biznes" className="w-8 h-8 object-contain" />;
      case 'minivan': return <img src="https://img.icons8.com/color/96/minivan.png" alt="Miniven" className="w-8 h-8 object-contain" />;
      case 'cargo': return <img src="https://img.icons8.com/color/96/box-truck.png" alt="Yuk" className="w-8 h-8 object-contain" />;
      default: return <img src="https://img.icons8.com/color/96/taxi.png" alt="Taksi" className="w-8 h-8 object-contain" />;
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`relative flex flex-col items-start justify-between p-4 rounded-2xl border-2 transition-all duration-300 min-w-[145px] h-[115px] shrink-0 ${
        active 
          ? 'bg-zinc-950 text-white border-zinc-950 shadow-lg' 
          : 'bg-white text-zinc-400 border-zinc-100 hover:border-zinc-300'
      }`}
    >
      <div className="flex justify-between w-full items-start">
        <span className="text-[10px] font-black uppercase tracking-wider text-left line-clamp-1">{label}</span>
        <div className={`${active ? 'text-[#FFD600]' : 'text-zinc-200'}`}>
          {getIcon()}
        </div>
      </div>
      <div className="flex flex-col items-start w-full">
        <div className="flex items-baseline gap-1">
          <span className={`text-xl font-black leading-none ${active ? 'text-white' : 'text-zinc-900'}`}>{price}k</span>
          {travelTime && <span className={`text-[8px] font-bold ${active ? 'text-zinc-400' : 'text-zinc-300'}`}>+ {travelTime} m. trip</span>}
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          <span className={`text-[9px] uppercase font-bold flex items-center gap-1 ${active ? 'opacity-40' : 'text-zinc-400'}`}>
            <Clock size={8} /> {time} min
          </span>
          {eta && (
            <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${active ? 'bg-[#FFD600] text-black' : 'bg-zinc-100 text-zinc-500'}`}>
              {eta}
            </span>
          )}
        </div>
      </div>
    </motion.button>
  );
};

const StarRating = ({ rating, size = 10, className = "" }: { rating: number, size?: number, className?: string }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  
  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      {[...Array(5)].map((_, i) => (
        <Star 
          key={`star-rating-v2-${i}`} 
          size={size} 
          fill={i < fullStars ? "#FFD600" : "none"} 
          className={i < fullStars ? "text-[#FFD600]" : "text-zinc-300"} 
        />
      ))}
      <span className="text-[10px] font-black text-zinc-600 ml-1 leading-none">{rating.toFixed(1)}</span>
    </div>
  );
};

const TrafficOverlay = ({ trafficFactor }: { trafficFactor: number }) => {
  // Simulated road network for Namangan centered around 40.9983, 71.6726
  const roads = [
    // Main Arteries
    { pts: [[40.97, 71.6726], [41.03, 71.6726]], baseTraffic: 1.2 },
    { pts: [[41.01, 71.64], [41.01, 71.71]], baseTraffic: 1.5 },
    { pts: [[40.985, 71.64], [40.985, 71.71]], baseTraffic: 0.8 },
    // Grid roads
    { pts: [[40.97, 71.65], [41.03, 71.65]], baseTraffic: 0.6 },
    { pts: [[40.97, 71.69], [41.03, 71.69]], baseTraffic: 0.7 },
    { pts: [[40.9983, 71.64], [40.9983, 71.71]], baseTraffic: 1.1 },
    // Diagonals / Circumferential
    { pts: [[40.98, 71.65], [41.02, 71.70]], baseTraffic: 0.9 },
    { pts: [[41.02, 71.65], [40.98, 71.70]], baseTraffic: 1.0 },
  ];

  const getColor = (intensity: number) => {
    const val = intensity * trafficFactor;
    if (val > 1.6) return '#ef4444'; // Red (Heavy)
    if (val > 1.1) return '#f59e0b'; // Amber (Medium)
    return '#22c55e'; // Green (Light)
  };

  return (
    <>
      {roads.map((road, i) => (
        <Polyline 
          key={`traffic-road-${i}`} 
          positions={road.pts as any} 
          color={getColor(road.baseTraffic)} 
          weight={5} 
          opacity={0.5} 
          lineCap="round"
        />
      ))}
    </>
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
  const [simulatedTime, setSimulatedTime] = useState(8); // Start at 8 AM for demo peak
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
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [currentRating, setCurrentRating] = useState(0);
  const [rideReview, setRideReview] = useState("");
  const [isCancellationReasonsOpen, setIsCancellationReasonsOpen] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [cancellationHistory, setCancellationHistory] = useState<any[]>([]);
  const [mapFiltersEnabled, setMapFiltersEnabled] = useState(true);
  const [rideStatus, setRideStatus] = useState<'searching' | 'arriving' | 'on_way' | 'arrived' | 'completed'>('searching');
  
  // History Filters
  const [showTraffic, setShowTraffic] = useState(true);
  const [historyFilterType, setHistoryFilterType] = useState<string>('all');
  const [historyFilterDate, setHistoryFilterDate] = useState<string>('all'); // all, today, week, month
  const [historyFilterMinCost, setHistoryFilterMinCost] = useState<number>(0);
  const [historyFilterMaxCost, setHistoryFilterMaxCost] = useState<number>(100000);
  const [historyFilterDriverName, setHistoryFilterDriverName] = useState<string>('');
  const [historyFilterMinDistance, setHistoryFilterMinDistance] = useState<number>(0);
  const [historyFilterMaxDistance, setHistoryFilterMaxDistance] = useState<number>(50);
  const [historyFilterTimeOfDay, setHistoryFilterTimeOfDay] = useState<string>('all'); // all, morning, afternoon, evening
  const [isHistoryFilterVisible, setIsHistoryFilterVisible] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isBookingConfirmedModalOpen, setIsBookingConfirmedModalOpen] = useState(false);
  const [isIncomingOrderModalOpen, setIsIncomingOrderModalOpen] = useState(false);
  const [incomingOrderDetails, setIncomingOrderDetails] = useState<any>(null);

  const [chatMessages, setChatMessages] = useState<any[]>([
    { id: 1, text: "Assalomu alaykum! Men yo'ldaman, 3-4 daqiqada boraman.", sender: 'driver', time: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }) }
  ]);
  const [chatInput, setChatInput] = useState('');
  const recognitionRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages, isChatOpen]);

  useEffect(() => {
    if (isOrdering && orderStep === 3) {
      setRideStatus('arriving');
      
      const arrivingTimer = setTimeout(() => {
        setRideStatus('on_way');
      }, 5000);

      const onWayTimer = setTimeout(() => {
        setRideStatus('arrived');
      }, 15000);

      const completedTimer = setTimeout(() => {
        setRideStatus('completed');
        setIsRatingModalOpen(true);
      }, 25000);

      return () => {
        clearTimeout(arrivingTimer);
        clearTimeout(onWayTimer);
        clearTimeout(completedTimer);
      };
    } else {
      setRideStatus('searching');
    }
  }, [isOrdering, orderStep]);

  const [rideHistory, setRideHistory] = useState([
    { 
      id: 1,
      from: 'Aeroport', 
      to: 'Markaziy Park', 
      costValue: 22400,
      cost: '22,400', 
      date: 'Kecha, 14:20', 
      timestamp: new Date(Date.now() - 86400000).toISOString(), // Yesterday
      type: 'Komfort',
      driver: { name: 'Javohir', rating: 4.9, car: 'Chevrolet Gentra', color: 'Oq', phone: '+998905553322', plate: '01 A 777 AA', rides: '2.4k' },
      breakdown: { base: '5,000', dist: '14,200', wait: '3,200', promo: '0', tolls: '0' },
      duration: '18 min',
      distance: '8.4 km',
      coords: [[41.0016, 71.6726], [41.0116, 71.6826]] as [number, number][],
      userRating: 5,
      userReview: "Yaxshi xizmat!"
    },
    { 
      id: 2,
      from: 'Uychi ko\'chasi', 
      to: 'Sardoba', 
      costValue: 12000,
      cost: '12,000', 
      date: '12-Apr, 09:15', 
      timestamp: '2026-04-12T09:15:00Z',
      type: 'Ekonom',
      driver: { name: 'Alisher', rating: 4.7, car: 'Chevrolet Nexia 3', color: 'Kulrang', phone: '+998937775522', plate: '50 B 123 CA', rides: '800+' },
      breakdown: { base: '4,000', dist: '8,000', wait: '0', promo: '0', tolls: '0' },
      duration: '12 min',
      distance: '4.2 km',
      coords: [[40.9916, 71.6626], [41.0116, 71.6726]] as [number, number][],
      userRating: 4,
      userReview: "Mashina biroz eski ekan."
    },
    { 
      id: 3,
      from: 'Chorsu', 
      to: 'Namangan City', 
      costValue: 36000,
      cost: '36,000', 
      date: '10-Apr, 18:45', 
      timestamp: '2026-04-10T18:45:00Z',
      type: 'Biznes',
      driver: { name: 'Sanjar', rating: 5.0, car: 'Chevrolet Malibu 2', color: 'Qora', phone: '+998974441188', plate: '01 555 DDD', rides: '3.1k' },
      breakdown: { base: '10,000', dist: '25,000', wait: '10,000', promo: '9,000', tolls: '0' },
      duration: '25 min',
      distance: '12.1 km',
      coords: [[41.0216, 71.6926], [41.0516, 71.7226]] as [number, number][],
      userRating: 5,
      userReview: "Eng zo'r haydovchi!"
    },
  ]);

  const filteredHistory = rideHistory.filter(item => {
    // Service Type Filter
    if (historyFilterType !== 'all' && item.type !== historyFilterType) return false;

    // Date Filter
    if (historyFilterDate !== 'all') {
      const rideDate = new Date(item.timestamp);
      const now = new Date();
      if (historyFilterDate === 'today' && rideDate.toDateString() !== now.toDateString()) return false;
      if (historyFilterDate === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        if (rideDate < weekAgo) return false;
      }
      if (historyFilterDate === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(now.getMonth() - 1);
        if (rideDate < monthAgo) return false;
      }
    }

    // Cost Filter
    if (item.costValue < historyFilterMinCost || item.costValue > historyFilterMaxCost) return false;

    // Driver Name Filter
    if (historyFilterDriverName && !item.driver.name.toLowerCase().includes(historyFilterDriverName.toLowerCase())) return false;

    // Distance Filter
    const itemDistance = parseFloat(item.distance.replace(' km', ''));
    if (itemDistance < historyFilterMinDistance || itemDistance > historyFilterMaxDistance) return false;

    // Time of Day Filter
    if (historyFilterTimeOfDay !== 'all') {
      const rideHour = new Date(item.timestamp).getHours();
      if (historyFilterTimeOfDay === 'morning' && (rideHour < 6 || rideHour >= 12)) return false;
      if (historyFilterTimeOfDay === 'afternoon' && (rideHour < 12 || rideHour >= 18)) return false;
      if (historyFilterTimeOfDay === 'evening' && (rideHour < 18 || rideHour < 24 && rideHour >= 0 && rideHour < 6)) {
        // Evening logic: 18:00 to 05:59
        if (rideHour >= 6 && rideHour < 18) return false;
      }
    }

    return true;
  });

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

      let dPickup = '';
      let dDestination = '';

      // Natural language parsing for Uzbek
      // Pattern 1: [Pickup]dan [Destination]ga
      const fromToMatch = transcript.match(/(.+?)\s*dan\s+(.+?)\s*[gk]a/);
      // Pattern 2: [Destination]ga [Pickup]dan
      const toFromMatch = transcript.match(/(.+?)\s*[gk]a\s+(.+?)\s*dan/);
      // Pattern 3: Manzil [Destination]
      const manzilMatch = transcript.match(/manzil\s+(.+)/);
      // Pattern 4: [Destination]ga boramiz / olib bor
      const directDestMatch = transcript.match(/(.+?)\s*[gk]a\s+(boramiz|olib bor|taksi)/);
      
      if (fromToMatch) {
        dPickup = fromToMatch[1].trim();
        dDestination = fromToMatch[2].trim();
      } else if (toFromMatch) {
        dDestination = toFromMatch[1].trim();
        dPickup = toFromMatch[2].trim();
      } else if (manzilMatch) {
        dDestination = manzilMatch[1].trim();
      } else if (directDestMatch) {
        dDestination = directDestMatch[1].trim();
      } else {
        // Individual extracts if combined patterns fail
        const pMatch = transcript.match(/(.+?)\s*dan/);
        const dMatch = transcript.match(/(.+?)\s*[gk]a/);
        
        if (dMatch && !pMatch) {
          dPickup = "Hozirgi joylashuv";
          dDestination = dMatch[1].trim();
        } else {
          if (pMatch) dPickup = pMatch[1].trim();
          if (dMatch) dDestination = dMatch[1].trim();
        }
      }

      if (dPickup) setPickup(dPickup);
      if (dDestination) {
        setDestination(dDestination);
        // We set a flag to pick the first result automatically if it was voice triggered
        (window as any)._voiceTriggered = true;
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

      // Payment method commands
      if (transcript.includes('naqd') || transcript.includes('pulda')) {
        setPaymentMethod('Naqd');
      } else if (transcript.includes('visa') || transcript.includes('viza')) {
        setPaymentMethod('VISA');
      } else if (transcript.includes('uzcard') || transcript.includes('kartada') || transcript.includes('karta')) {
        setPaymentMethod('UzCard');
      }
      
      // Ride status queries
      if (transcript.includes('qayer') || transcript.includes('qancha') || transcript.includes('vaqt') || transcript.includes('kelda')) {
        let msg = '';
        if (rideStatus === 'arriving') msg = "Haydovchi 4 daqiqada yetib keladi.";
        if (rideStatus === 'on_way') msg = "Siz yo'ldasiz, manzilgacha 12 daqiqa qoldi.";
        if (rideStatus === 'arrived') msg = "Haydovchi yetib kelgan, sizni kutyapti.";
        
        if (msg) {
          const utterance = new SpeechSynthesisUtterance(msg);
          utterance.lang = 'uz-UZ';
          window.speechSynthesis.speak(utterance);
        }
      }

      // Cancel/Stop ride commands
      const cancelKeywords = ['bekor qil', 'to\'xtat', 'otmena', 'cancel', 'stop', 'rad etish'];
      if (isOrdering && cancelKeywords.some(kw => transcript.includes(kw))) {
        setIsCancelModalOpen(true);
        const utterance = new SpeechSynthesisUtterance("Buyurtmani bekor qilishni xohlaysizmi?");
        utterance.lang = 'uz-UZ';
        window.speechSynthesis.speak(utterance);
      }
      
      // Auto order phrases
      if (transcript.includes('buyurtma') || transcript.includes('taksi chaqir') || transcript.includes('boramiz')) {
        if (destination || transcript.includes('ga')) {
          setTimeout(handleOrder, 1200);
        }
      }
    };

    recognition.start();
  };

  const carColors = [
    { name: 'Sariq', value: '#FFD600' },
    { name: 'Oq', value: '#FFFFFF' },
    { name: 'Qora', value: '#121212' },
    { name: 'Qizil', value: '#ff4b4b' },
    { name: 'Ko\'k', value: '#4b77ff' },
    { name: 'Kumush', value: '#888888' }
  ];

  const carModels = [
    { id: 'sedan', name: 'Sedan', icon: <img src="https://img.icons8.com/color/96/sedan.png" alt="Sedan" className="w-5 h-5 object-contain" /> },
    { id: 'suv', name: 'SUV', icon: <img src="https://img.icons8.com/color/96/suv.png" alt="SUV" className="w-5 h-5 object-contain" /> },
    { id: 'electric', name: 'Elektr', icon: <img src="https://img.icons8.com/color/96/tesla-model-x.png" alt="Elektr" className="w-5 h-5 object-contain" /> }
  ];

  const [drivers, setDrivers] = useState(() => {
    const defaultColors = carColors.map(c => c.value);
    const defaultModels = ['sedan', 'suv', 'electric'];
    
    return Array.from({ length: 25 }).map((_, i) => {
      const modelId = defaultModels[Math.floor(Math.random() * defaultModels.length)];
      const carNames: Record<string, string> = {
        'sedan': 'Chevrolet Gentra',
        'suv': 'Chevrolet Tracker',
        'electric': 'BYD Han'
      };
      
      const regions = ['01', '10', '30', '40', '50', '60'];
      const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
      const randomPlate = `${regions[Math.floor(Math.random() * regions.length)]} ${letters[Math.floor(Math.random() * letters.length)]} ${Math.floor(Math.random() * 900 + 100)} ${letters[Math.floor(Math.random() * letters.length)]}${letters[Math.floor(Math.random() * letters.length)]}`;

      const randomColor = defaultColors[Math.floor(Math.random() * defaultColors.length)];

      return {
        id: i,
        position: [
          40.9983 + (Math.random() - 0.5) * 0.05,
          71.6726 + (Math.random() - 0.5) * 0.05
        ] as [number, number],
        rotation: Math.random() * 360,
        color: randomColor,
        colorName: carColors.find(c => c.value === randomColor)?.name || 'Oq',
        model: modelId,
        plate: randomPlate,
        carName: carNames[modelId]
      };
    });
  });
  const [assignedDriverId, setAssignedDriverId] = useState<number | null>(null);

  const createTaxiIcon = (color: string, rotation: number, model: string, isActive?: boolean) => {
    let carImg = 'https://img.icons8.com/color/96/taxi.png';
    
    if (model === 'suv') {
      carImg = 'https://img.icons8.com/color/96/suv.png';
    } else if (model === 'electric') {
      carImg = 'https://img.icons8.com/color/96/tesla-model-x.png';
    }

    const pulseClass = isActive ? (rideStatus === 'arriving' ? 'animate-pulse' : rideStatus === 'on_way' ? 'animate-bounce' : '') : '';

    return L.divIcon({
      className: 'custom-taxi-icon',
      html: `
        <div class="${pulseClass}" style="transform: rotate(${rotation}deg); background: ${color === '#FFFFFF' ? 'rgba(255,255,255,0.9)' : color}; padding: 4px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; border: 2px solid white;">
          <img src="${carImg}" style="width: 32px; height: 32px; object-fit: contain;" />
          ${isActive && rideStatus === 'arrived' ? '<div style="position: absolute; top: -10px; background: #FFD600; color: black; font-size: 8px; font-weight: 800; padding: 2px 6px; border-radius: 4px; white-space: nowrap; border: 1px solid black;">MEN KELDIM</div>' : ''}
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
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

        // Auto-select first result if voice triggered
        if ((window as any)._voiceTriggered && data && data.length > 0) {
          selectLocation(data[0]);
          (window as any)._voiceTriggered = false;
        }
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

  function FollowDriver({ active, position }: { active: boolean, position: [number, number] }) {
    const map = useMap();
    useEffect(() => {
      if (active) {
        map.panTo(position, { animate: true, duration: 1 });
      }
    }, [active, position, map]);
    return null;
  }

  useEffect(() => {
    // Real-time Update Loop (100ms = 10fps simulation)
    const movementInterval = setInterval(() => {
      setDrivers(currentDrivers => currentDrivers.map(d => {
        let targetPos: [number, number] | null = null;
        
        // If this is the assigned driver and we are in an active ride phase
        if (assignedDriverId === d.id && isOrdering) {
          if (orderStep === 2) {
            // Driver arriving at pickup (pos)
            targetPos = pos;
          } else if (orderStep === 3 && destPos) {
            // Ride in progress (towards destPos)
            targetPos = destPos;
          }
        }

        if (targetPos) {
          const latDiff = targetPos[0] - d.position[0];
          const lonDiff = targetPos[1] - d.position[1];
          const dist = Math.sqrt(latDiff * latDiff + lonDiff * lonDiff);
          
          if (dist < 0.00005) return d; // Arrived

          // Very small increments for smooth gliding at 10Hz
          // Adjust factor based on traffic
          const factor = 0.003 * (1 / trafficFactor); 
          const nextLat = d.position[0] + latDiff * factor;
          const nextLon = d.position[1] + lonDiff * factor;
          
          // Calculate rotation smoothly
          const angle = Math.atan2(lonDiff, latDiff) * (180 / Math.PI);
          
          // If ride is in progress, update user position to follow driver
          if (orderStep === 3) {
            setPos([nextLat, nextLon]);
          }

          return {
            ...d,
            position: [nextLat, nextLon],
            rotation: angle + 90 
          };
        } else {
          // Normal background movement - keep it very subtle
          const drift = 0.00002;
          const randomOffsetLat = (Math.random() - 0.5) * drift;
          const randomOffsetLon = (Math.random() - 0.5) * drift;
          return {
            ...d,
            position: [d.position[0] + randomOffsetLat, d.position[1] + randomOffsetLon],
            rotation: d.rotation + (Math.random() - 0.5) * 2
          };
        }
      }));
    }, 100);

    return () => clearInterval(movementInterval);
  }, [assignedDriverId, isOrdering, orderStep, destPos, pos, trafficFactor]);

  useEffect(() => {
    // Tick: 1 minute every 1.5 seconds (Fast day/night cycle for demo)
    const timeInterval = setInterval(() => {
      setSimulatedTime(prev => (prev + 1/60) % 24);
    }, 1500);

    return () => clearInterval(timeInterval);
  }, []);

  useEffect(() => {
    const updateTraffic = () => {
      const hour = simulatedTime;
      let baseFactor = 1.0;
      let status = 'O\'rtacha tirbandlik';

      // Traffic Profile:
      // Peak 1: 7:30 - 9:30 AM (Morning Rush)
      // Peak 2: 17:00 - 19:30 PM (Evening Rush)
      // Low: 0:00 - 5:00 AM (Night)
      // Mid: Other times

      if (hour >= 7.5 && hour <= 9.5) {
        baseFactor = 1.6 + Math.random() * 0.4;
        status = 'Tig\'iz vaqt (Ertalab)';
      } else if (hour >= 17 && hour <= 19.5) {
        baseFactor = 1.7 + Math.random() * 0.5;
        status = 'Tig\'iz vaqt (Kechki)';
      } else if (hour >= 0 && hour <= 5) {
        baseFactor = 0.7 + Math.random() * 0.2;
        status = 'Yo\'llar bo\'sh (Tun)';
      } else if (hour >= 11 && hour <= 14) {
        baseFactor = 1.2 + Math.random() * 0.3;
        status = 'O\'rtacha tirbandlik';
      } else {
        baseFactor = 1.0 + Math.random() * 0.2;
        status = 'Erkin harakat';
      }

      // Zone Factor: Central areas have higher density
      const isCenter = (p: [number, number]) => 
        p[0] >= 40.985 && p[0] <= 41.015 && p[1] >= 71.655 && p[1] <= 71.690;

      let zoneMultiplier = 1.0;
      if (isCenter(pos)) zoneMultiplier += 0.2;
      if (destPos && isCenter(destPos)) zoneMultiplier += 0.2;

      setTrafficFactor(baseFactor * zoneMultiplier);
      setTrafficStatus(status + (zoneMultiplier > 1.0 ? ' (Markaziy hudud)' : ''));
    };

    const trafficInterval = setInterval(updateTraffic, 3000);
    updateTraffic(); // Initial call
    
    return () => clearInterval(trafficInterval);
  }, [simulatedTime]);

  useEffect(() => {
    // Simulated Incoming Order Timer (Every 1 minute)
    const orderTimer = setInterval(() => {
      triggerSimulatedOrder();
    }, 60000); // 60,000 ms = 1 minute

    return () => clearInterval(orderTimer);
  }, []);

  const triggerSimulatedOrder = () => {
    if (isOrdering) return; // Don't interrupt active rides

    const randomDestinations = [
      { name: 'Chorsu bozori', pos: [41.0016, 71.6726] },
      { name: 'Viloyat kasalxonasi', pos: [40.9916, 71.6826] },
      { name: 'Namangan City', pos: [41.0216, 71.7026] },
      { name: 'Temir yo\'l vokzali', pos: [40.9716, 71.6626] }
    ];
    const dest = randomDestinations[Math.floor(Math.random() * randomDestinations.length)];
    
    setIncomingOrderDetails({
      customerName: ['Akbarali', 'Madina', 'Jamshid', 'Oygul'][Math.floor(Math.random() * 4)],
      pickup: 'Hozirgi joyingiz',
      destination: dest.name,
      destPos: dest.pos,
      price: (15 + Math.random() * 20).toFixed(1) + 'k',
      distance: (2 + Math.random() * 8).toFixed(1) + ' km'
    });
    setIsIncomingOrderModalOpen(true);
    
    // Play a sound or voice alert
    const utterance = new SpeechSynthesisUtterance("Yangi buyurtma tushdi.");
    utterance.lang = 'uz-UZ';
    window.speechSynthesis.speak(utterance);
  };

  const acceptIncomingOrder = () => {
    if (incomingOrderDetails) {
      setDestination(incomingOrderDetails.destination);
      setDestPos(incomingOrderDetails.destPos as [number, number]);
      setIsIncomingOrderModalOpen(false);
      // Automatically start the order process
      setTimeout(() => handleOrder(), 500);
    }
  };

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

    const randomDriverIdx = Math.floor(Math.random() * drivers.length);
    setAssignedDriverId(randomDriverIdx);

    const carNames: Record<string, string> = {
      'sedan': 'Chevrolet Gentra',
      'suv': 'Chevrolet Tracker',
      'electric': 'BYD Han'
    };

    // Update map driver to match selection
    setDrivers(prev => prev.map(d => 
      d.id === randomDriverIdx 
        ? { 
            ...d, 
            color: carColor, 
            colorName: carColors.find(c => c.value === carColor)?.name || 'Oq',
            model: carModel,
            carName: carNames[carModel as string] || 'Mashina'
          } 
        : d
    ));

    setShowError(false);
    setIsOrdering(true);
    setIsSyncing(true);
    setOrderStep(2);
    
    // Simulate searching
    setTimeout(() => {
      setOrderStep(3);
      setIsBookingConfirmedModalOpen(true);
    }, 3000);
  };

  const handleInitialCancel = () => {
    setIsCancelModalOpen(false);
    setIsCancellationReasonsOpen(true);
  };

  const cancelRide = (reason: string) => {
    const cancelData = {
      timestamp: new Date().toISOString(),
      pickup,
      destination,
      reason,
      driverId: assignedDriverId,
      status: rideStatus
    };
    
    setCancellationHistory(prev => [cancelData, ...prev]);
    console.log("Ride cancelled with reason:", reason, cancelData);
    
    setIsOrdering(false);
    setIsSyncing(false);
    setOrderStep(1);
    setAssignedDriverId(null);
    setIsCancelModalOpen(false);
    setIsCancellationReasonsOpen(false);
    setCancellationReason("");
    setDestPos(null);
    setDestination('');
    // Optionally reset map center to current position
    if (pos) {
      setZoom(16);
    }
  };

  const submitRating = () => {
    if (currentRating === 0) return;

    const driver = assignedDriverId !== null ? drivers[assignedDriverId] : null;
    
    const newRide = {
      id: rideHistory.length + 1,
      from: pickup,
      to: destination,
      costValue: 18500, // Simulated cost
      cost: '18,500',
      date: 'Hozir',
      timestamp: new Date().toISOString(),
      type: activeTier.charAt(0).toUpperCase() + activeTier.slice(1),
      driver: {
        name: driver?.name || 'Haydovchi',
        rating: driver?.rating || 4.8,
        car: driver?.carName || 'Chevrolet Gentra',
        color: driver?.colorName || 'Oq',
        phone: activeDriverPhone,
        plate: driver?.plate || '01 A 001 AA',
        rides: '1.5k+'
      },
      breakdown: { base: '5,000', dist: '10,000', wait: '3,500', promo: '0', tolls: '0' },
      duration: '15 min',
      distance: '6.2 km',
      coords: [pos, destPos || pos] as [number, number][],
      userRating: currentRating,
      userReview: rideReview
    };

    setRideHistory(prev => [newRide, ...prev]);
    setIsRatingModalOpen(false);
    setIsOrdering(false);
    setOrderStep(1);
    setDestination('');
    setDestPos(null);
    setCurrentRating(0);
    setRideReview("");
    setRideStatus('searching');
  };

  const skipRating = () => {
    const driver = assignedDriverId !== null ? drivers[assignedDriverId] : null;
    
    const newRide = {
      id: rideHistory.length + 1,
      from: pickup,
      to: destination,
      costValue: 18500,
      cost: '18,500',
      date: 'Hozir',
      timestamp: new Date().toISOString(),
      type: activeTier.charAt(0).toUpperCase() + activeTier.slice(1),
      driver: {
        name: driver?.name || 'Haydovchi',
        rating: driver?.rating || 4.8,
        car: driver?.carName || 'Chevrolet Gentra',
        color: driver?.colorName || 'Oq',
        phone: activeDriverPhone,
        plate: driver?.plate || '01 A 001 AA',
        rides: '1.5k+'
      },
      breakdown: { base: '5,000', dist: '10,000', wait: '3,500', promo: '0', tolls: '0' },
      duration: '15 min',
      distance: '6.2 km',
      coords: [pos, destPos || pos] as [number, number][],
      userRating: undefined,
      userReview: undefined
    };

    setRideHistory(prev => [newRide, ...prev]);
    setIsRatingModalOpen(false);
    setIsOrdering(false);
    setOrderStep(1);
    setDestination('');
    setDestPos(null);
    setCurrentRating(0);
    setRideReview("");
    setRideStatus('searching');
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 1, 18));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 1, 3));

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;

    const newMessage = {
      id: Date.now(),
      text: chatInput.trim(),
      sender: 'user',
      time: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, newMessage]);
    setChatInput('');

    // Simulate driver response
    setTimeout(() => {
      const driverReplies = [
        "Tushunarli, hozir yetib boraman.",
        "Xo'p bo'ladi, kutib turing.",
        "Manzilga yaqinlashyapman.",
        "Aynan qayerda turibsiz?",
        "Salom, hozir svetafordaman."
      ];
      const randomReply = driverReplies[Math.floor(Math.random() * driverReplies.length)];
      
      setChatMessages(prev => [...prev, {
        id: Date.now() + 1,
        text: randomReply,
        sender: 'driver',
        time: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
      }]);
    }, 2000);
  };

  const togglePayment = () => {
    const methods = ['VISA', 'Naqd', 'UzCard'];
    const nextIdx = (methods.indexOf(paymentMethod) + 1) % methods.length;
    setPaymentMethod(methods[nextIdx]);
  };

  return (
    <div className="relative h-screen w-full bg-[#F2F2F2] flex flex-row select-none overflow-hidden font-sans text-zinc-900">
      
      {/* Left Navigation Rail */}
      <nav className={`${isFullscreen ? 'hidden' : 'w-24'} bg-zinc-950 flex flex-col items-center py-8 gap-10 z-50 shrink-0`}>
        <div className="w-12 h-12 bg-[#FFD600] rounded-xl flex items-center justify-center font-black text-2xl italic tracking-tighter cursor-pointer" onClick={triggerSimulatedOrder} title="Test Order">RM</div>
        
        {/* Real-time Status Indicator */}
        <div className="flex flex-col items-center gap-1 -mt-4 mb-2">
          <div className="relative">
            <Wifi size={16} className="text-emerald-500" />
            <motion.div 
              animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute inset-0 bg-emerald-500 rounded-full blur-[6px] -z-10"
            />
          </div>
          <span className="text-[8px] font-black uppercase text-emerald-500 tracking-[0.2em] animate-pulse">Live</span>
        </div>

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
            <img src="https://img.icons8.com/color/96/taxi.png" alt="Rides" className="w-6 h-6 grayscale hover:grayscale-0 transition-all brightness-125" style={{ filter: activeTab === 'rides' ? 'none' : 'grayscale(100%) brightness(1.5)' }} />
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
          <button className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 overflow-hidden hover:border-[#FFD600] transition-colors shadow-inner">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka&backgroundColor=b6e3f4" alt="User Profile" className="w-full h-full object-cover" />
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 relative bg-zinc-100">
        {/* Map Layer */}
        <div className="absolute inset-0 z-0">
          <MapContainer 
            center={pos} 
            zoom={zoom} 
            zoomControl={false} 
            scrollWheelZoom={true} 
            style={{ 
              height: '100%', 
              width: '100%',
              filter: mapFiltersEnabled ? 'grayscale(1) contrast(1.2) brightness(1.1)' : 'none',
              opacity: mapFiltersEnabled ? 0.8 : 1
            }}
          >
            <ChangeView center={pos} zoom={zoom} />
            <MapBoundsHandler ride={selectedHistoryRide} />
            <FollowDriver 
              active={isOrdering && assignedDriverId !== null} 
              position={assignedDriverId !== null ? drivers[assignedDriverId].position : pos} 
            />
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {showTraffic && <TrafficOverlay trafficFactor={trafficFactor} />}
            <Marker key="user-pickup-marker" position={pos} />
            {destPos && (
              <Marker key="user-destination-marker" position={destPos}>
                <Popup>Boriladigan manzil</Popup>
              </Marker>
            )}

            {isOrdering && pos && destPos && (
              <Polyline key="order-path-line" positions={[pos, destPos]} color="#FFD600" weight={4} dashArray="10, 10" />
            )}

            {selectedHistoryRide && (
              <Polyline key="history-ride-path-line" positions={selectedHistoryRide.coords} color="#000000" weight={5} opacity={0.6} />
            )}
            
            {drivers.map(driver => (
              <Marker 
                key={`map-taxi-driver-item-${driver.id}`} 
                position={driver.position} 
                icon={createTaxiIcon(driver.color, driver.rotation, driver.model, assignedDriverId === driver.id && isOrdering)}
              />
            ))}
          </MapContainer>

          {/* Real-time Connection Status Overlay */}
          <div className="absolute bottom-6 left-6 z-40">
            <AnimatePresence>
              {isSyncing && (
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 20, opacity: 0 }}
                  className="bg-zinc-900/90 backdrop-blur-md border border-zinc-800 rounded-2xl p-4 shadow-2xl flex items-center gap-4"
                >
                  <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                    <Activity size={20} className="text-emerald-500 animate-pulse" />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest leading-tight">Ulanish holati</p>
                    <div className="flex items-center gap-2">
                       <span className="text-xs font-black text-white italic tracking-tight">MA'LUMOTLAR OQIMI (10Hz)</span>
                       <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
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
                                key={`loc-suggestion-${idx}`}
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
                <div className="flex items-center justify-between mb-4 px-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full animate-pulse ${
                      trafficStatus.includes('Tig\'iz') ? 'bg-rose-500' : 
                      trafficStatus.includes('Erkin') ? 'bg-emerald-500' : 'bg-amber-500'
                    }`} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                      Trafik: <span className="text-zinc-900 italic">{trafficStatus}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-zinc-950 text-[#FFD600] px-2.5 py-1 rounded-lg shadow-lg">
                    <Clock size={12} />
                    <span className="text-[11px] font-black tabular-nums">
                      {Math.floor(simulatedTime).toString().padStart(2, '0')}:{Math.floor((simulatedTime % 1) * 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                </div>

                {/* Service Classes */}
                <div className="flex gap-3 mb-6 overflow-x-auto pb-4 no-scrollbar scroll-smooth">
                  {[
                    { type: 'economy', label: 'Ekonom', price: "12.5", baseTime: 3 },
                    { type: 'comfort', label: 'Komfort', price: "18.0", baseTime: 5 },
                    { type: 'business', label: 'Biznes', price: "32.0", baseTime: 8 },
                    { type: 'minivan', label: 'Miniven', price: "25.0", baseTime: 6 },
                    { type: 'cargo', label: 'Yuk', price: "45.0", baseTime: 12 }
                  ].map((tier) => (
                    <ServiceCard 
                      key={`service-tier-selector-${tier.type}`}
                      type={tier.type} 
                      label={tier.label} 
                      price={getPrice(tier.price)} 
                      time={Math.max(1, Math.round(tier.baseTime * trafficFactor)).toString()} 
                      travelTime={destPos ? Math.round(travelDistance * 2.5 * trafficFactor).toString() : undefined}
                      eta={destPos ? getETA(Math.max(1, Math.round(tier.baseTime * trafficFactor))) : undefined}
                      active={activeTier === tier.type} 
                      onClick={() => setActiveTier(tier.type)} 
                    />
                  ))}
                </div>

                {/* Promo Code Section */}
                <div className="mb-6">
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

                {/* Car Customization Selection - New Layout */}
                <div className="mb-8 space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Mashina turi va rangi</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-900 italic">Tanlang</span>
                  </div>
                  
                  <div className="flex gap-3 h-20">
                    {/* Model Selector Button Group */}
                    <div className="flex-1 bg-zinc-50 rounded-2xl p-1.5 flex gap-1 border border-zinc-100">
                      {carModels.map(m => (
                        <button
                          key={`car-model-selector-${m.id}`}
                          onClick={() => setCarModel(m.id)}
                          className={`flex-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${
                            carModel === m.id ? 'bg-white shadow-md text-zinc-900 border border-zinc-100' : 'text-zinc-400 hover:bg-zinc-100/50'
                          }`}
                        >
                          <div className="scale-75 origin-center">{m.icon}</div>
                          <span className="text-[8px] font-black uppercase tracking-tighter leading-none">{m.name}</span>
                        </button>
                      ))}
                    </div>

                    {/* Color Selector Scroll Area */}
                    <div className="flex-1 bg-zinc-50 rounded-2xl p-3 flex items-center justify-center gap-2 border border-zinc-100 overflow-x-auto no-scrollbar">
                      {carColors.map(c => (
                        <button
                          key={`car-color-selector-${c.value}`}
                          onClick={() => setCarColor(c.value)}
                          className={`w-7 h-7 rounded-full border-2 shrink-0 transition-all hover:scale-110 active:scale-95 flex items-center justify-center ${
                            carColor === c.value ? 'border-zinc-900 shadow-lg' : 'border-white/50'
                          }`}
                          style={{ backgroundColor: c.value }}
                        >
                          {carColor === c.value && (
                            <div className={`w-1.5 h-1.5 rounded-full ${c.value === '#FFFFFF' ? 'bg-zinc-900' : 'bg-white'}`} />
                          )}
                        </button>
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
                    <div className="flex items-center justify-between mb-8">
                      <h2 className="text-3xl font-black italic uppercase tracking-tighter italic">Safarlar Tarixi</h2>
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsHistoryFilterVisible(!isHistoryFilterVisible)}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                          isHistoryFilterVisible ? 'bg-zinc-900 text-[#FFD600] shadow-lg' : 'bg-zinc-100 text-zinc-400 hover:bg-zinc-200'
                        }`}
                      >
                        <Filter size={18} />
                      </motion.button>
                    </div>

                    <AnimatePresence>
                      {isHistoryFilterVisible && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="mb-8 overflow-hidden"
                        >
                          <div className="bg-zinc-50 rounded-3xl p-6 border border-zinc-100 space-y-6">
                            <div>
                              <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-3 flex items-center gap-2">
                                <Layers size={12} />
                                Xizmat turi
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {['all', 'Ekonom', 'Komfort', 'Biznes'].map((type) => (
                                  <button
                                    key={`filter-type-${type}`}
                                    onClick={() => setHistoryFilterType(type)}
                                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                                      historyFilterType === type 
                                        ? 'bg-zinc-900 text-[#FFD600] border-zinc-900' 
                                        : 'bg-white text-zinc-400 border-zinc-200 hover:border-zinc-400'
                                    }`}
                                  >
                                    {type === 'all' ? 'Hammasi' : type}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div>
                              <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-3 flex items-center gap-2">
                                <Calendar size={12} />
                                Vaqt oralig'i
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {[
                                  { id: 'all', label: 'Hammasi' },
                                  { id: 'today', label: 'Bugun' },
                                  { id: 'week', label: 'Haftalik' },
                                  { id: 'month', label: 'Oylik' }
                                ].map((date) => (
                                  <button
                                    key={`filter-date-${date.id}`}
                                    onClick={() => setHistoryFilterDate(date.id)}
                                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                                      historyFilterDate === date.id 
                                        ? 'bg-zinc-900 text-[#FFD600] border-zinc-900' 
                                        : 'bg-white text-zinc-400 border-zinc-200 hover:border-zinc-400'
                                    }`}
                                  >
                                    {date.label}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div>
                              <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-3 flex items-center gap-2">
                                <DollarSign size={12} />
                                Narx (min - max)
                              </p>
                              <div className="flex items-center gap-2">
                                <input 
                                  type="number"
                                  value={historyFilterMinCost || ''}
                                  onChange={(e) => setHistoryFilterMinCost(Number(e.target.value))}
                                  placeholder="Min"
                                  className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-1 focus:ring-[#FFD600]"
                                />
                                <span className="text-zinc-300">-</span>
                                <input 
                                  type="number"
                                  value={historyFilterMaxCost || ''}
                                  onChange={(e) => setHistoryFilterMaxCost(Number(e.target.value))}
                                  placeholder="Max"
                                  className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-1 focus:ring-[#FFD600]"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-3 flex items-center gap-2">
                                  <User size={12} />
                                  Haydovchi ismi
                                </p>
                                <input 
                                  type="text"
                                  value={historyFilterDriverName}
                                  onChange={(e) => setHistoryFilterDriverName(e.target.value)}
                                  placeholder="Ism bo'yicha qidirish..."
                                  className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-1 focus:ring-[#FFD600]"
                                />
                              </div>

                              <div>
                                <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-3 flex items-center gap-2">
                                  <Clock size={12} />
                                  Kun vaqti
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {[
                                    { id: 'all', label: 'Hammasi' },
                                    { id: 'morning', label: 'Ertalab' },
                                    { id: 'afternoon', label: 'Kush' },
                                    { id: 'evening', label: 'Kechki' }
                                  ].map((time) => (
                                    <button
                                      key={`filter-time-${time.id}`}
                                      onClick={() => setHistoryFilterTimeOfDay(time.id)}
                                      className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                                        historyFilterTimeOfDay === time.id 
                                          ? 'bg-zinc-900 text-[#FFD600] border-zinc-900' 
                                          : 'bg-white text-zinc-400 border-zinc-200 hover:border-zinc-400'
                                      }`}
                                    >
                                      {time.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>

                            <div>
                              <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-3 flex items-center gap-2">
                                <Navigation size={12} />
                                Masofa (min - max km)
                              </p>
                              <div className="flex items-center gap-2">
                                <input 
                                  type="number"
                                  value={historyFilterMinDistance || ''}
                                  onChange={(e) => setHistoryFilterMinDistance(Number(e.target.value))}
                                  placeholder="0"
                                  className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-1 focus:ring-[#FFD600]"
                                />
                                <span className="text-zinc-300">-</span>
                                <input 
                                  type="number"
                                  value={historyFilterMaxDistance || ''}
                                  onChange={(e) => setHistoryFilterMaxDistance(Number(e.target.value))}
                                  placeholder="50"
                                  className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-1 focus:ring-[#FFD600]"
                                />
                              </div>
                            </div>

                            <div className="flex justify-between items-center pt-2">
                              <button 
                                onClick={() => {
                                  setHistoryFilterType('all');
                                  setHistoryFilterDate('all');
                                  setHistoryFilterMinCost(0);
                                  setHistoryFilterMaxCost(100000);
                                  setHistoryFilterDriverName('');
                                  setHistoryFilterMinDistance(0);
                                  setHistoryFilterMaxDistance(50);
                                  setHistoryFilterTimeOfDay('all');
                                }}
                                className="text-[9px] font-black uppercase text-zinc-400 hover:text-rose-500 transition-colors tracking-widest"
                              >
                                Filtrlarni tozalash
                              </button>
                              <div className="text-[9px] font-black uppercase text-[#FFD600] bg-zinc-900 px-3 py-1 rounded-full">
                                {filteredHistory.length} ta topildi
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 no-scrollbar">
                      {filteredHistory.length > 0 ? (
                        filteredHistory.map((item) => (
                          <div 
                            key={`history-item-${item.id}`} 
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
                             <div className="flex items-center gap-3">
                               <span className="text-[9px] font-black uppercase bg-zinc-900 text-[#FFD600] px-2 py-0.5 rounded-full tracking-widest">{item.type}</span>
                               <div className="flex items-center gap-1">
                                  <StarRating rating={item.driver.rating} size={8} />
                                  {item.userRating && (
                                    <div className="flex items-center gap-0.5 ml-1 border-l border-zinc-200 pl-2">
                                      <Star size={8} fill="#FFD600" className="text-[#FFD600]" />
                                      <span className="text-[8px] font-black italic">{item.userRating}</span>
                                    </div>
                                  )}
                               </div>
                             </div>
                             <ChevronRight size={16} className="text-zinc-300 group-hover:text-zinc-900 transition-colors" />
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mb-4 text-zinc-200 font-sans">
                           <Search size={32} />
                        </div>
                        <p className="text-sm font-black text-zinc-900 mb-1">Ma'lumot topilmadi</p>
                        <p className="text-xs font-bold text-zinc-400">Filtrlarni o'zgartirib ko'ring</p>
                      </div>
                    )}
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

                      <div className="flex flex-col gap-6 p-6 bg-zinc-50 rounded-3xl border border-zinc-100 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                          <User size={120} />
                        </div>
                        
                        <div className="flex items-center gap-6">
                          <div className="w-24 h-24 bg-white p-1 rounded-3xl shadow-xl shadow-zinc-200/50 relative">
                            <div className="w-full h-full rounded-2xl overflow-hidden bg-zinc-100 flex items-center justify-center">
                               <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedHistoryRide.driver.name}`} alt="Driver" className="w-full h-full object-cover" />
                            </div>
                            <div className="absolute -bottom-2 -right-2 bg-[#FFD600] text-zinc-900 px-2 py-0.5 rounded-lg text-[10px] font-black italic shadow-lg border-2 border-white">
                                {selectedHistoryRide.type}
                            </div>
                          </div>
                          
                          <div className="flex-1">
                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">Haydovchi</p>
                            <h3 className="text-2xl font-black italic tracking-tighter text-zinc-900 leading-tight mb-2">{selectedHistoryRide.driver.name}</h3>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1 bg-white px-3 py-1 rounded-full border border-zinc-100 shadow-sm">
                                <Star size={12} fill="#FFD600" className="text-[#FFD600]" />
                                <span className="text-sm font-black italic">{selectedHistoryRide.driver.rating}</span>
                              </div>
                              <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                {selectedHistoryRide.driver.rides || "1.2k+"} safarlar
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm">
                            <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Avtomobil</p>
                            <p className="text-sm font-black text-zinc-900">{selectedHistoryRide.driver.car}</p>
                          </div>
                          <div className="bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm">
                            <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Rangi</p>
                            <p className="text-sm font-black text-zinc-900">{selectedHistoryRide.driver.color}</p>
                          </div>
                          <div className="bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm col-span-2 flex items-center justify-between">
                            <div>
                              <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Davlat raqami</p>
                              <div className="flex items-center gap-2">
                                <div className="w-1.5 h-6 bg-blue-600 rounded-sm"></div>
                                <p className="text-lg font-black tracking-widest text-zinc-900 uppercase">
                                  {selectedHistoryRide.driver.plate}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                               <motion.button 
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={(e) => { e.stopPropagation(); window.open(`tel:${selectedHistoryRide.driver.phone || '+998900000000'}`); }}
                                  className="w-12 h-12 bg-emerald-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-emerald-100"
                               >
                                 <Phone size={20} fill="currentColor" />
                               </motion.button>
                               <motion.button 
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={(e) => { e.stopPropagation(); setIsChatOpen(true); }}
                                  className="w-12 h-12 bg-[#FFD600] text-black rounded-xl flex items-center justify-center shadow-lg shadow-yellow-100"
                               >
                                 <MessageSquare size={20} fill="currentColor" />
                               </motion.button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {selectedHistoryRide.userRating && (
                        <div className="p-6 bg-[#FFD600]/10 rounded-3xl border border-[#FFD600]/20">
                          <p className="text-[9px] font-black text-[#B09400] uppercase tracking-widest mb-3">Sizning bahoingiz</p>
                          <div className="flex items-center gap-1 mb-3">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star 
                                key={star} 
                                size={14} 
                                fill={selectedHistoryRide.userRating >= star ? "#FFD600" : "none"} 
                                className={selectedHistoryRide.userRating >= star ? "text-[#FFD600]" : "text-zinc-300"} 
                              />
                            ))}
                          </div>
                          {selectedHistoryRide.userReview && (
                            <p className="text-sm font-bold text-zinc-900 italic">"{selectedHistoryRide.userReview}"</p>
                          )}
                        </div>
                      )}

                      <div className="space-y-3 px-2">
                        <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-3">To'lov tafsilotlari</p>
                        
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-zinc-500 font-bold">Asosiy narx (O'tirish)</span>
                          <span className="font-black text-zinc-900">{selectedHistoryRide.breakdown.base} s.</span>
                        </div>

                        <div className="flex justify-between items-center text-xs">
                          <div className="flex flex-col">
                            <span className="text-zinc-500 font-bold">Masofa narxi</span>
                            <span className="text-[10px] text-zinc-300">({selectedHistoryRide.distance})</span>
                          </div>
                          <span className="font-black text-zinc-900">{selectedHistoryRide.breakdown.dist} s.</span>
                        </div>

                        <div className="flex justify-between items-center text-xs">
                          <div className="flex flex-col">
                            <span className="text-zinc-500 font-bold">Safarda sarflangan vaqt</span>
                            <span className="text-[10px] text-zinc-300">({selectedHistoryRide.duration})</span>
                          </div>
                          <span className="font-black text-zinc-900">Bepul</span>
                        </div>

                        {selectedHistoryRide.breakdown.wait !== '0' && (
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-zinc-500 font-bold">Kutish vaqti</span>
                            <span className="font-black text-zinc-900">{selectedHistoryRide.breakdown.wait} s.</span>
                          </div>
                        )}

                        {selectedHistoryRide.breakdown.tolls && selectedHistoryRide.breakdown.tolls !== '0' && (
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-zinc-500 font-bold">Yo'l pullari (Tolls)</span>
                            <span className="font-black text-zinc-900">{selectedHistoryRide.breakdown.tolls} s.</span>
                          </div>
                        )}

                        {selectedHistoryRide.breakdown.promo !== '0' && (
                          <div className="flex justify-between items-center text-xs text-emerald-600 bg-emerald-50/50 p-2 rounded-lg border border-emerald-100/50 mt-2">
                            <span className="font-bold flex items-center gap-1">
                              <div className="w-1 h-1 rounded-full bg-emerald-500"></div>
                              Promo-kod chegirmasi
                            </span>
                            <span className="font-black">- {selectedHistoryRide.breakdown.promo} s.</span>
                          </div>
                        )}

                        <div className="pt-3 mt-4 border-t-2 border-dashed border-zinc-100 flex justify-between items-center">
                          <span className="text-sm font-black uppercase tracking-widest text-zinc-900">Jami to'lov</span>
                          <div className="text-right">
                            <span className="text-2xl font-black italic tracking-tighter text-zinc-900">{selectedHistoryRide.cost} s.</span>
                            <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider">Naqd pul orqali</p>
                          </div>
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
              <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center">
                <img src="https://img.icons8.com/color/96/taxi.png" alt="Count" className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">Yaqin atrofdagilar</p>
                <p className="text-xl font-black leading-none italic">14 ta haydovchi</p>
              </div>
            </motion.div>
          </div>
        )}

        {/* Map Controls */}
        <div className="absolute bottom-10 right-10 z-40 flex flex-col gap-2">
          {/* Traffic Legend Overlay */}
          <AnimatePresence>
            {showTraffic && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="absolute right-16 bottom-[140px] bg-white/90 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-zinc-100 min-w-[120px]"
              >
                <p className="text-[9px] font-black uppercase text-zinc-400 tracking-widest mb-3">Trafik holati</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-1 rounded-full bg-rose-500" />
                    <span className="text-[10px] font-bold text-zinc-600">Yomon</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-1 rounded-full bg-amber-500" />
                    <span className="text-[10px] font-bold text-zinc-600">O'rtacha</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-1 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-bold text-zinc-600">Yaxshi</span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-zinc-100">
                   <p className="text-[9px] font-black text-zinc-900 italic tracking-tighter uppercase">Intensivlik: {trafficFactor.toFixed(1)}x</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button 
            onClick={() => setShowTraffic(!showTraffic)}
            className={`w-12 h-12 rounded-xl shadow-lg flex items-center justify-center font-black border border-zinc-100 outline-none transition-all active:scale-95 mb-2 ${showTraffic ? 'bg-[#FFD600] text-zinc-900 border-[#FFD600]' : 'bg-white text-zinc-400 hover:bg-zinc-50'}`}
            title="Trafikni yoqish/o'chirish"
          >
            <Activity size={20} />
          </button>
          <button 
            onClick={() => setMapFiltersEnabled(!mapFiltersEnabled)}
            className={`w-12 h-12 rounded-xl shadow-lg flex items-center justify-center font-black border border-zinc-100 outline-none transition-all active:scale-95 mb-2 ${mapFiltersEnabled ? 'bg-zinc-900 text-[#FFD600]' : 'bg-white text-zinc-400 hover:bg-zinc-50'}`}
            title="Xarita effektlarini yoqish/o'chirish"
          >
            <Layers size={20} />
          </button>
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
        {isIncomingOrderModalOpen && incomingOrderDetails && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-[40px] w-full max-w-sm overflow-hidden shadow-2xl border border-zinc-100 flex flex-col"
            >
              <div className="bg-[#FFD600] p-8 text-center relative">
                <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-black/10 px-3 py-1 rounded-full">
                  <div className="w-1.5 h-1.5 bg-zinc-900 rounded-full animate-ping" />
                  <span className="text-[10px] font-black uppercase text-zinc-900 tracking-widest">Yangi buyurtma</span>
                </div>
                <motion.div 
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4 italic font-black text-white text-3xl shadow-xl"
                >
                  RM
                </motion.div>
                <h2 className="text-2xl font-black italic tracking-tighter text-zinc-900 uppercase">ZAKAS TUSHDI!</h2>
              </div>
              
              <div className="p-8">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center">
                    <User size={24} className="text-zinc-400" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">Mijoz</p>
                    <p className="text-lg font-black italic tracking-tight">{incomingOrderDetails.customerName}</p>
                  </div>
                </div>

                <div className="space-y-4 mb-10">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5"></div>
                    <div>
                      <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">Qayerdan</p>
                      <p className="text-sm font-bold text-zinc-900 leading-tight">{incomingOrderDetails.pickup}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-rose-500 mt-1.5"></div>
                    <div>
                      <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">Qayerga</p>
                      <p className="text-sm font-bold text-zinc-900 leading-tight">{incomingOrderDetails.destination}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-zinc-50 rounded-2xl p-4 flex flex-col items-center">
                    <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Narxi</span>
                    <span className="text-xl font-black italic text-zinc-900">{incomingOrderDetails.price}</span>
                  </div>
                  <div className="bg-zinc-50 rounded-2xl p-4 flex flex-col items-center">
                    <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Masofa</span>
                    <span className="text-xl font-black italic text-zinc-900">{incomingOrderDetails.distance}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => setIsIncomingOrderModalOpen(false)}
                    className="flex-1 py-4 text-zinc-400 font-black uppercase text-[10px] tracking-widest bg-zinc-100 rounded-2xl hover:bg-zinc-200 transition-colors"
                  >
                    Rad etish
                  </button>
                  <button 
                    onClick={acceptIncomingOrder}
                    className="flex-[2] py-4 bg-[#FFD600] text-zinc-900 font-black uppercase text-[12px] tracking-widest rounded-2xl shadow-xl shadow-yellow-100 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    Qabul qilish
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
                  <div className="relative z-10 w-24 h-24 bg-[#FFD600] rounded-[32px] flex items-center justify-center shadow-2xl shadow-yellow-400/50 overflow-hidden">
                    <img src="https://img.icons8.com/color/96/taxi.png" alt="Finding Taxi" className="w-16 h-16 object-contain" />
                  </div>
                </div>
                <h2 className="text-4xl font-black italic tracking-tighter mb-2">QIDIRILMOQDA...</h2>
                <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest">Eng yaqin haydovchini topyapmiz</p>
                <button 
                  onClick={() => setIsCancelModalOpen(true)}
                  className="mt-16 bg-zinc-900 text-white px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-transform"
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
                {/* Real-time Status Badge */}
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6"
                >
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl border ${
                    rideStatus === 'arriving' ? 'bg-yellow-50 text-yellow-600 border-yellow-100' :
                    rideStatus === 'on_way' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                    rideStatus === 'arrived' ? 'bg-zinc-900 text-[#FFD600] border-zinc-800' :
                    'bg-white text-zinc-400 border-zinc-100'
                  }`}>
                    <div className={`w-2.5 h-2.5 rounded-full ${
                      rideStatus === 'arriving' ? 'bg-yellow-500 animate-pulse' :
                      rideStatus === 'on_way' ? 'bg-emerald-500 animate-bounce' :
                      rideStatus === 'arrived' ? 'bg-[#FFD600]' :
                      'bg-zinc-200'
                    }`} />
                    {rideStatus === 'arriving' ? 'Haydovchi yetib kelmoqda' :
                     rideStatus === 'on_way' ? 'Siz yo\'ldasiz' :
                     rideStatus === 'arrived' ? 'Haydovchi yetib keldi' : 'Kutilshmoqda'}
                  </div>
                </motion.div>

                <div className="w-32 h-24 rounded-[32px] flex items-center justify-center mb-10 shadow-2xl transition-all p-4 bg-white border-4" style={{ borderColor: carColor }}>
                  <img 
                    src={carModel === 'suv' ? "https://img.icons8.com/color/96/suv.png" : carModel === 'electric' ? "https://img.icons8.com/color/96/tesla-model-x.png" : "https://img.icons8.com/color/96/sedan.png"} 
                    alt="Car Found" 
                    className="w-20 h-20 object-contain" 
                  />
                </div>
                <h2 className="text-5xl font-black italic tracking-tighter mb-4">TOPILDI!</h2>
                <p className="text-zinc-400 mb-10 font-bold leading-tight">
                  {assignedDriverId !== null && drivers[assignedDriverId].carName} - {assignedDriverId !== null && drivers[assignedDriverId].colorName} <br />
                  <span className="text-zinc-900 font-black text-2xl tracking-tighter italic">{assignedDriverId !== null && drivers[assignedDriverId].plate}</span>
                </p>
                
                <div className="w-full bg-zinc-50 rounded-[40px] p-6 mb-8 border border-zinc-100 shadow-sm transition-all hover:bg-white hover:shadow-xl hover:shadow-zinc-100">
                  <div className="flex items-center gap-5 mb-8">
                    <div className="w-24 h-24 bg-zinc-200 rounded-[32px] overflow-hidden border-4 border-white shadow-xl relative">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${assignedDriverId}`} alt="Driver" className="w-full h-full object-cover" />
                      <div className="absolute top-1 right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
                    </div>
                    <div className="text-left flex-1">
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-1">Haydovchi</p>
                      <h3 className="text-2xl font-black italic tracking-tighter uppercase mb-2">
                        {['Javohir', 'Alisher', 'Sanjar', 'Rustam', 'Murod'][Math.floor(Math.random() * 5)]} R.
                      </h3>
                      <div className="flex items-center gap-2">
                        <StarRating rating={4.98} size={10} className="bg-zinc-900 px-3 py-1 rounded-full text-[#FFD600] w-fit shadow-lg shadow-zinc-200" />
                        <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{Math.floor(1000 + Math.random() * 4000)} safar</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-8">
                    <div className="bg-white rounded-2xl p-4 border border-zinc-100 shadow-sm flex flex-col items-center">
                      <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1 self-start">Avtomobil</p>
                      <p className="text-sm font-black italic text-center">
                        {assignedDriverId !== null && drivers[assignedDriverId].carName} ({assignedDriverId !== null && drivers[assignedDriverId].colorName})
                      </p>
                    </div>
                    <div className="bg-zinc-900 rounded-2xl p-4 shadow-xl border border-zinc-800 flex flex-col items-center">
                      <p className="text-[9px] font-black text-zinc-400/60 uppercase tracking-widest mb-1 self-start">Davlat raqami</p>
                      <p className="text-sm font-black text-[#FFD600] italic tracking-tight">{assignedDriverId !== null && drivers[assignedDriverId].plate}</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <motion.button 
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => window.open(`tel:${activeDriverPhone}`)}
                      className="flex-1 flex items-center justify-center gap-3 h-16 bg-emerald-500 text-white rounded-2xl shadow-xl shadow-emerald-100 transition-all font-black uppercase text-[10px] tracking-widest"
                    >
                      <Phone size={20} fill="currentColor" />
                    </motion.button>
                    <motion.button 
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setIsChatOpen(true)}
                      className="flex-1 flex items-center justify-center gap-3 h-16 bg-[#FFD600] text-black rounded-2xl shadow-xl shadow-yellow-100 transition-all font-black uppercase text-[10px] tracking-widest"
                    >
                      <MessageSquare size={20} fill="currentColor" />
                    </motion.button>
                    <motion.button 
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setIsEmergencyModalOpen(true)}
                      className="flex-[0.6] flex items-center justify-center h-16 bg-rose-500 text-white rounded-2xl shadow-xl shadow-rose-100 transition-all font-black uppercase text-[10px] tracking-widest"
                      title="Favqulodda holat"
                    >
                      <AlertTriangle size={24} />
                    </motion.button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 w-full mb-8">
                  <div className="bg-zinc-50 rounded-2xl p-4 flex flex-col items-center">
                    <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Kutish vaqti</span>
                    <span className="text-xl font-black italic">
                      {rideStatus === 'arrived' ? 'Keldi' : rideStatus === 'on_way' ? '--' : '4 daqiqa'}
                    </span>
                  </div>
                  <div className="bg-zinc-50 rounded-2xl p-4 flex flex-col items-center">
                    <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Rangi</span>
                    <span className="text-xl font-black italic">OQ</span>
                  </div>
                </div>

                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsCancelModalOpen(true)}
                  className="w-full h-14 text-rose-500 font-black uppercase text-[10px] tracking-widest bg-rose-50 rounded-2xl hover:bg-rose-100 transition-colors"
                >
                  Safarni bekor qilish
                </motion.button>

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
              <div 
                ref={scrollRef}
                className="flex-1 p-6 overflow-y-auto space-y-4 no-scrollbar bg-zinc-50 scroll-smooth"
              >
                <div className="flex justify-center">
                  <span className="text-[9px] font-black uppercase text-zinc-400 tracking-[0.2em] bg-zinc-100 px-4 py-1.5 rounded-full">Bugun</span>
                </div>
                
                {chatMessages.map((msg) => (
                  <div 
                    key={`chat-msg-${msg.id}`}
                    className={`flex flex-col gap-1 ${msg.sender === 'user' ? 'items-end ml-auto' : 'items-start'} max-w-[80%]`}
                  >
                    <div className={`p-4 rounded-2xl text-sm font-bold leading-relaxed shadow-sm ${
                      msg.sender === 'user' 
                        ? 'bg-zinc-900 rounded-tr-none text-white shadow-xl shadow-zinc-200' 
                        : 'bg-white rounded-tl-none border border-zinc-100 text-zinc-600'
                    }`}>
                      {msg.text}
                    </div>
                    <div className="flex items-center gap-1.5 px-1">
                      {msg.sender === 'user' && (
                        <>
                          <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">O'qildi</span>
                          <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest leading-none">•</span>
                        </>
                      )}
                      <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{msg.time}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Chat Input */}
              <div className="p-4 bg-white border-t border-zinc-100 flex gap-3">
                <div className="flex-1 relative">
                  <input 
                    type="text" 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Xabar yozing..."
                    className="w-full bg-zinc-100 border-none rounded-2xl px-6 py-4 text-sm font-bold placeholder:text-zinc-400 outline-none focus:ring-2 focus:ring-[#FFD600]"
                  />
                  <button 
                    onClick={handleSendMessage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-300 hover:text-zinc-500 transition-colors"
                  >
                    <Navigation size={18} fill="currentColor" className="rotate-90" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Booking Successful Modal */}
        <AnimatePresence>
          {isBookingConfirmedModalOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-[120] flex items-center justify-center p-6"
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="bg-white rounded-[48px] w-full max-w-md overflow-hidden shadow-2xl relative border border-zinc-100"
              >
                <div className="bg-[#FFD600] p-10 text-center relative">
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 12, delay: 0.2 }}
                    className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl"
                  >
                    <Check size={40} className="text-zinc-900" />
                  </motion.div>
                  <h2 className="text-3xl font-black italic tracking-tighter text-zinc-900 mb-1 uppercase">Muvaffaqiyatli!</h2>
                  <p className="text-zinc-800/60 font-black uppercase text-[10px] tracking-widest italic">Sizning buyurtmangiz qabul qilindi</p>
                  
                  {/* Decorative Sparkles */}
                  <div className="absolute top-10 left-10 w-2 h-2 bg-white rounded-full animate-ping" />
                  <div className="absolute bottom-10 right-10 w-2 h-2 bg-white rounded-full animate-ping delay-500" />
                </div>

                <div className="p-10 space-y-8">
                  {/* Trip Details Summary */}
                  <div className="space-y-6">
                    <div className="flex gap-6">
                       <div className="flex flex-col items-center gap-1 shrink-0 pt-1">
                          <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                          <div className="w-0.5 h-12 bg-zinc-100 rounded-full" />
                          <div className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
                       </div>
                       <div className="flex-1 space-y-8">
                          <div className="text-left">
                            <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-1">Jo'nash joyi</p>
                            <p className="text-sm font-black text-zinc-900 truncate">{pickup}</p>
                          </div>
                          <div className="text-left">
                            <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-1">Manzil</p>
                            <p className="text-sm font-black text-zinc-900 truncate">{destination}</p>
                          </div>
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-zinc-50 rounded-3xl p-5 border border-zinc-100 flex flex-col items-center">
                        <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center mb-3 shadow-sm">
                           <img 
                            src={carModel === 'suv' ? "https://img.icons8.com/color/96/suv.png" : carModel === 'electric' ? "https://img.icons8.com/color/96/tesla-model-x.png" : "https://img.icons8.com/color/96/sedan.png"} 
                            alt="Car" 
                            className="w-6 h-6 object-contain" 
                          />
                        </div>
                        <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Avtomobil</p>
                        <p className="text-xs font-black italic text-zinc-900">
                          {assignedDriverId !== null ? drivers[assignedDriverId].carName : 'Mashina'}
                        </p>
                      </div>
                      <div className="bg-zinc-900 rounded-3xl p-5 shadow-xl flex flex-col items-center justify-center">
                        <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center mb-3">
                           <Clock size={18} className="text-[#FFD600]" />
                        </div>
                        <p className="text-[9px] font-black text-zinc-400/60 uppercase tracking-widest mb-1">Yetib kelish</p>
                        <p className="text-sm font-black text-[#FFD600] italic tracking-tight">
                          {getETA(Math.max(1, Math.round(3 * trafficFactor)))}
                        </p>
                      </div>
                    </div>

                    <div className="bg-zinc-50 rounded-[32px] p-6 border-2 border-zinc-100/50 flex items-center justify-between">
                       <p className="text-xs font-black uppercase text-zinc-400 tracking-widest">Umumiy xizmat haqi</p>
                       <p className="text-2xl font-black italic tracking-tighter text-zinc-900">
                         {getPrice({
                            economy: '12.5',
                            comfort: '18.0',
                            business: '32.0',
                            minivan: '25.0',
                            cargo: '45.0'
                          }[activeTier] || '12.5')} s.
                       </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setIsBookingConfirmedModalOpen(false)}
                      className="w-full h-16 bg-zinc-900 text-white rounded-[24px] font-black uppercase text-[10px] tracking-widest shadow-2xl transition-all"
                    >
                      Batafsil ko'rish
                    </motion.button>
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setIsBookingConfirmedModalOpen(false)}
                      className="w-full h-16 bg-zinc-50 text-zinc-400 rounded-[24px] font-black uppercase text-[10px] tracking-widest border border-zinc-100 transition-all"
                    >
                      Tayyor
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cancel Confirmation Modal */}
        <AnimatePresence>
          {isCancelModalOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-6"
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl"
              >
                <div className="p-8 text-center">
                  <div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertTriangle size={32} />
                  </div>
                  <h3 className="text-xl font-black text-zinc-900 mb-2">Safar bekor qilinsinmi?</h3>
                  <p className="text-zinc-500 font-medium">Siz haqiqatdan ham ushbu buyurtmani bekor qilmoqchimisiz?</p>
                </div>
                <div className="flex border-t border-zinc-100">
                  <button 
                    onClick={() => setIsCancelModalOpen(false)}
                    className="flex-1 py-5 text-sm font-black text-zinc-400 hover:bg-zinc-50 transition-colors uppercase tracking-widest"
                  >
                    Yo'q
                  </button>
                  <button 
                    onClick={handleInitialCancel}
                    className="flex-1 py-5 text-sm font-black text-rose-500 hover:bg-rose-50 transition-colors border-l border-zinc-100 uppercase tracking-widest"
                  >
                    Ha, bekor qil
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Cancellation Reasons Modal */}
        <AnimatePresence>
          {isCancellationReasonsOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[111] flex items-center justify-center p-6"
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="bg-white rounded-[40px] w-full max-w-sm overflow-hidden shadow-2xl flex flex-col"
              >
                <div className="p-8 pb-4">
                  <h3 className="text-2xl font-black italic tracking-tighter text-zinc-900 mb-2 uppercase">Bekor qilish sababi</h3>
                  <p className="text-zinc-500 text-sm font-bold leading-tight">Xizmatimizni yaxshilashimiz uchun sababni ko'rsatishingizni iltimos qilamiz.</p>
                </div>

                <div className="px-8 pb-8 space-y-3 overflow-y-auto max-h-[60vh] no-scrollbar">
                  {[
                    "Kutish vaqti uzoq",
                    "Haydovchi boshqa tomonga ketmoqda",
                    "Avtomobil toza emas yoki yomon holatda",
                    "Narxi juda baland",
                    "Rejam o'zgardi",
                    "Xato buyurtma berdim"
                  ].map((reason) => (
                    <button 
                      key={reason}
                      onClick={() => setCancellationReason(reason)}
                      className={`w-full p-4 rounded-2xl text-sm font-bold text-left transition-all border ${
                        cancellationReason === reason 
                          ? 'bg-[#FFD600] border-[#FFD600] text-zinc-900 shadow-lg shadow-yellow-100 scale-[1.02]' 
                          : 'bg-zinc-50 border-zinc-100 text-zinc-600 hover:bg-zinc-100'
                      }`}
                    >
                      {reason}
                    </button>
                  ))}

                  <div className="mt-6 pt-4 border-t border-zinc-100">
                    <button 
                      disabled={!cancellationReason}
                      onClick={() => cancelRide(cancellationReason)}
                      className={`w-full py-5 rounded-3xl font-black uppercase text-[12px] tracking-widest shadow-xl transition-all ${
                        cancellationReason 
                          ? 'bg-zinc-900 text-white shadow-zinc-200' 
                          : 'bg-zinc-100 text-zinc-300 cursor-not-allowed'
                      }`}
                    >
                      Tasdiqlash
                    </button>
                    <button 
                      onClick={() => setIsCancellationReasonsOpen(false)}
                      className="w-full mt-2 py-3 text-zinc-400 font-black uppercase text-[9px] tracking-widest hover:text-zinc-600 transition-colors text-center"
                    >
                      Ortga
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Emergency Modal */}
        <AnimatePresence>
          {isEmergencyModalOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-rose-500/20 backdrop-blur-md z-[200] flex items-center justify-center p-6"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white rounded-[40px] w-full max-sm overflow-hidden shadow-2xl border border-rose-100 flex flex-col"
              >
                <div className="bg-rose-500 p-8 text-center relative">
                  <div className="absolute top-4 right-4">
                    <button 
                      onClick={() => setIsEmergencyModalOpen(false)}
                      className="w-8 h-8 bg-black/10 rounded-full flex items-center justify-center text-white hover:bg-black/20"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <motion.div 
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-rose-500 shadow-xl"
                  >
                    <AlertTriangle size={40} />
                  </motion.div>
                  <h2 className="text-2xl font-black italic tracking-tighter text-white uppercase">FAVQULODDA HOLAT</h2>
                  <p className="text-rose-100 text-[10px] font-bold uppercase tracking-widest mt-2 px-8">Faqat hayotingiz xavf ostida bo'lganda foydalaning</p>
                </div>
                
                <div className="p-8 space-y-4">
                  <button 
                    onClick={() => { window.open('tel:102'); setIsEmergencyModalOpen(false); }}
                    className="w-full flex items-center justify-between p-5 bg-rose-50 rounded-2xl border border-rose-100 hover:bg-rose-100 transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-rose-500 text-white rounded-xl flex items-center justify-center">
                        <Activity size={20} />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-black text-rose-600 uppercase tracking-tighter">Politsiyaga qo'ng'iroq</p>
                        <p className="text-[9px] font-bold text-rose-400 uppercase tracking-widest">Qisqa raqam: 102</p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-rose-300 group-hover:translate-x-1 transition-transform" />
                  </button>

                  <button 
                    onClick={() => { window.open('tel:103'); setIsEmergencyModalOpen(false); }}
                    className="w-full flex items-center justify-between p-5 bg-rose-50 rounded-2xl border border-rose-100 hover:bg-rose-100 transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-rose-500 text-white rounded-xl flex items-center justify-center">
                        <AlertTriangle size={20} />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-black text-rose-600 uppercase tracking-tighter">Tez yordam</p>
                        <p className="text-[9px] font-bold text-rose-400 uppercase tracking-widest">Qisqa raqam: 103</p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-rose-300 group-hover:translate-x-1 transition-transform" />
                  </button>

                  <button 
                    onClick={() => { alert('Joylashuvingiz yaqinlaringizga yuborildi.'); setIsEmergencyModalOpen(false); }}
                    className="w-full flex items-center justify-between p-5 bg-zinc-50 rounded-2xl border border-zinc-100 hover:bg-zinc-100 transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-zinc-900 text-[#FFD600] rounded-xl flex items-center justify-center">
                        <Navigation size={20} fill="currentColor" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-black text-zinc-900 uppercase tracking-tighter">Joylashuvni ulashish</p>
                        <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Ishonchli kontaktlarga</p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-zinc-300 group-hover:translate-x-1 transition-transform" />
                  </button>

                  <button 
                    onClick={() => setIsEmergencyModalOpen(false)}
                    className="w-full py-5 text-zinc-400 font-black uppercase text-[10px] tracking-widest hover:text-zinc-600 transition-colors"
                  >
                    Bekor qilish
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Rating Modal */}
        <AnimatePresence>
          {isRatingModalOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-[210] flex items-center justify-center p-6"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white rounded-[40px] w-full max-w-sm overflow-hidden shadow-2xl flex flex-col"
              >
                <div className="bg-[#FFD600] p-10 text-center relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
                     <Star size={120} fill="currentColor" />
                   </div>
                  <motion.div 
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    className="w-24 h-24 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-6 text-[#FFD600] shadow-xl border-4 border-white"
                  >
                    <Star size={48} fill="currentColor" />
                  </motion.div>
                  <h2 className="text-3xl font-black italic tracking-tighter text-zinc-900 uppercase leading-none">SAFAR YAKUNLANDI</h2>
                  <p className="text-zinc-700 text-[10px] font-bold uppercase tracking-widest mt-4">Xizmatimiz sizga yoqdimi?</p>
                </div>
                
                <div className="p-10 text-center">
                  <div className="flex items-center justify-center gap-2 mb-8">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <motion.button
                        key={star}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setCurrentRating(star)}
                        className={`p-1 transition-all ${currentRating >= star ? 'text-[#FFD600]' : 'text-zinc-200'}`}
                      >
                        <Star size={40} fill={currentRating >= star ? "currentColor" : "none"} strokeWidth={currentRating >= star ? 0 : 2} />
                      </motion.button>
                    ))}
                  </div>

                  <div className="mb-8">
                    <textarea 
                      value={rideReview}
                      onChange={(e) => setRideReview(e.target.value)}
                      placeholder="Fikringizni qoldiring (ixtiyoriy)..."
                      className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl p-5 text-sm font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#FFD600] transition-all resize-none h-28"
                    />
                  </div>

                  <button 
                    disabled={currentRating === 0}
                    onClick={submitRating}
                    className={`w-full py-5 rounded-2xl font-black uppercase text-[12px] tracking-widest shadow-xl transition-all ${
                      currentRating > 0 
                        ? 'bg-zinc-900 text-white shadow-zinc-200 hover:scale-[1.02] active:scale-[0.98]' 
                        : 'bg-zinc-100 text-zinc-300 cursor-not-allowed'
                    }`}
                  >
                    YUBORISH
                  </button>
                  <button 
                    onClick={skipRating}
                    className="mt-4 text-zinc-400 font-bold text-[10px] uppercase tracking-widest hover:text-zinc-600 transition-colors"
                  >
                    Hozir emas
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </AnimatePresence>
    </div>
  );
}
