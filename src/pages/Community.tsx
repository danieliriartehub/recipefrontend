import { useState } from "react";
import { MobileShell } from "@/components/recipe/MobileShell";
import { ScreenHeader } from "@/components/recipe/ScreenHeader";
import { UNIVERSITIES, WEEKLY_LEADERS, CHALLENGES, BADGES, USER } from "@/data/mock";
import { Trophy, Users, Sparkles } from "lucide-react";

type Tab = "universidades" | "semanal" | "retos";

const Community = () => {
  const [tab, setTab] = useState<Tab>("universidades");
  const myUni = UNIVERSITIES.find((u) => u.short === USER.university)!;
  const maxKg = UNIVERSITIES[0].kg;

  return (
    <MobileShell>
      <ScreenHeader title="Comunidad" subtitle="Compite, suma y desbloquea badges" showBell />

      <div className="px-5">
        {/* My team banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-hero p-5 text-primary-foreground shadow-card">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 font-display text-lg font-extrabold backdrop-blur">
              {USER.university}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs opacity-80">Tu universidad va</p>
              <p className="font-display text-2xl font-extrabold leading-none">#{UNIVERSITIES.findIndex((u) => u.short === USER.university) + 1} de Lima</p>
              <p className="mt-1 text-xs opacity-85">{myUni.members.toLocaleString()} estudiantes · {myUni.kg.toLocaleString()} kg</p>
            </div>
            <Trophy className="h-10 w-10 opacity-80" />
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-5 grid grid-cols-3 rounded-2xl bg-muted p-1">
          {([
            { key: "universidades", label: "Universidades" },
            { key: "semanal",       label: "Semanal" },
            { key: "retos",         label: "Retos" },
          ] as { key: Tab; label: string }[]).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-xl py-2 text-xs font-semibold transition-smooth ${
                tab === t.key ? "bg-background text-foreground shadow-soft" : "text-muted-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "universidades" && (
          <section className="mt-5 space-y-2">
            {UNIVERSITIES.map((u, i) => {
              const pct = Math.round((u.kg / maxKg) * 100);
              const isMine = u.short === USER.university;
              return (
                <div key={u.id} className={`rounded-2xl p-3 shadow-soft transition-bounce ${
                  isMine ? "bg-primary/5 ring-2 ring-primary/40" : "bg-card"
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl font-display text-sm font-extrabold ${
                      i === 0 ? "bg-accent text-accent-foreground" : "bg-muted"
                    }`}>
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-display text-sm font-extrabold">{u.short}</p>
                        {isMine && <span className="rounded-full bg-primary px-2 py-0.5 text-[9px] font-bold text-primary-foreground">TÚ</span>}
                      </div>
                      <p className="truncate text-[11px] text-muted-foreground">{u.members.toLocaleString()} miembros</p>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div className={`h-full rounded-full ${u.color}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <p className="font-display text-sm font-extrabold text-primary">{u.kg.toLocaleString()}<span className="text-[10px] text-muted-foreground"> kg</span></p>
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {tab === "semanal" && (
          <section className="mt-5 space-y-2">
            <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5" /> Top recicladores · esta semana
            </div>
            {WEEKLY_LEADERS.map((l, i) => (
              <div key={l.id} className={`flex items-center gap-3 rounded-2xl p-3 shadow-soft ${
                l.isMe ? "bg-primary/5 ring-2 ring-primary/40" : "bg-card"
              }`}>
                <span className="w-6 text-center font-display text-sm font-extrabold">
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                </span>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary text-sm font-extrabold text-primary-foreground">
                  {l.avatar}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-bold">{l.name}</p>
                    {l.isMe && <span className="rounded-full bg-primary px-2 py-0.5 text-[9px] font-bold text-primary-foreground">TÚ</span>}
                  </div>
                  <p className="text-[11px] text-muted-foreground">{l.uni}</p>
                </div>
                <p className="font-display text-sm font-extrabold text-primary">{l.points}<span className="text-[10px] text-muted-foreground"> pts</span></p>
              </div>
            ))}
          </section>
        )}

        {tab === "retos" && (
          <section className="mt-5 space-y-3">
            {CHALLENGES.map((c) => (
              <div key={c.id} className="rounded-3xl bg-card p-4 shadow-soft">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{c.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-display text-sm font-extrabold">{c.title}</p>
                      <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-bold text-accent-foreground">+{c.reward}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{c.description}</p>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-gradient-primary" style={{ width: `${c.progress}%` }} />
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">{c.progress}% · {c.deadline} restantes</p>
                  </div>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Badges */}
        <section className="mt-6">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="font-display text-base font-bold">Tus badges</h3>
            <span className="ml-auto text-xs text-muted-foreground">
              {BADGES.filter((b) => b.unlocked).length} / {BADGES.length}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {BADGES.map((b) => (
              <div
                key={b.id}
                className={`rounded-2xl p-3 text-center shadow-soft transition-smooth ${
                  b.unlocked ? "bg-card" : "bg-muted/50 opacity-60"
                }`}
              >
                <div className={`text-3xl ${!b.unlocked && "grayscale"}`}>{b.emoji}</div>
                <p className="mt-1 text-[11px] font-bold leading-tight">{b.name}</p>
                <p className="text-[9px] text-muted-foreground">{b.description}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </MobileShell>
  );
};

export default Community;
