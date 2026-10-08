import React from 'react';
import { 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize, 
  Database, 
  PlusCircle, 
  RotateCw,
  Clock,
  Layers
} from 'lucide-react';
import { kitchenAudio } from '../lib/audio';

interface HeaderProps {
  activeCount: number;
  avgWaitMinutes: number;
  urgentCount: number;
  isSupabaseConnected: boolean;
  isRealtimeActive: boolean;
  onOpenSettings: () => void;
  onOpenNewOrder: () => void;
  onManualRefresh: () => void;
  isRefreshing: boolean;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenHistory: () => void;
  historyCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeCount,
  avgWaitMinutes,
  urgentCount,
  isSupabaseConnected,
  isRealtimeActive,
  onOpenSettings,
  onOpenNewOrder,
  onManualRefresh,
  isRefreshing,
  soundEnabled,
  onToggleSound,
  onOpenHistory,
  historyCount,
}) => {
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
      }
    }
  };

  const handleSoundClick = () => {
    const nextState = !soundEnabled;
    kitchenAudio.enabled = nextState;
    if (nextState) {
      kitchenAudio.playNewOrderSound();
    }
    onToggleSound();
  };

  return (
    <header className="sticky top-0 z-30 bg-zinc-950/95 backdrop-blur border-b border-zinc-800/80 px-4 py-3">
      <div className="max-w-[1720px] mx-auto flex items-center justify-between gap-4">
        {/* ZONE 1: BRAND TITLE (Wordmark, single-line) */}
        <div className="flex items-center gap-3">
          <span className="font-display text-2xl font-black tracking-wider text-white uppercase flex items-center gap-2">
            <span className="text-amber-500">BURGER</span>KDS
          </span>

          <span className="hidden sm:inline-block w-px h-5 bg-zinc-800" />

          {/* Quick Metrics for the Kitchen Master */}
          <div className="hidden lg:flex items-center gap-4 text-xs font-medium">
            <div className="flex items-center gap-1.5 text-zinc-300">
              <Layers className="w-3.5 h-3.5 text-amber-500" />
              <span>Ativos:</span>
              <strong className="font-mono-numbers text-amber-400 font-bold">{activeCount}</strong>
            </div>

            <span className="text-zinc-700">·</span>

            <div className="flex items-center gap-1.5 text-zinc-300">
              <Clock className="w-3.5 h-3.5 text-zinc-400" />
              <span>T. Médio:</span>
              <strong className="font-mono-numbers text-white font-bold">{avgWaitMinutes} min</strong>
            </div>

            {urgentCount > 0 && (
              <>
                <span className="text-zinc-700">·</span>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-950/80 border border-red-800/60 text-red-300">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  <span>Atrasados:</span>
                  <strong className="font-mono-numbers font-extrabold text-red-200">{urgentCount}</strong>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ZONE 2: MIDDLE ACTIONS & STATUS CHANNELS */}
        <div className="hidden md:flex items-center gap-2">
          {/* Supabase status button */}
          <button
            type="button"
            onClick={onOpenSettings}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
              isSupabaseConnected
                ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300 hover:bg-emerald-900/50'
                : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isSupabaseConnected ? 'Supabase Conectado' : 'Conectar Supabase'}</span>
            {isRealtimeActive && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Realtime ativo" />
            )}
          </button>

          {/* Sync button */}
          <button
            type="button"
            onClick={onManualRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-medium transition-colors disabled:opacity-50"
            title="Sincronizar pedidos agora"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
            <span className="hidden xl:inline">Sincronizar</span>
          </button>

          {/* Histórico de Entregues */}
          <button
            type="button"
            onClick={onOpenHistory}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-medium transition-colors"
          >
            <span>Entregues ({historyCount})</span>
          </button>
        </div>

        {/* ZONE 3: PRIMARY ACTIONS */}
        <div className="flex items-center gap-2">
          {/* Sound Mute/Unmute */}
          <button
            type="button"
            onClick={handleSoundClick}
            className={`p-2 rounded-lg border transition-colors ${
              soundEnabled
                ? 'bg-zinc-900 border-zinc-800 text-zinc-200 hover:text-white hover:bg-zinc-800'
                : 'bg-red-950/40 border-red-800/40 text-red-400 hover:bg-red-900/40'
            }`}
            title={soundEnabled ? 'Silenciar alertas sonoros' : 'Ativar alertas sonoros'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="hidden sm:flex p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
            title="Alternar modo tela cheia para monitor da cozinha"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>

          {/* Test order generator button */}
          <button
            type="button"
            onClick={onOpenNewOrder}
            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-amber-950/40"
          >
            <PlusCircle className="w-4 h-4 text-zinc-950 shrink-0" />
            <span className="whitespace-nowrap">Novo Pedido</span>
          </button>
        </div>
      </div>
    </header>
  );
};
