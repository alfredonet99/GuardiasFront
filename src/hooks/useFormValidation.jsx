import { useState } from "react";

export function useFormValidation(initialValues = {}) {
	const [values, setValues] = useState(initialValues);
	const [errors, setErrors] = useState({});

	const validateField = (name, value) => {
		let error = "";

		if (name === "email") {
			if (!value.trim()) {
				error = "EL CORREO ES OBLIGATORIO.";
			} else {
				const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
				if (!emailRegex.test(value)) {
					error = "EL CORREO NO ES VÁLIDO.";
				}
			}
		}

		if (name === "password") {
			if (!value.trim()) {
				error = "LA CONTRASEÑA ES OBLIGATORIA.";
			}
		}

		return error;
	};

	const handleChange = (e) => {
		const { name, value } = e.target;
		setValues({ ...values, [name]: value });
	};

	const handleBlur = (e) => {
		const { name, value } = e.target;
		const error = validateField(name, value);

		setErrors((prev) => ({
			...prev,
			[name]: error,
		}));

		// 👇 limpiar ese error a los 2 segundos
		if (error) {
			setTimeout(() => {
				setErrors((prev) => ({ ...prev, [name]: "" }));
			}, 2000);
		}
	};

	const validateForm = () => {
		const newErrors = {};
		Object.keys(values).forEach((name) => {
			const error = validateField(name, values[name]);
			if (error) newErrors[name] = error;
		});
		setErrors(newErrors);

		// 👇 limpiar todos los errores a los 2 segundos
		if (Object.keys(newErrors).length > 0) {
			setTimeout(() => {
				setErrors({});
			}, 2000);
		}

		return Object.keys(newErrors).length === 0;
	};

	return { values, errors, handleChange, handleBlur, validateForm };
}
