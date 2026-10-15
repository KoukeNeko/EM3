import { useForums } from "@/features/announcements/api";
import { FileIcon } from "@/features/course/FileIcon";
import { useCourseIndex } from "@/features/courses/api";
import { useCourseLook } from "@/features/courses/look";
import { call, uploadToDraft } from "@/lib/moodle/client";
import { cleanHtml, fileExt, humanSize } from "@/lib/moodle/files";
import { MarkdownEditor, markdownToHtml } from "@/shared/editor/MarkdownEditor";
import { MOD_LABEL, useHotkeys } from "@/shared/keyboard/hotkeys";
import { CourseTag } from "@/shared/ui/CourseTag";
import { ErrorNote, Lines } from "@/shared/ui/States";
import { ArrowLeftIcon, CloudArrowUpIcon, EyeIcon, PushPinIcon, TrashIcon } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams, useRouter } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";

const DRAFT_KEY = (id: string) => `em3:announce-draft:${id}`;

export function AnnouncePage() {
	const { courseId } = useParams({ from: "/app/courses/$courseId/announce" });
	const router = useRouter();
	const navigate = useNavigate();
	const qc = useQueryClient();
	const { byId } = useCourseIndex();
	const course = byId.get(Number(courseId));
	const look = useCourseLook(course);
	const ids = useMemo(() => [Number(courseId)], [courseId]);
	const forums = useForums(ids);
	const news = forums.data?.find(f => f.type === "news");

	// Drafts survive accidental navigation; they live only in this browser.
	const [subject, setSubject] = useState(() => readDraft(courseId).subject);
	const [body, setBody] = useState(() => readDraft(courseId).body);
	const [pinned, setPinned] = useState(false);
	const [files, setFiles] = useState<File[]>([]);
	const [confirm, setConfirm] = useState(false);
	const [posting, setPosting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const input = useRef<HTMLInputElement>(null);
	const dialog = useRef<HTMLDialogElement>(null);

	useEffect(() => {
		try {
			localStorage.setItem(DRAFT_KEY(courseId), JSON.stringify({ subject, body }));
		} catch {
			/* storage may be unavailable */
		}
	}, [courseId, subject, body]);
	useEffect(() => {
		const d = dialog.current;
		if (confirm && d && !d.open) d.showModal();
		if (!confirm && d?.open) d.close();
	}, [confirm]);

	const ready = subject.trim() && body.trim() && news;
	useHotkeys([{ keys: "mod+enter", run: () => ready && setConfirm(true), inInput: true }]);

	async function post() {
		if (!news) return;
		setPosting(true);
		setError(null);
		try {
			const options: { name: string; value: string }[] = [{ name: "discussionpinned", value: pinned ? "1" : "0" }];
			if (files.length) options.push({ name: "attachmentsid", value: String(await uploadToDraft(files)) });
			const res = await call<{ discussionid: number }>("mod_forum_add_discussion", { forumid: news.id, subject: subject.trim(), message: markdownToHtml(body), options });
			localStorage.removeItem(DRAFT_KEY(courseId));
			void qc.invalidateQueries({ queryKey: ["announcements"] });
			await navigate({ to: "/courses/$courseId/discussion/$discussionId", params: { courseId, discussionId: String(res.discussionid) } });
		} catch (e) {
			setError(e instanceof Error ? e.message : String(e));
			setConfirm(false);
		} finally {
			setPosting(false);
		}
	}

	if (forums.error) return <ErrorNote error={forums.error} retry={forums.refetch} />;
	if (forums.isPending) return <Lines n={4} />;

	return (
		<div className="mx-auto max-w-3xl">
			<button onClick={() => router.history.back()} className="btn btn-ghost btn-sm mb-4 -ml-2">
				<ArrowLeftIcon size={16} />
				返回
			</button>
			<header className="mb-6">
				{course && <CourseTag course={course} link />}
				<h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">發布公告</h1>
				<p className="mt-1 text-sm text-base-content/55">會發到「{news?.name ?? "公告"}」，全班看得到。E3 依學生自己的通知設定寄信，沒辦法從這裡排程或指定立即寄出。</p>
			</header>
			{!news && <div className="alert alert-soft alert-warning mb-4">這門課沒有公告區，或你沒有權限在公告區發文。</div>}

			<div className="space-y-4">
				<input className="input input-lg w-full" placeholder="標題" value={subject} onChange={e => setSubject(e.target.value)} aria-label="公告標題" autoFocus />
				<MarkdownEditor value={body} onChange={setBody} placeholder="公告內容。可以用上方按鈕排版，也可以直接寫 Markdown。" minHeight="14rem" label="公告內容" />

				<div className="flex flex-wrap items-center gap-3">
					<button className="btn btn-sm" onClick={() => input.current?.click()}>
						<CloudArrowUpIcon size={16} />
						附加檔案
					</button>
					<input ref={input} type="file" multiple hidden onChange={e => e.target.files && (setFiles(f => [...f, ...Array.from(e.target.files!)]), (e.target.value = ""))} />
					<label className="flex cursor-pointer items-center gap-2 text-sm">
						<input type="checkbox" className="toggle toggle-sm" checked={pinned} onChange={e => setPinned(e.target.checked)} />
						<PushPinIcon size={15} />
						置頂
					</label>
				</div>
				{files.length > 0 && (
					<ul className="space-y-1 text-sm">
						{files.map(f => (
							<li key={f.name + f.size} className="flex items-center gap-2">
								<FileIcon ext={fileExt(f.name)} size={18} />
								<span className="min-w-0 grow truncate">{f.name}</span>
								<span className="text-xs text-base-content/45">{humanSize(f.size)}</span>
								<button className="btn btn-ghost btn-xs btn-square" onClick={() => setFiles(x => x.filter(y => y !== f))} aria-label={`移除 ${f.name}`}>
									<TrashIcon size={13} />
								</button>
							</li>
						))}
					</ul>
				)}
				{error && <p className="text-sm text-error">發布失敗：{error}</p>}
				<div className="flex justify-end gap-2">
					<button className="btn btn-primary" disabled={!ready} onClick={() => setConfirm(true)}>
						<EyeIcon size={16} />
						預覽並發布
						<kbd className="kbd kbd-xs border-primary-content/30 bg-transparent text-primary-content/70">{MOD_LABEL}↵</kbd>
					</button>
				</div>
			</div>

			<dialog ref={dialog} className="modal modal-bottom sm:modal-middle" onClose={() => setConfirm(false)}>
				<div className="modal-box max-w-2xl">
					<p className="text-xs text-base-content/50">學生會看到：</p>
					<div className="mt-2 rounded-box border hairline p-5">
						<p className="flex items-center gap-2 text-xs">
							<span className="size-2 rounded-full" style={{ backgroundColor: look?.color }} />
							{look?.title}
							{pinned && <PushPinIcon size={12} weight="fill" className="text-warning" />}
						</p>
						<h3 className="mt-1 text-xl font-semibold">{subject}</h3>
						<div className="prose-e3 mt-3" dangerouslySetInnerHTML={{ __html: cleanHtml(markdownToHtml(body)) }} />
						{files.length > 0 && <p className="mt-3 text-xs text-base-content/55">附件：{files.map(f => f.name).join("、")}</p>}
					</div>
					<div className="modal-action">
						<button className="btn btn-ghost" onClick={() => setConfirm(false)}>
							再改改
						</button>
						<button className="btn btn-primary" disabled={posting} onClick={() => void post()}>
							{posting ? <span className="loading loading-spinner loading-sm" /> : "確定發布"}
						</button>
					</div>
				</div>
				<form method="dialog" className="modal-backdrop">
					<button>close</button>
				</form>
			</dialog>
		</div>
	);
}

function readDraft(courseId: string): { subject: string; body: string } {
	try {
		return { subject: "", body: "", ...JSON.parse(localStorage.getItem(DRAFT_KEY(courseId)) ?? "{}") };
	} catch {
		return { subject: "", body: "" };
	}
}
