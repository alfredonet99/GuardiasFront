import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { privateInstance } from "../../../api/axios";
import KeyInput from "../../../components/UI/Comunicaciones/KeyInput";
import ExitConfirm from "../../../components/UI/ConfirmBtn/ExitConfirm";
import FlashMessage from "../../../components/UI/Errors/ErrorsGlobal";
import IpInput from "../../../components/UI/InputsReuti/IpInput";
import WordCountInput from "../../../components/UI/WordCount/InputCount";

import useFlashMessage from "../../../hooks/Errors/ErrorMessage";

export default function CreateSucursal() {
	const navigate = useNavigate();
	const { message, showMessage, clearMessage } = useFlashMessage();

	const onFlash = useCallback(
		(text, type = "error") => showMessage(text, type),
		[showMessage],
	);
	const onFlashClear = useCallback(() => clearMessage(), [clearMessage]);

	const [plataformas, setPlataformas] = useState([]);
	const [plataformaSeleccionada, setPlataformaSeleccionada] = useState("");
	const [loadingPlataformas, setLoadingPlataformas] = useState(true);

	const [sucursales, setSucursal] = useState([]);
	const [selectSucursal, setSelectSucursal] = useState("");
	const [loadingSucursal, setLoadingSucursal] = useState(true);

	const [host, setHost] = useState("");
	const [ipHost, setIpHost] = useState("");
	const [llaveAlestra, setLlaveAlestra] = useState("");

	const [saving, setSaving] = useState(false);

	useEffect(() => {
		const fetchSucursales = async () => {
			try {
				setLoadingSucursal(true);
				const { data } = await privateInstance.get(
					"/comunicaciones/list/sucursalesCreate",
				);
				setSucursal(data?.data ?? []);
			} catch (error) {
				console.error("Error al cargar sucursales", error);
				setSucursal([]);
				onFlash("No se pudieron cargar las sucursales", "error");
			} finally {
				setLoadingSucursal(false);
			}
		};
		fetchSucursales();
	}, [onFlash]);

	useEffect(() => {
		const fetchPlataformas = async () => {
			try {
				setLoadingPlataformas(true);
				const { data } = await privateInstance.get(
					"/comunicaciones/list/plataform",
				);
				setPlataformas(data?.data ?? []);
			} catch (error) {
				console.error("Error cargando plataformas:", error);
				setPlataformas([]);
				onFlash("No se pudieron cargar las plataformas.", "error");
			} finally {
				setLoadingPlataformas(false);
			}
		};

		fetchPlataformas();
	}, [onFlash]);

	const needsIp = useMemo(
		() => plataformaSeleccionada === "1" || plataformaSeleccionada === "3",
		[plataformaSeleccionada],
	);

	const needsKey = useMemo(
		() => plataformaSeleccionada === "2",
		[plataformaSeleccionada],
	);

	useEffect(() => {
		// limpia el campo que no aplica
		if (needsIp) setLlaveAlestra("");
		if (needsKey) setIpHost("");
	}, [needsIp, needsKey]);

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

		// ✅ reglas por plataforma
		if (plat === "1" || plat === "3") {
			if (!ip) return onFlash("Captura la IP HOST/SERVICIO.", "error");
		} else if (plat === "2") {
			if (!key) return onFlash("Captura la LLAVE ALESTRA.", "error");
		} else {
			return onFlash("Plataforma inválida.", "error");
		}

		// arma payload según plataforma
		const payload = {
			nameS: sucursal,
			servHost: name,
			plat: Number(plat),
			ip: null,
			keys: null,
		};

		if (plat === "1" || plat === "3") payload.ip = ip;
		if (plat === "2") payload.keys = key; // KeyInput ya lo baja a minúsculas

		try {
			setSaving(true);

			await privateInstance.post("/comunicaciones/crear/sucursal", payload);

			navigate("/comunicaciones/sucursales");
		} catch (e) {
			console.error("[CreateSucursal] submit error:", e);

			const msg =
				e?.response?.data?.message ||
				(e?.response?.status === 422
					? "Validación fallida. Revisa los campos."
					: "No se pudo guardar la sucursal.");

			onFlash(msg, "error");
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className="min-h-screen w-full px-6 py-6 bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
			<header className="flex items-center justify-between mb-6">
				<h1 className="text-2xl font-bold mx-1">Crear Sucursal</h1>
				<ExitConfirm to="/comunicaciones/sucursales" />
			</header>

			<section className="bg-white dark:bg-slate-900 rounded-xl shadow border border-slate-200 dark:border-slate-800 p-6 max-w-3xl mx-auto">
				<div className="space-y-5">
					<div>
						<label htmlFor="plataforma_id" className="font-semibold text-sm">
							SUCURSAL <span className="text-red-600">*</span>
						</label>

						<select
							name="sucursal_id"
							id="sucursal_id"
							value={selectSucursal}
							onChange={(e) => setSelectSucursal(e.target.value)}
							disabled={loadingSucursal || saving}
							className="mt-1 w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-600 outline-none disabled:opacity-60"
						>
							<option value="">
								{loadingSucursal
									? "Cargando sucursales..."
									: "Selecciona una sucursal"}
							</option>

							{sucursales.map((s) => (
								<option key={s.value} value={String(s.value)}>
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
							disabled={loadingPlataformas || saving}
							className="mt-1 w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-600 outline-none disabled:opacity-60"
						>
							<option value="">
								{loadingPlataformas
									? "Cargando plataformas..."
									: "Selecciona una plataforma"}
							</option>

							{plataformas.map((p) => (
								<option key={p.value} value={String(p.value)}>
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
							className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition disabled:opacity-50"
						>
							{saving ? "Guardando..." : "Guardar"}
						</button>
					</div>
				</div>

				<FlashMessage message={message} />
			</section>
		</div>
	);
}
