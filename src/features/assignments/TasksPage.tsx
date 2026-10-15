import { TaskGroups } from "@/features/course/CourseTasks";
import { Empty, ErrorNote, Lines, PageTitle } from "@/shared/ui/States";
import { ConfettiIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { isOpenTask, useTasks } from "./tasks";

export function TasksPage() {
	const { tasks, isPending, error, refetch } = useTasks();
	const [showDone, setShowDone] = useState(false);
	const open = tasks.filter(isOpenTask);
	const list = showDone ? tasks : tasks.filter(t => t.state !== "submitted" && t.state !== "graded" && t.state !== "closed");

	return (
		<div>
			<PageTitle title="待辦" subtitle={isPending ? "整理中…" : open.length ? `本學期還有 ${open.length} 份作業或測驗要完成` : "本學期目前沒有要交的東西"}>
				<label className="flex cursor-pointer items-center gap-2 text-sm">
					<input type="checkbox" className="toggle toggle-sm" checked={showDone} onChange={e => setShowDone(e.target.checked)} />
					顯示已完成
				</label>
			</PageTitle>
			{error ? (
				<ErrorNote error={error} retry={refetch} />
			) : isPending ? (
				<Lines n={6} />
			) : list.length ? (
				<TaskGroups tasks={list} showCourse />
			) : (
				<Empty icon={<ConfettiIcon size={44} weight="duotone" />} title="全部完成了">
					打開「顯示已完成」可以看交過的作業。
				</Empty>
			)}
		</div>
	);
}
