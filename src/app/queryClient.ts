import { MoodleError } from "../lib/moodle/client";
import { QueryClient } from "@tanstack/react-query";
import type { PersistedClient, Persister } from "@tanstack/react-query-persist-client";
import { del, get, set } from "idb-keyval";

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 2 * 60_000,
			gcTime: 7 * 24 * 60 * 60_000,
			refetchOnWindowFocus: true,
			retry: (count, error) => !(error instanceof MoodleError && error.isAuthError) && count < 2
		}
	}
});

const IDB_KEY = "em3:query-cache";

/**
 * Caches E3 responses in IndexedDB so the dashboard paints instantly from the
 * last visit and then revalidates in the background.
 */
export const idbPersister: Persister = {
	persistClient: client => set(IDB_KEY, client),
	restoreClient: () => get<PersistedClient>(IDB_KEY),
	removeClient: () => del(IDB_KEY)
};

/** Remove data owned by the previous Moodle account before entering the app. */
export async function clearPrivateCache(removePersisted: () => PromiseLike<void> | void = () => idbPersister.removeClient()) {
	queryClient.clear();
	await removePersisted();
}
