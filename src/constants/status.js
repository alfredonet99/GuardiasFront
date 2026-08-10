export const STATUS_LABEL = Object.freeze({
	1: "Abierto",
	2: "Concluido",
	3: "Anulado",
});

export const STATUS_BADGE = Object.freeze({
	1: "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800",
	2: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
	3: "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700",
});

export function statusLabel(value) {
	const status = Number(value);

	return STATUS_LABEL[status] ?? String(value ?? "");
}

export function statusBadgeClass(value) {
	const status = Number(value);

	return STATUS_BADGE[status] ?? STATUS_BADGE[3];
}
