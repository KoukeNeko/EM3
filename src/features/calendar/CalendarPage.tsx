import { useTasks } from "@/features/assignments/tasks";
import { usePrefs } from "@/features/preferences/store";
import { ErrorNote, PageTitle } from "@/shared/ui/States";
import { CalendarBoard } from "./Board";

export function CalendarPage() {
	const { tasks, error, refetch } = useTasks();
	const showWeekend = usePrefs(s => s.showWeekend);
	const set = usePrefs(s => s.set);
	return (
		<div>
			<PageTitle title="行事曆" subtitle="每個截止時間都標上課程顏色；細線是你課表上的課。">
				<label className="flex cursor-pointer items-center gap-2 text-sm">
					<input type="checkbox" className="toggle toggle-sm" checked={showWeekend} onChange={e => set("showWeekend", e.target.checked)} />
					顯示週末
				</label>
			</PageTitle>
			{error ? <ErrorNote error={error} retry={refetch} /> : <CalendarBoard tasks={tasks} compact spanKey="calendarPageSpan" />}
		</div>
	);
}
