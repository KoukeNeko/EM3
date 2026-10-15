import { useCourseIndex } from "@/features/courses/api";
import { call } from "@/lib/moodle/client";
import type { Assignment, SubmissionStatus } from "@/lib/moodle/types";
import { deadlinePhrase } from "@/lib/time/relative";
import { CheckCircleIcon, CloudArrowUpIcon, CopyIcon, WarningIcon } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { displayName, feedbackComment, feedbackFiles, fetchAllStatuses, isAuditor, type Participant, submittedFiles, useGrantExtension, useSaveGrade, useStudentIds } from "./api";
import { buildSubmissionZip, type CsvGrade, gradesCsv, gradesFromCsv, matchFeedbackFiles, readCsv, saveBlob } from "./bundle";

export type BulkKind = "download" | "csv" | "files" | "extend";

interface Props {
	kind: BulkKind | null;
	onClose: () => void;
	assignment: Assignment;
	participants: Participant[];
	grades: Record<number, { grade: string }>;
}

function Shell({ open, onClose, title, children, wide = false }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
	const ref = useRef<HTMLDialogElement>(null);
	useEffect(() => {
		const d = ref.current;
		if (open && d && !d.open) d.showModal();
		if (!open && d?.open) d.close();
	}, [open]);
	return (
		<dialog ref={ref} className="modal modal-bottom sm:modal-middle" onClose={onClose}>
			<div className={`modal-box ${wide ? "max-w-4xl" : "max-w-lg"}`}>
				<h3 className="mb-4 text-lg font-semibold">{title}</h3>
				{open && children}
			</div>
			<form method="dialog" className="modal-backdrop">
				<button>close</button>
			</form>
		</dialog>
	);
}

const gradeText = (g?: { grade: string }) => (g && Number(g.grade) >= 0 ? String(Number(g.grade)) : "");

export function BulkDialogs({ kind, onClose, assignment, participants, grades }: Props) {
	const sids = useStudentIds(assignment.course).data ?? {};
	return (
		<>
			<Shell open={kind === "download"} onClose={onClose} title="下載全部繳交">
				<DownloadAll assignment={assignment} participants={participants} grades={grades} sids={sids} onClose={onClose} />
			</Shell>
			<Shell open={kind === "csv"} onClose={onClose} title="從 CSV 匯入成績" wide>
				<CsvImport assignment={assignment} participants={participants} grades={grades} sids={sids} onClose={onClose} />
			</Shell>
			<Shell open={kind === "files"} onClose={onClose} title="上傳批改後的檔案" wide>
				<FilesUpload assignment={assignment} participants={participants} grades={grades} sids={sids} onClose={onClose} />
			</Shell>
			<Shell open={kind === "extend"} onClose={onClose} title="延長繳交期限">
				<Extend assignment={assignment} participants={participants} sids={sids} onClose={onClose} />
			</Shell>
		</>
	);
}

type Sub = { assignment: Assignment; participants: Participant[]; grades: Record<number, { grade: string }>; sids: Record<number, string>; onClose: () => void };

function DownloadAll({ assignment, participants, grades, sids, onClose }: Sub) {
	const { byId } = useCourseIndex();
	const [stage, setStage] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const submitted = participants.filter(p => p.submitted);
	const fileName = `${byId.get(assignment.course)?.raw.shortname ?? assignment.course}-${assignment.name}`.replace(/[\\/:*?"<>|]+/g, "_");

	async function run(withFiles: boolean) {
		setError(null);
		try {
			setStage("讀取繳交內容…");
			const statuses = await fetchAllStatuses(
				assignment.id,
				participants.map(p => p.id),
				n => setStage(`讀取繳交內容 ${n}/${participants.length}`)
			);
			const csv = gradesCsv(participants.map(p => ({ p, sid: sids[p.id], status: statuses[p.id], grade: gradeText(grades[p.id]), comment: "" })));
			if (!withFiles) {
				saveBlob(csv, `${fileName}-成績表.csv`);
			} else {
				const zip = await buildSubmissionZip(submitted, sids, statuses, csv, (d, t) => setStage(`下載檔案 ${d}/${t}`));
				saveBlob(zip, `${fileName}.zip`);
			}
			onClose();
		} catch (e) {
			setError(e instanceof Error ? e.message : String(e));
		} finally {
			setStage(null);
		}
	}

	return (
		<div className="space-y-4 text-sm">
			<p className="text-base-content/70">{submitted.length} 份繳交會打包成一個 zip，每位學生一個資料夾，名稱是「學號_姓名_編號」。線上文字會存成 HTML，根目錄附一份成績表 CSV。</p>
			<p className="text-base-content/70">改完之後，把批改檔放回同一個資料夾、在 CSV 填上分數，再用「匯入成績 CSV」和「上傳批改檔」送回來就好，不用改檔名。</p>
			{stage ? (
				<div>
					<progress className="progress progress-primary w-full" />
					<p className="mt-1 text-xs text-base-content/55">{stage}</p>
				</div>
			) : (
				<div className="modal-action">
					<button className="btn btn-ghost" onClick={() => void run(false)}>
						只下載成績表 CSV
					</button>
					<button className="btn btn-primary" onClick={() => void run(true)} disabled={!submitted.length}>
						下載 zip
					</button>
				</div>
			)}
			{error && <p className="text-error">下載失敗：{error}</p>}
		</div>
	);
}

interface PlanRow {
	p: Participant;
	current: string;
	next: number | null;
	comment?: string;
	note?: string;
}

function CsvImport({ assignment, participants, grades, sids, onClose }: Sub) {
	const [rows, setRows] = useState<CsvGrade[] | null>(null);
	const [running, setRunning] = useState<{ done: number; total: number } | null>(null);
	const [result, setResult] = useState<string | null>(null);
	const qc = useQueryClient();
	const max = assignment.grade;

	const plan = useMemo(() => {
		if (!rows) return null;
		const bySid = new Map(Object.entries(sids).map(([id, sid]) => [sid.toLowerCase(), Number(id)]));
		const byEmail = new Map(participants.filter(p => p.email).map(p => [p.email!.toLowerCase(), p.id]));
		const byId = new Map(participants.map(p => [p.id, p]));
		const ok: PlanRow[] = [];
		const problems: string[] = [];
		for (const r of rows) {
			if (r.error) {
				problems.push(`第 ${r.line} 行：${r.error}`);
				continue;
			}
			const id = (r.sid && bySid.get(r.sid.toLowerCase())) || (r.userid && byId.has(r.userid) ? r.userid : undefined) || (r.email && byEmail.get(r.email));
			const p = id ? byId.get(id) : undefined;
			if (!p) {
				problems.push(`第 ${r.line} 行：找不到這位學生（${r.sid ?? r.email ?? r.userid}）`);
				continue;
			}
			const current = gradeText(grades[p.id]);
			const changed = (r.grade === null ? "" : String(r.grade)) !== current || !!r.comment?.trim();
			if (changed) ok.push({ p, current, next: r.grade, comment: r.comment?.trim() || undefined });
		}
		return { ok, problems };
	}, [rows, sids, participants, grades]);

	async function apply() {
		if (!plan) return;
		setRunning({ done: 0, total: plan.ok.length });
		try {
			// Existing comments must be sent back unchanged, so fetch them first.
			const statuses = await fetchAllStatuses(
				assignment.id,
				plan.ok.map(r => r.p.id)
			);
			const commentsOn = assignment.configs.some(c => c.subtype === "assignfeedback" && c.plugin === "comments" && c.name === "enabled" && c.value === "1");
			for (let i = 0; i < plan.ok.length; i += 20) {
				const chunk = plan.ok.slice(i, i + 20);
				await call<null>("mod_assign_save_grades", {
					assignmentid: assignment.id,
					applytoall: true,
					grades: chunk.map(r => ({
						userid: r.p.id,
						grade: r.next ?? -1,
						attemptnumber: -1,
						addattempt: false,
						workflowstate: "",
						plugindata: commentsOn
							? { assignfeedbackcomments_editor: { text: r.comment ? `<p>${escapeHtml(r.comment).replace(/\n/g, "<br>")}</p>` : feedbackComment(statuses[r.p.id]), format: 1 } }
							: {}
					})) as never
				});
				setRunning({ done: Math.min(plan.ok.length, i + chunk.length), total: plan.ok.length });
			}
			setResult(`已更新 ${plan.ok.length} 位學生的成績`);
			void qc.invalidateQueries({ queryKey: ["teach"] });
		} catch (e) {
			setResult(`匯入中斷：${e instanceof Error ? e.message : e}`);
		} finally {
			setRunning(null);
		}
	}

	if (result)
		return (
			<div className="space-y-4">
				<p className="flex items-center gap-2">
					<CheckCircleIcon size={20} className="text-success" weight="fill" />
					{result}
				</p>
				<div className="modal-action">
					<button className="btn" onClick={onClose}>
						完成
					</button>
				</div>
			</div>
		);

	return (
		<div className="space-y-4 text-sm">
			<p className="text-base-content/70">用「下載全部」附的成績表最方便；其他表格只要有「學號」（或 email、userid）和「分數」欄位也可以，「評語」欄可有可無。Excel 存成 Big5 也讀得懂。滿分 {max}。</p>
			<input type="file" accept=".csv,text/csv" className="file-input w-full" onChange={async e => e.target.files?.[0] && setRows(gradesFromCsv(await readCsv(e.target.files[0]), max))} />
			{plan && (
				<>
					{plan.problems.length > 0 && (
						<ul className="max-h-28 space-y-1 overflow-y-auto rounded-lg bg-warning/10 p-3 text-xs">
							{plan.problems.map(p => (
								<li key={p} className="flex gap-1">
									<WarningIcon size={13} className="mt-0.5 shrink-0 text-warning" />
									{p}
								</li>
							))}
						</ul>
					)}
					{plan.ok.length ? (
						<div className="max-h-80 overflow-auto rounded-lg border hairline">
							<table className="table table-sm">
								<thead>
									<tr>
										<th>學生</th>
										<th className="text-right">原本</th>
										<th className="text-right">新的</th>
										<th>評語</th>
									</tr>
								</thead>
								<tbody>
									{plan.ok.map(r => (
										<tr key={r.p.id}>
											<td>
												{displayName(r.p.fullname)} <span className="text-xs text-base-content/45">{sids[r.p.id]}</span>
											</td>
											<td className="text-right tabular-nums text-base-content/50">{r.current || "—"}</td>
											<td className="text-right font-semibold tabular-nums">{r.next ?? "清除"}</td>
											<td className="max-w-56 truncate text-xs">{r.comment ?? <span className="text-base-content/35">不變</span>}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					) : (
						<p className="text-base-content/55">沒有需要更新的成績。</p>
					)}
					{running ? (
						<progress className="progress progress-primary w-full" value={running.done} max={running.total} />
					) : (
						<div className="modal-action">
							<button className="btn btn-ghost" onClick={onClose}>
								取消
							</button>
							<button className="btn btn-primary" disabled={!plan.ok.length} onClick={() => void apply()}>
								寫入 {plan.ok.length} 筆成績到 E3
							</button>
						</div>
					)}
				</>
			)}
		</div>
	);
}

const escapeHtml = (s: string) => s.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

function FilesUpload({ assignment, participants, grades, sids, onClose }: Sub) {
	const [plan, setPlan] = useState<{ matched: Map<number, File[]>; unmatched: string[] } | null>(null);
	const [skipped, setSkipped] = useState(0);
	const [running, setRunning] = useState<{ done: number; total: number } | null>(null);
	const [result, setResult] = useState<string | null>(null);
	const save = useSaveGrade(assignment);
	const input = useRef<HTMLInputElement>(null);

	async function read(files: File[]) {
		const statuses = await fetchAllStatuses(
			assignment.id,
			participants.map(p => p.id)
		);
		const res = await matchFeedbackFiles(files, new Set(participants.map(p => p.id)));
		// Students' own files are still in their folders; only upload what is new or changed.
		let dropped = 0;
		for (const [id, list] of res.matched) {
			const original = submittedFiles(statuses[id]);
			const kept = list.filter(f => !original.some(o => o.filename === f.name && o.filesize === f.size));
			dropped += list.length - kept.length;
			if (kept.length) res.matched.set(id, kept);
			else res.matched.delete(id);
		}
		setSkipped(dropped);
		setPlan(res);
		statusCache.current = statuses;
	}
	const statusCache = useRef<Record<number, SubmissionStatus>>({});

	async function apply() {
		if (!plan) return;
		const entries = [...plan.matched];
		setRunning({ done: 0, total: entries.length });
		try {
			for (const [i, [id, files]] of entries.entries()) {
				const st = statusCache.current[id];
				const g = grades[id];
				await save.mutateAsync({
					userid: id,
					grade: g && Number(g.grade) >= 0 ? Number(g.grade) : null,
					commentHtml: feedbackComment(st),
					files,
					keepFiles: feedbackFiles(st)
				});
				setRunning({ done: i + 1, total: entries.length });
			}
			setResult(`已把批改檔交還給 ${entries.length} 位學生`);
		} catch (e) {
			setResult(`上傳中斷：${e instanceof Error ? e.message : e}`);
		} finally {
			setRunning(null);
		}
	}

	if (result)
		return (
			<div className="space-y-4">
				<p className="flex items-center gap-2">
					<CheckCircleIcon size={20} className="text-success" weight="fill" />
					{result}
				</p>
				<div className="modal-action">
					<button className="btn" onClick={onClose}>
						完成
					</button>
				</div>
			</div>
		);

	const byId = new Map(participants.map(p => [p.id, p]));
	return (
		<div className="space-y-4 text-sm">
			<p className="text-base-content/70">
				把整個改好的 zip 拖進來（或選資料夾裡的檔案）。EM3 會依資料夾名稱「學號_姓名_編號」對回學生；學生原本交的檔案會自動略過，不會被當成回饋上傳。原本的分數和評語都不會改。
			</p>
			<button
				className="flex w-full flex-col items-center gap-1 rounded-2xl border-2 border-dashed border-base-content/15 px-4 py-6 hover:border-base-content/30"
				onClick={() => input.current?.click()}
			>
				<CloudArrowUpIcon size={30} weight="duotone" className="text-base-content/40" />
				選擇 zip 或檔案
			</button>
			<input ref={input} type="file" multiple accept=".zip,*/*" hidden onChange={e => e.target.files && void read(Array.from(e.target.files))} />
			{plan && (
				<>
					<p>
						對到 {plan.matched.size} 位學生{skipped ? `，略過 ${skipped} 個學生原本的檔案` : ""}
						{plan.unmatched.length ? `，${plan.unmatched.length} 個檔案對不到人` : ""}。
					</p>
					<ul className="max-h-64 space-y-1 overflow-y-auto rounded-lg border hairline p-3 text-xs">
						{[...plan.matched].map(([id, files]) => (
							<li key={id}>
								<span className="font-medium">
									{displayName(byId.get(id)?.fullname ?? String(id))} {sids[id]}
								</span>
								<span className="text-base-content/55"> · {files.map(f => f.name).join("、")}</span>
							</li>
						))}
						{plan.unmatched.map(n => (
							<li key={n} className="text-warning">
								對不到：{n}
							</li>
						))}
					</ul>
					{running ? (
						<progress className="progress progress-primary w-full" value={running.done} max={running.total} />
					) : (
						<div className="modal-action">
							<button className="btn btn-ghost" onClick={onClose}>
								取消
							</button>
							<button className="btn btn-primary" disabled={!plan.matched.size} onClick={() => void apply()}>
								上傳給 {plan.matched.size} 位學生
							</button>
						</div>
					)}
				</>
			)}
		</div>
	);
}

function Extend({ assignment, participants, sids, onClose }: { assignment: Assignment; participants: Participant[]; sids: Record<number, string>; onClose: () => void }) {
	const base = Math.max(assignment.duedate, Math.floor(Date.now() / 1000));
	const [days, setDays] = useState(1);
	const [picked, setPicked] = useState<Set<number>>(() => new Set(participants.filter(p => !p.submitted && !isAuditor(p)).map(p => p.id)));
	const [copied, setCopied] = useState(false);
	const grant = useGrantExtension(assignment);
	const until = base + days * 86400;
	const missing = participants.filter(p => !p.submitted);

	async function copyMissing() {
		await navigator.clipboard.writeText(missing.map(p => `${sids[p.id] ?? ""} ${displayName(p.fullname)}`.trim()).join("\n"));
		setCopied(true);
	}

	return (
		<div className="space-y-4 text-sm">
			<div className="flex items-center justify-between gap-2 rounded-lg bg-base-200 px-3 py-2">
				<span>{missing.length} 位還沒交</span>
				<button className="btn btn-ghost btn-xs" onClick={() => void copyMissing()}>
					<CopyIcon size={13} />
					{copied ? "已複製" : "複製名單（貼到 LINE 提醒）"}
				</button>
			</div>
			<div className="flex flex-wrap gap-2">
				{[1, 3, 7].map(d => (
					<button key={d} className={`btn btn-sm ${days === d ? "btn-neutral" : ""}`} onClick={() => setDays(d)}>
						+{d} 天
					</button>
				))}
			</div>
			<p>新的期限：{deadlinePhrase(until)}</p>
			<ul className="max-h-60 space-y-1 overflow-y-auto rounded-lg border hairline p-2">
				{participants.map(p => (
					<li key={p.id}>
						<label className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 hover:bg-base-content/[0.04]">
							<input
								type="checkbox"
								className="checkbox checkbox-xs"
								checked={picked.has(p.id)}
								onChange={e => setPicked(s => (e.target.checked ? new Set(s).add(p.id) : new Set([...s].filter(x => x !== p.id))))}
							/>
							<span className="grow">{displayName(p.fullname)}</span>
							<span className="text-xs text-base-content/45">{p.submitted ? "已交" : "未交"}</span>
						</label>
					</li>
				))}
			</ul>
			{grant.error && <p className="text-error">{grant.error.message}</p>}
			{grant.isSuccess ? (
				<p className="text-success">已延長 {picked.size} 位學生的期限</p>
			) : (
				<div className="modal-action">
					<button className="btn btn-ghost" onClick={onClose}>
						取消
					</button>
					<button className="btn btn-primary" disabled={!picked.size || grant.isPending} onClick={() => grant.mutate({ userids: [...picked], until })}>
						延長 {picked.size} 位學生
					</button>
				</div>
			)}
		</div>
	);
}
