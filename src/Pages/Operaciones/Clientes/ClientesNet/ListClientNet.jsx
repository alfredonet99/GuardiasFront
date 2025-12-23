import { useCallback, useEffect, useState } from "react";
import { privateInstance } from "../../../../api/axios";
import IconShow from "../../../../components/icons/Crud/Show";
import StatusList from "../../../../components/UI/Active/Status";
import Paginator from "../../../../components/UI/Paginacion/PaginationUI";
import SearchInputLong from "../../../../components/UI/Search/SearchLong";

export default function ListClient() {
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [rows, setRows] = useState([]);
	const [page, setPage] = useState(1);
	const [perPage] = useState(50);
	const [lastPage, setLastPage] = useState(1);
	const [total, setTotal] = useState(0);

	const [search, setSearch] = useState("");
	const [inactive, setInactive] = useState("");

	const fetchData = useCallback(async () => {
		try {
			setLoading(true);
			setError("");

			const params = { page, perPage };

			const s = search.trim();
			if (s) params.search = s;

			if (inactive !== "") params.inactive = inactive;

			const { data: res } = await privateInstance.get(
				"/operaciones/clientes/netsuite",
				{ params },
			);

			if (!res?.success) {
				setRows([]);
				setLastPage(1);
				setTotal(0);
				setError(res?.message || "Error consultando NetSuite");
				return;
			}

			setRows(res.data || []);
			setLastPage(res?.meta?.lastPage ?? 1);
			setTotal(res?.meta?.total ?? 0);
		} catch (e) {
			setRows([]);
			setLastPage(1);
			setTotal(0);
			setError(e?.response?.data?.message || e.message || "Error inesperado");
		} finally {
			setLoading(false);
		}
	}, [page, perPage, search, inactive]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	return (
		<div className="min-h-screen w-full bg-slate-100 dark:bg-slate-950 px-6 py-6 text-slate-800 dark:text-slate-200">
			<header className="flex items-center justify-between mb-6">
				<h1 className="text-2xl font-bold px-2 text-slate-800 dark:text-slate-100">
					Lista Clientes NetSuite
				</h1>
			</header>

			<section className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
				<div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-4">
					<div className="relative w-full md:max-w-sm">
						<SearchInputLong
							value={search}
							onChange={(e) => {
								setSearch(e.target.value);
								setPage(1);
							}}
							placeholder="Buscar ID o Nombre..."
						/>
					</div>

					<StatusList
						value={inactive}
						onChange={(val) => {
							setInactive(val);
							setPage(1);
						}}
					/>
				</div>

				{error && (
					<div className="mb-4 rounded-lg border border-red-200 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-200 px-4 py-3">
						{error}
					</div>
				)}

				<div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
					<table className="min-w-full text-[14px]">
						<thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase text-xs">
							<tr>
								<th className="px-4 py-3 text-left">ID</th>
								<th className="px-4 py-3 text-left">CLIENTE FINAL</th>
								<th className="px-4 py-3 text-left">RFC</th>
								<th className="px-4 py-3 text-left">INACTIVO</th>
								<th className="px-3 py-3 text-left w-[20px]">ACCIONES</th>
							</tr>
						</thead>

						<tbody className="divide-y divide-slate-200 dark:divide-slate-800">
							{loading ? (
								<tr>
									<td className="px-4 py-4 opacity-70 text-center" colSpan={5}>
										{" "}
										Cargando clientes...{" "}
									</td>
								</tr>
							) : rows.length === 0 ? (
								<tr>
									<td className="px-4 py-4 opacity-70 text-center" colSpan={5}>
										{" "}
										Sin resultados
									</td>
								</tr>
							) : (
								rows.map((r) => (
									<tr
										key={r.id}
										className="hover:bg-slate-50 dark:hover:bg-slate-800/40"
									>
										<td className="px-4 py-3 font-semibold">{r.id}</td>
										<td className="px-4 py-3">{r.name}</td>
										<td className="px-4 py-3">
											{r.custrecord_rfc_cte_final_crm || "-"}
										</td>
										<td className="px-4 py-3">
											{String(r.isinactive).toUpperCase() === "T" ? "Sí" : "No"}
										</td>
										<td className="px-4 py-3">
											<IconShow
												to={`/operaciones/clientes/netsuite/${r.id}/ver-client-net`}
											/>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>

				<div className="flex items-center justify-between">
					<div className="text-sm opacity-80 pl-1 pt-3">
						Total: <b>{total}</b>
					</div>

					<Paginator page={page} lastPage={lastPage} setPage={setPage} />
				</div>
			</section>
		</div>
	);
}
