import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { privateInstance } from "../../../../api/axios";
import StorageJobsFields from "../../../../components/UI/ClientVeeam/StorageField";
import ExitConfirm from "../../../../components/UI/ConfirmBtn/ExitConfirm";
import FieldError from "../../../../components/UI/Errors/ElementsErrors";
import FlashMessage from "../../../../components/UI/Errors/ErrorsGlobal";
import { useNumCV } from "../../../../hooks/ClientVeeam/numCV";
import { useAutoClearErrors } from "../../../../hooks/Errors/clearErrorMessage";
import useFlashMessage from "../../../../hooks/Errors/ErrorMessage";
import { useFieldErrors } from "../../../../hooks/Errors/MessageInputs";
import { useTouchedFields } from "../../../../hooks/Errors/TouchedFields";

export default function CreateClientVeeam() {
	const navigate = useNavigate();

	const { displayValue, payloadValue, handleChange, handleBlur } = useNumCV("");
	const [numCV, setnumCV] = useState("");
	const [nameCV, setnameCv] = useState("");

	const [appsVeeam, setAppsVeeam] = useState([]);
	const [loadingApps, setLoadingApps] = useState(true);
	const [app, setApp] = useState("");
	const [errorApps, setErrorApps] = useState(null);

	const [storageValue, setStorageValue] = useState("");
	const [unit, setUnit] = useState("GB");
	const [jobs, setJobs] = useState(0);

	const backup = storageValue ? `${storageValue} ${unit}` : "";

	const [activo, setActivo] = useState(true);
	const [saving, setSaving] = useState(false);

	const { localErrors, errorKey, validateFields, clearError } =
		useFieldErrors();
	const { isTouched, markTouched, markAllTouched } = useTouchedFields();
	const { message, showMessage, clearMessage } = useFlashMessage();

	const rules = useMemo(
		() => ({
			nameCV: { required: true, message: "Ingresa un nombre" },
			app: { required: true, message: "Selecciona un aplicativo" },
			backup: { required: true, message: "Ingresa el almacenamiento" },
		}),
		[],
	);

	const formValues = useMemo(
		() => ({ nameCV, app, backup, storageValue, unit, jobs }),
		[nameCV, app, backup, storageValue, unit, jobs],
	);

	useAutoClearErrors(formValues, localErrors, clearError, rules);

	useEffect(() => {
		let mounted = true;

		const fetchApps = async () => {
			setLoadingApps(true);
			setErrorApps(null);

			try {
				const res = await privateInstance.get("operaciones/listaVeeam");
				if (!mounted) return;
				setAppsVeeam(Array.isArray(res.data) ? res.data : []);
			} catch (_err) {
				if (!mounted) return;
				setErrorApps("No se pudo cargar la lista de aplicativos Veeam.");
				setAppsVeeam([]);
			} finally {
				if (mounted) setLoadingApps(false);
			}
		};

		fetchApps();
		return () => {
			mounted = false;
		};
	}, []);

	const handleCreate = async () => {
		clearMessage();
		markAllTouched(["nameCV", "app", "backup"]);

		if (!validateFields(rules, { nameCV, app, backup })) return;

		setSaving(true);
		try {
			await privateInstance.post("operaciones/cliente-veeam/store", {
				numCV: (numCV || "").trim() || "NO IDENTIFICADO",
				nameCV: nameCV.trim(),
				app: app ? Number(app) : "",
				backup,
				jobs: Number.isFinite(Number(jobs)) ? Number(jobs) : 0,
				activo,
			});

			navigate("/operaciones/clientes/veeam/lista-client-veeam");
		} catch (error) {
			const status = error.response?.status;

			if (status === 422) {
				const errs = error.response?.data?.errors || {};
				const first =
					errs.numCV?.[0] ||
					errs.nameCV?.[0] ||
					errs.app?.[0] ||
					errs.backup?.[0] ||
					errs.jobs?.[0] ||
					Object.values(errs).flat()?.[0] ||
					error.response?.data?.message;

				showMessage(first || "Revisa los campos del formulario.", "error");
			} else if (status === 409) {
				showMessage(
					error.response?.data?.message ||
						"Ya existe un registro con el mismo ID y nombre.",
					"error",
				);
			} else {
				showMessage(
					error.response?.data?.message ||
						"No se pudo crear el cliente. Intenta de nuevo.",
					"error",
				);
			}
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className="min-h-screen w-full px-6 py-6 bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
			<header className="flex items-center justify-between mb-6">
				<h1 className="text-2xl font-bold mx-1">Crear Cliente Veeam</h1>
				<ExitConfirm to="/operaciones/clientes/veeam/lista-client-veeam" />
			</header>

			<section className="bg-white dark:bg-slate-900 rounded-xl shadow border border-slate-200 dark:border-slate-800 p-6 max-w-3xl mx-auto">
				<div className="space-y-5">
					<div>
						<label htmlFor="" className="font-semibold text-sm">
							ID Cliente
						</label>
						<input
							type="text"
							value={displayValue}
							onChange={(e) => {
								const v = e.target.value;
								handleChange(v);
								setnumCV(v);
							}}
							onBlur={() => {
								handleBlur();
								setnumCV(
									payloadValue === "" ? "NO IDENTIFICADO" : payloadValue,
								);
							}}
							className="mt-1 w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-600 outline-none"
						/>

						{displayValue === "" && (
							<p className="text-red-500 text-sm mt-1">
								Opcional: captura un ID, escribe <b>“Interno”</b>, o déjalo en
								blanco y se guardará como <b>“ID NO IDENTIFICADO”</b>.
							</p>
						)}
					</div>

					<div>
						<label htmlFor="" className="font-semibold text-sm">
							Nombre del Cliente
						</label>
						<input
							type="text"
							value={nameCV}
							onChange={(e) => setnameCv(e.target.value)}
							onBlur={() => markTouched("nameCV")}
							className="mt-1 w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-600 outline-none"
						/>
						{isTouched("nameCV") && (
							<FieldError message={localErrors.nameCV} resetKey={errorKey} />
						)}
					</div>

					<div>
						<label htmlFor="" className="font-semibold text-sm">
							Aplicativo
						</label>
						<select
							value={app}
							onChange={(e) => setApp(e.target.value)}
							onBlur={() => markTouched("app")}
							disabled={loadingApps}
							className="mt-1 w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-600 outline-none disabled:opacity-60"
						>
							<option value="">
								{loadingApps
									? "Cargando aplicativos..."
									: "Seleccionar aplicativo"}
							</option>

							{appsVeeam.map((a) => (
								<option key={a.id} value={a.id}>
									{a.nameService}
								</option>
							))}
						</select>

						{isTouched("app") && (
							<FieldError message={localErrors.app} resetKey={errorKey} />
						)}

						{errorApps && (
							<p className="text-red-500 text-sm mt-1">{errorApps}</p>
						)}
					</div>

					<div onBlurCapture={() => markTouched("backup")}>
						<StorageJobsFields
							storageValue={storageValue}
							onStorageChange={setStorageValue}
							unitValue={unit}
							onUnitChange={setUnit}
							jobsValue={jobs}
							onJobsChange={setJobs}
						/>

						{isTouched("backup") && (
							<FieldError message={localErrors.backup} resetKey={errorKey} />
						)}
					</div>

					<div className="flex items-center justify-between mt-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 px-4 py-3">
						<div>
							<div className="font-semibold text-sm">Activo</div>
							<div className="text-xs text-slate-500 dark:text-slate-400">
								Si está desactivado no se mostrará en las secciones
								correspondientes.
							</div>
						</div>

						<button
							type="button"
							onClick={() => setActivo((v) => !v)}
							className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
								activo ? "bg-blue-600" : "bg-slate-400"
							}`}
							aria-pressed={activo}
						>
							<span
								className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
									activo ? "translate-x-5" : "translate-x-1"
								}`}
							/>
						</button>
					</div>

					<FlashMessage message={message} />
				</div>

				<div className="mt-6 flex justify-end">
					<button
						type="button"
						onClick={handleCreate}
						disabled={saving}
						className={`px-5 py-2 rounded-lg text-white transition shadow-sm ${
							saving
								? "bg-blue-400 cursor-not-allowed"
								: "bg-blue-600 hover:bg-blue-700"
						}`}
					>
						{saving ? "Creando..." : "Crear Cliente"}
					</button>
				</div>
			</section>
		</div>
	);
}
