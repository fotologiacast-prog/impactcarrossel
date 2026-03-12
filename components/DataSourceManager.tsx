import React, { useState, useEffect } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database, ArrowRight, Check, X, Loader2, AlertCircle, Save } from 'lucide-react';
import { SlideDefinition as Slide, Block } from '../types';

interface DataSourceManagerProps {
  supabase: SupabaseClient;
  onImport: (slides: Slide[]) => void;
  onClose?: () => void;
  isConfigMode?: boolean;
}

type ColumnMapping = {
  title: string;
  subtitle: string;
  image: string;
  category: string;
  author: string;
  avatar: string;
  
  // Branding
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  fontFamily: string;
};

const STORAGE_KEY = 'supabase_mapping_config';

export const DataSourceManager: React.FC<DataSourceManagerProps> = ({ supabase, onImport, onClose, isConfigMode = false }) => {
  const [step, setStep] = useState<'TABLE' | 'MAPPING'>('TABLE');
  const [tableName, setTableName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [sampleData, setSampleData] = useState<any[]>([]);
  const [mapping, setMapping] = useState<Partial<Record<keyof ColumnMapping, string>>>({});

  // Load saved config on mount
  useEffect(() => {
    const savedConfig = localStorage.getItem(STORAGE_KEY);
    if (savedConfig) {
      try {
        const { tableName: savedTable, mapping: savedMapping } = JSON.parse(savedConfig);
        if (savedTable) {
            setTableName(savedTable);
            setMapping(savedMapping || {});
            // If we are just opening the manager, we might want to fetch structure immediately to show mapping
            // But let's let the user click "Connect" to confirm/refresh
        }
      } catch (e) {
        console.error("Failed to parse saved config", e);
      }
    }
  }, []);

  const fetchTableStructure = async () => {
    if (!tableName) return;
    setIsLoading(true);
    setError(null);
    try {
      // Fetch one row to get columns
      const { data, error } = await supabase.from(tableName).select('*').limit(3);
      
      if (error) throw error;
      if (!data || data.length === 0) throw new Error('Tabela vazia ou não encontrada.');

      setSampleData(data);
      setColumns(Object.keys(data[0]));
      setStep('MAPPING');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao buscar tabela.');
    } finally {
      setIsLoading(false);
    }
  };

  const processData = (data: any[], currentMapping: Partial<Record<keyof ColumnMapping, string>>) => {
      return data.map((row) => {
      const blocks: Block[] = [];
      
      // 1. Category/Badge
      if (currentMapping.category && row[currentMapping.category]) {
        blocks.push({
          type: 'BADGE',
          content: String(row[currentMapping.category]),
          options: {
            variant: 'pill',
            color: currentMapping.accentColor ? row[currentMapping.accentColor] : '#1fb2f7',
            align: 'left'
          }
        });
      }

      // 2. Title
      if (currentMapping.title && row[currentMapping.title]) {
        blocks.push({
          type: 'TITLE',
          content: String(row[currentMapping.title]),
          options: {
            level: 1,
            align: 'left',
            color: currentMapping.textColor ? row[currentMapping.textColor] : '#ffffff',
            fontFamily: currentMapping.fontFamily ? row[currentMapping.fontFamily] : undefined
          }
        });
      }

      // 3. Subtitle/Body
      if (currentMapping.subtitle && row[currentMapping.subtitle]) {
        blocks.push({
          type: 'PARAGRAPH',
          content: String(row[currentMapping.subtitle]),
          options: {
            align: 'left',
            color: currentMapping.textColor ? row[currentMapping.textColor] : '#e4e4e7',
            fontSize: 24
          }
        });
      }

      // 4. Author/User
      if (currentMapping.author && row[currentMapping.author]) {
        blocks.push({
          type: 'USER',
          content: String(row[currentMapping.author]),
          options: {
            avatar: currentMapping.avatar ? row[currentMapping.avatar] : undefined,
            handle: '@' + String(row[currentMapping.author]).toLowerCase().replace(/\s/g, ''),
            align: 'left'
          }
        });
      }

      return {
        template: 'EDITORIAL', // Default template
        blocks,
        image: currentMapping.image && row[currentMapping.image] ? {
          type: 'IMAGE_SPLIT_HALF',
          url: row[currentMapping.image],
          position: 'right',
          boxScale: 1,
          backgroundOpacity: 1
        } : undefined,
        options: {
          background: currentMapping.backgroundColor ? row[currentMapping.backgroundColor] : '#050507',
          text: currentMapping.textColor ? row[currentMapping.textColor] : '#ffffff',
          accent: currentMapping.accentColor ? row[currentMapping.accentColor] : '#1fb2f7',
          fontPadrão: currentMapping.fontFamily ? row[currentMapping.fontFamily] : 'Inter',
          padding: 60,
          blockGap: 24
        }
      } as Slide;
    });
  };

  const handleSaveAndSync = async () => {
    // Save config
    const config = { tableName, mapping };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));

    // Fetch full data
    setIsLoading(true);
    try {
        const { data, error } = await supabase.from(tableName).select('*');
        if (error) throw error;
        
        if (data) {
            const slides = processData(data, mapping);
            onImport(slides);
        }
    } catch (err: any) {
        setError(err.message || "Erro ao sincronizar dados.");
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className={`flex flex-col h-full ${isConfigMode ? '' : 'fixed inset-0 z-[2000] items-center justify-center bg-black/90 backdrop-blur-xl animate-in fade-in'}`}>
      <div className={`w-full bg-zinc-900 border border-white/10 flex flex-col ${isConfigMode ? 'h-full border-none bg-transparent' : 'max-w-2xl rounded-[32px] shadow-2xl max-h-[90vh] overflow-hidden'}`}>
        
        {/* Header - Only show close button if not in config mode (modal mode) */}
        {!isConfigMode && (
            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-zinc-950/50">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-brand/10 rounded-xl text-brand">
                <Database size={24} />
                </div>
                <div>
                <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Conexão Supabase</h2>
                <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Gerenciar Fonte de Dados</p>
                </div>
            </div>
            {onClose && (
                <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-zinc-500 transition-colors">
                    <X size={24} />
                </button>
            )}
            </div>
        )}

        {isConfigMode && (
             <div className="p-6 border-b border-white/5 space-y-2">
                <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Fonte de Dados</h2>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Configure a tabela mestra do sistema</p>
             </div>
        )}

        {/* Content */}
        <div className={`overflow-y-auto custom-scrollbar flex-1 ${isConfigMode ? 'p-6' : 'p-8'}`}>
          {step === 'TABLE' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase text-zinc-400 tracking-widest px-1">Nome da Tabela</label>
                <input 
                  type="text" 
                  value={tableName} 
                  onChange={(e) => setTableName(e.target.value)}
                  placeholder="ex: posts_instagram"
                  className="w-full bg-black/40 border border-white/5 rounded-2xl p-5 text-lg font-bold text-white outline-none focus:border-brand/50 transition-all placeholder:text-zinc-700"
                  autoFocus={!isConfigMode}
                />
              </div>
              
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400">
                  <AlertCircle size={18} />
                  <span className="text-xs font-bold">{error}</span>
                </div>
              )}

              <button 
                onClick={fetchTableStructure} 
                disabled={!tableName || isLoading}
                className="w-full py-5 bg-brand text-black font-black uppercase rounded-2xl shadow-lg hover:bg-brand/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3"
              >
                {isLoading ? <Loader2 size={20} className="animate-spin" /> : <ArrowRight size={20} />}
                {isLoading ? 'Buscando...' : 'Conectar Tabela'}
              </button>
            </div>
          )}

          {step === 'MAPPING' && (
            <div className="space-y-8 animate-in slide-in-from-right-8">
              <div className="p-4 bg-brand/5 border border-brand/10 rounded-2xl">
                <p className="text-xs text-brand font-medium">
                  <span className="font-black uppercase tracking-wider mr-2">Conectado:</span> 
                  {columns.length} colunas disponíveis.
                </p>
              </div>

              <div className={`grid gap-8 ${isConfigMode ? 'grid-cols-1' : 'grid-cols-2'}`}>
                <div className="space-y-6">
                  <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] border-b border-white/5 pb-2">Conteúdo</h3>
                  
                  {[
                    { key: 'title', label: 'Título Principal' },
                    { key: 'subtitle', label: 'Texto / Corpo' },
                    { key: 'image', label: 'Imagem de Destaque' },
                    { key: 'category', label: 'Categoria / Badge' },
                    { key: 'author', label: 'Nome do Autor' },
                    { key: 'avatar', label: 'Avatar do Autor' },
                  ].map((field) => (
                    <div key={field.key} className="space-y-2">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{field.label}</label>
                      <select 
                        className="w-full bg-zinc-950 border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-brand/50"
                        onChange={(e) => setMapping(prev => ({ ...prev, [field.key]: e.target.value }))}
                        value={mapping[field.key as keyof ColumnMapping] || ''}
                      >
                        <option value="">-- Ignorar --</option>
                        {columns.map(c => <option key={c} value={c}>{c} (ex: {String(sampleData[0][c]).substring(0, 15)}...)</option>)}
                      </select>
                    </div>
                  ))}
                </div>

                <div className="space-y-6">
                  <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] border-b border-white/5 pb-2">Branding & Estilo</h3>
                  
                  {[
                    { key: 'backgroundColor', label: 'Cor de Fundo' },
                    { key: 'textColor', label: 'Cor do Texto' },
                    { key: 'accentColor', label: 'Cor de Destaque' },
                    { key: 'fontFamily', label: 'Nome da Fonte' },
                  ].map((field) => (
                    <div key={field.key} className="space-y-2">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{field.label}</label>
                      <select 
                        className="w-full bg-zinc-950 border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-brand/50"
                        onChange={(e) => setMapping(prev => ({ ...prev, [field.key]: e.target.value }))}
                        value={mapping[field.key as keyof ColumnMapping] || ''}
                      >
                        <option value="">-- Usar Padrão --</option>
                        {columns.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                  <button 
                    onClick={() => setStep('TABLE')}
                    className="px-6 py-4 bg-zinc-800 text-zinc-400 font-black uppercase rounded-2xl hover:text-white hover:bg-zinc-700 transition-all text-[10px] tracking-widest"
                  >
                    Voltar
                  </button>
                  <button 
                    onClick={handleSaveAndSync}
                    className="flex-1 py-4 bg-brand text-black font-black uppercase rounded-2xl shadow-lg hover:bg-brand/90 transition-all flex items-center justify-center gap-3 text-[10px] tracking-widest"
                  >
                    {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    Salvar e Sincronizar
                  </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
