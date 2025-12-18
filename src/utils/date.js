import dayjs from "dayjs";
import "dayjs/locale/es";

dayjs.locale("es");

export function formatDate(value) {
  if (!value) return "—";
  const d = dayjs(value);
  return d.isValid() ? d.format("DD/MM/YYYY") : "—";
}

// ✅ Fecha + hora: DD/MM/YYYY HH:mm
export function formatDateTime(value) {
  if (!value) return "—";
  const d = dayjs(value);
  return d.isValid() ? d.format("DD/MM/YYYY HH:mm") : "—";
}
