import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { privateInstance } from "../../api/axios";
import { useUser } from "../../components/context/userContext";
import ExitConfirm from "../../components/UI/ConfirmBtn/ExitConfirm";
import FlashMessage from "../../components/UI/Errors/ErrorsGlobal";
import useFlashMessage from "../../hooks/Errors/ErrorMessage";
import { usePasswordToggle } from "../../hooks/passwordVisible";
import { uploadAvatar } from "../../services/uploadAvatar";

export default function EditProfile() {
	const navigate = useNavigate();
	const { user, updateUser } = useUser();
	const role = user?.roles?.length
		? user.roles.map((r) => r.name).join(", ")
		: user?.role || "Sin Rol";
	const areaLabel = user?.roles?.some((r) => r.name === "Administrador")
		? "Todas las áreas"
		: user?.area?.name || "Sin área";

	const [name, setName] = useState(user.name);
	const [preview, setPreview] = useState(user.avatar);
	const [pendingAvatarFile, setPendingAvatarFile] = useState(null);
	const [loading, setLoading] = useState(false);
	const { message, showMessage, clearMessage } = useFlashMessage();

	const [passwords, setPasswords] = useState({
		current: "",
		new: "",
		confirm: "",
	});

	const isPasswordValid = !passwords.new || passwords.new.length >= 6;
	const doPasswordsMatch =
		!passwords.confirm || passwords.new === passwords.confirm;

	const [currentType, CurrentToggle] = usePasswordToggle(passwords.current);
	const [newType, NewToggle] = usePasswordToggle(passwords.new);
	const [confirmType, ConfirmToggle] = usePasswordToggle(passwords.confirm);

	const handleAvatarChange = (e) => {
		const file = e.target.files?.[0];
		if (!file) return;

		setPendingAvatarFile(file);
		setPreview(URL.createObjectURL(file));
	};

	const handleSaveProfile = async () => {
		clearMessage();
		try {
			setLoading(true);

			let avatarUrl = user.avatar;

			if (pendingAvatarFile) {
				avatarUrl = await uploadAvatar(pendingAvatarFile, user.id, user.avatar);
			}

			const { data } = await privateInstance.post("/profile/update", {
				name,
				avatar: avatarUrl,
			});

			if (passwords.current || passwords.new || passwords.confirm) {
				if (passwords.new !== passwords.confirm) {
					throw new Error("Las contraseñas no coinciden");
				}

				await privateInstance.post("/profile/update/password", {
					current_password: passwords.current,
					new_password: passwords.new,
					new_password_confirmation: passwords.confirm,
				});
			}

			localStorage.setItem("user", JSON.stringify(data.user));
			updateUser(data.user);
			setPendingAvatarFile(null);
			setPasswords({ current: "", new: "", confirm: "" });

			navigate("/inicio");
		} catch (error) {
			console.error(error);

			if (error.response?.data?.error) {
				showMessage(error.response.data.error, "error");
			} else if (error.response?.data?.message) {
				showMessage("No hemos podido procesar tu solicitud");
			} else {
				showMessage("Error al guardar el perfil", "error");
			}
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen w-full px-6 py-6 bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
			<div className="mb-6 flex items-center justify-between">
				<h1 className="text-2xl font-bold">Mi perfil</h1>
				<ExitConfirm to="/inicio" />
			</div>

			<div className="bg-white dark:bg-slate-900 rounded-xl shadow border border-slate-200 dark:border-slate-800 p-6 max-w-3xl mx-auto space-y-8">
				<section className="flex items-center gap-6">
					<img
						alt="Vista previa del avatar"
						src={preview}
						className="w-24 h-24 rounded-full object-cover border border-slate-300 dark:border-slate-700"
					/>

					<label className="cursor-pointer">
						<input
							type="file"
							hidden
							accept="image/*"
							onChange={handleAvatarChange}
							disabled={loading}
						/>
						<span className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 transition">
							{" "}
							Cambiar avatar{" "}
						</span>
					</label>
				</section>

				<section className="space-y-4">
					<h2 className="text-lg font-semibold">Datos básicos</h2>

					<div>
						<label htmlFor="user_name" className="font-medium">
							Nombre
						</label>
						<input
							value={name}
							onChange={(e) => setName(e.target.value)}
							className="mt-1 w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-600 outline-none"
						/>
					</div>

					<div>
						<label htmlFor="user_email" className="font-medium">
							Email
						</label>
						<input
							value={user.email}
							disabled
							className="mt-1 w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500"
						/>
					</div>

					<div>
						<label htmlFor="user_rol" className="font-medium">
							Rol
						</label>
						<input
							value={role || "Sin Rol"}
							disabled
							className="mt-1 w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500"
						/>
					</div>

					<div>
						<label htmlFor="user_area" className="font-medium">
							Área
						</label>
						<input
							value={areaLabel}
							disabled
							className="mt-1 w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500"
						/>
					</div>
				</section>

				<section className="space-y-4">
					<h2 className="text-lg font-semibold">Seguridad</h2>

					<div className="relative">
						<label htmlFor="user_passwordactual" className="font-medium">
							Contraseña Actual
						</label>
						<input
							type={currentType}
							value={passwords.current}
							onChange={(e) =>
								setPasswords({ ...passwords, current: e.target.value })
							}
							className="w-full mt-1 px-4 py-2 pr-10 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
						/>

						<div className="absolute mt-3 right-3 top-1/2 -translate-y-1/2">
							{" "}
							{CurrentToggle}{" "}
						</div>
					</div>

					<div className="space-y-1">
						<div className="relative">
							<label htmlFor="user_newpassword" className="font-medium">
								Nueva Contraseña
							</label>
							<input
								type={newType}
								value={passwords.new}
								onChange={(e) =>
									setPasswords({ ...passwords, new: e.target.value })
								}
								className={`mt-1 w-full px-4 py-2 pr-10 rounded-lg border 
                  ${
										!isPasswordValid
											? "border-red-500 focus:ring-red-500"
											: "border-slate-300 dark:border-slate-600 focus:ring-blue-600"
									}
                  bg-white dark:bg-slate-800`}
							/>

							<div className="absolute mt-3 right-3 top-1/2 -translate-y-1/2">
								{NewToggle}
							</div>
						</div>

						{!isPasswordValid && (
							<p className="text-sm text-red-600 dark:text-red-400">
								{" "}
								La contraseña debe tener al menos 6 caracteres.{" "}
							</p>
						)}
					</div>

					<div className="space-y-1">
						<div className="relative">
							<label htmlFor="user_passwordconfirm" className="font-medium">
								Confirmar Contraseña
							</label>
							<input
								type={confirmType}
								value={passwords.confirm}
								onChange={(e) =>
									setPasswords({ ...passwords, confirm: e.target.value })
								}
								className={`mt-1 w-full px-4 py-2 pr-10 rounded-lg border 
                  ${
										!doPasswordsMatch
											? "border-red-500 focus:ring-red-500"
											: "border-slate-300 dark:border-slate-600 focus:ring-blue-600"
									}
                  bg-white dark:bg-slate-800`}
							/>

							<div className="absolute mt-3 right-3 top-1/2 -translate-y-1/2">
								{ConfirmToggle}
							</div>
						</div>

						{!doPasswordsMatch && (
							<p className="text-sm text-red-600 dark:text-red-400">
								{" "}
								Las contraseñas no coinciden.{" "}
							</p>
						)}
					</div>

					<div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 px-4 py-3 text-sm text-blue-700 dark:text-blue-300">
						<p className="font-medium mb-1">ℹ️ Cambio de contraseña</p>
						<p>
							{" "}
							Al actualizar tu contraseña, la sesión actual se mantiene activa.{" "}
							<br /> La nueva contraseña se aplicará la próxima vez que inicies
							sesión.{" "}
						</p>
					</div>

					<FlashMessage message={message} />
				</section>

				<button
					type="button"
					onClick={handleSaveProfile}
					disabled={loading}
					className="w-full py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
				>
					{loading ? "Guardando..." : "Guardar cambios"}
				</button>
			</div>
		</div>
	);
}
