import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { privateInstance } from "../../../api/axios";

import KeyInput from "../../../components/UI/Comunicaciones/KeyInput";
import ExitConfirm from "../../../components/UI/ConfirmBtn/ExitConfirm";
import FlashMessage from "../../../components/UI/Errors/ErrorsGlobal";
import IpInput from "../../../components/UI/InputsReuti/IpInput";
import WordCountInput from "../../../components/UI/WordCount/InputCount";

import useFlashMessage from "../../../hooks/Errors/ErrorMessage";

export default function EditSucursal() {
	const navigate = useNavigate();
	const { id } = useParams(); // <-- /comunicaciones/sucursales/:id/editar
	const { message, showMessage, clearMessage } = useFlashMessage();

	const onFlash = useCallback(
		(text, type = "error") => showMessage(text, type),
		[showMessage],
	);
	const onFlashClear = useCallback(() => clearMessage(), [clearMessage]);

	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);

	// catálogos
	const [plataformas, setPlataformas] = useState([]);
	const [sucursales, setSucursales] = useState([]);

	// form
	const [plataformaSeleccionada, setPlataformaSeleccionada] = useState("");
	const [selectSucursal, setSelectSucursal] = useState("");
	const [host, setHost] = useState("");
	const [ipHost, setIpHost] = useState("");
	const [llaveAlestra, setLlaveAlestra] = useState("");

	// reglas por plataforma
	const needsIp = useMemo(
		() => plataformaSeleccionada === "1" || plataformaSeleccionada === "3",
		[plataformaSeleccionada],
	);
	const needsKey = useMemo(
		() => plataformaSeleccionada === "2",
		[plataformaSeleccionada],
	);

	useEffect(() => {
		// limpia el campo que no aplica cuando cambias plataforma manualmente
		if (needsIp) setLlaveAlestra("");
		if (needsKey) setIpHost("");
	}, [needsIp, needsKey]);

	// 1) Cargar info para editar
	useEffect(() => {
		const fetchEditData = async () => {
			onFlashClear();
			setLoading(true);

			try {
				const { data } = await privateInstance.get(
					`/comunicaciones/sucursales/${id}/editar`,
				);

				// data.data = registro, data.catalogs = catálogos
				const row = data?.data ?? null;
				const catalogs = data?.catalogs ?? {};

				// Catálogos (pueden venir como objeto o como array {value,label})
				// Si vienen como objeto { "1": "Aruba" } los transformamos
				const normalizeToOptions = (v) => {
					if (Array.isArray(v)) return v;
					if (!v || typeof v !== "object") return [];
					return Object.entries(v).map(([value, label]) => ({
						value,
						label,
					}));
				};

				const platOpts = normalizeToOptions(catalogs.plataforma);
				const sucOpts = normalizeToOptions(catalogs.sucursales);

				setPlataformas(platOpts);
				setSucursales(sucOpts);

				if (!row) {
					onFlash("No se encontró la sucursal a editar.", "error");
					return;
				}

				// Precarga formulario
				setPlataformaSeleccionada(String(row.plat ?? ""));
				setSelectSucursal(String(row.nameS ?? ""));
				setHost(String(row.servHost ?? ""));
				setIpHost(String(row.ip ?? ""));
				setLlaveAlestra(String(row.keys ?? ""));
			} catch (e) {
				console.error("[EditSucursal] load error:", e);

				const msg =
					e?.response?.data?.message ||
					(e?.response?.status === 404
						? "Sucursal no encontrada."
						: "No se pudo cargar la información para editar.");

				onFlash(msg, "error");
			} finally {
				setLoading(false);
			}
		};

		if (id) fetchEditData();
	}, [id, onFlash, onFlashClear]);

	const handleSubmit = async () => {
		onFlashClear();

		const sucursal = String(selectSucursal ?? "").trim();
		const plat = String(plataformaSeleccionada ?? "").trim();
		const name = String(host ?? "").trim();
		const ip = String(ipHost ?? "").trim();
		const key = String(llaveAlestra ?? "").trim();

		if (!sucursal) return onFlash("Selecciona una sucursal.", "error");
		if (!plat) return onFlash("Selecciona una plataforma.", "error");
		if (!name)
			return onFlash("Captura el nombre del host o servicio.", "error");

		// reglas por plataforma
		if (plat === "1" || plat === "3") {
			if (!ip) return onFlash("Captura la IP HOST/SERVICIO.", "error");
			if (key)
				return onFlash("No puedes enviar IP y LLAVE al mismo tiempo.", "error");
		} else if (plat === "2") {
			if (!key) return onFlash("Captura la LLAVE ALESTRA.", "error");
			if (ip)
				return onFlash("No puedes enviar IP y LLAVE al mismo tiempo.", "error");
		} else {
			return onFlash("Plataforma inválida.", "error");
		}

		// payload
		const payload = {
			nameS: sucursal,
			servHost: name,
			plat: Number(plat),
			ip: null,
			keys: null,
		};

		if (plat === "1" || plat === "3") payload.ip = ip;
		if (plat === "2") payload.keys = key;

		try {
			setSaving(true);

			// ✅ AJUSTA esta ruta si tu update tiene otra URL
			await privateInstance.put(`/comunicaciones/sucursales/${id}`, payload);

			// regresa al listado
			navigate("/comunicaciones/sucursales");
		} catch (e) {
			console.error("[EditSucursal] submit error:", e);

			const msg =
				e?.response?.data?.message ||
				(e?.response?.status === 422
					? "Validación fallida. Revisa los campos."
					: "No se pudo actualizar la sucursal.");

			onFlash(msg, "error");
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className="min-h-screen w-full px-6 py-6 bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
			<header className="flex items-center justify-between mb-6">
				<h1 className="text-2xl font-bold mx-1">
					{loading ? "Cargando..." : "Editar Sucursal"}
				</h1>
				<ExitConfirm to="/comunicaciones/sucursales" />
			</header>

			<section className="bg-white dark:bg-slate-900 rounded-xl shadow border border-slate-200 dark:border-slate-800 p-6 max-w-3xl mx-auto">
				{loading ? (
					<div className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
						Cargando información...
					</div>
				) : (
					<div className="space-y-5">
						<div>
							<label htmlFor="sucursal_id" className="font-semibold text-sm">
								SUCURSAL <span className="text-red-600">*</span>
							</label>

							<select
								name="sucursal_id"
								id="sucursal_id"
								value={selectSucursal}
								onChange={(e) => setSelectSucursal(e.target.value)}
								disabled={saving}
								className="mt-1 w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-600 outline-none disabled:opacity-60"
							>
								<option value="">Selecciona una sucursal</option>
								{sucursales.map((s) => (
									<option key={String(s.value)} value={String(s.value)}>
										{s.label}
									</option>
								))}
							</select>
						</div>

						<div>
							<label htmlFor="plataforma_id" className="font-semibold text-sm">
								PLATAFORMA <span className="text-red-600">*</span>
							</label>

							<select
								id="plataforma_id"
								name="plataforma_id"
								value={plataformaSeleccionada}
								onChange={(e) => setPlataformaSeleccionada(e.target.value)}
								disabled={saving}
								className="mt-1 w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-600 outline-none disabled:opacity-60"
							>
								<option value="">Selecciona una plataforma</option>
								{plataformas.map((p) => (
									<option key={String(p.value)} value={String(p.value)}>
										{p.label}
									</option>
								))}
							</select>
						</div>

						<WordCountInput
							label="HOST"
							placeholder="PRIMARIO VALLE"
							value={host}
							onChange={setHost}
							required
							maxWords={70}
						/>

						{needsIp ? (
							<IpInput
								label="IP HOST/SERVICIO"
								placeholder="192.168.0.1"
								value={ipHost}
								onChange={setIpHost}
								required
							/>
						) : null}

						{needsKey ? (
							<KeyInput
								label="LLAVE ALESTRA"
								placeholder="ej: abcd-1234-... (minúsculas)"
								value={llaveAlestra}
								onChange={setLlaveAlestra}
								required
								minLength={5}
								maxLength={20}
							/>
						) : null}

						<div className="flex items-center justify-end gap-2 pt-2">
							<button
								type="button"
								onClick={handleSubmit}
								disabled={saving}
								className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition disabled:opacity-50"
							>
								{saving ? "Guardando..." : "Guardar cambios"}
							</button>
						</div>
					</div>
				)}

				<FlashMessage message={message} />
			</section>
		</div>
	);
}
