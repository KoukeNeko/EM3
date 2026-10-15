import { usePrefs } from "@/features/preferences/store";
import { useEffect } from "react";

/** Mirrors the theme preference onto <html data-theme>. "system" defers to CSS. */
export function ThemeSync() {
	const theme = usePrefs(s => s.theme);
	useEffect(() => {
		const root = document.documentElement;
		if (theme === "system") root.removeAttribute("data-theme");
		else root.setAttribute("data-theme", theme);
	}, [theme]);
	return null;
}
