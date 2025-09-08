import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import './index.css';


// Désactive les Service Workers (évite écran noir iOS quand cache corrompu)
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister()));
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
