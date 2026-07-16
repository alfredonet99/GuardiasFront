import { formatDate, formatMonthYear } from "./date";

export function getPeriodLabels(data = {}) {
	const weekStart = data?.week?.start;
	const weekEnd = data?.week?.end;
	const monthStart = data?.month?.start;

	const weekLabel =
		weekStart && weekEnd
			? `${formatDate(weekStart)} al ${formatDate(weekEnd)}`
			: "—";

	return {
		week: weekLabel,
		month: formatMonthYear(monthStart),
	};
}

export function mergePendingMonitoreos(serverList = [], previousList = []) {
	const byId = new Map();

	for (const item of serverList) {
		byId.set(Number(item.id), item);
	}

	// Conserva los anulados que ya estaban visibles.
	for (const item of previousList) {
		const id = Number(item.id);
		const status = Number(item.concluido);

		if (status === 3 && !byId.has(id)) {
			byId.set(id, item);
		}
	}

	const serverIds = new Set(serverList.map((item) => Number(item.id)));

	const merged = [...serverList];

	for (const item of previousList) {
		const id = Number(item.id);
		const status = Number(item.concluido);

		if (status === 3 && !serverIds.has(id)) {
			merged.push(item);
		}
	}

	const mergedIds = new Set(merged.map((item) => Number(item.id)));

	for (const [id, item] of byId.entries()) {
		if (!mergedIds.has(id)) {
			merged.push(item);
		}
	}

	return merged;
}
