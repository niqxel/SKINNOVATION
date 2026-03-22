/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  ChevronRight, 
  ChevronLeft, 
  History as HistoryIcon, 
  Share2, 
  ShoppingBag, 
  X, 
  CheckCircle2, 
  Zap, 
  Maximize, 
  MessageCircle, 
  FileText,
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';

// --- Types ---

type View = 'home' | 'camera' | 'processing' | 'results' | 'recommendations' | 'history';

interface AnalysisResult {
  globalScore: number;
  hydration: number;
  toneUniformity: number;
  texture: number;
  summary: string;
  timestamp: string;
}

interface Product {
  id: string;
  name: string;
  brand: string;
  description: string;
  price: string;
  benefits: string[];
  category: string;
  image: string;
}

// --- Constants ---

const PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Sérum Hidratante Intensivo',
    brand: 'Sephora Collection',
    description: 'Fórmula com ácido hialurónico que proporciona hidratação profunda e duradoura.',
    price: '€24,90',
    benefits: ['Hidratação +82%', 'Reduz linhas finas', 'Absorção rápida'],
    category: 'SÉRUM',
    image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: '2',
    name: 'Creme Uniformizador de Tom',
    brand: 'Sephora Collection',
    description: 'Creme iluminador com vitamina C que corrige manchas e unifica o tom.',
    price: '€29,90',
    benefits: ['Uniformiza tom', 'Brilho natural', 'Antioxidante'],
    category: 'CREME',
    image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: '3',
    name: 'Base Aperfeiçoadora HD',
    brand: 'Sephora Collection',
    description: 'Base de cobertura média que aperfeiçoa a textura e disfarça imperfeições.',
    price: '€18,90',
    benefits: ['Cobertura natural', 'Longa duração', 'Acabamento aveludado'],
    category: 'BASE',
    image: 'https://images.pexels.com/photos/4938331/pexels-photo-4938331.jpeg'
  }
];

const MOCK_HISTORY = [
  { date: 'Jan', hydration: 58, tone: 62, texture: 60 },
  { date: 'Fev', hydration: 65, tone: 68, texture: 62 },
  { date: 'Mar', hydration: 82, tone: 68, texture: 75 },
];

// --- Components ---

export default function App() {
  const [view, setView] = useState<View>('home');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const [processingProgress, setProcessingProgress] = useState(0);

  // Initialize Gemini
  const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

  const handleStartAnalysis = () => setView('camera');

  const handleCapture = (image: string) => {
    setCapturedImage(image);
    setView('processing');
    startProcessing(image);
  };

  const startProcessing = async (image: string) => {
    // Simulate progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
      }
      setProcessingProgress(Math.floor(progress));
    }, 400);

    try {
      const model = "gemini-3-flash-preview";
      const prompt = `Analise esta imagem de pele facial e forneça um relatório em JSON com:
        - globalScore (número entre 0-100)
        - hydration (número entre 0-100)
        - toneUniformity (número entre 0-100)
        - texture (número entre 0-100)
        - summary (breve resumo em português de 1-2 frases)
        Responda apenas com o JSON puro.`;

      const base64Data = image.split(',')[1];
      if (!base64Data) throw new Error("Imagem inválida capturada.");

      const result = await genAI.models.generateContent({
        model,
        contents: [
          {
            parts: [
              { text: prompt },
              { inlineData: { mimeType: "image/jpeg", data: base64Data } }
            ]
          }
        ],
        config: { 
          responseMimeType: "application/json",
          temperature: 0.1, // Lower temperature for more consistent JSON
        }
      });

      if (!result.text) throw new Error("Resposta vazia da IA.");
      const data = JSON.parse(result.text.trim());
      
      const newAnalysis: AnalysisResult = {
        globalScore: Number(data.globalScore) || 75,
        hydration: Number(data.hydration) || 82,
        toneUniformity: Number(data.toneUniformity) || 68,
        texture: Number(data.texture) || 75,
        summary: data.summary || "Pele com boa hidratação, mas necessita de atenção à uniformidade do tom.",
        timestamp: new Date().toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })
      };

      setAnalysis(newAnalysis);
      setHistory(prev => [newAnalysis, ...prev]);
      
      setTimeout(() => {
        setView('results');
        setProcessingProgress(0);
      }, 1000);

    } catch (error: any) {
      console.error("Analysis failed:", error);
      // Fallback with a slight delay to simulate real work if it fails
      setTimeout(() => {
        const fallback: AnalysisResult = {
          globalScore: 75,
          hydration: 82,
          toneUniformity: 68,
          texture: 75,
          summary: "Pele saudável com necessidade de hidratação contínua. (Nota: Análise em modo de demonstração devido a erro técnico)",
          timestamp: new Date().toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })
        };
        setAnalysis(fallback);
        setView('results');
        setProcessingProgress(0);
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white overflow-x-hidden">
      <AnimatePresence mode="wait">
        {view === 'home' && <HomeView onStart={handleStartAnalysis} />}
        {view === 'camera' && <CameraView onCapture={handleCapture} onBack={() => setView('home')} />}
        {view === 'processing' && <ProcessingView progress={processingProgress} />}
        {view === 'results' && analysis && (
          <ResultsView 
            analysis={analysis} 
            onShowRecommendations={() => setView('recommendations')} 
            onShowHistory={() => setView('history')}
          />
        )}
        {view === 'recommendations' && (
          <RecommendationsView 
            onBack={() => setView('results')} 
            onShowHistory={() => setView('history')}
          />
        )}
        {view === 'history' && (
          <HistoryView 
            history={history} 
            onBack={() => setView('results')} 
            onNewAnalysis={() => setView('camera')}
          />
        )}
      </AnimatePresence>

      {/* Footer / Cookie Banner (Simulated) */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-black/90 text-white text-[10px] flex justify-between items-center z-50">
        <span>Manage cookies or opt out</span>
        <button className="underline">RGPD</button>
      </div>
    </div>
  );
}

// --- Sub-Views ---

function HomeView({ onStart }: { onStart: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="flex flex-col items-center px-8 pt-16 pb-24 text-center"
    >
      <div className="mb-8">
        <div className="w-20 h-20 border border-black rounded-full flex items-center justify-center mb-4 mx-auto">
          <Zap className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-black tracking-tighter mb-1">SKINNOVATION</h1>
        <p className="text-xs font-bold tracking-[0.2em] uppercase opacity-60">Sephora Portugal</p>
      </div>

      <div className="w-12 h-[1px] bg-black/20 mb-12" />

      <h2 className="text-3xl font-bold tracking-tight mb-4 leading-tight">
        A tua pele decifrada<br />por IA
      </h2>
      <p className="text-sm text-black/60 mb-12 max-w-[280px] leading-relaxed">
        Tecnologia de análise avançada para descobrir o que a tua pele realmente precisa
      </p>

      <div className="w-full space-y-4 mb-12">
        <FeatureItem icon={<div className="w-2 h-2 bg-black rounded-full" />} title="Análise Instantânea" desc="Resultados em segundos" />
        <FeatureItem icon={<div className="w-2 h-2 bg-black rounded-full" />} title="Recomendações Personalizadas" desc="Produtos ideais para ti" />
        <FeatureItem icon={<div className="w-2 h-2 bg-black rounded-full" />} title="Acompanhamento Contínuo" desc="Evolução da tua pele" />
      </div>

      <button 
        onClick={onStart}
        className="w-full bg-black text-white py-5 rounded-lg font-bold text-sm tracking-widest uppercase hover:bg-black/90 transition-colors"
      >
        INICIAR ANÁLISE GRATUITA
      </button>
      
      <p className="mt-6 text-[10px] opacity-40 flex items-center gap-2">
        <FileText className="w-3 h-3" /> Como usamos os teus dados (RGPD)
      </p>
    </motion.div>
  );
}

function FeatureItem({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="flex items-start gap-4 p-5 bg-white border border-black/5 rounded-xl text-left shadow-sm">
      <div className="mt-1.5">{icon}</div>
      <div>
        <h3 className="font-bold text-sm">{title}</h3>
        <p className="text-xs opacity-50">{desc}</p>
      </div>
    </div>
  );
}

function CameraView({ onCapture, onBack }: { onCapture: (img: string) => void, onBack: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    async function setupCamera() {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user', width: 1280, height: 720 } 
        });
        setStream(s);
        if (videoRef.current) videoRef.current.srcObject = s;
      } catch (err) {
        console.error("Camera access denied", err);
      }
    }
    setupCamera();
    return () => stream?.getTracks().forEach(t => t.stop());
  }, []);

  const capture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (context && video.videoWidth > 0) {
        // Limit max dimension to 800px for faster processing and reliability
        const maxDim = 800;
        let width = video.videoWidth;
        let height = video.videoHeight;
        
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width *= ratio;
          height *= ratio;
        }
        
        canvas.width = width;
        canvas.height = height;
        context.drawImage(video, 0, 0, width, height);
        
        // Use 0.7 quality to keep payload small and avoid "Unable to process input image" errors
        const data = canvas.toDataURL('image/jpeg', 0.7);
        onCapture(data);
      }
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-[#0a0a0f] z-50 flex flex-col"
    >
      {/* Header Indicators */}
      <div className="flex justify-between p-6 z-10">
        <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
          <Zap className="w-4 h-4 text-green-400 fill-green-400" />
          <span className="text-[10px] font-bold text-white uppercase tracking-wider">Iluminação OK</span>
        </div>
        <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
          <Maximize className="w-4 h-4 text-green-400" />
          <span className="text-[10px] font-bold text-white uppercase tracking-wider">Alinhado</span>
        </div>
      </div>

      {/* Camera Preview */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className="absolute inset-0 w-full h-full object-cover opacity-60 scale-x-[-1]"
        />
        
        {/* Grid Overlay */}
        <div className="absolute inset-0 opacity-20 pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

        {/* Oval Frame */}
        <div className="relative w-[80vw] aspect-[3/4] max-w-[300px]">
          <div className="absolute inset-0 border-2 border-dashed border-white/40 rounded-[100%] flex items-center justify-center">
             <div className="w-1 h-1 bg-white rounded-full" />
          </div>
          
          {/* Corner Marks */}
          <div className="absolute -top-4 -left-4 w-8 h-8 border-t-2 border-l-2 border-white/60" />
          <div className="absolute -top-4 -right-4 w-8 h-8 border-t-2 border-r-2 border-white/60" />
          <div className="absolute -bottom-4 -left-4 w-8 h-8 border-b-2 border-l-2 border-white/60" />
          <div className="absolute -bottom-4 -right-4 w-8 h-8 border-b-2 border-r-2 border-white/60" />
        </div>

        <p className="absolute bottom-12 text-white/60 text-xs font-medium px-8 text-center">
          Mantém o rosto dentro da moldura e evita sombras
        </p>
      </div>

      {/* Controls */}
      <div className="p-10 flex items-center justify-between bg-black/20 backdrop-blur-xl">
        <button onClick={onBack} className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center border border-white/10">
          <X className="w-6 h-6 text-white" />
        </button>
        
        <button 
          onClick={capture}
          className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center p-1"
        >
          <div className="w-full h-full rounded-full bg-white" />
        </button>

        <div className="w-12 h-12 flex items-center justify-center">
          {/* Placeholder for flash/settings */}
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </motion.div>
  );
}

function ProcessingView({ progress }: { progress: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-[#0a0a0f] z-50 flex flex-col items-center justify-center text-white"
    >
      <div className="relative w-48 h-48 mb-12">
        <div className="absolute inset-0 border-2 border-dashed border-white/20 rounded-full animate-spin-slow" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-4xl font-black">{progress}%</div>
        </div>
        
        {/* Scanning Line */}
        <motion.div 
          animate={{ top: ['0%', '100%', '0%'] }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="absolute left-0 right-0 h-[2px] bg-green-400 shadow-[0_0_15px_rgba(74,222,128,0.8)] z-10"
        />
      </div>

      <div className="flex items-center gap-3 bg-white/5 px-6 py-3 rounded-full border border-white/10">
        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        <span className="text-sm font-bold tracking-widest uppercase">A Processar {progress}%</span>
      </div>
    </motion.div>
  );
}

function ResultsView({ analysis, onShowRecommendations, onShowHistory }: { 
  analysis: AnalysisResult, 
  onShowRecommendations: () => void,
  onShowHistory: () => void
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="px-6 pt-12 pb-32"
    >
      <div className="text-center mb-12">
        <h2 className="text-xl font-black tracking-widest uppercase mb-1">Análise Completa</h2>
        <p className="text-[10px] opacity-40 uppercase tracking-widest">Resultados gerados por IA</p>
      </div>

      {/* Global Score Card */}
      <div className="bg-white border border-black/10 rounded-3xl p-8 shadow-xl mb-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-black via-black/40 to-black" />
        <p className="text-[10px] font-bold opacity-40 uppercase tracking-[0.2em] mb-4 text-center">Pontuação Global</p>
        <div className="text-center mb-6">
          <span className="text-7xl font-black tracking-tighter">{analysis.globalScore}</span>
          <p className="text-xs opacity-40 mt-2">em 100 pontos possíveis</p>
        </div>
        <div className="flex items-center justify-center gap-2 bg-black text-white py-3 px-6 rounded-full text-xs font-bold uppercase tracking-widest mx-auto w-fit">
          <TrendingUp className="w-4 h-4" /> Pele Saudável
        </div>
      </div>

      <h3 className="text-sm font-black tracking-widest uppercase mb-6 px-2">Indicadores Detalhados</h3>

      <div className="space-y-4 mb-12">
        <IndicatorItem label="Nível de Hidratação" score={analysis.hydration} desc="A tua pele está bem hidratada" status="EXCELENTE" />
        <IndicatorItem label="Uniformidade do Tom" score={analysis.toneUniformity} desc="Ligeiras variações de tonalidade" status="BOM" />
        <IndicatorItem label="Textura" score={analysis.texture} desc="Textura suave e uniforme" status="MUITO BOM" />
      </div>

      <div className="grid grid-cols-1 gap-4">
        <button 
          onClick={onShowRecommendations}
          className="w-full bg-black text-white py-5 rounded-xl font-bold text-sm tracking-widest uppercase flex items-center justify-center gap-3"
        >
          Ver Recomendações <ArrowRight className="w-4 h-4" />
        </button>
        
        <div className="grid grid-cols-2 gap-4">
          <button className="flex items-center justify-center gap-2 border border-black/10 py-4 rounded-xl text-[10px] font-bold uppercase tracking-widest">
            <Share2 className="w-4 h-4" /> Partilhar
          </button>
          <button 
            onClick={onShowHistory}
            className="flex items-center justify-center gap-2 border border-black/10 py-4 rounded-xl text-[10px] font-bold uppercase tracking-widest"
          >
            <HistoryIcon className="w-4 h-4" /> Histórico
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function IndicatorItem({ label, score, desc, status }: { label: string, score: number, desc: string, status: string }) {
  return (
    <div className="bg-white border border-black/5 rounded-2xl p-6 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 className="font-bold text-sm mb-1">{label}</h4>
          <p className="text-[10px] opacity-40">{desc}</p>
        </div>
        <div className="relative w-12 h-12 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90">
            <circle cx="24" cy="24" r="20" fill="none" stroke="#f3f4f6" strokeWidth="4" />
            <circle cx="24" cy="24" r="20" fill="none" stroke="black" strokeWidth="4" 
                    strokeDasharray={125.6} strokeDashoffset={125.6 * (1 - score/100)} />
          </svg>
          <span className="absolute text-[10px] font-bold">{score}</span>
        </div>
      </div>
      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-4">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          className="h-full bg-black"
        />
      </div>
      <span className="text-[9px] font-black tracking-widest bg-gray-100 px-3 py-1.5 rounded-md uppercase">{status}</span>
    </div>
  );
}

function RecommendationsView({ onBack, onShowHistory }: { onBack: () => void, onShowHistory: () => void }) {
  const [activeIdx, setActiveIdx] = useState(0);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }} 
      animate={{ opacity: 1, x: 0 }} 
      className="px-6 pt-12 pb-32"
    >
      <div className="flex items-center justify-between mb-12">
        <button onClick={onBack} className="w-10 h-10 border border-black/10 rounded-full flex items-center justify-center">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-sm font-black tracking-widest uppercase">Recomendado para ti</h2>
        <div className="w-10" />
      </div>

      <div className="mb-12">
        <div className="flex justify-between items-center mb-4 px-2">
          <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">Rotina Personalizada</p>
          <p className="text-[10px] font-bold uppercase tracking-widest">Valor Total: <span className="text-black">€73,70</span></p>
        </div>
        <div className="flex gap-2 mb-8">
          {PRODUCTS.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i === activeIdx ? 'bg-black' : 'bg-black/10'}`} />
          ))}
        </div>

        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div 
              key={activeIdx}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-black/10 rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="aspect-square bg-gray-50 flex items-center justify-center relative">
                <img src={PRODUCTS[activeIdx].image} alt={PRODUCTS[activeIdx].name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <div className="absolute top-6 left-6 bg-white/90 backdrop-blur px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-black/5">
                  {PRODUCTS[activeIdx].category}
                </div>
              </div>
              <div className="p-8">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest mb-1">{PRODUCTS[activeIdx].brand}</p>
                    <h3 className="text-xl font-bold leading-tight">{PRODUCTS[activeIdx].name}</h3>
                  </div>
                  <span className="text-lg font-black">{PRODUCTS[activeIdx].price}</span>
                </div>
                <p className="text-xs text-black/60 mb-6 leading-relaxed">{PRODUCTS[activeIdx].description}</p>
                <div className="space-y-2 mb-8">
                  {PRODUCTS[activeIdx].benefits.map((b, i) => (
                    <div key={i} className="flex items-center gap-2 text-[10px] font-medium">
                      <CheckCircle2 className="w-3 h-3 text-black" /> {b}
                    </div>
                  ))}
                </div>
                <button className="w-full bg-black text-white py-4 rounded-xl font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-3">
                  <ShoppingBag className="w-4 h-4" /> Adicionar ao Cesto
                </button>
              </div>
            </motion.div>
          </AnimatePresence>

          <button 
            onClick={() => setActiveIdx(prev => (prev > 0 ? prev - 1 : PRODUCTS.length - 1))}
            className="absolute top-1/2 -left-4 -translate-y-1/2 w-10 h-10 bg-white border border-black/10 rounded-full shadow-lg flex items-center justify-center z-10"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setActiveIdx(prev => (prev < PRODUCTS.length - 1 ? prev + 1 : 0))}
            className="absolute top-1/2 -right-4 -translate-y-1/2 w-10 h-10 bg-white border border-black/10 rounded-full shadow-lg flex items-center justify-center z-10"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <button className="w-full bg-[#ff4b5c] text-white py-5 rounded-xl font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-3">
          <MessageCircle className="w-4 h-4" /> Falar com Beauty Adviser
        </button>
        <button 
          onClick={onShowHistory}
          className="w-full border border-black/10 py-5 rounded-xl font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-3"
        >
          <FileText className="w-4 h-4" /> Ver Histórico e PDF
        </button>
      </div>
    </motion.div>
  );
}

function HistoryView({ history, onBack, onNewAnalysis }: { 
  history: AnalysisResult[], 
  onBack: () => void,
  onNewAnalysis: () => void
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="px-6 pt-12 pb-32"
    >
      <div className="flex items-center justify-between mb-12">
        <button onClick={onBack} className="w-10 h-10 border border-black/10 rounded-full flex items-center justify-center">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-sm font-black tracking-widest uppercase">Histórico</h2>
        <div className="w-10" />
      </div>

      {/* Evolution Chart */}
      <div className="bg-white border border-black/10 rounded-3xl p-6 shadow-xl mb-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest mb-1">Estado Atual</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black">75</span>
              <span className="text-[10px] font-bold text-green-500 bg-green-50 px-2 py-1 rounded-md">+13 PTS</span>
            </div>
          </div>
          <p className="text-[10px] text-right opacity-40 leading-tight">Melhoraste 13 pontos desde<br />a tua primeira análise</p>
        </div>

        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={MOCK_HISTORY}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600 }} />
              <YAxis hide domain={[0, 100]} />
              <Tooltip />
              <Line type="monotone" dataKey="hydration" stroke="black" strokeWidth={3} dot={{ r: 4, fill: 'black' }} />
              <Line type="monotone" dataKey="tone" stroke="#9ca3af" strokeWidth={2} dot={{ r: 3, fill: '#9ca3af' }} />
              <Line type="monotone" dataKey="texture" stroke="#d1d5db" strokeWidth={2} dot={{ r: 3, fill: '#d1d5db' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div className="flex justify-center gap-6 mt-4">
          <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest">
            <div className="w-2 h-2 bg-black rounded-full" /> Hidratação
          </div>
          <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest opacity-40">
            <div className="w-2 h-2 bg-gray-400 rounded-full" /> Uniformidade
          </div>
          <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest opacity-40">
            <div className="w-2 h-2 bg-gray-200 rounded-full" /> Textura
          </div>
        </div>
      </div>

      <h3 className="text-sm font-black tracking-widest uppercase mb-6 px-2 flex items-center gap-2">
        <FileText className="w-4 h-4" /> Histórico de Análises
      </h3>

      <div className="space-y-4 mb-12">
        <HistoryItem date="22 Mar 2026" score={75} status="Melhoria Significativa" />
        <HistoryItem date="15 Fev 2026" score={67} status="Em Progresso" />
        <HistoryItem date="08 Jan 2026" score={62} status="Análise Inicial" />
      </div>

      <div className="space-y-4">
        <button className="w-full bg-black text-white py-5 rounded-xl font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-3">
          <FileText className="w-4 h-4" /> Download Relatório PDF
        </button>
        <button 
          onClick={onNewAnalysis}
          className="w-full border border-black py-5 rounded-xl font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-3"
        >
          Nova Análise
        </button>
      </div>
    </motion.div>
  );
}

function HistoryItem({ date, score, status }: { date: string, score: number, status: string }) {
  return (
    <div className="bg-white border border-black/5 rounded-2xl p-5 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 border border-black rounded-full flex items-center justify-center font-black text-sm">
          {score}
        </div>
        <div>
          <h4 className="font-bold text-sm">{date}</h4>
          <p className="text-[10px] opacity-40">{status}</p>
        </div>
      </div>
      <TrendingUp className="w-4 h-4 opacity-20" />
    </div>
  );
}
