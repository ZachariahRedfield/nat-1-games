import { useCallback, useState } from "react";
import { uid } from "../../utils.js";

export function useTokenState() {
  const [tokens, setTokens] = useState([]);
  const [tokensVisible, setTokensVisible] = useState(true);
  const [selectedToken, setSelectedToken] = useState(null);
  const [selectedTokensList, setSelectedTokensList] = useState([]);
  const [tokenHUDVisible, setTokenHUDVisible] = useState(true);
  const [tokenHUDShowInitiative, setTokenHUDShowInitiative] = useState(false);

  const addToken = useCallback((token) => {
    setTokens((prev) => [...prev, { ...token, id: uid() }]);
  }, []);

  const moveToken = useCallback((id, row, col) => {
    setTokens((prev) => prev.map((token) => (token.id === id ? { ...token, row, col } : token)));
  }, []);

  const updateTokenById = useCallback((id, patch) => {
    setTokens((prev) => prev.map((token) => (token.id === id ? { ...token, ...patch } : token)));
    setSelectedToken((current) => (current && current.id === id ? { ...current, ...patch } : current));
  }, []);

  const removeTokenById = useCallback((id) => {
    setTokens((prev) => prev.filter((token) => token.id !== id));
    setSelectedToken((current) => (current && current.id === id ? null : current));
    setSelectedTokensList((prev) => prev.filter((token) => token.id !== id));
  }, []);

  return {
    tokens,
    setTokens,
    tokensVisible,
    setTokensVisible,
    selectedToken,
    setSelectedToken,
    selectedTokensList,
    setSelectedTokensList,
    tokenHUDVisible,
    setTokenHUDVisible,
    tokenHUDShowInitiative,
    setTokenHUDShowInitiative,
    addToken,
    moveToken,
    updateTokenById,
    removeTokenById,
  };
}
