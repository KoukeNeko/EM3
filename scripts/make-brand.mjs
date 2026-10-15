// Draws the favicon, PWA icons and the Open Graph image from the logo paths in
// src/shared/ui/Logo.tsx, so they never drift from the mark used in the app.
// Usage: NODE_PATH=$(npm root -g) node scripts/make-brand.mjs
// Uses the globally installed Playwright; writes into public/.
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";

const { chromium } = createRequire(import.meta.url)(process.env.NODE_PATH + "/playwright");
const root = new URL("..", import.meta.url).pathname;
const pub = p => root + "public/" + p;

const paths = [...readFileSync(root + "src/shared/ui/Logo.tsx", "utf8").matchAll(/"(M[^"]+)"/g)].map(m => m[1]);
const FROM = "#C4A7E7";
const TO = "#F6C279";

/** The mark centred in a 512 square: `scale` is its width relative to the square. */
function tile({ rounded, scale }) {
	const w = 512 * scale;
	const h = (w * 151) / 181;
	const k = w / 181;
	const x = (512 - w) / 2;
	const y = (512 - h) / 2 + 6;
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
<defs>
<linearGradient id="bg" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse"><stop stop-color="#221E2E"/><stop offset="1" stop-color="#121118"/></linearGradient>
<radialGradient id="glow" cx="0.3" cy="0.2" r="0.75"><stop stop-color="${FROM}" stop-opacity="0.28"/><stop offset="1" stop-color="${FROM}" stop-opacity="0"/></radialGradient>
<linearGradient id="mark" x1="90.5" y1="0" x2="90.5" y2="151" gradientUnits="userSpaceOnUse"><stop stop-color="${FROM}"/><stop offset="1" stop-color="${TO}"/></linearGradient>
<clipPath id="shape"><rect width="512" height="512" rx="${rounded ? 116 : 0}"/></clipPath>
</defs>
<g clip-path="url(#shape)">
<rect width="512" height="512" fill="url(#bg)"/>
<rect width="512" height="512" fill="url(#glow)"/>
<g transform="translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${k.toFixed(4)})">${paths.map(d => `<path d="${d}" fill="url(#mark)"/>`).join("")}</g>
</g>
</svg>
`;
}

const favicon = tile({ rounded: true, scale: 0.74 });
writeFileSync(pub("favicon.svg"), favicon);

const browser = await chromium.launch();

async function png(svg, size, file) {
	const page = await browser.newPage({ viewport: { width: size, height: size } });
	await page.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`);
	await page.screenshot({ path: file, omitBackground: true });
	await page.close();
}

const tmp = root + "node_modules/.cache/brand";
execFileSync("mkdir", ["-p", tmp]);
await png(tile({ rounded: true, scale: 0.66 }), 192, pub("icon-192.png"));
await png(tile({ rounded: true, scale: 0.66 }), 512, pub("icon-512.png"));
// Maskable icons are cropped to a circle or squircle by the OS: keep the mark inside the middle 80%.
await png(tile({ rounded: false, scale: 0.54 }), 512, pub("icon-maskable-512.png"));
// iOS rounds the corners itself and shows transparency as black.
await png(tile({ rounded: false, scale: 0.64 }), 180, pub("apple-touch-icon.png"));
for (const s of [16, 32, 48]) await png(favicon, s, `${tmp}/fav-${s}.png`);
execFileSync("python3", [
	"-c",
	`from PIL import Image; i=[Image.open(f"${tmp}/fav-{s}.png") for s in (16,32,48)]; i[2].save("${pub("favicon.ico")}", sizes=[(16,16),(32,32),(48,48)], append_images=i[:2])`
]);

// Open Graph: 1200×630, drawn at 2x and saved as JPEG to stay well under the 5 MB limit platforms use.
// Flat on purpose: one background colour, the headline, and the real app standing upright.
const phone = readFileSync(pub("screens/mobile-dashboard-dark.webp")).toString("base64");
const mark = `<svg viewBox="0 0 181 151" width="44" height="37"><defs><linearGradient id="m" x1="90.5" y1="0" x2="90.5" y2="151" gradientUnits="userSpaceOnUse"><stop stop-color="${FROM}"/><stop offset="1" stop-color="${TO}"/></linearGradient></defs>${paths.map(d => `<path d="${d}" fill="url(#m)"/>`).join("")}</svg>`;
const og = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 2 });
await og.setContent(`<!doctype html><html><head>
<link rel="stylesheet" href="https://font.emtech.cc/css/MiSansTC.css">
<style>
*{box-sizing:border-box;margin:0}
body{width:1200px;height:630px;overflow:hidden;position:relative;background:#141417;color:#f3f3f5;font-family:"MiSansTC","MiSans TC",sans-serif}
h1{position:absolute;left:72px;top:96px;font-size:92px;line-height:1.1;font-weight:900;letter-spacing:-0.03em}
p{position:absolute;left:76px;top:330px;font-size:27px;line-height:1.55;color:#9d9da6}
.foot{position:absolute;left:72px;bottom:64px;display:flex;align-items:center;gap:14px;font-size:26px;font-weight:600}
.foot span{color:#7d7d86;font-weight:400}
.phone{position:absolute;left:862px;top:64px;width:300px}
</style></head><body>
<h1>E3 拉完了，<br>寫個給人用的吧。</h1>
<p>陽明交大 E3 的客戶端，<br>學生、老師、助教都能用。</p>
<div class="foot">${mark}EM3<span>e3.emtech.cc</span></div>
<img class="phone" src="data:image/webp;base64,${phone}">
</body></html>`);
await og.evaluate(() => document.fonts.ready);
await og.waitForTimeout(500);
await og.screenshot({ path: `${tmp}/og.png` });
execFileSync("python3", ["-c", `from PIL import Image; Image.open("${tmp}/og.png").convert("RGB").save("${pub("og.jpg")}", quality=88, optimize=True, progressive=True)`]);

await browser.close();
console.log("wrote favicon.svg, favicon.ico, icon-192/512, icon-maskable-512, apple-touch-icon, og.jpg");
