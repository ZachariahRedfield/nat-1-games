import React from "react";
import MapCanvas from "./components/MapCanvas";

function App() {
    console.log("App loaded");

  return (
    <div style={{ textAlign: "center", padding: "20px", background: "#111", color: "white" }}>
      <h1>Nat-1 Game</h1>
      <p>React is running!</p>
      <MapCanvas />
    </div>
  );
}

export default App;
