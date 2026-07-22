/**
 * PrintOS — Componente de impressão para Ordens de Serviço
 * Renderiza um div oculto que só aparece via @media print.
 * Suporta dois formatos: "receipt" (notinha 80mm) e "a4" (folha A4).
 */

import { money } from "@/lib/utils";

export type PrintMode = "receipt" | "a4";

interface PrintOSProps {
  order: any;
  client?: any;
  mode: PrintMode;
  brandName?: string;
  brandSuffix?: string;
}

function fmt(iso: string) {
  return new Date(iso + "T00:00").toLocaleDateString("pt-BR");
}

function Line() {
  return (
    <div style={{
      borderTop: "1px dashed #555",
      margin: "8px 0",
    }} />
  );
}

/* ── Receipt / Notinha (80mm térmica) ────────────────────── */
function ReceiptLayout({ order, client, brandName, brandSuffix }: Omit<PrintOSProps, "mode">) {
  const valueNum   = Number(order.value) || 0;
  const discountPct = Number(order.discount) || 0;
  const discountVal = valueNum * (discountPct / 100);
  const total      = valueNum - discountVal;

  return (
    <div style={{
      fontFamily: "'Courier New', Courier, monospace",
      fontSize: 11,
      color: "#000",
      background: "#fff",
      width: "100%",
      maxWidth: 280,
      margin: "0 auto",
      padding: "8px 4px",
      lineHeight: 1.5,
    }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 6 }}>
        <div style={{ fontSize: 15, fontWeight: "bold", letterSpacing: 1 }}>{brandName || "CLUBOS"}</div>
        {brandSuffix && <div style={{ fontSize: 10, color: "#555" }}>{brandSuffix}</div>}
      </div>

      <Line />

      {/* OS + Data */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span><b>{order.code || order.id}</b></span>
        <span>{fmt(order.createdAt)}</span>
      </div>

      <Line />

      {/* Cliente */}
      <div style={{ fontWeight: "bold", fontSize: 10, textTransform: "uppercase", color: "#555" }}>CLIENTE</div>
      <div>{order.clientName}</div>
      {client?.phone && <div style={{ color: "#555" }}>{client.phone}</div>}

      <Line />

      {/* Veículo */}
      <div style={{ fontWeight: "bold", fontSize: 10, textTransform: "uppercase", color: "#555" }}>VEÍCULO</div>
      <div>{order.vehicleLabel || "Não informado"}</div>

      <Line />

      {/* Serviço */}
      <div style={{ fontWeight: "bold", fontSize: 10, textTransform: "uppercase", color: "#555" }}>SERVIÇO</div>
      <div>{order.serviceName}</div>
      {order.tech && <div style={{ color: "#555" }}>Resp: {order.tech}</div>}

      <Line />

      {/* Valores */}
      <div style={{ fontWeight: "bold", fontSize: 10, textTransform: "uppercase", color: "#555" }}>VALORES</div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span>Valor:</span><span>{money(valueNum)}</span>
      </div>
      {discountPct > 0 && (
        <div style={{ display: "flex", justifyContent: "space-between", color: "#555" }}>
          <span>Desconto ({discountPct}%):</span><span>-{money(discountVal)}</span>
        </div>
      )}

      <Line />

      <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: 13 }}>
        <span>TOTAL:</span><span>{money(total)}</span>
      </div>

      <Line />

      {/* Observações */}
      {order.notes && (
        <>
          <div style={{ fontWeight: "bold", fontSize: 10, textTransform: "uppercase", color: "#555" }}>OBSERVAÇÕES</div>
          <div style={{ whiteSpace: "pre-wrap", color: "#333" }}>{order.notes}</div>
          <Line />
        </>
      )}

      {/* Status */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ color: "#555" }}>Status:</span>
        <b>{order.status}</b>
      </div>

      <Line />

      {/* Assinatura */}
      <div style={{ marginTop: 16 }}>
        <div style={{ color: "#555", fontSize: 10 }}>Assinatura do cliente:</div>
        <div style={{ borderBottom: "1px solid #000", marginTop: 24, marginBottom: 4 }} />
        <div style={{ fontSize: 10, color: "#555", textAlign: "center" }}>{order.clientName}</div>
      </div>

      <div style={{ textAlign: "center", marginTop: 12, fontSize: 9, color: "#999" }}>
        Impresso em {new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
      </div>
    </div>
  );
}

/* ── A4 Format ───────────────────────────────────────────── */
function A4Layout({ order, client, brandName, brandSuffix }: Omit<PrintOSProps, "mode">) {
  const valueNum    = Number(order.value) || 0;
  const discountPct = Number(order.discount) || 0;
  const discountVal = valueNum * (discountPct / 100);
  const total       = valueNum - discountVal;

  const cell: React.CSSProperties = {
    padding: "10px 14px",
    background: "#f8f8f8",
    borderRadius: 6,
    border: "1px solid #e0e0e0",
    marginBottom: 12,
  };
  const label: React.CSSProperties = {
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
    color: "#888",
    letterSpacing: 0.5,
    marginBottom: 4,
  };
  const value: React.CSSProperties = {
    fontSize: 14,
    color: "#111",
    fontWeight: 500,
  };

  return (
    <div style={{
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: 13,
      color: "#111",
      background: "#fff",
      padding: "24px 32px",
      lineHeight: 1.5,
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, paddingBottom: 16, borderBottom: "2px solid #111" }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: "bold", letterSpacing: -0.5 }}>{brandName || "ClubOS"}</div>
          {brandSuffix && <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{brandSuffix}</div>}
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 20, fontWeight: "bold" }}>{order.code || order.id}</div>
          <div style={{ fontSize: 12, color: "#888" }}>Data de abertura: {fmt(order.createdAt)}</div>
          <div style={{
            display: "inline-block",
            marginTop: 6,
            padding: "2px 10px",
            borderRadius: 99,
            background: order.status === "Finalizado" ? "#dcfce7" : order.status === "Em atendimento" ? "#fff3e0" : "#f3f4f6",
            color: order.status === "Finalizado" ? "#16a34a" : order.status === "Em atendimento" ? "#e65100" : "#555",
            fontSize: 11,
            fontWeight: "bold",
          }}>{order.status}</div>
        </div>
      </div>

      {/* ORDEM DE SERVIÇO title */}
      <div style={{ fontSize: 11, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 2, color: "#888", marginBottom: 16 }}>
        Ordem de Serviço
      </div>

      {/* Two columns: Cliente | Veículo */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <div style={cell}>
          <div style={label}>Cliente</div>
          <div style={value}>{order.clientName}</div>
          {client?.phone && <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>{client.phone}</div>}
          {client?.doc && <div style={{ fontSize: 12, color: "#555" }}>CPF/CNPJ: {client.doc}</div>}
        </div>
        <div style={cell}>
          <div style={label}>Veículo</div>
          <div style={value}>{order.vehicleLabel || "Não informado"}</div>
        </div>
      </div>

      {/* Serviço */}
      <div style={cell}>
        <div style={label}>Serviço</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={value}>{order.serviceName}</div>
          {order.tech && <div style={{ fontSize: 12, color: "#888" }}>Responsável: <b style={{ color: "#111" }}>{order.tech}</b></div>}
        </div>
      </div>

      {/* Valores */}
      <div style={{ border: "1px solid #e0e0e0", borderRadius: 6, overflow: "hidden", marginBottom: 12 }}>
        <div style={{ background: "#f8f8f8", padding: "8px 14px", borderBottom: "1px solid #e0e0e0" }}>
          <span style={{ ...label, marginBottom: 0 }}>Valores</span>
        </div>
        <div style={{ padding: "10px 14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ color: "#555" }}>Valor do serviço:</span>
            <span>{money(valueNum)}</span>
          </div>
          {discountPct > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, color: "#888" }}>
              <span>Desconto ({discountPct}%):</span>
              <span>-{money(discountVal)}</span>
            </div>
          )}
          <div style={{ borderTop: "1px solid #e0e0e0", paddingTop: 8, marginTop: 4, display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: 16 }}>
            <span>Total:</span>
            <span>{money(total)}</span>
          </div>
        </div>
      </div>

      {/* Observações */}
      {order.notes && (
        <div style={cell}>
          <div style={label}>Observações</div>
          <div style={{ whiteSpace: "pre-wrap", color: "#333", fontSize: 13 }}>{order.notes}</div>
        </div>
      )}

      {/* Assinaturas */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, marginTop: 48 }}>
        <div>
          <div style={{ borderTop: "1px solid #111", paddingTop: 6 }}>
            <div style={{ fontSize: 11, color: "#888" }}>Assinatura do Cliente</div>
            <div style={{ fontSize: 12, color: "#444", marginTop: 2 }}>{order.clientName}</div>
          </div>
        </div>
        <div>
          <div style={{ borderTop: "1px solid #111", paddingTop: 6 }}>
            <div style={{ fontSize: 11, color: "#888" }}>Responsável pelo Serviço</div>
            <div style={{ fontSize: 12, color: "#444", marginTop: 2 }}>{order.tech || "___________________"}</div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 24, paddingTop: 12, borderTop: "1px solid #eee", fontSize: 10, color: "#aaa", textAlign: "center" }}>
        Documento gerado em {new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
      </div>
    </div>
  );
}

/* ── Public component ────────────────────────────────────── */
export function PrintOS({ order, client, mode, brandName, brandSuffix }: PrintOSProps) {
  if (!order) return null;

  return (
    <div id="clubos-print-area" className="print-only">
      {mode === "receipt" ? (
        <ReceiptLayout order={order} client={client} brandName={brandName} brandSuffix={brandSuffix} />
      ) : (
        <A4Layout order={order} client={client} brandName={brandName} brandSuffix={brandSuffix} />
      )}
    </div>
  );
}
