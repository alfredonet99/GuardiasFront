export default function TableStateMessage({
	variant = "empty",
	message,
	minHeight = "220px",
}) {
	const isError = variant === "error";

	return (
		<div
			className={[
				"p-6 text-center",
				isError
					? "text-red-600 dark:text-red-300"
					: "text-slate-500 dark:text-slate-400",
			].join(" ")}
			style={{ minHeight }}
		>
			{message}
		</div>
	);
}
