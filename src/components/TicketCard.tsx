import React from 'react';
import { 
  Flame, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Circle, 
  ArrowRight, 
  RotateCcw, 
  MapPin, 
  Bike, 
  Store, 
  User, 
  AlertCircle
} from 'lucide-react';
import { Pedido, StatusPedido, ItemPedido } from '../types/order';
import { calculateWaitTime, formatOrderTime } from '../lib/timeUtils';
import { kitchenAudio } from '../lib/audio';

interface TicketCardProps {
  pedido: Pedido;
  currentTimeMs: number;
  onUpdateStatus: (id: string, newStatus: StatusPedido) => void;
  onToggleItemCheck: (pedidoId: string, itemIndex: number) => void;
}

export const TicketCard: React.FC<TicketCardProps> = ({
  pedido,
  currentTimeMs,
  onUpdateStatus,
  onToggleItemCheck,
}) => {
  const waitInfo = calculateWaitTime(pedido.created_at, currentTimeMs);
  const horaAbertura = formatOrderTime(pedido.created_at);

  const getTimerStyles = () => {
    switch (waitInfo.nivel) {
      case 'critico':
        return {
          bg: 'bg-red-500/20 text-red-400 border-red-500/40',
          badge: 'bg-red-600 text-white animate-pulse',
          border: 'border-red-500/80 shadow-lg shadow-red-950/40 animate-pulse-critical',
          accent: 'text-red-400',
        };
      case 'atencao':
        return {
          bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          badge: 'bg-amber-600 text-black font-bold',
          border: 'border-amber-500/60 shadow-md shadow-amber-950/20',
          accent: 'text-amber-400',
        };
      case 'normal':
      default:
        return {
          bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
          badge: 'bg-emerald-700 text-white',
          border: 'border-zinc-800 hover:border-zinc-700',
          accent: 'text-emerald-400',
        };
    }
  };

  const timerStyle = getTimerStyles();

  const getStatusMeta = () => {
    switch (pedido.status) {
      case 'recebido':
        return {
          label: 'Fila / Novo',
          bg: 'bg-blue-950/60 text-blue-300 border-blue-800/60',
          nextLabel: 'Iniciar Chapa',
          nextStatus: 'preparo' as StatusPedido,
          icon: <Flame className="w-3.5 h-3.5 text-blue-400" />,
        };
      case 'preparo':
        return {
          label: 'Na Chapa',
          bg: 'bg-amber-950/60 text-amber-300 border-amber-800/60',
          nextLabel: 'Marcar Pronto',
          nextStatus: 'pronto' as StatusPedido,
          icon: <Flame className="w-3.5 h-3.5 text-amber-400" />,
        };
      case 'pronto':
        return {
          label: 'Pronto / Expedição',
          bg: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60',
          nextLabel: 'Despachar / Entregar',
          nextStatus: 'entregue' as StatusPedido,
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
        };
      default:
        return {
          label: 'Finalizado',
          bg: 'bg-zinc-800 text-zinc-400 border-zinc-700',
          nextLabel: 'Reabrir',
          nextStatus: 'preparo' as StatusPedido,
          icon: null,
        };
    }
  };

  const statusMeta = getStatusMeta();

  const getEntregaBadge = () => {
    switch (pedido.tipo_entrega) {
      case 'delivery':
        return {
          label: pedido.mesa_ou_comanda || 'Delivery',
          icon: <Bike className="w-3.5 h-3.5" />,
          color: 'text-purple-300 bg-purple-950/60 border-purple-800/50',
        };
      case 'balcao':
        return {
          label: pedido.mesa_ou_comanda || 'Balcão',
          icon: <Store className="w-3.5 h-3.5" />,
          color: 'text-cyan-300 bg-cyan-950/60 border-cyan-800/50',
        };
      case 'retirada':
        return {
          label: pedido.mesa_ou_comanda || 'Retirada',
          icon: <Store className="w-3.5 h-3.5" />,
          color: 'text-amber-300 bg-amber-950/60 border-amber-800/50',
        };
      case 'salao':
      default:
        return {
          label: pedido.mesa_ou_comanda || 'Salão',
          icon: <MapPin className="w-3.5 h-3.5" />,
          color: 'text-emerald-300 bg-emerald-950/60 border-emerald-800/50',
        };
    }
  };

  const entregaMeta = getEntregaBadge();

  // Normalize items array
  const itemsList: ItemPedido[] = Array.isArray(pedido.itens)
    ? pedido.itens
    : typeof pedido.itens === 'string'
    ? [{ nome: pedido.itens, quantidade: 1, concluido: false }]
    : [];

  const handleNextStatus = () => {
    kitchenAudio.playActionSuccessSound();
    onUpdateStatus(pedido.id, statusMeta.nextStatus);
  };

  const handlePrevStatus = () => {
    if (pedido.status === 'pronto') {
      onUpdateStatus(pedido.id, 'preparo');
    } else if (pedido.status === 'preparo') {
      onUpdateStatus(pedido.id, 'recebido');
    }
  };

  return (
    <div
      className={`flex flex-col bg-zinc-900/90 rounded-xl border transition-all duration-200 overflow-hidden ${timerStyle.border}`}
    >
      {/* TICKET HEADER */}
      <div className="p-4 bg-zinc-900 border-b border-zinc-800/80">
        <div className="flex items-start justify-between gap-2">
          {/* Número do Pedido & Status */}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display text-3xl font-extrabold tracking-tight text-white font-mono-numbers">
                {pedido.numero_pedido.toString().startsWith('#')
                  ? pedido.numero_pedido
                  : `#${pedido.numero_pedido}`}
              </span>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold uppercase tracking-wider border ${statusMeta.bg}`}>
                {statusMeta.icon}
                {statusMeta.label}
              </span>
            </div>

            {/* Nome do Cliente */}
            <div className="mt-1 flex items-center gap-1.5 text-zinc-300 text-sm font-medium">
              <User className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span className="truncate max-w-[190px] font-semibold text-zinc-100">
                {pedido.nome_cliente}
              </span>
            </div>
          </div>

          {/* TEMPO DECORRIDO DESDE A ABERTURA */}
          <div className="flex flex-col items-end shrink-0">
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-mono-numbers font-bold text-lg ${timerStyle.bg}`}
              title={`Abertura do ticket às ${horaAbertura}`}
            >
              <Clock className="w-4 h-4 shrink-0" />
              <span>{waitInfo.display}</span>
            </div>

            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-zinc-400">
              {waitInfo.isUrgent && (
                <span className="px-1.5 py-0.2 text-[10px] font-bold rounded bg-red-600 text-white tracking-wider animate-pulse">
                  ATRASADO
                </span>
              )}
              <span>Aberto: {horaAbertura}</span>
            </div>
          </div>
        </div>

        {/* Localização / Tipo de Pedido */}
        <div className="mt-2.5 flex items-center gap-2">
          <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs border font-medium ${entregaMeta.color}`}>
            {entregaMeta.icon}
            <span>{entregaMeta.label}</span>
          </div>
        </div>
      </div>

      {/* OBSERVAÇÕES DO CLIENTE (DESTAQUE MÁXIMO PARA A COZINHA) */}
      {pedido.observacoes && pedido.observacoes.trim().length > 0 && (
        <div className="mx-3 mt-3 p-3 rounded-lg bg-amber-500/10 border-2 border-amber-500/40 text-amber-200">
          <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider text-amber-400 mb-1">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Observações do Cliente:</span>
          </div>
          <p className="text-sm font-medium leading-snug text-amber-100">
            {pedido.observacoes}
          </p>
        </div>
      )}

      {/* ITENS SELECIONADOS */}
      <div className="p-3.5 flex-1 flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs font-semibold text-zinc-400 uppercase tracking-wider px-1">
          <span>Itens do Pedido ({itemsList.length})</span>
          <span className="text-[11px] font-normal normal-case text-zinc-400">
            Toque p/ marcar
          </span>
        </div>

        <div className="space-y-2">
          {itemsList.map((item, index) => {
            const isDone = item.concluido;

            return (
              <div
                key={item.id || `item-${index}`}
                onClick={() => onToggleItemCheck(pedido.id, index)}
                className={`group p-2.5 rounded-lg border transition-all cursor-pointer select-none ${
                  isDone
                    ? 'bg-zinc-950/60 border-zinc-800/60 opacity-60'
                    : 'bg-zinc-800/50 hover:bg-zinc-800 border-zinc-700/60 hover:border-zinc-600'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {/* Checkbox circular */}
                  <button
                    type="button"
                    aria-label={`Marcar ${item.nome} como ${isDone ? 'pendente' : 'pronto'}`}
                    className="mt-0.5 shrink-0 focus:outline-none"
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <Circle className="w-5 h-5 text-zinc-500 group-hover:text-zinc-300" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className={`font-mono-numbers font-black text-base ${
                        isDone ? 'text-zinc-400 line-through' : 'text-amber-400'
                      }`}>
                        {item.quantidade}x
                      </span>
                      <span className={`font-semibold text-sm leading-snug ${
                        isDone ? 'text-zinc-400 line-through' : 'text-white'
                      }`}>
                        {item.nome}
                      </span>
                    </div>

                    {/* Detalhes do item (ponto da carne, pão, etc.) */}
                    {item.detalhes && (
                      <p className={`text-xs mt-0.5 ${isDone ? 'text-zinc-400' : 'text-zinc-300'}`}>
                        {item.detalhes}
                      </p>
                    )}

                    {/* Modificações / Itens Removidos */}
                    {item.removidos && item.removidos.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {item.removidos.map((rem, rIdx) => (
                          <span
                            key={rIdx}
                            className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[11px] font-bold bg-red-950/80 text-red-300 border border-red-800/60"
                          >
                            <AlertCircle className="w-3 h-3 text-red-400" />
                            {rem}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Adicionais */}
                    {item.adicionais && item.adicionais.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {item.adicionais.map((add, aIdx) => (
                          <span
                            key={aIdx}
                            className="inline-flex items-center px-1.5 py-0.2 rounded text-[11px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800/60"
                          >
                            + {add}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* FOOTER ACTIONS */}
      <div className="p-3 bg-zinc-950/80 border-t border-zinc-800/80 flex items-center gap-2">
        {pedido.status !== 'recebido' && (
          <button
            type="button"
            onClick={handlePrevStatus}
            title="Voltar status anterior"
            className="p-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors border border-zinc-700"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}

        <button
          type="button"
          onClick={handleNextStatus}
          className={`flex-1 py-2.5 px-4 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md ${
            pedido.status === 'recebido'
              ? 'bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-amber-900/30 font-extrabold'
              : pedido.status === 'preparo'
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40'
              : 'bg-zinc-700 hover:bg-zinc-600 text-white'
          }`}
        >
          <span>{statusMeta.nextLabel}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
