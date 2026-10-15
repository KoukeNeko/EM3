import { useCourseContents } from "@/features/courses/api";
import type { ParsedCourse } from "@/features/courses/parse";
import { cleanHtml, fileUrl, humanSize } from "@/lib/moodle/files";
import { Empty, ErrorNote, Lines } from "@/shared/ui/States";
import { Ago } from "@/shared/ui/Time";
import { ArrowSquareOutIcon, DownloadSimpleIcon, FilesIcon, FolderSimpleIcon, LinkSimpleIcon, MagnifyingGlassIcon, PlayCircleIcon, SortAscendingIcon, SortDescendingIcon } from "@phosphor-icons/react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { FileIcon } from "./FileIcon";
import { openFile } from "./FilePreview";
import { type Material, type MaterialFile, materialsFrom, useFolderIntros } from "./materials";

const WEEK = 7 * 86400;

export function MaterialsTab({ course }: { course: ParsedCourse }) {
	const { data, isPending, error, refetch } = useCourseContents(course.id);
	const intros = useFolderIntros(course.id);
	const [q, setQ] = useState("");
	const [newestFirst, setNewestFirst] = useState(true);

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
			</div>

			{groups.map((g, gi) => (
				<section key={g.title ?? gi}>
					{g.title && <h3 className="mb-2 px-1 text-sm font-semibold text-base-content/70">{g.title}</h3>}
					<motion.ul className="card-quiet divide-y divide-base-content/[0.06] overflow-hidden" initial="i" animate="a" variants={{ a: { transition: { staggerChildren: 0.025 } } }}>
						{g.items.map(m => (
							<motion.li key={m.key} variants={{ i: { opacity: 0, y: 6 }, a: { opacity: 1, y: 0 } }}>
								<MaterialRow m={m} intro={intros.data?.get(m.cmid)?.intro} />
							</motion.li>
						))}
					</motion.ul>
				</section>
			))}
			{!filtered.length && <Empty title={`找不到「${q}」`} />}
		</div>
	);
}

function MaterialRow({ m, intro }: { m: Material; intro?: string }) {
	const isNew = (t: number) => Date.now() / 1000 - t < WEEK;

	// A folder with exactly one file is just a file: show the file, keep the folder name as context.
	if (m.files.length === 1) return <FileRow f={m.files[0]} context={m.files[0].name.replace(/\.[^.]+$/, "") === m.title ? undefined : m.title} isNew={isNew(m.files[0].time)} />;

	if (m.kind === "url" || m.kind === "video" || m.kind === "page" || (!m.files.length && m.href)) {
		const Icon = m.kind === "url" ? LinkSimpleIcon : m.kind === "video" ? PlayCircleIcon : ArrowSquareOutIcon;
		return (
			<a data-nav href={m.href} target="_blank" rel="noreferrer" className="flex items-center gap-3 px-4 py-3 hover:bg-base-content/[0.03]">
				<Icon size={22} weight="duotone" className="shrink-0 text-info" />
				<span className="min-w-0 grow">
					<span className="block truncate text-sm font-medium">{m.title}</span>
					<span className="block truncate text-xs text-base-content/50">{m.kind === "url" ? m.href : m.kind === "video" ? "在 E3 播放影片" : "在 E3 開啟"}</span>
				</span>
				<ArrowSquareOutIcon size={16} className="shrink-0 opacity-40" />
			</a>
		);
	}

	return (
		<div className="px-4 py-3">
			<div className="flex items-center gap-3">
				<FolderSimpleIcon size={22} weight="duotone" className="shrink-0 text-base-content/40" />
				<span className="min-w-0 grow truncate text-sm font-semibold">{m.title}</span>
				{m.time > 0 && <Ago ts={m.time} className="shrink-0 text-xs text-base-content/45" />}
			</div>
			{intro && <FolderIntro html={intro} />}
			{m.files.length > 0 && (
				<ul className="mt-1 ml-3 border-l hairline pl-3">
					{m.files.map(f => (
						<li key={f.key}>
							<FileRow f={f} isNew={isNew(f.time)} compact />
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

function FileRow({ f, context, isNew, compact = false }: { f: MaterialFile; context?: string; isNew: boolean; compact?: boolean }) {
	return (
		<div className={`group flex items-center gap-3 ${compact ? "rounded-lg px-2 py-1.5" : "px-4 py-3"} hover:bg-base-content/[0.03]`}>
			<button data-nav onClick={() => openFile(f)} className="flex min-w-0 grow items-center gap-3 text-left">
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
			</button>
			<a href={fileUrl(f.url, { download: true })} className="btn btn-ghost btn-sm btn-square shrink-0 opacity-60 group-hover:opacity-100" aria-label={`下載 ${f.name}`} title="下載">
				<DownloadSimpleIcon size={17} />
			</a>
		</div>
	);
}
