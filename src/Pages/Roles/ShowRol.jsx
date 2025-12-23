import { useEffect, useMemo, useState } from "react";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";
import { useNavigate, useParams } from "react-router-dom";
import { privateInstance } from "../../api/axios";
import BackButton from "../../components/UI/ConfirmBtn/ExitConfirmShow";
import PermissionDenied from "../Errors/PermissionDenied";

export default function ShowRole() {
	const { id } = useParams();
	const navigate = useNavigate();
	const [denied, setDenied] = useState(false);

	const [loading, setLoading] = useState(true);
	const [role, setRole] = useState({ id: null, name: "", guard_name: "" });
	const [permissions, setPermissions] = useState([]);
	const [openModules, setOpenModules] = useState({});

	useEffect(() => {
		const loadData = async () => {
			try {
				const res = await privateInstance.get(`/roles/${id}/ver`);
				setRole(res.data.role || {});
				setPermissions(res.data.permissions || []);
				setDenied(false);
			} catch (err) {
				const status = err?.response?.status;
				if (status === 403 || status === 401) {
					setDenied(true);
					return;
				}
				console.error("Error al cargar rol:", err);
				navigate("/admin/roles");
			} finally {
				setLoading(false);
			}
		};
		loadData();
	}, [id, navigate]);

	const grouped = useMemo(() => {
		const groups = {};
		permissions.forEach((perm) => {
			const [module] = perm.name.split(".");
			if (!groups[module]) groups[module] = [];
			groups[module].push(perm);
		});
		return groups;
	}, [permissions]);

	useEffect(() => {
		const initial = {};

		for (const m of Object.keys(grouped)) {
			initial[m] = true;
		}

		setOpenModules(initial);
	}, [grouped]);

	const toggleModule = (module) =>
		setOpenModules((prev) => ({ ...prev, [module]: !prev[module] }));

	if (loading) {
		return (
			<div className="p-6 text-center text-slate-500 dark:text-slate-300">
				{" "}
				Cargando información del rol...{" "}
			</div>
		);
	}
	if (denied) return <PermissionDenied />;

	return (
		<div className="min-h-screen w-full px-6 py-6 bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
			<header className="flex items-center justify-between mb-6">
				<h1 className="text-2xl font-bold flex items-center gap-2 mx-1">
					Detalle de Rol{" "}
					{role?.name && <span className="text-blue-600">({role.name})</span>}
				</h1>
				<BackButton to="/admin/roles" />
			</header>

			<section className="bg-white dark:bg-slate-900 rounded-xl shadow border border-slate-200 dark:border-slate-800 p-6">
				<div className="mb-6">
					<p className="font-semibold text-sm">Nombre del rol</p>
					<div className="mt-1 w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm">
						{role?.name || "—"}
					</div>
				</div>
				<h2 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-3">
					{" "}
					Permisos asignados{" "}
				</h2>

				{permissions.length === 0 ? (
					<div className="text-sm text-slate-500 dark:text-slate-400">
						{" "}
						Este rol no tiene permisos asignados.{" "}
					</div>
				) : (
					<div className="space-y-4 overflow-y-auto pr-1">
						{Object.entries(grouped).map(([module, perms]) => {
							const isOpen = openModules[module] ?? true;

							return (
								<div
									key={module}
									className="border border-slate-200 dark:border-slate-800 rounded-lg p-4 bg-slate-50/60 dark:bg-slate-900/60"
								>
									<button
										type="button"
										onClick={() => toggleModule(module)}
										className="w-full flex items-center justify-between px-3 py-2 rounded-md border border-slate-300/70 dark:border-slate-700
                    					bg-slate-200 text-slate-800 dark:bg-slate-900/80 dark:text-slate-50 text-left font-semibold text-sm md:text-base capitalize hover:bg-slate-300 dark:hover:bg-slate-800/80 transition"
									>
										<span>
											{module}{" "}
											<span className="text-xs font-normal opacity-70">
												{" "}
												({perms.length}){" "}
											</span>
										</span>
										{isOpen ? (
											<FiChevronUp className="text-sm" />
										) : (
											<FiChevronDown className="text-sm" />
										)}
									</button>

									{isOpen && (
										<div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
											{perms.map((perm) => (
												<div
													key={perm.id}
													className="flex flex-col gap-1 bg-white dark:bg-slate-800 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700"
												>
													<div className="text-sm font-semibold break-all">
														{" "}
														{perm.name}{" "}
													</div>
													{perm.description && (
														<div className="text-xs text-slate-500 dark:text-slate-400">
															{" "}
															{perm.description}{" "}
														</div>
													)}
												</div>
											))}
										</div>
									)}
								</div>
							);
						})}
					</div>
				)}
			</section>
		</div>
	);
}
