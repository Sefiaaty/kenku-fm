import { useEffect, useState } from "react";

// Small personal preferences for the player, saved on this computer.

export type CardSize = "small" | "medium" | "large";

export type PlayerPrefs = {
  /** How big the playlist cards are */
  cardSize: CardSize;
  /** Seconds the music fades out for when you pause */
  pauseFade: number;
  /** Seconds the old music fades out for when you start a different playlist */
  switchFade: number;
};

const defaults: PlayerPrefs = {
  cardSize: "medium",
  pauseFade: 1.5,
  switchFade: 2,
};

const STORAGE_KEY = "kenku-personal-prefs";
const CHANGE_EVENT = "kenku-personal-prefs-change";

export function getPrefs(): PlayerPrefs {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return { ...defaults, ...saved };
  } catch {
    return { ...defaults };
  }
}

export function setPrefs(changes: Partial<PlayerPrefs>) {
  const next = { ...getPrefs(), ...changes };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Nothing to do, the change still applies until the app closes
  }
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: next }));
}

export function usePrefs(): PlayerPrefs {
  const [prefs, setState] = useState(getPrefs);
  useEffect(() => {
    function handleChange(event: Event) {
      setState((event as CustomEvent<PlayerPrefs>).detail);
    }
    window.addEventListener(CHANGE_EVENT, handleChange);
    return () => window.removeEventListener(CHANGE_EVENT, handleChange);
  }, []);
  return prefs;
}

export const cardSizes: Record<
  CardSize,
  { minWidth: number; height: number; title: "subtitle1" | "h6" | "h5" }
> = {
  small: { minWidth: 190, height: 110, title: "subtitle1" },
  medium: { minWidth: 220, height: 140, title: "h6" },
  large: { minWidth: 280, height: 200, title: "h5" },
};
