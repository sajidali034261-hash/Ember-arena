import { contextBridge, ipcRenderer } from "electron";
import type { ApiRequest, EmberBridge } from "./bridge";

// Sandboxed preload: exposes a narrow, typed bridge. No Node APIs and no token reach the page.
const bridge: EmberBridge = {
  api: {
    request: (req: ApiRequest) => ipcRenderer.invoke("api:request", req),
  },
  session: {
    hasToken: () => ipcRenderer.invoke("session:has"),
    signOut: (allDevices: boolean) => ipcRenderer.invoke("session:signOut", allDevices === true),
    onExpired: (cb: () => void) => {
      const listener = () => cb();
      ipcRenderer.on("session:expired", listener);
      return () => {
        ipcRenderer.removeListener("session:expired", listener);
      };
    },
  },
  app: {
    info: () => ipcRenderer.invoke("app:info"),
  },
};

contextBridge.exposeInMainWorld("ember", bridge);
