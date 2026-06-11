import { useEffect } from "react";

export function useTabsDebug() {
	useEffect(() => {
		const PREFIX = "tab_heartbeat:";
		const TAB_ID = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
		const KEY = PREFIX + TAB_ID;

		const HEARTBEAT_MS = 5000; // cada 5s
		const TTL_MS = 15000; // tab vivo si ha latido en últimos 15s
		const COUNT_KEY = "open_tabs_count";

		const beat = () => {
			localStorage.setItem(KEY, Date.now().toString());
			updateCount();
		};

		const updateCount = () => {
			const now = Date.now();
			let count = 0;

			// cuenta tabs vivas y limpia las muertas
			for (let i = 0; i < localStorage.length; i++) {
				const k = localStorage.key(i);
				if (!k || !k.startsWith(PREFIX)) continue;

				const t = parseInt(localStorage.getItem(k) || "0", 10);

				if (!t || now - t > TTL_MS) {
					localStorage.removeItem(k);
				} else {
					count++;
				}
			}

			localStorage.setItem(COUNT_KEY, String(count));
		};

		// 1) primer beat al montar
		beat();

		// 2) interval de heartbeat
		const interval = setInterval(beat, HEARTBEAT_MS);

		// 3) si otra pestaña cambia storage, recalcula (opcional)
		const onStorage = (e) => {
			if (e.key?.startsWith(PREFIX)) updateCount();
		};
		window.addEventListener("storage", onStorage);

		// 4) al cerrar, removemos nuestra marca
		const onUnload = () => {
			localStorage.removeItem(KEY);
			updateCount();
		};
		window.addEventListener("beforeunload", onUnload);

		return () => {
			clearInterval(interval);
			window.removeEventListener("storage", onStorage);
			window.removeEventListener("beforeunload", onUnload);
			localStorage.removeItem(KEY);
			updateCount();
		};
	}, []);
}
