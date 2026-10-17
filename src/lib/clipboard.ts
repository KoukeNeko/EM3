/**
 * Copies text that is only ready after some async work. Safari allows clipboard
 * writes only inside the click, so the pending text goes in a ClipboardItem
 * right away; other browsers fall back to writeText once it resolves.
 * Resolves to the text and whether it reached the clipboard; rejects only when
 * producing the text fails.
 */
export async function copyWhenReady(make: () => Promise<string>): Promise<{ text: string; copied: boolean }> {
	const text = make();
	if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
		try {
			await navigator.clipboard.write([new ClipboardItem({ "text/plain": text.then(t => new Blob([t], { type: "text/plain" })) })]);
			return { text: await text, copied: true };
		} catch {
			// Fall through: either the text failed (rethrown below) or this browser rejects promised items.
		}
	}
	const t = await text;
	try {
		await navigator.clipboard.writeText(t);
		return { text: t, copied: true };
	} catch {
		return { text: t, copied: false };
	}
}
