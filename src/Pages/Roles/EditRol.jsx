import { useEffect, useMemo, useState } from "react";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";
import { useNavigate, useParams } from "react-router-dom";
import { privateInstance } from "../../api/axios";
import ExitConfirm from "../../components/UI/ConfirmBtn/ExitConfirm";
import FieldError from "../../components/UI/Errors/ElementsErrors";
import FlashMessage from "../../components/UI/Errors/ErrorsGlobal";
import { useAuthMe } from "../../hooks/Auth/AuthMe";
import { useAutoClearErrors } from "../../hooks/Errors/clearErrorMessage";
import useFlashMessage from "../../hooks/Errors/ErrorMessage";
import { useFieldErrors } from "../../hooks/Errors/MessageInputs";
import { refreshPermissions } from "../../services/auth";
import PermissionDenied from "../Errors/PermissionDenied";

export default function EditRol() {
	const navigate = useNavigate();
	const { id } = useParams();
	const { isAdmin, loading: loadingMe } = useAuthMe();
	const [targetIsAdmin, setTargetIsAdmin] = useState(null);
	const [denied, setDenied] = useState(false);

	const { localErrors, errorKey, validateFields, clearError } =
		useFieldErrors();
	const { message, showMessage, clearMessage } = useFlashMessage();

	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);

	const [roleName, setRoleName] = useState("");
	const [permissions, setPermissions] = useState([]);
	const [assigned, setAssigned] = useState([]);
	const [openModules, setOpenModules] = useState({});

	const formValues = { roleName, assigned };
	useAutoClearErrors(formValues, localErrors, clearError);

	useEffect(() => {
		if (!id) return;

		let alive = true;

		const loadData = async () => {
			try {
				const res = await privateInstance.get(`/roles/${id}/editar`);
				if (!alive) return;

				const perms = res.data.permissions || [];
				setPermissions(perms);

				const role = res.data.role || {};
				setRoleName(role.name || "");

				setTargetIsAdmin((role.name || "") === "Administrador");

				const fromRole = Array.isArray(role.permissions)
					? role.permissions.map((p) => p.name).filter(Boolean)
					: [];

				const fromAssigned = Array.isArray(res.data.assigned)
					? res.data.assigned.filter(Boolean)
					: [];

				setAssigned(fromAssigned.length ? fromAssigned : fromRole);
			} catch (err) {
				if (!alive) return;

				console.error("Error al cargar rol:", err);
				showMessage("No se pudo cargar la información del rol.", "error");
			} finally {
				if (alive) setLoading(false);
			}
		};

		loadData();

		return () => {
			alive = false;
		};
	}, [id, showMessage]);

	useEffect(() => {
		if (loadingMe) return;
		if (loading) return;
		if (targetIsAdmin === null) return;

		if (!isAdmin && targetIsAdmin && !denied) {
			showMessage(
				"No tienes permiso para editar el rol Administrador.",
				"error",
			);
			setDenied(true);
		}
	}, [loadingMe, loading, isAdmin, targetIsAdmin, denied, showMessage]);

	const grouped = useMemo(() => {
		const groups = {};
		permissions.forEach((perm) => {
			const [module] = (perm.name || "").split(".");
			if (!module) return;
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

	const togglePermission = (permName) => {
		setAssigned((prev) =>
			prev.includes(permName)
				? prev.filter((p) => p !== permName)
				: [...prev, permName],
		);
	};

	const selectAll = (perms) => {
		const all = perms.map((p) => p.name).filter(Boolean);
		setAssigned((prev) => Array.from(new Set([...prev, ...all])));
	};

	const selectNone = (perms) => {
		const all = perms.map((p) => p.name).filter(Boolean);
		setAssigned((prev) => prev.filter((p) => !all.includes(p)));
	};

	const handleUpdate = async () => {
		clearMessage();

		const rules = {
			roleName: { required: true, message: "Ingresa un nombre de rol valido" },
			assigned: { required: true, message: "Selecciona al menos un permiso." },
		};

		const isValid = validateFields(rules, { roleName, assigned });
		if (!isValid) return;

		setSaving(true);
		try {
			await privateInstance.put(`/roles/${id}`, {
				permissions: assigned,
			});

			await refreshPermissions();
			navigate("/admin/roles");
		} catch (err) {
			console.error("Error al actualizar rol:", err);

			if (err.response?.status === 422) {
				const errs = err.response.data?.errors;
				if (errs) {
					const first = Object.values(errs)[0]?.[0];
					showMessage(first || "Revisa los campos del formulario.", "error");
				} else {
					showMessage(
						err.response.data?.message || "No se pudo actualizar el rol.",
						"error",
					);
				}
			} else if (err.response?.status === 403) {
				showMessage(
					err.response.data?.message || "No tienes permiso para esta acción.",
					"error",
				);
			} else {
				showMessage("No se pudo actualizar el rol. Intenta de nuevo.", "error");
			}
		} finally {
			setSaving(false);
		}
	};

	if (loading) {
		return (
			<div className="p-6 text-center text-slate-500 dark:text-slate-300">
				{" "}
				Cargando formulario...{" "}
			</div>
		);
	}

	if (loadingMe) return null;
	if (denied) return <PermissionDenied />;

	return (
		<div className="min-h-screen w-full px-6 py-6 bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
			<header className="flex items-center justify-between mb-6">
				<h1 className="text-2xl font-bold flex items-center gap-2 mx-1">
					Editar Rol
				</h1>
				<ExitConfirm to="/admin/roles" />
			</header>

			<section className="bg-white dark:bg-slate-900 rounded-xl shadow border border-slate-200 dark:border-slate-800 p-6">
				<div className="mb-6">
					<label htmlFor="" className="font-semibold text-sm">
						Nombre del rol
					</label>
					<input
						type="text"
						disabled
						value={roleName}
						onChange={(e) => setRoleName(e.target.value)}
						placeholder="Ej. supervisor_operaciones"
						className="mt-1 w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-600 outline-none cursor-not-allowed"
					/>
					<FieldError message={localErrors.roleName} resetKey={errorKey} />
				</div>

				<div className="space-y-4 pr-1 overflow-visible">
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
									<>
										<div className="flex justify-end gap-2 text-xs mt-3 mb-2">
											<button
												type="button"
												onClick={() => selectAll(perms)}
												className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700"
											>
												Todos
											</button>
											<button
												type="button"
												onClick={() => selectNone(perms)}
												className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700"
											>
												Ninguno
											</button>
										</div>

										<div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
											{perms.map((perm) => (
												<label
													key={perm.id}
													className="flex items-start gap-2 cursor-pointer bg-white dark:bg-slate-800 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
												>
													<input
														type="checkbox"
														checked={assigned.includes(perm.name)}
														onChange={() => togglePermission(perm.name)}
													/>
													<div>
														<div className="text-sm font-semibold">
															{perm.name}
														</div>
														<div className="text-xs text-slate-500 dark:text-slate-400">
															{" "}
															{perm.description}{" "}
														</div>
													</div>
												</label>
											))}
										</div>
									</>
								)}
							</div>
						);
					})}

					<FieldError message={localErrors.assigned} resetKey={errorKey} />
				</div>

				<FlashMessage message={message} />

				<div className="mt-6 flex justify-end">
					<button
						type="button"
						onClick={handleUpdate}
						disabled={saving}
						className={`px-5 py-2 rounded-lg text-white transition shadow-sm ${saving ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}
					>
						{saving ? "Guardando..." : "Guardar cambios"}
					</button>
				</div>
			</section>
		</div>
	);
}
