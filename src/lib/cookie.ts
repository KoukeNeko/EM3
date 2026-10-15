// Minimal cookie helpers. EM3 keeps the E3 session token in a first-party
// cookie so it survives reloads but stays scoped to this origin.

export function readCookie(name: string): string | null {
	const prefix = `${encodeURIComponent(name)}=`;
	for (const part of document.cookie.split("; ")) {
		if (part.startsWith(prefix)) return decodeURIComponent(part.slice(prefix.length));
	}
	return null;
}

export function writeCookie(name: string, value: string, maxAgeDays: number) {
	const secure = location.protocol === "https:" ? "; Secure" : "";
	document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; Max-Age=${Math.round(maxAgeDays * 86400)}; Path=/; SameSite=Strict${secure}`;
}

export function deleteCookie(name: string) {
	document.cookie = `${encodeURIComponent(name)}=; Max-Age=0; Path=/; SameSite=Strict`;
}
