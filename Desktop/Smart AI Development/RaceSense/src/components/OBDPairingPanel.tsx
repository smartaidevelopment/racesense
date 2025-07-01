import React from "react";
import { useOBDIntegration } from "../hooks/useOBDIntegration";

export default function OBDPairingPanel() {
  const { connected, error, data, pair, disconnect, pairing } = useOBDIntegration();

  return (
    <div style={{ border: "1px solid #ccc", padding: 24, borderRadius: 8, maxWidth: 400 }}>
      <h2>OBD-II Pairing & Telemetry</h2>
      <div>
        <strong>Status:</strong>{" "}
        {connected ? (
          <span style={{ color: "green" }}>Connected</span>
        ) : pairing ? (
          <span style={{ color: "orange" }}>Pairing...</span>
        ) : (
          <span style={{ color: "red" }}>Disconnected</span>
        )}
      </div>
      {error && (
        <div style={{ color: "red", marginTop: 8 }}>
          <strong>Error:</strong> {error}
        </div>
      )}
      <div style={{ marginTop: 16 }}>
        {!connected ? (
          <button onClick={pair} disabled={pairing} style={{ padding: "8px 16px" }}>
            {pairing ? "Pairing..." : "Pair OBD-II Device"}
          </button>
        ) : (
          <button onClick={disconnect} style={{ padding: "8px 16px" }}>
            Disconnect
          </button>
        )}
      </div>
      {connected && data && (
        <div style={{ marginTop: 24 }}>
          <h4>Live Telemetry</h4>
          <pre style={{ background: "#f7f7f7", padding: 12, borderRadius: 4 }}>
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
} 