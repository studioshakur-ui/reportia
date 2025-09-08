import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(p){ super(p); this.state={hasError:false, error:null}; }
  static getDerivedStateFromError(error){ return { hasError:true, error }; }
  componentDidCatch(e,i){ console.error("ErrorBoundary:", e, i); }
  render(){
    if (this.state.hasError) {
      return (
        <div className="p-3 text-red-600 text-sm">
          Erreur dans le module Manager : {String(this.state.error)}
        </div>
      );
    }
    return this.props.children;
  }
}
