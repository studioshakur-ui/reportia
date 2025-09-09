import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, err: null };
  }

  static getDerivedStateFromError(err) {
    return { hasError: true, err };
  }

  componentDidCatch(error, info) {
    console.error('💥 React crash:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: 16,
          color: '#fff',
          background: '#1f2937',
          minHeight: '100vh'
        }}>
          <h1 style={{ margin: 0, fontSize: 22 }}>Qualcosa è andato storto 😵</h1>
          <p style={{ opacity: .8 }}>
            Ricarica la pagina. Se il problema persiste, fai uno screenshot della console.
          </p>
          <pre style={{ whiteSpace: 'pre-wrap', opacity: .7, fontSize: 12 }}>
            {String(this.state.err || '')}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}
