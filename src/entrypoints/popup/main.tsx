import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "@/ui/App";
import "@/ui/popup.css";

const container = document.getElementById("root");

// Our rules forbid `!`, so this is the honest version: if index.html and this file
// ever disagree about the id, we want a loud error, not a silent blank popup.
if (!container) {
  throw new Error("popup: #root is missing from index.html");
}

createRoot(container).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
