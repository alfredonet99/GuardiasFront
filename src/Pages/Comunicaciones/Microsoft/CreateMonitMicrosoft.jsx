import ExitConfirm from "../../../components/UI/ConfirmBtn/ExitConfirm";

import WordCountTextarea from "../../../components/UI/WordCount/TextAreaCount";
import WordCountInput from "../../../components/UI/WordCount/InputCount";

import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import es from "date-fns/locale/es";

import { useNavigate } from "react-router-dom";
import MicrosoftForm from "../../../hooks/Microsoft/MicrosoftForm";

import useFlashMessage from "../../../hooks/Errors/ErrorMessage";
import FlashMessage from "../../../components/UI/Errors/ErrorsGlobal";

registerLocale("es", es);

export default function CreateMonitMicrosoft() {
	const navigate = useNavigate();

	const { message, showMessage, clearMessage } = useFlashMessage(5000);

	const {
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
		submitMonitoreos,
		accordion,
	} = MicrosoftForm(navigate);

	return (
		<div className="min-h-screen w-full px-6 py-6 bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
			<header className="flex items-center justify-between mb-6">
				<h1 className="text-2xl font-bold flex items-center gap-2 mx-1">
					Crear Monitoreos Microsoft
				</h1>
				<ExitConfirm to="/comunicaciones/microsoft" />
			</header>

			<section className="bg-white dark:bg-slate-900 rounded-xl shadow border border-slate-200 dark:border-slate-800 p-6">
				{loadingCatalogs ? (
					<div className="animate-pulse">
						<div className="mb-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 px-4 py-3">
							<div className="h-4 w-60 rounded bg-slate-200 dark:bg-slate-800" />
							<div className="mt-2 h-3 w-80 rounded bg-slate-200 dark:bg-slate-800" />
						</div>
					</div>
				) : (
					<>
						{monitoreos.map((m, idx) => {
							const opened = accordion.isOpen(m.id);

							return (
								<div
									key={m.id}
									className="mb-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden"
								>
									<div className="flex items-center justify-between">
										<button
											type="button"
											onClick={() => accordion.toggle(m.id)}
											aria-expanded={opened}
											aria-controls={`monit_panel_${m.id}`}
											className="w-full text-left p-4 flex justify-between items-center font-bold text-blue-700"
										>
											<span className="flex items-center gap-2">
												<span>Monitoreo:</span>
												<span className="font-mono text-slate-600 dark:text-slate-300">
													{idx + 1}
												</span>
											</span>

											<svg
												aria-hidden="true"
												className={`w-5 h-5 transition-transform duration-300 ${
													opened ? "rotate-90" : ""
												}`}
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={1.5}
													d="M9 5l7 7-7 7"
												/>
											</svg>
										</button>

										<div className="pr-4">
											<button
												type="button"
												onClick={(e) => {
													e.stopPropagation();
													removeMonitoreo(m.id);
												}}
												disabled={monitoreos.length <= 1 || saving}
												className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
											>
												Eliminar
											</button>
										</div>
									</div>

									{opened && (
										<div id={`monit_panel_${m.id}`} className="px-4 pb-4">
											<div className="mb-4">
												<label
													htmlFor={`servicio_id_${m.id}`}
													className="font-semibold text-sm"
												>
													SERVICIO <span className="text-red-600">*</span>
												</label>

												<select
													id={`servicio_id_${m.id}`}
													value={m.servicioId}
													onChange={(e) =>
														updateMonitoreo(m.id, {
															servicioId: e.target.value,
														})
													}
													disabled={saving}
													className="mt-1 w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-600 outline-none disabled:opacity-60"
												>
													<option value="">Selecciona un servicio</option>
													{servicios.map((opt) => (
														<option key={opt.value} value={opt.value}>
															{opt.label}
														</option>
													))}
												</select>
											</div>

											<div className="mb-4">
												<label
													htmlFor={`estado_id_${m.id}`}
													className="font-semibold text-sm"
												>
													ESTADO <span className="text-red-600">*</span>
												</label>

												<select
													id={`estado_id_${m.id}`}
													value={m.stateId}
													onChange={(e) =>
														updateMonitoreo(m.id, { stateId: e.target.value })
													}
													disabled={saving}
													className="mt-1 w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-600 outline-none disabled:opacity-60"
												>
													<option value="">Selecciona un estado</option>
													{states.map((opt) => (
														<option key={opt.value} value={opt.value}>
															{opt.label}
														</option>
													))}
												</select>
											</div>

											<div className="mb-4">
												<label htmlFor="" className="font-semibold text-sm">
													FECHA DE REVISIÓN{" "}
													<span className="text-red-600">*</span>
												</label>

												<DatePicker
													selected={m.revisionDate}
													onChange={(d) =>
														updateMonitoreo(m.id, { revisionDate: d })
													}
													dateFormat="EEEE d 'de' MMMM 'de' yyyy"
													placeholderText="Selecciona una fecha"
													isClearable
													locale="es"
													wrapperClassName="w-full"
													className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-600 outline-none"
												/>
											</div>

											<WordCountInput
												value={m.ejecucion}
												onChange={(v) =>
													updateMonitoreo(m.id, { ejecucion: v })
												}
												required
												minChars={5}
												maxWords={70}
												name={`ejecucion_${m.id}`}
												id={`ejecucion_${m.id}`}
												label="Ejecución"
												placeholder="Acción realizada"
											/>

											<WordCountTextarea
												value={m.descripcion}
												onChange={(v) =>
													updateMonitoreo(m.id, { descripcion: v })
												}
												required
												minChars={5}
												maxWords={2000}
												rows={4}
												name={`descripcion_${m.id}`}
												id={`descripcion_${m.id}`}
												label="Descripción"
												placeholder="Describe la incidencia…"
											/>
										</div>
									)}
								</div>
							);
						})}

						<FlashMessage message={message} onClose={clearMessage} />

						<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-2">
							<div>
								<p className="text-sm text-slate-600 dark:text-slate-300">
									Puedes añadir múltiples monitoreos y capturarlos uno por uno.
								</p>

								{!canAddMonitoreo && (
									<p className="mt-1 text-xs text-amber-600">
										Completa el monitoreo actual (Servicio, Estado, Fecha,
										Ejecución y Descripción) para poder añadir otro.
									</p>
								)}
							</div>

							<div className="flex items-center justify-end gap-2">
								<button
									type="button"
									onClick={handleAddMonitoreo}
									disabled={!canAddMonitoreo}
									className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition disabled:opacity-50 disabled:hover:bg-blue-600"
								>
									Añadir Monitoreo
								</button>

								<button
									type="button"
									disabled={!canSave}
									onClick={async () => {
										try {
											await submitMonitoreos(); // ✅ si OK, hook redirige
										} catch (err) {
											const msg = String(err?.message ?? "");
											if (msg.trim().length > 0) {
												showMessage(msg, "error");
											}
										}
									}}
									className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition disabled:opacity-50"
								>
									{saving ? "Guardando..." : "Guardar"}
								</button>
							</div>
						</div>
					</>
				)}
			</section>
		</div>
	);
}
