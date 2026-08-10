// hooks/Auth/TabLeader.jsx
import { useEffect, useRef, useState } from "react";
import { devLog } from "../../utils/devLogs";

const KEY = "auth_leader";
const HEARTBEAT_MS = 4000;
const STALE_MS = 12000; // si el líder no actualiza en 12s → se considera muerto

function makeTabId() {
	// Si existe randomUUID, úsalo
	if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();

	// Fallback: suficiente para identificar pestañas
	return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function useTabLeader(DEBUG = false) {
	const [isLeader, setIsLeader] = useState(false);
	const tabId = useRef(makeTabId()).current;
	const lastLogRef = useRef(null);

	useEffect(() => {
		const now = () => Date.now();

		const readLeader = () => {
			try {
				const raw = localStorage.getItem(KEY);
				return raw ? JSON.parse(raw) : null;
			} catch {
				return null;
			}
		};

		const writeLeader = (id) => {
			localStorage.setItem(KEY, JSON.stringify({ id, ts: now() }));
		};

		const tryAcquire = () => {
			const leader = readLeader();
			const isDead = !leader || now() - leader.ts > STALE_MS;
			const iAmLeader = leader?.id === tabId;

			if (isDead) {
				writeLeader(tabId);
				if (!isLeader) {
					setIsLeader(true);
					if (DEBUG) devLog(`[leader] tomo liderazgo 🟢 ${tabId}`);
				}
			} else if (iAmLeader) {
				writeLeader(tabId);
				if (!isLeader) {
					setIsLeader(true);
					if (DEBUG) devLog(`[leader] sigo siendo líder ✅ ${tabId}`);
				}
			} else {
				if (isLeader) {
					setIsLeader(false);
					if (DEBUG) devLog(`[leader] cedo liderazgo 🔴 ${tabId}`);
				}
			}
		};

		tryAcquire();
		const interval = setInterval(tryAcquire, HEARTBEAT_MS);

		const onStorage = (e) => {
			if (e.key === KEY) tryAcquire();
		};
		window.addEventListener("storage", onStorage);

		const onUnload = () => {
			const leader = readLeader();
			if (leader?.id === tabId) localStorage.removeItem(KEY);
		};
		window.addEventListener("beforeunload", onUnload);

		return () => {
			clearInterval(interval);
			window.removeEventListener("storage", onStorage);
			window.removeEventListener("beforeunload", onUnload);
		};
	}, [tabId, isLeader, DEBUG]);

	useEffect(() => {
		if (DEBUG && lastLogRef.current !== isLeader) {
			lastLogRef.current = isLeader;
			devLog(
				isLeader
					? `[leader] soy líder ✅ ${tabId}`
					: `[leader] soy follower 💤 ${tabId}`,
			);
		}
	}, [isLeader, DEBUG, tabId]);

	return { isLeader, tabId };
}
