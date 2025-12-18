// hooks/Auth/RefreshTok.jsx
import { useEffect, useRef } from "react";
import { privateInstance } from "../../api/axios";
import { setSessionExpired } from "../../services/auth";

const ACTIVITY_WINDOW_SECONDS = 180;
const RENEW_THRESHOLD_SECONDS = 60;
const DEBUG = true;

export function useTokenRefresh({ isLeader }) {
  const timerRef = useRef(null);
  const inFlightRef = useRef(false);

  useEffect(() => {
    if (!isLeader) {
      if (DEBUG) console.log("[refresh] no soy líder, no refresco");
      return;
    }

    if (DEBUG) console.log("[refresh] hook montado ✅ (leader)");

    const clearTimer = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    const schedule = (ms) => {
      clearTimer();
      timerRef.current = setTimeout(tick, Math.max(250, ms));
    };

    const isActiveNow = () => {
      const seen = localStorage.getItem("activity_seen") === "1";
      const lastStr = localStorage.getItem("last_activity");
      if (!seen || !lastStr) return false;

      const inactive = Math.floor((Date.now() - parseInt(lastStr, 10)) / 1000);
      const ok = inactive <= ACTIVITY_WINDOW_SECONDS;
      if (DEBUG) console.log(`[refresh] inactive=${inactive}s active=${ok}`);
      return ok;
    };

    const tick = async () => {
      if (localStorage.getItem("sessionExpired") === "1") {
        if (DEBUG) console.log("[refresh] sessionExpired=1, detengo");
        clearTimer();
        return;
      }

      const token = localStorage.getItem("token");
      const expStr = localStorage.getItem("token_expires_at");
      if (!token || !expStr) return;

      const secondsLeft = Math.floor((parseInt(expStr, 10) - Date.now()) / 1000);
      if (DEBUG) console.log(`[refresh] secondsLeft=${secondsLeft}`);

      if (secondsLeft <= 0) return;

      if (secondsLeft > RENEW_THRESHOLD_SECONDS) {
        schedule((secondsLeft - RENEW_THRESHOLD_SECONDS) * 1000);
        return;
      }

      if (!isActiveNow()) {
        if (DEBUG) console.log("[refresh] inactivo en ventana → me duermo hasta actividad");
        clearTimer();
        return;
      }

      if (inFlightRef.current) {
        schedule(1000);
        return;
      }

      inFlightRef.current = true;
      try {
        if (DEBUG) console.log("[refresh] intentando renovar…");
        const { data } = await privateInstance.post("/auth/refresh");

        localStorage.setItem("token", data.token);
        const newExp = Date.now() + data.expires_in * 1000;
        localStorage.setItem("token_expires_at", newExp.toString());

        if (DEBUG) console.log("[refresh] renovado ✅, nuevo exp=", newExp);

        const secondsLeft2 = Math.floor((newExp - Date.now()) / 1000);
        schedule(Math.max((secondsLeft2 - RENEW_THRESHOLD_SECONDS) * 1000, 250));
      } catch (err) {
        const status = err?.response?.status;
        const reason = err?.response?.data?.reason;

        if (status === 401) setSessionExpired("expired");
        if (status === 403 && reason === "inactive") setSessionExpired("inactive");

        schedule(5000);
      } finally {
        inFlightRef.current = false;
      }
    };

    const wakeOnActivity = () => {
      if (!timerRef.current && localStorage.getItem("token")) {
        if (DEBUG) console.log("[refresh] actividad → despierto refresh");
        schedule(0);
      }
    };

    window.addEventListener("auth:activity", wakeOnActivity);

    // init
    const expStr = localStorage.getItem("token_expires_at");
    if (expStr) {
      const secondsLeft = Math.floor((parseInt(expStr, 10) - Date.now()) / 1000);
      if (secondsLeft > RENEW_THRESHOLD_SECONDS) {
        schedule((secondsLeft - RENEW_THRESHOLD_SECONDS) * 1000);
      } else if (secondsLeft > 0) {
        schedule(0);
      }
    }

    return () => {
      window.removeEventListener("auth:activity", wakeOnActivity);
      clearTimer();
      if (DEBUG) console.log("[refresh] hook desmontado 🧹");
    };
  }, [isLeader]);
}
