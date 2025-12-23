// hooks/Auth/RenovationToken.jsx
import { useEffect } from "react";

const ACTIVITY_BROADCAST_KEY = "auth_activity_ping_v1";

export function useActivityDebug() {
	useEffect(() => {
		const markActivity = () => {
			const now = Date.now().toString();
			localStorage.setItem("activity_seen", "1");
			localStorage.setItem("last_activity", now);
			window.dispatchEvent(new Event("auth:activity"));
			localStorage.setItem(ACTIVITY_BROADCAST_KEY, now);
		};

		const events = ["mousemove", "keydown", "click", "scroll"];

		events.forEach((ev) => {
			window.addEventListener(ev, markActivity);
		});

		const onStorage = (e) => {
			if (e.key !== ACTIVITY_BROADCAST_KEY) return;
			if (!e.newValue) return;

			localStorage.setItem("activity_seen", "1");
			localStorage.setItem("last_activity", e.newValue);
			window.dispatchEvent(new Event("auth:activity"));
		};

		window.addEventListener("storage", onStorage);

		return () => {
			events.forEach((ev) => {
				window.removeEventListener(ev, markActivity);
			});
			window.removeEventListener("storage", onStorage);
		};
	}, []);
}
