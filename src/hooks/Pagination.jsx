import { useState, useEffect } from "react";
import { privateInstance } from "../api/axios";

export default function usePagination(url, { perPage = 50, initialSearch = "" } = {}) {
  const [data, setData] = useState([]);
  const [search, setSearch] = useState(initialSearch);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchPage = async () => {
    try {
      setLoading(true);

      const { data: res } = await privateInstance.get(url, {
        params: {
          page,
          per_page: perPage,
          search: search.trim() || null,
        },
      });

      setData(res.data);
      setLastPage(res.last_page);
      setTotal(res.total);
    } catch (err) {
      console.error("Error en paginación:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPage();
  }, [page, search]);

  const reload = () => fetchPage();

  return {
    data,
    page,
    setPage,
    lastPage,
    total,
    search,
    setSearch,
    loading,
    reload,
  };
}
