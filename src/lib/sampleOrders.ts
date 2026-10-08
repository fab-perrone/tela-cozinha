import { Pedido } from '../types/order';

export const getInitialSampleOrders = (): Pedido[] => {
  const now = Date.now();

  return [
    {
      id: 'mock-104',
      numero_pedido: '104',
      nome_cliente: 'Gabriel Siqueira',
      tipo_entrega: 'salao',
      mesa_ou_comanda: 'Mesa 04',
      status: 'recebido',
      created_at: new Date(now - 4 * 60 * 1000 - 15 * 1000).toISOString(), // ~4 min atrás (Verde)
      observacoes: 'Sem cebola roxa em nenhum dos lanches! Ponto da carne: Ao Ponto para Bem.',
      itens: [
        {
          id: 'item-1',
          nome: 'Smash Duplo Cheddar Bacon',
          quantidade: 2,
          detalhes: 'Pão Brioche, 2x Blend 90g, Cheddar Inglês, Bacon Crocante',
          removidos: ['Sem cebola roxa'],
          adicionais: ['Bacon extra'],
          concluido: false,
        },
        {
          id: 'item-2',
          nome: 'Batata Rústica com Alecrim e Páprica',
          quantidade: 1,
          detalhes: 'Porção Média (Acompanha Maionese Verde)',
          concluido: false,
        },
        {
          id: 'item-3',
          nome: 'Refrigerante Lata Zero Açúcar',
          quantidade: 2,
          detalhes: 'Com gelo e limão',
          concluido: true,
        },
      ],
    },
    {
      id: 'mock-103',
      numero_pedido: '103',
      nome_cliente: 'Mariana Duarte',
      tipo_entrega: 'delivery',
      mesa_ou_comanda: 'iFood #8912',
      status: 'preparo',
      created_at: new Date(now - 12 * 60 * 1000 - 45 * 1000).toISOString(), // ~12 min atrás (Amarelo)
      observacoes: 'ALERGIA A GERGELIM. Usar pão australiano ou sem gergelim. Molho da casa em potinho separado para não murchar.',
      itens: [
        {
          id: 'item-4',
          nome: 'Burger Trufado Supreme',
          quantidade: 1,
          detalhes: 'Blend 160g, Queijo Brie maçaricado, Maionese Trufada, Rúcula fresca',
          removidos: ['Sem pão com gergelim'],
          concluido: true,
        },
        {
          id: 'item-5',
          nome: 'Burger Costela BBQ Artesanal',
          quantidade: 1,
          detalhes: 'Blend de Costela 180g, Cebola caramelizada, Molho Barbecue defumado',
          concluido: false,
        },
        {
          id: 'item-6',
          nome: 'Onion Rings Crocantes (12 un)',
          quantidade: 1,
          detalhes: 'Acompanha Barbecue defumado',
          concluido: false,
        },
      ],
    },
    {
      id: 'mock-102',
      numero_pedido: '102',
      nome_cliente: 'Rodrigo Fontes',
      tipo_entrega: 'balcao',
      mesa_ou_comanda: 'Comanda 18',
      status: 'preparo',
      created_at: new Date(now - 21 * 60 * 1000 - 30 * 1000).toISOString(), // ~21 min atrás (Vermelho - URGENTE)
      observacoes: 'Carne BEM PASSADA (urgente, cliente reclamou da demora). Cortar o lanche ao meio.',
      itens: [
        {
          id: 'item-7',
          nome: 'Monster Smash Triplo Cheese',
          quantidade: 1,
          detalhes: '3x Blend 80g smashed, American cheese triplo, Picles artesanal',
          adicionais: ['Carne bem passada'],
          concluido: false,
        },
        {
          id: 'item-8',
          nome: 'Batata Frita Crinkle Grande',
          quantidade: 1,
          detalhes: 'Com Cheddar derretido e Crispy de Cebola',
          concluido: false,
        },
        {
          id: 'item-9',
          nome: 'Milkshake de Frutas Vermelhas 400ml',
          quantidade: 1,
          concluido: true,
        },
      ],
    },
    {
      id: 'mock-101',
      numero_pedido: '101',
      nome_cliente: 'Patrícia Alencar',
      tipo_entrega: 'retirada',
      mesa_ou_comanda: 'Retirada #03',
      status: 'pronto',
      created_at: new Date(now - 16 * 60 * 1000).toISOString(),
      observacoes: 'Embalar para viagem com saquinho térmico. Enviar guardanapos extras.',
      itens: [
        {
          id: 'item-10',
          nome: 'Classic Cheese Bacon Burger',
          quantidade: 2,
          detalhes: 'Pão brioche tostado na manteiga, queijo prato',
          concluido: true,
        },
        {
          id: 'item-11',
          nome: 'Mini Churros com Doce de Leite (6 un)',
          quantidade: 1,
          concluido: true,
        },
      ],
    },
  ];
};

export const sampleBurgerTemplates = [
  {
    nome: 'Smash Duplo Melt Bacon',
    detalhes: 'Pão brioche, 2x smash 90g, queijo cheddar cremoso e bacon fatiado',
  },
  {
    nome: 'Burger Costela BBQ Supreme',
    detalhes: 'Blend costela 180g, queijo coalho na chapa, cebola crispy e BBQ',
  },
  {
    nome: 'Oklahoma Onion Smash',
    detalhes: '2x smash 80g prensados com cebola fininha, american cheese e picles',
  },
  {
    nome: 'Quarto de Libra Artesanal',
    detalhes: 'Blend 120g alto, duplo queijo prato, cebola picadinha, picles e ketchup',
  },
  {
    nome: 'Burger Frango Crispy Empanado',
    detalhes: 'Sobrecoxa empanada ultracrocante, salada coleslaw e maionese de páprica',
  },
  {
    nome: 'Batata Rústica Individual',
    detalhes: 'Com sal de alecrim e maionese verde',
  },
  {
    nome: 'Almofadinhas de Gouda Empanadas',
    detalhes: 'Porção com 8 unidades e geleia de pimenta',
  },
];
