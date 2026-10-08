import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { Pedido, StatusPedido, ItemPedido } from '../types/order';

const LOCAL_STORAGE_KEY_URL = 'burger_kds_supabase_url';
const LOCAL_STORAGE_KEY_KEY = 'burger_kds_supabase_key';
const LOCAL_STORAGE_KEY_TABLE = 'burger_kds_supabase_table';

let supabaseInstance: SupabaseClient | null = null;
let currentUrl: string = '';
let currentKey: string = '';

export const getStoredSupabaseConfig = () => {
  const envUrl = (import.meta as unknown as { env: Record<string, string> }).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as unknown as { env: Record<string, string> }).env?.VITE_SUPABASE_ANON_KEY || '';
  const envTable = (import.meta as unknown as { env: Record<string, string> }).env?.VITE_SUPABASE_TABLE || 'pedidos';

  const storedUrl = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_STORAGE_KEY_URL) : '';
  const storedKey = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_STORAGE_KEY_KEY) : '';
  const storedTable = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_STORAGE_KEY_TABLE) : '';

  return {
    url: storedUrl || envUrl || '',
    anonKey: storedKey || envKey || '',
    tableName: storedTable || envTable || 'pedidos',
  };
};

export const saveStoredSupabaseConfig = (url: string, anonKey: string, tableName: string = 'pedidos') => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_STORAGE_KEY_URL, url.trim());
    localStorage.setItem(LOCAL_STORAGE_KEY_KEY, anonKey.trim());
    localStorage.setItem(LOCAL_STORAGE_KEY_TABLE, tableName.trim() || 'pedidos');
  }
  // Reset cached instance to recreate with new credentials
  supabaseInstance = null;
  currentUrl = '';
  currentKey = '';
};

export const getSupabaseClient = (): SupabaseClient | null => {
  const config = getStoredSupabaseConfig();
  if (!config.url || !config.anonKey) {
    return null;
  }

  if (supabaseInstance && currentUrl === config.url && currentKey === config.anonKey) {
    return supabaseInstance;
  }

  try {
    supabaseInstance = createClient(config.url, config.anonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
    currentUrl = config.url;
    currentKey = config.anonKey;
    return supabaseInstance;
  } catch (err) {
    console.error('Erro ao instanciar Supabase client:', err);
    return null;
  }
};

// Normalize raw row from Supabase to Pedido interface
export const normalizeSupabaseRow = (row: Record<string, unknown>): Pedido => {
  let parsedItens: ItemPedido[] = [];

  const rawItens = row.itens ?? row.items ?? row.itens_selecionados;
  if (Array.isArray(rawItens)) {
    parsedItens = rawItens.map((item, idx) => {
      if (typeof item === 'string') {
        return { id: `item-${idx}`, nome: item, quantidade: 1, concluido: false };
      }
      return {
        id: item.id || `item-${idx}`,
        nome: item.nome || item.name || 'Item sem nome',
        quantidade: Number(item.quantidade || item.qtd || item.quantity || 1),
        detalhes: item.detalhes || item.descricao || item.ponto || '',
        adicionais: Array.isArray(item.adicionais) ? item.adicionais : [],
        removidos: Array.isArray(item.removidos) ? item.removidos : [],
        concluido: Boolean(item.concluido),
      };
    });
  } else if (typeof rawItens === 'string') {
    try {
      const parsed = JSON.parse(rawItens);
      if (Array.isArray(parsed)) {
        parsedItens = parsed;
      } else {
        parsedItens = [{ id: 'item-1', nome: rawItens, quantidade: 1, concluido: false }];
      }
    } catch {
      // Split by commas or linebreaks if plain text
      parsedItens = rawItens.split(/\n|,/).map((text, idx) => ({
        id: `item-${idx}`,
        nome: text.trim(),
        quantidade: 1,
        concluido: false,
      })).filter(i => i.nome.length > 0);
    }
  }

  const rawStatus = String(row.status || 'recebido').toLowerCase().trim();
  let status: StatusPedido = 'recebido';
  if (['recebido', 'pendente', 'fila', 'aberto', 'novo'].includes(rawStatus)) status = 'recebido';
  else if (['preparo', 'em_preparo', 'fazendo', 'cozinha', 'chapa'].includes(rawStatus)) status = 'preparo';
  else if (['pronto', 'pronta', 'concluido', 'aguardando_retirada'].includes(rawStatus)) status = 'pronto';
  else if (['entregue', 'finalizado', 'despachado', 'arquivado'].includes(rawStatus)) status = 'entregue';

  const rawTipo = String(row.tipo_entrega || row.tipo || 'salao').toLowerCase();
  let tipo_entrega: 'salao' | 'balcao' | 'delivery' | 'retirada' = 'salao';
  if (rawTipo.includes('deliv')) tipo_entrega = 'delivery';
  else if (rawTipo.includes('balc')) tipo_entrega = 'balcao';
  else if (rawTipo.includes('retir')) tipo_entrega = 'retirada';

  return {
    id: String(row.id || `sup-${Date.now()}`),
    numero_pedido: String(row.numero_pedido ?? row.numero ?? row.order_number ?? `#${Math.floor(Math.random() * 900 + 100)}`),
    nome_cliente: String(row.nome_cliente ?? row.cliente ?? row.customer_name ?? 'Cliente Balcão'),
    itens: parsedItens,
    observacoes: row.observacoes ? String(row.observacoes) : (row.notes ? String(row.notes) : null),
    status,
    created_at: String(row.created_at || row.abertura_ticket || row.data_hora || new Date().toISOString()),
    tipo_entrega,
    mesa_ou_comanda: row.mesa_ou_comanda ? String(row.mesa_ou_comanda) : (row.mesa ? `Mesa ${row.mesa}` : (row.comanda ? `Comanda ${row.comanda}` : undefined)),
    updated_at: row.updated_at ? String(row.updated_at) : undefined,
  };
};

// Fetch orders from Supabase
export const fetchSupabaseOrders = async (): Promise<{ orders: Pedido[]; error: string | null }> => {
  const client = getSupabaseClient();
  const config = getStoredSupabaseConfig();

  if (!client) {
    return { orders: [], error: 'Supabase não configurado. Adicione a URL e Chave Anon.' };
  }

  try {
    const { data, error } = await client
      .from(config.tableName)
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      return { orders: [], error: error.message };
    }

    if (!data) {
      return { orders: [], error: null };
    }

    const normalized = data.map((row) => normalizeSupabaseRow(row as Record<string, unknown>));
    return { orders: normalized, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Falha na comunicação com Supabase';
    return { orders: [], error: msg };
  }
};

// Update order status in Supabase
export const updateSupabaseOrderStatus = async (
  id: string,
  newStatus: StatusPedido
): Promise<{ success: boolean; error: string | null }> => {
  const client = getSupabaseClient();
  const config = getStoredSupabaseConfig();

  if (!client) {
    return { success: false, error: 'Supabase não conectado' };
  }

  try {
    const { error } = await client
      .from(config.tableName)
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao atualizar status';
    return { success: false, error: msg };
  }
};

// Insert a new order to Supabase
export const insertSupabaseOrder = async (
  pedido: Partial<Pedido>
): Promise<{ data: Pedido | null; error: string | null }> => {
  const client = getSupabaseClient();
  const config = getStoredSupabaseConfig();

  if (!client) {
    return { data: null, error: 'Supabase não conectado' };
  }

  try {
    const payload = {
      numero_pedido: pedido.numero_pedido,
      nome_cliente: pedido.nome_cliente,
      itens: pedido.itens,
      observacoes: pedido.observacoes || null,
      status: pedido.status || 'recebido',
      tipo_entrega: pedido.tipo_entrega || 'salao',
      mesa_ou_comanda: pedido.mesa_ou_comanda || null,
      created_at: pedido.created_at || new Date().toISOString(),
    };

    const { data, error } = await client
      .from(config.tableName)
      .insert([payload])
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: normalizeSupabaseRow(data as Record<string, unknown>), error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao inserir pedido';
    return { data: null, error: msg };
  }
};

// Subscribe to real-time changes
export const subscribeToOrdersRealtime = (
  onPayload: (payload: { eventType: string; newRow: Pedido | null; oldId: string | null }) => void
): (() => void) => {
  const client = getSupabaseClient();
  const config = getStoredSupabaseConfig();

  if (!client) {
    return () => {};
  }

  try {
    const channel: RealtimeChannel = client
      .channel(`kitchen-orders-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: config.tableName,
        },
        (payload) => {
          let newRow: Pedido | null = null;
          let oldId: string | null = null;

          if (payload.new && Object.keys(payload.new).length > 0) {
            newRow = normalizeSupabaseRow(payload.new as Record<string, unknown>);
          }
          if (payload.old && typeof payload.old === 'object' && 'id' in payload.old) {
            oldId = String((payload.old as { id: unknown }).id);
          }

          onPayload({
            eventType: payload.eventType,
            newRow,
            oldId,
          });
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  } catch (err) {
    console.error('Falha ao iniciar canal Realtime Supabase:', err);
    return () => {};
  }
};

// Generate standard SQL schema for Supabase
export const getSupabaseTableSQL = (tableName = 'pedidos') => {
  return `-- ==========================================================
-- SQL para criar a tabela de pedidos da Hamburgueria no Supabase
-- Cole no Editor SQL do seu projeto no Supabase (SQL Editor)
-- ==========================================================

create table if not exists public.${tableName} (
  id uuid primary key default gen_random_uuid(),
  numero_pedido text not null,
  nome_cliente text not null,
  itens jsonb not null default '[]'::jsonb,
  observacoes text,
  status text not null default 'recebido' check (status in ('recebido', 'preparo', 'pronto', 'entregue')),
  tipo_entrega text default 'salao',
  mesa_ou_comanda text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Ativar Realtime na tabela para tela de cozinha receber instantaneamente:
alter publication supabase_realtime add table public.${tableName};

-- Habilitar RLS e permitir leitura/escrita para anon (KDS da cozinha):
alter table public.${tableName} enable row level security;

create policy "Permitir leitura anonima da cozinha"
  on public.${tableName} for select
  using (true);

create policy "Permitir atualizacao de status pela cozinha"
  on public.${tableName} for update
  using (true);

create policy "Permitir insercao de novos pedidos"
  on public.${tableName} for insert
  with check (true);

-- Inserir pedidos de teste com itens e observações:
insert into public.${tableName} (numero_pedido, nome_cliente, itens, observacoes, status, tipo_entrega, mesa_ou_comanda, created_at)
values 
(
  '#201',
  'Felipe Albuquerque',
  '[{"nome":"Smash Duplo Bacon","quantidade":2,"detalhes":"Pão Brioche, Cheddar Duplo","removidos":["Sem picles"]},{"nome":"Batata Rústica","quantidade":1}]'::jsonb,
  'Carne BEM PASSADA! Pão bem tostado na manteiga.',
  'recebido',
  'salao',
  'Mesa 02',
  now() - interval '5 minutes'
),
(
  '#202',
  'Larissa Nogueira',
  '[{"nome":"Burger Costela Supreme","quantidade":1,"detalhes":"Queijo Brie e Cebola Crispy"},{"nome":"Onion Rings","quantidade":1}]'::jsonb,
  'ALERGIA SEVERA: Sem gergelim. Molho barbecue em pote separado.',
  'preparo',
  'delivery',
  'iFood #5421',
  now() - interval '14 minutes'
);
`;
};
