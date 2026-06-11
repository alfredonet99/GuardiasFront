import { useEffect, useRef } from "react";

export default function StyleCheck({
	checked = false,
	indeterminate = false,
	onChange,
	disabled = false,
	label = "",
	ariaLabel = "Seleccionar",
	className = "",
}) {
	const inputRef = useRef(null);

	useEffect(() => {
		if (inputRef.current) {
			inputRef.current.indeterminate = indeterminate;
		}
	}, [indeterminate]);

	return (
		<label
			className={`inline-flex items-center gap-2 ${
				disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
			} ${className}`}
		>
			<input
				ref={inputRef}
				type="checkbox"
				checked={checked}
				onChange={onChange}
				disabled={disabled}
				aria-label={ariaLabel}
				className="peer sr-only"
			/>

			<span
				className={`
					flex h-5 w-5 items-center justify-center rounded-md border transition-all duration-200
					peer-focus:ring-2 peer-focus:ring-red-500 peer-focus:ring-offset-2
					peer-focus:ring-offset-white dark:peer-focus:ring-offset-slate-900
					${
						checked || indeterminate
							? "border-red-600 bg-red-600 text-white shadow-sm shadow-red-500/30"
							: "border-slate-300 bg-white text-transparent hover:border-red-400 dark:border-slate-600 dark:bg-slate-800"
					}
				`}
			>
				{indeterminate ? (
					<svg viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5">
						<path
							d="M5 10H15"
							stroke="currentColor"
							strokeWidth="2.5"
							strokeLinecap="round"
						/>
					</svg>
				) : (
					<svg
						viewBox="0 0 20 20"
						fill="none"
						className={`h-3.5 w-3.5 transition-transform duration-200 ${
							checked ? "scale-100" : "scale-0"
						}`}
					>
						<path
							d="M5 10.5L8.5 14L15 6"
							stroke="currentColor"
							strokeWidth="2.5"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</svg>
				)}
			</span>

			{label && (
				<span className="text-sm text-slate-700 dark:text-slate-300">
					{label}
				</span>
			)}
		</label>
	);
}
