import assert from "node:assert/strict";
import test from "node:test";
import { clearPrivateCache, queryClient } from "../src/app/queryClient.ts";

test("clearPrivateCache removes in-memory and persisted account data", async () => {
	let persistedRemoved = false;
	queryClient.setQueryData(["siteinfo"], { userid: 7, fullname: "Previous user" });

	await clearPrivateCache(async () => {
		persistedRemoved = true;
	});

	assert.equal(queryClient.getQueryData(["siteinfo"]), undefined);
	assert.equal(persistedRemoved, true);
});
