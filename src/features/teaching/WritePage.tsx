import { useCourseIndex } from "@/features/courses/api";
import { cleanHtml, e3Link, siteLabel } from "@/lib/moodle/files";
import { MarkdownEditor, markdownToHtml } from "@/shared/editor/MarkdownEditor";
import { CourseTag } from "@/shared/ui/CourseTag";
import { ArrowLeftIcon, ArrowSquareOutIcon, CheckIcon, CopyIcon } from "@phosphor-icons/react";
import { useParams, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";

// E3 has no API to create or edit pages, labels or activity descriptions.
// So EM3 is the writing desk: write in Markdown (or with buttons), copy it as
// rich text, and paste it into the E3 form that opens next to it.

const TARGETS = [
	{ key: "page", label: "線上編輯文件（Page）", hint: "貼到「頁面內容」欄", path: (c: string) => `/course/modedit.php?add=page&course=${c}&section=0&return=0` },
	{ key: "label", label: "課程頁上的說明文字（Label）", hint: "貼到「說明文字」欄", path: (c: string) => `/course/modedit.php?add=label&course=${c}&section=0&return=0` },
	{ key: "assign", label: "新作業的說明", hint: "貼到「說明」欄", path: (c: string) => `/course/modedit.php?add=assign&course=${c}&section=0&return=0` },
	{ key: "resource", label: "上傳檔案（附說明）", hint: "貼到「說明」欄，再拖入檔案", path: (c: string) => `/course/modedit.php?add=resource&course=${c}&section=0&return=0` }
] as const;

const KEY = (id: string) => `em3:write-draft:${id}`;

export function WritePage() {
	const { courseId } = useParams({ from: "/app/courses/$courseId/write" });
	const router = useRouter();
	const course = useCourseIndex().byId.get(Number(courseId));
	const [md, setMd] = useState(() => {
		try {
			return localStorage.getItem(KEY(courseId)) ?? "";
		} catch {
			return "";
		}
	});
	const [copied, setCopied] = useState(false);
	useEffect(() => {
		try {
			localStorage.setItem(KEY(courseId), md);
		} catch {
			/* ignore */
		}
		setCopied(false);
	}, [courseId, md]);

	const html = markdownToHtml(md);

	async function copy() {
		// Rich text for E3's TinyMCE editor, plain HTML as a fallback for its source view.
		await navigator.clipboard.write([new ClipboardItem({ "text/html": new Blob([html], { type: "text/html" }), "text/plain": new Blob([html], { type: "text/plain" }) })]);
		setCopied(true);
	}

	return (
		<div className="mx-auto max-w-6xl">
			<button onClick={() => router.history.back()} className="btn btn-ghost btn-sm mb-4 -ml-2">
				<ArrowLeftIcon size={16} />
				返回
			</button>
			<header className="mb-6">
				{course && <CourseTag course={course} link />}
				<h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">寫教材</h1>
				<p className="mt-1 max-w-2xl text-sm text-base-content/55">
					{siteLabel()} 沒有開放新增教材的 API，所以這裡是寫字的地方：用按鈕排版或直接寫 Markdown，按「複製」後在 {siteLabel()} 的表單貼上。程式碼、表格、數學式（$…$）都會保留。草稿存在這個瀏覽器。
				</p>
			</header>
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_20rem]">
				<MarkdownEditor
					value={md}
					onChange={setMd}
					placeholder="# 第 3 週：Hooks&#10;&#10;今天要做……"
					minHeight="24rem"
					label="教材內容"
					autoFocus
				/>
				<aside className="card-quiet space-y-4 self-start p-4 lg:sticky lg:top-6">
					<button className="btn btn-primary w-full" disabled={!md.trim()} onClick={() => void copy()}>
						{copied ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
						{copied ? `已複製，去 ${siteLabel()} 貼上` : `複製（可直接貼進 ${siteLabel()}）`}
					</button>
					<div>
						<p className="mb-2 text-xs font-semibold text-base-content/50">貼到哪裡</p>
						<ul className="space-y-1">
							{TARGETS.map(t => (
								<li key={t.key}>
									<a href={e3Link(t.path(courseId))} target="_blank" rel="noreferrer" className="flex items-start gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-base-content/[0.04]">
										<ArrowSquareOutIcon size={15} className="mt-0.5 shrink-0 text-base-content/45" />
										<span>
											{t.label}
											<span className="block text-xs text-base-content/45">{t.hint}</span>
										</span>
									</a>
								</li>
							))}
						</ul>
					</div>
					<details className="text-sm">
						<summary className="cursor-pointer text-base-content/55">預覽在 {siteLabel()} 的樣子</summary>
						<div className="prose-e3 mt-2 max-h-80 overflow-auto rounded-lg bg-base-200 p-3" dangerouslySetInnerHTML={{ __html: cleanHtml(html) }} />
					</details>
				</aside>
			</div>
		</div>
	);
}
