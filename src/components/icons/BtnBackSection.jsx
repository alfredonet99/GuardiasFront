import { FiArrowLeft } from "react-icons/fi";
export default function BackBtnSection({ label = "Volver", onClick }) {
	const baseClasses =
		"px-4 py-2 flex items-center gap-2 rounded-lg " +
		"bg-slate-200 dark:bg-slate-800 " +
		"hover:bg-slate-300 dark:hover:bg-slate-700 " +
		"transition";
	return (
		<button type="button" onClick={onClick} className={baseClasses}>
			<FiArrowLeft />
			{label}
		</button>
	);
}
