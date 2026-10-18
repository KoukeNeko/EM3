import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { decodeSsoToken, md5 } from "../src/lib/moodle/sso.ts";

test("md5 matches node:crypto, including multi-block and non-ASCII input", () => {
	for (const text of ["", "a", "abc", "https://ecourse2.ccu.edu.tw" + "f".repeat(32), "x".repeat(55), "x".repeat(56), "x".repeat(64), "x".repeat(300), "中正大學"]) {
		assert.equal(md5(text), createHash("md5").update(text).digest("hex"), JSON.stringify(text));
	}
});

const base = "https://ecourse2.ccu.edu.tw";
const link = (siteid: string, ...rest: string[]) => `web+em3://token=${Buffer.from([siteid, ...rest].join(":::")).toString("base64")}`;

test("decodeSsoToken returns the token when the passport matches", () => {
	const siteid = md5(base + "pp");
	assert.equal(decodeSsoToken(link(siteid, "tok123"), base, "pp"), "tok123");
	assert.equal(decodeSsoToken(link(siteid, "tok123", "private"), base, "pp"), "tok123");
});

test("decodeSsoToken accepts a percent-encoded link and a bare base64 string", () => {
	const siteid = md5(base + "pp");
	assert.equal(decodeSsoToken(encodeURIComponent(link(siteid, "tok123")), base, "pp"), "tok123");
	assert.equal(decodeSsoToken(link(siteid, "tok123").replace("web+em3://token=", ""), base, "pp"), "tok123");
});

test("decodeSsoToken rejects a link made for another passport or site", () => {
	assert.throws(() => decodeSsoToken(link(md5(base + "other"), "tok123"), base, "pp"), /不是這次登入/);
	assert.throws(() => decodeSsoToken(link(md5("https://evil.example" + "pp"), "tok123"), base, "pp"), /不是這次登入/);
});

test("decodeSsoToken rejects garbage", () => {
	assert.throws(() => decodeSsoToken("not a link!!", base, "pp"), /連結/);
});
