import assert from "node:assert/strict";
import test from "node:test";
import { setMoodleBaseUrl, setToken } from "../src/lib/moodle/client.ts";
import { fileUrl, moodleLink } from "../src/lib/moodle/files.ts";

test("fileUrl rewrites and authenticates files for a Moodle subdirectory", () => {
	setMoodleBaseUrl("https://moodle.example.edu.tw/moodle");
	setToken("secret token");
	assert.equal(fileUrl("https://moodle.example.edu.tw/moodle/pluginfile.php/42/file.pdf"), "https://moodle.example.edu.tw/moodle/webservice/pluginfile.php/42/file.pdf?token=secret+token");
});

test("fileUrl does not leak the token to a different origin", () => {
	setMoodleBaseUrl("https://moodle.example.edu.tw/moodle");
	setToken("secret");
	assert.equal(fileUrl("https://cdn.example.edu.tw/pluginfile.php/42/file.pdf"), "https://cdn.example.edu.tw/pluginfile.php/42/file.pdf");
});

test("moodleLink opens paths on the configured Moodle site", () => {
	setMoodleBaseUrl("https://moodle.example.edu.tw/moodle");
	assert.equal(moodleLink("course/view.php?id=7"), "https://moodle.example.edu.tw/moodle/course/view.php?id=7");
});
