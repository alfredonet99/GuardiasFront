import { useState } from "react";

export function useNumCV(initialValue = "") {
	const [displayValue, setDisplayValue] = useState(initialValue);
	const [payloadValue, setPayloadValue] = useState(initialValue);

	const WORD = "INTERNO";

	const handleChange = (val) => {
		val = val.toUpperCase();

		if (val === "") {
			setDisplayValue("");
			setPayloadValue("");
			return;
		}

		if (/^\d{0,7}$/.test(val)) {
			setDisplayValue(val);
			setPayloadValue(val);
			return;
		}

		if (WORD.startsWith(val)) {
			setDisplayValue(val);
			setPayloadValue(val);
			return;
		}
	};

	const handleBlur = () => {
		if (displayValue.trim() === "") {
			setPayloadValue("NO IDENTIFICADO");
		}
	};

	return {
		displayValue,
		payloadValue,
		handleChange,
		handleBlur,
	};
}
