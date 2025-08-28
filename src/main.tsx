
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { applyCompatibilitySettings, optimizeForDevice } from './lib/compatibility';

// Aplicar configurações de compatibilidade antes de renderizar
try {
  applyCompatibilitySettings();
  optimizeForDevice();
} catch (error) {
  console.warn('Erro ao aplicar configurações de compatibilidade:', error);
}

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root element not found");
}

const root = createRoot(container);

// Renderizar com tratamento de erro
try {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (error) {
  console.error('Erro ao renderizar aplicação:', error);
  
  // Fallback para usuário
  container.innerHTML = `
    <div style="
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      font-family: system-ui, -apple-system, sans-serif;
      text-align: center;
      padding: 2rem;
    ">
      <h1 style="color: #dc2626; margin-bottom: 1rem;">Erro ao carregar aplicação</h1>
      <p style="color: #6b7280; margin-bottom: 2rem;">
        Ocorreu um erro inesperado. Por favor, recarregue a página ou tente novamente mais tarde.
      </p>
      <button 
        onclick="window.location.reload()" 
        style="
          background: #2563eb;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 0.5rem;
          cursor: pointer;
          font-size: 1rem;
        "
      >
        Recarregar página
      </button>
    </div>
  `;
}
