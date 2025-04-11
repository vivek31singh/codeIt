import { Awareness } from "y-protocols/awareness.js";
import * as Y from "yjs";

export const ydoc = new Y.Doc();
export const yText = ydoc.getText("monaco");
export const awareness = new Awareness(ydoc);

export function setupYjsSync(channel: RTCDataChannel) {
  // Send local Yjs updates to peer
  ydoc.on("update", (update) => {
    if (channel.readyState === "open") {
      channel.send(update);
    }
  });

  // Apply updates from peer
  channel.onmessage = (event) => {
    const update = new Uint8Array(event.data);
    Y.applyUpdate(ydoc, update);
  };

  channel.onopen = () => {
    console.log("✅ DataChannel opened (setupYjsSync)");
  };

  channel.onerror = (e) => {
    console.error("❌ DataChannel error (setupYjsSync)", e);
  };
}
