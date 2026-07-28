import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { initStore } from "./lib/store.js";
import "./index.css";

/**
 * OWNER: P4 (bootstrap).
 *
 * Render immediately from the local cache — the learner never waits on the
 * network to see the app. Then hydrate from Firestore in the background and
 * re-render only if remote data actually won.
 */
const root = ReactDOM.createRoot(document.getElementById("root"));

function render() {
  root.render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  );
}

render();

initStore()
  .then(({ mode, changed }) => {
    console.debug(`[store] ${mode}${changed ? " — hydrated from remote" : ""}`);
    if (changed) render();
  })
  .catch((err) => console.warn("[store] init failed", err));
