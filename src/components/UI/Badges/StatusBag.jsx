import { statusBadgeClass, statusLabel } from "../../../constants/status";

function getStatusDotClass(status) {
	switch (Number(status)) {
		case 1:
			return "bg-green-500 dark:bg-green-400";

		case 2:
			return "bg-emerald-500 dark:bg-emerald-400";

		case 3:
		default:
			return "bg-slate-400 dark:bg-slate-500";
	}
}

export default function StatusBadge({ status, label, className = "" }) {
	const numericStatus = Number(status);

	return (
		<span
			className={`
				inline-flex
				items-center
				gap-1.5
				rounded-full
				border
				px-3
				py-1
				text-xs
				font-medium
				transition-colors
				${statusBadgeClass(numericStatus)}
				${className}
			`}
		>
			<span
				aria-hidden="true"
				className={`
					h-1.5
					w-1.5
					shrink-0
					rounded-full
					${getStatusDotClass(numericStatus)}
				`}
			/>

			{label ?? statusLabel(numericStatus)}
		</span>
	);
}
