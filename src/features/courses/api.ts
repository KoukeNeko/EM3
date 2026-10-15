import { useSession } from "@/features/auth/session";
import { call } from "@/lib/moodle/client";
import type { CourseSection, EnrolledCourse, SiteInfo } from "@/lib/moodle/types";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { type ParsedCourse, latestSemester, parseCourse } from "./parse";

export const siteInfoQuery = queryOptions({
	queryKey: ["siteinfo"],
	queryFn: () => call<SiteInfo>("core_webservice_get_site_info"),
	staleTime: 60 * 60_000
});

export const useSiteInfo = () => useQuery(siteInfoQuery);

export function coursesQuery(userid: number) {
	return queryOptions({
		queryKey: ["courses", userid],
		queryFn: () => call<EnrolledCourse[]>("core_enrol_get_users_courses", { userid, returnusercount: 0 }),
		staleTime: 30 * 60_000,
		select: (list: EnrolledCourse[]) => list.map(parseCourse)
	});
}

export function useCourses() {
	const userid = useSession(s => s.userid)!;
	return useQuery(coursesQuery(userid));
}

/** All courses keyed by id, plus the semester we treat as "now". */
export function useCourseIndex() {
	const { data, ...rest } = useCourses();
	return useMemo(() => {
		const list = data ?? [];
		const byId = new Map<number, ParsedCourse>(list.map(c => [c.id, c]));
		const current = latestSemester(list);
		const currentCourses = list.filter(c => c.semester?.code === current?.code);
		return { ...rest, list, byId, current, currentCourses };
	}, [data, rest.isPending, rest.error]);
}

export function courseContentsQuery(courseid: number) {
	return queryOptions({
		queryKey: ["contents", courseid],
		queryFn: () => call<CourseSection[]>("core_course_get_contents", { courseid }),
		staleTime: 5 * 60_000
	});
}

export const useCourseContents = (courseid: number) => useQuery(courseContentsQuery(courseid));
