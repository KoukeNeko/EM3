import { MoodleError } from "@/lib/moodle/client";
import { DEFAULT_MOODLE_URL, MOODLE_SITES } from "@/lib/moodle/site";
import { registerSsoHandler, startSso } from "@/lib/moodle/sso";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
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
	const [baseUrl, setBaseUrl] = useState(DEFAULT_MOODLE_URL);
	const [showOtherSchools, setShowOtherSchools] = useState(false);
	const [customSite, setCustomSite] = useState(false);
	const [remember, setRemember] = useState(true);
	const [reveal, setReveal] = useState(false);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const site = MOODLE_SITES.find(site => site.baseUrl === baseUrl);
	const sso = site?.sso;
	const passwordLogin = site?.password !== false;
	const [ssoLink, setSsoLink] = useState("");

	async function submit(e: FormEvent) {
		e.preventDefault();
		setBusy(true);
		setError(null);
		try {
			await signIn(baseUrl, username, password, remember);
			const target = next?.replace(/^#/, "");
			await navigate({ to: target && target !== "/login" ? target : "/" });
		} catch (err) {
			setError(err instanceof MoodleError && err.code === "invalidlogin" ? "學號或密碼不正確" : err instanceof Error ? err.message : "登入失敗，請稍後再試");
		} finally {
			setBusy(false);
		}
	}

	const pasteSsoLink = () => navigate({ to: "/sso", search: { u: ssoLink } });

	return (
		<main className="relative flex min-h-dvh flex-col items-center justify-center overflow-x-hidden bg-base-200 px-4 py-6">
			<Backdrop />
			<motion.div
				initial={{ opacity: 0, y: 24, scale: 0.98 }}
				animate={{ opacity: 1, y: 0, scale: 1 }}
				transition={{ type: "spring", stiffness: 260, damping: 28 }}
				className="surface relative w-full max-w-md rounded-[1.75rem] p-7 shadow-2xl sm:p-9"
			>
				<div className="mb-8 flex items-center gap-3">
					<Logo size={52} />
					<div>
						<h1 className="text-xl font-semibold tracking-tight">EM3</h1>
						<p className="text-sm text-base-content/60">更快、更人類的 Moodle</p>
					</div>
				</div>
				{!showOtherSchools && <p className="mb-5 text-sm font-medium text-base-content/70">使用陽明交通大學 E3 登入</p>}

				<form onSubmit={submit} className="space-y-4">
					{showOtherSchools && (
						<fieldset className="fieldset">
							<label htmlFor="moodle-site" className="fieldset-legend">
								學校
							</label>
							<select
								id="moodle-site"
								aria-label="選擇 Moodle 學校"
								className="select select-lg w-full"
								value={customSite ? "custom" : baseUrl}
								onChange={e => {
									const custom = e.target.value === "custom";
									setCustomSite(custom);
									setBaseUrl(custom ? "" : e.target.value);
									if (MOODLE_SITES.find(site => site.baseUrl === e.target.value)?.sso) registerSsoHandler();
								}}
							>
								{MOODLE_SITES.map(site => (
									<option key={site.baseUrl} value={site.baseUrl}>
										{site.name}
									</option>
								))}
								<option value="custom">其他學校／自訂 Moodle 網址</option>
							</select>
							{customSite && (
								<>
									<input
										type="text"
										inputMode="url"
										className="input input-lg mt-2 w-full"
										autoComplete="url"
										required
										placeholder="https://moodle.example.edu.tw"
										value={baseUrl}
										onChange={e => setBaseUrl(e.target.value)}
									/>
									<p className="label">可貼上 Moodle 首頁或登入頁網址。</p>
								</>
							)}
						</fieldset>
					)}
					{passwordLogin && (
						<>
							<label className="input input-lg w-full">
								<UserIcon size={18} className="opacity-50" />
								<input className="grow" autoComplete="username" inputMode="text" required placeholder="帳號或學號" value={username} onChange={e => setUsername(e.target.value)} />
							</label>
							<label className="input input-lg w-full pr-2">
								<LockSimpleIcon size={18} className="opacity-50" />
								<input
									type={reveal ? "text" : "password"}
									className="grow"
									autoComplete="current-password"
									required
									placeholder="Moodle 密碼"
									value={password}
									onChange={e => setPassword(e.target.value)}
								/>
								<button type="button" className="btn btn-ghost btn-sm btn-circle" onClick={() => setReveal(r => !r)} aria-label={reveal ? "隱藏密碼" : "顯示密碼"}>
									{reveal ? <EyeSlashIcon size={16} /> : <EyeIcon size={16} />}
								</button>
							</label>
						</>
					)}

					<label className="flex cursor-pointer items-center gap-2 text-sm">
						<input type="checkbox" className="checkbox checkbox-sm" checked={remember} onChange={e => setRemember(e.target.checked)} />
						保持登入 90 天
					</label>

					{error && (
						<motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} role="alert" className="text-sm text-error">
							{error}
						</motion.p>
					)}

					{passwordLogin && (
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
					)}
				</form>

				{sso && (
					<div className="mt-4 space-y-2">
						<button type="button" className={`btn w-full ${passwordLogin ? "btn-outline" : "btn-neutral btn-lg"}`} disabled={busy} onClick={() => startSso(baseUrl, sso.provider, remember, next)}>
							使用學校單一登入（SSO）
						</button>
						{"registerProtocolHandler" in navigator && (
							<p className="text-xs leading-relaxed text-base-content/60">瀏覽器若詢問是否允許開啟 web+emthree 連結，請先按「允許」再登入，登入後就會自動回到 EM3。</p>
						)}
						{/* Safari cannot register the web+emthree handler, so there the paste box is the main path. */}
						<details open={!("registerProtocolHandler" in navigator)} className="text-xs text-base-content/60">
							<summary className="cursor-pointer">單一登入完成後沒有回到 EM3？</summary>
							<p className="mt-2 leading-relaxed">
								在 {sso.pageName ?? "Moodle"} 的完成頁面對「{sso.linkText ?? "若應用程式沒有自動開啟，請點選這裡"}」的連結按右鍵複製連結，貼在這裡。
							</p>
							<div className="join mt-2 w-full">
								<input className="input input-sm join-item grow" placeholder="web+emthree://token=…" value={ssoLink} onChange={e => setSsoLink(e.target.value)} />
								<button type="button" className="btn btn-sm join-item" disabled={!ssoLink.trim()} onClick={pasteSsoLink}>
									完成登入
								</button>
							</div>
						</details>
					</div>
				)}
				<button
					type="button"
					className="btn btn-ghost btn-sm mt-2 w-full font-normal text-base-content/60"
					onClick={() => {
						if (showOtherSchools) {
							setBaseUrl(DEFAULT_MOODLE_URL);
							setCustomSite(false);
						}
						setShowOtherSchools(value => !value);
					}}
				>
					{showOtherSchools ? "改用陽明交通大學 E3" : "不是陽明交大的學生？選擇其他學校"}
				</button>

				<p className="mt-6 flex gap-2 text-xs leading-relaxed text-base-content/55">
					<ShieldCheckIcon size={16} className="mt-0.5 shrink-0" />
					這是個靜態網頁，密碼不會傳到 EM3 伺服器。
				</p>
			</motion.div>
			<Link to="/welcome" className="relative mt-6 text-sm text-base-content/55 hover:text-base-content">
				EM3 是什麼？
			</Link>
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
