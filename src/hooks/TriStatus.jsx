import { useCallback, useMemo } from "react";

/**
 * Estados (por default):
 * 1 = Abierto
 * 2 = Concluido
 * 3 = Anulado
 *
 * Reglas default:
 * - Switch (tabs) solo si status actual es 1 o 3
 * - No se permite tocar 2 desde tabs
 * - Acción secundaria "Concluir": 1 -> 2
 *
 * 100% UI: no hace API, solo controla estado local.
 */
export default function useTriStatus({
	value, // status number
	onChange, // (next:number) => void
	disabled = false,

	title = "Estatus",
	labels = { 1: "Abierto", 2: "Concluido", 3: "Anulado" },
	switchOptions = [1, 3],

	canSwitch = (s) => s === 1 || s === 3,

	secondaryActionLabel = "Concluir",
	canSecondary = (s) => s === 1,
	secondaryAction = (s) => (s === 1 ? 2 : s),

	helpText,
}) {
	const s = Number(value ?? 0);

	const label = useMemo(() => labels?.[s] ?? "—", [labels, s]);

	const badgeClass = useMemo(() => {
		if (s === 1) {
			return "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800";
		}
		if (s === 2) {
			return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200 border-blue-200 dark:border-blue-800";
		}
		if (s === 3) {
			return "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700";
		}
		return "bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800";
	}, [s]);

	const canRenderSwitch = useMemo(() => canSwitch(s), [canSwitch, s]);
	const canDoSecondary = useMemo(() => canSecondary(s), [canSecondary, s]);

	const finalHelpText = useMemo(() => {
		if (helpText) return helpText;
		if (s === 2) return "Estatus concluido: no se puede modificar desde aquí.";
		return "Selecciona el estatus o ejecuta la acción disponible.";
	}, [helpText, s]);

	const select = useCallback(
		(next) => {
			if (disabled) return;
			if (!onChange) return;

			const current = Number(value ?? 0);
			if (!canSwitch(current)) return;

			if (!switchOptions.includes(next)) return;

			onChange(next);
		},
		[disabled, onChange, value, canSwitch, switchOptions],
	);

	const secondary = useCallback(() => {
		if (disabled) return;
		if (!onChange) return;

		const current = Number(value ?? 0);
		if (!canSecondary(current)) return;

		const next = secondaryAction(current);
		onChange(next);
	}, [disabled, onChange, value, canSecondary, secondaryAction]);

	return {
		title,
		s,
		label,
		labels,
		badgeClass,
		helpText: finalHelpText,

		canRenderSwitch,
		switchOptions,

		canDoSecondary,
		secondaryActionLabel,

		select,
		secondary,
	};
}
