// EM3 service worker: makes the app installable and lets it open offline.
// Only same-origin GETs are handled; E3 API calls and fonts go straight to the network
// (E3 data is already persisted by TanStack Query in IndexedDB).
//
// - Page loads: network first, falling back to the cached shell when offline.
// - /assets/*: file names carry a content hash, so cache first.
// - Everything else (icons, screenshots): serve the cache, refresh it in the background.

const SHELL = "em3-shell-v1";
const ASSETS = "em3-assets-v1";
const MAX_ASSETS = 150;

self.addEventListener("install", event => {
	event.waitUntil(
		caches
			.open(SHELL)
			.then(c => c.addAll(["./", "./manifest.webmanifest", "./favicon.svg", "./icon-192.png"]))
			.then(() => self.skipWaiting())
	);
});

self.addEventListener("activate", event => {
	event.waitUntil(
		caches
			.keys()
			.then(keys => Promise.all(keys.filter(k => k !== SHELL && k !== ASSETS).map(k => caches.delete(k))))
			.then(() => self.clients.claim())
	);
});

self.addEventListener("fetch", event => {
	const req = event.request;
	const url = new URL(req.url);
	if (req.method !== "GET" || url.origin !== self.location.origin) return;

	if (req.mode === "navigate") {
		event.respondWith(
			fetch(req)
				.then(res => {
					if (res.ok) {
						const copy = res.clone();
						void caches.open(SHELL).then(c => c.put("./", copy));
					}
					return res;
				})
				.catch(() => caches.match("./", { cacheName: SHELL }).then(r => r ?? Response.error()))
		);
		return;
	}

	if (url.pathname.startsWith("/assets/")) {
		event.respondWith(
			caches.match(req, { cacheName: ASSETS }).then(
				hit =>
					hit ??
					fetch(req).then(res => {
						if (res.ok) {
							const copy = res.clone();
							void caches.open(ASSETS).then(async c => {
								await c.put(req, copy);
								const keys = await c.keys();
								await Promise.all(keys.slice(0, Math.max(0, keys.length - MAX_ASSETS)).map(k => c.delete(k)));
							});
						}
						return res;
					})
			)
		);
		return;
	}

	event.respondWith(
		caches.open(SHELL).then(async c => {
			const hit = await c.match(req);
			const fresh = fetch(req)
				.then(res => {
					if (res.ok) void c.put(req, res.clone());
					return res;
				})
				.catch(() => hit ?? Response.error());
			return hit ?? fresh;
		})
	);
});
