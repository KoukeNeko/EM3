import { useSession } from "@/features/auth/session";
import { createHashHistory, createRootRoute, createRoute, createRouter, lazyRouteComponent, Outlet, redirect } from "@tanstack/react-router";
import { AppShell } from "./AppShell";

// Hash history keeps every route reloadable on any static host (GitHub Pages,
// Cloudflare assets, a USB stick) without server-side rewrites.

const rootRoute = createRootRoute({ component: Outlet });

const loginRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/login",
	validateSearch: (s: Record<string, unknown>): { next?: string } => ({ next: typeof s.next === "string" ? s.next : undefined }),
	component: lazyRouteComponent(() => import("@/features/auth/LoginPage"), "LoginPage"),
	beforeLoad: () => {
		if (useSession.getState().token) throw redirect({ to: "/" });
	}
});

const appRoute = createRoute({
	getParentRoute: () => rootRoute,
	id: "app",
	component: AppShell,
	beforeLoad: ({ location }) => {
		if (!useSession.getState().token) throw redirect({ to: "/login", search: { next: location.href } });
	}
});

const dashboardRoute = createRoute({
	getParentRoute: () => appRoute,
	path: "/",
	component: lazyRouteComponent(() => import("@/features/dashboard/DashboardPage"), "DashboardPage")
});

const coursesRoute = createRoute({
	getParentRoute: () => appRoute,
	path: "/courses",
	component: lazyRouteComponent(() => import("@/features/courses/CoursesPage"), "CoursesPage")
});

export type CourseTab = "materials" | "assignments" | "announcements" | "grades";

const courseRoute = createRoute({
	getParentRoute: () => appRoute,
	path: "/courses/$courseId",
	validateSearch: (s: Record<string, unknown>): { tab?: CourseTab; q?: string } => ({
		tab: (["materials", "assignments", "announcements", "grades"] as const).includes(s.tab as CourseTab) ? (s.tab as CourseTab) : undefined,
		q: typeof s.q === "string" ? s.q : undefined
	}),
	component: lazyRouteComponent(() => import("@/features/course/CoursePage"), "CoursePage")
});

const assignmentRoute = createRoute({
	getParentRoute: () => appRoute,
	path: "/courses/$courseId/assign/$cmid",
	component: lazyRouteComponent(() => import("@/features/assignments/AssignmentPage"), "AssignmentPage")
});

const discussionRoute = createRoute({
	getParentRoute: () => appRoute,
	path: "/courses/$courseId/discussion/$discussionId",
	component: lazyRouteComponent(() => import("@/features/announcements/DiscussionPage"), "DiscussionPage")
});

const tasksRoute = createRoute({
	getParentRoute: () => appRoute,
	path: "/tasks",
	component: lazyRouteComponent(() => import("@/features/assignments/TasksPage"), "TasksPage")
});

const announcementsRoute = createRoute({
	getParentRoute: () => appRoute,
	path: "/announcements",
	validateSearch: (s: Record<string, unknown>): { course?: number } => ({ course: Number(s.course) || undefined }),
	component: lazyRouteComponent(() => import("@/features/announcements/AnnouncementsPage"), "AnnouncementsPage")
});

const calendarRoute = createRoute({
	getParentRoute: () => appRoute,
	path: "/calendar",
	component: lazyRouteComponent(() => import("@/features/calendar/CalendarPage"), "CalendarPage")
});

const timetableRoute = createRoute({
	getParentRoute: () => appRoute,
	path: "/timetable",
	component: lazyRouteComponent(() => import("@/features/timetable/TimetablePage"), "TimetablePage")
});

const settingsRoute = createRoute({
	getParentRoute: () => appRoute,
	path: "/settings",
	component: lazyRouteComponent(() => import("@/features/settings/SettingsPage"), "SettingsPage")
});

const routeTree = rootRoute.addChildren([
	loginRoute,
	appRoute.addChildren([dashboardRoute, coursesRoute, courseRoute, assignmentRoute, discussionRoute, tasksRoute, announcementsRoute, calendarRoute, timetableRoute, settingsRoute])
]);

export const router = createRouter({
	routeTree,
	history: createHashHistory(),
	defaultPreload: "intent",
	defaultPreloadStaleTime: 0,
	scrollRestoration: true
});

declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}
