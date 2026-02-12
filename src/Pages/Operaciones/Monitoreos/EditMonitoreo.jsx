import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ExitConfirm from "../../../components/UI/ConfirmBtn/ExitConfirm";
import { privateInstance } from "../../../api/axios";

import useFlashMessage from "../../../hooks/Errors/ErrorMessage";
import FlashMessage from "../../../components/UI/Errors/ErrorsGlobal";

import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import es from "date-fns/locale/es";

import WordCountTextarea from "../../../components/UI/WordCount/TextAreaCount";

registerLocale("es", es);

function toYmd(date) {
	if (!date) return null;
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, "0");
	const d = String(date.getDate()).padStart(2, "0");
	return `${y}-${m}-${d}`;
}

export default function EditMonitoreo() {
	const { id } = useParams();
	const navigate = useNavigate();

	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);

	const [monitoreo, setMonitoreo] = useState(null);

	const [dateRest, setDateRest] = useState(null);

	const [estatusList, setEstatusList] = useState({});
	const [estatus, setEstatus] = useState("");

	const [observaciones, setObservaciones] = useState("");

	const { message, showMessage, clearMessage } = useFlashMessage();

	useMemo(() => {
		const estOk = String(estatus || "").trim() !== "";
		const obs = String(observaciones || "").trim();
		const obsOk = obs.length >= 5;
		return estOk && obsOk;
	}, [estatus, observaciones]);

	useEffect(() => {
		if (!id) return;

		let alive = true;

		const load = async () => {
			setLoading(true);
			clearMessage();

			try {
				const res = await privateInstance.get(
					`operaciones/monitoreos/${id}/edit`,
				);
				if (!alive) return;

				const m = res.data?.data || res.data?.monitoreo || res.data || null;
				setMonitoreo(m);

				setEstatusList(res.data?.estatus_list || {});
				setEstatus(m?.estatus != null ? String(m.estatus) : "");
				setObservaciones(m?.observacion ? String(m.observacion) : "");

				const raw = (m?.dateRest ?? "").toString().slice(0, 10);
				if (!raw) {
					setDateRest(null);
				} else {
					const [y, mo, d] = raw.split("-").map(Number);
					setDateRest(y && mo && d ? new Date(y, mo - 1, d) : null);
				}
			} catch (e) {
				if (!alive) return;
				showMessage(
					e?.response?.data?.message || "No se pudo cargar el monitoreo.",
					"error",
				);
			} finally {
				if (alive) setLoading(false);
			}
		};

		load();
		return () => {
			alive = false;
		};
	}, [id, clearMessage, showMessage]);

	const handleUpdate = async () => {
		if (!id) return;

		clearMessage();

		if (!String(estatus || "").trim()) {
			showMessage("Selecciona un estatus para guardar.", "error");
			return;
		}

		if (String(observaciones || "").trim().length < 5) {
			showMessage(
				"La observación es obligatoria (mínimo 5 caracteres).",
				"error",
			);
			return;
		}

		setSaving(true);

		try {
			await privateInstance.put(`operaciones/monitoreos/${id}/update`, {
				estatus: Number(estatus),
				dateRest: toYmd(dateRest), // puede ir null
				observacion: String(observaciones).trim(),
			});
			navigate("/operaciones/monitoreos");
		} catch (e) {
			const status = e?.response?.status;

			if (status === 422) {
				const errs = e?.response?.data?.errors || {};
				const first =
					errs.estatus?.[0] ||
					errs.observacion?.[0] ||
					errs.dateRest?.[0] ||
					Object.values(errs).flat()?.[0] ||
					e?.response?.data?.message;

				showMessage(first || "Revisa los campos.", "error");
			} else {
				showMessage(
					e?.response?.data?.message || "No se pudo actualizar el monitoreo.",
					"error",
				);
			}
		} finally {
			setSaving(false);
		}
	};

	if (loading) {
		return (
			<div className="p-6 text-center text-slate-500 dark:text-slate-300">
				Cargando monitoreo...
			</div>
		);
	}

	if (!monitoreo) {
		return (
			<div className="min-h-screen w-full px-6 py-6 bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
				<header className="flex items-center justify-between mb-6">
					<h1 className="text-2xl font-bold mx-1">Editar Monitoreo</h1>
					<ExitConfirm to="/operaciones/monitoreos" />
				</header>

				<section className="bg-white dark:bg-slate-900 rounded-xl shadow border border-slate-200 dark:border-slate-800 p-6 max-w-3xl mx-auto">
					<FlashMessage message={message} />
				</section>
			</div>
		);
	}

	return (
		<div className="min-h-screen w-full px-6 py-6 bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
			<header className="flex items-center justify-between mb-6">
				<h1 className="text-2xl font-bold mx-1">
					Editar Monitoreo {monitoreo?.id} - (
					{monitoreo?.appmv?.nameService ?? "-"})
				</h1>
				<ExitConfirm to="/operaciones/monitoreos" />
			</header>

			<section className="bg-white dark:bg-slate-900 rounded-xl shadow border border-slate-200 dark:border-slate-800 p-6 max-w-3xl mx-auto">
				<div className="space-y-5">
					<div>
						<label htmlFor="" className="font-semibold text-sm">
							CLIENTE
						</label>
						<div className="mt-1 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800">
							{String(monitoreo?.cvm?.nameCV ?? "—")}
						</div>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label htmlFor="" className="font-semibold text-sm">
								Backup
							</label>
							<div className="mt-1 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200">
								{String(monitoreo?.cvm?.backup ?? "—")}
							</div>
						</div>

						<div>
							<label htmlFor="" className="font-semibold text-sm">
								Fecha de Restauración
							</label>
							<div className="mt-1">
								<DatePicker
									selected={dateRest}
									onChange={(d) => setDateRest(d)}
									dateFormat="yyyy-MM-dd"
									placeholderText="Selecciona una fecha"
									isClearable
									locale="es"
									className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-600 outline-none"
								/>
							</div>
						</div>
					</div>

					<div>
						<label htmlFor="estatus" className="font-semibold text-sm">
							Estatus <span className="text-red-600">*</span>
						</label>
						<select
							value={estatus}
							onChange={(e) => setEstatus(e.target.value)}
							className="mt-1 w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-600 outline-none"
						>
							<option value="">Selecciona un estatus</option>
							{Object.entries(estatusList || {}).map(([key, label]) => (
								<option key={key} value={String(key)}>
									{label}
								</option>
							))}
						</select>
					</div>

					<WordCountTextarea
						id={`observaciones-${monitoreo?.id}`}
						name={`observaciones-${monitoreo?.id}`}
						value={observaciones}
						onChange={(v) => setObservaciones(v)}
						required={true}
						minChars={5}
						maxWords={2000}
						rows={4}
						label="Observaciones"
					/>

					<FlashMessage message={message} />

					<div className="pt-2 flex justify-end">
						<button
							type="button"
							onClick={handleUpdate}
							disabled={saving} // ✅ ya NO bloquea por validación
							className={`px-5 py-2 rounded-lg text-white transition shadow-sm ${
								saving
									? "bg-blue-400 cursor-not-allowed"
									: "bg-blue-600 hover:bg-blue-700"
							}`}
						>
							{saving ? "Guardando..." : "Guardar cambios"}
						</button>
					</div>
				</div>
			</section>
		</div>
	);
}
