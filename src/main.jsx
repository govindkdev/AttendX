/*
=========================================================
ATTENDX MAIN ENTRY
---------------------------------------------------------
IMPORTANT:
React application yahin se start hoti hai.
=========================================================
*/

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App.jsx";

import "./index.css";


/* =========================================
   CREATE REACT ROOT
========================================= */

createRoot(document.getElementById("root")).render(

  <StrictMode>

    <App />

  </StrictMode>

);