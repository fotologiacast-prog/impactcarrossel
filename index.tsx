
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

class RootErrorBoundary extends React.Component<
  React.PropsWithChildren,
  { error: Error | null }
> {
  constructor(props: React.PropsWithChildren) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error('Root render error:', error);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'grid',
            placeItems: 'center',
            background: '#050507',
            color: '#F5F3EE',
            fontFamily: 'Inter, system-ui, sans-serif',
            padding: 32,
            boxSizing: 'border-box',
          }}
        >
          <div style={{ maxWidth: 720, textAlign: 'center' }}>
            <p style={{ margin: 0, color: '#1fb2f7', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.18em' }}>
              App Error
            </p>
            <h1 style={{ margin: '12px 0 16px', fontSize: 36, lineHeight: 1.05 }}>
              O app encontrou um erro ao abrir.
            </h1>
            <p style={{ margin: 0, fontSize: 16, lineHeight: 1.5, color: 'rgba(245,243,238,0.72)' }}>
              {this.state.error.message || 'Erro desconhecido.'}
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </React.StrictMode>
);
