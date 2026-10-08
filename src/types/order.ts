export type StatusPedido = 'recebido' | 'preparo' | 'pronto' | 'entregue';

export interface ItemAdicional {
  nome: string;
  preco?: number;
}

export interface ItemPedido {
  id?: string;
  nome: string;
  quantidade: number;
  detalhes?: string; // Ex: "Ponto da carne: Ao ponto" ou "Pão Brioche"
  adicionais?: string[]; // Ex: ["Bacon extra", "Queijo prato dobro"]
  removidos?: string[]; // Ex: ["Sem picles", "Sem maionese"]
  concluido?: boolean; // Kitchen checkmark
}

export interface Pedido {
  id: string; // ID único (uuid do Supabase ou gerado)
  numero_pedido: string | number; // Ex: "#102" ou "102"
  nome_cliente: string; // Ex: "Carlos Silveira"
  itens: ItemPedido[] | string; // Suporta array de itens ou JSON string vindo do Supabase
  observacoes?: string | null; // Ex: "Alergia a amendoim. Carne bem passada."
  status: StatusPedido;
  created_at: string; // ISO timestamp de quando o ticket foi aberto
  tipo_entrega?: 'salao' | 'balcao' | 'delivery' | 'retirada';
  mesa_ou_comanda?: string; // Ex: "Mesa 08" ou "Comanda 14"
  atendente?: string;
  updated_at?: string;
  tempo_finalizado?: string; // Timestamp de quando foi entregue
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  tableName: string;
  isConnected: boolean;
  lastSync?: string;
  error?: string | null;
}

export type TempoNivel = 'normal' | 'atencao' | 'critico';
