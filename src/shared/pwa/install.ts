import { useSyncExternalStore } from "react";

// Chrome and Edge fire `beforeinstallprompt` once, early, possibly before the
// settings page mounts, so it is captured here at startup and replayed on demand.

interface InstallPromptEvent extends Event {
	prompt: () => Promise<void>;
	userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let deferred: InstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(l => l());

window.addEventListener("beforeinstallprompt", e => {
	e.preventDefault();
	deferred = e as InstallPromptEvent;
	emit();
});
window.addEventListener("appinstalled", () => {
	deferred = null;
	emit();
});

export const isStandalone = () => matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;
export const isIos = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

/** The pending install prompt, or null when the browser didn't offer one. */
export function useInstallPrompt() {
	const prompt = useSyncExternalStore(
		l => (listeners.add(l), () => listeners.delete(l)),
		() => deferred
	);
	return prompt
		? async () => {
				await prompt.prompt();
				await prompt.userChoice;
				deferred = null;
				emit();
			}
		: null;
}
