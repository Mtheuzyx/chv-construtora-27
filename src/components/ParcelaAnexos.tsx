import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Paperclip, Upload, Download, Trash2, FileText, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/utils/formatters';

interface Anexo {
  id: string;
  parcela_id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  file_type: string | null;
  uploaded_at: string;
}

interface ParcelaAnexosProps {
  parcelaId: string;
  fornecedorNome: string;
  numeroParcela: number;
}

export function ParcelaAnexos({ parcelaId, fornecedorNome, numeroParcela }: ParcelaAnexosProps) {
  const [anexos, setAnexos] = useState<Anexo[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadAnexos();
  }, [parcelaId]);

  useEffect(() => {
    if (open) {
      loadAnexos();
    }
  }, [open]);

  const loadAnexos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('parcela_anexos')
        .select('*')
        .eq('parcela_id', parcelaId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setAnexos(data || []);
    } catch (error) {
      console.error('Erro ao carregar anexos:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar anexos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Validar tamanho do arquivo (máx 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "O arquivo deve ter no máximo 10MB",
        variant: "destructive"
      });
      return;
    }

    try {
      setUploading(true);

      // Criar nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${parcelaId}_${Date.now()}.${fileExt}`;
      const filePath = `${parcelaId}/${fileName}`;

      // Upload para o storage
      const { error: uploadError } = await supabase.storage
        .from('parcela-anexos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Registrar na tabela
      const { error: dbError } = await supabase
        .from('parcela_anexos')
        .insert({
          parcela_id: parcelaId,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          file_type: file.type
        });

      if (dbError) throw dbError;

      toast({
        title: "Arquivo enviado!",
        description: `${file.name} foi enviado com sucesso`,
      });

      // Recarregar lista
      loadAnexos();
      
      // Limpar input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Erro ao enviar arquivo:', error);
      toast({
        title: "Erro ao enviar arquivo",
        description: "Ocorreu um erro ao enviar o arquivo",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (anexo: Anexo) => {
    try {
      const { data, error } = await supabase.storage
        .from('parcela-anexos')
        .download(anexo.file_path);

      if (error) throw error;

      // Criar URL temporária e fazer download
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = anexo.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Download iniciado",
        description: anexo.file_name,
      });
    } catch (error) {
      console.error('Erro ao baixar arquivo:', error);
      toast({
        title: "Erro ao baixar arquivo",
        description: "Ocorreu um erro ao baixar o arquivo",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (anexo: Anexo) => {
    if (!window.confirm(`Tem certeza que deseja excluir ${anexo.file_name}?`)) {
      return;
    }

    try {
      // Deletar do storage
      const { error: storageError } = await supabase.storage
        .from('parcela-anexos')
        .remove([anexo.file_path]);

      if (storageError) throw storageError;

      // Deletar do banco
      const { error: dbError } = await supabase
        .from('parcela_anexos')
        .delete()
        .eq('id', anexo.id);

      if (dbError) throw dbError;

      toast({
        title: "Arquivo excluído",
        description: anexo.file_name,
      });

      loadAnexos();
    } catch (error) {
      console.error('Erro ao excluir arquivo:', error);
      toast({
        title: "Erro ao excluir arquivo",
        description: "Ocorreu um erro ao excluir o arquivo",
        variant: "destructive"
      });
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'N/A';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-6 w-6 p-0 relative"
          title="Anexos"
        >
          <Paperclip className="h-3 w-3" />
          {anexos.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[8px] rounded-full h-3 w-3 flex items-center justify-center">
              {anexos.length}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            Anexos - {fornecedorNome} (Parcela {numeroParcela})
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Upload area */}
          <div className="border-2 border-dashed rounded-lg p-4 text-center">
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              disabled={uploading}
              className="hidden"
              id={`file-upload-${parcelaId}`}
            />
            <label
              htmlFor={`file-upload-${parcelaId}`}
              className="cursor-pointer"
            >
              <div className="flex flex-col items-center gap-2">
                {uploading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                ) : (
                  <Upload className="h-8 w-8 text-muted-foreground" />
                )}
                <div className="text-sm">
                  {uploading ? (
                    <span className="text-primary">Enviando arquivo...</span>
                  ) : (
                    <>
                      <span className="text-primary font-medium">Clique para enviar</span>
                      <span className="text-muted-foreground"> ou arraste arquivos</span>
                    </>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  Máximo 10MB por arquivo
                </div>
              </div>
            </label>
          </div>

          {/* Lista de anexos */}
          <div className="space-y-2">
            <div className="text-sm font-medium">
              Arquivos anexados ({anexos.length})
            </div>
            
            {loading ? (
              <div className="text-center py-4">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
              </div>
            ) : anexos.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground text-sm">
                Nenhum arquivo anexado
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {anexos.map((anexo) => (
                  <div
                    key={anexo.id}
                    className="flex items-center gap-2 p-2 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {anexo.file_name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatFileSize(anexo.file_size)} • {new Date(anexo.uploaded_at).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(anexo)}
                        className="h-7 w-7 p-0"
                        title="Baixar"
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(anexo)}
                        className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="Excluir"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
