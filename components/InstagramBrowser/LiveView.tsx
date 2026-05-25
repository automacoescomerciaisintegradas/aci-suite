/**
 * LiveView — Componente de preview ao vivo do Browser Use Cloud
 * Embeds um iframe com o browser remoto em tempo real.
 */

import React, { useState, useEffect } from 'react';

interface LiveViewProps {
  liveUrl: string;
  sessionId?: string;
  status?: 'running' | 'completed' | 'failed' | 'cancelled' | 'pending';
  onCancel?: () => void;
  height?: string;
}

export const LiveView: React.FC<LiveViewProps> = ({
  liveUrl,
  status = 'running',
  onCancel,
  height = '480px',
}) => {
  const [iframeLoaded, setIframeLoaded] = useState(false);

  // Adicionar params de tema ao live URL
  const embedUrl = liveUrl ? `${liveUrl}&theme=dark&ui=false` : '';

  const isActive = status === 'running';

  return (
    <div className="live-view-container" style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', background: '#0a0a0f', border: '1px solid rgba(139,92,246,0.3)' }}>
      {/* Header da live view */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px',
        background: 'rgba(139,92,246,0.08)',
        borderBottom: '1px solid rgba(139,92,246,0.2)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Indicador de status pulsante */}
          <div style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: isActive ? '#10b981' : status === 'completed' ? '#3b82f6' : status === 'failed' ? '#ef4444' : '#6b7280',
            boxShadow: isActive ? '0 0 0 0 rgba(16,185,129,0.7)' : 'none',
            animation: isActive ? 'pulse-dot 1.5s infinite' : 'none',
          }} />
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0' }}>
            {isActive ? '🔴 Browser ao vivo' :
              status === 'completed' ? '✅ Concluído' :
              status === 'failed' ? '❌ Falhou' : '⏸️ Pausado'}
          </span>
        </div>

        {isActive && onCancel && (
          <button
            id="live-view-cancel-btn"
            onClick={onCancel}
            style={{
              padding: '4px 12px', borderRadius: '6px', fontSize: '12px',
              fontWeight: 600, cursor: 'pointer', border: '1px solid rgba(239,68,68,0.4)',
              background: 'rgba(239,68,68,0.1)', color: '#fca5a5',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.25)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.1)')}
          >
            Cancelar
          </button>
        )}
      </div>

      {/* Iframe do browser */}
      <div style={{ position: 'relative', height }}>
        {!iframeLoaded && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: '16px',
            background: '#0a0a0f',
          }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '50%',
              border: '3px solid rgba(139,92,246,0.2)',
              borderTop: '3px solid #8b5cf6',
              animation: 'spin 1s linear infinite',
            }} />
            <span style={{ color: '#94a3b8', fontSize: '13px' }}>Conectando ao browser...</span>
          </div>
        )}

        {embedUrl && (
          <iframe
            id="instagram-browser-live-view"
            src={embedUrl}
            style={{
              width: '100%', height: '100%', border: 'none',
              opacity: iframeLoaded ? 1 : 0,
              transition: 'opacity 0.4s ease',
            }}
            allow="autoplay"
            onLoad={() => setIframeLoaded(true)}
            title="Instagram Browser ao vivo"
          />
        )}

        {!embedUrl && (
          <div style={{
            height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', gap: '8px',
          }}>
            <div style={{ fontSize: '40px' }}>📺</div>
            <span style={{ color: '#64748b', fontSize: '14px' }}>Nenhuma sessão ativa</span>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse-dot {
          0% { box-shadow: 0 0 0 0 rgba(16,185,129,0.7); }
          70% { box-shadow: 0 0 0 8px rgba(16,185,129,0); }
          100% { box-shadow: 0 0 0 0 rgba(16,185,129,0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LiveView;
