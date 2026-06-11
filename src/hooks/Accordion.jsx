// src/hooks/UI/useAccordion.js
import { useCallback, useMemo, useState } from "react";

/**
 * Accordion genérico por ID (no por index).
 *
 * @param {{ single?: boolean, defaultOpenIds?: Array<string | number> }} opts
 *  - single: si true, solo 1 item puede estar abierto a la vez
 *  - defaultOpenIds: ids que arrancan abiertos
 */
export default function useAccordion(opts = {}) {
	const { single = false, defaultOpenIds = [] } = opts;

	const [openIds, setOpenIds] = useState(
		() => new Set(defaultOpenIds.map(String)),
	);

	const isOpen = useCallback((id) => openIds.has(String(id)), [openIds]);

	const open = useCallback(
		(id) => {
			const key = String(id);
			setOpenIds((prev) => {
				const next = new Set(prev);
				if (single) next.clear();
				next.add(key);
				return next;
			});
		},
		[single],
	);

	const close = useCallback((id) => {
		const key = String(id);
		setOpenIds((prev) => {
			const next = new Set(prev);
			next.delete(key);
			return next;
		});
	}, []);

	const toggle = useCallback(
		(id) => {
			const key = String(id);
			setOpenIds((prev) => {
				const next = new Set(prev);
				const currentlyOpen = next.has(key);

				if (single) {
					next.clear();
					if (!currentlyOpen) next.add(key);
					return next;
				}

				// multi
				if (currentlyOpen) next.delete(key);
				else next.add(key);
				return next;
			});
		},
		[single],
	);

	const closeAll = useCallback(() => setOpenIds(new Set()), []);
	const openAll = useCallback((ids) => {
		setOpenIds(new Set((ids || []).map(String)));
	}, []);

	const openCount = useMemo(() => openIds.size, [openIds]);

	return {
		isOpen,
		open,
		close,
		toggle,
		openAll,
		closeAll,
		openCount,
	};
}
