import { TaskRow } from "@/features/assignments/TaskRow";
import { type Task, useTasks } from "@/features/assignments/tasks";
import type { ParsedCourse } from "@/features/courses/parse";
import { Empty, ErrorNote, Lines } from "@/shared/ui/States";
import { ListChecksIcon } from "@phosphor-icons/react";
import { useMemo } from "react";

export function TaskGroups({ tasks, showCourse }: { tasks: Task[]; showCourse: boolean }) {
	const groups = [
		{ label: "要交的", items: tasks.filter(t => t.state === "todo" || t.state === "late") },
		{ label: "還沒開放", items: tasks.filter(t => t.state === "upcoming") },
		{ label: "已完成", items: tasks.filter(t => t.state === "submitted" || t.state === "graded").reverse() },
		{ label: "已關閉・沒交", items: tasks.filter(t => t.state === "closed").reverse() }
	].filter(g => g.items.length);
	return (
		<div className="space-y-6">
			{groups.map(g => (
				<section key={g.label}>
					<h3 className="mb-2 px-1 text-sm font-semibold text-base-content/70">
						{g.label} <span className="font-normal text-base-content/40">{g.items.length}</span>
					</h3>
					<ul className="card-quiet divide-y divide-base-content/[0.06] overflow-hidden">
						{g.items.map(t => (
							<li key={t.key}>
								<TaskRow t={t} showCourse={showCourse} />
							</li>
						))}
					</ul>
				</section>
			))}
		</div>
	);
}

export function CourseTasks({ course }: { course: ParsedCourse }) {
	const scope = useMemo(() => [course], [course]);
	const { tasks, isPending, error, refetch } = useTasks(scope);
	if (error) return <ErrorNote error={error} retry={refetch} />;
	if (isPending) return <Lines n={4} />;
	if (!tasks.length) return <Empty icon={<ListChecksIcon size={40} weight="duotone" />} title="這門課在 E3 上沒有作業或測驗" />;
	return <TaskGroups tasks={tasks} showCourse={false} />;
}
