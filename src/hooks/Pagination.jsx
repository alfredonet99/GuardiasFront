import { useCallback, useEffect, useState } from "react";
import { privateInstance } from "../api/axios";

export default function usePagination(
	url,
	{ perPage = 50, initialSearch = "" } = {},
) {
	const [data, setData] = useState([]);
	const [search, setSearch] = useState(initialSearch);
	const [page, setPage] = useState(1);
	const [lastPage, setLastPage] = useState(1);
	const [total, setTotal] = useState(0);
	const [loading, setLoading] = useState(true);

	const fetchPage = useCallback(async () => {
		try {
			setLoading(true);

			const { data: res } = await privateInstance.get(url, {
				params: {
					page,
					per_page: perPage,
					search: search.trim() || null,
				},
			});

			setData(res.data || []);
			setLastPage(res.last_page ?? 1);
			setTotal(res.total ?? 0);
		} catch (err) {
			console.error("Error en paginación:", err);
		} finally {
			setLoading(false);
		}
	}, [url, page, perPage, search]);

	useEffect(() => {
		fetchPage();
	}, [fetchPage]);

	const reload = useCallback(() => {
		fetchPage();
	}, [fetchPage]);

	return {
		data,
		search,
		setSearch,
		page,
		setPage,
		lastPage,
		total,
		loading,
		reload,
	};
}
