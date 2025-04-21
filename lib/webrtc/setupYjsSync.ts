import { Awareness } from "y-protocols/awareness.js";
import * as Y from "yjs";

// Shared Yjs document, text type, and awareness
export const ydoc = new Y.Doc();
export const yText = ydoc.getText("monaco");
export const awareness = new Awareness(ydoc);

export function setupYjsSync(channel: RTCDataChannel) {
  if (!channel) {
    console.error("❌ RTCDataChannel is undefined in setupYjsSync");
    return;
  }

  // ✅ Set binaryType to ensure we receive ArrayBuffers, not Blobs
  channel.binaryType = "arraybuffer";

  // ✅ Log Yjs updates and try sending them
  ydoc.on("update", (update) => {
    if (channel.readyState === "open") {
      try {
        channel.send(update);
      } catch (err) {
        console.error("❌ Failed to send Yjs update over channel:", err);
      }
    } else {
      console.warn("⚠️ Channel not open during update send attempt");
    }
  });

  // ✅ Log when the channel is open
  channel.onopen = () => {
    console.log("✅ RTCDataChannel opened successfully (setupYjsSync)");
  };

  // ✅ Handle and log incoming updates from peer
  channel.onmessage = (event) => {
    try {
      console.log("📥 Raw data received from peer:", event.data);

      // Parse into a Yjs-compatible update
      const update = new Uint8Array(event.data);
      console.log("📥 Parsed Yjs update from peer:", update);

      // Apply update to Y.Doc
      Y.applyUpdate(ydoc, update);
      console.log("✅ Applied update to Y.Doc successfully");
    } catch (err) {
      console.error("❌ Failed to apply received Yjs update:", err);
    }
  };

  // ✅ Handle channel errors
  channel.onerror = (e) => {
    console.error("❌ RTCDataChannel encountered an error:", e);
  };

  // Optional: Log if the channel closes
  channel.onclose = () => {
    console.warn("⚠️ RTCDataChannel closed");
  };
}
