import { useCallback, useEffect, useRef, useState } from "react";
import { useAppContainer } from "../../../app/AppContext.jsx";
import {
  notifyError,
  notifySuccess,
  notifyWarning,
} from "../../infrastructure/notifications/toastStore.js";

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
  const [providerOptions, setProviderOptions] = useState([]);
  const [providerStatus, setProviderStatus] = useState(null);
  const [actionStatusMessage, setActionStatusMessage] = useState(null);
  const [actionStatusTone, setActionStatusTone] = useState("info");
  const statusTimeoutRef = useRef(null);

  const clearStatusTimer = useCallback(() => {
    if (statusTimeoutRef.current) {
      clearTimeout(statusTimeoutRef.current);
      statusTimeoutRef.current = null;
    }
  }, []);

  const clearStatusMessage = useCallback(() => {
    clearStatusTimer();
    setActionStatusMessage(null);
    setActionStatusTone("info");
  }, [clearStatusTimer]);

  const showStatusMessage = useCallback(
    (message, tone = "info") => {
      clearStatusTimer();
      setActionStatusMessage(message);
      setActionStatusTone(tone);
      statusTimeoutRef.current = setTimeout(() => {
        setActionStatusMessage(null);
        setActionStatusTone("info");
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
      setProviderOptions(Array.isArray(state?.providerOptions) ? state.providerOptions : []);
      setProviderStatus(state?.providerStatus ?? null);
    } catch {
      setProviderInfo(null);
      setProjectInfo(null);
      setProviderOptions([]);
      setProviderStatus(null);
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
      notifyError("Storage unavailable.");
      return;
    }
    try {
      const result = await storageApi.exportCurrentProjectPack();
      if (result?.ok) {
        notifySuccess(result.message || "Exported project pack.");
        refreshStorageState();
      } else {
        notifyWarning(result?.message || "No active project to export.");
      }
    } catch {
      notifyError("Failed to export pack.");
    }
  }, [refreshStorageState, storageApi]);

  const handleImport = useCallback(
    async (file) => {
      if (!storageApi?.importProjectPack) {
        notifyError("Storage unavailable.");
        return;
      }
      try {
        const result = await storageApi.importProjectPack(file);
        if (result?.ok) {
          notifySuccess(result.message || "Imported project pack.");
          refreshStorageState();
        } else {
          notifyWarning(result?.message || "Import canceled.");
        }
      } catch {
        notifyError("Failed to import pack.");
      }
    },
    [refreshStorageState, storageApi]
  );

  const handleSetProvider = useCallback(
    async (providerKey) => {
      if (!storageApi?.setActiveStorageProvider) {
        showStatusMessage("Storage unavailable.", "error");
        return;
      }
      try {
        const result = await storageApi.setActiveStorageProvider(providerKey);
        if (result?.ok) {
          showStatusMessage(result.message || "Storage provider updated.", "success");
          refreshStorageState();
        } else {
          showStatusMessage(result?.message || "Failed to switch storage provider.", "warning");
        }
      } catch {
        showStatusMessage("Failed to switch storage provider.", "error");
      }
    },
    [refreshStorageState, showStatusMessage, storageApi]
  );

  const handleChangeFolder = useCallback(async () => {
    if (!storageApi?.changeFolderLocation) {
      showStatusMessage("Storage unavailable.", "error");
      return;
    }
    try {
      const result = await storageApi.changeFolderLocation();
      if (result?.ok) {
        showStatusMessage(result.message || "Folder location updated.", "success");
        refreshStorageState();
      } else {
        showStatusMessage(result?.message || "Folder location unchanged.", "warning");
      }
    } catch {
      showStatusMessage("Failed to update folder location.", "error");
    }
  }, [refreshStorageState, showStatusMessage, storageApi]);

  const providerLabel = resolveProviderLabel(providerInfo);
  const activeProviderKey = providerInfo?.key || null;
  const canExport = Boolean(projectInfo?.id);
  const exportTitle = canExport
    ? "Export last saved project snapshot"
    : "No active project to export.";
  const canImport = Boolean(storageApi?.importProjectPack);
  const importTitle = canImport ? "Import a project pack" : "Storage unavailable.";
  const providerActions = providerOptions
    .filter((option) => option.key === "folder" || option.key === "opfs")
    .map((option) => {
      const label =
        option.key === "folder" ? "Use Folder Storage" : "Use Local Storage (OPFS)";
      const disabled = option.active || !option.supported;
      let title = "";
      if (option.active) {
        title = "Already active.";
      } else if (!option.supported) {
        title = `${option.label} storage is unavailable on this device.`;
      } else {
        title = `Switch to ${option.label} storage.`;
      }
      return {
        key: option.key,
        label,
        disabled,
        active: option.active,
        title,
      };
    });
  const canChangeFolder = providerOptions.some(
    (option) => option.key === "folder" && option.active && option.canChangeLocation
  );
  const changeFolderTitle = canChangeFolder
    ? "Choose a different folder for Folder storage"
    : "Folder storage is unavailable.";
  const displayStatusMessage = actionStatusMessage ?? providerStatus?.message ?? null;
  const displayStatusTone = actionStatusMessage
    ? actionStatusTone
    : providerStatus?.tone || "info";
  return {
    providerLabel,
    providerActions,
    activeProviderKey,
    onSelectProvider: handleSetProvider,
    canChangeFolder,
    changeFolderTitle,
    onChangeFolder: handleChangeFolder,
    canExport,
    exportTitle,
    onExportPack: handleExport,
    canImport,
    importTitle,
    onImportPack: handleImport,
    statusMessage: displayStatusMessage,
    statusTone: displayStatusTone,
  };
}

export default useStorageMenuController;
