import { PASSWORD_RULES } from "../lib/passwordPolicy";

// Live per-rule checklist shown under a new-password field. Each rule ticks green as it
// is satisfied. Pure presentation — the rules + validation live in lib/passwordPolicy so
// the UI and the submit gate share ONE definition. Renders nothing until the user starts
// typing, so an untouched form isn't a wall of unmet requirements.
export default function PasswordChecklist({ password }: { password: string }) {
  if (!password) return null;
  return (
    <ul className="mt-2 flex flex-col gap-1" aria-label="Password requirements">
      {PASSWORD_RULES.map((rule) => {
        const ok = rule.test(password);
        return (
          <li key={rule.id}
            className={`flex items-center gap-2 text-xs transition ${ok ? "text-[#a8c5b5]" : "text-[#edeae3]/40"}`}>
            <span aria-hidden
              className={`grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full border transition ${
                ok ? "border-[#a8c5b5] bg-[#a8c5b5]/15 text-[#a8c5b5]" : "border-[#edeae3]/25 text-transparent"
              }`}>
              <Check />
            </span>
            {rule.label}
          </li>
        );
      })}
    </ul>
  );
}

function Check() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3.5} className="h-2.5 w-2.5">
      <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
