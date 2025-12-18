// hooks/Auth/AuthCheck.jsx
import { useEffect, useRef, useState } from "react";
import { privateInstance } from "../../api/axios";
import { setSessionExpired } from "../../services/auth"; // donde pusiste setSessionExpired

const CHECK_INTERVAL_MS = 30000;
const DEBUG = true;

export function useAuthCheck({ isLeader }) {
  const [expired, setExpired] = useState(
    localStorage.getItem("sessionExpired") === "1"
  );

  const intervalRef = useRef(null);
  const inFlightRef = useRef(false);

  useEffect(() => {
    const sync = () => {
      setExpired(localStorage.getItem("sessionExpired") === "1");
    };

    const onStorage = (e) => {
      if (e.key === "sessionExpired" || e.key === "expired_at" || e.key === "session_reason") {
        sync();
      }
    };

    const onSessionChanged = () => sync();

    window.addEventListener("storage", onStorage);
    window.addEventListener("session:changed", onSessionChanged);

    // si no soy líder o ya expiró: no interval
    if (!isLeader || expired) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return () => {
        window.removeEventListener("storage", onStorage);
        window.removeEventListener("session:changed", onSessionChanged);
      };
    }

    if (DEBUG) console.log(`[authCheck] creando intervalo… (leader=${isLeader})`);

    intervalRef.current = setInterval(async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      if (inFlightRef.current) return;
      inFlightRef.current = true;

      try {
        await privateInstance.get("/auth/check");
      } catch (err) {
        const status = err?.response?.status;
        const reason = err?.response?.data?.reason;

        if (status === 401) {
          setSessionExpired("expired");
          setExpired(true);
        } else if (status === 403 && reason === "inactive") {
          setSessionExpired("inactive");
          setExpired(true);
        }
      } finally {
        inFlightRef.current = false;
      }
    }, CHECK_INTERVAL_MS);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("session:changed", onSessionChanged);
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      if (DEBUG) console.log("[authCheck] limpiando intervalo (unmount)");
    };
  }, [isLeader, expired]);

  return { expired };
}
