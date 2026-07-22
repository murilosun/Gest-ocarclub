export const DEFAULT_BRAND = {
  name: "ClubOS",
  suffix: "by Car Club",
  mark: "C",
  accent: "#FF6A00",
};

export const PALETTE = {
  bg: "#111111",
  surface: "#1A1A1C",
  surfaceAlt: "#202022",
  border: "rgba(255,255,255,0.08)",
  white: "#FFFFFF",
  textDim: "#9A9AA0",
  success: "#30D158",
  warning: "#FFD60A",
  danger: "#FF453A",
};

export const STATUS_FLOW = ["Recebido", "Lavagem", "Polimento", "Vitrificação", "Higienização", "Finalizado", "Entregue"];

export const APPT_STATUS = ["Agendado", "Confirmado", "Em andamento", "Finalizado", "Cancelado"];

export const STATUS_COLOR: Record<string, string> = {
  "Agendado": "#9A9AA0",
  "Confirmado": "#30D158",
  "Em andamento": "#FF6A00",
  "Finalizado": "#3B82F6",
  "Cancelado": "#FF453A",
  "Entregue": "#30D158",
  "Recebido": "#9A9AA0",
  "Lavagem": "#5AC8FA",
  "Polimento": "#FF6A00",
  "Vitrificação": "#BF5AF2",
  "Higienização": "#FFD60A",
};

export const todayISO = () => new Date().toISOString().slice(0, 10);

export const money = (n: number) => (Number(n) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export const onlyDigits = (s: string) => (s || "").replace(/\D/g, "");

export const waLink = (phone: string, text: string) => `https://wa.me/55${onlyDigits(phone)}?text=${encodeURIComponent(text)}`;
