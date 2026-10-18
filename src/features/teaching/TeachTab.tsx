import { assignRules, useAssignments } from "@/features/assignments/api";
import type { ParsedCourse } from "@/features/courses/parse";
import { callMany } from "@/lib/moodle/client";
import { e3Link, siteLabel } from "@/lib/moodle/files";
import type { Assignment } from "@/lib/moodle/types";
import { Due } from "@/shared/ui/Time";
import { Empty, Lines } from "@/shared/ui/States";
import {
	ArrowSquareOutIcon,
	CaretRightIcon,
	ChalkboardTeacherIcon,
	ExamIcon,
	FilePlusIcon,
	ListChecksIcon,
	MegaphoneIcon,
	NotePencilIcon,
	TableIcon,
	UsersThreeIcon,
	WarningIcon
} from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useMemo } from "react";
import type { Participant } from "./api";

export interface Progress {
	assignment: Assignment;
	total: number;
	submitted: number;
	needsGrading: number;
}

interface SubsResponse {
	assignments: { assignmentid: number; submissions: { userid: number; status: string; timemodified: number }[] }[];
}
interface GradesResponse {
	assignments: { assignmentid: number; grades: { userid: number; grade: string; timemodified: number }[] }[];
}

/**
 * Submission / grading counts for many assignments in one round trip. Counts
 * come from the submissions table, not E3's grading table, which can miss
 * students whose enrolment changed.
 */
export function useGradingProgress(assignments: Assignment[]) {
	const ids = assignments.map(a => a.id);
	return useQuery({
		queryKey: ["teach", "progress", ids],
		enabled: ids.length > 0,
		staleTime: 2 * 60_000,
		queryFn: async () => {
			const [subs, grades, ...lists] = await callMany<unknown>([
				{ fn: "mod_assign_get_submissions", args: { assignmentids: ids } },
				{ fn: "mod_assign_get_grades", args: { assignmentids: ids } },
				...assignments.map(a => ({ fn: "mod_assign_list_participants", args: { assignid: a.id, groupid: 0, filter: "" } }))
			]);
			return assignments.map((a, i): Progress => {
				const submitted = ((subs as SubsResponse | null)?.assignments.find(x => x.assignmentid === a.id)?.submissions ?? []).filter(s => s.status === "submitted");
				const g = new Map(((grades as GradesResponse | null)?.assignments.find(x => x.assignmentid === a.id)?.grades ?? []).map(x => [x.userid, x]));
				const needsGrading = submitted.filter(s => {
					const grade = g.get(s.userid);
					return !grade || Number(grade.grade) < 0 || grade.timemodified < s.timemodified;
				}).length;
				const roster = ((lists[i] as Participant[] | null) ?? []).filter(p => !p.suspended).length;
				return { assignment: a, total: Math.max(roster, submitted.length), submitted: submitted.length, needsGrading };
			});
		}
	});
}

export function setupWarnings(a: Assignment): string[] {
	const out: string[] = [];
	const rules = assignRules(a);
	if (!a.nosubmissions && !rules.fileEnabled && !rules.textEnabled) out.push("沒有開啟任何繳交方式，學生無法繳交");
	if (a.duedate) {
		const d = new Date(a.duedate * 1000);
		if (d.getHours() === 0 && d.getMinutes() === 0) out.push("截止時間是 00:00，學生常誤以為是當天晚上");
	} else if (!a.nosubmissions) out.push("沒有設定截止時間");
	if (a.cutoffdate && a.duedate && a.cutoffdate < a.duedate) out.push("最晚補交時間早於截止時間");
	return out;
}

export function TeachTab({ course }: { course: ParsedCourse }) {
	const ids = useMemo(() => [course.id], [course.id]);
	const assignments = useAssignments(ids);
	const progress = useGradingProgress(assignments.data ?? []);
	const id = String(course.id);

	const inEm3 = [
		{ to: "/courses/$courseId/announce", label: "發公告", desc: "Markdown 或按鈕排版，發布前先預覽", icon: MegaphoneIcon },
		{ to: "/courses/$courseId/write", label: "寫教材", desc: `寫好複製，貼進 ${siteLabel()} 的表單`, icon: NotePencilIcon },
		{ to: "/courses/$courseId/quiz-builder", label: "小考出題", desc: "打題目、匯出 Moodle XML 匯入題庫", icon: ExamIcon }
	] as const;
	const inE3 = [
		{ href: `/course/modedit.php?add=resource&course=${id}&section=0&return=0`, label: "上傳檔案", icon: FilePlusIcon },
		{ href: `/course/modedit.php?add=assign&course=${id}&section=0&return=0`, label: "新增作業", icon: ListChecksIcon },
		{ href: `/course/modedit.php?add=quiz&course=${id}&section=0&return=0`, label: "新增小考", icon: ExamIcon },
		{ href: `/grade/report/grader/index.php?id=${id}`, label: "成績簿", icon: TableIcon },
		{ href: `/user/index.php?id=${id}`, label: "成員", icon: UsersThreeIcon },
		{ href: `/course/view.php?id=${id}`, label: "編輯課程頁（刪除、隱藏、排序）", icon: ChalkboardTeacherIcon }
	];

	return (
		<div className="space-y-8">
			<section>
				<h3 className="mb-3 text-sm font-semibold text-base-content/70">作業評分</h3>
				{assignments.isPending ? (
					<Lines n={3} />
				) : !assignments.data?.length ? (
					<Empty title="這門課沒有作業" />
				) : (
					<ul className="card-quiet divide-y divide-base-content/[0.06] overflow-hidden">
						{(assignments.data ?? []).map(a => {
							const p = progress.data?.find(x => x.assignment.id === a.id);
							const warnings = setupWarnings(a);
							return (
								<li key={a.id}>
									<Link
										data-nav
										to="/courses/$courseId/assign/$cmid/grade"
										params={{ courseId: id, cmid: String(a.cmid) }}
										className="flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-base-content/[0.03]"
									>
										<span className="min-w-0 grow">
											<span className="block truncate font-medium">{a.name}</span>
											<span className="mt-0.5 block text-xs text-base-content/55">{a.duedate ? <Due ts={a.duedate} /> : "沒有截止時間"}</span>
											{warnings.map(w => (
												<span key={w} className="mt-1 flex items-center gap-1 text-xs text-warning">
													<WarningIcon size={12} />
													{w}
												</span>
											))}
										</span>
										{p ? (
											<span className="flex shrink-0 items-center gap-4 text-right text-xs tabular-nums">
												<span>
													<span className="block text-base font-semibold">
														{p.submitted}
														<span className="text-xs font-normal text-base-content/40">/{p.total}</span>
													</span>
													已繳
												</span>
												<span className={p.needsGrading ? "text-warning" : "text-base-content/40"}>
													<span className="block text-base font-semibold">{p.needsGrading}</span>
													待評分
												</span>
											</span>
										) : (
											<span className="skeleton h-8 w-20" />
										)}
										<CaretRightIcon size={16} className="shrink-0 text-base-content/30" />
									</Link>
								</li>
							);
						})}
					</ul>
				)}
			</section>

			<section>
				<h3 className="mb-3 text-sm font-semibold text-base-content/70">在 EM3 做</h3>
				<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
					{inEm3.map(x => (
						<Link key={x.to} to={x.to} params={{ courseId: id }} className="card-quiet flex items-start gap-3 p-4 transition hover:-translate-y-0.5">
							<x.icon size={24} weight="duotone" className="shrink-0 text-primary" />
							<span>
								<span className="block font-medium">{x.label}</span>
								<span className="text-xs text-base-content/55">{x.desc}</span>
							</span>
						</Link>
					))}
				</div>
			</section>

			<section>
				<h3 className="mb-1 text-sm font-semibold text-base-content/70">到 {siteLabel()} 做</h3>
				<p className="mb-3 text-xs text-base-content/50">
					{siteLabel()} 沒有開放這些操作的 API，會在新分頁打開 {siteLabel()} 對應的頁面。
				</p>
				<ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
					{inE3.map(x => (
						<li key={x.href}>
							<a href={e3Link(x.href)} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm hover:bg-base-content/[0.04]">
								<x.icon size={18} className="shrink-0 text-base-content/55" />
								<span className="grow">{x.label}</span>
								<ArrowSquareOutIcon size={14} className="text-base-content/35" />
							</a>
						</li>
					))}
				</ul>
			</section>
		</div>
	);
}
