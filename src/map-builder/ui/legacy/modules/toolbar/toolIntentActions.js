function createStampIntent({ setZoomToolActive, setPanToolActive, setInteractionMode, setEngine }) {
  return () => {
    setZoomToolActive(false);
    setPanToolActive(false);
    setInteractionMode("draw");
    setEngine("grid");
  };
}

function createCanvasIntent({ assetGroup, setZoomToolActive, setPanToolActive, setInteractionMode, setEngine }) {
  return () => {
    if (assetGroup === "token") return;
    setZoomToolActive(false);
    setPanToolActive(false);
    setInteractionMode("draw");
    setEngine("canvas");
  };
}

function createSelectIntent({ setZoomToolActive, setPanToolActive, setInteractionMode }) {
  return () => {
    setZoomToolActive(false);
    setPanToolActive(false);
    setInteractionMode("select");
  };
}

function createPanIntent({ setPanToolActive, setZoomToolActive }) {
  return () => {
    setPanToolActive(true);
    setZoomToolActive(false);
  };
}

function createZoomIntent({ setZoomToolActive, setPanToolActive }) {
  return () => {
    setZoomToolActive(true);
    setPanToolActive(false);
  };
}

export function buildToolIntentActions(params) {
  return {
    stamp: createStampIntent(params),
    canvas: createCanvasIntent(params),
    select: createSelectIntent(params),
    pan: createPanIntent(params),
    zoom: createZoomIntent(params),
  };
}

export default buildToolIntentActions;
