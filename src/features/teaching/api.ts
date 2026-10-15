import { useSession } from "@/features/auth/session";
import { useCourses } from "@/features/courses/api";
import { call, callMany, uploadToDraft } from "@/lib/moodle/client";
import { fileUrl } from "@/lib/moodle/files";
import type { Assignment, InlineFile, SubmissionStatus } from "@/lib/moodle/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";

// Teacher / TA side. Everything here reads or writes real student records,
// so writes are explicit, previewed, and never batched silently.

interface AdminOptions {
	courses: { id: number; options: { name: string; available: boolean }[] }[];
}

/** Courses where the user can edit or grade (teacher, TA). One request for all courses. */
export function useTeaching() {
	const { data: courses } = useCourses();
	const ids = useMemo(() => (courses ?? []).map(c => c.id).sort((a, b) => a - b), [courses]);
	const q = useQuery({
		queryKey: ["teaching", ids],
		enabled: ids.length > 0,
		staleTime: 60 * 60_000,
		queryFn: async () => {
			const res = await call<AdminOptions>("core_course_get_user_administration_options", { courseids: ids });
			const map: Record<number, { edit: boolean; grade: boolean }> = {};
			for (const c of res.courses) {
				const on = new Set(c.options.filter(o => o.available).map(o => o.name));
				if (on.has("update") || on.has("gradebook") || on.has("reports")) map[c.id] = { edit: on.has("update"), grade: on.has("gradebook") || on.has("update") };
			}
			return map;
		}
	});
	return { teaching: q.data ?? {}, isPending: q.isPending };
}

export function useIsTeaching(courseId: number) {
	const { teaching } = useTeaching();
	return !!teaching[courseId];
}

export interface Participant {
	id: number;
	fullname: string;
	email?: string;
	submitted: boolean;
	requiregrading: boolean;
	grantedextension: boolean;
	submissionstatus?: string;
	suspended?: boolean;
	profileimageurl?: string;
	groups?: { id: number; name: string }[];
	roles?: { roleid: number; name: string; shortname: string }[];
	/** Has a gradebook entry but is missing from E3's grading table. */
	outsideTable?: boolean;
}

/**
 * Student IDs (學號) are only exposed to teachers through the gradebook's
 * gradable-users call, as `username`. Keyed by Moodle user id.
 */
interface GradableUser {
	id: number;
	username: string;
	idnumber?: string;
	fullname: string;
	email?: string;
	suspended?: boolean;
}

export function useGradableUsers(courseId: number) {
	return useQuery({
		queryKey: ["teach", "gradable", courseId],
		staleTime: 30 * 60_000,
		queryFn: async () => (await call<{ users: GradableUser[] }>("core_grades_get_gradable_users", { courseid: courseId, groupid: 0, onlyactive: false })).users
	});
}

export function useStudentIds(courseId: number) {
	const q = useGradableUsers(courseId);
	return { ...q, data: q.data ? (Object.fromEntries(q.data.map(u => [u.id, u.username || u.idnumber || ""])) as Record<number, string>) : undefined };
}

/** Latest submission per user, straight from the submissions table. */
export function useSubmissionIndex(assignid: number | undefined) {
	return useQuery({
		queryKey: ["teach", "submissions", assignid],
		enabled: !!assignid,
		staleTime: 60_000,
		queryFn: async () => {
			const res = await call<{ assignments: { submissions: { userid: number; status: string; timemodified: number }[] }[] }>("mod_assign_get_submissions", { assignmentids: [assignid!] });
			return Object.fromEntries((res.assignments[0]?.submissions ?? []).map(s => [s.userid, s])) as Record<number, { userid: number; status: string; timemodified: number }>;
		}
	});
}

/**
 * E3's grading table (list_participants) and the gradebook (gradable users)
 * disagree: some submitted students only appear in the latter. Merge both so
 * nobody who handed something in is missed; extras are flagged.
 */
export function useRoster(courseId: number, assignid: number | undefined) {
	const participants = useParticipants(assignid);
	const gradable = useGradableUsers(courseId);
	const subs = useSubmissionIndex(assignid);
	const data = useMemo(() => {
		if (!participants.data) return undefined;
		const seen = new Set(participants.data.map(p => p.id));
		const submitted = (id: number) => subs.data?.[id]?.status === "submitted";
		const base: Participant[] = participants.data.map(p => ({ ...p, submitted: p.submitted || submitted(p.id) }));
		const extra: Participant[] = (gradable.data ?? [])
			.filter(u => !seen.has(u.id))
			.map(u => ({ id: u.id, fullname: u.fullname, email: u.email, submitted: submitted(u.id), requiregrading: submitted(u.id), grantedextension: false, suspended: u.suspended, outsideTable: true }));
		return [...base, ...extra];
	}, [participants.data, gradable.data, subs.data]);
	return { data, isPending: participants.isPending, error: participants.error ?? gradable.error, refetch: () => Promise.all([participants.refetch(), gradable.refetch(), subs.refetch()]) };
}

export const isAuditor = (p: Participant) => !!p.roles?.length && p.roles.every(r => r.shortname === "guest");

export function useParticipants(assignid: number | undefined) {
	return useQuery({
		queryKey: ["teach", "participants", assignid],
		enabled: !!assignid,
		staleTime: 60_000,
		queryFn: () => call<Participant[]>("mod_assign_list_participants", { assignid: assignid!, groupid: 0, filter: "", includeenrolments: false })
	});
}

interface GradeRow {
	userid: number;
	grade: string;
	grader: number;
	timemodified: number;
	attemptnumber: number;
}

export function useGrades(assignid: number | undefined) {
	return useQuery({
		queryKey: ["teach", "grades", assignid],
		enabled: !!assignid,
		staleTime: 60_000,
		queryFn: async () => {
			const res = await call<{ assignments: { assignmentid: number; grades: GradeRow[] }[] }>("mod_assign_get_grades", { assignmentids: [assignid!] });
			const map: Record<number, GradeRow> = {};
			for (const g of res.assignments[0]?.grades ?? []) {
				// Keep the latest attempt per student.
				if (!map[g.userid] || g.attemptnumber > map[g.userid].attemptnumber) map[g.userid] = g;
			}
			return map;
		}
	});
}

/** Submission + feedback for one student, as the teacher sees it. */
export function useStudentStatus(assignid: number | undefined, userid: number | undefined) {
	return useQuery({
		queryKey: ["teach", "status", assignid, userid],
		enabled: !!assignid && !!userid,
		staleTime: 30_000,
		queryFn: () => call<SubmissionStatus>("mod_assign_get_submission_status", { assignid: assignid!, userid: userid! })
	});
}

/** Prefetch everyone's submission status in batches (for downloads and the overview). */
export async function fetchAllStatuses(assignid: number, userids: number[], onProgress?: (done: number) => void) {
	const out: Record<number, SubmissionStatus> = {};
	for (let i = 0; i < userids.length; i += 40) {
		const chunk = userids.slice(i, i + 40);
		const res = await callMany<SubmissionStatus>(chunk.map(userid => ({ fn: "mod_assign_get_submission_status", args: { assignid, userid } })));
		res.forEach((r, j) => r && (out[chunk[j]] = r));
		onProgress?.(Math.min(userids.length, i + chunk.length));
	}
	return out;
}

export function onlineText(status: SubmissionStatus | undefined): string {
	const sub = status?.lastattempt?.submission ?? status?.lastattempt?.teamsubmission;
	return sub?.plugins?.find(p => p.type === "onlinetext")?.editorfields?.[0]?.text ?? "";
}

export function submittedFiles(status: SubmissionStatus | undefined): InlineFile[] {
	const sub = status?.lastattempt?.submission ?? status?.lastattempt?.teamsubmission;
	return sub?.plugins?.find(p => p.type === "file")?.fileareas?.flatMap(a => a.files ?? []) ?? [];
}

export function feedbackComment(status: SubmissionStatus | undefined): string {
	return status?.feedback?.plugins?.find(p => p.type === "comments")?.editorfields?.[0]?.text ?? "";
}

export function feedbackFiles(status: SubmissionStatus | undefined): InlineFile[] {
	return status?.feedback?.plugins?.find(p => p.type === "file")?.fileareas?.flatMap(a => a.files ?? []) ?? [];
}

const feedbackEnabled = (a: Assignment, plugin: string) => a.configs.some(c => c.subtype === "assignfeedback" && c.plugin === plugin && c.name === "enabled" && c.value === "1");

export const feedbackPlugins = (a: Assignment) => ({ comments: feedbackEnabled(a, "comments"), files: feedbackEnabled(a, "file") });

export interface GradeInput {
	userid: number;
	/** Points; null keeps the student ungraded (-1 in Moodle). */
	grade: number | null;
	/**
	 * HTML for the feedback comment. Always send the current comment when it is
	 * unchanged: Moodle treats a missing comment field as "cleared".
	 */
	commentHtml: string;
	/** New feedback files; with keepFiles they replace the feedback file area. */
	files?: File[];
	keepFiles?: InlineFile[];
}

async function filesToDraft(add: File[], keep: InlineFile[]) {
	const kept = await Promise.all(
		keep.map(async f => {
			const blob = await (await fetch(fileUrl(f.fileurl))).blob();
			return new File([blob], f.filename, { type: f.mimetype || blob.type });
		})
	);
	const all = [...kept, ...add];
	return all.length ? uploadToDraft(all) : (await call<{ itemid: number }>("core_files_get_unused_draft_itemid")).itemid;
}

/**
 * Saves one student's grade and feedback through mod_assign_save_grade.
 * The current marking-workflow state is passed back unchanged.
 */
export function useSaveGrade(assignment: Assignment | undefined) {
	const qc = useQueryClient();
	const userid = useSession(s => s.userid);
	return useMutation({
		mutationFn: async (input: GradeInput) => {
			const a = assignment!;
			const plugindata: Record<string, unknown> = {};
			const plugins = feedbackPlugins(a);
			if (plugins.comments) plugindata.assignfeedbackcomments_editor = { text: input.commentHtml, format: 1 };
			if (plugins.files && (input.files?.length || input.keepFiles)) plugindata.files_filemanager = await filesToDraft(input.files ?? [], input.keepFiles ?? []);
			let workflowstate = "";
			if (a.markingworkflow) {
				const flags = await call<{ assignments: { userflags: { userid: number; workflowstate: string }[] }[] }>("mod_assign_get_user_flags", { assignmentids: [a.id] });
				workflowstate = flags.assignments[0]?.userflags.find(f => f.userid === input.userid)?.workflowstate ?? "";
			}
			await call<null>("mod_assign_save_grade", {
				assignmentid: a.id,
				userid: input.userid,
				grade: input.grade ?? -1,
				attemptnumber: -1,
				addattempt: false,
				workflowstate,
				applytoall: true,
				plugindata: plugindata as never
			});
			return userid;
		},
		onSuccess: (_d, input) => {
			void qc.invalidateQueries({ queryKey: ["teach", "status", assignment?.id, input.userid] });
			void qc.invalidateQueries({ queryKey: ["teach", "grades", assignment?.id] });
			void qc.invalidateQueries({ queryKey: ["teach", "participants", assignment?.id] });
			void qc.invalidateQueries({ queryKey: ["teach", "submissions", assignment?.id] });
		}
	});
}

export function useGrantExtension(assignment: Assignment | undefined) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async ({ userids, until }: { userids: number[]; until: number }) => {
			const res = await call<{ userid: number; success: boolean; errormessage?: string }[]>("mod_assign_save_user_extensions", {
				assignmentid: assignment!.id,
				userids,
				dates: userids.map(() => until)
			});
			const failed = res.filter(r => !r.success);
			if (failed.length) throw new Error(failed.map(f => f.errormessage).join("\n"));
		},
		onSuccess: () => void qc.invalidateQueries({ queryKey: ["teach", "participants", assignment?.id] })
	});
}

/** Strips E3's 「系所 / 縮寫」 prefix and any {mlang} noise from names. */
export const displayName = (s: string) =>
	s
		.replace(/\{mlang[^}]*\}/g, "")
		.replace(/^.+?\s\/\s\S+\s+/, "")
		.trim();
