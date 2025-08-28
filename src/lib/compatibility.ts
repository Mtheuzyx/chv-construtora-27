/**
 * Configurações de compatibilidade para diferentes máquinas e navegadores
 */

// Detectar o navegador e sistema operacional
export const getBrowserInfo = () => {
  if (typeof window === 'undefined') {
    return {
      browser: 'unknown',
      version: 'unknown',
      os: 'unknown',
      isMobile: false,
      isTablet: false,
      isDesktop: true,
    };
  }

  const userAgent = navigator.userAgent;
  let browser = 'unknown';
  let version = 'unknown';
  let os = 'unknown';

  // Detectar navegador
  if (userAgent.includes('Chrome')) {
    browser = 'Chrome';
    const match = userAgent.match(/Chrome\/(\d+)/);
    if (match) version = match[1];
  } else if (userAgent.includes('Firefox')) {
    browser = 'Firefox';
    const match = userAgent.match(/Firefox\/(\d+)/);
    if (match) version = match[1];
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    browser = 'Safari';
    const match = userAgent.match(/Version\/(\d+)/);
    if (match) version = match[1];
  } else if (userAgent.includes('Edge')) {
    browser = 'Edge';
    const match = userAgent.match(/Edge\/(\d+)/);
    if (match) version = match[1];
  }

  // Detectar sistema operacional
  if (userAgent.includes('Windows')) {
    os = 'Windows';
  } else if (userAgent.includes('Mac')) {
    os = 'macOS';
  } else if (userAgent.includes('Linux')) {
    os = 'Linux';
  } else if (userAgent.includes('Android')) {
    os = 'Android';
  } else if (userAgent.includes('iOS')) {
    os = 'iOS';
  }

  // Detectar dispositivo
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isTablet = /iPad|Android(?=.*\bMobile\b)(?=.*\bSafari\b)/i.test(userAgent);
  const isDesktop = !isMobile && !isTablet;

  return {
    browser,
    version,
    os,
    isMobile,
    isTablet,
    isDesktop,
  };
};

// Configurações específicas para diferentes navegadores
export const getBrowserConfig = () => {
  const browserInfo = getBrowserInfo();
  
  const configs = {
    Chrome: {
      smoothScroll: true,
      virtualScroll: true,
      animations: true,
      touchScroll: false,
    },
    Firefox: {
      smoothScroll: true,
      virtualScroll: true,
      animations: true,
      touchScroll: false,
    },
    Safari: {
      smoothScroll: true,
      virtualScroll: false, // Safari pode ter problemas com virtualização
      animations: true,
      touchScroll: true,
    },
    Edge: {
      smoothScroll: true,
      virtualScroll: true,
      animations: true,
      touchScroll: false,
    },
    unknown: {
      smoothScroll: false,
      virtualScroll: false,
      animations: false,
      touchScroll: false,
    },
  };

  return configs[browserInfo.browser as keyof typeof configs] || configs.unknown;
};

// Configurações específicas para diferentes sistemas operacionais
export const getOSConfig = () => {
  const browserInfo = getBrowserInfo();
  
  const configs = {
    Windows: {
      scrollbarWidth: 'thin',
      scrollbarStyle: 'auto',
      touchSupport: false,
    },
    macOS: {
      scrollbarWidth: 'auto',
      scrollbarStyle: 'overlay',
      touchSupport: false,
    },
    Linux: {
      scrollbarWidth: 'thin',
      scrollbarStyle: 'auto',
      touchSupport: false,
    },
    Android: {
      scrollbarWidth: 'none',
      scrollbarStyle: 'none',
      touchSupport: true,
    },
    iOS: {
      scrollbarWidth: 'none',
      scrollbarStyle: 'none',
      touchSupport: true,
    },
    unknown: {
      scrollbarWidth: 'auto',
      scrollbarStyle: 'auto',
      touchSupport: false,
    },
  };

  return configs[browserInfo.os as keyof typeof configs] || configs.unknown;
};

// Função para aplicar configurações de compatibilidade
export const applyCompatibilitySettings = () => {
  try {
    const browserConfig = getBrowserConfig();
    const osConfig = getOSConfig();
    
    // Aplicar configurações de scroll
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      
      // Configurar scroll suave baseado no navegador
      if (browserConfig.smoothScroll) {
        root.style.scrollBehavior = 'smooth';
      }
      
      // Configurar scrollbar baseado no SO
      if (osConfig.scrollbarWidth === 'none') {
        root.style.setProperty('--scrollbar-width', '0px');
        root.style.setProperty('--scrollbar-display', 'none');
      } else {
        root.style.setProperty('--scrollbar-width', '8px');
        root.style.setProperty('--scrollbar-display', 'block');
      }
      
      // Configurar suporte a touch
      if (osConfig.touchSupport) {
        root.style.setProperty('--touch-scroll', 'true');
        root.style.setProperty('--overscroll-behavior', 'contain');
      } else {
        root.style.setProperty('--touch-scroll', 'false');
        root.style.setProperty('--overscroll-behavior', 'auto');
      }
    }
    
    return { browserConfig, osConfig };
  } catch (error) {
    console.error('Erro ao aplicar configurações de compatibilidade:', error);
    return {
      browserConfig: getBrowserConfig(),
      osConfig: getOSConfig(),
    };
  }
};

// Função para verificar se o navegador suporta recursos específicos
export const checkFeatureSupport = () => {
  if (typeof window === 'undefined') {
    return {
      virtualScroll: false,
      smoothScroll: false,
      animations: false,
      touch: false,
      webGL: false,
    };
  }

  return {
    virtualScroll: 'IntersectionObserver' in window,
    smoothScroll: 'scrollBehavior' in document.documentElement.style,
    animations: 'animate' in Element.prototype,
    touch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    webGL: (() => {
      try {
        const canvas = document.createElement('canvas');
        return !!(window.WebGLRenderingContext && 
          (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
      } catch (e) {
        return false;
      }
    })(),
  };
};

// Função para otimizar performance baseada no dispositivo
export const optimizeForDevice = () => {
  const browserInfo = getBrowserInfo();
  const featureSupport = checkFeatureSupport();
  
  // Reduzir animações em dispositivos de baixa performance
  if (browserInfo.isMobile && !featureSupport.webGL) {
    document.documentElement.style.setProperty('--animation-duration', '0.1s');
    document.documentElement.style.setProperty('--transition-duration', '0.1s');
  }
  
  // Desabilitar virtualização em navegadores que não suportam bem
  if (!featureSupport.virtualScroll) {
    document.documentElement.style.setProperty('--use-virtualization', 'false');
  }
  
  // Otimizar para dispositivos touch
  if (featureSupport.touch) {
    document.documentElement.style.setProperty('--touch-optimized', 'true');
  }
};

// Exportar configurações padrão
export const defaultCompatibilityConfig = {
  applyCompatibilitySettings,
  checkFeatureSupport,
  optimizeForDevice,
  getBrowserInfo,
  getBrowserConfig,
  getOSConfig,
};

