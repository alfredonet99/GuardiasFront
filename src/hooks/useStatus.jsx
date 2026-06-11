import { useState } from "react";

export default function useOptimisticToggle({
	setItems,
	getId = (x) => x.id,
	getBool,
	setBool,
	buildUrl,
	buildBody = (next) => ({ activo: next }),
	readBoolFromResponse,
	client,
}) {
	const [loadingId, setLoadingId] = useState(null);

	const toggle = async (item) => {
		const id = getId(item);
		const next = !getBool(item);

		setItems((prev) =>
			prev.map((x) => (getId(x) === id ? setBool(x, next) : x)),
		);
		setLoadingId(id);

		try {
			const res = await client.patch(buildUrl(item), buildBody(next));

			const finalBool = readBoolFromResponse
				? Boolean(readBoolFromResponse(res, next))
				: next;

			setItems((prev) =>
				prev.map((x) => (getId(x) === id ? setBool(x, finalBool) : x)),
			);
		} catch (err) {
			console.error("Toggle error:", err);

			// ✅ Rollback
			setItems((prev) =>
				prev.map((x) => (getId(x) === id ? setBool(x, !next) : x)),
			);
		} finally {
			setLoadingId(null);
		}
	};

	return { toggle, loadingId };
}
