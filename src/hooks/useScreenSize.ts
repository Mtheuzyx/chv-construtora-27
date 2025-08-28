import { useState, useEffect, useCallback } from 'react';

export const useScreenSize = () => {
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  const updateScreenSize = useCallback(() => {
    try {
      if (typeof window === 'undefined') return;
      
      const newSize = {
        width: window.innerWidth,
        height: window.innerHeight,
      };
      
      setScreenSize(newSize);
      
      // Atualizar estados de breakpoint
      const mobile = newSize.width < 768;
      const tablet = newSize.width >= 768 && newSize.width < 1024;
      const desktop = newSize.width >= 1024;
      
      setIsMobile(mobile);
      setIsTablet(tablet);
      setIsDesktop(desktop);
    } catch (error) {
      console.error('Erro ao atualizar tamanho da tela:', error);
      // Fallback para valores padrão
      setScreenSize({ width: 1024, height: 768 });
      setIsMobile(false);
      setIsTablet(false);
      setIsDesktop(true);
    }
  }, []);

  useEffect(() => {
    try {
      // Verificar se estamos no browser
      if (typeof window === 'undefined') return;

      // Set initial values
      updateScreenSize();

      // Adicionar event listener com debounce para melhor performance
      let timeoutId: NodeJS.Timeout;
      const handleResize = () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(updateScreenSize, 100);
      };

      window.addEventListener('resize', handleResize, { passive: true });
      
      // Adicionar listener para mudanças de orientação em dispositivos móveis
      window.addEventListener('orientationchange', () => {
        setTimeout(updateScreenSize, 100);
      });

      return () => {
        clearTimeout(timeoutId);
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('orientationchange', updateScreenSize);
      };
    } catch (error) {
      console.error('Erro ao configurar listeners de resize:', error);
    }
  }, [updateScreenSize]);

  // Função para forçar atualização do tamanho da tela
  const forceUpdate = useCallback(() => {
    updateScreenSize();
  }, [updateScreenSize]);

  return {
    ...screenSize,
    isMobile,
    isTablet,
    isDesktop,
    forceUpdate,
    // Breakpoints específicos para casos especiais
    isSmallMobile: screenSize.width < 480,
    isLargeMobile: screenSize.width >= 480 && screenSize.width < 768,
    isLargeDesktop: screenSize.width >= 1400,
  };
};