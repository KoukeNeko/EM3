import assert from "node:assert/strict";
import test from "node:test";
import { MOODLE_SITES, moodleUrl, normalizeMoodleUrl } from "../src/lib/moodle/site.ts";

test("normalizeMoodleUrl accepts HTTPS Moodle roots and removes trailing slashes", () => {
	assert.equal(normalizeMoodleUrl(" https://moodle.example.edu.tw/moodle/ "), "https://moodle.example.edu.tw/moodle");
});

test("normalizeMoodleUrl adds HTTPS when the scheme is omitted", () => {
	assert.equal(normalizeMoodleUrl("moodle.example.edu.tw"), "https://moodle.example.edu.tw");
	assert.equal(normalizeMoodleUrl("moodle.example.edu.tw:8443/moodle"), "https://moodle.example.edu.tw:8443/moodle");
});

test("normalizeMoodleUrl accepts common Moodle homepage and login-page URLs", () => {
	assert.equal(normalizeMoodleUrl("https://example.edu.tw/moodle/login/index.php"), "https://example.edu.tw/moodle");
	assert.equal(normalizeMoodleUrl("https://example.edu.tw/moodle/login/token.php"), "https://example.edu.tw/moodle");
	assert.equal(normalizeMoodleUrl("https://example.edu.tw/moodle/index.php"), "https://example.edu.tw/moodle");
	assert.equal(normalizeMoodleUrl("https://example.edu.tw/moodle/my/?redirect=0"), "https://example.edu.tw/moodle");
	assert.equal(normalizeMoodleUrl("https://example.edu.tw/moodle/login/index.php?testsession=7"), "https://example.edu.tw/moodle");
});

test("normalizeMoodleUrl rejects credentials and non-HTTP protocols", () => {
	assert.throws(() => normalizeMoodleUrl("https://user:secret@example.edu.tw"), /網址/);
	assert.equal(normalizeMoodleUrl("https://example.edu.tw/?site=1#main"), "https://example.edu.tw");
	assert.throws(() => normalizeMoodleUrl("javascript:alert(1)"), /網址/);
});

test("normalizeMoodleUrl refuses plaintext credential transport", () => {
	assert.throws(() => normalizeMoodleUrl("http://moodle.example.edu.tw"), /HTTPS/);
	assert.equal(normalizeMoodleUrl("http://localhost:5173/moodle"), "http://localhost:5173/moodle");
});

test("moodleUrl preserves Moodle installations hosted below a path", () => {
	assert.equal(moodleUrl("https://example.edu.tw/moodle", "login/token.php"), "https://example.edu.tw/moodle/login/token.php");
});

test("the curated site list includes verified Moodle mobile API endpoints", () => {
	assert.ok(MOODLE_SITES.some(site => site.name === "國立中正大學" && site.baseUrl === "https://ecourse2.ccu.edu.tw"));
	assert.ok(MOODLE_SITES.some(site => site.name === "國立臺南大學" && site.baseUrl === "https://moodle.nutn.edu.tw/moodle"));
	assert.equal(new Set(MOODLE_SITES.map(site => site.baseUrl)).size, MOODLE_SITES.length);
	for (const site of MOODLE_SITES) assert.equal(normalizeMoodleUrl(site.baseUrl), site.baseUrl);
});
