import { useCallback, useMemo } from "react";
import { privateInstance } from "../../../../api/axios";
import MonitOk from "../MonitOk";
import MonitProblem from "../MonitProblem";

export default function SiteVeeam({
	step,
	loading,
	data,
	selectedIds,
	setSelectedIds,
	problemForm,
	onProblemChange,
	onContinue,
	onBack,
	onFlash,
	onSuccessRedirect,
}) {
	const items = data?.items ?? [];
	const statusMap = data?.status ?? {};

	const problemItems = useMemo(
		() => items.filter((c) => !selectedIds.has(c.id)),
		[items, selectedIds],
	);

	const hasProblems = useMemo(() => problemItems.length > 0, [problemItems]);

	const veeamProblemStatusOptions = useMemo(() => {
		const base = [{ value: "", label: "Seleccionar estatus" }];
		const keys = ["2", "3", "4", "5", "6"];
		const opts = keys
			.filter((k) => typeof statusMap?.[k] === "string" && statusMap[k].trim())
			.map((k) => ({ value: k, label: statusMap[k] }));
		return [...base, ...opts];
	}, [statusMap]);

	const formatDateRest = useCallback((v) => {
		if (!v) return "Sin registro";
		const d = new Date(v);
		if (Number.isNaN(d.getTime())) return String(v);
		return d.toLocaleString("es-MX", {
			dateStyle: "medium",
			timeStyle: "short",
		});
	}, []);

	const veeamMetaRows = useCallback(
		(c) => [
			{ label: "Backup", value: c.backup ?? "—" },
			{ label: "Jobs", value: c.jobs ?? "—" },
			{ label: "Últ. restauración", value: formatDateRest(c.last_dateRest) },
		],
		[formatDateRest],
	);

	const veeamMetaChips = useCallback(
		(c, f) => [
			{ label: "Backup", value: c.backup ?? "—" },
			{ label: "Jobs", value: c.jobs ?? "—" },
			{
				label: "Últ. punto rest. (capturado)",
				value: f?.last_restore_date || "—",
			},
		],
		[],
	);

	/**
	 * ✅ buildRows: YA NO manda siteApp.
	 * Backend resolverá siteApp basado en client_id (ClienteVeeam.app).
	 */
	const buildRows = useCallback(() => {
		const okBase =
			selectedIds.size > 0 ? items.filter((c) => selectedIds.has(c.id)) : items;

		const probBase = items.filter((c) => !selectedIds.has(c.id));

		const okRows = okBase.map((c) => ({
			client_id: Number(c.id),
			estatus: "1",
			observacion: null,
		}));

		const probRows = probBase.map((c) => {
			const f = problemForm?.[c.id] ?? {};

			const row = {
				client_id: Number(c.id),
				estatus: String(f.estatus || ""),
				observacion: f.observacion?.trim() ? f.observacion.trim() : null,
			};

			// ✅ dateRest opcional
			if (f.last_restore_date && String(f.last_restore_date).trim()) {
				row.dateRest = String(f.last_restore_date).trim(); // "YYYY-MM-DD"
			}

			return row;
		});

		return { okRows, probRows };
	}, [items, selectedIds, problemForm]);

	const validateProblems = useCallback(() => {
		const probBase = items.filter((c) => !selectedIds.has(c.id));
		const missing = [];

		for (const c of probBase) {
			const f = problemForm?.[c.id] ?? {};
			const title = c.label ?? `ID ${c.id}`;

			const statusOk = Boolean(String(f.estatus || "").trim());
			const obs = String(f.observacion || "").trim();
			const obsOk = obs.length > 0;
			const obsTooShort = obsOk && obs.length < 5;

			if (!statusOk || !obsOk || obsTooShort) {
				missing.push({
					title,
					needsStatus: !statusOk,
					needsObs: !obsOk,
					obsTooShort,
				});
			}
		}

		if (missing.length === 0) return null;

		if (missing.length >= 11) {
			let both = 0;
			let onlyStatus = 0;
			let onlyObs = 0;
			let obsTooShortCount = 0;

			for (const m of missing) {
				if (m.obsTooShort) obsTooShortCount++;

				const obsProblem = m.needsObs || m.obsTooShort;

				if (m.needsStatus && obsProblem) both++;
				else if (m.needsStatus) onlyStatus++;
				else if (obsProblem) onlyObs++;
			}

			const parts = [];
			parts.push(`${missing.length} clientes pendientes por completar.`);
			if (both > 0) parts.push(`${both} clientes: Estatus y Observación.`);
			if (onlyStatus > 0) parts.push(`${onlyStatus} clientes: solo Estatus.`);
			if (onlyObs > 0) parts.push(`${onlyObs} clientes: solo Observación.`);
			if (obsTooShortCount > 0) {
				parts.push(
					`${obsTooShortCount} clientes: Observación muy corta (mín. 5 caracteres).`,
				);
			}

			return parts.join(" ");
		}

		const lines = missing.map((m) => {
			const parts = [];
			if (m.needsStatus) parts.push("Estatus");
			if (m.needsObs) parts.push("Observación");
			if (m.obsTooShort) parts.push("Observación (mín. 5 caracteres)");
			return `• ${m.title}: falta ${parts.join(" y ")}`;
		});

		return `Completa los siguientes campos:\n${lines.join("\n")}`;
	}, [items, selectedIds, problemForm]);

	// ✅ Guardar cuando NO hay problemas: envía TODO como OK
	const onSubmitOk = useCallback(async () => {
		const built = buildRows();
		if (!built) return;

		const payload = { site: "veeam", rows: built.okRows };

		try {
			await privateInstance.post("/operaciones/monitoreos/store", payload);
			onFlash?.("Monitoreo guardado correctamente (OK).", "success");
			onSuccessRedirect?.();
		} catch (e) {
			console.error(e);
			onFlash?.(
				e?.response?.data?.message || "Error al guardar monitoreo (OK).",
				"error",
			);
		}
	}, [buildRows, onFlash, onSuccessRedirect]);

	// ✅ Guardar cuando SÍ hay problemas
	const onSubmitProblems = useCallback(async () => {
		const err = validateProblems();
		if (err) {
			onFlash?.(err, "error");
			return;
		}

		const built = buildRows();
		if (!built) return;

		const payload = {
			site: "veeam",
			rows: [...built.okRows, ...built.probRows],
		};

		try {
			await privateInstance.post("/operaciones/monitoreos/store", payload);
			onFlash?.(
				"Monitoreo guardado correctamente (OK + Problemas).",
				"success",
			);
			onSuccessRedirect?.();
		} catch (e) {
			console.error(e);
			onFlash?.(
				e?.response?.data?.message || "Error al guardar monitoreo (Problemas).",
				"error",
			);
		}
	}, [validateProblems, buildRows, onFlash, onSuccessRedirect]);

	return step === 1 ? (
		<MonitOk
			site="veeam"
			loading={loading}
			items={items}
			selectedIds={selectedIds}
			setSelectedIds={setSelectedIds}
			onContinue={onContinue}
			metaRows={veeamMetaRows}
			// ✅ ya no se necesita siteAppId
			hasProblems={hasProblems}
			onSubmitOk={onSubmitOk}
		/>
	) : (
		<MonitProblem
			items={problemItems}
			loading={loading}
			problemForm={problemForm}
			onProblemChange={onProblemChange}
			onBack={onBack}
			statusOptions={veeamProblemStatusOptions}
			metaChips={veeamMetaChips}
			onSubmitProblems={onSubmitProblems}
		/>
	);
}
