import React from 'react';
import { X, CheckCircle2, RotateCcw, Clock, User, Utensils } from 'lucide-react';
import { Pedido, StatusPedido, ItemPedido } from '../types/order';
import { calculateWaitTime, formatOrderTime } from '../lib/timeUtils';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  pedidosEntregues: Pedido[];
  onReopenPedido: (id: string) => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  pedidosEntregues,
  onReopenPedido,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-zinc-900 border-l border-zinc-800 h-full flex flex-col shadow-2xl">
        {/* HEADER */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">Pedidos Entregues / Expedidos</h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* LIST */}
        <div className="p-4 flex-1 overflow-y-auto space-y-3">
          {pedidosEntregues.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-center text-zinc-500">
              <Utensils className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">Nenhum pedido finalizado nesta sessão.</p>
            </div>
          ) : (
            pedidosEntregues.map((pedido) => {
              const waitInfo = calculateWaitTime(pedido.created_at);
              const itemsList: ItemPedido[] = Array.isArray(pedido.itens)
                ? pedido.itens
                : typeof pedido.itens === 'string'
                ? [{ nome: pedido.itens, quantidade: 1 }]
                : [];

              return (
                <div
                  key={pedido.id}
                  className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono-numbers font-black text-lg text-zinc-200">
                        {pedido.numero_pedido}
                      </span>
                      <span className="text-zinc-400 flex items-center gap-1 font-medium">
                        <User className="w-3 h-3" />
                        {pedido.nome_cliente}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-zinc-400 font-mono-numbers">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{waitInfo.display}</span>
                    </div>
                  </div>

                  {/* Summary of items */}
                  <div className="text-zinc-400 space-y-0.5">
                    {itemsList.map((item, idx) => (
                      <div key={idx} className="truncate">
                        <strong className="text-zinc-300 font-mono-numbers">{item.quantidade}x</strong>{' '}
                        {item.nome}
                      </div>
                    ))}
                  </div>

                  {pedido.observacoes && (
                    <div className="p-1.5 rounded bg-amber-950/30 text-amber-300/80 text-[11px]">
                      {pedido.observacoes}
                    </div>
                  )}

                  <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-400">
                    <span>Aberto às {formatOrderTime(pedido.created_at)}</span>

                    <button
                      type="button"
                      onClick={() => onReopenPedido(pedido.id)}
                      className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 flex items-center gap-1 transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reabrir para Chapa</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
