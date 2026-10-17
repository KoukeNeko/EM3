import { useCourseContents } from "@/features/courses/api";
import type { ParsedCourse } from "@/features/courses/parse";
import { useCourseLook } from "@/features/courses/look";
import { saveBlob, safeName } from "@/lib/download";
import { cleanHtml, fileUrl, humanSize } from "@/lib/moodle/files";
import { Empty, ErrorNote, Lines } from "@/shared/ui/States";
import { Ago } from "@/shared/ui/Time";
import {
	ArrowSquareOutIcon,
	CheckSquareIcon,
	DownloadSimpleIcon,
	FilesIcon,
	FolderSimpleIcon,
	LinkSimpleIcon,
	MagnifyingGlassIcon,
	PlayCircleIcon,
	SortAscendingIcon,
	SortDescendingIcon,
	WarningIcon
} from "@phosphor-icons/react";
import { motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { FileIcon } from "./FileIcon";
import { openFile } from "./FilePreview";
import {
	buildMaterialsZip,
	canStreamToDisk,
	LARGE_ZIP,
	type Material,
	type MaterialFile,
	materialsFrom,
	type PickedFile,
	streamMaterialsZip,
	useFolderIntros,
	ZIP_LIMIT,
	type ZipProgress
} from "./materials";

const WEEK = 7 * 86400;

/** Batch selection state handed to rows; rows get null when not selecting. */
interface Selection {
	picked: Set<string>;
	toggle: (keys: string[], on: boolean) => void;
}

export function MaterialsTab({ course }: { course: ParsedCourse }) {
	const { data, isPending, error, refetch } = useCourseContents(course.id);
	const intros = useFolderIntros(course.id);
	const [q, setQ] = useState("");
	const [newestFirst, setNewestFirst] = useState(true);
	const [selecting, setSelecting] = useState(false);
	const [picked, setPicked] = useState<Set<string>>(new Set());
	const toggle = (keys: string[], on: boolean) =>
		setPicked(prev => {
			const next = new Set(prev);
			for (const k of keys) on ? next.add(k) : next.delete(k);
			return next;
		});
	const selection: Selection | null = selecting ? { picked, toggle } : null;
	const stopSelecting = () => {
		setSelecting(false);
		setPicked(new Set());
	};

	const materials = useMemo(() => materialsFrom(data ?? []), [data]);
	// Only honour sections when the teacher actually uses them (most E3 courses dump everything in 「一般」).
	const usesSections = useMemo(() => new Set(materials.map(m => m.section.id)).size > 1, [materials]);

	const filtered = useMemo(() => {
		const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
		const match = (s: string) => terms.every(t => s.toLowerCase().includes(t));
		const list = terms.length ? materials.map(m => (match(m.title) ? m : { ...m, files: m.files.filter(f => match(f.name)) })).filter(m => match(m.title) || m.files.length) : materials;
		return newestFirst ? [...list].sort((a, b) => b.time - a.time) : list;
	}, [materials, q, newestFirst]);

	if (error) return <ErrorNote error={error} retry={refetch} />;
	if (isPending) return <Lines n={5} />;
	if (!materials.length) return <Empty icon={<FilesIcon size={40} weight="duotone" />} title="這門課還沒有教材" />;

	const groups: { title: string | null; items: Material[] }[] =
		usesSections && !newestFirst && !q
			? Object.values(
					filtered.reduce<Record<number, { title: string; items: Material[] }>>((acc, m) => {
						(acc[m.section.id] ??= { title: m.section.name, items: [] }).items.push(m);
						return acc;
					}, {})
				)
			: [{ title: null, items: filtered }];

	const fileCount = materials.reduce((n, m) => n + m.files.length, 0);
	const visibleKeys = filtered.flatMap(m => m.files.map(f => f.key));

	return (
		<div className="space-y-5">
			<div className="flex flex-wrap items-center gap-2">
				<label className="input input-sm min-w-0 grow sm:max-w-xs">
					<MagnifyingGlassIcon size={15} className="opacity-50" />
					<input data-search type="search" placeholder={`搜尋 ${fileCount} 個檔案`} value={q} onChange={e => setQ(e.target.value)} />
				</label>
				<button className="btn btn-sm btn-ghost" onClick={() => setNewestFirst(v => !v)}>
					{newestFirst ? <SortDescendingIcon size={16} /> : <SortAscendingIcon size={16} />}
					{newestFirst ? "最新的在上面" : usesSections ? "依週次 / 單元" : "老師排的順序"}
				</button>
				{fileCount > 1 && (
					<button className={`btn btn-sm ${selecting ? "btn-active" : "btn-ghost"}`} aria-pressed={selecting} onClick={() => (selecting ? stopSelecting() : setSelecting(true))}>
						<CheckSquareIcon size={16} />
						選取
					</button>
				)}
			</div>

			{groups.map((g, gi) => (
				<section key={g.title ?? gi}>
					{g.title && <h3 className="mb-2 px-1 text-sm font-semibold text-base-content/70">{g.title}</h3>}
					<motion.ul className="card-quiet divide-y divide-base-content/[0.06] overflow-hidden" initial="i" animate="a" variants={{ a: { transition: { staggerChildren: 0.025 } } }}>
						{g.items.map(m => (
							<motion.li key={m.key} variants={{ i: { opacity: 0, y: 6 }, a: { opacity: 1, y: 0 } }}>
								<MaterialRow m={m} intro={intros.data?.get(m.cmid)?.intro} selection={selection} />
							</motion.li>
						))}
					</motion.ul>
				</section>
			))}
			{!filtered.length && <Empty title={`找不到「${q}」`} />}
			{selecting && <SelectionBar course={course} materials={materials} picked={picked} visibleKeys={visibleKeys} toggle={toggle} onDone={stopSelecting} />}
		</div>
	);
}

function MaterialRow({ m, intro, selection }: { m: Material; intro?: string; selection: Selection | null }) {
	const isNew = (t: number) => Date.now() / 1000 - t < WEEK;

	// A folder with exactly one file is just a file: show the file, keep the folder name as context.
	if (m.files.length === 1) return <FileRow f={m.files[0]} context={m.files[0].name.replace(/\.[^.]+$/, "") === m.title ? undefined : m.title} isNew={isNew(m.files[0].time)} selection={selection} />;

	if (m.kind === "url" || m.kind === "video" || m.kind === "page" || (!m.files.length && m.href)) {
		const Icon = m.kind === "url" ? LinkSimpleIcon : m.kind === "video" ? PlayCircleIcon : ArrowSquareOutIcon;
		return (
			<a data-nav href={m.href} target="_blank" rel="noreferrer" className="flex items-center gap-3 px-4 py-3 hover:bg-base-content/[0.03]">
				<Icon size={22} weight="duotone" className="shrink-0 text-info" />
				<span className="min-w-0 grow">
					<span className="block truncate text-sm font-medium">{m.title}</span>
					<span className="block truncate text-xs text-base-content/50">{m.kind === "url" ? m.href : m.kind === "video" ? "在 Moodle 播放影片" : "在 Moodle 開啟"}</span>
				</span>
				<ArrowSquareOutIcon size={16} className="shrink-0 opacity-40" />
			</a>
		);
	}

	return (
		<div className="px-4 py-3">
			<div className="flex items-center gap-3">
				{selection && m.files.length > 0 && <FolderCheck files={m.files} selection={selection} />}
				<FolderSimpleIcon size={22} weight="duotone" className="shrink-0 text-base-content/40" />
				<span className="min-w-0 grow truncate text-sm font-semibold">{m.title}</span>
				{m.time > 0 && <Ago ts={m.time} className="shrink-0 text-xs text-base-content/45" />}
			</div>
			{intro && <FolderIntro html={intro} />}
			{m.files.length > 0 && (
				<ul className="mt-1 ml-3 border-l hairline pl-3">
					{m.files.map(f => (
						<li key={f.key}>
							<FileRow f={f} isNew={isNew(f.time)} compact selection={selection} />
						</li>
					))}
				</ul>
			)}
			{!intro && !m.files.length && <p className="mt-1 ml-9 text-xs text-base-content/45">這個資料夾目前是空的</p>}
		</div>
	);
}

function FolderIntro({ html }: { html: string }) {
	const clean = useMemo(() => cleanHtml(html), [html]);
	if (!clean.replace(/<[^>]+>/g, "").trim() && !/<(img|video|iframe)/.test(clean)) return null;
	return <div className="prose-e3 mt-1 ml-9 text-sm text-base-content/75" dangerouslySetInnerHTML={{ __html: clean }} />;
}

function FolderCheck({ files, selection }: { files: MaterialFile[]; selection: Selection }) {
	const ref = useRef<HTMLInputElement>(null);
	const n = files.filter(f => selection.picked.has(f.key)).length;
	useEffect(() => {
		if (ref.current) ref.current.indeterminate = n > 0 && n < files.length;
	}, [n, files.length]);
	return (
		<input
			ref={ref}
			type="checkbox"
			className="checkbox checkbox-sm checkbox-primary shrink-0"
			checked={n === files.length}
			onChange={e =>
				selection.toggle(
					files.map(f => f.key),
					e.target.checked
				)
			}
			aria-label="選取整個資料夾"
		/>
	);
}

function FileRow({ f, context, isNew, compact = false, selection }: { f: MaterialFile; context?: string; isNew: boolean; compact?: boolean; selection: Selection | null }) {
	const checked = !!selection?.picked.has(f.key);
	const info = (
		<>
			<FileIcon ext={f.ext} size={compact ? 22 : 28} />
			<span className="min-w-0 grow">
				<span className="flex items-center gap-2">
					<span className="truncate text-sm font-medium" title={f.name}>
						{f.name}
					</span>
					{isNew && <span className="badge badge-xs badge-primary badge-soft shrink-0">NEW</span>}
				</span>
				<span className="block truncate text-xs text-base-content/50">
					{context && <>{context} · </>}
					<Ago ts={f.time} /> · {humanSize(f.size)}
				</span>
			</span>
		</>
	);
	const row = `group flex items-center gap-3 ${compact ? "rounded-lg px-2 py-1.5" : "px-4 py-3"} hover:bg-base-content/[0.03]`;
	if (selection)
		return (
			<label data-nav className={`${row} cursor-pointer ${checked ? "bg-primary/[0.06]" : ""}`}>
				<input type="checkbox" className="checkbox checkbox-sm checkbox-primary shrink-0" checked={checked} onChange={e => selection.toggle([f.key], e.target.checked)} />
				{info}
			</label>
		);
	return (
		<div className={row}>
			<button data-nav onClick={() => openFile(f)} className="flex min-w-0 grow items-center gap-3 text-left">
				{info}
			</button>
			<a href={fileUrl(f.url, { download: true })} className="btn btn-ghost btn-sm btn-square shrink-0 opacity-60 group-hover:opacity-100" aria-label={`下載 ${f.name}`} title="下載">
				<DownloadSimpleIcon size={17} />
			</a>
		</div>
	);
}

function SelectionBar({
	course,
	materials,
	picked,
	visibleKeys,
	toggle,
	onDone
}: {
	course: ParsedCourse;
	materials: Material[];
	picked: Set<string>;
	visibleKeys: string[];
	toggle: Selection["toggle"];
	onDone: () => void;
}) {
	const look = useCourseLook(course)!;
	const [progress, setProgress] = useState<ZipProgress | null>(null);
	const [result, setResult] = useState<{ failed: string[]; error?: string } | null>(null);
	const abort = useRef<AbortController | null>(null);
	const items: PickedFile[] = materials.flatMap(m => m.files.filter(f => picked.has(f.key)).map(file => ({ file, folder: m.files.length > 1 ? m.title : undefined })));
	const size = items.reduce((n, it) => n + it.file.size, 0);
	const allVisible = visibleKeys.length > 0 && visibleKeys.every(k => picked.has(k));
	const zipping = items.length > 1;
	const tooBig = zipping && size > ZIP_LIMIT;
	const stream = zipping && size > LARGE_ZIP && canStreamToDisk();
	const risky = zipping && !tooBig && size > LARGE_ZIP && !stream;

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => e.key === "Escape" && !progress && !document.querySelector("dialog[open]") && onDone();
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [progress, onDone]);
	useEffect(() => () => abort.current?.abort(), []);

	async function download() {
		setResult(null);
		if (!zipping) {
			const a = document.createElement("a");
			a.href = fileUrl(items[0].file.url, { download: true });
			a.click();
			return;
		}
		const name = `${safeName(look.title) || "教材"}.zip`;
		const ctrl = new AbortController();
		abort.current = ctrl;
		try {
			if (stream) {
				// The save dialog comes first: it needs this click's user gesture.
				const res = await streamMaterialsZip(items, name, ctrl.signal, p => setProgress(p));
				if (res) setResult({ failed: res.failed });
			} else {
				setProgress({ files: 0, bytes: 0 });
				const res = await buildMaterialsZip(items, ctrl.signal, p => setProgress(p));
				if (res.failed.length < items.length) saveBlob(res.blob, name);
				setResult({ failed: res.failed });
			}
		} catch (e) {
			if (!ctrl.signal.aborted) setResult({ failed: [], error: e instanceof Error ? e.message : String(e) });
		} finally {
			abort.current = null;
			setProgress(null);
		}
	}

	const note = tooBig ? (
		<span className="block text-xs text-error">超過 4 GB，zip 裝不下。請分成幾批選取，或改成一個一個下載。</span>
	) : risky ? (
		<span className="flex items-start gap-1 text-xs text-base-content/70">
			<WarningIcon size={14} weight="fill" className="mt-px shrink-0 text-warning" />
			檔案很大，你的瀏覽器不支援邊下載邊寫入硬碟，打包時要全部放在記憶體裡，可能會失敗。建議改用電腦版 Chrome 或 Edge，或分批下載。
		</span>
	) : stream ? (
		<span className="block text-xs text-base-content/50">檔案較大，會先請你選存檔位置，再邊下載邊寫入。</span>
	) : null;

	return (
		<div className="sticky bottom-24 z-10 lg:bottom-4" role="region" aria-label="批量下載">
			<div className="flex flex-wrap items-center gap-2 rounded-2xl border hairline bg-base-100/95 p-2 pl-4 shadow-lg backdrop-blur">
				<span className="min-w-0 grow text-sm" aria-live="polite">
					{progress ? (
						<>
							正在打包{" "}
							<span className="tabular-nums">
								{progress.files} / {items.length}
							</span>
							<span className="text-base-content/50">
								{" "}
								· {humanSize(progress.bytes)} / {humanSize(size)}
							</span>
						</>
					) : items.length ? (
						<>
							已選 <strong className="tabular-nums">{items.length}</strong> 個檔案 <span className="text-base-content/50">· {humanSize(size)}</span>
							{note}
						</>
					) : (
						<span className="text-base-content/60">勾選要下載的檔案</span>
					)}
					{result?.error && !progress && <span className="block text-xs text-error">打包失敗：{result.error}</span>}
					{!!result?.failed.length && !progress && (
						<span className="block text-xs text-error">
							有 {result.failed.length} 個檔案下載失敗：{result.failed.join("、")}
						</span>
					)}
				</span>
				{progress ? (
					<>
						<progress className="progress progress-primary w-28" value={size ? progress.bytes : progress.files} max={size || items.length} />
						<button className="btn btn-ghost btn-sm" onClick={() => abort.current?.abort()}>
							取消
						</button>
					</>
				) : (
					<>
						<button className="btn btn-ghost btn-sm" onClick={() => toggle(visibleKeys, !allVisible)} disabled={!visibleKeys.length}>
							{allVisible ? "取消全選" : "全選"}
						</button>
						<button className="btn btn-ghost btn-sm" onClick={onDone}>
							完成
						</button>
						<button className={`btn btn-sm ${risky ? "btn-warning" : "btn-primary"}`} onClick={download} disabled={!items.length || tooBig}>
							<DownloadSimpleIcon size={16} />
							{risky ? "仍要下載" : zipping ? "下載 zip" : "下載"}
						</button>
					</>
				)}
			</div>
		</div>
	);
}
