import { useMemo } from "react";
import { MessageCircle, Clock, Users } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { PrimaryButton } from "@/components/shared/Buttons";
import { Card } from "@/components/shared/Card";
import { Avatar } from "@/components/shared/Avatar";
import { Badge } from "@/components/shared/Badge";
import { waLink, onlyDigits, todayISO, PALETTE } from "@/lib/utils";

interface CRMProps {
  clients: any[];
  orders: any[];
  appointments: any[];
}

const WINDOWS = [15, 30, 60, 90, 180];

function daysSince(dateStr: string | undefined) {
  if (!dateStr) return 9999;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

function bucketOf(days: number): number | null {
  for (let i = WINDOWS.length - 1; i >= 0; i--) {
    if (days >= WINDOWS[i]) return WINDOWS[i];
  }
  return null;
}

const BUCKET_LABEL: Record<number, string> = {
  15: "15 dias",
  30: "30 dias",
  60: "60 dias",
  90: "3 meses",
  180: "6 meses",
};

const BUCKET_COLOR: Record<number, string> = {
  15: "#FFD60A",
  30: "#FF9500",
  60: "#FF6A00",
  90: "#FF453A",
  180: "#FF453A",
};

function waMsg(clientName: string, days: number) {
  return `Olá ${clientName}! Tudo bem?\nFaz ${days} dias que não vemos seu carro por aqui. Que tal agendar um cuidado especial? Temos ótimas novidades! 🚗✨`;
}

export function CRM({ clients, orders, appointments }: CRMProps) {
  const enriched = useMemo(() => {
    return clients.map(c => {
      // Find last order date
      const clientOrders = orders.filter(o => o.clientId === c.id);
      const lastOrderDate = clientOrders.length > 0
        ? clientOrders.map(o => o.createdAt).sort().reverse()[0]
        : null;
      const lastVisit = c.lastVisit || lastOrderDate;
      const days = daysSince(lastVisit);
      const bucket = bucketOf(days);
      return { ...c, days, bucket, lastVisit };
    }).filter(c => c.bucket !== null);
  }, [clients, orders]);

  const byBucket = useMemo(() => {
    return WINDOWS.reduce((acc, w) => {
      acc[w] = enriched.filter(c => c.bucket === w);
      return acc;
    }, {} as Record<number, any[]>);
  }, [enriched]);

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="CRM"
        subtitle="Clientes inativos para reengajamento via WhatsApp."
      />

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {WINDOWS.map(w => (
          <Card key={w} className="text-center !py-3">
            <div className="text-2xl font-bold" style={{ color: BUCKET_COLOR[w] }}>{byBucket[w].length}</div>
            <div className="text-xs text-muted-foreground mt-1">Sem visita há {BUCKET_LABEL[w]}</div>
          </Card>
        ))}
      </div>

      {enriched.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Users size={40} className="mb-3 opacity-40" />
            <p className="text-sm">Nenhum cliente inativo no momento.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {WINDOWS.map(w => {
            const group = byBucket[w];
            if (!group.length) return null;
            return (
              <div key={w}>
                <div className="flex items-center gap-2 mb-3">
                  <Clock size={14} style={{ color: BUCKET_COLOR[w] }} />
                  <h3 className="text-sm font-semibold text-foreground">Sem visita há {BUCKET_LABEL[w]}</h3>
                  <span className="text-xs text-muted-foreground">({group.length})</span>
                </div>
                <Card className="!p-0 overflow-hidden">
                  <div className="divide-y divide-border">
                    {group.map(c => (
                      <div key={c.id} className="flex items-center gap-4 px-5 py-3 hover:bg-muted/20 transition-colors">
                        <Avatar name={c.name} size={38} />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-foreground">{c.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {c.phone || "Sem telefone"} · Último serviço: {c.lastVisit || "Nunca"}
                          </div>
                        </div>
                        <Badge text={`${c.days}d`} color={BUCKET_COLOR[w]} />
                        {c.phone && (
                          <a
                            href={waLink(c.phone, waMsg(c.name, c.days))}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg bg-green-500/15 text-green-400 text-xs font-medium hover:bg-green-500/25 transition-colors"
                          >
                            <MessageCircle size={13} />
                            WhatsApp
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
