import { useEffect, useRef, useState } from "react";
import { FiFile, FiUpload } from "react-icons/fi";
import FlashMessage from "../../../components/UI/Errors/ErrorsGlobal";
import useFlashMessage from "../../../hooks/Errors/ErrorMessage";
import ModalImport from "../../UI/Modals/ModalImport";

export default function IconImport({
	disabled = false,
	label = "Importar",
	onSubmit, // async (file) => axiosResponse
}) {
	const { message, showMessage, clearMessage } = useFlashMessage();

	const [open, setOpen] = useState(false);
	const [file, setFile] = useState(null);
	const [loading, setLoading] = useState(false);

	const inputRef = useRef(null);

	const isValid = (f) => {
		if (!f) return false;
		const n = (f.name || "").toLowerCase();
		return n.endsWith(".csv") || n.endsWith(".xlsx") || n.endsWith(".xls");
	};

	const close = () => {
		setOpen(false);
		setFile(null);
		setLoading(false);
		clearMessage();
		if (inputRef.current) inputRef.current.value = "";
	};

	useEffect(() => {
		if (!open) return;
		clearMessage();
	}, [open, clearMessage]);

	const pickFile = (e) => {
		const f = e.target.files?.[0] ?? null;
		clearMessage();
		setFile(f);

		if (f && !isValid(f)) {
			showMessage("Formato no válido. Solo .xlsx, .xls o .csv", "error");
		}
	};

	const buildApiMessage = (resOrErr) => {
		const data = resOrErr?.response?.data ?? resOrErr?.data ?? null;
		const status = resOrErr?.response?.status ?? resOrErr?.status ?? null;

		// 1) Tu import strict: errors es array [{row,messages...}]
		if (Array.isArray(data?.errors) && data.errors.length > 0) {
			const top = data.errors.slice(0, 3).map((e) => {
				const row = e?.row ?? "?";
				const msg = Array.isArray(e?.messages)
					? e.messages[0]
					: "Error en contenido";
				return `Fila ${row}: ${msg}`;
			});

			const extra =
				data.errors.length > 3 ? `\n…y ${data.errors.length - 3} más.` : "";

			return `${data?.message || "Importación con errores."}\n${top.join("\n")}${extra}`;
		}

		// 2) Laravel 422 normal: errors object
		if (data?.errors && typeof data.errors === "object") {
			const flat = Object.values(data.errors).flat().filter(Boolean);
			if (flat.length > 0) return flat.join(" • ");
		}

		return (
			data?.message ||
			data?.error ||
			(status === 422
				? "Validación fallida. Revisa el archivo."
				: "No se pudo importar. Verifica el archivo e intenta de nuevo.")
		);
	};

	const handleSubmit = async () => {
		clearMessage();

		if (!file) return showMessage("Selecciona un archivo.", "error");
		if (!isValid(file))
			return showMessage("Formato no válido. Solo .xlsx, .xls o .csv", "error");
		if (typeof onSubmit !== "function")
			return showMessage(
				"Falta implementar onSubmit(file) en IconImport.",
				"error",
			);

		try {
			setLoading(true);

			const res = await onSubmit(file); // debe retornar response

			const status = res?.status ?? 200;

			// ✅ Blindaje: cualquier 2xx = OK, lo demás = error
			if (status < 200 || status >= 300) {
				showMessage(buildApiMessage(res), "error");
				return;
			}

			// ✅ Éxito real
			close(); // cierra modal y limpia
		} catch (e) {
			console.error("[IconImport] submit error:", e);
			showMessage(buildApiMessage(e), "error");
		} finally {
			setLoading(false);
		}
	};

	return (
		<>
			<button
				type="button"
				onClick={() => setOpen(true)}
				disabled={disabled}
				title="Importar (Excel / CSV)"
				className={[
					"flex items-center gap-2",
					"bg-sky-600 text-white px-4 py-2 rounded-lg shadow",
					"hover:bg-sky-800 transition select-none",
					"disabled:opacity-50 disabled:cursor-not-allowed",
				].join(" ")}
			>
				<FiUpload className="text-[16px] opacity-90" />
				<span>{label}</span>
			</button>

			<ModalImport open={open} title="Importar archivo" onClose={close}>
				<div className="space-y-4">
					<p className="text-sm text-slate-600">
						Sube un archivo <b>Excel</b> (.xlsx / .xls) o <b>CSV</b> (.csv).
					</p>

					<div className="flex items-center gap-3">
						<button
							type="button"
							onClick={() => inputRef.current?.click()}
							disabled={loading}
							className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-60"
						>
							<FiFile />
							<span className="text-sm">Seleccionar</span>
						</button>

						<input
							ref={inputRef}
							type="file"
							accept=".xlsx,.xls,.csv"
							className="hidden"
							onChange={pickFile}
						/>

						<div className="flex-1 min-w-0">
							<div className="text-sm text-slate-800 truncate">
								{file ? file.name : "Ningún archivo seleccionado"}
							</div>

							{file ? (
								<div className="mt-1 flex items-center gap-2 text-xs text-slate-600">
									{file.name.toLowerCase().endsWith(".csv") ? (
										<span className="inline-flex items-center gap-1">CSV</span>
									) : (
										<span className="inline-flex items-center gap-1">
											Excel
										</span>
									)}
								</div>
							) : null}
						</div>
					</div>

					<FlashMessage message={message} />

					<div className="flex items-center justify-end gap-2 pt-2">
						<button
							type="button"
							onClick={close}
							disabled={loading}
							className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-50"
						>
							Cancelar
						</button>

						<button
							type="button"
							onClick={handleSubmit}
							disabled={loading || !file}
							className={[
								"px-4 py-2 rounded-lg text-white",
								"bg-sky-600 hover:bg-sky-800 transition",
								"disabled:opacity-50 disabled:cursor-not-allowed",
							].join(" ")}
						>
							{loading ? "Importando..." : "Importar"}
						</button>
					</div>
				</div>
			</ModalImport>
		</>
	);
}
