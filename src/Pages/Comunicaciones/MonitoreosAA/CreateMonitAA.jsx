// pages/Comunicaciones/MonitAA/CreateMonitAA.jsx

import DatePicker, { registerLocale } from "react-datepicker";
import ExitConfirm from "../../../components/UI/ConfirmBtn/ExitConfirm";
import "react-datepicker/dist/react-datepicker.css";
import es from "date-fns/locale/es";

import { useNavigate } from "react-router-dom";
import FlashMessage from "../../../components/UI/Errors/ErrorsGlobal";
import WordCountInput from "../../../components/UI/WordCount/InputCount";
import WordCountTextarea from "../../../components/UI/WordCount/TextAreaCount";
import useFlashMessage from "../../../hooks/Errors/ErrorMessage";
import RedesForm from "../../../hooks/MonitRedes/RedesForm";

registerLocale("es", es);

export default function CreateMonitAA() {
	const navigate = useNavigate();
	const { message, showMessage, clearMessage } = useFlashMessage(5000);

	const {
		loadingCatalogs,
		saving,
		canSave,
		canAddMonitoreo,

		plataformasList,
		statusRedOptions,
		getHostsList,
		getIpKeyMeta,
		getSucursalMeta,

		monitoreos,
		updateMonitoreo,
		removeMonitoreo,
		handleAddMonitoreo,
		submitMonitoreos,
		accordion,

		error,
	} = RedesForm(navigate);

	return (
		<div className="min-h-screen w-full px-6 py-6 bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
			<header className="flex items-center justify-between mb-6">
				<h1 className="text-2xl font-bold flex items-center gap-2 mx-1">
					Crear Monitoreos Redes
				</h1>
				<ExitConfirm to="/comunicaciones/monitoreos-aa" />
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
							const hostsList = getHostsList(m);
							const ipKeyMeta = getIpKeyMeta(m);
							const sucursalMeta = getSucursalMeta(m);

							const isOnline = String(m.statusRed) === "1";
							const requiresIncidentFields = !isOnline; // NO ONLINE => obliga caída + afectación + motivo

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
											{/* PLATAFORMA */}
											<div className="mb-4">
												<label className="font-semibold text-sm">
													PLATAFORMA <span className="text-red-600">*</span>
												</label>

												<select
													value={m.platSelected}
													onChange={(e) =>
														updateMonitoreo(m.id, {
															platSelected: e.target.value,
															hostSelected: "",
															// opcional: reset al cambiar plataforma
															// statusRed: "1",
															// timeDown: null,
															// timeUp: null,
															// affectation: "",
															// reason: "",
															// note: "",
														})
													}
													disabled={saving}
													className="mt-1 w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-600 outline-none disabled:opacity-60"
												>
													<option value="">Selecciona plataforma</option>
													{plataformasList.map((opt) => (
														<option key={opt.value} value={opt.value}>
															{opt.label}
														</option>
													))}
												</select>
											</div>

											{/* HOST + IP/KEY */}
											<div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
												<div>
													<label className="font-semibold text-sm">
														HOST <span className="text-red-600">*</span>
													</label>

													<select
														value={m.hostSelected}
														onChange={(e) =>
															updateMonitoreo(m.id, {
																hostSelected: e.target.value,
															})
														}
														disabled={saving || !m.platSelected}
														className="mt-1 w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-600 outline-none disabled:opacity-60"
													>
														<option value="">
															{!m.platSelected
																? "Selecciona plataforma primero"
																: hostsList.length
																	? "Selecciona host"
																	: "Sin hosts para esta plataforma"}
														</option>
														{hostsList.map((h) => (
															<option key={h.value} value={h.value}>
																{h.label}
															</option>
														))}
													</select>
												</div>

												<div>
													<label className="font-semibold text-sm">
														{ipKeyMeta.label}
													</label>
													<input
														readOnly
														value={ipKeyMeta.value}
														className="mt-1 w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 outline-none"
													/>
												</div>
											</div>

											{/* SUCURSAL (readonly) + STATUS RED (select) */}
											<div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
												<div>
													<label className="font-semibold text-sm">
														{sucursalMeta.label}
													</label>
													<input
														readOnly
														value={sucursalMeta.value}
														className="mt-1 w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 outline-none"
													/>
												</div>

												<div>
													<label className="font-semibold text-sm">
														STATUS RED <span className="text-red-600">*</span>
													</label>
													<select
														value={m.statusRed}
														onChange={(e) =>
															updateMonitoreo(m.id, {
																statusRed: e.target.value,
															})
														}
														disabled={saving}
														className="mt-1 w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-600 outline-none disabled:opacity-60"
													>
														<option value="">Selecciona status</option>
														{statusRedOptions.map((opt) => (
															<option key={opt.value} value={opt.value}>
																{opt.label}
															</option>
														))}
													</select>
												</div>
											</div>

											{/* FECHA + HORA CAÍDA */}
											<div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
												<div>
													<label className="font-semibold text-sm">
														FECHA DE REVISIÓN{" "}
														<span className="text-red-600">*</span>
													</label>

													<DatePicker
														selected={m.dateRed}
														onChange={(d) =>
															updateMonitoreo(m.id, { dateRed: d })
														}
														dateFormat="EEEE d 'de' MMMM 'de' yyyy"
														placeholderText="Selecciona una fecha"
														isClearable
														locale="es"
														wrapperClassName="w-full"
														className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-600 outline-none"
													/>
												</div>

												<div>
													<label className="font-semibold text-sm">
														HORA DE CAÍDA{" "}
														{requiresIncidentFields && (
															<span className="text-red-600">*</span>
														)}
													</label>

													<DatePicker
														selected={m.timeDown}
														onChange={(d) =>
															updateMonitoreo(m.id, { timeDown: d })
														}
														showTimeSelect
														showTimeSelectOnly
														timeIntervals={5}
														timeCaption="Hora"
														dateFormat="HH:mm"
														placeholderText="Selecciona hora"
														isClearable
														locale="es"
														wrapperClassName="w-full"
														className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-600 outline-none"
													/>
												</div>
											</div>

											{/* HORA RESTABLECIMIENTO (opcional siempre) + AFECTACIÓN */}
											<div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
												<div>
													<label className="font-semibold text-sm">
														HORA DE RESTABLECIMIENTO
														{/* siempre opcional */}
													</label>

													<DatePicker
														selected={m.timeUp}
														onChange={(d) =>
															updateMonitoreo(m.id, { timeUp: d })
														}
														showTimeSelect
														showTimeSelectOnly
														timeIntervals={5}
														timeCaption="Hora"
														dateFormat="HH:mm"
														placeholderText="Selecciona hora"
														isClearable
														locale="es"
														wrapperClassName="w-full"
														className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-600 outline-none"
													/>
												</div>

												<WordCountInput
													value={m.affectation}
													onChange={(v) =>
														updateMonitoreo(m.id, { affectation: v })
													}
													required={requiresIncidentFields}
													minChars={requiresIncidentFields ? 3 : 0}
													maxWords={70}
													name={`affectation_${m.id}`}
													id={`affectation_${m.id}`}
													label={
														requiresIncidentFields
															? "Afectación *"
															: "Afectación"
													}
													placeholder="Impacto / afectación…"
												/>
											</div>

											{/* NOTAS (opcional siempre) */}
											<WordCountInput
												value={m.note}
												onChange={(v) => updateMonitoreo(m.id, { note: v })}
												required={false}
												minChars={0}
												maxWords={120}
												name={`note_${m.id}`}
												id={`note_${m.id}`}
												label="Notas adicionales"
												placeholder="Notas opcionales…"
											/>

											{/* MOTIVO (obligatorio siempre) */}
											<WordCountTextarea
												value={m.reason}
												onChange={(v) => updateMonitoreo(m.id, { reason: v })}
												required
												minChars={5}
												maxWords={2000}
												rows={4}
												name={`reason_${m.id}`}
												id={`reason_${m.id}`}
												label="Motivo"
												placeholder="Describe el motivo…"
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
										Completa el monitoreo actual: <strong>Plataforma</strong>,{" "}
										<strong>Host</strong>, <strong>Sucursal</strong>,{" "}
										<strong>Status Red</strong>, <strong>Fecha</strong> y{" "}
										<strong>Motivo</strong>. Si el Status Red no es{" "}
										<strong>ONLINE</strong>, también se requiere{" "}
										<strong>Hora de caída</strong> y <strong>Afectación</strong>
										.
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
											await submitMonitoreos();
										} catch (err) {
											const msg = String(err?.message ?? "");
											if (msg.trim().length > 0) showMessage(msg, "error");
										}
									}}
									className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition disabled:opacity-50"
								>
									{saving ? "Guardando..." : "Guardar"}
								</button>
							</div>
						</div>

						{!!error && (
							<div className="mt-3 text-sm text-red-600 dark:text-red-400">
								{error}
							</div>
						)}
					</>
				)}
			</section>
		</div>
	);
}
