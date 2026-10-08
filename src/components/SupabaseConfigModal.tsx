import React, { useState } from 'react';
import { 
  X, 
  Database, 
  Check, 
  Copy, 
  AlertCircle, 
  ExternalLink, 
  Sparkles,
  RefreshCw,
  Code
} from 'lucide-react';
import { 
  getStoredSupabaseConfig, 
  saveStoredSupabaseConfig, 
  getSupabaseTableSQL, 
  fetchSupabaseOrders,
  insertSupabaseOrder
} from '../lib/supabase';
import { getInitialSampleOrders } from '../lib/sampleOrders';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectionChanged: () => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({
  isOpen,
  onClose,
  onConnectionChanged,
}) => {
  const currentConfig = getStoredSupabaseConfig();
  const [url, setUrl] = useState(currentConfig.url);
  const [anonKey, setAnonKey] = useState(currentConfig.anonKey);
  const [tableName, setTableName] = useState(currentConfig.tableName || 'pedidos');
  
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedSQL, setCopiedSQL] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [showSqlGuide, setShowSqlGuide] = useState(false);

  if (!isOpen) return null;

  const handleSaveAndTest = async () => {
    setIsTesting(true);
    setTestResult(null);

    saveStoredSupabaseConfig(url, anonKey, tableName);

    if (!url.trim() || !anonKey.trim()) {
      setIsTesting(false);
      setTestResult({
        success: false,
        message: 'Por favor, informe a URL do projeto e a chave anônima (anon public key).',
      });
      return;
    }

    try {
      const res = await fetchSupabaseOrders();
      if (res.error) {
        setTestResult({
          success: false,
          message: `Erro ao conectar com tabela "${tableName}": ${res.error}. Verifique se a tabela foi criada no Supabase e se o RLS permite leitura.`,
        });
      } else {
        setTestResult({
          success: true,
          message: `Conexão estabelecida com sucesso! Encontrados ${res.orders.length} pedidos na tabela "${tableName}".`,
        });
        onConnectionChanged();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha desconhecida';
      setTestResult({
        success: false,
        message: `Falha na requisição: ${msg}`,
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleCopySQL = () => {
    const sql = getSupabaseTableSQL(tableName || 'pedidos');
    navigator.clipboard.writeText(sql).then(() => {
      setCopiedSQL(true);
      setTimeout(() => setCopiedSQL(false), 2500);
    });
  };

  const handleSeedRemoteTable = async () => {
    setIsSeeding(true);
    try {
      const samples = getInitialSampleOrders();
      for (const sample of samples) {
        await insertSupabaseOrder(sample);
      }
      setTestResult({
        success: true,
        message: 'Exemplos de pedidos enviados com sucesso para sua tabela no Supabase!',
      });
      onConnectionChanged();
    } catch {
      setTestResult({
        success: false,
        message: 'Erro ao enviar pedidos de teste para o Supabase.',
      });
    } finally {
      setIsSeeding(false);
    }
  };

  const handleClearConfig = () => {
    saveStoredSupabaseConfig('', '', 'pedidos');
    setUrl('');
    setAnonKey('');
    setTableName('pedidos');
    setTestResult({
      success: true,
      message: 'Configuração removida. O sistema agora opera em modo demonstração local.',
    });
    onConnectionChanged();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* MODAL HEADER */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-800/60 text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Conexão com Supabase</h2>
              <p className="text-xs text-zinc-400">
                Integre sua tela de cozinha diretamente ao banco de dados e receba pedidos em tempo real.
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

        {/* MODAL BODY */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Status feedback */}
          {testResult && (
            <div
              className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                testResult.success
                  ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-200'
                  : 'bg-red-950/40 border-red-800/80 text-red-200'
              }`}
            >
              {testResult.success ? (
                <Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              )}
              <div className="text-xs leading-relaxed">{testResult.message}</div>
            </div>
          )}

          {/* Form fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
                Project URL do Supabase
              </label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://xyzabcdefg.supabase.co"
                className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-950 border border-zinc-700 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 font-mono text-xs"
              />
              <span className="text-[11px] text-zinc-400 mt-1 block">
                Encontrado em <em>Project Settings &gt; API &gt; Project URL</em>.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
                Project API Key (Anon / Public)
              </label>
              <input
                type="password"
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-950 border border-zinc-700 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 font-mono text-xs"
              />
              <span className="text-[11px] text-zinc-400 mt-1 block">
                Chave anônima pública (anon/public key) com permissão de leitura e atualização.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
                Nome da Tabela no Banco
              </label>
              <input
                type="text"
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                placeholder="pedidos"
                className="w-full px-3.5 py-2.5 rounded-lg bg-zinc-950 border border-zinc-700 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 font-mono text-xs"
              />
              <span className="text-[11px] text-zinc-400 mt-1 block">
                Por padrão: <code>pedidos</code>. Contém as colunas solicitadas: <code>numero_pedido</code>, <code>nome_cliente</code>, <code>itens</code>, <code>observacoes</code>, <code>status</code>, <code>created_at</code>.
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-800">
            <button
              type="button"
              onClick={handleSaveAndTest}
              disabled={isTesting}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
              <span>{isTesting ? 'Testando Conexão...' : 'Salvar e Conectar'}</span>
            </button>

            {url && anonKey && (
              <button
                type="button"
                onClick={handleSeedRemoteTable}
                disabled={isSeeding}
                className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-300 font-semibold text-xs flex items-center gap-1.5 transition-colors"
                title="Insere pedidos de exemplo na sua tabela do Supabase"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{isSeeding ? 'Enviando...' : 'Inserir Pedidos Teste no Supabase'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleClearConfig}
              className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 text-xs transition-colors ml-auto"
            >
              Limpar / Usar Modo Demo
            </button>
          </div>

          {/* SQL Setup Helper Section */}
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-200">
                <Code className="w-4 h-4 text-amber-400" />
                <span>Script SQL de Criação da Tabela</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowSqlGuide(!showSqlGuide)}
                  className="text-xs text-amber-400 hover:underline"
                >
                  {showSqlGuide ? 'Ocultar código' : 'Ver código SQL'}
                </button>

                <button
                  type="button"
                  onClick={handleCopySQL}
                  className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs flex items-center gap-1 transition-colors"
                >
                  {copiedSQL ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSQL ? 'Copiado!' : 'Copiar SQL'}</span>
                </button>
              </div>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Para começar rápido no seu projeto Supabase: acesse o menu <strong>SQL Editor</strong>, clique em <strong>New Query</strong>, cole o código acima e clique em <strong>Run</strong>. A tabela já virá configurada com permissões e Realtime ativo!
            </p>

            {showSqlGuide && (
              <pre className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg text-[11px] font-mono text-zinc-300 overflow-x-auto max-h-48">
                {getSupabaseTableSQL(tableName || 'pedidos')}
              </pre>
            )}
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="px-6 py-3.5 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-1.5">
            <span>Precisa de um projeto Supabase grátis?</span>
            <a
              href="https://supabase.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400 hover:underline inline-flex items-center gap-1 font-medium"
            >
              <span>supabase.com</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-medium transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
