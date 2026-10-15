// Every built-in daisyUI 5 theme plus EM3's own pair. The swatches are copied
// from daisyui/theme/object.js so the picker can render previews without
// mounting each theme.

export interface ThemeInfo {
	name: string;
	dark: boolean;
	/** base-100, primary, secondary, accent, base-content */
	swatch: [string, string, string, string, string];
}

export const EM3_THEMES: ThemeInfo[] = [
	{ name: "em3", dark: false, swatch: ["oklch(99.2% 0.002 260)", "oklch(54% 0.17 296)", "oklch(80% 0.12 70)", "oklch(72% 0.13 200)", "oklch(22% 0.012 260)"] },
	{ name: "em3-dark", dark: true, swatch: ["oklch(18% 0.006 260)", "oklch(76% 0.11 300)", "oklch(83% 0.11 72)", "oklch(78% 0.11 200)", "oklch(94% 0.005 260)"] }
];

const RAW: Record<string, [string, string, string, string, string, string]> = {
	light: ["light", "oklch(100% 0 0)", "oklch(45% 0.24 277.023)", "oklch(65% 0.241 354.308)", "oklch(77% 0.152 181.912)", "oklch(21% 0.006 285.885)"],
	dark: ["dark", "oklch(25.33% 0.016 252.42)", "oklch(58% 0.233 277.117)", "oklch(65% 0.241 354.308)", "oklch(77% 0.152 181.912)", "oklch(97.807% 0.029 256.847)"],
	cupcake: ["light", "oklch(97.788% 0.004 56.375)", "oklch(85% 0.138 181.071)", "oklch(89% 0.061 343.231)", "oklch(90% 0.076 70.697)", "oklch(23.574% 0.066 313.189)"],
	bumblebee: ["light", "oklch(100% 0 0)", "oklch(85% 0.199 91.936)", "oklch(75% 0.183 55.934)", "oklch(0% 0 0)", "oklch(20% 0 0)"],
	emerald: ["light", "oklch(100% 0 0)", "oklch(76.662% 0.135 153.45)", "oklch(61.302% 0.202 261.294)", "oklch(72.772% 0.149 33.2)", "oklch(35.519% 0.032 262.988)"],
	corporate: ["light", "oklch(100% 0 0)", "oklch(58% 0.158 241.966)", "oklch(55% 0.046 257.417)", "oklch(60% 0.118 184.704)", "oklch(22.389% 0.031 278.072)"],
	synthwave: ["dark", "oklch(15% 0.09 281.288)", "oklch(71% 0.202 349.761)", "oklch(82% 0.111 230.318)", "oklch(75% 0.183 55.934)", "oklch(78% 0.115 274.713)"],
	retro: ["light", "oklch(91.637% 0.034 90.515)", "oklch(80% 0.114 19.571)", "oklch(92% 0.084 155.995)", "oklch(68% 0.162 75.834)", "oklch(41% 0.112 45.904)"],
	cyberpunk: ["light", "oklch(94.51% 0.179 104.32)", "oklch(74.22% 0.209 6.35)", "oklch(83.33% 0.184 204.72)", "oklch(71.86% 0.217 310.43)", "oklch(0% 0 0)"],
	valentine: ["light", "oklch(97% 0.014 343.198)", "oklch(65% 0.241 354.308)", "oklch(62% 0.265 303.9)", "oklch(82% 0.111 230.318)", "oklch(52% 0.223 3.958)"],
	halloween: ["dark", "oklch(21% 0.006 56.043)", "oklch(77.48% 0.204 60.62)", "oklch(45.98% 0.248 305.03)", "oklch(64.8% 0.223 136.073)", "oklch(84.955% 0 0)"],
	garden: ["light", "oklch(92.951% 0.002 17.197)", "oklch(62.45% 0.278 3.836)", "oklch(48.495% 0.11 355.095)", "oklch(56.273% 0.054 154.39)", "oklch(16.961% 0.001 17.32)"],
	forest: ["dark", "oklch(20.84% 0.008 17.911)", "oklch(68.628% 0.185 148.958)", "oklch(69.776% 0.135 168.327)", "oklch(70.628% 0.119 185.713)", "oklch(83.768% 0.001 17.911)"],
	aqua: ["dark", "oklch(37% 0.146 265.522)", "oklch(85.661% 0.144 198.645)", "oklch(60.682% 0.108 309.782)", "oklch(93.426% 0.102 94.555)", "oklch(90% 0.058 230.902)"],
	lofi: ["light", "oklch(100% 0 0)", "oklch(15.906% 0 0)", "oklch(21.455% 0.001 17.278)", "oklch(26.861% 0 0)", "oklch(0% 0 0)"],
	pastel: ["light", "oklch(100% 0 0)", "oklch(90% 0.063 306.703)", "oklch(89% 0.058 10.001)", "oklch(90% 0.093 164.15)", "oklch(20% 0 0)"],
	fantasy: ["light", "oklch(100% 0 0)", "oklch(37.45% 0.189 325.02)", "oklch(53.92% 0.162 241.36)", "oklch(75.98% 0.204 56.72)", "oklch(27.807% 0.029 256.847)"],
	wireframe: ["light", "oklch(100% 0 0)", "oklch(87% 0 0)", "oklch(87% 0 0)", "oklch(87% 0 0)", "oklch(20% 0 0)"],
	black: ["dark", "oklch(0% 0 0)", "oklch(35% 0 0)", "oklch(35% 0 0)", "oklch(35% 0 0)", "oklch(87.609% 0 0)"],
	luxury: ["dark", "oklch(14.076% 0.004 285.822)", "oklch(100% 0 0)", "oklch(27.581% 0.064 261.069)", "oklch(36.674% 0.051 338.825)", "oklch(75.687% 0.123 76.89)"],
	dracula: ["dark", "oklch(28.822% 0.022 277.508)", "oklch(75.461% 0.183 346.812)", "oklch(74.202% 0.148 301.883)", "oklch(83.392% 0.124 66.558)", "oklch(97.747% 0.007 106.545)"],
	cmyk: ["light", "oklch(100% 0 0)", "oklch(71.772% 0.133 239.443)", "oklch(64.476% 0.202 359.339)", "oklch(94.228% 0.189 105.306)", "oklch(20% 0 0)"],
	autumn: ["light", "oklch(95.814% 0 0)", "oklch(40.723% 0.161 17.53)", "oklch(61.676% 0.169 23.865)", "oklch(73.425% 0.094 60.729)", "oklch(19.162% 0 0)"],
	business: ["dark", "oklch(24.353% 0 0)", "oklch(41.703% 0.099 251.473)", "oklch(64.092% 0.027 229.389)", "oklch(67.271% 0.167 35.791)", "oklch(84.87% 0 0)"],
	acid: ["light", "oklch(98% 0 0)", "oklch(71.9% 0.357 330.759)", "oklch(73.37% 0.224 48.25)", "oklch(92.78% 0.264 122.962)", "oklch(0% 0 0)"],
	lemonade: ["light", "oklch(98.71% 0.02 123.72)", "oklch(58.92% 0.199 134.6)", "oklch(77.75% 0.196 111.09)", "oklch(85.39% 0.201 100.73)", "oklch(19.742% 0.004 123.72)"],
	night: ["dark", "oklch(20.768% 0.039 265.754)", "oklch(75.351% 0.138 232.661)", "oklch(68.011% 0.158 276.934)", "oklch(72.36% 0.176 350.048)", "oklch(84.153% 0.007 265.754)"],
	coffee: ["dark", "oklch(24% 0.023 329.708)", "oklch(71.996% 0.123 62.756)", "oklch(34.465% 0.029 199.194)", "oklch(42.621% 0.074 224.389)", "oklch(72.354% 0.092 79.129)"],
	winter: ["light", "oklch(100% 0 0)", "oklch(56.86% 0.255 257.57)", "oklch(42.551% 0.161 282.339)", "oklch(59.939% 0.191 335.171)", "oklch(41.886% 0.053 255.824)"],
	dim: ["dark", "oklch(30.857% 0.023 264.149)", "oklch(86.133% 0.141 139.549)", "oklch(73.375% 0.165 35.353)", "oklch(74.229% 0.133 311.379)", "oklch(82.901% 0.031 222.959)"],
	nord: ["light", "oklch(95.127% 0.007 260.731)", "oklch(59.435% 0.077 254.027)", "oklch(69.651% 0.059 248.687)", "oklch(77.464% 0.062 217.469)", "oklch(32.437% 0.022 264.182)"],
	sunset: ["dark", "oklch(22% 0.019 237.69)", "oklch(74.703% 0.158 39.947)", "oklch(72.537% 0.177 2.72)", "oklch(71.294% 0.166 299.844)", "oklch(77.383% 0.043 245.096)"],
	caramellatte: ["light", "oklch(98% 0.016 73.684)", "oklch(0% 0 0)", "oklch(22.45% 0.075 37.85)", "oklch(46.44% 0.111 37.85)", "oklch(40% 0.123 38.172)"],
	abyss: ["dark", "oklch(20% 0.08 209)", "oklch(92% 0.2653 125)", "oklch(83.27% 0.0764 298.3)", "oklch(43% 0 0)", "oklch(90% 0.076 70.697)"],
	silk: ["light", "oklch(97% 0.0035 67.78)", "oklch(23.27% 0.0249 284.3)", "oklch(23.27% 0.0249 284.3)", "oklch(23.27% 0.0249 284.3)", "oklch(40% 0.0081 61.42)"]
};

export const DAISY_THEMES: ThemeInfo[] = Object.entries(RAW).map(([name, [scheme, ...swatch]]) => ({ name, dark: scheme === "dark", swatch: swatch as ThemeInfo["swatch"] }));

export const ALL_THEMES = [...EM3_THEMES, ...DAISY_THEMES];

/** Resolve "system" to the EM3 theme matching the OS preference. */
export function resolveTheme(pref: string, prefersDark: boolean) {
	if (pref !== "system") return pref;
	return prefersDark ? "em3-dark" : "em3";
}
