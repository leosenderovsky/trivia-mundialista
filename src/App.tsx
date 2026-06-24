import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  HelpCircle, 
  Trophy, 
  Plus, 
  Minus, 
  Maximize2, 
  Settings, 
  Check, 
  X, 
  Award, 
  Info,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- DATA STRUCTURE ---
const triviaData: Record<string, Record<number, { p: string; r: string }>> = {
  "Selección Argentina": {
    100: { p: "¿En qué año y Mundial debutó Lionel Messi en una Copa del Mundo ingresando frente a Serbia y Montenegro?", r: "Alemania 2006" },
    200: { p: "¿Quién fue el director técnico que sacó campeona a la Selección Argentina en el Mundial de México 1986?", r: "Carlos Salvador Bilardo" },
    300: { p: "¿Qué jugador argentino anotó el gol decisivo del 3-2 en la final de México 1986 tras una asistencia de Maradona?", r: "Jorge Burruchaga" },
    400: { p: "¿Quién fue el arquero argentino que se convirtió en héroe en Italia 1990 al atajar penales clave en cuartos y semis?", r: "Sergio Goycochea" }
  },
  "Estadios y Países": {
    100: { p: "¿En qué legendario estadio de Río de Janeiro se jugaron las finales de los Mundiales de 1950 y 2014?", r: "Estadio Maracaná" },
    200: { p: "¿En qué país europeo se jugó el Mundial de 1998, cuya final ganó el equipo local liderado por Zinedine Zidane?", r: "Francia" },
    300: { p: "¿Qué dos países asiáticos organizaron de forma conjunta por primera vez en la historia un Mundial en el año 2002?", r: "Corea del Sur y Japón" },
    400: { p: "¿En qué país se jugó el Mundial de 1970, recordado por coronar al Brasil de Pelé en el Estadio Azteca?", r: "México" }
  },
  "Ídolos y leyendas": {
    100: { p: "¿Quién es el máximo goleador de la historia de los Mundiales con un total de 16 goles anotados para Alemania?", r: "Miroslav Klose" },
    200: { p: "¿Qué delantero brasilero, apodado 'El Fenómeno', metió los dos goles en la final de Corea-Japón 2002 contra Alemania?", r: "Ronaldo Nazário" },
    300: { p: "¿Qué delantero francés ostenta el récord imbatible de haber metido más goles (13) en un solo Mundial (Suecia 1958)?", r: "Just Fontaine" },
    400: { p: "¿Qué crack de Países Bajos, considerado el padre del 'Fútbol Total', brilló en el Mundial de 1974 usando el número 14?", r: "Johan Cruyff" }
  },
  "Campeones": {
    100: { p: "¿Qué país europeo ganó su primer y único mundial en Sudáfrica 2010 ganándole la final a Países Bajos?", r: "España" },
    200: { p: "¿Qué selección sudamericana logró el histórico 'Maracanazo' al ganarle la final del Mundial de 1950 a Brasil en su casa?", r: "Uruguay" },
    300: { p: "¿Qué selección europea se consagró tetracampeona del mundo tras ganar el Mundial de Alemania 2006 por penales?", r: "Italia" },
    400: { p: "¿Qué selección llegó a tres finales del mundo (1974, 1978 y 2010) pero las perdió todas, siendo apodada 'El campeón sin corona'?", r: "Países Bajos (Holanda)" }
  }
};

const categories = Object.keys(triviaData);
const pointValues = [100, 200, 300, 400];

// --- NATIVE SOUND SYNTHESIZER ---
class SoundEffects {
  private static ctx: AudioContext | null = null;
  private static muted: boolean = false;

  private static getCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      try {
        this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (e) {
        console.error("AudioContext initialization failed", e);
      }
    }
    return this.ctx;
  }

  public static toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  public static isMuted() {
    return this.muted;
  }

  public static playSelect() {
    if (this.muted) return;
    const ctx = this.getCtx();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(550, now + 0.25);
      
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now);
      osc.stop(now + 0.25);
    } catch (e) {}
  }

  public static playReveal() {
    if (this.muted) return;
    const ctx = this.getCtx();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const notes = [329.63, 440.00, 554.37, 659.25]; // E4, A4, C#5, E5 (A major chord)
      notes.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + i * 0.04);
        
        gain.gain.setValueAtTime(0.08, now + i * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35 + i * 0.04);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(now + i * 0.04);
        osc.stop(now + 0.45 + i * 0.04);
      });
    } catch (e) {}
  }

  public static playSuccess() {
    if (this.muted) return;
    const ctx = this.getCtx();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(f, now + i * 0.06);
        
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, now + i * 0.06);
        filter.frequency.exponentialRampToValueAtTime(2800, now + i * 0.06 + 0.12);

        gain.gain.setValueAtTime(0.06, now + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.18);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(now + i * 0.06);
        osc.stop(now + i * 0.06 + 0.22);
      });
    } catch (e) {}
  }

  public static playError() {
    if (this.muted) return;
    const ctx = this.getCtx();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.linearRampToValueAtTime(80, now + 0.35);
      
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.35);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {}
  }

  public static playWhistle() {
    if (this.muted) return;
    const ctx = this.getCtx();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(1300, now);
      osc1.frequency.linearRampToValueAtTime(1400, now + 0.15);
      osc1.frequency.linearRampToValueAtTime(1350, now + 0.3);
      
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1315, now);
      osc2.frequency.linearRampToValueAtTime(1415, now + 0.15);
      osc2.frequency.linearRampToValueAtTime(1365, now + 0.3);
      
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.25);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      
      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.45);
      osc2.stop(now + 0.45);
    } catch (e) {}
  }
}

export default function App() {
  // --- STATE ---
  const [scoreA, setScoreA] = useState<number>(0);
  const [scoreB, setScoreB] = useState<number>(0);
  const [spentQuestions, setSpentQuestions] = useState<Record<string, boolean>>({});
  const [selectedQuestion, setSelectedQuestion] = useState<{
    category: string;
    value: number;
    p: string;
    r: string;
  } | null>(null);
  
  const [showAnswer, setShowAnswer] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  
  // Modals / Overlays
  const [showRules, setShowRules] = useState<boolean>(false);
  const [showFinalResults, setShowFinalResults] = useState<boolean>(false);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  
  // Quick score adjustments overlays
  const [showQuickA, setShowQuickA] = useState<boolean>(false);
  const [showQuickB, setShowQuickB] = useState<boolean>(false);
  
  // Custom manual inputs
  const [manualScoreA, setManualScoreA] = useState<string>("0");
  const [manualScoreB, setManualScoreB] = useState<string>("0");
  const [isEditingA, setIsEditingA] = useState<boolean>(false);
  const [isEditingB, setIsEditingB] = useState<boolean>(false);

  // Confetti particles for final celebration
  const [confetti, setConfetti] = useState<Array<{ id: number; left: number; color: string; size: number; delay: number }>>([]);

  // Load scores and spent states from localStorage for game persistence
  useEffect(() => {
    const savedScoreA = localStorage.getItem('tm_scoreA');
    const savedScoreB = localStorage.getItem('tm_scoreB');
    const savedSpent = localStorage.getItem('tm_spent');
    const savedMuted = localStorage.getItem('tm_muted');

    if (savedScoreA) setScoreA(parseInt(savedScoreA, 10));
    if (savedScoreB) setScoreB(parseInt(savedScoreB, 10));
    if (savedSpent) setSpentQuestions(JSON.parse(savedSpent));
    if (savedMuted === 'true') {
      setIsMuted(true);
      SoundEffects.toggleMute(); // initialize muted inside class
    }
  }, []);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('tm_scoreA', scoreA.toString());
  }, [scoreA]);

  useEffect(() => {
    localStorage.setItem('tm_scoreB', scoreB.toString());
  }, [scoreB]);

  useEffect(() => {
    localStorage.setItem('tm_spent', JSON.stringify(spentQuestions));
  }, [spentQuestions]);

  // Generate confetti on final winner screen
  useEffect(() => {
    if (showFinalResults) {
      const colors = ['#74ACDF', '#FFFFFF', '#ffd700', '#38bdf8', '#fbbf24']; // Celeste, Blanco, Dorado y variantes brillantes
      const particles = Array.from({ length: 120 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 10 + 5,
        delay: Math.random() * 3
      }));
      setConfetti(particles);
    } else {
      setConfetti([]);
    }
  }, [showFinalResults]);

  // --- ACTIONS ---
  const handleToggleMute = () => {
    const currentMute = SoundEffects.toggleMute();
    setIsMuted(currentMute);
    localStorage.setItem('tm_muted', currentMute.toString());
  };

  const handleTileClick = (category: string, value: number) => {
    const key = `${category}-${value}`;
    if (spentQuestions[key]) return;

    SoundEffects.playSelect();
    const q = triviaData[category]?.[value];
    if (q) {
      setSelectedQuestion({
        category,
        value,
        p: q.p,
        r: q.r
      });
      setShowAnswer(false);
    }
  };

  const handleRevealAnswer = () => {
    SoundEffects.playReveal();
    setShowAnswer(true);
  };

  const handleCloseQuestion = (wasAnswered: boolean, awardTo?: 'A' | 'B' | null, isPositive: boolean = true) => {
    if (selectedQuestion) {
      const key = `${selectedQuestion.category}-${selectedQuestion.value}`;
      
      // Update spent questions
      setSpentQuestions(prev => ({
        ...prev,
        [key]: true
      }));

      // Award points if requested
      if (awardTo === 'A') {
        const delta = selectedQuestion.value;
        setScoreA(prev => isPositive ? prev + delta : prev - delta);
        if (isPositive) SoundEffects.playSuccess();
        else SoundEffects.playError();
      } else if (awardTo === 'B') {
        const delta = selectedQuestion.value;
        setScoreB(prev => isPositive ? prev + delta : prev - delta);
        if (isPositive) SoundEffects.playSuccess();
        else SoundEffects.playError();
      } else {
        SoundEffects.playSelect();
      }

      setSelectedQuestion(null);
      setShowAnswer(false);
    }
  };

  const handleResetGame = () => {
    SoundEffects.playWhistle();
    setScoreA(0);
    setScoreB(0);
    setSpentQuestions({});
    setSelectedQuestion(null);
    setShowAnswer(false);
    setShowResetConfirm(false);
    setShowFinalResults(false);
    localStorage.removeItem('tm_scoreA');
    localStorage.removeItem('tm_scoreB');
    localStorage.removeItem('tm_spent');
  };

  const handleScoreChange = (team: 'A' | 'B', action: 'add' | 'sub', amount: number) => {
    if (action === 'add') {
      if (team === 'A') setScoreA(prev => prev + amount);
      if (team === 'B') setScoreB(prev => prev + amount);
      SoundEffects.playSuccess();
    } else {
      if (team === 'A') setScoreA(prev => prev - amount);
      if (team === 'B') setScoreB(prev => prev - amount);
      SoundEffects.playError();
    }
    setShowQuickA(false);
    setShowQuickB(false);
  };

  const handleManualScoreSubmit = (team: 'A' | 'B') => {
    if (team === 'A') {
      const parsed = parseInt(manualScoreA, 10);
      if (!isNaN(parsed)) setScoreA(parsed);
      setIsEditingA(false);
    } else {
      const parsed = parseInt(manualScoreB, 10);
      if (!isNaN(parsed)) setScoreB(parsed);
      setIsEditingB(false);
    }
    SoundEffects.playSuccess();
  };

  const handleFinalizeGame = () => {
    SoundEffects.playWhistle();
    setShowFinalResults(true);
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen();
    }
  };

  const totalQuestions = categories.length * pointValues.length;
  const spentCount = Object.keys(spentQuestions).length;
  const progressPercent = Math.min(100, Math.round((spentCount / totalQuestions) * 100));

  // Determine winners
  const winnerText = scoreA > scoreB 
    ? '¡Gana el Grupo A!' 
    : scoreB > scoreA 
      ? '¡Gana el Grupo B!' 
      : '¡Empate Histórico!';

  return (
    <div id="trivia-app-root" className="stadium-bg text-white min-h-screen font-sans flex flex-col overflow-x-hidden relative select-none">
      
      {/* Decorative Atmospheric Lights */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-cyan-500/5 blur-3xl rounded-full pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 blur-3xl rounded-full pointer-events-none"></div>
      
      {/* --- HEADER NAVIGATION BAR --- */}
      <header className="border-b border-cyan-950/40 bg-[#04081c]/90 backdrop-blur-md px-6 py-4 flex items-center justify-between z-40 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="w-3.5 h-3.5 bg-cyan-400 rounded-full animate-pulse box-glow-cyan-strong"></div>
          <span className="font-anton text-2xl tracking-tight text-white glow-cyan uppercase">TRIVIA MUNDIALISTA</span>
        </div>
        
        {/* Navigation / Rules triggers */}
        <nav className="hidden md:flex items-center gap-8 text-sm tracking-wider font-semibold text-slate-300">
          <button 
            onClick={() => { SoundEffects.playSelect(); window.scrollTo({ top: 300, behavior: 'smooth' }); }} 
            className="hover:text-cyan-400 transition-colors uppercase border-b-2 border-transparent hover:border-cyan-400 pb-1"
          >
            Tablero
          </button>
          <button 
            onClick={() => { SoundEffects.playSelect(); setShowRules(true); }} 
            className="hover:text-cyan-400 transition-colors uppercase flex items-center gap-1.5 border-b-2 border-transparent hover:border-cyan-400 pb-1"
          >
            <Info className="w-4 h-4 text-cyan-400" /> Reglas
          </button>
        </nav>

        {/* Toolbar controls */}
        <div className="flex items-center gap-3">
          {/* Progress gauge */}
          <div className="hidden lg:flex flex-col items-end mr-2">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Partido jugado</span>
            <div className="flex items-center gap-2">
              <div className="w-24 bg-slate-800 h-1.5 border border-slate-700">
                <div className="bg-cyan-400 h-full transition-all duration-300" style={{ width: `${progressPercent}%` }}></div>
              </div>
              <span className="text-xs font-mono text-cyan-400 font-bold">{spentCount}/{totalQuestions}</span>
            </div>
          </div>

          <button 
            onClick={handleToggleMute} 
            className="p-2 border border-cyan-800/60 bg-[#0c1836] hover:bg-cyan-950/60 transition-all text-cyan-400 cursor-pointer"
            title={isMuted ? "Activar Sonido" : "Silenciar"}
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>

          <button 
            onClick={toggleFullScreen}
            className="p-2 border border-cyan-800/60 bg-[#0c1836] hover:bg-cyan-950/60 transition-all text-cyan-400 cursor-pointer hidden sm:block"
            title="Pantalla Completa"
          >
            <Maximize2 className="w-5 h-5" />
          </button>

          <button 
            onClick={() => { SoundEffects.playSelect(); setShowResetConfirm(true); }}
            className="p-2 border border-red-900/60 bg-[#1f0e15] hover:bg-red-950/60 transition-all text-red-400 cursor-pointer"
            title="Reiniciar Trivia"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button 
            onClick={handleFinalizeGame}
            className="bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-anton text-sm tracking-wider uppercase px-4 py-2 transition-all cursor-pointer font-bold border-b-4 border-cyan-700 active:border-b-0 hover:translate-y-[2px]"
          >
            Finalizar Juego
          </button>
        </div>
      </header>

      {/* --- MAIN HERO CONTENT --- */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 md:py-8 flex flex-col gap-6 md:gap-8 justify-center">
        
        {/* --- CABECERA INTEGRADA DEL SITIO (HERO BANNER) --- */}
        <section className="relative w-full bg-gradient-to-br from-[#060e2b] via-[#04081c]/95 to-[#02040d] border border-cyan-500/40 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden box-glow-cyan">
          
          {/* Cyber lights in background */}
          <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-64 h-64 bg-cyan-500/10 blur-3xl rounded-full pointer-events-none"></div>
          <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-64 h-64 bg-amber-500/5 blur-3xl rounded-full pointer-events-none"></div>
          
          {/* LADO IZQUIERDO: TÍTULO MASIVO */}
          <div className="flex-1 text-center md:text-left z-10 flex flex-col justify-center">
            <div className="flex items-center justify-center md:justify-start gap-1.5 mb-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              <span className="text-amber-400 text-lg md:text-xl drop-shadow-[0_0_6px_rgba(245,158,11,0.8)]">★</span>
              <span className="text-amber-400 text-xl md:text-2xl drop-shadow-[0_0_10px_rgba(245,158,11,0.9)] -translate-y-0.5">★</span>
              <span className="text-amber-400 text-lg md:text-xl drop-shadow-[0_0_6px_rgba(245,158,11,0.8)]">★</span>
              <span className="text-xs md:text-sm font-mono text-cyan-300 uppercase tracking-widest font-bold ml-2">EDICIÓN JEOPARDY EN VIVO</span>
            </div>
            
            <h1 className="weathered-title text-center md:text-left text-5xl sm:text-6xl md:text-7xl lg:text-8xl tracking-tighter uppercase leading-[0.8] drop-shadow-[0_8px_16px_rgba(0,0,0,0.95)] select-none">
              TRIVIA<br/>
              <span className="text-cyan-400 glow-cyan select-none tracking-tight block mt-2 text-6xl sm:text-7xl md:text-8xl lg:text-[7.8rem]">MUNDIALISTA</span>
            </h1>
            
            <p className="text-xs md:text-sm font-mono text-slate-400 mt-4 uppercase tracking-widest max-w-md mx-auto md:mx-0">
              Desafío de fútbol de nivel avanzado para fanáticos mundiales. ¡Demostrá tu conocimiento en la grilla de la Copa!
            </p>
          </div>

          {/* LADO DERECHO: IMAGEN DE ECHI JUGADOR CON RESPLANDOR Y SUBTÍTULO */}
          <div className="relative flex flex-col items-center justify-end z-10 w-full md:w-auto min-w-[280px] md:min-w-[320px] select-none h-64 sm:h-72 md:h-80">
            
            {/* Background glowing circle */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-48 h-48 bg-cyan-400/25 blur-3xl rounded-full pointer-events-none"></div>
            
            {/* Image Container with transparent background */}
            <div className="relative w-44 sm:w-48 md:w-56 h-full flex items-end justify-center">
              <img 
                src="/ECHI_JUGADOR.png" 
                alt="Los 11 de Echi" 
                className="max-w-full max-h-full object-contain player-glow pb-4"
                onError={(e) => {
                  e.currentTarget.src = "/POSTER_11_ECHI.jpg";
                  e.currentTarget.className = "w-full h-full object-cover object-top filter contrast-125 saturate-110 drop-shadow-[0_0_15px_rgba(34,211,238,0.3)]";
                }}
              />
            </div>

            {/* Subtitle overlapping/covering the bottom crop */}
            <div className="absolute bottom-[-5px] text-center w-full z-20 pointer-events-none">
              <span className="font-marker text-cyan-300 italic text-3xl sm:text-4xl md:text-5xl tracking-wide font-bold glow-cyan inline-block rotate-[-4deg] drop-shadow-[0_4px_12px_rgba(0,0,0,0.95)]">
                Los 11 de Echi
              </span>
            </div>
            
          </div>
        </section>

        {/* --- MARCADORES DE LOS GRUPOS --- */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          
          {/* --- GRUPO A BOARD --- */}
          <div className="border-lightning-cyan bg-[#071029]/95 p-5 w-full text-center relative overflow-visible rounded-lg">
            <div className="flex items-center justify-between border-b border-cyan-900/60 pb-2.5 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-cyan-400 rounded-full animate-pulse box-glow-cyan-strong"></span>
                <span className="font-anton text-xl tracking-widest text-slate-100 uppercase">GRUPO A</span>
              </div>
              <span className="text-[10px] font-mono text-cyan-400 uppercase bg-cyan-950/80 px-2.5 py-0.5 border border-cyan-800/50 rounded">LOCAL</span>
            </div>

            {/* Huge score indicator */}
            <div className="py-2">
              {isEditingA ? (
                <div className="flex items-center justify-center gap-2">
                  <input 
                    type="number" 
                    value={manualScoreA}
                    onChange={(e) => setManualScoreA(e.target.value)}
                    className="w-28 bg-slate-950 border border-cyan-500 text-cyan-400 p-1.5 text-center font-digital text-3xl font-bold rounded"
                  />
                  <button 
                    onClick={() => handleManualScoreSubmit('A')}
                    className="bg-cyan-500 hover:bg-cyan-400 p-2 text-slate-950 cursor-pointer rounded transition-all"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <h2 
                  onClick={() => { 
                    setManualScoreA(scoreA.toString());
                    setIsEditingA(true); 
                  }}
                  className="font-digital text-6xl md:text-7xl tracking-widest text-cyan-400 glow-cyan cursor-pointer hover:scale-105 transition-all select-none font-extrabold"
                  title="Editar puntaje"
                >
                  {scoreA}
                </h2>
              )}
              <p className="text-[10px] text-slate-400 mt-2.5 uppercase tracking-widest font-mono">Puntos Acumulados</p>
            </div>

            {/* Adjustments row */}
            <div className="flex items-center justify-center gap-4 mt-5 pt-3 border-t border-cyan-900/40 relative">
              <button 
                onClick={() => { SoundEffects.playSelect(); setShowQuickA(!showQuickA); }}
                className="flex items-center justify-center w-11 h-11 rounded border border-cyan-500/50 hover:bg-cyan-950/70 text-cyan-400 cursor-pointer transition-all active:scale-90 hover:box-glow-cyan"
                title="Sumar Puntos"
              >
                <Plus className="w-5 h-5" />
              </button>
              
              <button 
                onClick={() => { SoundEffects.playSelect(); setScoreA(prev => Math.max(0, prev - 100)); SoundEffects.playError(); }}
                className="flex items-center justify-center w-11 h-11 rounded border border-cyan-500/50 hover:bg-cyan-950/70 text-cyan-400 cursor-pointer transition-all active:scale-90 hover:box-glow-cyan"
                title="Restar 100"
              >
                <Minus className="w-5 h-5" />
              </button>

              {/* Score popover adjustment */}
              {showQuickA && (
                <div className="absolute top-[55px] left-1/2 -translate-x-1/2 bg-[#091535] border-2 border-cyan-400 p-3.5 z-30 grid grid-cols-2 gap-2 box-glow-cyan-strong w-52 rounded-lg">
                  <div className="col-span-2 flex justify-between items-center text-xs text-slate-300 font-mono mb-1.5">
                    <span>Ajuste rápido</span>
                    <button onClick={() => setShowQuickA(false)} className="text-red-400 font-bold hover:text-red-300">X</button>
                  </div>
                  <button onClick={() => handleScoreChange('A', 'add', 100)} className="bg-cyan-950/90 hover:bg-cyan-900 text-cyan-300 py-1.5 text-xs font-mono font-bold border border-cyan-800 rounded transition-colors">+100</button>
                  <button onClick={() => handleScoreChange('A', 'add', 200)} className="bg-cyan-950/90 hover:bg-cyan-900 text-cyan-300 py-1.5 text-xs font-mono font-bold border border-cyan-800 rounded transition-colors">+200</button>
                  <button onClick={() => handleScoreChange('A', 'add', 300)} className="bg-cyan-950/90 hover:bg-cyan-900 text-cyan-300 py-1.5 text-xs font-mono font-bold border border-cyan-800 rounded transition-colors">+300</button>
                  <button onClick={() => handleScoreChange('A', 'add', 400)} className="bg-cyan-950/90 hover:bg-cyan-900 text-cyan-300 py-1.5 text-xs font-mono font-bold border border-cyan-800 rounded transition-colors">+400</button>
                </div>
              )}
            </div>
          </div>

          {/* --- GRUPO B BOARD --- */}
          <div className="border-lightning-amber bg-[#140f29]/95 p-5 w-full text-center relative overflow-visible rounded-lg">
            <div className="flex items-center justify-between border-b border-amber-900/60 pb-2.5 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-amber-400 rounded-full animate-pulse box-glow-amber-strong"></span>
                <span className="font-anton text-xl tracking-widest text-slate-100 uppercase">GRUPO B</span>
              </div>
              <span className="text-[10px] font-mono text-amber-400 uppercase bg-amber-950/80 px-2.5 py-0.5 border border-amber-800/50 rounded">VISITANTE</span>
            </div>

            {/* Huge score indicator */}
            <div className="py-2">
              {isEditingB ? (
                <div className="flex items-center justify-center gap-2">
                  <input 
                    type="number" 
                    value={manualScoreB}
                    onChange={(e) => setManualScoreB(e.target.value)}
                    className="w-28 bg-slate-950 border border-amber-500 text-amber-400 p-1.5 text-center font-digital text-3xl font-bold rounded"
                  />
                  <button 
                    onClick={() => handleManualScoreSubmit('B')}
                    className="bg-amber-500 hover:bg-amber-400 p-2 text-slate-950 cursor-pointer rounded transition-all"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <h2 
                  onClick={() => { 
                    setManualScoreB(scoreB.toString());
                    setIsEditingB(true); 
                  }}
                  className="font-digital text-6xl md:text-7xl tracking-widest text-amber-400 glow-amber cursor-pointer hover:scale-105 transition-all select-none font-extrabold"
                  title="Editar puntaje"
                >
                  {scoreB}
                </h2>
              )}
              <p className="text-[10px] text-slate-400 mt-2.5 uppercase tracking-widest font-mono">Puntos Acumulados</p>
            </div>

            {/* Adjustments row */}
            <div className="flex items-center justify-center gap-4 mt-5 pt-3 border-t border-amber-900/40 relative">
              <button 
                onClick={() => { SoundEffects.playSelect(); setShowQuickB(!showQuickB); }}
                className="flex items-center justify-center w-11 h-11 rounded border border-amber-500/50 hover:bg-amber-950/70 text-amber-400 cursor-pointer transition-all active:scale-90 hover:box-glow-amber"
                title="Sumar Puntos"
              >
                <Plus className="w-5 h-5" />
              </button>
              
              <button 
                onClick={() => { SoundEffects.playSelect(); setScoreB(prev => Math.max(0, prev - 100)); SoundEffects.playError(); }}
                className="flex items-center justify-center w-11 h-11 rounded border border-amber-500/50 hover:bg-amber-950/70 text-amber-400 cursor-pointer transition-all active:scale-90 hover:box-glow-amber"
                title="Restar 100"
              >
                <Minus className="w-5 h-5" />
              </button>

              {/* Score popover adjustment */}
              {showQuickB && (
                <div className="absolute top-[55px] left-1/2 -translate-x-1/2 bg-[#200d1e] border-2 border-amber-400 p-3.5 z-30 grid grid-cols-2 gap-2 box-glow-amber-strong w-52 rounded-lg">
                  <div className="col-span-2 flex justify-between items-center text-xs text-slate-300 font-mono mb-1.5">
                    <span>Ajuste rápido</span>
                    <button onClick={() => setShowQuickB(false)} className="text-red-400 font-bold hover:text-red-300">X</button>
                  </div>
                  <button onClick={() => handleScoreChange('B', 'add', 100)} className="bg-amber-950/90 hover:bg-amber-900 text-amber-300 py-1.5 text-xs font-mono font-bold border border-amber-800 rounded transition-colors">+100</button>
                  <button onClick={() => handleScoreChange('B', 'add', 200)} className="bg-amber-950/90 hover:bg-amber-900 text-amber-300 py-1.5 text-xs font-mono font-bold border border-amber-800 rounded transition-colors">+200</button>
                  <button onClick={() => handleScoreChange('B', 'add', 300)} className="bg-amber-950/90 hover:bg-amber-900 text-amber-300 py-1.5 text-xs font-mono font-bold border border-amber-800 rounded transition-colors">+300</button>
                  <button onClick={() => handleScoreChange('B', 'add', 400)} className="bg-amber-950/90 hover:bg-amber-900 text-amber-300 py-1.5 text-xs font-mono font-bold border border-amber-800 rounded transition-colors">+400</button>
                </div>
              )}
            </div>
          </div>

        </section>

        {/* --- JEOPARDY BOARD GRID --- */}
        <section className="bg-[#050a1d]/75 border border-cyan-950/70 p-4 md:p-6 shadow-2xl relative w-full rounded-lg">
          {/* Neon side border elements simulating stadium light beams */}
          <div className="absolute top-0 bottom-0 left-0 w-1 bg-gradient-to-b from-cyan-400 to-transparent"></div>
          <div className="absolute top-0 bottom-0 right-0 w-1 bg-gradient-to-b from-amber-400 to-transparent"></div>
          
          <div className="grid grid-board gap-4 md:gap-5 w-full">
            {/* Category Headers */}
            {categories.map((cat, idx) => (
              <div 
                key={cat}
                className="bg-arg-flag border-b-4 border-amber-500 py-3 md:py-4 px-2 text-center flex flex-col justify-center items-center min-h-[72px] shadow-lg relative overflow-hidden rounded-t"
              >
                {/* Visual anchor */}
                <div className="absolute top-1 left-2 text-[8px] font-mono text-slate-900/80 font-bold">COL_0{idx+1}</div>
                
                {/* Sun de Mayo watermark */}
                <div className="absolute inset-0 flex items-center justify-center opacity-25 pointer-events-none text-3xl select-none">
                  ☀️
                </div>
                
                <h3 className="font-anton text-base md:text-lg lg:text-xl tracking-tight text-white uppercase leading-tight select-none z-10 glow-arg-text font-black">
                  {cat}
                </h3>
              </div>
            ))}

            {/* Point Cells row by row */}
            {pointValues.map((val) => (
              categories.map((cat) => {
                const key = `${cat}-${val}`;
                const isSpent = spentQuestions[key];

                return (
                  <div 
                    key={key}
                    onClick={() => handleTileClick(cat, val)}
                    className={`
                      aspect-[4/3] flex flex-col items-center justify-center relative cursor-pointer select-none transition-all duration-200 border-b-2 rounded-md
                      ${isSpent 
                        ? 'opacity-25 pointer-events-none bg-slate-800/20 text-slate-600 line-through border-transparent shadow-none' 
                        : 'bg-[#0f193f]/90 hover:bg-[#15235c]/95 text-amber-400 border-amber-500/50 hover:border-cyan-400 hover:scale-[1.05] active:scale-95 hover:box-glow-cyan shadow-[0_4px_10px_rgba(0,0,0,0.3)]'
                      }
                    `}
                  >
                    {/* Tiny watermark */}
                    {!isSpent && (
                      <span className="absolute top-1.5 right-2 text-[9px] font-mono text-cyan-400/80 font-bold select-none tracking-widest">{val} PTS</span>
                    )}

                    <span className={`font-digital text-3xl md:text-4xl lg:text-5xl font-extrabold ${isSpent ? 'text-slate-600' : 'text-amber-400 glow-amber group-hover:text-cyan-300'}`}>
                      {val}
                    </span>
                  </div>
                );
              })
            ))}
          </div>
        </section>

      </main>

      {/* --- FLOATING STADIUM FOOTER --- */}
      <footer className="bg-slate-950/80 border-t border-cyan-950/40 py-4 px-6 text-center text-xs font-mono text-slate-500 z-10 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p>© 2026 Trivia Mundialista "Los 11 de Echi" - Nivel Avanzado</p>
        <p className="flex items-center gap-2">
          <span>Servicio Host de TV: Activo</span>
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
        </p>
      </footer>

      {/* --- INTERACTIVE QUESTION FULLSCREEN MODAL --- */}
      <AnimatePresence>
        {selectedQuestion && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4 md:p-8"
          >
            {/* Background pattern */}
            <div className="absolute inset-0 bg-radial-gradient(circle, rgba(14,24,64,0.3) 0%, rgba(0,0,0,0.9) 100%) pointer-events-none"></div>

            <div className="w-full max-w-5xl bg-gradient-to-b from-[#081232] to-[#030616] border-lightning-cyan relative p-6 md:p-10 text-center flex flex-col justify-between min-h-[85vh] md:min-h-[75vh] z-10 rounded-lg">
              
              {/* Question Header Info */}
              <div className="flex items-center justify-between border-b border-cyan-900 pb-4">
                <div className="text-left">
                  <p className="text-xs font-mono text-cyan-400 uppercase tracking-widest">Categoría de Trivia</p>
                  <h4 className="font-anton text-2xl md:text-3xl text-slate-100 uppercase tracking-tight">{selectedQuestion.category}</h4>
                </div>
                <div className="bg-amber-500 text-slate-950 px-4 py-2 font-anton text-2xl tracking-widest border-b-4 border-amber-700 select-none">
                  {selectedQuestion.value} PTS
                </div>
              </div>

              {/* Actual Question Text Area */}
              <div className="my-8 md:my-12 px-2 flex-1 flex flex-col justify-center">
                <p className="text-xs font-mono text-slate-400 uppercase tracking-widest mb-2">Pregunta en Juego</p>
                <h2 className="font-anton text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-white leading-relaxed tracking-wide select-text drop-shadow-[0_2px_10px_rgba(34,211,238,0.2)]">
                  {selectedQuestion.p}
                </h2>
                
                {/* REVEALED ANSWER SCREEN */}
                <AnimatePresence>
                  {showAnswer && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-8 pt-6 border-t border-cyan-900/60 flex flex-col items-center"
                    >
                      <p className="text-xs font-mono text-cyan-400 uppercase tracking-widest mb-1.5 select-none">Respuesta Oficial</p>
                      <h3 className="font-anton text-3xl sm:text-4xl md:text-5xl text-emerald-400 glow-cyan uppercase tracking-wide select-text max-w-2xl leading-tight">
                        {selectedQuestion.r}
                      </h3>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Bottom Control & Facilitator Panel */}
              <div className="mt-auto border-t border-cyan-900/40 pt-6 flex flex-col gap-5">
                
                {/* Reveal Answer Action Button */}
                {!showAnswer ? (
                  <button 
                    onClick={handleRevealAnswer}
                    className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-anton text-2xl py-4 px-8 uppercase tracking-wider transition-all cursor-pointer border-b-4 border-amber-700 active:border-b-0 hover:translate-y-[2px]"
                  >
                    Revelar Respuesta
                  </button>
                ) : (
                  /* Facilitator's Instant Score Awarding Panel */
                  <div className="flex flex-col gap-3">
                    <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Asignar Puntos de la Pregunta al Marcador</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <button 
                        onClick={() => handleCloseQuestion(true, 'A', true)}
                        className="bg-cyan-600 hover:bg-cyan-500 text-white font-anton text-sm py-2 px-3 uppercase tracking-wider transition-all cursor-pointer border-b-2 border-cyan-800"
                      >
                        + Grupo A (+{selectedQuestion.value})
                      </button>
                      <button 
                        onClick={() => handleCloseQuestion(true, 'A', false)}
                        className="bg-red-950/80 hover:bg-red-900/80 text-red-300 font-anton text-sm py-2 px-3 uppercase tracking-wider transition-all cursor-pointer border-b-2 border-red-950"
                      >
                        - Grupo A (-{selectedQuestion.value})
                      </button>
                      <button 
                        onClick={() => handleCloseQuestion(true, 'B', true)}
                        className="bg-amber-600 hover:bg-amber-500 text-white font-anton text-sm py-2 px-3 uppercase tracking-wider transition-all cursor-pointer border-b-2 border-amber-800"
                      >
                        + Grupo B (+{selectedQuestion.value})
                      </button>
                      <button 
                        onClick={() => handleCloseQuestion(true, 'B', false)}
                        className="bg-red-950/80 hover:bg-red-900/80 text-red-300 font-anton text-sm py-2 px-3 uppercase tracking-wider transition-all cursor-pointer border-b-2 border-red-950"
                      >
                        - Grupo B (-{selectedQuestion.value})
                      </button>
                    </div>
                  </div>
                )}

                {/* Return To Board (Neutral action) */}
                <div className="flex justify-between items-center gap-4 text-xs font-mono text-slate-400">
                  <span>Código de celda: {selectedQuestion.category.slice(0,3).toUpperCase()}-{selectedQuestion.value}</span>
                  <button 
                    onClick={() => handleCloseQuestion(false)}
                    className="flex items-center gap-2 hover:text-cyan-400 text-slate-300 transition-colors uppercase font-bold py-2 border border-slate-700 hover:border-cyan-500 px-4 cursor-pointer"
                  >
                    Volver al Tablero
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- GAME OVER WINNER CEREMONY MODAL --- */}
      <AnimatePresence>
        {showFinalResults && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/98 z-50 flex items-center justify-center p-4 overflow-y-auto"
          >
            {/* Confetti Rain Layer */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
              {confetti.map((c) => (
                <div 
                  key={c.id}
                  className="absolute animate-bounce"
                  style={{
                    left: `${c.left}%`,
                    top: `-10px`,
                    width: `${c.size}px`,
                    height: `${c.size}px`,
                    backgroundColor: c.color,
                    opacity: 0.8,
                    transform: `rotate(${Math.random() * 360}deg)`,
                    animation: `fall ${Math.random() * 2 + 3}s linear infinite`,
                    animationDelay: `${c.delay}s`,
                    borderRadius: '50%'
                  }}
                />
              ))}
              <style>{`
                @keyframes fall {
                  0% { top: -20px; transform: translateY(0) rotate(0deg); }
                  100% { top: 105%; transform: translateY(100vh) rotate(720deg); }
                }
              `}</style>
            </div>

            <div className="w-full max-w-4xl bg-gradient-to-b from-[#1a1135] to-[#050616] border-lightning-amber p-8 md:p-12 text-center relative z-10 rounded-lg">
              
              {/* Golden Trophy Icon */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-amber-400/25 blur-xl rounded-full animate-pulse"></div>
                  <Trophy className="w-28 h-28 text-amber-400 relative z-10 animate-bounce" />
                </div>
              </div>

              <h4 className="font-mono text-cyan-400 tracking-widest uppercase text-xs mb-1">Resultado Final del Partido</h4>
              <h1 className="font-anton text-5xl md:text-7xl text-white uppercase tracking-tight leading-none glow-amber mb-6">
                {winnerText}
              </h1>

              {/* Detailed Group Scores comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto my-8">
                {/* Grupo A result */}
                <div className="bg-[#050e26] border border-cyan-500/40 p-6 flex flex-col items-center rounded-lg">
                  <span className="font-mono text-cyan-400 text-xs uppercase tracking-widest">GRUPO A</span>
                  <span className="font-digital text-5xl text-white mt-2 font-bold">{scoreA} PTS</span>
                  {scoreA >= scoreB && (
                    <span className="mt-3 text-xs bg-cyan-950 text-cyan-300 font-mono py-1 px-3 border border-cyan-800 rounded">
                      {scoreA === scoreB ? 'EMPATE' : 'CAMPEÓN'}
                    </span>
                  )}
                </div>

                {/* Grupo B result */}
                <div className="bg-[#12051c] border border-amber-500/40 p-6 flex flex-col items-center rounded-lg">
                  <span className="font-mono text-amber-400 text-xs uppercase tracking-widest">GRUPO B</span>
                  <span className="font-digital text-5xl text-white mt-2 font-bold">{scoreB} PTS</span>
                  {scoreB >= scoreA && (
                    <span className="mt-3 text-xs bg-amber-950 text-amber-300 font-mono py-1 px-3 border border-amber-800 rounded">
                      {scoreB === scoreA ? 'EMPATE' : 'CAMPEÓN'}
                    </span>
                  )}
                </div>
              </div>

              {/* Host image miniature in trophy screen */}
              <div className="flex items-center justify-center gap-4 my-6 text-slate-300 max-w-sm mx-auto border-t border-slate-800 pt-6">
                <img 
                  src="/ECHI_JUGADOR.png" 
                  alt="Echi" 
                  className="w-14 h-14 object-contain rounded-full border border-cyan-400 bg-slate-900/60 p-1 player-glow"
                  onError={(e) => {
                    e.currentTarget.src = "/POSTER_11_ECHI.jpg";
                  }}
                />
                <div className="text-left text-xs">
                  <p className="font-bold text-slate-100">"Los 11 de Echi" Trivia</p>
                  <p className="text-slate-400 font-mono">¡Felicitaciones a los mundialistas!</p>
                </div>
              </div>

              {/* Modal control actions */}
              <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8 pt-4 border-t border-slate-800">
                <button 
                  onClick={handleResetGame}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-anton text-xl py-3 px-8 uppercase tracking-wider transition-all cursor-pointer border-b-4 border-amber-700 active:border-b-0 hover:translate-y-[2px]"
                >
                  Reiniciar Todo el Partido
                </button>
                <button 
                  onClick={() => setShowFinalResults(false)}
                  className="bg-[#1c1f3d] hover:bg-[#2c3260] text-slate-300 font-bold px-8 py-3 transition-all cursor-pointer border border-slate-700"
                >
                  Seguir viendo Tablero
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- RULES DESCRIPTION OVERLAY --- */}
      <AnimatePresence>
        {showRules && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <div className="w-full max-w-2xl bg-[#090f2b] border-2 border-cyan-500 p-6 md:p-8 relative box-glow-cyan">
              <button 
                onClick={() => { SoundEffects.playSelect(); setShowRules(false); }}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 border-b border-cyan-900 pb-3 mb-5">
                <HelpCircle className="w-7 h-7 text-cyan-400" />
                <h3 className="font-anton text-3xl tracking-tight uppercase text-white">REGLAS DEL JUEGO (JEOPARDY)</h3>
              </div>

              <div className="text-slate-300 text-sm md:text-base leading-relaxed flex flex-col gap-4 select-text">
                <p>
                  Bienvenido a la <strong>Trivia Mundialista: Los 11 de Echi</strong>. Jugá y competí como un campeón siguiendo estas pautas de juego show televisivo:
                </p>
                <ul className="list-decimal list-inside flex flex-col gap-2.5 bg-slate-950/60 p-4 border border-cyan-900/50">
                  <li>Formen dos grupos: el <strong>Grupo A (Local)</strong> y el <strong>Grupo B (Visitante)</strong>.</li>
                  <li>Elijan un moderador/facilitador (el Director Técnico de la noche).</li>
                  <li>Por turnos, cada grupo elige una celda disponible en la grilla indicando la categoría y el puntaje (ej. <em>"Estadios por 200 puntos"</em>).</li>
                  <li>El moderador hace clic en la celda correspondiente para abrir el panel y lee la pregunta gigante.</li>
                  <li>Ambos grupos pueden competir por responder en un tiempo límite o usar pulsadores caseros.</li>
                  <li>Al revelarse la respuesta, se asigna el puntaje correspondiente al grupo ganador con los controles de sumas y restas del modal.</li>
                  <li>Al finalizar todas las preguntas, presionen <strong>"Finalizar Juego"</strong> para coronar al campeón de la Copa Trivia Mundialista.</li>
                </ul>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 text-center">
                <button 
                  onClick={() => setShowRules(false)}
                  className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-anton text-base py-2.5 px-6 uppercase tracking-wider transition-all cursor-pointer"
                >
                  ¡Entendido, a jugar!
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- RESET BOARD CONFIRMATION DIALOG --- */}
      <AnimatePresence>
        {showResetConfirm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <div className="w-full max-w-md bg-[#190d16] border-2 border-red-500 p-6 text-center shadow-[0_0_20px_rgba(239,68,68,0.2)]">
              <h3 className="font-anton text-2xl tracking-tight text-white uppercase mb-2">¿Reiniciar partido?</h3>
              <p className="text-slate-300 text-sm mb-6 leading-relaxed select-text">
                Esto borrará todos los puntos de los grupos y restablecerá todas las preguntas del tablero como no usadas. Esta acción es irreversible.
              </p>
              <div className="flex items-center justify-center gap-4">
                <button 
                  onClick={handleResetGame}
                  className="bg-red-600 hover:bg-red-500 text-white font-anton text-base py-2 px-6 uppercase tracking-wider transition-all cursor-pointer border-b-2 border-red-800"
                >
                  Sí, Reiniciar
                </button>
                <button 
                  onClick={() => { SoundEffects.playSelect(); setShowResetConfirm(false); }}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2 px-6 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
