import { contextBridge, ipcRenderer } from "electron";
import { PlaylistPlaybackReply, PlaylistsReply } from "../types/player";

const api = {
  command: (channel: string, ...args: unknown[]) => {
    ipcRenderer.send("MINI_COMMAND", channel, ...args);
  },
  getPlayback: (): Promise<PlaylistPlaybackReply | null> =>
    ipcRenderer.invoke("MINI_GET_PLAYBACK"),
  getPlaylists: (): Promise<PlaylistsReply | null> =>
    ipcRenderer.invoke("MINI_GET_PLAYLISTS"),
  getOnTop: (): Promise<boolean> => ipcRenderer.invoke("MINI_GET_ON_TOP"),
  setOnTop: (onTop: boolean) => ipcRenderer.send("MINI_SET_ON_TOP", onTop),
  close: () => ipcRenderer.send("MINI_CLOSE"),
};

declare global {
  interface Window {
    mini: typeof api;
  }
}

contextBridge.exposeInMainWorld("mini", api);
