import DOMPurify from "dompurify";
import { E3_ORIGIN, getToken } from "./client";

// Files in WS responses point at /webservice/pluginfile.php and need the token
// appended. Rich text embeds the browser-session form (/pluginfile.php), which
// a token-only client cannot load, so those are rewritten too.

export function fileUrl(url: string, opts: { download?: boolean } = {}): string {
	if (!url) return url;
	let u: URL;
	try {
		u = new URL(url, E3_ORIGIN);
	} catch {
		return url;
	}
	if (u.origin !== E3_ORIGIN) return url;
	if (u.pathname.startsWith("/pluginfile.php/")) u.pathname = "/webservice" + u.pathname;
	if (u.pathname.startsWith("/webservice/pluginfile.php/")) {
		const token = getToken();
		if (token) u.searchParams.set("token", token);
		if (opts.download) u.searchParams.set("forcedownload", "1");
		else u.searchParams.delete("forcedownload");
	}
	return u.toString();
}

/** Link to the same page on the official E3 site, for things EM3 does not cover. */
export const e3Link = (path: string) => new URL(path, E3_ORIGIN).toString();

let hooked = false;

/** Sanitises E3 HTML and makes its links and images work outside E3. */
export function cleanHtml(html: string): string {
	if (!hooked) {
		hooked = true;
		DOMPurify.addHook("afterSanitizeAttributes", node => {
			if (node instanceof HTMLAnchorElement) {
				node.setAttribute("target", "_blank");
				node.setAttribute("rel", "noopener noreferrer");
				const href = node.getAttribute("href");
				if (href) node.setAttribute("href", fileUrl(href));
			}
			if (node instanceof HTMLImageElement || node instanceof HTMLSourceElement || node instanceof HTMLVideoElement) {
				const src = node.getAttribute("src");
				if (src) node.setAttribute("src", fileUrl(src));
				node.setAttribute("loading", "lazy");
			}
			// Inline styles from Word pastes fight every theme; keep only alignment.
			if (node instanceof HTMLElement && node.hasAttribute("style")) {
				const align = node.style.textAlign;
				node.removeAttribute("style");
				if (align) node.style.textAlign = align;
			}
		});
	}
	return DOMPurify.sanitize(html, { ADD_TAGS: ["iframe"], ADD_ATTR: ["target", "allowfullscreen", "frameborder"], FORBID_TAGS: ["style", "font"] });
}

/** Plain-text preview of an HTML snippet. */
export function htmlToText(html: string, max = 160): string {
	const doc = new DOMParser().parseFromString(html, "text/html");
	const text = (doc.body.textContent ?? "").replace(/\s+/g, " ").trim();
	return text.length > max ? text.slice(0, max - 1) + "…" : text;
}

export function humanSize(bytes: number) {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(0)} KB`;
	if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
	return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

export function fileExt(name: string) {
	const i = name.lastIndexOf(".");
	return i > 0 ? name.slice(i + 1).toLowerCase() : "";
}
