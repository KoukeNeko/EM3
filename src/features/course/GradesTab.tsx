import { useSession } from "@/features/auth/session";
import type { ParsedCourse } from "@/features/courses/parse";
import { call } from "@/lib/moodle/client";
import { cleanHtml } from "@/lib/moodle/files";
import { Empty, ErrorNote, Lines } from "@/shared/ui/States";
import { ChartBarIcon, ChatTextIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

interface GradeItem {
	id: number;
	itemname: string | null;
	itemtype: "mod" | "manual" | "course" | "category";
	itemmodule: string | null;
	cmid?: number;
	gradeformatted: string;
	rangeformatted: string;
	percentageformatted: string;
	feedback: string;
	gradeishidden: boolean;
	gradedategraded: number | null;
}

const decode = (s: string) => new DOMParser().parseFromString(s, "text/html").body.textContent ?? s;
const empty = (s: string | undefined) => !s || s.trim() === "-" || s.trim() === "";

export function GradesTab({ course }: { course: ParsedCourse }) {
	const userid = useSession(s => s.userid)!;
	const { data, isPending, error, refetch } = useQuery({
		queryKey: ["grades", course.id],
		staleTime: 5 * 60_000,
		queryFn: async () => (await call<{ usergrades: { gradeitems: GradeItem[] }[] }>("gradereport_user_get_grade_items", { courseid: course.id, userid })).usergrades[0]?.gradeitems ?? []
	});

	if (error) return <ErrorNote error={error} retry={refetch} />;
	if (isPending) return <Lines n={5} />;
	const items = (data ?? []).filter(i => i.itemtype !== "category" && !i.gradeishidden);
	const total = items.find(i => i.itemtype === "course");
	const rows = items.filter(i => i.itemtype !== "course");
	const released = rows.filter(i => !empty(i.gradeformatted)).length;
	if (!rows.length) return <Empty icon={<ChartBarIcon size={40} weight="duotone" />} title="老師還沒有建立成績項目" />;

	return (
		<div className="space-y-4">
			<div className="flex flex-wrap gap-3">
				<div className="card-quiet min-w-40 grow px-4 py-3 sm:grow-0">
					<p className="text-xs text-base-content/50">已公布</p>
					<p className="text-2xl font-semibold tabular-nums">
						{released}
						<span className="text-base font-normal text-base-content/40"> / {rows.length}</span>
					</p>
				</div>
				{total && !empty(total.gradeformatted) && (
					<div className="card-quiet min-w-40 grow px-4 py-3 sm:grow-0">
						<p className="text-xs text-base-content/50">目前總分</p>
						<p className="text-2xl font-semibold tabular-nums">{decode(total.gradeformatted)}</p>
					</div>
				)}
			</div>
			<ul className="card-quiet divide-y divide-base-content/[0.06] overflow-hidden">
				{rows.map(i => {
					const has = !empty(i.gradeformatted);
					return (
						<li key={i.id} className="px-4 py-3">
							<div className="flex items-center gap-3">
								<div className="min-w-0 grow">
									{(i.itemmodule === "assign" || i.itemmodule === "quiz") && i.cmid ? (
										<Link
											to={i.itemmodule === "quiz" ? "/courses/$courseId/quiz/$cmid" : "/courses/$courseId/assign/$cmid"}
											params={{ courseId: String(course.id), cmid: String(i.cmid) }}
											className="truncate font-medium hover:underline"
										>
											{i.itemname}
										</Link>
									) : (
										<p className="truncate font-medium">{i.itemname ?? "（未命名）"}</p>
									)}
									<p className="text-xs text-base-content/45">範圍 {decode(i.rangeformatted)}</p>
								</div>
								<div className="text-right">
									<p className={`text-lg font-semibold tabular-nums ${has ? "" : "text-base-content/30"}`}>{has ? decode(i.gradeformatted) : "未公布"}</p>
									{has && !empty(i.percentageformatted) && <p className="text-xs text-base-content/45 tabular-nums">{decode(i.percentageformatted)}</p>}
								</div>
							</div>
							{i.feedback && (
								<div className="mt-2 flex gap-2 rounded-lg bg-base-200 p-3 text-sm">
									<ChatTextIcon size={16} className="mt-0.5 shrink-0 text-base-content/40" />
									<div className="prose-e3 min-w-0" dangerouslySetInnerHTML={{ __html: cleanHtml(i.feedback) }} />
								</div>
							)}
						</li>
					);
				})}
			</ul>
		</div>
	);
}
