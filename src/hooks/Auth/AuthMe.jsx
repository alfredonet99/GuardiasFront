import { useCallback, useEffect, useState } from "react";
import { privateInstance } from "../../api/axios";

export function useAuthMe() {
	const [loading, setLoading] = useState(true);
	const [isAdmin, setIsAdmin] = useState(false);
	const [user, setUser] = useState(null);
	const [roles, setRoles] = useState([]);
	const [perms, setPerms] = useState([]);

	const refresh = useCallback(async (opts = { perms: false }) => {
		const res = await privateInstance.get("/auth/me", {
			params: { perms: opts.perms ? 1 : 0 },
		});

		setUser(res.data.user || null);
		setIsAdmin(Boolean(res.data.isAdmin));
		setRoles(res.data.roles || []);
		setPerms(res.data.perms || []);
	}, []);

	useEffect(() => {
		let alive = true;

		refresh()
			.catch(() => {})
			.finally(() => {
				if (alive) setLoading(false);
			});

		return () => {
			alive = false;
		};
	}, [refresh]);

	return { loading, isAdmin, user, roles, perms, refresh };
}
