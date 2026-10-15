import { usePrefs } from "@/features/preferences/store";
import { ArrowCounterClockwiseIcon, EyeSlashIcon, PushPinIcon } from "@phosphor-icons/react";
import { useEffect, useRef } from "react";
import { COURSE_COLORS, COURSE_ICONS, CourseGlyph, defaultColor, defaultIcon, useCourseLook } from "./look";
import type { ParsedCourse } from "./parse";

/** Per-course colour, icon, nickname, pin and hide — all stored locally. */
export function AppearanceDialog({ course, open, onClose }: { course: ParsedCourse; open: boolean; onClose: () => void }) {
	const ref = useRef<HTMLDialogElement>(null);
	const look = useCourseLook(course)!;
	const setCourse = usePrefs(s => s.setCourse);
	const raw = usePrefs(s => s.courses[course.id]);
	const patch = (p: Parameters<typeof setCourse>[1]) => setCourse(course.id, p);

	useEffect(() => {
		const d = ref.current;
		if (!d) return;
		if (open && !d.open) d.showModal();
		if (!open && d.open) d.close();
	}, [open]);

	return (
		<dialog ref={ref} className="modal modal-bottom sm:modal-middle" onClose={onClose}>
			<div className="modal-box max-w-md">
				<div className="mb-5 flex items-center gap-3">
					<CourseGlyph look={look} size="lg" />
					<div className="min-w-0">
						<h3 className="truncate text-lg font-semibold">{look.title}</h3>
						<p className="truncate text-sm text-base-content/55">{course.nameEn ?? course.raw.shortname}</p>
					</div>
				</div>

				<fieldset className="fieldset">
					<legend className="fieldset-legend">顯示名稱</legend>
					<input className="input w-full" placeholder={course.name} value={raw?.nickname ?? ""} onChange={e => patch({ nickname: e.target.value })} />
					<p className="label">例如把「多媒體與人機互動總整與實作」簡稱成「HCI」。</p>
				</fieldset>

				<fieldset className="fieldset mt-2">
					<legend className="fieldset-legend">顏色</legend>
					<div className="flex flex-wrap gap-2">
						{COURSE_COLORS.map(c => (
							<button
								key={c}
								onClick={() => patch({ color: c })}
								className={`size-8 rounded-full transition ${look.color === c ? "scale-110 ring-2 ring-base-content ring-offset-2 ring-offset-base-100" : "hover:scale-110"}`}
								style={{ backgroundColor: c }}
								aria-label={`顏色 ${c}`}
							/>
						))}
						<label
							className="relative size-8 cursor-pointer overflow-hidden rounded-full border hairline"
							title="自訂顏色"
							style={{ background: "conic-gradient(red, yellow, lime, aqua, blue, magenta, red)" }}
						>
							<input type="color" className="absolute inset-0 cursor-pointer opacity-0" value={look.color} onChange={e => patch({ color: e.target.value })} />
						</label>
					</div>
				</fieldset>

				<fieldset className="fieldset mt-2">
					<legend className="fieldset-legend">圖示</legend>
					<div className="grid grid-cols-8 gap-1.5">
						{Object.entries(COURSE_ICONS).map(([key, Icon]) => (
							<button
								key={key}
								onClick={() => patch({ icon: key })}
								className={`grid aspect-square place-items-center rounded-lg transition ${look.icon === key ? "text-base-100" : "hover:bg-base-content/[0.06]"}`}
								style={look.icon === key ? { backgroundColor: look.color } : undefined}
								aria-label={key}
								aria-pressed={look.icon === key}
							>
								<Icon size={20} weight="duotone" />
							</button>
						))}
					</div>
				</fieldset>

				<div className="mt-4 flex flex-col gap-2">
					<label className="flex cursor-pointer items-center gap-3 text-sm">
						<PushPinIcon size={18} />
						<span className="grow">置頂在側欄與課程列表</span>
						<input type="checkbox" className="toggle toggle-sm" checked={look.pinned} onChange={e => patch({ pinned: e.target.checked })} />
					</label>
					<label className="flex cursor-pointer items-center gap-3 text-sm">
						<EyeSlashIcon size={18} />
						<span className="grow">在 EM3 隱藏這門課（不影響 E3）</span>
						<input type="checkbox" className="toggle toggle-sm" checked={look.hidden} onChange={e => patch({ hidden: e.target.checked })} />
					</label>
				</div>

				<div className="modal-action">
					<button
						className="btn btn-ghost"
						onClick={() => patch({ color: undefined, icon: undefined, nickname: undefined })}
						disabled={look.color === defaultColor(course.id) && look.icon === defaultIcon(course) && !raw?.nickname}
					>
						<ArrowCounterClockwiseIcon size={16} />
						還原
					</button>
					<button className="btn btn-neutral" onClick={onClose}>
						完成
					</button>
				</div>
			</div>
			<form method="dialog" className="modal-backdrop">
				<button>close</button>
			</form>
		</dialog>
	);
}
