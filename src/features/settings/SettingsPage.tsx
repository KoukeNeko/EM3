import { idbPersister, queryClient } from "@/app/queryClient";
import { useSession } from "@/features/auth/session";
import { useSiteInfo } from "@/features/courses/api";
import { type CalendarSpan, exportPrefs, importPrefs, usePrefs } from "@/features/preferences/store";
import { isIos, isStandalone, useInstallPrompt } from "@/shared/pwa/install";
import { Avatar } from "@/shared/ui/Avatar";
import { PageTitle } from "@/shared/ui/States";
import { ArrowsClockwiseIcon, CheckIcon, DesktopIcon, DeviceMobileIcon, DownloadSimpleIcon, ExportIcon, SignOutIcon, TrashIcon, UploadSimpleIcon } from "@phosphor-icons/react";
import { Link, useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { type ReactNode, useRef, useState } from "react";
import { ALL_THEMES, type ThemeInfo } from "./themes";

function Section({ title, desc, children }: { title: string; desc?: string; children: ReactNode }) {
	return (
		<section className="grid grid-cols-1 gap-4 border-t hairline py-8 first:border-t-0 first:pt-0 md:grid-cols-[14rem_1fr]">
			<div>
				<h2 className="font-semibold">{title}</h2>
				{desc && <p className="mt-1 text-sm text-base-content/55">{desc}</p>}
			</div>
			<div className="min-w-0">{children}</div>
		</section>
	);
}

export function SettingsPage() {
	const { data: me } = useSiteInfo();
	const prefs = usePrefs();
	const signOut = useSession(s => s.signOut);
	const baseUrl = useSession(s => s.baseUrl);
	const navigate = useNavigate();
	const fileInput = useRef<HTMLInputElement>(null);
	const [msg, setMsg] = useState<string | null>(null);

	function download() {
		const blob = new Blob([exportPrefs()], { type: "application/json" });
		const a = document.createElement("a");
		a.href = URL.createObjectURL(blob);
		a.download = `em3-settings-${new Date().toISOString().slice(0, 10)}.json`;
		a.click();
		URL.revokeObjectURL(a.href);
	}

	async function upload(file: File) {
		try {
			importPrefs(await file.text());
			setMsg("已匯入設定");
		} catch (e) {
			setMsg(e instanceof Error ? `匯入失敗：${e.message}` : "匯入失敗");
		}
	}

	async function logout() {
		signOut();
		queryClient.clear();
		await idbPersister.removeClient();
		await navigate({ to: "/login" });
	}

	return (
		<div className="max-w-4xl">
			<PageTitle title="設定" subtitle="這裡的設定都只存在這個瀏覽器（localStorage），不會改到 Moodle。" />

			<Section title="帳號" desc="EM3 使用 Moodle 行動版 API 的憑證登入。">
				<div className="card-quiet flex flex-wrap items-center gap-4 p-4">
					{me && <Avatar me={me} size={48} />}
					<div className="min-w-0 grow">
						<p className="font-semibold">{me?.firstname}</p>
						<p className="text-sm text-base-content/55">
							{me?.lastname} · {me?.username}
						</p>
						<p className="truncate text-xs text-base-content/40">{baseUrl}</p>
					</div>
					<button className="btn btn-sm" onClick={logout}>
						<SignOutIcon size={16} />
						登出
					</button>
				</div>
			</Section>

			<Section title="個人" desc="首頁怎麼稱呼你、行事曆預設怎麼看。">
				<div className="space-y-4">
					<fieldset className="fieldset">
						<legend className="fieldset-legend">稱呼</legend>
						<input className="input w-full max-w-xs" placeholder={me?.firstname ?? ""} value={prefs.nickname} onChange={e => prefs.set("nickname", e.target.value)} />
						<p className="label">空白就用 Moodle 上的名字。</p>
					</fieldset>
					{(
						[
							["calendarSpan", "首頁行事曆預設範圍"],
							["calendarPageSpan", "行事曆頁預設範圍"]
						] as const
					).map(([key, legend]) => (
						<fieldset key={key} className="fieldset">
							<legend className="fieldset-legend">{legend}</legend>
							<div className="join">
								{(
									[
										["week", "一週"],
										["twoWeeks", "兩週"],
										["month", "一個月"]
									] as [CalendarSpan, string][]
								).map(([k, label]) => (
									<button key={k} className={`btn join-item btn-sm ${prefs[key] === k ? "btn-active" : ""}`} onClick={() => prefs.set(key, k)}>
										{label}
									</button>
								))}
							</div>
						</fieldset>
					))}
					<label className="flex max-w-sm cursor-pointer items-center justify-between gap-3 text-sm">
						行事曆顯示週末
						<input type="checkbox" className="toggle toggle-sm" checked={prefs.showWeekend} onChange={e => prefs.set("showWeekend", e.target.checked)} />
					</label>
					<label className="flex max-w-sm cursor-pointer items-center justify-between gap-3 text-sm">
						減少動畫
						<input type="checkbox" className="toggle toggle-sm" checked={prefs.motion === "reduced"} onChange={e => prefs.set("motion", e.target.checked ? "reduced" : "full")} />
					</label>
					<p className="text-sm text-base-content/55">
						課程的顏色、圖示、簡稱在{" "}
						<Link to="/courses" className="link">
							課程
						</Link>{" "}
						裡點圖示設定；上課時間在{" "}
						<Link to="/timetable" className="link">
							課表
						</Link>
						。
					</p>
				</div>
			</Section>

			<Section title="主題" desc={`daisyUI 的 ${ALL_THEMES.length - 2} 個主題，加上 EM3 自己的淺色和深色。`}>
				<div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
					<ThemeCard name="system" label="跟隨系統" active={prefs.theme === "system"} onPick={() => prefs.set("theme", "system")} />
					{ALL_THEMES.map(t => (
						<ThemeCard key={t.name} name={t.name} info={t} active={prefs.theme === t.name} onPick={() => prefs.set("theme", t.name)} />
					))}
				</div>
			</Section>

			<Section title="App" desc="把 EM3 裝到主畫面或 Dock，會在自己的視窗打開；沒有網路時也能看上次載入的內容。">
				<InstallApp />
			</Section>

			<Section title="資料" desc="匯出成 JSON 備份，或帶到另一台電腦。檔案內容只有 EM3 的設定，沒有密碼或登入憑證。">
				<div className="flex flex-wrap gap-2">
					<button className="btn btn-sm" onClick={download}>
						<DownloadSimpleIcon size={16} />
						匯出設定
					</button>
					<button className="btn btn-sm" onClick={() => fileInput.current?.click()}>
						<UploadSimpleIcon size={16} />
						匯入設定
					</button>
					<input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={e => e.target.files?.[0] && upload(e.target.files[0])} />
					<button
						className="btn btn-sm"
						onClick={async () => {
							queryClient.clear();
							await idbPersister.removeClient();
							await queryClient.refetchQueries();
							setMsg("已清除快取並重新讀取 Moodle");
						}}
					>
						<ArrowsClockwiseIcon size={16} />
						清除快取
					</button>
					<button
						className="btn btn-sm btn-ghost text-error"
						onClick={() => {
							if (confirm("確定要把 EM3 的設定（主題、課程外觀、課表、已讀紀錄）全部還原？")) {
								prefs.reset();
								setMsg("已還原預設值");
							}
						}}
					>
						<TrashIcon size={16} />
						全部還原
					</button>
				</div>
				{msg && (
					<motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="mt-3 text-sm text-base-content/70">
						{msg}
					</motion.p>
				)}
				<details className="mt-4 text-sm">
					<summary className="cursor-pointer text-base-content/55">目前存了什麼</summary>
					<ul className="mt-2 space-y-1 text-base-content/65">
						<li>課程外觀：{Object.keys(prefs.courses).length} 門</li>
						<li>課表：{Object.keys(prefs.timetable).length} 門</li>
						<li>已讀公告：{Object.keys(prefs.seen).length} 則</li>
					</ul>
				</details>
			</Section>

			<Section title="關於" desc="EM3 是非官方的 Moodle 客戶端。">
				<p className="text-sm leading-relaxed text-base-content/65">
					EM3 是純前端的靜態網站，直接在你的瀏覽器裡呼叫所選學校的 Moodle 行動版 API，沒有中間伺服器。密碼只用來換取登入憑證，不會被儲存；憑證放在這個網站的 cookie。Moodle 的資料會快取在瀏覽器的
					IndexedDB 裡加快下次開啟速度，登出時會一併清除。
					{me && <span className="mt-2 block text-xs text-base-content/45">Moodle {me.release}</span>}
				</p>
			</Section>
		</div>
	);
}

function ThemeCard({ name, label, info, active, onPick }: { name: string; label?: string; info?: ThemeInfo; active: boolean; onPick: () => void }) {
	return (
		<button
			onClick={onPick}
			data-theme={info ? name : undefined}
			className={`relative overflow-hidden rounded-xl border text-left transition hover:-translate-y-0.5 ${active ? "border-base-content ring-2 ring-base-content/20" : "border-base-content/10"}`}
			style={info ? { backgroundColor: info.swatch[0], color: info.swatch[4] } : undefined}
			aria-pressed={active}
		>
			{info ? (
				<div className="flex gap-1 px-3 pt-3">
					{info.swatch.slice(1, 4).map((c, i) => (
						<span key={i} className="h-5 w-4 rounded-md" style={{ backgroundColor: c }} />
					))}
				</div>
			) : (
				<div className="flex px-3 pt-3">
					<DesktopIcon size={20} />
				</div>
			)}
			<div className="flex items-center justify-between px-3 pt-2 pb-3 text-sm font-medium">
				{label ?? name}
				{active && <CheckIcon size={15} weight="bold" />}
			</div>
		</button>
	);
}

function InstallApp() {
	const install = useInstallPrompt();
	if (isStandalone())
		return (
			<p className="flex items-center gap-2 text-sm text-base-content/70">
				<CheckIcon size={16} className="text-success" />
				你現在用的就是安裝好的 App。
			</p>
		);
	if (install)
		return (
			<button className="btn btn-sm btn-primary" onClick={install}>
				<DeviceMobileIcon size={16} />
				安裝 EM3
			</button>
		);
	if (isIos())
		return (
			<p className="text-sm leading-relaxed text-base-content/70">
				用 Safari 打開這一頁，點下方的分享按鈕 <ExportIcon size={15} className="inline align-[-2px]" />
				，再選「加入主畫面」。
			</p>
		);
	return <p className="text-sm leading-relaxed text-base-content/70">用瀏覽器選單裡的「安裝 EM3」或「加入主畫面」。Firefox 桌面版不支援安裝。</p>;
}
