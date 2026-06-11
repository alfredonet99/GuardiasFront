import { usePasswordToggle } from "../../../hooks/passwordVisible";
import FieldError from "../Errors/ElementsErrors";

export default function PasswordSectionUI({
	password,
	setPassword,
	confirm,
	setConfirm,
	errors,
	errorKey,
	isTouched,
	markTouched,
}) {
	const [PasswordType, PasswordToggle] = usePasswordToggle(password);
	const [ConfirmType, ConfirmToggle] = usePasswordToggle(confirm);

	// 🔹 UI password min length
	const showMinLengthError =
		isTouched("password") && password.length > 0 && password.length < 6;

	// 🔹 UI confirm mismatch
	const showConfirmMismatch =
		isTouched("confirm") &&
		confirm.length > 0 &&
		password.length > 0 &&
		confirm !== password;

	return (
		<div className="space-y-5">
			<div>
				<label htmlFor="" className="font-semibold text-sm">
					Contraseña
				</label>

				<div className="relative mt-1">
					<input
						type={PasswordType}
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						onBlur={() => markTouched("password")}
						placeholder="••••••••"
						className={`w-full px-4 py-2 pr-10 rounded-lg border 
              				${
												showMinLengthError ||
												(isTouched("password") && errors.password)
													? "border-red-500 focus:ring-red-500"
													: "border-slate-300 dark:border-slate-700 focus:ring-blue-600"
											}
              			  bg-white dark:bg-slate-800 outline-none`}
					/>

					{password && (
						<div className="absolute right-3 top-1/2 -translate-y-1/2">
							{PasswordToggle}
						</div>
					)}
				</div>

				{showMinLengthError && (
					<p className="mt-1 text-sm text-red-600 dark:text-red-400">
						La contraseña debe tener al menos 6 caracteres.
					</p>
				)}

				{!showMinLengthError && isTouched("password") && (
					<FieldError message={errors.password} resetKey={errorKey} />
				)}
			</div>

			<div>
				<label htmlFor="" className="font-semibold text-sm">
					Confirmar contraseña
				</label>

				<div className="relative mt-1">
					<input
						type={ConfirmType}
						value={confirm}
						onChange={(e) => setConfirm(e.target.value)}
						onBlur={() => markTouched("confirm")}
						placeholder="••••••••"
						className={`w-full px-4 py-2 pr-10 rounded-lg border 
              				${
												showConfirmMismatch ||
												(isTouched("confirm") && errors.confirm)
													? "border-red-500 focus:ring-red-500"
													: "border-slate-300 dark:border-slate-700 focus:ring-blue-600"
											}
              				bg-white dark:bg-slate-800 outline-none`}
					/>

					{confirm && (
						<div className="absolute right-3 top-1/2 -translate-y-1/2">
							{ConfirmToggle}
						</div>
					)}
				</div>

				{/* UI inmediato */}
				{showConfirmMismatch && (
					<p className="mt-1 text-sm text-red-600 dark:text-red-400">
						Las contraseñas no coinciden.
					</p>
				)}

				{/* Error submit */}
				{!showConfirmMismatch && isTouched("confirm") && (
					<FieldError message={errors.confirm} resetKey={errorKey} />
				)}
			</div>
		</div>
	);
}
