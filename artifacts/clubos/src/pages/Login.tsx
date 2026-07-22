import { useState } from "react";
import { PALETTE } from "@/lib/utils";
import { PrimaryButton } from "@/components/shared/Buttons";
import { motion } from "framer-motion";

interface LoginProps {
  brand: { name: string; suffix: string; mark: string; accent: string };
  auth: {
    signIn: (email: string, password: string) => Promise<any>;
    signUp: (email: string, password: string, name: string, role: string) => Promise<any>;
  };
}

export function Login({ brand, auth }: LoginProps) {
  const [mode, setMode] = useState<"entrar" | "criar">("entrar");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Administrador");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError("");
    setInfo("");
    setBusy(true);
    const em = email.trim().toLowerCase();
    const pw = password.trim();
    if (!em || !pw) {
      setError("Preencha e-mail e senha.");
      setBusy(false);
      return;
    }

    if (mode === "entrar") {
      const err = await auth.signIn(em, pw);
      if (err) setError("E-mail ou senha incorretos.");
    } else {
      if (!name.trim()) {
        setError("Digite seu nome.");
        setBusy(false);
        return;
      }
      if (pw.length < 6) {
        setError("A senha precisa ter pelo menos 6 caracteres.");
        setBusy(false);
        return;
      }
      const { error: err, needsConfirmation } = await auth.signUp(em, pw, name.trim(), role);
      if (err)
        setError(
          err.message === "User already registered"
            ? "Esse e-mail já tem conta — clique em Entrar."
            : "Não foi possível criar a conta. Tente novamente."
        );
      else if (needsConfirmation)
        setInfo("Conta criada! Verifique seu e-mail para confirmar o acesso antes de entrar.");
    }
    setBusy(false);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") submit();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-card rounded-[18px] border border-card-border p-8 shadow-2xl"
      >
        <div
          className="w-14 h-14 mx-auto mb-6 flex items-center justify-center rounded-2xl text-white text-2xl font-bold"
          style={{ background: brand.accent }}
        >
          {brand.mark}
        </div>
        <h1 className="text-2xl font-bold text-center text-foreground mb-1">{brand.name}</h1>
        <span className="block text-sm text-center text-muted-foreground mb-6">{brand.suffix}</span>

        {/* Mode switcher */}
        <div className="flex gap-2 mb-6 p-1 bg-muted/20 rounded-[11px]">
          <button
            className={`flex-1 h-9 rounded-lg font-medium text-sm transition-all ${
              mode === "entrar"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => {
              setMode("entrar");
              setError("");
              setInfo("");
            }}
          >
            Entrar
          </button>
          <button
            className={`flex-1 h-9 rounded-lg font-medium text-sm transition-all ${
              mode === "criar"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => {
              setMode("criar");
              setError("");
              setInfo("");
            }}
          >
            Criar acesso
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {mode === "criar" && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Seu nome</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-10 px-3 rounded-[10px] bg-secondary border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">E-mail</label>
            <input
              type="email"
              autoComplete="off"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={onKey}
              className="w-full h-10 px-3 rounded-[10px] bg-secondary border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Senha</label>
            <input
              type="password"
              autoComplete="off"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={onKey}
              className="w-full h-10 px-3 rounded-[10px] bg-secondary border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          {mode === "criar" && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Papel</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full h-10 px-3 rounded-[10px] bg-secondary border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="Administrador">Administrador</option>
                <option value="Funcionário">Funcionário</option>
              </select>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 text-sm" style={{ color: PALETTE.danger }}>
            {error}
          </div>
        )}
        {info && (
          <div className="mt-4 text-sm" style={{ color: PALETTE.success }}>
            {info}
          </div>
        )}

        <PrimaryButton onClick={submit} className="w-full mt-6">
          {busy ? "Aguarde…" : mode === "entrar" ? "Entrar" : "Criar minha conta"}
        </PrimaryButton>
      </motion.div>
    </div>
  );
}
