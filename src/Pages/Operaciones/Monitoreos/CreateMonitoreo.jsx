import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ExitConfirm from "../../../components/UI/ConfirmBtn/ExitConfirm";
import FlashMessage from "../../../components/UI/Errors/ErrorsGlobal";
import SelectSiteUI from "../../../components/UI/Monitoreos/SelectSite";
import SiteVeeam from "../../../components/UI/Monitoreos/Sites/SiteVeeam";
import useFlashMessage from "../../../hooks/Errors/ErrorMessage";

export default function CreateMonitoreo() {
	const [step, setStep] = useState(1);

	const [site, setSite] = useState("");
	const [data, setData] = useState(null);
	const [loading, setLoading] = useState(false);

	const [selectedIds, setSelectedIds] = useState(() => new Set());
	const [problemForm, setProblemForm] = useState({});

	const { message, showMessage, clearMessage } = useFlashMessage();

	const flashRef = useRef(null);

	const onFlash = useCallback(
		(text, type = "error") => showMessage(text, type),
		[showMessage],
	);

	const onFlashClear = useCallback(() => clearMessage(), [clearMessage]);

	const navigate = useNavigate();

	useEffect(() => {
		if (!message) return;

		const type =
			typeof message === "object" && message !== null
				? String(message.type || "")
				: "";

		const isError = type ? type === "error" : true;
		if (!isError) return;

		flashRef.current?.scrollIntoView({
			behavior: "smooth",
			block: "start",
		});
	}, [message]);

	return (
		<div className="min-h-screen w-full bg-slate-100 px-6 py-6 text-slate-800 dark:bg-slate-950 dark:text-slate-200">
			<header className="mb-6 flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">Crear Monitoreo</h1>
					<p className="text-sm text-slate-600 dark:text-slate-400">
						{step === 1 ? "Paso 1: OK" : "Paso 2: Problemas"}
					</p>
				</div>
				<ExitConfirm to="/operaciones/monitoreos" />
			</header>

			<section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
				<SelectSiteUI
					onSiteChange={(newSite) => {
						setSite(newSite);
						setData(null);
						setSelectedIds(new Set());
						setProblemForm({});
						setStep(1);
						onFlashClear();
					}}
					onLoading={setLoading}
					onData={(incoming) => {
						setData(incoming);
					}}
					disabled={step === 2}
				/>

				{site === "veeam" ? (
					<SiteVeeam
						step={step}
						loading={loading}
						data={data}
						selectedIds={selectedIds}
						setSelectedIds={setSelectedIds}
						problemForm={problemForm}
						onProblemChange={(clientId, patch) => {
							setProblemForm((prev) => ({
								...prev,
								[clientId]: {
									estatus: "",
									observacion: "",
									last_restore_date: "",
									...(prev?.[clientId] ?? {}),
									...patch,
								},
							}));
						}}
						onContinue={() => setStep(2)}
						onBack={() => setStep(1)}
						onFlash={onFlash}
						onSuccessRedirect={() => navigate("/operaciones/monitoreos")}
					/>
				) : site ? (
					<div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-400">
						Este site aún no está implementado en UI.
					</div>
				) : (
					<div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-400">
						Selecciona un <b>Site</b> para comenzar.
					</div>
				)}

				<div ref={flashRef}>
					<FlashMessage message={message} />
				</div>
			</section>
		</div>
	);
}
