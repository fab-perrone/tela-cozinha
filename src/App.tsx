import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Flame, 
  Clock, 
  Search, 
  LayoutGrid, 
  Columns3, 
  Sparkles, 
  UtensilsCrossed,
  Filter
} from 'lucide-react';
import { Pedido, StatusPedido, ItemPedido } from './types/order';
import { 
  getStoredSupabaseConfig, 
  fetchSupabaseOrders, 
  updateSupabaseOrderStatus, 
  insertSupabaseOrder, 
  subscribeToOrdersRealtime 
} from './lib/supabase';
import { getInitialSampleOrders, sampleBurgerTemplates } from './lib/sampleOrders';
import { calculateWaitTime } from './lib/timeUtils';
import { kitchenAudio } from './lib/audio';
import { Header } from './components/Header';
import { TicketCard } from './components/TicketCard';
import { SupabaseConfigModal } from './components/SupabaseConfigModal';
import { NewOrderModal } from './components/NewOrderModal';
import { HistoryDrawer } from './components/HistoryDrawer';

export default function App() {
  const [pedidos, setPedidos] = useState<Pedido[]>(() => {
    // Check localStorage cache or initialize with sample orders
    const cached = typeof window !== 'undefined' ? localStorage.getItem('burger_kds_local_orders') : null;
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {
        // Fallback to sample
      }
    }
    return getInitialSampleOrders();
  });

  const [currentTimeMs, setCurrentTimeMs] = useState(Date.now());
  const [viewMode, setViewMode] = useState<'board' | 'grid'>('board');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'recebido' | 'preparo' | 'pronto'>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);
  const [isRealtimeActive, setIsRealtimeActive] = useState(false);

  // Modals state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Sync ticker: update elapsed wait times every 1 second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTimeMs(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Save local orders state to localStorage for persistence in demo mode
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('burger_kds_local_orders', JSON.stringify(pedidos));
    }
  }, [pedidos]);

  // Load orders from Supabase if configured
  const loadSupabaseData = useCallback(async () => {
    const config = getStoredSupabaseConfig();
    if (!config.url || !config.anonKey) {
      setIsSupabaseConnected(false);
      setIsRealtimeActive(false);
      return;
    }

    setIsRefreshing(true);
    const result = await fetchSupabaseOrders();
    setIsRefreshing(false);

    if (result.error) {
      console.warn('Supabase fetch error:', result.error);
      setIsSupabaseConnected(false);
    } else {
      setIsSupabaseConnected(true);
      if (result.orders.length > 0) {
        setPedidos(result.orders);
      }
    }
  }, []);

  // Connect & setup realtime subscription
  useEffect(() => {
    loadSupabaseData();

    // Subscribe to realtime postgres changes
    const unsubscribe = subscribeToOrdersRealtime((payload) => {
      setIsRealtimeActive(true);
      setIsSupabaseConnected(true);

      if (payload.eventType === 'INSERT' && payload.newRow) {
        kitchenAudio.playNewOrderSound();
        setPedidos((prev) => {
          // Prevent duplicates
          if (prev.some((p) => p.id === payload.newRow!.id)) return prev;
          return [payload.newRow!, ...prev];
        });
      } else if (payload.eventType === 'UPDATE' && payload.newRow) {
        setPedidos((prev) =>
          prev.map((p) => (p.id === payload.newRow!.id ? payload.newRow! : p))
        );
      } else if (payload.eventType === 'DELETE' && payload.oldId) {
        setPedidos((prev) => prev.filter((p) => p.id !== payload.oldId));
      }
    });

    return () => {
      unsubscribe();
    };
  }, [loadSupabaseData]);

  // Update order status (recebido -> preparo -> pronto -> entregue)
  const handleUpdateStatus = async (id: string, newStatus: StatusPedido) => {
    // Optimistic UI update
    setPedidos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: newStatus, updated_at: new Date().toISOString() } : p))
    );

    // If connected to Supabase, update remote database
    const config = getStoredSupabaseConfig();
    if (config.url && config.anonKey) {
      await updateSupabaseOrderStatus(id, newStatus);
    }
  };

  // Toggle item completed checkmark in the kitchen
  const handleToggleItemCheck = (pedidoId: string, itemIndex: number) => {
    setPedidos((prev) =>
      prev.map((p) => {
        if (p.id !== pedidoId) return p;
        const currentItems: ItemPedido[] = Array.isArray(p.itens)
          ? [...p.itens]
          : typeof p.itens === 'string'
          ? [{ nome: p.itens, quantidade: 1 }]
          : [];

        if (currentItems[itemIndex]) {
          currentItems[itemIndex] = {
            ...currentItems[itemIndex],
            concluido: !currentItems[itemIndex].concluido,
          };
        }
        return { ...p, itens: currentItems };
      })
    );
  };

  // Create new order (either local or via Supabase)
  const handleCreateNewOrder = async (novoPedidoData: Partial<Pedido>) => {
    const config = getStoredSupabaseConfig();

    if (config.url && config.anonKey) {
      const res = await insertSupabaseOrder(novoPedidoData);
      if (res.data) {
        kitchenAudio.playNewOrderSound();
        setPedidos((prev) => [res.data!, ...prev]);
        return;
      }
    }

    // Local state fallback
    const localOrder: Pedido = {
      id: `local-${Date.now()}`,
      numero_pedido: novoPedidoData.numero_pedido || `#${Math.floor(Math.random() * 900 + 100)}`,
      nome_cliente: novoPedidoData.nome_cliente || 'Cliente Balcão',
      itens: novoPedidoData.itens || [],
      observacoes: novoPedidoData.observacoes || null,
      status: novoPedidoData.status || 'recebido',
      tipo_entrega: novoPedidoData.tipo_entrega || 'salao',
      mesa_ou_comanda: novoPedidoData.mesa_ou_comanda || 'Mesa 01',
      created_at: novoPedidoData.created_at || new Date().toISOString(),
    };

    kitchenAudio.playNewOrderSound();
    setPedidos((prev) => [localOrder, ...prev]);
  };

  // Quick 1-click order simulator for busy kitchen demonstration
  const handleQuickSimulateOrder = () => {
    const nomes = ['Camila Ramos', 'Leonardo Silva', 'Juliana Castro', 'Matheus Souza', 'Renata Faria'];
    const nome = nomes[Math.floor(Math.random() * nomes.length)];
    const template = sampleBurgerTemplates[Math.floor(Math.random() * sampleBurgerTemplates.length)];
    const num = Math.floor(Math.random() * 899 + 101);

    const observacoesExemplos = [
      'Sem picles e sem cebola roxa. Carne no ponto da casa.',
      'Alergia a lactose! Não colocar queijo no segundo lanche.',
      'Carne BEM PASSADA. Maionese à parte para viagem.',
      'Pão bem dourado na chapa e bacon crocante.',
    ];
    const obs = Math.random() > 0.3 ? observacoesExemplos[Math.floor(Math.random() * observacoesExemplos.length)] : null;

    handleCreateNewOrder({
      numero_pedido: `#${num}`,
      nome_cliente: nome,
      itens: [
        {
          id: `item-${Date.now()}-1`,
          nome: template.nome,
          quantidade: Math.random() > 0.6 ? 2 : 1,
          detalhes: template.detalhes,
          removidos: obs && obs.includes('Sem') ? ['Sem picles', 'Sem cebola'] : [],
          concluido: false,
        },
        {
          id: `item-${Date.now()}-2`,
          nome: 'Batata Rústica Individual',
          quantidade: 1,
          detalhes: 'Com sal de alecrim',
          concluido: false,
        },
      ],
      observacoes: obs,
      status: 'recebido',
      tipo_entrega: Math.random() > 0.5 ? 'salao' : 'delivery',
      mesa_ou_comanda: Math.random() > 0.5 ? `Mesa 0${Math.floor(Math.random() * 8 + 1)}` : `iFood #${Math.floor(Math.random() * 9000 + 1000)}`,
      created_at: new Date().toISOString(),
    });
  };

  // Filtered orders
  const activeOrders = useMemo(() => {
    return pedidos
      .filter((p) => p.status !== 'entregue')
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()); // Mais antigos primeiro na cozinha!
  }, [pedidos]);

  const deliveredOrders = useMemo(() => {
    return pedidos
      .filter((p) => p.status === 'entregue')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [pedidos]);

  // Display orders after search & status filters
  const displayedOrders = useMemo(() => {
    return activeOrders.filter((pedido) => {
      if (statusFilter !== 'todos' && pedido.status !== statusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchNumero = String(pedido.numero_pedido).toLowerCase().includes(query);
        const matchNome = pedido.nome_cliente.toLowerCase().includes(query);
        const matchObs = pedido.observacoes?.toLowerCase().includes(query) || false;
        const matchItens = Array.isArray(pedido.itens)
          ? pedido.itens.some((i) => i.nome.toLowerCase().includes(query))
          : String(pedido.itens).toLowerCase().includes(query);

        return matchNumero || matchNome || matchObs || matchItens;
      }
      return true;
    });
  }, [activeOrders, statusFilter, searchQuery]);

  // Orders by column
  const ordersFila = useMemo(() => activeOrders.filter((p) => p.status === 'recebido'), [activeOrders]);
  const ordersChapa = useMemo(() => activeOrders.filter((p) => p.status === 'preparo'), [activeOrders]);
  const ordersPronto = useMemo(() => activeOrders.filter((p) => p.status === 'pronto'), [activeOrders]);

  // Kitchen Metrics
  const metrics = useMemo(() => {
    if (activeOrders.length === 0) {
      return { avgWaitMinutes: 0, urgentCount: 0 };
    }

    let totalSeconds = 0;
    let urgents = 0;

    activeOrders.forEach((p) => {
      const wait = calculateWaitTime(p.created_at, currentTimeMs);
      totalSeconds += wait.totalSeconds;
      if (wait.isUrgent) {
        urgents += 1;
      }
    });

    return {
      avgWaitMinutes: Math.round(totalSeconds / activeOrders.length / 60),
      urgentCount: urgents,
    };
  }, [activeOrders, currentTimeMs]);

  // Next order number calculation
  const nextOrderNumber = useMemo(() => {
    const nums = pedidos
      .map((p) => parseInt(String(p.numero_pedido).replace(/\D/g, ''), 10))
      .filter((n) => !isNaN(n));
    return nums.length > 0 ? Math.max(...nums) + 1 : 105;
  }, [pedidos]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans select-none">
      {/* KDS HEADER */}
      <Header
        activeCount={activeOrders.length}
        avgWaitMinutes={metrics.avgWaitMinutes}
        urgentCount={metrics.urgentCount}
        isSupabaseConnected={isSupabaseConnected}
        isRealtimeActive={isRealtimeActive}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenNewOrder={() => setIsNewOrderOpen(true)}
        onManualRefresh={loadSupabaseData}
        isRefreshing={isRefreshing}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        historyCount={deliveredOrders.length}
      />

      {/* FILTER & CONTROL SUBBAR */}
      <div className="bg-zinc-900/60 border-b border-zinc-800/80 px-4 py-2.5">
        <div className="max-w-[1720px] mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Segmented Filter Controls */}
          <div className="flex items-center gap-1 p-1 bg-zinc-950 rounded-xl border border-zinc-800/80">
            <button
              type="button"
              onClick={() => setStatusFilter('todos')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
                statusFilter === 'todos'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span>Todos os Ativos</span>
              <span className="font-mono-numbers text-[11px] px-1.5 py-0.2 rounded bg-zinc-700/60 text-zinc-300">
                {activeOrders.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('recebido')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
                statusFilter === 'recebido'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span>Na Fila</span>
              <span className="font-mono-numbers text-[11px] px-1.5 py-0.2 rounded bg-blue-950 text-blue-200 border border-blue-800/40">
                {ordersFila.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('preparo')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
                statusFilter === 'preparo'
                  ? 'bg-amber-500 text-zinc-950 shadow-sm font-extrabold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Na Chapa</span>
              <span className="font-mono-numbers text-[11px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-200 border border-amber-800/40">
                {ordersChapa.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('pronto')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
                statusFilter === 'pronto'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span>Prontos</span>
              <span className="font-mono-numbers text-[11px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-200 border border-emerald-800/40">
                {ordersPronto.length}
              </span>
            </button>
          </div>

          {/* Search, Layout Switch & Quick Simulator */}
          <div className="flex items-center gap-2.5">
            {/* Search Box */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar pedido, cliente ou item..."
                className="w-48 sm:w-64 pl-8 pr-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
              />
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2.5" />
            </div>

            {/* Quick simulator shortcut */}
            <button
              type="button"
              onClick={handleQuickSimulateOrder}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-300 border border-zinc-700 text-xs font-bold transition-colors"
              title="Gera um pedido de hambúrguer realista instantaneamente"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>+ Simular Pedido Rápido</span>
            </button>

            {/* Board / Grid Toggle */}
            <div className="flex items-center p-0.5 rounded-lg bg-zinc-950 border border-zinc-800">
              <button
                type="button"
                onClick={() => setViewMode('board')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'board' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
                }`}
                title="Visão por Colunas de Estação (Board)"
              >
                <Columns3 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'grid' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
                }`}
                title="Visão em Grade de Tickets (Grid)"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN KITCHEN DISPLAY VIEW */}
      <main className="flex-1 p-4 max-w-[1720px] w-full mx-auto">
        {/* EMPTY STATE */}
        {activeOrders.length === 0 ? (
          <div className="h-[60vh] flex flex-col items-center justify-center text-center p-6 bg-zinc-900/30 rounded-2xl border border-zinc-800/60 max-w-lg mx-auto my-12">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
              <UtensilsCrossed className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2 font-display uppercase tracking-wide">
              Chapa Limpa / Nenhum Pedido Ativo
            </h3>
            <p className="text-sm text-zinc-400 max-w-sm mb-6 leading-relaxed">
              Todos os pedidos foram entregues! Novos pedidos enviados via Supabase aparecerão aqui automaticamente com alarme sonoro e cronômetro em tempo real.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleQuickSimulateOrder}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs flex items-center gap-2 transition-all shadow-lg shadow-amber-950/40"
              >
                <Sparkles className="w-4 h-4" />
                <span>Simular Chegada de Pedido</span>
              </button>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs border border-zinc-700 transition-colors"
              >
                Configurar Supabase
              </button>
            </div>
          </div>
        ) : viewMode === 'board' && statusFilter === 'todos' ? (
          /* ==========================================================
             BOARD VIEW: 3 Dedicated Kitchen Station Columns
             ========================================================== */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
            {/* COLUMN 1: RECEBIDOS / FILA */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-blue-950/40 border border-blue-900/40">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span className="font-bold text-sm tracking-wide text-blue-200 uppercase font-display">
                    1. Fila de Entrada
                  </span>
                </div>
                <span className="font-mono-numbers px-2 py-0.5 rounded bg-blue-900/60 text-blue-200 text-xs font-bold border border-blue-800/50">
                  {ordersFila.length}
                </span>
              </div>

              <div className="space-y-4">
                {ordersFila.length === 0 ? (
                  <div className="p-8 text-center rounded-xl border border-dashed border-zinc-800 text-zinc-500 text-xs">
                    Nenhum pedido na fila de espera
                  </div>
                ) : (
                  ordersFila.map((pedido) => (
                    <TicketCard
                      key={pedido.id}
                      pedido={pedido}
                      currentTimeMs={currentTimeMs}
                      onUpdateStatus={handleUpdateStatus}
                      onToggleItemCheck={handleToggleItemCheck}
                    />
                  ))
                )}
              </div>
            </div>

            {/* COLUMN 2: NA CHAPA / EM PREPARO */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-amber-950/40 border border-amber-900/40">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <span className="font-bold text-sm tracking-wide text-amber-200 uppercase font-display">
                    2. Na Chapa / Montagem
                  </span>
                </div>
                <span className="font-mono-numbers px-2 py-0.5 rounded bg-amber-900/60 text-amber-200 text-xs font-bold border border-amber-800/50">
                  {ordersChapa.length}
                </span>
              </div>

              <div className="space-y-4">
                {ordersChapa.length === 0 ? (
                  <div className="p-8 text-center rounded-xl border border-dashed border-zinc-800 text-zinc-500 text-xs">
                    Nenhum hambúrguer sendo preparado agora
                  </div>
                ) : (
                  ordersChapa.map((pedido) => (
                    <TicketCard
                      key={pedido.id}
                      pedido={pedido}
                      currentTimeMs={currentTimeMs}
                      onUpdateStatus={handleUpdateStatus}
                      onToggleItemCheck={handleToggleItemCheck}
                    />
                  ))
                )}
              </div>
            </div>

            {/* COLUMN 3: PRONTO / EXPEDIÇÃO */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-950/40 border border-emerald-900/40">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="font-bold text-sm tracking-wide text-emerald-200 uppercase font-display">
                    3. Pronto / Expedição
                  </span>
                </div>
                <span className="font-mono-numbers px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-200 text-xs font-bold border border-emerald-800/50">
                  {ordersPronto.length}
                </span>
              </div>

              <div className="space-y-4">
                {ordersPronto.length === 0 ? (
                  <div className="p-8 text-center rounded-xl border border-dashed border-zinc-800 text-zinc-500 text-xs">
                    Nenhum pedido aguardando despacho
                  </div>
                ) : (
                  ordersPronto.map((pedido) => (
                    <TicketCard
                      key={pedido.id}
                      pedido={pedido}
                      currentTimeMs={currentTimeMs}
                      onUpdateStatus={handleUpdateStatus}
                      onToggleItemCheck={handleToggleItemCheck}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        ) : (
          /* ==========================================================
             GRID VIEW / FILTERED VIEW
             ========================================================== */
          <div>
            {displayedOrders.length === 0 ? (
              <div className="p-12 text-center text-zinc-500 text-sm">
                <Filter className="w-8 h-8 mx-auto mb-2 opacity-50" />
                Nenhum pedido corresponde ao filtro selecionado.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                {displayedOrders.map((pedido) => (
                  <TicketCard
                    key={pedido.id}
                    pedido={pedido}
                    currentTimeMs={currentTimeMs}
                    onUpdateStatus={handleUpdateStatus}
                    onToggleItemCheck={handleToggleItemCheck}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* FOOTER BAR: KITCHEN LEGEND & STATUS */}
      <footer className="mt-auto bg-zinc-950 border-t border-zinc-900 px-4 py-2.5 text-xs text-zinc-400">
        <div className="max-w-[1720px] mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Legenda de tempos de espera da cozinha */}
          <div className="flex items-center gap-4 text-[11px]">
            <span className="text-zinc-500 font-semibold uppercase tracking-wider">Cronômetro de Espera:</span>
            
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-zinc-400">&lt; 10 min (Normal)</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-zinc-400">10 a 18 min (Atenção)</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-red-300 font-bold">&gt; 18 min (Urgente / Atrasado)</span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-zinc-400">
            <span>
              {isSupabaseConnected ? (
                <span className="text-emerald-400">● Conectado ao Supabase</span>
              ) : (
                <span className="text-zinc-400">Modo Demonstração Ativo</span>
              )}
            </span>
            <span className="text-zinc-700">·</span>
            <span>Sistema KDS de Hamburgueria</span>
          </div>
        </div>
      </footer>

      {/* MODALS & DRAWERS */}
      <SupabaseConfigModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onConnectionChanged={loadSupabaseData}
      />

      <NewOrderModal
        isOpen={isNewOrderOpen}
        onClose={() => setIsNewOrderOpen(false)}
        onSubmit={handleCreateNewOrder}
        nextOrderNumber={nextOrderNumber}
      />

      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        pedidosEntregues={deliveredOrders}
        onReopenPedido={(id) => handleUpdateStatus(id, 'preparo')}
      />
    </div>
  );
}
