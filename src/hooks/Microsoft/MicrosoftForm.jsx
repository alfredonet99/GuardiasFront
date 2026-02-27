// hooks/Microsoft/MicrosoftForm.js
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { privateInstance } from "../../api/axios";
import useAccordion from "../Accordion";

const FRIENDLY_SAVE_ERROR = "No se pudo guardar, intente más tarde.";

function buildMonitoreoDraft() {
	return {
		id: crypto?.randomUUID?.() ?? String(Date.now() + Math.random()),
		servicioId: "",
		stateId: "",
		revisionDate: null,
		ejecucion: "",
		descripcion: "",
	};
}

function mapToOptions(map) {
	return Object.entries(map ?? {}).map(([value, label]) => ({
		value: String(value),
		label: String(label),
	}));
}

function isNonEmpty(v) {
	return String(v ?? "").trim().length > 0;
}

function isComplete(m) {
	return (
		!!m &&
		isNonEmpty(m.servicioId) &&
		isNonEmpty(m.stateId) &&
		!!m.revisionDate &&
		isNonEmpty(m.ejecucion) &&
		isNonEmpty(m.descripcion)
	);
}

export default function MicrosoftForm(navigate) {
	const [loadingCatalogs, setLoadingCatalogs] = useState(true);
	const [saving, setSaving] = useState(false);

	const [servicios, setServicios] = useState([]);
	const [states, setStates] = useState([]);
	const [monitoreos, setMonitoreos] = useState([buildMonitoreoDraft()]);

	const accordion = useAccordion({ single: false });
	const firstAutoOpenedRef = useRef(false);

	// ✅ Estado derivado (menos memos)
	const { canAddMonitoreo, canSave } = useMemo(() => {
		const last = monitoreos.at(-1);
		const lastComplete = isComplete(last);
		const allComplete = monitoreos.length > 0 && monitoreos.every(isComplete);

		return {
			canAddMonitoreo: !saving && lastComplete,
			canSave: !saving && allComplete,
		};
	}, [monitoreos, saving]);

	// 1) Cargar catálogos (sin alive/return temprano; usando AbortController)
	useEffect(() => {
		const controller = new AbortController();

		const load = async () => {
			try {
				setLoadingCatalogs(true);

				const res = await privateInstance.get(
					"/comunicaciones/microsoft/create",
					{ signal: controller.signal },
				);

				setServicios(mapToOptions(res.data?.servicio));
				setStates(mapToOptions(res.data?.estado));
			} catch {
				// si aborta, igual cae aquí; no pasa nada
				setServicios([]);
				setStates([]);
			} finally {
				setLoadingCatalogs(false);
			}
		};

		void load();

		return () => controller.abort();
	}, []);

	// 2) Auto-abrir el primero
	useEffect(() => {
		if (loadingCatalogs || firstAutoOpenedRef.current || !monitoreos.length)
			return;

		const firstId = monitoreos[0]?.id;
		if (!firstId) return;

		accordion.open(firstId);
		firstAutoOpenedRef.current = true;
	}, [loadingCatalogs, monitoreos, accordion]);

	// 3) CRUD
	const updateMonitoreo = useCallback((id, patch) => {
		setMonitoreos((prev) =>
			prev.map((m) => (m.id === id ? { ...m, ...patch } : m)),
		);
	}, []);

	const handleAddMonitoreo = useCallback(() => {
		if (!canAddMonitoreo) return;

		const next = buildMonitoreoDraft();

		setMonitoreos((prev) => {
			const prevId = prev.at(-1)?.id;
			// cerramos el anterior y abrimos el nuevo después del set
			queueMicrotask(() => {
				if (prevId) accordion.close(prevId);
				accordion.open(next.id);
			});
			return [...prev, next];
		});
	}, [canAddMonitoreo, accordion]);

	const removeMonitoreo = useCallback(
		(id) => {
			setMonitoreos((prev) => {
				if (prev.length <= 1) return prev;

				const next = prev.filter((m) => m.id !== id);

				queueMicrotask(() => {
					accordion.close(id);
					const firstId = next[0]?.id;
					if (firstId) accordion.open(firstId);
				});

				return next;
			});
		},
		[accordion],
	);

	// 4) Submit: OK -> redirige. Error -> throw amigable.
	const submitMonitoreos = useCallback(async () => {
		try {
			setSaving(true);

			if (!canSave) return;

			const payload = {
				monitoreos: monitoreos.map((m) => ({
					serviceName: Number(m.servicioId),
					state: Number(m.stateId),
					revisionDate: m.revisionDate
						? format(m.revisionDate, "yyyy-MM-dd")
						: null,
					ejecution: String(m.ejecucion ?? "").trim(),
					description: String(m.descripcion ?? "").trim(),
				})),
			};

			// ✅ endpoint correcto:
			await privateInstance.post("/comunicaciones/microsoft/store", payload);

			setMonitoreos([buildMonitoreoDraft()]);
			firstAutoOpenedRef.current = false;

			if (typeof navigate === "function") {
				navigate("/comunicaciones/microsoft");
			}
		} catch {
			throw new Error(FRIENDLY_SAVE_ERROR);
		} finally {
			setSaving(false);
		}
	}, [canSave, monitoreos, navigate]);

	return {
		loadingCatalogs,
		saving,
		canSave,
		canAddMonitoreo,
		servicios,
		states,
		monitoreos,
		updateMonitoreo,
		removeMonitoreo,
		handleAddMonitoreo,
		accordion,
		submitMonitoreos,
	};
}
