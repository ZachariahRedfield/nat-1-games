import React, { useState } from "react";
import MainMenu from "./components/Menu/MainMenu/MainMenu";
import MapBuilder from "./components/Menu/MapBuilder/MapBuilder";
import StartSession from "./components/Menu/SessonManager/StartSession";
import AssetCreation from "./components/Menu/AssetCreation/AssetCreation";

function App() {
  // TEMP: default to Map Builder for development convenience
  const [screen, setScreen] = useState("mapBuilder");

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
