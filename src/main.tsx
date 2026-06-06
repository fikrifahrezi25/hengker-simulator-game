import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[HLS3D] Runtime Error:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          position: 'fixed', inset: 0, background: '#0a0f0a',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', fontFamily: 'monospace', padding: '2rem',
        }}>
          <div style={{ color: '#ff4444', fontSize: '1.2rem', marginBottom: '1rem' }}>
            ⚠ Runtime Error
          </div>
          <div style={{
            color: '#00ff41', fontSize: '0.85rem', maxWidth: '700px',
            background: '#0d1a0d', border: '1px solid #1a3a1a',
            borderRadius: '8px', padding: '1.5rem', whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
          }}>
            {this.state.error.message}
            {'\n\n'}
            {this.state.error.stack?.slice(0, 800)}
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '1.5rem', padding: '0.5rem 1.5rem',
              background: 'transparent', border: '1px solid #00ff41',
              color: '#00ff41', fontFamily: 'monospace', cursor: 'pointer',
              borderRadius: '4px',
            }}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
