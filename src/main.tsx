import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./app/App";
import Showcase from "./app/ui/Showcase";
import "./styles/index.css";

// /#showcase renders the design-system component gallery instead of the app
// (hash-based so it needs no server config on Vercel).
const hash = window.location.hash.replace("#/", "#");
const page = hash === "#showcase" ? <Showcase /> : <App />;

createRoot(document.getElementById("root")!).render(
  <StrictMode>{page}</StrictMode>
);
