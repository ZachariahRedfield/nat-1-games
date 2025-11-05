import "./style.css";
import React from "react";
import ReactDOM from "react-dom/client";
import Root from "./app/routes/Root";

ReactDOM.createRoot(document.getElementById("app")).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
