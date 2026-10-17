import { courseContentsQuery } from "@/features/courses/api";
import { call, callMany } from "@/lib/moodle/client";
import { safeName } from "@/lib/download";
import { e3Link, fileExt, fileUrl } from "@/lib/moodle/files";
import type { CourseModule, CourseSection } from "@/lib/moodle/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { zipSync, type Zippable } from "fflate";

// E3 calls folders 「教材」 and nearly every folder holds one to three files, so
// EM3 flattens them: the unit of material is the file, grouped by its folder.

export interface MaterialFile {
	key: string;
	name: string;
	url: string;
	size: number;
	mime: string;
	ext: string;
	time: number;
	path: string;
}

export type MaterialKind = "folder" | "resource" | "url" | "video" | "page" | "other";

export interface Material {
	key: string;
	cmid: number;
	instance: number;
	kind: MaterialKind;
	modname: string;
	title: string;
	section: CourseSection;
	files: MaterialFile[];
	/** Latest change to anything inside. */
	time: number;
	/** External link (url modules) or the E3 page for modules EM3 cannot render. */
	href?: string;
	module: CourseModule;
	description?: string;
}

const MATERIAL_MODS: Record<string, MaterialKind> = { folder: "folder", resource: "resource", url: "url", supervideo: "video", page: "page", book: "page", label: "other" };

export function materialsFrom(sections: CourseSection[]): Material[] {
	const out: Material[] = [];
	for (const section of sections) {
		if (!section.uservisible) continue;
		for (const m of section.modules) {
			const kind = MATERIAL_MODS[m.modname];
			if (!kind || !m.uservisible || m.modname === "label") continue;
			const files: MaterialFile[] = (m.contents ?? [])
				.filter(c => c.type === "file")
				.map(c => ({
					key: `${m.id}:${c.filepath}${c.filename}`,
					name: c.filename,
					url: c.fileurl,
					size: c.filesize,
					mime: c.mimetype ?? "",
					ext: fileExt(c.filename),
					time: c.timemodified,
					path: c.filepath
				}));
			const urlTarget = m.modname === "url" ? m.contents?.find(c => c.type === "url")?.fileurl : undefined;
			out.push({
				key: `m${m.id}`,
				cmid: m.id,
				instance: m.instance,
				kind,
				modname: m.modname,
				title: m.name,
				section,
				files,
				time: Math.max(0, ...files.map(f => f.time), m.contentsinfo?.lastmodified ?? 0),
				href: urlTarget ?? (kind === "video" || kind === "page" ? e3Link(`/mod/${m.modname}/view.php?id=${m.id}`) : undefined),
				module: m,
				description: m.description
			});
		}
	}
	return out;
}

interface FolderInfo {
	id: number;
	coursemodule: number;
	intro: string;
	introfiles?: { filename: string; fileurl: string; mimetype: string }[];
}

/** Folder intros hold notes, Google Drive links and embedded videos; core_course_get_contents omits them. */
export function useFolderIntros(courseId: number) {
	return useQuery({
		queryKey: ["folders", courseId],
		staleTime: 10 * 60_000,
		queryFn: async () => {
			const res = await call<{ folders: FolderInfo[] }>("mod_folder_get_folders_by_courses", { courseids: [courseId] });
			return new Map(res.folders.map(f => [f.coursemodule, f]));
		}
	});
}

/** Course contents for many courses in one round trip; seeds each course's own cache entry. */
export function useManyContents(courseIds: number[]) {
	const qc = useQueryClient();
	const ids = [...courseIds].sort((a, b) => a - b);
	return useQuery({
		queryKey: ["contents-many", ids],
		enabled: ids.length > 0,
		staleTime: 5 * 60_000,
		queryFn: async ({ signal }) => {
			const res = await callMany<CourseSection[]>(
				ids.map(courseid => ({ fn: "core_course_get_contents", args: { courseid } })),
				signal
			);
			const map = new Map<number, CourseSection[]>();
			res.forEach((sections, i) => {
				if (!sections) return;
				map.set(ids[i], sections);
				qc.setQueryData(courseContentsQuery(ids[i]).queryKey, sections);
			});
			return map;
		}
	});
}

export function fileKind(ext: string): "pdf" | "slides" | "doc" | "sheet" | "video" | "image" | "archive" | "code" | "audio" | "file" {
	if (ext === "pdf") return "pdf";
	if (["ppt", "pptx", "key", "odp"].includes(ext)) return "slides";
	if (["doc", "docx", "odt", "rtf", "txt", "md"].includes(ext)) return "doc";
	if (["xls", "xlsx", "csv", "ods"].includes(ext)) return "sheet";
	if (["mp4", "mov", "webm", "mkv", "m4v"].includes(ext)) return "video";
	if (["png", "jpg", "jpeg", "gif", "webp", "svg", "heic"].includes(ext)) return "image";
	if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return "archive";
	if (["mp3", "m4a", "wav"].includes(ext)) return "audio";
	if (["c", "cpp", "h", "py", "java", "js", "ts", "ipynb", "v", "sv", "sh", "json"].includes(ext)) return "code";
	return "file";
}

/** Files a browser can show inline. */
export const canPreview = (ext: string) => ["pdf", "png", "jpg", "jpeg", "gif", "webp", "svg", "mp4", "webm", "mov", "m4v", "mp3", "m4a", "wav", "txt"].includes(ext);

export interface PickedFile {
	file: MaterialFile;
	/** Folder to place the file in, for folders that hold more than one file. */
	folder?: string;
}

/** Zips the picked files, keeping multi-file folders as folders. A few downloads run at a time to go easy on E3. */
export async function buildMaterialsZip(items: PickedFile[], onProgress?: (done: number, total: number) => void) {
	const tree: Zippable = {};
	const used = new Set<string>();
	const failed: string[] = [];
	const place = (path: string, data: Uint8Array) => {
		let p = path;
		for (let n = 2; used.has(p); n++) p = path.replace(/(\.[^./]+)?$/, ` (${n})$1`);
		used.add(p);
		tree[p] = [data, { level: 0 }];
	};
	const queue = [...items];
	let done = 0;
	const worker = async () => {
		for (let it = queue.shift(); it; it = queue.shift()) {
			try {
				const res = await fetch(fileUrl(it.file.url, { download: true }));
				if (!res.ok) throw new Error(String(res.status));
				const sub = it.file.path.split("/").filter(Boolean).map(safeName);
				place([it.folder && safeName(it.folder), ...sub, safeName(it.file.name)].filter(Boolean).join("/"), new Uint8Array(await res.arrayBuffer()));
			} catch {
				failed.push(it.file.name);
			}
			onProgress?.(++done, items.length);
		}
	};
	await Promise.all(Array.from({ length: Math.min(4, items.length) }, worker));
	return { blob: new Blob([zipSync(tree) as BlobPart], { type: "application/zip" }), failed };
}
