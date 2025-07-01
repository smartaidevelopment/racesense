import { useEffect, useState, useCallback } from "react";
import { obdIntegrationService, LiveOBDData } from "../services/OBDIntegrationService";

export function useOBDIntegration() {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<LiveOBDData | null>(null);
  const [pairing, setPairing] = useState(false);

  useEffect(() => {
    const offConn = obdIntegrationService.onConnectionChange(setConnected);
    const offErr = obdIntegrationService.onError(setError);
    const offData = obdIntegrationService.onDataUpdate(setData);
    return () => {
      offConn();
      offErr();
      offData();
    };
  }, []);

  const pair = useCallback(async () => {
    setError(null);
    setPairing(true);
    const success = await obdIntegrationService.connectBluetooth();
    setPairing(false);
    if (!success) setError("Failed to connect to OBD-II device.");
  }, []);

  const disconnect = useCallback(async () => {
    setError(null);
    await obdIntegrationService.disconnect();
  }, []);

  return { connected, error, data, pair, disconnect, pairing };
} 