import React, { useState } from "react";
import MainMenu from "./components/Menu/MainMenu";
import MapBuilder from "./components/Menu/MapBuilder";
import StartSession from "./components/Menu/StartSession";
import AssetCreation from "./components/Menu/AssetCreation";

function App() {
  const [screen, setScreen] = useState("menu");

  const renderScreen = () => {
    switch (screen) {
      case "mapBuilder":
        return <MapBuilder goBack={() => setScreen("menu")} />;
      case "startSession":
        return <StartSession goBack={() => setScreen("menu")} />;
      case "assetCreation":
        return <AssetCreation goBack={() => setScreen("menu")} />;
      default:
        return <MainMenu setScreen={setScreen} />;
    }
  };

  return (
    <div className="w-screen h-screen bg-gray-900 text-white">
      {renderScreen()}
    </div>
  );
}

export default App;
