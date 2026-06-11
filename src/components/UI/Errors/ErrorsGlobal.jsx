export default function FlashMessage({ message }) {
	if (!message) return null;

	return (
		<div className="mt-2 text-lg font-medium text-red-700 dark:text-red-300 bg-red-100/80 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg px-3 py-2 shadow-sm dark:shadow-none transition-all duration-300 ease-in-out">
			{message.text}
		</div>
	);
}
