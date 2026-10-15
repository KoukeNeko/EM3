import { deleteCookie, readCookie, writeCookie } from "@/lib/cookie";
import { call, requestToken, setToken } from "@/lib/moodle/client";
import type { SiteInfo } from "@/lib/moodle/types";
import { create } from "zustand";

const COOKIE = "em3_session";
/** Moodle mobile tokens live for months; refresh the cookie on every visit. */
const COOKIE_DAYS = 90;

interface StoredSession {
	token: string;
	userid: number;
}

interface SessionState {
	token: string | null;
	userid: number | null;
	signIn: (username: string, password: string, remember: boolean) => Promise<SiteInfo>;
	signOut: () => void;
}

function loadSession(): StoredSession | null {
	try {
		const raw = readCookie(COOKIE);
		return raw ? (JSON.parse(raw) as StoredSession) : null;
	} catch {
		return null;
	}
}

const initial = loadSession();
setToken(initial?.token ?? null);
if (initial) writeCookie(COOKIE, JSON.stringify(initial), COOKIE_DAYS);

export const useSession = create<SessionState>(set => ({
	token: initial?.token ?? null,
	userid: initial?.userid ?? null,
	async signIn(username, password, remember) {
		const { token } = await requestToken(username.trim(), password);
		setToken(token);
		const info = await call<SiteInfo>("core_webservice_get_site_info");
		const session: StoredSession = { token, userid: info.userid };
		// "Remember me" off still uses a cookie, but one that expires in a day.
		writeCookie(COOKIE, JSON.stringify(session), remember ? COOKIE_DAYS : 1);
		set(session);
		return info;
	},
	signOut() {
		deleteCookie(COOKIE);
		setToken(null);
		set({ token: null, userid: null });
	}
}));
