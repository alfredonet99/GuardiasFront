// Pages/Operaciones/Guardias/EditGuardias.jsx

import { useCallback, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ExitConfirm from "../../../components/UI/ConfirmBtn/ExitConfirm";
import MonitOkGuard from "../../../components/UI/GuardiasClose/Monitoreos/MonitOkGuard";
import MonitProblemGuard from "../../../components/UI/GuardiasClose/Monitoreos/MonitoreosProblemGuard";
import ResumeGuard from "../../../components/UI/GuardiasClose/ResumeGuard";
import TicketGuardiaEdit from "../../../components/UI/GuardiasClose/TicketsEditGuard";
import useGuardiaCloseData from "../../../hooks/Guardia/getcloseGuard";
import useGuardMonitData from "../../../hooks/Guardia/getMonitGuard";
import { privateInstance } from "../../../api/axios";

export default function EditGuardias() {
	const navigate = useNavigate();
	const ticketsRef = useRef(null);
	const { id } = useParams();

	const { guardia } = useGuardiaCloseData(id);

	const [step, setStep] = useState(1);
	const [monitView, setMonitView] = useState("ok");
	const [activeSite, setActiveSite] = useState("veeam");

	const {
		storeOk,
		savingOkBySite,
		saveOkErrorBySite,
		closeProblems,
		savingProblemsBySite,
		saveProblemsErrorBySite,
	} = useGuardMonitData(activeSite, id);

	const [okSelectedBySite, setOkSelectedBySite] = useState({
		veeam: new Set(),
		site24: new Set(),
	});

	const [pendingNewBySite, setPendingNewBySite] = useState({
		veeam: [],
		site24: [],
	});

	const [okItemsBySite, setOkItemsBySite] = useState({
		veeam: [],
		site24: [],
	});

	const [pendingRowsBySite, setPendingRowsBySite] = useState({
		veeam: [],
		site24: [],
	});

	const [problemsPayloadBySite, setProblemsPayloadBySite] = useState({
		veeam: { payloadDb: null, payloadNew: null },
		site24: { payloadDb: null, payloadNew: null },
	});

	const [ticketsResume, setTicketsResume] = useState({
		pending: [],
		concluded: [],
		concludedByUser: {},
		counters: { total: 0, pending: 0, concluded: 0, newTickets: 0 },
	});

	const [submitting, setSubmitting] = useState(false);
	const [submitError, setSubmitError] = useState(null);

	const goBack = useCallback(() => {
		setSubmitError(null);
		setStep((s) => Math.max(1, s - 1));
	}, []);

	const backToMonitoreos = useCallback(() => {
		setSubmitError(null);
		setStep(1);
	}, []);

	const isTicketsBusy = Boolean(ticketsRef.current?.isBusy?.());
	const isMonitOkSaving = Boolean(savingOkBySite?.[activeSite]);
	const isMonitProblemsSaving = Boolean(savingProblemsBySite?.[activeSite]);

	const isBusy =
		Boolean(submitting) ||
		isTicketsBusy ||
		isMonitOkSaving ||
		isMonitProblemsSaving;

	const stepLabel = useMemo(() => {
		if (step === 1) return "Paso 1: Monitoreos";
		if (step === 2) return "Paso 2: Tickets";
		if (step === 3) return "Paso 3: Resumen";
		return "";
	}, [step]);

	const goToResume = useCallback(() => {
		setSubmitError(null);

		const check = ticketsRef.current?.validateBeforeContinue?.();

		if (check?.ok === false) {
			setSubmitError(check.message || "No se puede continuar.");
			return;
		}

		const snap = ticketsRef.current?.getTicketsSnapshot?.();

		setTicketsResume(
			snap ?? {
				pending: [],
				concluded: [],
				concludedByUser: {},
				counters: { total: 0, pending: 0, concluded: 0, newTickets: 0 },
			},
		);

		setStep(3);
	}, []);

	const handleMonitContinue = useCallback(
		({ site, selectedIds, pendingNewItems, hasPending, okItems }) => {
			setActiveSite(site);

			setOkSelectedBySite((prev) => ({
				...prev,
				[site]: new Set(selectedIds ?? []),
			}));

			setPendingNewBySite((prev) => ({
				...prev,
				[site]: pendingNewItems ?? [],
			}));

			setOkItemsBySite((prev) => ({
				...prev,
				[site]: Array.isArray(okItems) ? okItems : [],
			}));

			if (hasPending) {
				setMonitView("problems");
				return;
			}

			setMonitView("ok");
			setStep(2);
		},
		[],
	);

	const handleProblemsBack = useCallback(() => {
		setMonitView("ok");
	}, []);

	const handleProblemsSaved = useCallback((site, pack) => {
		const siteKey =
			site || pack?.payloadDb?.site || pack?.payloadNew?.site || pack?.site;

		if (siteKey) {
			setPendingRowsBySite((prev) => ({
				...prev,
				[siteKey]: Array.isArray(pack?.rowsForResume) ? pack.rowsForResume : [],
			}));

			setProblemsPayloadBySite((prev) => ({
				...prev,
				[siteKey]: {
					payloadDb:
						pack?.payloadDb && Array.isArray(pack.payloadDb?.rows)
							? pack.payloadDb
							: null,
					payloadNew:
						pack?.payloadNew && Array.isArray(pack.payloadNew?.rows)
							? pack.payloadNew
							: null,
				},
			}));
		}

		setMonitView("ok");
		setStep(2);
	}, []);

	const buildOkRows = useCallback((site, okItems = []) => {
		const arr = Array.isArray(okItems) ? okItems : [];

		return arr
			.map((it) => ({
				client_id: Number(it?.id),
				siteApp:
					site === "veeam" ? null : it?.veeam_id ? Number(it.veeam_id) : null,
				estatus: String(it?.estatus ?? "1"),
				observacion: null,
				dateRest: null,
			}))
			.filter((r) => Number.isFinite(r.client_id) && r.client_id > 0);
	}, []);

	const sendCloseEmail = useCallback(
		async (ticketsSnap) => {
			const tag = `[EMAIL_GUARDIA_BACKEND:${guardia?.id ?? "sin-id"}]`;

			const safeSnap = ticketsSnap ?? {
				pending: [],
				concluded: [],
				concludedByUser: {},
				counters: { total: 0, pending: 0, concluded: 0, newTickets: 0 },
			};

			const payload = {
				guardia: {
					id: guardia?.id ?? id,
					user_name: guardia?.user?.name ?? guardia?.user_name ?? "",
					dateInit: guardia?.dateInit ?? null,
				},

				okItemsVeeam: okItemsBySite.veeam ?? [],
				pendingVeeamRows: pendingRowsBySite.veeam ?? [],

				ticketsResume: {
					pending: safeSnap.pending ?? [],
					concludedByUser: safeSnap.concludedByUser ?? {},
					counters: safeSnap.counters ?? {
						total: 0,
						pending: 0,
						concluded: 0,
						newTickets: 0,
					},
				},
			};

			console.info(`${tag} ENVIANDO JSON AL BACKEND`, {
				guardiaId: payload.guardia.id,
				okItemsVeeam: payload.okItemsVeeam.length,
				pendingVeeamRows: payload.pendingVeeamRows.length,
				ticketsPending: payload.ticketsResume.pending.length,
				concludedUsers: Object.keys(payload.ticketsResume.concludedByUser)
					.length,
				counters: payload.ticketsResume.counters,
			});

			try {
				const res = await privateInstance.post(
					`operaciones/mail/guardias/${payload.guardia.id}/send-close-email`,
					payload,
				);

				const data = res.data;

				console.info(`${tag} CORREO ENVIADO DESDE BACKEND`, data);

				return {
					ok: true,
					message: data?.message ?? "Correo enviado correctamente.",
					messageId: data?.messageId ?? null,
				};
			} catch (error) {
				const status = error.response?.status;
				const data = error.response?.data;

				console.error(`${tag} ERROR BACKEND AXIOS`, {
					status,
					data,
					message: error?.message,
				});

				return {
					ok: false,
					message:
						data?.message ||
						(status
							? `Error enviando correo desde backend. HTTP ${status}`
							: "Error conectando con backend."),
				};
			}
		},
		[guardia, id, okItemsBySite.veeam, pendingRowsBySite.veeam],
	);

	const handleCloseAll = useCallback(async () => {
		if (!ticketsRef.current?.submitClose) return;

		setSubmitting(true);
		setSubmitError(null);

		try {
			const site = "veeam";

			const pack = problemsPayloadBySite?.[site] ?? {};
			const payloadNew = pack?.payloadNew;
			const payloadDb = pack?.payloadDb;

			const newProblemRows = Array.isArray(payloadNew?.rows)
				? payloadNew.rows
				: [];
			const dbProblemRows = Array.isArray(payloadDb?.rows)
				? payloadDb.rows
				: [];

			if (newProblemRows.length > 0) {
				const resNewProb = await storeOk(site, newProblemRows);
				if (!resNewProb?.ok) {
					setSubmitError(
						resNewProb?.message ||
							saveOkErrorBySite?.[site] ||
							"No se pudieron guardar monitoreos PROBLEMS (NEW).",
					);
					return;
				}
			}

			if (dbProblemRows.length > 0) {
				const resDbProb = await closeProblems(site, dbProblemRows, {
					sync: false,
				});
				if (!resDbProb?.ok) {
					setSubmitError(
						resDbProb?.message ||
							saveProblemsErrorBySite?.[site] ||
							"No se pudieron guardar monitoreos PROBLEMS (BD).",
					);
					return;
				}
			}

			const okItems = okItemsBySite?.[site] ?? [];
			if (okItems.length > 0) {
				const okRows = buildOkRows(site, okItems);

				if (okRows.length > 0) {
					const resOk = await storeOk(site, okRows);
					if (!resOk?.ok) {
						setSubmitError(
							resOk?.message ||
								saveOkErrorBySite?.[site] ||
								"No se pudieron guardar monitoreos OK.",
						);
						return;
					}
				}
			}

			const res = await ticketsRef.current.submitClose();

			if (res?.ok) {
				const liveSnap = ticketsRef.current?.getTicketsSnapshot?.() ?? null;

				const mail = await sendCloseEmail(liveSnap);
				if (!mail?.ok) {
					console.warn(
						"⚠️ Guardia cerrada, pero el correo falló:",
						mail?.message,
					);
				}

				navigate("/operaciones/guardias");
				return;
			}

			setSubmitError(res?.message || "No se pudo cerrar la guardia.");
		} catch (e) {
			setSubmitError(e?.message || "Error inesperado al cerrar la guardia.");
		} finally {
			setSubmitting(false);
		}
	}, [
		okItemsBySite,
		buildOkRows,
		storeOk,
		saveOkErrorBySite,
		closeProblems,
		problemsPayloadBySite,
		saveProblemsErrorBySite,
		navigate,
		sendCloseEmail,
	]);

	return (
		<div className="min-h-screen w-full px-6 py-6 bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
			<header className="flex items-center justify-between mb-6">
				<div>
					<h1 className="text-2xl font-bold mx-1">CERRAR GUARDIA</h1>
					<p className="text-sm text-slate-600 dark:text-slate-400 mx-1">
						{stepLabel}
					</p>
				</div>
				<ExitConfirm to="/operaciones/guardias" />
			</header>

			{/* PASO 1 */}
			<div className={step === 1 ? "block" : "hidden"}>
				<div className={monitView === "ok" ? "block" : "hidden"}>
					<MonitOkGuard
						guardiaId={id}
						defaultSite={activeSite}
						defaultSelectedBySite={okSelectedBySite}
						onContinue={handleMonitContinue}
					/>
				</div>

				<div className={monitView === "problems" ? "block" : "hidden"}>
					<MonitProblemGuard
						site={activeSite}
						pendingItemsBySite={pendingNewBySite}
						onBack={handleProblemsBack}
						onSaved={handleProblemsSaved}
					/>
				</div>
			</div>

			{/* PASO 2 */}
			<div className={step === 2 ? "block" : "hidden"}>
				<TicketGuardiaEdit
					ref={ticketsRef}
					onBackToMonitoreos={backToMonitoreos}
				/>
			</div>

			{/* PASO 3 */}
			<div className={step === 3 ? "block" : "hidden"}>
				<ResumeGuard
					guardia={guardia}
					selectedOkItemsVeeam={okItemsBySite.veeam}
					pendingNewItemsVeeam={pendingNewBySite.veeam}
					pendingVeeamRows={pendingRowsBySite.veeam}
					ticketsPending={ticketsResume.pending}
					ticketsConcludedByUser={ticketsResume.concludedByUser}
					ticketsCounters={ticketsResume.counters}
					submitting={
						submitting ||
						Boolean(savingOkBySite?.veeam) ||
						Boolean(savingProblemsBySite?.veeam)
					}
					submitError={submitError}
					isBusy={isBusy}
					onBack={() => {
						setSubmitError(null);
						setStep(2);
					}}
					onClose={handleCloseAll}
				/>
			</div>

			{submitError ? (
				<div className="mt-4 p-3 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm">
					{submitError}
				</div>
			) : null}

			<div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div>
					{step > 1 ? (
						<button
							type="button"
							onClick={goBack}
							disabled={isBusy}
							className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium transition disabled:opacity-50"
						>
							ATRÁS
						</button>
					) : (
						<span className="text-sm text-slate-500 dark:text-slate-400" />
					)}
				</div>

				<div className="flex items-center justify-end gap-2">
					{step === 1 ? null : step === 2 ? (
						<button
							type="button"
							onClick={goToResume}
							disabled={isBusy}
							className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition disabled:opacity-50"
						>
							CONTINUAR
						</button>
					) : (
						<button
							type="button"
							onClick={handleCloseAll}
							disabled={isBusy}
							className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition disabled:opacity-50"
						>
							{isBusy ? "Procesando..." : "CERRAR GUARDIA"}
						</button>
					)}
				</div>
			</div>
		</div>
	);
}
