import { BrowserWindow, ipcMain, Rectangle, screen } from "electron";
import Store from "electron-store";
import throttle from "lodash.throttle";

import { PlayerManager } from "./PlayerManager";
import { PlaylistPlaybackReply, PlaylistsReply } from "../../types/player";
import icon from "../../assets/icon.png";

declare const MINI_WINDOW_WEBPACK_ENTRY: string;
declare const MINI_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

const store = new Store<{ miniBounds: Rectangle; miniOnTop: boolean }>();

// The commands the mini player may pass on to the player. Same channels the remote uses.
const COMMANDS = [
  "PLAYER_REMOTE_PLAYLIST_PLAY",
  "PLAYER_REMOTE_PLAYLIST_PLAYBACK_PLAY",
  "PLAYER_REMOTE_PLAYLIST_PLAYBACK_PAUSE",
  "PLAYER_REMOTE_PLAYLIST_PLAYBACK_MUTE",
  "PLAYER_REMOTE_PLAYLIST_PLAYBACK_VOLUME",
  "PLAYER_REMOTE_PLAYLIST_PLAYBACK_NEXT",
  "PLAYER_REMOTE_PLAYLIST_PLAYBACK_PREVIOUS",
];

function ask<T>(
  manager: PlayerManager,
  request: string,
  reply: string
): Promise<T | null> {
  const view = manager.getView();
  if (!view) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    const done = (_: Electron.IpcMainEvent, value: T) => {
      clearTimeout(timeout);
      resolve(value);
    };
    const timeout = setTimeout(() => {
      ipcMain.off(reply, done);
      resolve(null);
    }, 2000);
    ipcMain.once(reply, done);
    view.send(request);
  });
}

/**
 * A small window that stays on top of other windows (Owlbear, Discord) with the
 * playlists as buttons and the basic controls. It controls the same player as the
 * main window, so the music, fades and volume are shared.
 */
export class MiniPlayerManager {
  window: BrowserWindow | null = null;

  constructor(private player: PlayerManager) {
    ipcMain.on("MINI_PLAYER_TOGGLE", this._handleToggle);
    ipcMain.on("MINI_COMMAND", this._handleCommand);
    ipcMain.on("MINI_SET_ON_TOP", this._handleSetOnTop);
    ipcMain.on("MINI_CLOSE", this._handleClose);
    ipcMain.handle("MINI_GET_PLAYBACK", this._handleGetPlayback);
    ipcMain.handle("MINI_GET_PLAYLISTS", this._handleGetPlaylists);
    ipcMain.handle("MINI_GET_ON_TOP", this._handleGetOnTop);
  }

  destroy() {
    ipcMain.off("MINI_PLAYER_TOGGLE", this._handleToggle);
    ipcMain.off("MINI_COMMAND", this._handleCommand);
    ipcMain.off("MINI_SET_ON_TOP", this._handleSetOnTop);
    ipcMain.off("MINI_CLOSE", this._handleClose);
    ipcMain.removeHandler("MINI_GET_PLAYBACK");
    ipcMain.removeHandler("MINI_GET_PLAYLISTS");
    ipcMain.removeHandler("MINI_GET_ON_TOP");
    if (this.window && !this.window.isDestroyed()) {
      this.window.destroy();
    }
    this.window = null;
  }

  toggle() {
    if (this.window && !this.window.isDestroyed()) {
      this.window.close();
      return;
    }
    this.open();
  }

  open() {
    const minWidth = 220;
    const minHeight = 150;
    const saved = store.get("miniBounds");
    const bounds: Partial<Rectangle> = { width: 300, height: 520 };
    if (saved) {
      const area = screen.getDisplayMatching(saved).workArea;
      const inside =
        saved.x >= area.x &&
        saved.y >= area.y &&
        saved.x + saved.width <= area.x + area.width &&
        saved.y + saved.height <= area.y + area.height;
      if (inside) {
        Object.assign(bounds, saved);
      } else {
        bounds.width = Math.max(minWidth, Math.min(saved.width, area.width));
        bounds.height = Math.max(minHeight, Math.min(saved.height, area.height));
      }
    }

    const win = new BrowserWindow({
      ...bounds,
      minWidth,
      minHeight,
      frame: false,
      alwaysOnTop: store.get("miniOnTop", true),
      backgroundColor: "#1e2231",
      title: "Kenku FM Mini",
      icon,
      skipTaskbar: false,
      webPreferences: {
        preload: MINI_WINDOW_PRELOAD_WEBPACK_ENTRY,
      },
    });
    win.setMenuBarVisibility(false);
    win.loadURL(MINI_WINDOW_WEBPACK_ENTRY);
    win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));

    const save = throttle(() => {
      if (!win.isDestroyed()) {
        store.set("miniBounds", win.getNormalBounds());
      }
    }, 1000);
    win.on("resized", save);
    win.on("moved", save);
    win.on("closed", () => {
      if (this.window === win) {
        this.window = null;
      }
    });
    this.window = win;
  }

  _handleToggle = () => this.toggle();

  _handleCommand = (
    _: Electron.IpcMainEvent,
    channel: string,
    ...args: unknown[]
  ) => {
    if (!COMMANDS.includes(channel)) {
      return;
    }
    this.player.getView()?.send(channel, ...args);
  };

  _handleSetOnTop = (_: Electron.IpcMainEvent, onTop: boolean) => {
    store.set("miniOnTop", onTop);
    this.window?.setAlwaysOnTop(onTop);
  };

  _handleClose = () => this.window?.close();

  _handleGetOnTop = () => store.get("miniOnTop", true);

  _handleGetPlayback = () =>
    ask<PlaylistPlaybackReply>(
      this.player,
      "PLAYER_REMOTE_PLAYLIST_PLAYBACK_REQUEST",
      "PLAYER_REMOTE_PLAYLIST_PLAYBACK_REPLY"
    );

  _handleGetPlaylists = () =>
    ask<PlaylistsReply>(
      this.player,
      "PLAYER_REMOTE_PLAYLIST_GET_ALL_REQUEST",
      "PLAYER_REMOTE_PLAYLIST_GET_ALL_REPLY"
    );
}
