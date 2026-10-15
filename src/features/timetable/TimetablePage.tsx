import { useCourseIndex } from "@/features/courses/api";
import { CourseGlyph, resolveLook } from "@/features/courses/look";
import type { ParsedCourse } from "@/features/courses/parse";
import { usePrefs } from "@/features/preferences/store";
import { PageTitle } from "@/shared/ui/States";
import { ArrowCounterClockwiseIcon, ArrowSquareOutIcon, PaintBrushIcon } from "@phosphor-icons/react";
import { gridArrow } from "@/shared/keyboard/hotkeys";
import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useMemo, useRef, useState } from "react";
import { syllabusUrl } from "./import";
import { classMoment, useNow } from "./now";
import { CORE_PERIODS, DAY_LABELS, dayIndex, formatSlots, parseScheduleCode, PERIODS, periodEndMinutes, periodStartMinutes } from "./periods";

export function TimetablePage() {
	const { currentCourses, current } = useCourseIndex();
	const looks = usePrefs(s => s.courses);
	const timetable = usePrefs(s => s.timetable);
	const setTimetable = usePrefs(s => s.setTimetable);
	const [brush, setBrush] = useState<number | null>(null);
	const now = useNow();
	const moment = classMoment(timetable, now);

	const courses = useMemo(() => currentCourses.filter(c => !looks[c.id]?.hidden), [currentCourses, looks]);
	const byCell = useMemo(() => {
		const m = new Map<string, number>();
		for (const [id, e] of Object.entries(timetable)) for (const s of e.slots) m.set(`${s.day}:${s.period}`, Number(id));
		return m;
	}, [timetable]);

	const usedPeriods = new Set(Object.values(timetable).flatMap(e => e.slots.map(s => s.period)));
	const periods = PERIODS.filter(p => CORE_PERIODS.includes(p) || usedPeriods.has(p.code));
	const weekend = Object.values(timetable).some(e => e.slots.some(s => s.day >= 5));
	const days = weekend ? [0, 1, 2, 3, 4, 5, 6] : [0, 1, 2, 3, 4];
	const today = dayIndex(now);
	const grid = useRef<HTMLTableElement>(null);
	const minute = now.getHours() * 60 + now.getMinutes();

	function toggle(day: number, period: string) {
		const owner = byCell.get(`${day}:${period}`);
		if (owner !== undefined) {
			const e = timetable[owner];
			setTimetable(owner, { ...e, slots: e.slots.filter(s => !(s.day === day && s.period === period)) });
			if (owner === brush || brush === null) return;
		}
		if (brush === null) return;
		const e = timetable[brush] ?? { slots: [] };
		setTimetable(brush, { ...e, slots: [...e.slots, { day, period }] });
	}

	return (
		<div>
			<PageTitle title="課表" subtitle={`${current?.label ?? "本學期"}。設定之後，首頁和側欄會在上課時把那堂課放到最前面。`} />

			<div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_22rem]">
				<section className="card-quiet overflow-x-auto">
					<table ref={grid} onKeyDown={e => gridArrow(e, grid.current)} className="w-full min-w-[34rem] table-fixed border-collapse text-xs" aria-label="每週課表">
						<thead>
							<tr>
								<th className="w-16" />
								{days.map(d => (
									<th key={d} className={`py-2.5 font-medium ${d === today ? "text-primary" : "text-base-content/50"}`}>
										週{DAY_LABELS[d]}
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{periods.map((p, pi) => {
								const nowRow = minute >= periodStartMinutes(p.code) - 10 && minute < periodEndMinutes(p.code);
								return (
									<tr key={p.code} className="border-t hairline">
										<td className={`py-1 pr-2 text-right align-top tabular-nums ${nowRow ? "text-primary" : "text-base-content/45"}`}>
											<span className="block font-semibold">{p.code.toUpperCase()}</span>
											<span className="block text-[0.65rem]">{p.start}</span>
										</td>
										{days.map((d, di) => {
											const id = byCell.get(`${d}:${p.code}`);
											const course = id !== undefined ? currentCourses.find(c => c.id === id) : undefined;
											const look = course ? resolveLook(course, looks[course.id]) : undefined;
											const live = id !== undefined && moment.now?.courseId === id && d === today;
											return (
												<td key={d} className={`h-12 p-0.5 ${d === today ? "bg-primary/[0.03]" : ""}`}>
													<button
														onClick={() => toggle(d, p.code)}
														data-cell={`${pi}:${di}`}
														tabIndex={pi === 0 && di === 0 ? 0 : -1}
														className={`flex size-full items-center justify-center rounded-lg px-1 text-center leading-tight transition ${look ? "" : brush !== null ? "hover:bg-base-content/[0.06]" : ""}`}
														style={
															look
																? { backgroundColor: `color-mix(in oklab, ${look.color} ${live ? 34 : 18}%, transparent)`, color: `color-mix(in oklab, ${look.color} 75%, var(--color-base-content))` }
																: undefined
														}
														aria-label={`週${DAY_LABELS[d]} 第 ${p.code} 節${look ? `：${look.title}` : ""}`}
													>
														{look && <span className="line-clamp-2 font-medium">{look.title}</span>}
													</button>
												</td>
											);
										})}
									</tr>
								);
							})}
						</tbody>
					</table>
				</section>

				<section className="space-y-2">
					<p className="flex items-center gap-1.5 px-1 text-xs text-base-content/55">
						<PaintBrushIcon size={14} />
						三種設定方式：輸入課綱上的時間代碼（例如 R34-EC114）、點 ↗ 打開課綱查、或選一門課當畫筆再點左邊的格子。
					</p>
					{courses.map(c => (
						<CourseScheduleRow key={c.id} course={c} selected={brush === c.id} onSelect={() => setBrush(b => (b === c.id ? null : c.id))} />
					))}
					{!courses.length && (
						<p className="px-1 text-sm text-base-content/50">
							本學期沒有課程，或都被隱藏了。到{" "}
							<Link to="/courses" className="link">
								課程
							</Link>{" "}
							看看。
						</p>
					)}
				</section>
			</div>
		</div>
	);
}

function CourseScheduleRow({ course, selected, onSelect }: { course: ParsedCourse; selected: boolean; onSelect: () => void }) {
	const look = resolveLook(
		course,
		usePrefs(s => s.courses[course.id])
	);
	const entry = usePrefs(s => s.timetable[course.id]);
	const setTimetable = usePrefs(s => s.setTimetable);
	const code = entry ? formatSlots(entry.slots) + (entry.room ? `-${entry.room}` : "") : "";
	const [draft, setDraft] = useState<string | null>(null);
	const syllabus = syllabusUrl(course);

	function commit() {
		if (draft === null) return;
		const parsed = parseScheduleCode(draft);
		setTimetable(course.id, parsed.slots.length ? parsed : null);
		setDraft(null);
	}

	return (
		<motion.div
			layout
			className={`card-quiet flex items-center gap-3 p-2.5 transition ${selected ? "ring-2" : ""}`}
			style={selected ? ({ "--tw-ring-color": look.color } as React.CSSProperties) : undefined}
		>
			<button onClick={onSelect} className="flex min-w-0 grow items-center gap-2.5 text-left" aria-pressed={selected}>
				<CourseGlyph look={look} size="sm" />
				<span className="truncate text-sm font-medium">{look.title}</span>
			</button>
			<input
				className="input input-xs w-28 font-mono uppercase placeholder:normal-case placeholder:font-sans"
				placeholder="例：T34"
				value={draft ?? code}
				onChange={e => setDraft(e.target.value)}
				onBlur={commit}
				onKeyDown={e => e.key === "Enter" && commit()}
				aria-label={`${look.title} 上課時間代碼`}
			/>
			{/* Both slots always render so every row's input lines up. */}
			{syllabus ? (
				<a href={syllabus} target="_blank" rel="noreferrer" className="btn btn-ghost btn-xs btn-square" title="打開課綱查時間" aria-label={`打開${look.title}的課綱`}>
					<ArrowSquareOutIcon size={14} />
				</a>
			) : (
				<span className="size-6 shrink-0" aria-hidden />
			)}
			<button
				className={`btn btn-ghost btn-xs btn-square ${entry ? "" : "invisible"}`}
				onClick={() => setTimetable(course.id, null)}
				aria-label={`清除${look.title}的上課時間`}
				title="清除時間"
				tabIndex={entry ? 0 : -1}
			>
				<ArrowCounterClockwiseIcon size={14} />
			</button>
		</motion.div>
	);
}
