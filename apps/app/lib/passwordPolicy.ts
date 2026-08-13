// Single source of truth for the account-password rules — a client-side mirror of the
// Supabase Auth → Policies setting (Minimum length 8; "Lowercase, uppercase letters,
// digits and symbols" required). Supabase enforces this server-side on signUp /
// updateUser and rejects anything weaker as "weak_password"; this module lets the UI
// show the SAME rules as a live checklist and gate submit on them, so the client never
// presents a green form for a password the server would reject.
//
// The policy changes rarely and lives in the Supabase dashboard, not in an API — so it is
// mirrored in code. Within this repo it lives HERE, in one place (every web consumer reads
// from it).
//
// ⚠ MIRROR: spattoo-core keeps an identical copy at src/auth/passwordPolicy.js (used by the
// designer's Change Password modal). The two repos are joined only by the vendored
// @spattoo/designer tgz, so this small policy is duplicated by design. If the Supabase
// dashboard policy changes, update BOTH files.

export const PASSWORD_MIN_LENGTH = 8;

// GoTrue's symbol group for the "…and symbols" requirement is ASCII punctuation — and,
// notably, NOT whitespace. Kept as an explicit set (rather than a broad /[^A-Za-z0-9]/)
// so the checklist can't greenlight a character the server counts as "no symbol" (e.g. a
// space) and then reject the password anyway.
const SYMBOLS = "!@#$%^&*()_+-=[]{}|;:'\",.<>/?`~\\";
const SYMBOL_SET = new Set(SYMBOLS.split(""));

export type PasswordRule = {
  id: string;
  label: string;
  test: (pw: string) => boolean;
};

// Order here is the order shown in the checklist.
export const PASSWORD_RULES: PasswordRule[] = [
  { id: "length", label: `At least ${PASSWORD_MIN_LENGTH} characters`, test: (pw) => pw.length >= PASSWORD_MIN_LENGTH },
  { id: "lowercase", label: "One lowercase letter", test: (pw) => /[a-z]/.test(pw) },
  { id: "uppercase", label: "One uppercase letter", test: (pw) => /[A-Z]/.test(pw) },
  { id: "digit", label: "One number", test: (pw) => /[0-9]/.test(pw) },
  { id: "symbol", label: "One special character", test: (pw) => pw.split("").some((c) => SYMBOL_SET.has(c)) },
];

export function isPasswordValid(pw: string): boolean {
  return PASSWORD_RULES.every((r) => r.test(pw));
}
