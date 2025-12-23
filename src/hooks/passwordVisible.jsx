import { useEffect, useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";

export function usePasswordToggle(value = "") {
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		if (!value) setVisible(false);
	}, [value]);

	const InputType = visible ? "text" : "password";

	const ToggleIcon = value ? (
		<button
			type="button"
			onClick={() => setVisible((v) => !v)}
			aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
			className="cursor-pointer text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
		>
			{visible ? (
				<FaEyeSlash aria-hidden="true" />
			) : (
				<FaEye aria-hidden="true" />
			)}
		</button>
	) : null;

	return [InputType, ToggleIcon];
}
