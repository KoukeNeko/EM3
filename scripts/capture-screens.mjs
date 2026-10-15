// Captures the marketing/README screenshots with personal data masked.
// Usage: NODE_PATH=$(npm root -g) node scripts/capture-screens.mjs <outdir>
// Needs `pnpm dev` running and .env.local. Then convert with `python3 scripts/screens-to-webp.py <outdir>`.
//
// Privacy: E3 responses are rewritten before the app sees them. The account
// owner becomes 「王小明」, student IDs are replaced, forum authors become
// 「授課教師」, and the two courses named after students are hidden.
// State-changing E3 requests are aborted.
import { mkdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";

const { chromium } = createRequire(import.meta.url)(process.env.NODE_PATH + "/playwright");
const env = Object.fromEntries(
	readFileSync(new URL("../.env.local", import.meta.url), "utf8")
		.split("\n")
		.filter(l => l.includes("=") && !l.startsWith("#"))
		.map(l => [
			l.slice(0, l.indexOf("=")).trim(),
			l
				.slice(l.indexOf("=") + 1)
				.trim()
				.replace(/^['"]|['"]$/g, "")
		])
);
const out = process.argv[2];
mkdirSync(out, { recursive: true });
const base = process.env.BASE ?? "http://localhost:5173/";

const { token } = await (
	await fetch("https://e3p.nycu.edu.tw/login/token.php", { method: "POST", body: new URLSearchParams({ username: env.E3_USERNAME, password: env.E3_PASSWORD, service: "moodle_mobile_app" }) })
).json();
const site = await (
	await fetch("https://e3p.nycu.edu.tw/webservice/rest/server.php", {
		method: "POST",
		body: new URLSearchParams({ wstoken: token, wsfunction: "core_webservice_get_site_info", moodlewsrestformat: "json" })
	})
).json();

const FAKE = { name: "王小明", id: "110550000" };
function scrub(text, fn) {
	if (fn === "core_webservice_get_site_info") {
		const d = JSON.parse(text);
		Object.assign(d, { firstname: FAKE.name, lastname: "資工系 / DCP", fullname: `資工系 / DCP ${FAKE.name}`, username: FAKE.id, userpictureurl: "" });
		return JSON.stringify(d);
	}
	return text
		.replaceAll(site.firstname, FAKE.name)
		.replaceAll(site.username, FAKE.id)
		.replace(/(\\*"(?:userfullname|usermodifiedfullname)\\*"\s*:\s*\\*")[^"\\]*/g, "$1授課教師")
		.replace(/(\\*"author\\*"\s*:\s*\{[^{}]*?\\*"fullname\\*"\s*:\s*\\*")[^"\\]*/g, "$1授課教師");
}

const TIMETABLE = {
	25283: "T34R7-EC022",
	25294: "R34-EC114",
	25288: "W34-EC022",
	26454: "F12-CS-PC2",
	26652: "T78-PE",
	25066: "F34-HC103",
	25310: "T56-ED301",
	25309: "M567-ED117",
	27454: "M34-EC114"
};
const DAYS = "MTWRFSU";
const timetable = Object.fromEntries(
	Object.entries(TIMETABLE).map(([id, code]) => {
		const [times, room] = [code.slice(0, code.indexOf("-")), code.slice(code.indexOf("-") + 1)];
		let day = -1;
		const slots = [];
		for (const ch of times) DAYS.includes(ch) ? (day = DAYS.indexOf(ch)) : slots.push({ day, period: ch.toLowerCase() });
		return [id, { slots, room }];
	})
);

async function context(theme, width, height) {
	const browser = await chromium.launch();
	const mobile = width < 600;
	const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2, locale: "zh-TW", timezoneId: "Asia/Taipei", isMobile: mobile, hasTouch: mobile });
	await ctx.addCookies([{ name: "em3_session", value: encodeURIComponent(JSON.stringify({ token, userid: site.userid })), url: base }]);
	const prefs = { state: { theme, nickname: "", timetable, courses: { 23505: { hidden: true }, 23502: { hidden: true }, 25310: { nickname: "HCI" } }, seen: {} }, version: 1 };
	await ctx.addInitScript(p => {
		localStorage.setItem("em3:prefs", p);
		indexedDB.deleteDatabase("keyval-store");
	}, JSON.stringify(prefs));
	await ctx.route(/e3p\.nycu\.edu\.tw\/webservice\/rest/, async route => {
		const body = route.request().postData() ?? "";
		const fn = new URLSearchParams(body).get("wsfunction") ?? "";
		if (/save_|submit_|_view_|mark_|_set_|update_|delete_|add_/.test(decodeURIComponent(body))) return route.abort();
		const res = await route.fetch();
		return route.fulfill({ response: res, body: scrub(await res.text(), fn) });
	});
	await ctx.route(/e3p\.nycu\.edu\.tw\/webservice\/upload/, r => r.abort());
	const page = await ctx.newPage();
	// A Thursday during 演算法概論 so the "now" card is live.
	await page.clock.setFixedTime(new Date("2026-10-15T15:52:00+08:00"));
	page.on("pageerror", e => console.error("pageerror:", e.message));
	return { browser, page };
}

async function shot(page, name, path, prep) {
	await page.goto(base + "#" + path);
	await page.waitForTimeout(4500);
	if (prep) await prep(page);
	await page.waitForTimeout(900);
	const html = await page.content();
	if (html.includes(site.firstname) || html.includes(site.username)) throw new Error(`personal data leaked on ${path}`);
	await page.screenshot({ path: `${out}/${name}.png` });
	console.log(name);
}

for (const [theme, suffix] of [
	["em3-dark", "dark"],
	["em3", "light"]
]) {
	const desk = await context(theme, 1440, 900);
	await shot(desk.page, `dashboard-${suffix}`, "/");
	await shot(desk.page, `materials-${suffix}`, "/courses/25288");
	await shot(desk.page, `submit-${suffix}`, "/courses/25288/assign/239512", async p => {
		await p.locator('input[type="file"]').setInputFiles({ name: "HW1_王小明.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4\n") });
	});
	await shot(desk.page, `courses-${suffix}`, "/courses");
	await shot(desk.page, `timetable-${suffix}`, "/timetable");
	await shot(desk.page, `shortcuts-${suffix}`, "/", p => p.keyboard.press("Meta+/"));
	await desk.browser.close();

	const phone = await context(theme, 390, 844);
	await shot(phone.page, `mobile-dashboard-${suffix}`, "/");
	await shot(phone.page, `mobile-course-${suffix}`, "/courses/25283");
	await phone.browser.close();
}
