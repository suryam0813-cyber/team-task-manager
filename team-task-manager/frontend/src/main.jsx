import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import "./styles/global.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#1a1b24",
              color: "#e8eaf0",
              border: "1px solid #2a2c3a",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "0.9rem",
            },
            success: { iconTheme: { primary: "#22c55e", secondary: "#1a1b24" } },
            error: { iconTheme: { primary: "#ef4444", secondary: "#1a1b24" } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
