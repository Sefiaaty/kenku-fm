import { BrowserWindow } from "electron";
import { BrowserViewManagerMain } from "./BrowserViewManagerMain";
import { PlaybackManager } from "./PlaybackManager";
import { PlayerManager } from "./PlayerManager";
import { WindowManager } from "./WindowManager";
import { MiniPlayerManager } from "./MiniPlayerManager";

export class SessionManager {
  private playbackManager: PlaybackManager;
  private playerManager: PlayerManager;
  private viewManager: BrowserViewManagerMain;
  private windowManager: WindowManager;
  private miniPlayerManager: MiniPlayerManager;

  constructor(window: BrowserWindow) {
    this.playbackManager = new PlaybackManager(window);
    this.viewManager = new BrowserViewManagerMain(window);
    this.windowManager = new WindowManager(window);
    this.playerManager = new PlayerManager();
    this.miniPlayerManager = new MiniPlayerManager(this.playerManager);
  }

  destroy() {
    this.playbackManager.destroy();
    this.viewManager.destroy();
    this.windowManager.destroy();
    this.miniPlayerManager.destroy();
    this.playerManager.destroy();
  }
}
