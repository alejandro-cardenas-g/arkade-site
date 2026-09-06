export function getPlayerName(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("playerName");
}

export function setPlayerName(name: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("playerName", name);
}

export function hasPlayerName(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("playerName") !== null;
}

export function clearPlayerName(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("playerName");
}

// Generate or retrieve anonymous user ID
export function getAnonymousUserId(): string {
  if (typeof window === "undefined") return "";

  let anonymousId = localStorage.getItem("anonymousUserId");

  if (!anonymousId) {
    // Generate a new UUID v4
    anonymousId = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      },
    );
    localStorage.setItem("anonymousUserId", anonymousId);
  }

  return anonymousId;
}
