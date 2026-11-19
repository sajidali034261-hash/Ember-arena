import { app, screen, type BrowserWindow, type Rectangle } from "electron";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

type State = { bounds: Rectangle; maximized: boolean };

const DEFAULT: State = { bounds: { x: 0, y: 0, width: 1320, height: 840 }, maximized: false };
const file = () => join(app.getPath("userData"), "window-state.json");

export function loadWindowState(): { bounds: Partial<Rectangle> & { width: number; height: number }; maximized: boolean } {
  try {
    const s = JSON.parse(readFileSync(file(), "utf8")) as State;
    const b = s.bounds;
    const valid = [b.x, b.y, b.width, b.height].every((n) => Number.isFinite(n));
    // Only restore the position if it is still visible on a connected display.
    const visible = valid && screen.getAllDisplays().some((d) => {
      const a = d.workArea;
      return b.x + 80 > a.x && b.y + 40 > a.y && b.x < a.x + a.width - 80 && b.y < a.y + a.height - 40;
    });
    if (visible) return { bounds: b, maximized: !!s.maximized };
    if (valid) return { bounds: { width: b.width, height: b.height }, maximized: !!s.maximized };
  } catch {
    /* first launch */
  }
  return { bounds: { width: DEFAULT.bounds.width, height: DEFAULT.bounds.height }, maximized: false };
}

export function trackWindowState(win: BrowserWindow): void {
  let timer: NodeJS.Timeout | null = null;
  const save = () => {
    if (win.isDestroyed()) return;
    const state: State = { bounds: win.getNormalBounds(), maximized: win.isMaximized() };
    try {
      writeFileSync(file(), JSON.stringify(state));
    } catch {
      /* ignore */
    }
  };
  const schedule = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(save, 400);
  };
  win.on("resize", schedule);
  win.on("move", schedule);
  win.on("maximize", schedule);
  win.on("unmaximize", schedule);
  win.on("close", save);
}
