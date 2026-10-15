import { MoodleError } from "@/lib/moodle/client";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { ArrowRightIcon, EyeIcon, EyeSlashIcon, LockSimpleIcon, ShieldCheckIcon, UserIcon } from "@phosphor-icons/react";
import { motion } from "motion/react";
import { type FormEvent, useState } from "react";
import { useSession } from "./session";
import { Logo } from "@/shared/ui/Logo";

export function LoginPage() {
	const signIn = useSession(s => s.signIn);
	const navigate = useNavigate();
	const { next } = useSearch({ from: "/login" });
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [remember, setRemember] = useState(true);
	const [reveal, setReveal] = useState(false);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function submit(e: FormEvent) {
		e.preventDefault();
		setBusy(true);
		setError(null);
		try {
			await signIn(username, password, remember);
			const target = next?.replace(/^#/, "");
			await navigate({ to: target && target !== "/login" ? target : "/" });
		} catch (err) {
			setError(err instanceof MoodleError && err.code === "invalidlogin" ? "學號或密碼不正確" : err instanceof Error ? err.message : "登入失敗，請稍後再試");
		} finally {
			setBusy(false);
		}
	}

	return (
		<main className="relative grid min-h-dvh place-items-center overflow-hidden bg-base-200 px-4">
			<Backdrop />
			<motion.div
				initial={{ opacity: 0, y: 24, scale: 0.98 }}
				animate={{ opacity: 1, y: 0, scale: 1 }}
				transition={{ type: "spring", stiffness: 260, damping: 28 }}
				className="surface relative w-full max-w-sm rounded-[1.75rem] p-7 shadow-2xl sm:p-9"
			>
				<div className="mb-8 flex items-center gap-3">
					<Logo size={52} />
					<div>
						<h1 className="text-xl font-semibold tracking-tight">EM3</h1>
						<p className="text-sm text-base-content/60">更快、更清楚的交大 E3</p>
					</div>
				</div>

				<form onSubmit={submit} className="space-y-4">
					<label className="input input-lg w-full">
						<UserIcon size={18} className="opacity-50" />
						<input className="grow" autoComplete="username" inputMode="text" autoFocus required placeholder="學號" value={username} onChange={e => setUsername(e.target.value)} />
					</label>
					<label className="input input-lg w-full pr-2">
						<LockSimpleIcon size={18} className="opacity-50" />
						<input type={reveal ? "text" : "password"} className="grow" autoComplete="current-password" required placeholder="E3 密碼" value={password} onChange={e => setPassword(e.target.value)} />
						<button type="button" className="btn btn-ghost btn-sm btn-circle" onClick={() => setReveal(r => !r)} aria-label={reveal ? "隱藏密碼" : "顯示密碼"}>
							{reveal ? <EyeSlashIcon size={16} /> : <EyeIcon size={16} />}
						</button>
					</label>

					<label className="flex cursor-pointer items-center gap-2 text-sm">
						<input type="checkbox" className="checkbox checkbox-sm" checked={remember} onChange={e => setRemember(e.target.checked)} />
						保持登入 90 天
					</label>

					{error && (
						<motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} role="alert" className="text-sm text-error">
							{error}
						</motion.p>
					)}

					<button className="btn btn-neutral btn-lg w-full" disabled={busy}>
						{busy ? (
							<span className="loading loading-spinner loading-sm" />
						) : (
							<>
								登入
								<ArrowRightIcon size={18} weight="bold" />
							</>
						)}
					</button>
				</form>

				<p className="mt-6 flex gap-2 text-xs leading-relaxed text-base-content/55">
					<ShieldCheckIcon size={16} className="mt-0.5 shrink-0" />
					這是個靜態網頁，密碼不會傳到 EM3 伺服器。
				</p>
			</motion.div>
		</main>
	);
}

/** The hand-drawn mark, blown up and softly blurred behind the card, breathing very slowly. */
function Backdrop() {
	return (
		<div aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center overflow-hidden">
			<motion.div
				className="opacity-35 blur-[56px]"
				initial={{ scale: 0.92, rotate: -4 }}
				animate={{ scale: [0.92, 1, 0.92], rotate: [-4, 2, -4] }}
				transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
			>
				<Logo size={1100} className="max-w-[160vw]" />
			</motion.div>
			<div className="absolute inset-0 opacity-[0.07]">
				<Logo size={1100} className="absolute top-1/2 left-1/2 max-w-[160vw] -translate-x-1/2 -translate-y-1/2" />
			</div>
		</div>
	);
}
