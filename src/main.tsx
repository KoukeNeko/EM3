import { idbPersister, queryClient } from "@/app/queryClient";
import { router } from "@/app/router";
import { ThemeSync } from "@/app/ThemeSync";
import { useSession } from "@/features/auth/session";
import { setAuthLostHandler } from "@/lib/moodle/client";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

setAuthLostHandler(() => {
	useSession.getState().signOut();
	queryClient.clear();
	void idbPersister.removeClient();
	void router.navigate({ to: "/login" });
});

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<PersistQueryClientProvider client={queryClient} persistOptions={{ persister: idbPersister, maxAge: 7 * 24 * 60 * 60_000, buster: "em3-1" }}>
			<ThemeSync />
			<RouterProvider router={router} />
		</PersistQueryClientProvider>
	</StrictMode>
);
