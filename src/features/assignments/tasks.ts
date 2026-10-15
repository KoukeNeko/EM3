import { useCourseIndex } from "@/features/courses/api";
import type { ParsedCourse } from "@/features/courses/parse";
import { usePrefs } from "@/features/preferences/store";
import { call } from "@/lib/moodle/client";
import { e3Link } from "@/lib/moodle/files";
import type { Assignment, SubmissionStatus } from "@/lib/moodle/types";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { type TaskState, taskState, useAssignments, useSubmissionStatuses } from "./api";

// A "task" is anything with a deadline the student must act on: assignments
// (with live submission state) and quizzes (by close time).

export interface Task {
	key: string;
	kind: "assign" | "quiz";
	course: ParsedCourse;
	name: string;
	/** Unix seconds; 0 = no deadline. */
	due: number;
	opens: number;
	cutoff: number;
	state: TaskState;
	assignment?: Assignment;
	status?: SubmissionStatus;
	cmid: number;
	/** Classroom exercise: short submission window, usually on-site. */
	inClass: boolean;
	externalUrl?: string;
}

interface Quiz {
	id: number;
	course: number;
	coursemodule: number;
	name: string;
	timeopen: number;
	timeclose: number;
	timelimit: number;
	attempts: number;
	visible?: boolean;
}

function useQuizzes(courseIds: number[]) {
	const ids = [...courseIds].sort((a, b) => a - b);
	return useQuery({
		queryKey: ["quizzes", ids],
		enabled: ids.length > 0,
		staleTime: 10 * 60_000,
		queryFn: async () => (await call<{ quizzes: Quiz[] }>("mod_quiz_get_quizzes_by_courses", { courseids: ids })).quizzes
	});
}

const IN_CLASS = /課堂|隨堂|in[- ]?class|on[- ]?site|lab|練習|exercise|quiz/i;

function isInClass(name: string, opens: number, due: number) {
	const window = opens && due ? due - opens : Infinity;
	return window <= 4 * 3600 || (IN_CLASS.test(name) && window <= 26 * 3600);
}

/** Current-semester courses minus the ones hidden in EM3. */
export function useActiveCourses() {
	const { currentCourses, ...rest } = useCourseIndex();
	const looks = usePrefs(s => s.courses);
	const active = useMemo(() => currentCourses.filter(c => !looks[c.id]?.hidden), [currentCourses, looks]);
	return { ...rest, currentCourses, active };
}

export function useTasks(courses?: ParsedCourse[]) {
	const { active, byId } = useActiveCourses();
	const scope = courses ?? active;
	const ids = scope.map(c => c.id);
	const assignments = useAssignments(ids);
	const quizzes = useQuizzes(ids);
	const statuses = useSubmissionStatuses((assignments.data ?? []).map(a => a.id));

	const tasks = useMemo(() => {
		const now = Date.now() / 1000;
		const out: Task[] = [];
		for (const a of assignments.data ?? []) {
			const course = byId.get(a.course);
			if (!course || a.nosubmissions) continue;
			const status = statuses.data?.[a.id];
			out.push({
				key: `a${a.id}`,
				kind: "assign",
				course,
				name: a.name,
				due: a.duedate,
				opens: a.allowsubmissionsfromdate,
				cutoff: a.cutoffdate,
				state: taskState(a, status, now),
				assignment: a,
				status,
				cmid: a.cmid,
				inClass: isInClass(a.name, a.allowsubmissionsfromdate, a.duedate)
			});
		}
		for (const q of quizzes.data ?? []) {
			const course = byId.get(q.course);
			if (!course || q.visible === false) continue;
			const state: TaskState = q.timeopen > now ? "upcoming" : q.timeclose && q.timeclose < now ? "closed" : "todo";
			out.push({
				key: `q${q.id}`,
				kind: "quiz",
				course,
				name: q.name,
				due: q.timeclose,
				opens: q.timeopen,
				cutoff: q.timeclose,
				state,
				cmid: q.coursemodule,
				inClass: isInClass(q.name, q.timeopen, q.timeclose),
				externalUrl: e3Link(`/mod/quiz/view.php?id=${q.coursemodule}`)
			});
		}
		return out.sort((x, y) => (x.due || Infinity) - (y.due || Infinity));
	}, [assignments.data, quizzes.data, statuses.data, byId]);

	return {
		tasks,
		isPending: assignments.isPending || quizzes.isPending,
		statusesPending: statuses.isPending && !!assignments.data?.length,
		error: assignments.error ?? quizzes.error,
		refetch: () => Promise.all([assignments.refetch(), quizzes.refetch(), statuses.refetch()])
	};
}

export const isOpenTask = (t: Task) => t.state === "todo" || t.state === "late";
