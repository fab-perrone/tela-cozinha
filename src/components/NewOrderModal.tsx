import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  UtensilsCrossed, 
  Send, 
  User, 
  AlertTriangle 
} from 'lucide-react';
import { Pedido, ItemPedido } from '../types/order';
import { sampleBurgerTemplates } from '../lib/sampleOrders';

interface NewOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (pedido: Partial<Pedido>) => void;
  nextOrderNumber: number;
}

export const NewOrderModal: React.FC<NewOrderModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  nextOrderNumber,
}) => {
  const [numero, setNumero] = useState(String(nextOrderNumber));
  const [nomeCliente, setNomeCliente] = useState('');
  const [tipoEntrega, setTipoEntrega] = useState<'salao' | 'balcao' | 'delivery' | 'retirada'>('salao');
  const [mesaOuComanda, setMesaOuComanda] = useState('Mesa 05');
  const [observacoes, setObservacoes] = useState('');
  const [itens, setItens] = useState<ItemPedido[]>([
    {
      id: 'i-1',
      nome: 'Smash Duplo Cheddar Bacon',
      quantidade: 1,
      detalhes: 'Pão brioche, 2x blend 90g, cheddar cremoso',
      removidos: [],
      adicionais: [],
      concluido: false,
    },
    {
      id: 'i-2',
      nome: 'Batata Rústica com Alecrim',
      quantidade: 1,
      detalhes: 'Acompanha maionese verde',
      removidos: [],
      adicionais: [],
      concluido: false,
    },
  ]);

  if (!isOpen) return null;

  const handleAddItem = (template?: { nome: string; detalhes: string }) => {
    if (template) {
      setItens([
        ...itens,
        {
          id: `item-${Date.now()}-${Math.random()}`,
          nome: template.nome,
          quantidade: 1,
          detalhes: template.detalhes,
          removidos: [],
          adicionais: [],
          concluido: false,
        },
      ]);
    } else {
      setItens([
        ...itens,
        {
          id: `item-${Date.now()}-${Math.random()}`,
          nome: 'Burger Artesanal',
          quantidade: 1,
          detalhes: 'Blend 160g',
          removidos: [],
          adicionais: [],
          concluido: false,
        },
      ]);
    }
  };

  const handleUpdateItem = (index: number, updates: Partial<ItemPedido>) => {
    const next = [...itens];
    next[index] = { ...next[index], ...updates };
    setItens(next);
  };

  const handleRemoveItem = (index: number) => {
    setItens(itens.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeCliente.trim()) {
      alert('Por favor, informe o nome do cliente.');
      return;
    }
    if (itens.length === 0) {
      alert('Adicione pelo menos 1 item ao pedido.');
      return;
    }

    const novoPedido: Partial<Pedido> = {
      numero_pedido: numero.startsWith('#') ? numero : `#${numero}`,
      nome_cliente: nomeCliente.trim(),
      itens,
      observacoes: observacoes.trim() || null,
      status: 'recebido',
      tipo_entrega: tipoEntrega,
      mesa_ou_comanda: mesaOuComanda.trim(),
      created_at: new Date().toISOString(),
    };

    onSubmit(novoPedido);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* HEADER */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Criar Novo Pedido (Simulador de Frente de Caixa)</h2>
              <p className="text-xs text-zinc-400">
                Dispare um novo ticket para testar a notificação e o cronômetro na tela da cozinha.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-sm flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Número do Pedido
              </label>
              <input
                type="text"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-white font-mono font-bold text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Nome do Cliente
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={nomeCliente}
                  onChange={(e) => setNomeCliente(e.target.value)}
                  placeholder="Ex: Lucas Mendonça"
                  required
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-white text-sm focus:outline-none focus:border-amber-500"
                />
                <User className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Tipo de Atendimento
              </label>
              <select
                value={tipoEntrega}
                onChange={(e) => {
                  const val = e.target.value as 'salao' | 'balcao' | 'delivery' | 'retirada';
                  setTipoEntrega(val);
                  if (val === 'salao') setMesaOuComanda('Mesa 05');
                  else if (val === 'balcao') setMesaOuComanda('Comanda 12');
                  else if (val === 'delivery') setMesaOuComanda('iFood #9021');
                  else setMesaOuComanda('Retirada');
                }}
                className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-white text-sm focus:outline-none focus:border-amber-500"
              >
                <option value="salao">Salão (Mesas)</option>
                <option value="balcao">Balcão / Consumo Local</option>
                <option value="delivery">Delivery (iFood / App)</option>
                <option value="retirada">Retirada no Balcão</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Identificação (Mesa / Comanda / App)
              </label>
              <input
                type="text"
                value={mesaOuComanda}
                onChange={(e) => setMesaOuComanda(e.target.value)}
                placeholder="Ex: Mesa 04 ou Comanda 22"
                className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-white text-sm focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* ITENS SELECIONADOS */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                Itens Selecionados ({itens.length})
              </label>
              <button
                type="button"
                onClick={() => handleAddItem()}
                className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Item Manual</span>
              </button>
            </div>

            {/* Quick Burger Templates */}
            <div className="mb-3 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <span className="text-[11px] text-zinc-500 shrink-0">Atalhos rápidos:</span>
              {sampleBurgerTemplates.slice(0, 4).map((tpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAddItem(tpl)}
                  className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white shrink-0 border border-zinc-700 transition-colors"
                >
                  + {tpl.nome}
                </button>
              ))}
            </div>

            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {itens.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="p-3 bg-zinc-950 rounded-lg border border-zinc-800 flex items-start gap-2.5"
                >
                  <div className="w-16">
                    <label className="text-[10px] text-zinc-500 uppercase block">Qtd</label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={item.quantidade}
                      onChange={(e) => handleUpdateItem(idx, { quantidade: Math.max(1, parseInt(e.target.value) || 1) })}
                      className="w-full px-2 py-1 bg-zinc-900 border border-zinc-700 rounded text-center text-white font-mono font-bold text-xs"
                    />
                  </div>

                  <div className="flex-1 space-y-1">
                    <input
                      type="text"
                      value={item.nome}
                      onChange={(e) => handleUpdateItem(idx, { nome: e.target.value })}
                      placeholder="Nome do lanche ou bebida"
                      className="w-full px-2.5 py-1 bg-zinc-900 border border-zinc-700 rounded text-white text-xs font-semibold"
                    />
                    <input
                      type="text"
                      value={item.detalhes || ''}
                      onChange={(e) => handleUpdateItem(idx, { detalhes: e.target.value })}
                      placeholder="Detalhes (ponto da carne, adicionais, etc.)"
                      className="w-full px-2.5 py-1 bg-zinc-900/60 border border-zinc-800 rounded text-zinc-400 text-xs"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-950/40 rounded transition-colors"
                    title="Remover item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* OBSERVAÇÕES DO CLIENTE */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Observações do Cliente (Alergias, Remoções e Ponto da Carne)</span>
            </label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={2}
              placeholder="Ex: Sem cebola roxa. Carne bem passada. Molho barbecue em pote separado."
              className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-white text-xs focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold text-xs flex items-center gap-2 transition-all shadow-lg shadow-amber-950/40"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Enviar para a Cozinha</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
