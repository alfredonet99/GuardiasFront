// BackButton.jsx

import { FiArrowLeft } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

export default function BackButton({
	to = "/",
	label = "Volver",
	className = "",
}) {
	const navigate = useNavigate();

	const baseClasses =
		"px-4 py-2 flex items-center gap-2 rounded-lg " +
		"bg-slate-200 dark:bg-slate-800 " +
		"hover:bg-slate-300 dark:hover:bg-slate-700 " +
		"transition";

	const btnClasses = `${baseClasses} ${className}`.trim();

	const handleClick = () => {
		navigate(to);
	};

	return (
		<button type="button" onClick={handleClick} className={btnClasses}>
			<FiArrowLeft />
			{label}
		</button>
	);
}
