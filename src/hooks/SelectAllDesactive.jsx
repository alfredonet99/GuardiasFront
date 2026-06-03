import { useCallback, useMemo, useState } from "react";

export default function SelectAllDesactive({
	items = [],
	getId = (item) => item.id,
	canSelect = () => true,
} = {}) {
	const [selectionMode, setSelectionMode] = useState(false);
	const [selectedIds, setSelectedIds] = useState([]);

	const selectableItems = useMemo(
		() => items.filter((item) => canSelect(item)),
		[items, canSelect],
	);

	const selectableIds = useMemo(
		() => selectableItems.map((item) => getId(item)),
		[selectableItems, getId],
	);

	const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);

	const selectedItems = useMemo(
		() => items.filter((item) => selectedIdSet.has(getId(item))),
		[items, selectedIdSet, getId],
	);

	const selectedCount = selectedIds.length;

	const allVisibleSelected =
		selectableIds.length > 0 &&
		selectableIds.every((id) => selectedIdSet.has(id));

	const hasSelected = selectedCount > 0;

	const someVisibleSelected =
		selectableIds.some((id) => selectedIdSet.has(id)) && !allVisibleSelected;

	const toggleSelectionMode = useCallback(() => {
		setSelectionMode((prev) => {
			const next = !prev;

			if (!next) {
				setSelectedIds([]);
			}

			return next;
		});
	}, []);

	const openSelectionMode = useCallback(() => {
		setSelectionMode(true);
	}, []);

	const closeSelectionMode = useCallback(() => {
		setSelectionMode(false);
		setSelectedIds([]);
	}, []);

	const clearSelection = useCallback(() => {
		setSelectedIds([]);
	}, []);

	const isSelected = useCallback(
		(itemOrId) => {
			const id =
				typeof itemOrId === "object" && itemOrId !== null
					? getId(itemOrId)
					: itemOrId;

			return selectedIdSet.has(id);
		},
		[selectedIdSet, getId],
	);

	const toggleOne = useCallback(
		(itemOrId) => {
			const id =
				typeof itemOrId === "object" && itemOrId !== null
					? getId(itemOrId)
					: itemOrId;

			setSelectedIds((prev) =>
				prev.includes(id)
					? prev.filter((selectedId) => selectedId !== id)
					: [...prev, id],
			);
		},
		[getId],
	);

	const toggleAllVisible = useCallback(() => {
		setSelectedIds((prev) => {
			const allSelected =
				selectableIds.length > 0 &&
				selectableIds.every((id) => prev.includes(id));

			if (allSelected) {
				return prev.filter((id) => !selectableIds.includes(id));
			}

			return Array.from(new Set([...prev, ...selectableIds]));
		});
	}, [selectableIds]);

	return {
		selectionMode,
		selectedIds,
		selectedItems,
		selectedCount,
		selectableCount: selectableIds.length,
		hasSelected,
		allVisibleSelected,
		someVisibleSelected,

		toggleSelectionMode,
		openSelectionMode,
		closeSelectionMode,
		clearSelection,

		isSelected,
		toggleOne,
		toggleAllVisible,
	};
}
