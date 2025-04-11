"use client";
import React, { ReactNode, useEffect } from "react";
import { usePeer } from "../store/usePeer";

function PeerProvider({ children }: { children: ReactNode }) {
  const { connect, disconnect } = usePeer();

  useEffect(() => {
    connect();

    const handleBeforeUnload = () => {
      disconnect();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      disconnect();
    };
  }, [connect, disconnect]);

  return <>{children}</>;
}

export default PeerProvider;
