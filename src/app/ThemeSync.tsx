import { usePrefs } from "@/features/preferences/store";
import { ALL_THEMES } from "@/features/settings/themes";
import { useMedia } from "@/shared/hooks/useMedia";
import { useEffect } from "react";

/**
 * Mirrors the theme preference onto <html data-theme>. "system" defers to CSS.
 * Also sets data-scheme="light|dark" so assets (e.g. screenshots) can follow the theme.
 */
export function ThemeSync() {
	const theme = usePrefs(s => s.theme);
	const prefersDark = useMedia("(prefers-color-scheme: dark)");
	useEffect(() => {
		const root = document.documentElement;
		if (theme === "system") root.removeAttribute("data-theme");
		else root.setAttribute("data-theme", theme);
		const dark = theme === "system" ? prefersDark : (ALL_THEMES.find(t => t.name === theme)?.dark ?? false);
		root.dataset.scheme = dark ? "dark" : "light";
	}, [theme, prefersDark]);
	return null;
}
