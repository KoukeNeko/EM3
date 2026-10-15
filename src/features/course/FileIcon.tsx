import { FileAudioIcon, FileCodeIcon, FileDocIcon, FileIcon as GenericFileIcon, FileImageIcon, FilePdfIcon, FilePptIcon, FileVideoIcon, FileXlsIcon, FileZipIcon } from "@phosphor-icons/react";
import { fileKind } from "./materials";

const MAP = {
	pdf: { Icon: FilePdfIcon, color: "#e5484d" },
	slides: { Icon: FilePptIcon, color: "#f76b15" },
	doc: { Icon: FileDocIcon, color: "#3e63dd" },
	sheet: { Icon: FileXlsIcon, color: "#30a46c" },
	video: { Icon: FileVideoIcon, color: "#8e4ec6" },
	image: { Icon: FileImageIcon, color: "#12a594" },
	archive: { Icon: FileZipIcon, color: "#978365" },
	code: { Icon: FileCodeIcon, color: "#0090ff" },
	audio: { Icon: FileAudioIcon, color: "#d6409f" },
	file: { Icon: GenericFileIcon, color: "#8b8d98" }
} as const;

export function FileIcon({ ext, size = 22 }: { ext: string; size?: number }) {
	const { Icon, color } = MAP[fileKind(ext)];
	return <Icon size={size} weight="duotone" color={color} className="shrink-0" />;
}
