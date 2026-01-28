import { useCallback, useEffect, useRef, useState } from "react";
import { useAppContainer } from "../../../app/AppContext.jsx";

const STATUS_RESET_DELAY = 3200;

function resolveProviderLabel(providerInfo) {
  if (!providerInfo?.label) return "Storage: Unavailable";
  return `Storage: ${providerInfo.label}`;
}

export function useStorageMenuController({ menuOpen }) {
  const container = useAppContainer();
  const storageApi = container?.mapBuilder;
  const [providerInfo, setProviderInfo] = useState(null);
  const [projectInfo, setProjectInfo] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);
  const [statusTone, setStatusTone] = useState("info");
  const statusTimeoutRef = useRef(null);

  const clearStatusTimer = useCallback(() => {
    if (statusTimeoutRef.current) {
      clearTimeout(statusTimeoutRef.current);
      statusTimeoutRef.current = null;
    }
  }, []);

  const clearStatusMessage = useCallback(() => {
    clearStatusTimer();
    setStatusMessage(null);
    setStatusTone("info");
  }, [clearStatusTimer]);

  const showStatusMessage = useCallback(
    (message, tone = "info") => {
      clearStatusTimer();
      setStatusMessage(message);
      setStatusTone(tone);
      statusTimeoutRef.current = setTimeout(() => {
        setStatusMessage(null);
        setStatusTone("info");
        statusTimeoutRef.current = null;
      }, STATUS_RESET_DELAY);
    },
    [clearStatusTimer]
  );

  const refreshStorageState = useCallback(async () => {
    if (!storageApi?.getStorageMenuState) {
      setProviderInfo(null);
      setProjectInfo(null);
      return;
    }
    try {
      const state = await storageApi.getStorageMenuState();
      setProviderInfo(state?.providerInfo ?? null);
      setProjectInfo(state?.projectInfo ?? null);
    } catch {
      setProviderInfo(null);
      setProjectInfo(null);
    }
  }, [storageApi]);

  useEffect(() => {
    if (menuOpen) {
      refreshStorageState();
      return;
    }
    clearStatusMessage();
  }, [menuOpen, refreshStorageState, clearStatusMessage]);

  useEffect(() => () => clearStatusTimer(), [clearStatusTimer]);

  const handleExport = useCallback(async () => {
    if (!storageApi?.exportCurrentProjectPack) {
      showStatusMessage("Storage unavailable.", "error");
      return;
    }
    try {
      const result = await storageApi.exportCurrentProjectPack();
      if (result?.ok) {
        showStatusMessage(result.message || "Exported project pack.", "success");
        refreshStorageState();
      } else {
        showStatusMessage(result?.message || "No active project to export.", "warning");
      }
    } catch {
      showStatusMessage("Failed to export pack.", "error");
    }
  }, [refreshStorageState, showStatusMessage, storageApi]);

  const handleImport = useCallback(
    async (file) => {
      if (!storageApi?.importProjectPack) {
        showStatusMessage("Storage unavailable.", "error");
        return;
      }
      try {
        const result = await storageApi.importProjectPack(file);
        if (result?.ok) {
          showStatusMessage(result.message || "Imported project pack.", "success");
          refreshStorageState();
        } else {
          showStatusMessage(result?.message || "Import canceled.", "warning");
        }
      } catch {
        showStatusMessage("Failed to import pack.", "error");
      }
    },
    [refreshStorageState, showStatusMessage, storageApi]
  );

  const providerLabel = resolveProviderLabel(providerInfo);
  const canExport = Boolean(projectInfo?.id);
  const exportTitle = canExport
    ? "Export last saved project snapshot"
    : "No active project to export.";
  const canImport = Boolean(storageApi?.importProjectPack);
  const importTitle = canImport ? "Import a project pack" : "Storage unavailable.";

  return {
    providerLabel,
    canExport,
    exportTitle,
    onExportPack: handleExport,
    canImport,
    importTitle,
    onImportPack: handleImport,
    statusMessage,
    statusTone,
  };
}

export default useStorageMenuController;
