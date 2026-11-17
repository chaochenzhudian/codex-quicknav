const STATE_KEY = "codex-quicknav.state.v1";

export function readState() {
  try {
    const value = JSON.parse(localStorage.getItem(STATE_KEY) ?? "{}");
    return {
      shortcuts: Array.isArray(value.shortcuts) ? value.shortcuts : [],
      manage: value.manage === true,
      scrollTop: Number.isFinite(value.scrollTop) ? value.scrollTop : 0,
    };
  } catch {
    return { shortcuts: [], manage: false, scrollTop: 0 };
  }
}

export function writeState(patch) {
  try {
    const current = readState();
    localStorage.setItem(
      STATE_KEY,
      JSON.stringify({ ...current, ...patch, updatedAt: Date.now() }),
    );
  } catch {
    // Storage can be unavailable in a locked-down iframe; the server store is
    // still the source of truth for the shortcut list.
  }
}
