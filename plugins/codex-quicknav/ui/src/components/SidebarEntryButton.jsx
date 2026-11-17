import { CompassGlyph } from "./QuickNavIcon";

/**
 * Visual reference for the sidebar entry.
 *
 * The installed Codex sidebar item is created by the MCP `global` entrypoint
 * declared in `server/index.mjs`; the host renders that button itself. This
 * component is provided for custom host shells, design review, or a future
 * host API that accepts custom rail buttons. Its dimensions, 1.9px stroke, and
 * muted color match the existing Codex rail.
 */
export function SidebarEntryButton({ active = false, onClick, label = "快捷导航" }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-current={active ? "page" : undefined}
      title={label}
      onClick={onClick}
      className={[
        "group flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
        active
          ? "bg-black/[0.06] text-[#17181a] dark:bg-white/[0.10] dark:text-white"
          : "text-[#75797f] hover:bg-black/[0.05] hover:text-[#17181a] dark:text-[#a3a3a3] dark:hover:bg-white/[0.08] dark:hover:text-white",
      ].join(" ")}
    >
      <CompassGlyph className="h-[18px] w-[18px]" strokeWidth={1.9} />
    </button>
  );
}
