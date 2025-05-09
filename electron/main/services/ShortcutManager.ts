import { globalShortcut, clipboard } from "electron";
import { keyboard, Key } from "@nut-tree/nut-js";

export class ShortcutManager {
  private windowManager;

  constructor(windowManager) {
    this.windowManager = windowManager;
  }

  setupGlobalShortcuts() {
    const isResgist = globalShortcut.isRegistered("CommandOrControl+Shift+F1");
    const modifier = Key.LeftControl;

    if (!isResgist) {
      globalShortcut.register("CommandOrControl+Space", async () => {
        const win2 = this.windowManager.getSecondaryWindow();
        if (win2 && !win2.isDestroyed()) {
          const clipboardContent = await this.getSelectedContent(clipboard);
          console.log("clipboardContent", clipboardContent);
          win2.webContents.send("clipboard-update", {
            event: "clipboard-update",
            ...clipboardContent,
          });

          if (!win2.isVisible()) {
            this.windowManager.showSecondaryWindowAtCursor();
          }
        } else {
          this.windowManager.showSecondaryWindowAtCursor();
        }
      });
    }
  }

  private async simulateCopy() {
    await keyboard.pressKey(Key.LeftControl, Key.C);
    await keyboard.releaseKey(Key.LeftControl, Key.C);
  }

  private getSelectedContent(clipboard) {
    return new Promise(async (resolve) => {
      clipboard.clear();
      await this.simulateCopy();
      setTimeout(() => {
        const text = clipboard.readText("clipboard") || "";
        resolve({
          text,
        });
      }, 0);
    });
  }

  unregisterAll() {
    globalShortcut.unregisterAll();
  }
}
