import { useActiveCourses } from "@/features/assignments/tasks";
import { resolveLook } from "@/features/courses/look";
import { usePrefs } from "@/features/preferences/store";
import { Empty, ErrorNote, Lines, PageTitle } from "@/shared/ui/States";
import { CheckIcon, MegaphoneIcon } from "@phosphor-icons/react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AnnouncementList } from "./AnnouncementList";
import { useAnnouncements } from "./api";

export function AnnouncementsPage() {
	const { course: only } = useSearch({ from: "/app/announcements" });
	const navigate = useNavigate();
	const { active, byId } = useActiveCourses();
	const looks = usePrefs(s => s.courses);
	const seen = usePrefs(s => s.seen);
	const markSeen = usePrefs(s => s.markSeen);
	const [unreadOnly, setUnreadOnly] = useState(false);
	const ids = useMemo(() => active.map(c => c.id), [active]);
	const { data, isPending, error, refetch } = useAnnouncements(ids, { perForum: 30 });

	const all = data ?? [];
	const list = all.filter(a => (!only || a.courseId === only) && (!unreadOnly || !seen[a.discussion]));
	const unread = all.filter(a => !seen[a.discussion]);
	const counts = new Map<number, number>();
	for (const a of unread) counts.set(a.courseId, (counts.get(a.courseId) ?? 0) + 1);

	return (
		<div>
			<PageTitle title="公告" subtitle={`本學期 ${active.length} 門課的公告，新的在上面。未讀狀態只記在這個瀏覽器，不會影響 E3。`}>
				{unread.length > 0 && (
					<button className="btn btn-sm btn-ghost" onClick={() => markSeen(unread.map(a => a.discussion))}>
						<CheckIcon size={15} />
						全部標為已讀
					</button>
				)}
			</PageTitle>

			<div className="mb-5 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
				<button className={`btn btn-sm shrink-0 rounded-full ${!only ? "btn-neutral" : "btn-ghost border-base-content/10"}`} onClick={() => navigate({ to: ".", search: {} })}>
					全部
				</button>
				<button className={`btn btn-sm shrink-0 rounded-full ${unreadOnly ? "btn-neutral" : "btn-ghost border-base-content/10"}`} onClick={() => setUnreadOnly(v => !v)}>
					只看未讀 {unread.length > 0 && <span className="badge badge-xs badge-primary">{unread.length}</span>}
				</button>
				<span className="mx-1 w-px shrink-0 bg-base-content/10" />
				{active.map(c => {
					const look = resolveLook(c, looks[c.id]);
					const on = only === c.id;
					return (
						<button
							key={c.id}
							onClick={() => navigate({ to: ".", search: on ? {} : { course: c.id } })}
							className={`btn btn-sm shrink-0 gap-1.5 rounded-full ${on ? "text-white" : "btn-ghost border-base-content/10"}`}
							style={on ? { backgroundColor: look.color, borderColor: look.color } : undefined}
						>
							{!on && <span className="size-2 rounded-full" style={{ backgroundColor: look.color }} />}
							{look.title}
							{!!counts.get(c.id) && <span className={`text-xs ${on ? "" : "text-primary"}`}>{counts.get(c.id)}</span>}
						</button>
					);
				})}
			</div>

			{error ? (
				<ErrorNote error={error} retry={refetch} />
			) : isPending ? (
				<Lines n={6} />
			) : list.length ? (
				<AnnouncementList items={list} byId={byId} />
			) : (
				<Empty icon={<MegaphoneIcon size={40} weight="duotone" />} title={unreadOnly ? "沒有未讀公告" : "沒有公告"} />
			)}
		</div>
	);
}
