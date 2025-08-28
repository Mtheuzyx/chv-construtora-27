/**
 * Configurações de performance e estabilidade
 */

// Configurações de debounce para melhorar performance
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Configurações de throttle para melhorar performance
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Configurações de virtualização para tabelas grandes
export const getVirtualizationConfig = (dataLength: number, containerHeight: number) => {
  const rowHeight = 48; // Altura padrão da linha
  const overscan = 5; // Número de linhas extras para renderizar
  
  // Calcular quantas linhas cabem na tela
  const visibleRows = Math.ceil(containerHeight / rowHeight);
  
  // Determinar se deve usar virtualização
  const shouldVirtualize = dataLength > visibleRows * 2;
  
  return {
    shouldVirtualize,
    rowHeight,
    overscan,
    visibleRows,
    totalHeight: dataLength * rowHeight,
  };
};

// Configurações de scroll para melhor performance
export const getScrollConfig = () => {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  
  return {
    // Usar scroll suave apenas em dispositivos que suportam bem
    smoothScroll: !isMobile && !isSafari,
    
    // Configurar overscroll behavior
    overscrollBehavior: isMobile ? 'contain' : 'auto',
    
    // Configurar scrollbar
    scrollbarWidth: isMobile ? 'none' : 'thin',
    
    // Configurar touch scroll
    touchScroll: isMobile,
  };
};

// Configurações de animação para melhor performance
export const getAnimationConfig = () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isLowEndDevice = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;
  
  return {
    // Desabilitar animações se o usuário preferir movimento reduzido
    enabled: !prefersReducedMotion,
    
    // Reduzir duração em dispositivos de baixa performance
    duration: isLowEndDevice ? 0.1 : 0.3,
    
    // Usar transform em vez de propriedades que causam reflow
    useTransform: true,
    
    // Limitar animações simultâneas
    maxConcurrent: isLowEndDevice ? 2 : 5,
  };
};

// Configurações de cache para melhorar performance
export const getCacheConfig = () => {
  return {
    // Tamanho máximo do cache em MB
    maxSize: 50,
    
    // Tempo de expiração em minutos
    expirationTime: 30,
    
    // Limpar cache automaticamente
    autoCleanup: true,
    
    // Usar localStorage para cache persistente
    useLocalStorage: true,
  };
};

// Função para otimizar imagens
export const optimizeImage = (src: string, width: number, height: number) => {
  // Se a imagem já tem dimensões otimizadas, retornar como está
  if (src.includes('data:image') || src.includes('blob:')) {
    return src;
  }
  
  // Para imagens externas, adicionar parâmetros de otimização
  if (src.startsWith('http')) {
    const url = new URL(src);
    url.searchParams.set('w', width.toString());
    url.searchParams.set('h', height.toString());
    url.searchParams.set('fit', 'crop');
    url.searchParams.set('auto', 'format,compress');
    return url.toString();
  }
  
  return src;
};

// Função para pré-carregar recursos importantes
export const preloadResources = (resources: string[]) => {
  resources.forEach(resource => {
    try {
      if (resource.endsWith('.css')) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = resource;
        link.as = 'style';
        document.head.appendChild(link);
      } else if (resource.endsWith('.js')) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = resource;
        link.as = 'script';
        document.head.appendChild(link);
      } else if (resource.match(/\.(png|jpg|jpeg|gif|webp|svg)$/)) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = resource;
        link.as = 'image';
        document.head.appendChild(link);
      }
    } catch (error) {
      console.warn('Erro ao pré-carregar recurso:', resource, error);
    }
  });
};

// Função para monitorar performance
export const monitorPerformance = () => {
  if ('performance' in window) {
    try {
      // Monitorar tempo de carregamento
      window.addEventListener('load', () => {
        const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
        console.log(`Tempo de carregamento: ${loadTime}ms`);
        
        // Se o carregamento for muito lento, aplicar otimizações
        if (loadTime > 5000) {
          console.warn('Carregamento lento detectado, aplicando otimizações...');
          // Aplicar otimizações específicas para dispositivos lentos
        }
      });
      
      // Monitorar memória (se disponível)
      if ('memory' in performance) {
        setInterval(() => {
          const memory = (performance as any).memory;
          const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
          const totalMB = Math.round(memory.totalJSHeapSize / 1024 / 1024);
          
          if (usedMB > totalMB * 0.8) {
            console.warn('Uso de memória alto detectado:', `${usedMB}MB / ${totalMB}MB`);
          }
        }, 10000);
      }
    } catch (error) {
      console.warn('Erro ao monitorar performance:', error);
    }
  }
};

// Função para otimizar tabelas grandes
export const optimizeTablePerformance = (tableElement: HTMLElement) => {
  try {
    // Usar transform para animações de scroll
    tableElement.style.willChange = 'transform';
    
    // Otimizar reflow
    const rows = tableElement.querySelectorAll('tr');
    rows.forEach(row => {
      (row as HTMLElement).style.willChange = 'auto';
    });
    
    // Usar IntersectionObserver para lazy loading
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      }, {
        threshold: 0.1,
        rootMargin: '50px'
      });
      
      rows.forEach(row => observer.observe(row));
    }
  } catch (error) {
    console.warn('Erro ao otimizar tabela:', error);
  }
};

// Configurações padrão de performance
export const defaultPerformanceConfig = {
  debounce,
  throttle,
  getVirtualizationConfig,
  getScrollConfig,
  getAnimationConfig,
  getCacheConfig,
  optimizeImage,
  preloadResources,
  monitorPerformance,
  optimizeTablePerformance,
};

