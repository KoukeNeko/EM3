// Read-only Playwright session on the official E3 site for research agents.
//
//   import { openE3 } from "/Users/em/uwu/EM3/scripts/e3-browser.mjs";
//   const { page, close } = await openE3({ width: 1440, height: 900 });
//   await page.goto("https://e3p.nycu.edu.tw/course/view.php?id=23571");
//
// Run with NODE_PATH=$(npm root -g). Logs in with .env.local (the only POST
// it ever sends) and then aborts every non-GET request to E3 except AJAX calls
// whose function names are reads (get/list/search…). Forms, edit-mode toggles,
// grading saves and preference changes cannot go through.
// Blocked requests are printed so you can tell when a click was a write.
import { readFileSync } from "node:fs";
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

const READ_VERBS = new Set(["get", "list", "search", "check", "fetch", "can", "load", "data", "is", "has", "count", "render"]);
function isReadFunction(fn) {
	const parts = fn.split("_");
	const verb = parts
		.slice(1)
		.find(p => READ_VERBS.has(p) || /^(set|save|update|delete|create|add|submit|mark|toggle|move|edit|send|process|start|lock|unlock|revert|grant|remove|duplicate|hide|show)$/.test(p));
	return !!verb && READ_VERBS.has(verb);
}

export async function openE3({ width = 1440, height = 900, mobile = false } = {}) {
	const browser = await chromium.launch();
	const ctx = await browser.newContext({ viewport: { width, height }, locale: "zh-TW", timezoneId: "Asia/Taipei", isMobile: mobile, hasTouch: mobile });
	const page = await ctx.newPage();
	await page.goto("https://e3p.nycu.edu.tw/login/index.php");
	await page.fill("#username", env.E3_USERNAME);
	await page.fill("#password", env.E3_PASSWORD);
	await Promise.all([page.waitForLoadState("networkidle"), page.click("#loginbtn")]);
	if (page.url().includes("/login/")) throw new Error("E3 login failed");
	// From here on, nothing but GET reaches E3.
	await ctx.route(/e3p\.nycu\.edu\.tw/, route => {
		const req = route.request();
		// Moodle pages fetch data through POST /lib/ajax/service.php; let pure reads through.
		const info = /\/lib\/ajax\/service(-nologin)?\.php.*[?&]info=([^&]+)/.exec(req.url())?.[2];
		if (req.method() === "POST" && info && decodeURIComponent(info).split(",").every(isReadFunction)) return route.continue();
		if (req.method() !== "GET") {
			console.error(`[e3-browser] BLOCKED ${req.method()} ${req.url().slice(0, 140)}`);
			return route.abort();
		}
		const url = req.url();
		// GETs that still change state in Moodle.
		// Includes table/grading GET params that Moodle silently stores as user preferences.
		if (
			/sesskey=|\/editmode\.php|action=(delete|hide|show|duplicate|lock|unlock|revert|grantextension)|confirm=1|[?&](quickgrading|perpage|filter|tsort|tdir|tifirst|tilast|treset|thide|tshow|downloadasfolders)=/.test(
				url
			)
		) {
			console.error(`[e3-browser] BLOCKED state-changing GET ${url.slice(0, 140)}`);
			return route.abort();
		}
		return route.continue();
	});
	return { browser, ctx, page, close: () => browser.close() };
}
