// SelectSiteUI.jsx
import { useEffect, useMemo, useState } from "react";
import { privateInstance } from "../../../api/axios";
import { useAutoClearErrors } from "../../../hooks/Errors/clearErrorMessage";
import { useFieldErrors } from "../../../hooks/Errors/MessageInputs";
import FieldError from "../Errors/ElementsErrors";

export default function SelectSiteUI({
	onData,
	onLoading,
	onSiteChange,
	required = true,
	placeholder = "SELECCIONAR SITE",
	className = "",
	error = null,
	disabled = false,
}) {
	const name = "site";
	const id = "site";

	const [selectSite, setSite] = useState("");
	const [touched, setTouched] = useState(false);

	// ✅ tu sistema de errores
	const { localErrors, errorKey, validateFields, clearError, setLocalErrors } =
		useFieldErrors();

	// ✅ para auto-limpiar al cambiar value
	const formValues = useMemo(() => ({ [name]: selectSite }), [selectSite]);
	useAutoClearErrors(formValues, localErrors, clearError);

	// ✅ si te llega error externo (API), lo metemos al mismo canal
	useEffect(() => {
		if (!error) return;
		setLocalErrors?.((prev) => ({ ...prev, [name]: String(error) }));
	}, [error, setLocalErrors]);

	const errorMessage = required ? "Selecciona un site." : "Selección inválida.";

	const runValidation = (currentValue) => {
		const rules = {
			[name]: {
				required,
				message: errorMessage,
			},
		};

		const v = String(currentValue ?? "").trim();
		const payloadValue = touched && required && !v ? "" : v;

		validateFields(rules, { [name]: payloadValue });
	};

	const handleChange = async (e) => {
		const site = e.target.value;
		setSite(site);

		// avisamos al padre
		onSiteChange?.(site);

		// si ya tocó, valida
		if (touched) runValidation(site);

		// limpiamos data previa en el padre
		onData?.(null);

		// solo hacemos fetch si es VEEAM (por ahora)
		if (site !== "veeam") return;

		try {
			onLoading?.(true);

			const { data } = await privateInstance.get(
				"/operaciones/obtener/lista-veeam",
			);

			onData?.(data);
		} catch (err) {
			console.error(err);
			const msg =
				err?.response?.data?.message ??
				"Error cargando clientes Veeam. Intenta nuevamente.";

			setLocalErrors?.((prev) => ({ ...prev, [name]: msg }));

			onData?.({
				error: true,
				message: msg,
				status: err?.response?.status ?? null,
			});
		} finally {
			onLoading?.(false);
		}
	};

	return (
		<div className={`mb-6 ${className}`}>
			<label htmlFor={id} className="font-semibold text-sm">
				SITE {required && <span className="text-red-600">*</span>}
			</label>

			<select
				name={name}
				id={id}
				value={selectSite}
				onChange={handleChange}
				onBlur={() => {
					setTouched(true);
					runValidation(selectSite);
				}}
				disabled={disabled}
				className={[
					"mt-1 w-full px-4 py-2 rounded-lg border bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none",
					"border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-blue-600",
					localErrors?.[name] ? "border-red-500 focus:ring-red-500" : "",
				].join(" ")}
			>
				<option value="">{placeholder}</option>
				<option value="veeam">VEEAM</option>
				<option value="site24">SITE 24</option>
				<option value="sophos">SOPHOS</option>
			</select>

			{/* ✅ mismo componente de error */}
			<FieldError message={localErrors?.[name]} resetKey={errorKey} />
		</div>
	);
}
