import { useState, useEffect } from "react";
import { Settings, User, Bell, Shield, Building2, CheckCircle, Users, Crown, UserCog } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { PrimaryButton, GhostButton } from "@/components/shared/Buttons";
import { Card } from "@/components/shared/Card";
import { Field } from "@/components/shared/Field";
import { Avatar } from "@/components/shared/Avatar";
import { Badge } from "@/components/shared/Badge";
import { supabase, COMPANY_ID } from "@/lib/supabaseClient";

interface ConfiguracoesProps {
  brand: { name: string; suffix: string; mark: string; accent: string };
  user: { name?: string; email?: string; role?: string } | null;
  onSignOut: () => void;
}

interface AppUser {
  id: string;
  name: string;
  email: string;
  role: string;
  auth_user_id: string;
}

export function Configuracoes({ brand, user, onSignOut }: ConfiguracoesProps) {
  const [saved, setSaved] = useState(false);
  const [notifOS, setNotifOS] = useState(true);
  const [notifAgenda, setNotifAgenda] = useState(true);
  const [companyUsers, setCompanyUsers] = useState<AppUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const isAdmin = user?.role === "Administrador";

  // Fetch all users in the company (admins only)
  useEffect(() => {
    if (!isAdmin) return;
    setLoadingUsers(true);
    supabase
      .from("app_users")
      .select("*")
      .eq("company_id", COMPANY_ID)
      .order("name")
      .then(({ data }) => {
        if (data) setCompanyUsers(data as AppUser[]);
        setLoadingUsers(false);
      });
  }, [isAdmin]);

  const saveSettings = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Configurações"
        subtitle="Preferências e configurações do sistema."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Perfil do usuário */}
        <Card>
          <div className="flex items-center gap-3 mb-5">
            <User size={18} className="text-primary" />
            <h3 className="font-semibold text-foreground">Perfil do Usuário</h3>
          </div>
          <div className="flex items-center gap-4 mb-5">
            <Avatar name={user?.name || "User"} size={52} />
            <div>
              <div className="font-semibold text-foreground">{user?.name || "Usuário"}</div>
              <div className="text-sm text-muted-foreground">{user?.email || ""}</div>
              <div className="text-xs text-primary mt-0.5 capitalize">{user?.role || "Funcionário"}</div>
            </div>
          </div>
          <Field label="Nome">
            <input
              className="w-full h-10 px-3 rounded-[10px] bg-secondary border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              defaultValue={user?.name || ""}
              readOnly
            />
          </Field>
          <Field label="Email">
            <input
              className="w-full h-10 px-3 rounded-[10px] bg-secondary border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              defaultValue={user?.email || ""}
              readOnly
            />
          </Field>
          <p className="text-xs text-muted-foreground mt-2">Para alterar seu nome ou email, entre em contato com o administrador.</p>
        </Card>

        {/* Empresa */}
        <Card>
          <div className="flex items-center gap-3 mb-5">
            <Building2 size={18} className="text-primary" />
            <h3 className="font-semibold text-foreground">Dados da Empresa</h3>
          </div>
          <Field label="Nome da empresa">
            <input
              className="w-full h-10 px-3 rounded-[10px] bg-secondary border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              defaultValue={brand.name}
              readOnly
            />
          </Field>
          <Field label="Slogan / Sufixo">
            <input
              className="w-full h-10 px-3 rounded-[10px] bg-secondary border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              defaultValue={brand.suffix}
              readOnly
            />
          </Field>
          <Field label="Cor de destaque">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex-shrink-0" style={{ background: brand.accent }} />
              <input
                className="w-full h-10 px-3 rounded-[10px] bg-secondary border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={brand.accent}
                readOnly
              />
            </div>
          </Field>
        </Card>

        {/* Notificações */}
        <Card>
          <div className="flex items-center gap-3 mb-5">
            <Bell size={18} className="text-primary" />
            <h3 className="font-semibold text-foreground">Notificações</h3>
          </div>
          <div className="space-y-4">
            <ToggleRow
              label="Novas Ordens de Serviço"
              description="Notificar quando uma nova OS for criada"
              checked={notifOS}
              onChange={setNotifOS}
            />
            <ToggleRow
              label="Novos agendamentos"
              description="Notificar quando um agendamento for criado"
              checked={notifAgenda}
              onChange={setNotifAgenda}
            />
          </div>
        </Card>

        {/* Segurança */}
        <Card>
          <div className="flex items-center gap-3 mb-5">
            <Shield size={18} className="text-primary" />
            <h3 className="font-semibold text-foreground">Segurança</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Sua conta é gerenciada pelo Supabase Auth. Para redefinir a senha, use a opção de recuperação na tela de login.
          </p>
          <GhostButton danger onClick={onSignOut}>
            Sair da conta
          </GhostButton>
        </Card>
      </div>

      {/* Contas da Empresa — visível apenas para Administradores */}
      {isAdmin && (
        <Card>
          <div className="flex items-center gap-3 mb-5">
            <Users size={18} className="text-primary" />
            <h3 className="font-semibold text-foreground">Contas da Empresa</h3>
            <span className="ml-auto text-xs text-muted-foreground">Visível apenas para administradores</span>
          </div>

          {loadingUsers ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-muted/40" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-32 bg-muted/40 rounded" />
                    <div className="h-2.5 w-48 bg-muted/30 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : companyUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhuma conta cadastrada encontrada.</p>
          ) : (
            <div className="divide-y divide-border -my-1">
              {companyUsers.map(u => {
                const isCurrentUser = u.auth_user_id === undefined || u.name === user?.name;
                return (
                  <div key={u.id} className="flex items-center gap-4 py-3">
                    <Avatar name={u.name} size={40} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-foreground">{u.name}</span>
                        {isCurrentUser && (
                          <span className="text-xs text-primary font-medium">(você)</span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">{u.email || "—"}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {u.role === "Administrador" ? (
                        <Badge text="Administrador" color="#FF6A00" />
                      ) : (
                        <Badge text="Funcionário" color="#9A9AA0" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* Save button */}
      <div className="flex items-center gap-3">
        <PrimaryButton onClick={saveSettings}>
          {saved ? "Configurações salvas" : "Salvar configurações"}
        </PrimaryButton>
        {saved && <CheckCircle size={18} className="text-green-400" />}
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <div className="text-sm font-medium text-foreground">{label}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${checked ? "bg-primary" : "bg-muted/40"}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`}
        />
      </button>
    </div>
  );
}
