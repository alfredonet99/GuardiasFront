import dayjs from "dayjs";
import "dayjs/locale/es";
import isoWeek from "dayjs/plugin/isoWeek";

dayjs.locale("es");
dayjs.extend(isoWeek);

export function formatDate(value) {
	if (!value) return "—";
	const d = dayjs(value);
	return d.isValid() ? d.format("DD/MM/YYYY") : "—";
}

export function formatDateNew(value) {
	if (!value) return "—";
	const d = dayjs(value);
	return d.isValid() ? d.format("dddd D [de] MMMM [del] YYYY") : "—";
}

export function formatDateTime(value) {
	if (!value) return "—";

	const d = dayjs(value);
	if (!d.isValid()) return "—";

	return d.format("dddd D [de] MMMM [del] YYYY - HH:mm");
}

export function formatMonthYear(value) {
	if (!value) return "—";

	const date = dayjs(value);

	if (!date.isValid()) return "—";

	const formatted = date.format("MMMM YYYY");

	return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function getGreeting() {
	const hour = dayjs().hour();

	if (hour >= 5 && hour < 12) {
		return "Buenos días";
	}

	if (hour >= 12 && hour < 19) {
		return "Buenas tardes";
	}

	return "Buenas noches";
}

function capitalize(value = "") {
	return value.charAt(0).toUpperCase() + value.slice(1);
}

export function getRollingWeeks(amount = 3, referenceDate = dayjs()) {
	const currentWeekStart = dayjs(referenceDate).startOf("isoWeek");

	return Array.from({ length: amount }, (_, index) => {
		const weeksBack = amount - 1 - index;

		const start = currentWeekStart.subtract(weeksBack, "week");

		const end = start.endOf("isoWeek");

		/*
		 * El domingo determina a qué mes pertenece
		 * la semana para efectos del filtro.
		 *
		 * Ejemplo:
		 * 27/07 al 02/08 = Semana 1 de agosto.
		 */
		const weekOfMonth = Math.ceil(end.date() / 7);
		const monthName = capitalize(end.format("MMMM"));

		return {
			id: start.format("YYYY-MM-DD"),
			start: start.format("YYYY-MM-DD"),
			end: end.format("YYYY-MM-DD"),
			label: `Semana ${weekOfMonth} de ${monthName} · ${start.format(
				"DD/MM/YYYY",
			)} al ${end.format("DD/MM/YYYY")}`,
		};
	});
}
