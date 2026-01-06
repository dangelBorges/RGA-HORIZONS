// utils/statusColors.js
export const getStatusColorClass = (status) => {
  const green = [
    "conforme",
    "cumple",
    "realizado",
    "ok",
    "aprobado",
    "terminado",
  ];
  const orange = ["pendiente", "en proceso"];
  const red = [
    "no conforme",
    "no aprobado",
    "malo",
    "roto",
    "descontinuado",
    "rechazado",
  ];

  if (!status) return "";
  const normalized = status.toLowerCase();
  if (green.includes(normalized)) return "text-emerald-600 font-bold";
  if (orange.includes(normalized)) return "text-amber-500 font-bold";
  if (red.includes(normalized)) return "text-red-500 font-bold";
  return "";
};
