import { useState, useEffect } from 'react';

/**
 * Hook para persistir dados de formulário no localStorage
 * Mantém os dados mesmo ao trocar de aba
 */
export function useFormPersistence<T>(storageKey: string, initialState: T) {
  const [formData, setFormData] = useState<T>(() => {
    // Carrega dados salvos ao montar o componente
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Erro ao carregar dados salvos:', error);
    }
    return initialState;
  });

  // Salva no localStorage sempre que os dados mudarem
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(formData));
    } catch (error) {
      console.error('Erro ao salvar dados:', error);
    }
  }, [formData, storageKey]);

  // Função para limpar os dados salvos (após submissão)
  const clearSavedData = () => {
    try {
      localStorage.removeItem(storageKey);
      setFormData(initialState);
    } catch (error) {
      console.error('Erro ao limpar dados:', error);
    }
  };

  return [formData, setFormData, clearSavedData] as const;
}
