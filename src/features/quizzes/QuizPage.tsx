import { TASK_STATE_LABEL } from "@/features/assignments/api";
import { Fact, FileChips } from "@/features/assignments/AssignmentPage";
import { useCourseIndex, useSiteInfo } from "@/features/courses/api";
import { copyWhenReady } from "@/lib/clipboard";
import { cleanHtml, e3Link } from "@/lib/moodle/files";
import { countdown, deadlinePhrase, fullDateTime } from "@/lib/time/relative";
import { CourseTag } from "@/shared/ui/CourseTag";
import { E3Away } from "@/shared/ui/LeaveToE3";
import { ErrorNote, Lines } from "@/shared/ui/States";
import {
	ArrowLeftIcon,
	ArrowSquareOutIcon,
	CheckCircleIcon,
	CheckIcon,
	ClockIcon,
	ChatsCircleIcon,
	CopyIcon,
	HourglassIcon,
	ListNumbersIcon,
	MinusCircleIcon,
	QuestionIcon,
	TimerIcon,
	TrophyIcon,
	XCircleIcon
} from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
	ATTEMPT_STATE_LABEL,
	attemptQuestions,
	formatGrade,
	gradeFromAttempts,
	type Quiz,
	type QuizAttempt,
	QUIZ_E3_REASON,
	quizNotes,
	quizState,
	scaledGrade,
	startAttempt,
	useAttemptReview,
	useBestGrade,
	useQuizAttempts,
	useQuizzes
} from "./api";
import { buildStudyPrompt, parseQuestion, PROMPT_LANG_LABEL, type PromptLang, promptLang, type ReviewOption, type ReviewQuestion } from "./review";

const STATE_TONE = { graded: "badge-success", submitted: "badge-success", todo: "badge-info", late: "badge-error", upcoming: "badge-ghost", closed: "badge-ghost" } as const;

export function QuizPage() {
	const { courseId, cmid } = useParams({ from: "/app/courses/$courseId/quiz/$cmid" });
	const router = useRouter();
	const { byId } = useCourseIndex();
	const course = byId.get(Number(courseId));
	const ids = useMemo(() => [Number(courseId)], [courseId]);
	const quizzes = useQuizzes(ids);
	const quiz = quizzes.data?.find(q => q.coursemodule === Number(cmid));
	const attemptsQ = useQuizAttempts(quiz ? [quiz.id] : []);
	const best = useBestGrade(quiz?.id);
	const attempts = useMemo(() => [...(attemptsQ.data?.[quiz?.id ?? 0] ?? [])].sort((a, b) => b.attempt - a.attempt), [attemptsQ.data, quiz?.id]);
	const finished = attempts.filter(a => a.state === "finished");
	const [picked, setPicked] = useState<number | null>(null);
	const shown = attempts.find(a => a.id === picked) ?? finished[0];
	const site = useSiteInfo();
	const [langPick, setLang] = useState<PromptLang | null>(null);
	const lang = langPick ?? promptLang(site.data?.lang);
	const courseName = (lang === "en" && course?.nameEn) || course?.name || "";

	if (quizzes.error) return <ErrorNote error={quizzes.error} retry={quizzes.refetch} />;
	if (quizzes.isPending || (quiz && attemptsQ.isPending)) return <Lines n={6} />;
	if (!quiz) return <p className="py-20 text-center text-base-content/60">找不到這份測驗。</p>;

	const now = Date.now() / 1000;
	const state = quizState(quiz, attempts, now);
	const cd = quiz.timeclose ? countdown(quiz.timeclose) : null;
	const open = state === "todo" || state === "late";
	const unfinished = attempts.find(a => a.state === "inprogress" || a.state === "overdue");
	const used = attempts.filter(a => a.state !== "abandoned").length;
	const canAttempt = (!quiz.timeclose || quiz.timeclose > now) && quiz.timeopen <= now && (!quiz.attempts || used < quiz.attempts);
	const overall = best.data?.hasgrade && best.data.grade !== undefined ? best.data.grade : gradeFromAttempts(quiz, attempts);
	const notice = { url: e3Link(`/mod/quiz/view.php?id=${quiz.coursemodule}`), title: quiz.name, reason: QUIZ_E3_REASON, notes: quizNotes(quiz, attempts) };

	return (
		<div className="mx-auto max-w-5xl">
			<button onClick={() => router.history.back()} className="btn btn-ghost btn-sm mb-4 -ml-2">
				<ArrowLeftIcon size={16} />
				返回
			</button>

			<header className="mb-6">
				{course && <CourseTag course={course} link />}
				<h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{quiz.name}</h1>
				<div className="mt-3 flex flex-wrap items-center gap-2">
					<span className={`badge badge-soft ${STATE_TONE[state]}`}>{state === "submitted" ? "已作答" : TASK_STATE_LABEL[state]}</span>
					{unfinished && <span className="badge badge-soft badge-warning">有一次作答還沒提交</span>}
					{cd && open && <span className={`text-sm ${cd.urgency === "critical" || cd.urgency === "overdue" ? "text-error" : "text-base-content/60"}`}>{cd.text}</span>}
				</div>
			</header>

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_20rem]">
				<div className="min-w-0 space-y-6">
					<dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
						{quiz.timeopen > now ? (
							<Fact icon={<HourglassIcon size={16} />} label="開放作答" value={deadlinePhrase(quiz.timeopen)} hint={fullDateTime(quiz.timeopen)} />
						) : (
							<Fact icon={<ClockIcon size={16} />} label="關閉" value={quiz.timeclose ? deadlinePhrase(quiz.timeclose) : "沒有期限"} hint={quiz.timeclose ? fullDateTime(quiz.timeclose) : undefined} />
						)}
						<Fact icon={<TimerIcon size={16} />} label="限時" value={quiz.timelimit ? `${Math.round(quiz.timelimit / 60)} 分鐘` : "不限時"} />
						<Fact icon={<ListNumbersIcon size={16} />} label="作答次數" value={quiz.attempts ? `${used} / ${quiz.attempts}` : `${used} 次`} hint={quiz.attempts ? undefined : "不限次數"} />
						<Fact
							icon={<TrophyIcon size={16} />}
							label="成績"
							value={overall !== null ? `${formatGrade(overall, quiz)} / ${formatGrade(quiz.grade, quiz)}` : "—"}
							hint={finished.length > 1 ? "依老師設定的計分方式" : undefined}
						/>
					</dl>

					{(quiz.intro?.trim() || !!quiz.introfiles?.length) && (
						<section className="card-quiet p-5">
							<h2 className="mb-2 text-sm font-semibold text-base-content/60">說明</h2>
							{quiz.intro && <div className="prose-e3" dangerouslySetInnerHTML={{ __html: cleanHtml(quiz.intro) }} />}
							{!!quiz.introfiles?.length && (
								<div className="mt-4">
									<FileChips files={quiz.introfiles} />
								</div>
							)}
						</section>
					)}

					{shown?.state === "finished" ? (
						<AttemptReview quiz={quiz} attempt={shown} courseName={courseName} lang={lang} onLang={setLang} />
					) : (
						!attempts.length && <section className="card-quiet p-5 text-sm text-base-content/60">還沒有作答紀錄。作答完成後，這裡會顯示每一題的結果和解說（如果老師開放檢閱）。</section>
					)}
				</div>

				<aside className="order-first space-y-4 lg:order-none lg:sticky lg:top-6 lg:self-start">
					{(canAttempt || unfinished) && (
						<section className="card-quiet p-4">
							<E3Away notice={notice} className="btn btn-primary w-full">
								{unfinished ? "回到 E3 繼續作答" : attempts.length ? "到 E3 再作答一次" : "到 E3 作答"}
								<ArrowSquareOutIcon size={16} />
							</E3Away>
							<p className="mt-2 text-xs text-base-content/50">測驗在 E3 上作答，EM3 只顯示結果。</p>
							<PracticeCopy quiz={quiz} unfinished={unfinished} used={used} courseName={courseName} lang={lang} onLang={setLang} />
						</section>
					)}
					{attempts.length > 0 && (
						<section className="card-quiet p-2">
							<h2 className="px-2 pt-2 pb-1 text-sm font-semibold text-base-content/60">我的作答</h2>
							<ul>
								{attempts.map(a => (
									<li key={a.id}>
										<AttemptRow quiz={quiz} a={a} active={a.id === shown?.id} onPick={() => setPicked(a.id)} />
									</li>
								))}
							</ul>
						</section>
					)}
					{!canAttempt && !unfinished && (
						<a className="btn btn-ghost btn-sm w-full" href={notice.url} target="_blank" rel="noreferrer">
							<ArrowSquareOutIcon size={15} />在 E3 開啟這份測驗
						</a>
					)}
				</aside>
			</div>
		</div>
	);
}

function AttemptRow({ quiz, a, active, onPick }: { quiz: Quiz; a: QuizAttempt; active: boolean; onPick: () => void }) {
	const grade = scaledGrade(quiz, a.sumgrades);
	const minutes = a.timefinish && a.timestart ? Math.max(1, Math.round((a.timefinish - a.timestart) / 60)) : null;
	const reviewable = a.state === "finished";
	return (
		<button
			onClick={onPick}
			disabled={!reviewable}
			data-nav
			className={`flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left disabled:cursor-default ${active ? "bg-base-content/[0.06]" : reviewable ? "hover:bg-base-content/[0.03]" : ""}`}
		>
			<span className="min-w-0 grow">
				<span className="block text-sm font-medium">第 {a.attempt} 次</span>
				<span className="block truncate text-xs text-base-content/50">
					{ATTEMPT_STATE_LABEL[a.state]}
					{a.timefinish ? ` · ${fullDateTime(a.timefinish)}` : ""}
					{minutes ? ` · 用時 ${minutes} 分` : ""}
				</span>
			</span>
			{grade !== null && (
				<span className="shrink-0 text-sm font-semibold tabular-nums">
					{formatGrade(grade, quiz)}
					<span className="font-normal text-base-content/45"> / {formatGrade(quiz.grade, quiz)}</span>
				</span>
			)}
		</button>
	);
}

const VERDICT = {
	correct: { label: "答對", tone: "badge-success", Icon: CheckCircleIcon, color: "text-success" },
	incorrect: { label: "答錯", tone: "badge-error", Icon: XCircleIcon, color: "text-error" },
	partial: { label: "部分正確", tone: "badge-warning", Icon: MinusCircleIcon, color: "text-warning" },
	pending: { label: "待評分", tone: "badge-ghost", Icon: QuestionIcon, color: "text-base-content/50" },
	unknown: { label: "", tone: "badge-ghost", Icon: QuestionIcon, color: "text-base-content/40" }
} as const;

function AttemptReview({ quiz, attempt, courseName, lang, onLang }: { quiz: Quiz; attempt: QuizAttempt; courseName: string; lang: PromptLang; onLang: (l: PromptLang) => void }) {
	const review = useAttemptReview(attempt.id);
	const [copied, setCopied] = useState<"ok" | "fail" | null>(null);
	const questions = useMemo(() => [...(review.data?.questions ?? [])].sort((a, b) => a.slot - b.slot).map(parseQuestion), [review.data]);
	const grade = review.data?.grade;
	const gradeText = grade !== null && grade !== undefined && grade !== "" ? formatGrade(Number(grade), quiz) : null;
	const prompt = useMemo(() => buildStudyPrompt({ course: courseName, quiz, questions, grade: gradeText, lang }), [courseName, quiz, questions, gradeText, lang]);

	useEffect(() => {
		if (!copied) return;
		const t = setTimeout(() => setCopied(null), 2500);
		return () => clearTimeout(t);
	}, [copied]);

	async function copy() {
		try {
			await navigator.clipboard.writeText(prompt);
			setCopied("ok");
		} catch {
			setCopied("fail");
		}
	}

	if (review.error)
		return (
			<section className="card-quiet p-5 text-sm">
				<h2 className="mb-1 font-semibold">第 {attempt.attempt} 次作答的結果</h2>
				<p className="text-base-content/60">E3 目前不開放檢閱這次作答，通常是老師設定成測驗關閉後才能看。</p>
				<p className="mt-1 text-xs text-base-content/45">E3 回覆：{review.error.message}</p>
			</section>
		);
	if (review.isPending) return <Lines n={5} />;

	const counts = questions.reduce<Record<string, number>>((m, q) => ((m[q.verdict] = (m[q.verdict] ?? 0) + 1), m), {});

	return (
		<section className="space-y-4">
			<div className="card-quiet flex flex-wrap items-center gap-x-4 gap-y-3 p-4">
				<div className="min-w-0 grow">
					<h2 className="font-semibold">第 {attempt.attempt} 次作答的結果</h2>
					<p className="mt-0.5 flex flex-wrap gap-x-3 text-sm text-base-content/60">
						{gradeText !== null && (
							<span>
								總分{" "}
								<strong className="text-base-content tabular-nums">
									{gradeText} / {formatGrade(quiz.grade, quiz)}
								</strong>
							</span>
						)}
						{(["correct", "partial", "incorrect", "pending"] as const).map(v => counts[v] && <span key={v}>{`${VERDICT[v].label} ${counts[v]} 題`}</span>)}
					</p>
				</div>
				{questions.length > 0 && (
					<div className="flex flex-col items-end gap-1">
						<button className="btn btn-sm btn-neutral" onClick={copy}>
							{copied === "ok" ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
							{copied === "ok" ? "已複製" : "複製給 AI 的詳解 prompt"}
						</button>
						<LangPicker lang={lang} onLang={onLang} />
					</div>
				)}
				{copied === "fail" && <p className="w-full text-xs text-error">瀏覽器不讓 EM3 寫入剪貼簿，請打開下面的預覽手動複製。</p>}
				{questions.length > 0 && (
					<details className="w-full text-sm" open={copied === "fail"}>
						<summary className="cursor-pointer text-xs text-base-content/50">預覽 prompt</summary>
						<textarea readOnly className="textarea mt-2 h-64 w-full font-mono text-xs" value={prompt} onFocus={e => e.currentTarget.select()} />
					</details>
				)}
			</div>

			{!questions.length && <p className="card-quiet p-5 text-sm text-base-content/60">老師沒有開放檢閱題目。</p>}
			<ol className="space-y-3">
				{questions.map((q, i) => (
					<li key={q.slot}>
						<QuestionCard q={q} index={i + 1} />
					</li>
				))}
			</ol>
		</section>
	);
}

function QuestionCard({ q, index }: { q: ReviewQuestion; index: number }) {
	const v = VERDICT[q.verdict];
	return (
		<article className="card-quiet p-5">
			<header className="mb-3 flex flex-wrap items-center gap-2">
				<h3 className="text-sm font-semibold text-base-content/60">第 {q.number ?? index} 題</h3>
				{(q.status || v.label) && <span className={`badge badge-sm badge-soft ${v.tone}`}>{q.status || v.label}</span>}
				{q.mark !== null && q.maxmark !== null && (
					<span className="ml-auto text-sm tabular-nums text-base-content/60">
						{q.mark} / {q.maxmark}
					</span>
				)}
			</header>
			{q.textHtml && <div className="prose-e3" dangerouslySetInnerHTML={{ __html: cleanHtml(q.textHtml) }} />}
			{q.options.length > 0 && (
				<ul className="mt-3 space-y-1.5">
					{q.options.map((o, i) => (
						<OptionRow key={i} o={o} />
					))}
				</ul>
			)}
			{q.formulationHtml && (
				<div
					className="prose-e3 mt-3 rounded-xl bg-base-content/[0.03] p-3 text-sm [&_input]:pointer-events-none [&_select]:pointer-events-none"
					dangerouslySetInnerHTML={{ __html: cleanHtml(q.formulationHtml) }}
				/>
			)}
			{(q.rightAnswer || q.specificFeedback || q.generalFeedback) && (
				<div className="mt-4 space-y-2 text-sm">
					{q.rightAnswer && <p className="rounded-xl bg-success/10 px-3 py-2">{q.rightAnswer}</p>}
					{q.specificFeedback && <div className="prose-e3 text-base-content/75" dangerouslySetInnerHTML={{ __html: cleanHtml(q.specificFeedback) }} />}
					{q.generalFeedback && (
						<div className="rounded-xl border hairline px-3 py-2">
							<p className="mb-1 text-xs font-semibold text-base-content/50">解說</p>
							<div className="prose-e3 text-base-content/80" dangerouslySetInnerHTML={{ __html: cleanHtml(q.generalFeedback) }} />
						</div>
					)}
				</div>
			)}
		</article>
	);
}

function OptionRow({ o }: { o: ReviewOption }) {
	const v = o.verdict ? VERDICT[o.verdict] : null;
	const tone =
		o.verdict === "correct"
			? "border-success/40 bg-success/[0.06]"
			: o.verdict === "incorrect"
				? "border-error/40 bg-error/[0.06]"
				: o.verdict === "partial"
					? "border-warning/40 bg-warning/[0.06]"
					: o.chosen
						? "border-base-content/25"
						: "border-transparent";
	return (
		<li className={`flex items-start gap-2 rounded-xl border px-3 py-2 text-sm ${tone}`}>
			<span className="w-5 shrink-0 font-medium text-base-content/50">{o.label}</span>
			<span className="prose-e3 min-w-0 grow [&_p]:m-0" dangerouslySetInnerHTML={{ __html: cleanHtml(o.html) }} />
			{o.chosen && <span className="shrink-0 text-xs text-base-content/50">你的選擇</span>}
			{v && <v.Icon size={18} weight="fill" className={`shrink-0 ${v.color}`} aria-label={v.label} />}
		</li>
	);
}

function LangPicker({ lang, onLang }: { lang: PromptLang; onLang: (l: PromptLang) => void }) {
	return (
		<label className="flex items-center gap-1 text-xs whitespace-nowrap text-base-content/50">
			prompt 語言
			<select className="select select-ghost select-xs w-auto" value={lang} onChange={e => onLang(e.target.value as PromptLang)}>
				{(Object.keys(PROMPT_LANG_LABEL) as PromptLang[]).map(l => (
					<option key={l} value={l}>
						{PROMPT_LANG_LABEL[l]}
					</option>
				))}
			</select>
		</label>
	);
}

/**
 * For practice quizzes the teacher lets students discuss with AI: copies the
 * questions of the attempt in progress, starting one first if needed (after an
 * explicit confirmation, since that starts the timer and uses an attempt).
 */
function PracticeCopy({
	quiz,
	unfinished,
	used,
	courseName,
	lang,
	onLang
}: {
	quiz: Quiz;
	unfinished: QuizAttempt | undefined;
	used: number;
	courseName: string;
	lang: PromptLang;
	onLang: (l: PromptLang) => void;
}) {
	const qc = useQueryClient();
	const dialog = useRef<HTMLDialogElement>(null);
	const [busy, setBusy] = useState(false);
	const [done, setDone] = useState<{ attemptId: number; count: number; text: string; copied: boolean } | null>(null);
	const [error, setError] = useState<string | null>(null);

	// Must run inside the click: the clipboard write is queued before any request.
	function run(start: boolean) {
		dialog.current?.close();
		setBusy(true);
		setError(null);
		let attemptId = unfinished?.id ?? 0;
		let count = 0;
		copyWhenReady(async () => {
			if (start) {
				attemptId = (await startAttempt(quiz.id)).id;
				void qc.invalidateQueries({ queryKey: ["quiz-attempts"] });
			}
			const questions = (await attemptQuestions(attemptId)).sort((a, b) => a.slot - b.slot).map(parseQuestion);
			count = questions.length;
			return buildStudyPrompt({ mode: "practice", course: courseName, quiz, questions, lang });
		})
			.then(r => setDone({ attemptId, count, ...r }))
			.catch(e => setError(e instanceof Error ? e.message : String(e)))
			.finally(() => setBusy(false));
	}

	const attemptUrl = done ? e3Link(`/mod/quiz/attempt.php?attempt=${done.attemptId}&cmid=${quiz.coursemodule}`) : "";
	const left = quiz.attempts ? quiz.attempts - used : null;

	return (
		<div className="mt-4 border-t hairline pt-4">
			<button className="btn btn-sm w-full" disabled={busy} onClick={() => (unfinished ? run(false) : dialog.current?.showModal())}>
				{busy ? <span className="loading loading-spinner loading-xs" /> : <ChatsCircleIcon size={16} />}
				{unfinished ? "複製題目給 AI 討論" : "開始並複製題目"}
			</button>
			<p className="mt-1.5 text-xs text-base-content/50">老師允許和 AI 討論的練習題用。</p>
			<div className="mt-1 flex justify-end">
				<LangPicker lang={lang} onLang={onLang} />
			</div>
			{error && <p className="mt-2 text-xs text-error">沒辦法開始或讀取作答：{error}。可以先到 E3 開始作答，再回來複製。</p>}
			{done && (
				<div className="mt-2 rounded-xl bg-success/10 p-3 text-sm">
					<p className="flex items-center gap-1.5 font-medium">
						<CheckIcon size={16} />
						{done.copied ? `已複製 ${done.count} 題` : `已讀取 ${done.count} 題，但瀏覽器不讓 EM3 寫入剪貼簿`}
					</p>
					{!done.copied && <textarea readOnly className="textarea mt-2 h-40 w-full font-mono text-xs" value={done.text} onFocus={e => e.currentTarget.select()} />}
					<a className="link mt-1 inline-flex items-center gap-1 text-xs" href={attemptUrl} target="_blank" rel="noreferrer">
						到 E3 作答並提交 <ArrowSquareOutIcon size={12} />
					</a>
				</div>
			)}

			<dialog ref={dialog} className="modal modal-bottom sm:modal-middle" aria-labelledby="start-copy-title">
				<div className="modal-box max-w-md">
					<h3 id="start-copy-title" className="text-lg font-semibold">
						在 E3 開始作答並複製題目
					</h3>
					<ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-base-content/75">
						<li>
							會在 E3 開始第 {used + 1} 次作答{quiz.timelimit ? `，限時 ${Math.round(quiz.timelimit / 60)} 分鐘會馬上開始計時` : "。這份測驗不限時"}。
						</li>
						<li>{left !== null ? `會用掉一次作答機會，之後還剩 ${left - 1} 次。` : "這份測驗不限作答次數。"}</li>
						<li>EM3 不會幫你作答或提交，複製後請回到 E3 作答並按「提交」。</li>
						<li className="font-medium text-base-content">請先確認這門課允許和 AI 討論；有些課把這視為作弊。</li>
					</ul>
					<div className="modal-action">
						<form method="dialog">
							<button className="btn btn-ghost">取消</button>
						</form>
						<button className="btn btn-primary" onClick={() => run(true)}>
							開始並複製
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
