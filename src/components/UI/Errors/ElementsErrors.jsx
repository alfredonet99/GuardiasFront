import { useEffect, useState } from "react";
export default function FieldError({ message, duration = 3000, resetKey }) {
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		void resetKey;

		if (!message) {
			setVisible(false);
			return;
		}

		setVisible(true);
		const timer = setTimeout(() => setVisible(false), duration);
		return () => clearTimeout(timer);
	}, [message, duration, resetKey]);

	if (!visible || !message) return null;

	return (
		<div
			className="mt-2 text-sm font-medium text-red-700 dark:text-red-300 bg-red-100/80 dark:bg-red-900/30 border border-red-300 dark:border-red-700
        		rounded-lg px-3 py-2 shadow-sm dark:shadow-none transition-all duration-300 ease-in-out"
		>
			{message}
		</div>
	);
}
