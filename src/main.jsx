import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { FirestoreProvider } from "./contexts/FirestoreContext";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <FirestoreProvider>
    <App />
  </FirestoreProvider>
);
