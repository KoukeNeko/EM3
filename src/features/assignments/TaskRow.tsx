import { TASK_STATE_LABEL, submissionFiles } from "@/features/assignments/api";
import type { Task } from "@/features/assignments/tasks";
import { TaskAnchor } from "@/features/calendar/Board";
import { useCourseLook } from "@/features/courses/look";
import { countdown } from "@/lib/time/relative";
import { CourseTag } from "@/shared/ui/CourseTag";
import { Due } from "@/shared/ui/Time";
import { CaretRightIcon, CheckCircleIcon, ExamIcon, LightningIcon, PaperclipIcon } from "@phosphor-icons/react";
import { siteLabel } from "@/lib/moodle/files";

const STATE_TONE: Record<Task["state"], string> = {
	upcoming: "badge-ghost",
	todo: "badge-info",
	late: "badge-error",
	closed: "badge-ghost",
	submitted: "badge-success",
	graded: "badge-success"
};

export function TaskRow({ t, showCourse = true }: { t: Task; showCourse?: boolean }) {
	const look = useCourseLook(t.course)!;
	const open = t.state === "todo" || t.state === "late";
	const cd = t.due ? countdown(t.due) : null;
	const files = submissionFiles(t.status).length;
	const body = (
		<>
			<span className="grid size-10 shrink-0 place-items-center rounded-xl" style={{ backgroundColor: `color-mix(in oklab, ${look.color} 14%, transparent)`, color: look.color }}>
				{t.state === "submitted" || t.state === "graded" ? (
					<CheckCircleIcon size={22} weight="fill" />
				) : t.kind === "quiz" ? (
					<ExamIcon size={22} weight="duotone" />
				) : (
					<PaperclipIcon size={22} weight="duotone" />
				)}
			</span>
			<span className="min-w-0 grow">
				<span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
					<span className="truncate font-medium">{t.name}</span>
					{t.inClass && open && (
						<span className="badge badge-xs badge-warning badge-soft gap-0.5">
							<LightningIcon size={10} weight="fill" />
							課堂
						</span>
					)}
				</span>
				<span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-base-content/55">
					{showCourse && <CourseTag course={t.course} />}
					{t.due ? <Due ts={t.due} /> : <span>沒有截止日</span>}
					{files > 0 && <span>· 已上傳 {files} 個檔案</span>}
					{t.kind === "quiz" && <span>· 測驗（在 {siteLabel()} 作答）</span>}
				</span>
			</span>
			<span className="flex shrink-0 flex-col items-end gap-1">
				<span className={`badge badge-sm badge-soft ${STATE_TONE[t.state]}`}>{t.kind === "quiz" && t.state === "submitted" ? "已作答" : TASK_STATE_LABEL[t.state]}</span>
				{open && cd && <span className={`text-xs tabular-nums ${cd.urgency === "critical" || cd.urgency === "overdue" ? "text-error" : "text-base-content/50"}`}>{cd.text}</span>}
			</span>
			<CaretRightIcon size={16} className="shrink-0 text-base-content/30" />
		</>
	);
	return (
		<TaskAnchor t={t} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-base-content/[0.03]">
			{body}
		</TaskAnchor>
	);
}
