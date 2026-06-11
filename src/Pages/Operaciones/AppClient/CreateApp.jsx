import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { privateInstance } from "../../../api/axios";
import ExitConfirm from "../../../components/UI/ConfirmBtn/ExitConfirm";
import FieldError from "../../../components/UI/Errors/ElementsErrors";
import FlashMessage from "../../../components/UI/Errors/ErrorsGlobal";
import { useAutoClearErrors } from "../../../hooks/Errors/clearErrorMessage";
import useFlashMessage from "../../../hooks/Errors/ErrorMessage";
import { useFieldErrors } from "../../../hooks/Errors/MessageInputs";
import { useTouchedFields } from "../../../hooks/Errors/TouchedFields";

export default function CreateApp() {
	const navigate = useNavigate();

	const { localErrors, errorKey, validateFields, clearError } =
		useFieldErrors();
	const { isTouched, markTouched, markAllTouched } = useTouchedFields();
	const { message, showMessage, clearMessage } = useFlashMessage();

	const [nameService, setNameS] = useState("");
	const [descriptionService, setDescriptionS] = useState("");
	const [activo, setActivo] = useState(true);
	const [saving, setSaving] = useState(false);

	const rules = useMemo(
		() => ({
			nameService: { required: true, message: "Ingresa un nombre valido" },
		}),
		[],
	);

	const formValues = useMemo(
		() => ({ nameService, descriptionService, activo }),
		[nameService, descriptionService, activo],
	);

	useAutoClearErrors(formValues, localErrors, clearError, rules);

	const handleCreateApp = async () => {
		clearMessage();
		markAllTouched(["nameService"]);

		if (!validateFields(rules, { nameService })) return;

		setSaving(true);

		try {
			await privateInstance.post("operaciones/app/store", {
				nameService: nameService.trim(),
				descriptionService,
				activo,
			});

			showMessage("Aplicativo Creado Correctamente", "success");
			navigate("/operaciones/app");
		} catch (error) {
			const status = error.response?.status;

			if (status === 422) {
				const errs = error.response?.data?.errors || {};
				const first =
					errs.nameService?.[0] ||
					Object.values(errs).flat()?.[0] ||
					error.response?.data?.message;

				showMessage(first || "Revisa los campos del formulario.", "error");
			} else {
				showMessage(
					"No se pudo crear el aplicativo. Intenta de nuevo.",
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
				<h1 className="text-2xl font-bold mx-1">Crear Aplicativo</h1>
				<ExitConfirm to="/operaciones/app" />
			</header>

			<section className="bg-white dark:bg-slate-900 rounded-xl shadow border border-slate-200 dark:border-slate-800 p-6 max-w-3xl mx-auto">
				<div className="space-y-5">
					<div>
						<div>
							<label htmlFor="app_name" className="font-semibold text-sm">
								Nombre del Aplicativo
							</label>
							<input
								id="app_name"
								type="text"
								value={nameService}
								onBlur={() => markTouched("nameService")}
								onChange={(e) => setNameS(e.target.value)}
								placeholder="Ej. Veeam 123"
								className="mt-1 w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-600 outline-none"
							/>
							{isTouched("nameService") && (
								<FieldError
									message={localErrors.nameService}
									resetKey={errorKey}
								/>
							)}
						</div>

						<div className="mt-4">
							<label htmlFor="app_desc" className="font-semibold text-sm">
								Descripción (Opcional)
							</label>
							<textarea
								id="app_desc"
								name="descriptionService"
								value={descriptionService}
								onChange={(e) => setDescriptionS(e.target.value)}
								rows={2}
								className="mt-1 w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-600 outline-none"
							/>
						</div>

						<div className="flex items-center justify-between mt-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 px-4 py-3">
							<div>
								<div className="font-semibold text-sm">Activo</div>
								<div className="text-xs text-slate-500 dark:text-slate-400">
									Si está desactivado no se podrá asociar el elemento a los
									clientes.
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
					</div>

					<FlashMessage message={message} />
				</div>

				<div className="mt-6 flex justify-end">
					<button
						type="button"
						onClick={handleCreateApp}
						disabled={saving}
						className={`px-5 py-2 rounded-lg text-white transition shadow-sm ${
							saving
								? "bg-blue-400 cursor-not-allowed"
								: "bg-blue-600 hover:bg-blue-700"
						}`}
					>
						{saving ? "Creando..." : "Crear Aplicativo"}
					</button>
				</div>
			</section>
		</div>
	);
}
