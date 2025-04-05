"use client";
import React, { ReactNode, useEffect } from "react";
import { useSocket } from "@/lib/store/useSocket";

function SocketProvider({ children }: { children: ReactNode }) {
  const { connect, disconnect } = useSocket();

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

export default SocketProvider;
