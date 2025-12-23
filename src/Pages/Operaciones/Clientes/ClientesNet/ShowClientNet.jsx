import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { privateInstance } from "../../../../api/axios";
import BackButton from "../../../../components/UI/ConfirmBtn/ExitConfirmShow";
import FormLoader from "../../../../components/UI/Loaders/FormLoader";

export default function ShowClientNet() {
	const { id } = useParams();

	const [loading, setLoading] = useState(true);
	const [_error, setError] = useState(null);

	const [cliente, setCliente] = useState(null);
	const [forms, setForms] = useState([]);

	useEffect(() => {
		let mounted = true;

		const load = async () => {
			setLoading(true);
			setError(null);

			try {
				const res = await privateInstance.get(
					`/operaciones/clientes/netsuite/${id}`,
				);

				const payload = res.data || {};
				if (!payload.success) {
					throw new Error(payload.message || "No se pudo cargar el cliente.");
				}

				const data = payload.data || {};
				if (mounted) {
					setCliente(data.cliente || null);
					setForms(Array.isArray(data.forms) ? data.forms : []);
				}
			} catch (e) {
				const msg =
					e?.response?.data?.message ||
					e?.message ||
					"Error al cargar el detalle del cliente.";
				if (mounted) setError(msg);
			} finally {
				if (mounted) setLoading(false);
			}
		};

		if (id) load();
		else setLoading(false);

		return () => {
			mounted = false;
		};
	}, [id]);

	if (loading) return <FormLoader />;

	return (
		<div className="min-h-screen w-full px-6 py-6 bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
			<header className="flex items-center justify-between mb-6">
				<h1 className="text-2xl font-bold flex items-center gap-2 mx-1">
					Detalle de Cliente {""}
					{cliente?.custrecord_rfc_cte_final_crm && (
						<span className="text-blue-600">
							({cliente.custrecord_rfc_cte_final_crm})
						</span>
					)}
				</h1>
				<BackButton to="/operaciones/clientes/netsuite/list-client-net" />
			</header>

			<section className="bg-white dark:bg-slate-900 rounded-xl shadow border border-slate-200 dark:border-slate-800 p-6">
				<div className="grid w-full grid-cols-12 gap-4">
					<div className="col-span-12">
						<p className="font-semibold text-sm">Razón social</p>
						<div className="mt-1 w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm">
							{cliente?.name ?? "-"}
						</div>
					</div>

					<div className="col-span-12 sm:col-span-3">
						<p className="font-semibold text-sm">ID Cliente</p>
						<div className="mt-1 w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm">
							{cliente?.id ?? "-"}
						</div>
					</div>

					<div className="col-span-12 sm:col-span-3">
						<p className="font-semibold text-sm">Inactivo</p>
						<div className="mt-1 w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm">
							{cliente?.isinactive === "T" || cliente?.isinactive === true
								? "Sí"
								: "No"}
						</div>
					</div>

					<div className="col-span-12 sm:col-span-6">
						<p className="font-semibold text-sm">Correo Contacto Comercial</p>
						<div className="mt-1 w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm break-words">
							{cliente?.custrecord_mailcc_clientfin ?? "-"}
						</div>
					</div>

					<div className="col-span-12 mt-2">
						<p className="font-semibold text-sm mb-2">
							Formularios de servicio
						</p>

						<div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
							<table className="min-w-full text-sm">
								<thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
									<tr>
										<th className="text-left font-semibold px-4 py-3">
											ID Formulario
										</th>
										<th className="text-left font-semibold px-4 py-3">
											DataCenter (ID)
										</th>
									</tr>
								</thead>

								<tbody className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
									{forms?.length ? (
										forms.map((f, idx) => (
											<tr
												key={`${f?.id_formserv ?? "row"}-${idx}`}
												className="border-t border-slate-200 dark:border-slate-800"
											>
												<td className="px-4 py-3">{f?.id_formserv ?? "-"}</td>
												<td className="px-4 py-3">
													{f.datacenter_name ??
														(f.datacenter_id ? `ID: ${f.datacenter_id}` : "—")}
												</td>
											</tr>
										))
									) : (
										<tr className="border-t border-slate-200 dark:border-slate-800">
											<td className="px-4 py-3" colSpan={2}>
												No hay formularios registrados.
											</td>
										</tr>
									)}
								</tbody>
							</table>
						</div>
					</div>
				</div>
			</section>
		</div>
	);
}
