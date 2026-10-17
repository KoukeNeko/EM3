import { useCourseIndex } from "@/features/courses/api";
import type { ParsedCourse } from "@/features/courses/parse";
import { usePrefs } from "@/features/preferences/store";
import { call, callMany } from "@/lib/moodle/client";
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
	/** Set when the task can only be done on E3; EM3 explains why before leaving. */
	external?: ExternalTarget;
}

export interface ExternalTarget {
	url: string;
	reason: string;
	notes: string[];
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

interface QuizAttempt {
	id: number;
	state: "inprogress" | "overdue" | "finished" | "abandoned";
	sumgrades: number | null;
	timefinish: number;
}

/** The student's own attempts per quiz id, so finished quizzes stop showing as to-do. */
function useQuizAttempts(quizIds: number[]) {
	const ids = [...quizIds].sort((a, b) => a - b);
	return useQuery({
		queryKey: ["quiz-attempts", ids],
		enabled: ids.length > 0,
		staleTime: 60_000,
		queryFn: async ({ signal }) => {
			const res = await callMany<{ attempts: QuizAttempt[] }>(
				ids.map(quizid => ({ fn: "mod_quiz_get_user_attempts", args: { quizid, status: "all" } })),
				signal
			);
			const map: Record<number, QuizAttempt[]> = {};
			res.forEach((r, i) => r && (map[ids[i]] = r.attempts));
			return map;
		}
	});
}

function quizNotes(q: Quiz, attempts: QuizAttempt[]): string[] {
	const notes: string[] = [];
	const finished = attempts.filter(a => a.state === "finished").length;
	if (attempts.some(a => a.state === "inprogress" || a.state === "overdue")) notes.push("你有一次作答還沒提交，記得回去按「提交」");
	else if (finished) notes.push(`你已經作答 ${finished} 次`);
	if (q.timelimit) notes.push(`限時 ${Math.round(q.timelimit / 60)} 分鐘，按下開始作答後就會計時`);
	notes.push(q.attempts ? `總共可以作答 ${q.attempts} 次` : "不限作答次數");
	return notes;
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
	const attempts = useQuizAttempts((quizzes.data ?? []).filter(q => q.visible !== false).map(q => q.id));

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
			const mine = attempts.data?.[q.id] ?? [];
			const done = mine.filter(a => a.state === "finished");
			const state: TaskState = done.some(a => a.sumgrades !== null) ? "graded" : done.length ? "submitted" : q.timeopen > now ? "upcoming" : q.timeclose && q.timeclose < now ? "closed" : "todo";
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
				external: {
					url: e3Link(`/mod/quiz/view.php?id=${q.coursemodule}`),
					reason: "測驗要在 E3 上作答。EM3 只讀取測驗的時間和你的作答紀錄，不提供作答介面，以免計時或作答紀錄出錯。",
					notes: quizNotes(q, mine)
				}
			});
		}
		return out.sort((x, y) => (x.due || Infinity) - (y.due || Infinity));
	}, [assignments.data, quizzes.data, statuses.data, attempts.data, byId]);

	return {
		tasks,
		isPending: assignments.isPending || quizzes.isPending,
		statusesPending: (statuses.isPending && !!assignments.data?.length) || (attempts.isPending && !!quizzes.data?.length),
		error: assignments.error ?? quizzes.error,
		refetch: () => Promise.all([assignments.refetch(), quizzes.refetch(), statuses.refetch(), attempts.refetch()])
	};
}

export const isOpenTask = (t: Task) => t.state === "todo" || t.state === "late";
