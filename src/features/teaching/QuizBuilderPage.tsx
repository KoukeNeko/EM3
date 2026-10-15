import { useCourseIndex } from "@/features/courses/api";
import { cleanHtml, e3Link } from "@/lib/moodle/files";
import { markdownToHtml } from "@/shared/editor/markdown";
import { CourseTag } from "@/shared/ui/CourseTag";
import { ArrowDownIcon, ArrowLeftIcon, ArrowUpIcon, ClipboardTextIcon, DownloadSimpleIcon, PlusIcon, TrashIcon, WarningIcon } from "@phosphor-icons/react";
import { useParams, useRouter } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { saveBlob } from "./bundle";
import { fromSpreadsheet, newQuestion, problems, type QType, QTYPE_LABEL, type Question, toMoodleXml } from "./quizXml";

const KEY = (id: string) => `em3:quiz-draft:${id}`;

function load(courseId: string): { category: string; questions: Question[] } {
	try {
		const d = JSON.parse(localStorage.getItem(KEY(courseId)) ?? "null");
		if (d?.questions?.length) return d;
	} catch {
		/* ignore */
	}
	return { category: "", questions: [newQuestion()] };
}

export function QuizBuilderPage() {
	const { courseId } = useParams({ from: "/app/courses/$courseId/quiz-builder" });
	const router = useRouter();
	const course = useCourseIndex().byId.get(Number(courseId));
	const [state, setState] = useState(() => load(courseId));
	const [pasting, setPasting] = useState(false);
	const { questions, category } = state;

	useEffect(() => {
		try {
			localStorage.setItem(KEY(courseId), JSON.stringify(state));
		} catch {
			/* ignore */
		}
	}, [courseId, state]);

	const update = (id: string, patch: Partial<Question>) => setState(s => ({ ...s, questions: s.questions.map(q => (q.id === id ? { ...q, ...patch } : q)) }));
	const move = (i: number, d: number) =>
		setState(s => {
			const qs = [...s.questions];
			const [q] = qs.splice(i, 1);
			qs.splice(Math.max(0, Math.min(qs.length, i + d)), 0, q);
			return { ...s, questions: qs };
		});
	const issues = questions.flatMap(problems);
	const total = questions.reduce((n, q) => n + (Number(q.points) || 0), 0);

	function download() {
		const xml = toMoodleXml(questions, category);
		saveBlob(new Blob([xml], { type: "application/xml" }), `${course?.raw.shortname ?? courseId}-${category.trim() || "題目"}.xml`);
	}

	return (
		<div className="mx-auto max-w-6xl">
			<button onClick={() => router.history.back()} className="btn btn-ghost btn-sm mb-4 -ml-2">
				<ArrowLeftIcon size={16} />
				返回
			</button>
			<header className="mb-6">
				{course && <CourseTag course={course} link />}
				<h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">小考出題</h1>
				<p className="mt-1 max-w-2xl text-sm text-base-content/55">
					在這裡打題目，下載成 Moodle XML，再到 E3 的題庫匯入。E3 沒有開放建立小考的 API，所以小考本身（開放時間、作答次數）還是要在 E3 設定；題目只要匯入一次。草稿存在這個瀏覽器。
				</p>
			</header>

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_20rem]">
				<div className="min-w-0 space-y-4">
					<AnimatePresence initial={false}>
						{questions.map((q, i) => (
							<motion.div key={q.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}>
								<QuestionCard
									q={q}
									index={i}
									count={questions.length}
									onChange={p => update(q.id, p)}
									onMove={d => move(i, d)}
									onRemove={() => setState(s => ({ ...s, questions: s.questions.filter(x => x.id !== q.id) }))}
								/>
							</motion.div>
						))}
					</AnimatePresence>
					<div className="flex flex-wrap gap-2">
						<button className="btn" onClick={() => setState(s => ({ ...s, questions: [...s.questions, newQuestion(s.questions.at(-1)?.type ?? "single")] }))}>
							<PlusIcon size={16} />
							新增一題
						</button>
						<button className="btn btn-ghost" onClick={() => setPasting(true)}>
							<ClipboardTextIcon size={16} />
							從試算表貼上
						</button>
					</div>
				</div>

				<aside className="card-quiet space-y-4 self-start p-4 lg:sticky lg:top-6">
					<label className="block">
						<span className="mb-1 block text-xs font-semibold text-base-content/50">題庫類別（匯入後放在這個資料夾）</span>
						<input className="input input-sm w-full" placeholder="例如：第 3 週小考" value={category} onChange={e => setState(s => ({ ...s, category: e.target.value }))} />
					</label>
					<p className="text-sm">
						{questions.length} 題 · 共 {total} 分
					</p>
					{issues.length > 0 && (
						<ul className="space-y-1 rounded-lg bg-warning/10 p-3 text-xs">
							{issues.map(m => (
								<li key={m} className="flex gap-1">
									<WarningIcon size={13} className="mt-0.5 shrink-0 text-warning" />
									{m}
								</li>
							))}
						</ul>
					)}
					<button className="btn btn-primary w-full" disabled={issues.length > 0} onClick={download}>
						<DownloadSimpleIcon size={16} />
						下載 Moodle XML
					</button>
					<ol className="list-decimal space-y-1.5 pl-5 text-xs text-base-content/65">
						<li>下載 XML 檔。</li>
						<li>
							打開
							<a className="link mx-1" href={e3Link(`/question/bank/importquestions/import.php?courseid=${courseId}`)} target="_blank" rel="noreferrer">
								E3 題庫匯入
							</a>
							，格式選「Moodle XML」，上傳檔案。
						</li>
						<li>
							到 E3 新增或打開小考，「新增題目 → 從題庫」選這個類別。
							<a className="link ml-1" href={e3Link(`/course/modedit.php?add=quiz&course=${courseId}&section=0&return=0`)} target="_blank" rel="noreferrer">
								新增小考
							</a>
						</li>
					</ol>
					<button className="btn btn-ghost btn-xs text-error" onClick={() => confirm("清空所有題目？") && setState({ category: "", questions: [newQuestion()] })}>
						清空草稿
					</button>
				</aside>
			</div>

			<PasteDialog open={pasting} onClose={() => setPasting(false)} onAdd={qs => setState(s => ({ ...s, questions: [...s.questions.filter(q => q.text.trim()), ...qs] }))} />
		</div>
	);
}

function QuestionCard({
	q,
	index,
	count,
	onChange,
	onMove,
	onRemove
}: {
	q: Question;
	index: number;
	count: number;
	onChange: (p: Partial<Question>) => void;
	onMove: (d: number) => void;
	onRemove: () => void;
}) {
	const [preview, setPreview] = useState(false);
	const setType = (type: QType) => {
		const fresh = newQuestion(type);
		onChange({
			type,
			choices: q.choices.length && (type === "single" || type === "multi") ? q.choices : fresh.choices,
			answers: fresh.answers.length ? (q.answers.length ? q.answers : fresh.answers) : []
		});
	};
	return (
		<section className="card-quiet p-4">
			<div className="mb-3 flex flex-wrap items-center gap-2">
				<span className="grid size-7 place-items-center rounded-full bg-base-200 text-sm font-semibold tabular-nums">{index + 1}</span>
				<select className="select select-sm w-auto" value={q.type} onChange={e => setType(e.target.value as QType)} aria-label="題型">
					{(Object.keys(QTYPE_LABEL) as QType[]).map(t => (
						<option key={t} value={t}>
							{QTYPE_LABEL[t]}
						</option>
					))}
				</select>
				<label className="input input-sm w-24">
					<input type="number" min={0} step={0.5} value={q.points} onChange={e => onChange({ points: Number(e.target.value) })} aria-label="配分" />
					<span className="text-xs opacity-60">分</span>
				</label>
				<input className="input input-sm min-w-0 grow" placeholder="題目名稱 / 能力指標（選填）" value={q.name} onChange={e => onChange({ name: e.target.value })} />
				<div className="ml-auto flex">
					<button className="btn btn-ghost btn-xs btn-square" disabled={index === 0} onClick={() => onMove(-1)} aria-label="上移">
						<ArrowUpIcon size={14} />
					</button>
					<button className="btn btn-ghost btn-xs btn-square" disabled={index === count - 1} onClick={() => onMove(1)} aria-label="下移">
						<ArrowDownIcon size={14} />
					</button>
					<button className="btn btn-ghost btn-xs btn-square" onClick={onRemove} aria-label="刪除這題">
						<TrashIcon size={14} />
					</button>
				</div>
			</div>
			<div className="mb-1 flex justify-end">
				<button className="btn btn-ghost btn-xs" onClick={() => setPreview(p => !p)}>
					{preview ? "編輯" : "預覽"}
				</button>
			</div>
			{preview ? (
				<div className="prose-e3 min-h-20 rounded-lg bg-base-200 p-3" dangerouslySetInnerHTML={{ __html: cleanHtml(markdownToHtml(q.text || "（空白）")) }} />
			) : (
				<textarea className="textarea min-h-20 w-full font-mono text-sm" placeholder="題目（支援 Markdown 與 $數學式$）" value={q.text} onChange={e => onChange({ text: e.target.value })} />
			)}

			{(q.type === "single" || q.type === "multi") && (
				<ul className="mt-3 space-y-2">
					{q.choices.map((c, i) => (
						<li key={i} className="flex items-center gap-2">
							<input
								type={q.type === "single" ? "radio" : "checkbox"}
								name={`correct-${q.id}`}
								className={q.type === "single" ? "radio radio-sm radio-success" : "checkbox checkbox-sm checkbox-success"}
								checked={c.correct}
								onChange={e => onChange({ choices: q.choices.map((x, j) => ({ ...x, correct: q.type === "single" ? j === i : j === i ? e.target.checked : x.correct })) })}
								aria-label={`選項 ${String.fromCharCode(65 + i)} 是正確答案`}
							/>
							<span className="w-4 text-sm text-base-content/50">{String.fromCharCode(65 + i)}</span>
							<input
								className="input input-sm grow"
								value={c.text}
								placeholder="選項內容"
								onChange={e => onChange({ choices: q.choices.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)) })}
							/>
							<button className="btn btn-ghost btn-xs btn-square" onClick={() => onChange({ choices: q.choices.filter((_, j) => j !== i) })} aria-label="刪除選項">
								<TrashIcon size={13} />
							</button>
						</li>
					))}
					<li>
						<button className="btn btn-ghost btn-xs" onClick={() => onChange({ choices: [...q.choices, { text: "", correct: false }] })}>
							<PlusIcon size={13} />
							加選項
						</button>
					</li>
				</ul>
			)}
			{q.type === "truefalse" && (
				<div className="mt-3 join">
					<button className={`btn join-item btn-sm ${q.truth ? "btn-success" : ""}`} onClick={() => onChange({ truth: true })}>
						正確答案：是
					</button>
					<button className={`btn join-item btn-sm ${!q.truth ? "btn-success" : ""}`} onClick={() => onChange({ truth: false })}>
						正確答案：否
					</button>
				</div>
			)}
			{(q.type === "short" || q.type === "numerical") && (
				<div className="mt-3 flex flex-wrap items-center gap-2">
					{q.answers.map((a, i) => (
						<input
							key={i}
							className="input input-sm w-40"
							placeholder={q.type === "numerical" ? "正確數值" : "可接受的答案"}
							value={a}
							inputMode={q.type === "numerical" ? "decimal" : undefined}
							onChange={e => onChange({ answers: q.answers.map((x, j) => (j === i ? e.target.value : x)) })}
						/>
					))}
					{q.type === "short" && (
						<button className="btn btn-ghost btn-xs" onClick={() => onChange({ answers: [...q.answers, ""] })}>
							<PlusIcon size={13} />
							另一種寫法
						</button>
					)}
					{q.type === "numerical" && (
						<label className="input input-sm w-40">
							<span className="text-xs opacity-60">誤差 ±</span>
							<input type="number" min={0} step="any" value={q.tolerance ?? 0} onChange={e => onChange({ tolerance: Number(e.target.value) })} />
						</label>
					)}
				</div>
			)}
			{q.type === "essay" && <p className="mt-3 text-xs text-base-content/50">學生用文字編輯器作答，交卷後由老師或助教在 E3 批改。</p>}
		</section>
	);
}

function PasteDialog({ open, onClose, onAdd }: { open: boolean; onClose: () => void; onAdd: (qs: Question[]) => void }) {
	const ref = useRef<HTMLDialogElement>(null);
	const [text, setText] = useState("");
	useEffect(() => {
		const d = ref.current;
		if (open && d && !d.open) d.showModal();
		if (!open && d?.open) d.close();
	}, [open]);
	const parsed = fromSpreadsheet(text);
	return (
		<dialog ref={ref} className="modal modal-bottom sm:modal-middle" onClose={onClose}>
			<div className="modal-box max-w-2xl">
				<h3 className="text-lg font-semibold">從試算表貼上</h3>
				<p className="mt-1 text-sm text-base-content/60">在 Excel 或 Google 試算表選取題目範圍、複製、貼在下面。每列一題：題目、選項 A、選項 B…、最後一欄是答案（A、AC、O/X、數字或文字）。</p>
				<textarea
					className="textarea mt-3 h-48 w-full font-mono text-xs"
					value={text}
					onChange={e => setText(e.target.value)}
					placeholder={"1+1=?\t1\t2\t3\t4\tB\n地球是圓的\tO\n圓周率到小數兩位\t3.14"}
				/>
				<p className="mt-2 text-sm">{parsed.length ? `讀到 ${parsed.length} 題：${parsed.map(q => QTYPE_LABEL[q.type]).join("、")}` : "還沒有內容"}</p>
				<div className="modal-action">
					<button className="btn btn-ghost" onClick={onClose}>
						取消
					</button>
					<button
						className="btn btn-primary"
						disabled={!parsed.length}
						onClick={() => {
							onAdd(parsed);
							setText("");
							onClose();
						}}
					>
						加入 {parsed.length} 題
					</button>
				</div>
			</div>
			<form method="dialog" className="modal-backdrop">
				<button>close</button>
			</form>
		</dialog>
	);
}
