import { createClient } from "../../lib/supabase/server";
import { money } from "../../lib/money";
import {
  total,
  emi,
  snowball,
  avalanche,
} from "../../lib/debt";

type AmountEntry = {
  amount: number | string | null;
};

export default async function Dashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const {
    data: loanData,
    error: loanError,
  } = await supabase
    .from("loans")
    .select("*")
    .eq("user_id", user.id);

  const {
    data: incomeData,
    error: incomeError,
  } = await supabase
    .from("income_entries")
    .select("amount")
    .eq("user_id", user.id);

  const {
    data: expenseData,
    error: expenseError,
  } = await supabase
    .from("expense_entries")
    .select("amount")
    .eq("user_id", user.id);

  if (loanError || incomeError || expenseError) {
    console.error(
      "Dashboard data error:",
      loanError || incomeError || expenseError
    );

    return (
      <main className="container">
        <h1>Dashboard</h1>

        <div className="card">
          <p>Unable to load your dashboard data.</p>
          <p>Please try again later.</p>
        </div>
      </main>
    );
  }

  const loans = loanData ?? [];
  const inc: AmountEntry[] = incomeData ?? [];
  const exp: AmountEntry[] = expenseData ?? [];

  const I = inc.reduce(
    (amount, entry) => amount + Number(entry.amount ?? 0),
    0
  );

  const E = exp.reduce(
    (amount, entry) => amount + Number(entry.amount ?? 0),
    0
  );

  const sn = snowball(loans as any)[0];
  const av = avalanche(loans as any)[0];

  return (
    <main className="container">
      <h1>Dashboard</h1>

      <p className="muted">Welcome back.</p>

      <section className="grid g4">
        <div className="card">
          Debt
          <div className="metric">
            {money(total(loans as any))}
          </div>
        </div>

        <div className="card">
          EMI
          <div className="metric">
            {money(emi(loans as any))}
          </div>
        </div>

        <div className="card">
          Income
          <div className="metric">
            {money(I)}
          </div>
        </div>

        <div className="card">
          Expenses
          <div className="metric">
            {money(E)}
          </div>
        </div>
      </section>

      <section
        className="grid g2"
        style={{ marginTop: 18 }}
      >
        <div className="card">
          <h2>Snowball target</h2>

          <p>
            {sn ? sn.name : "No active debt"}
          </p>

          {sn && (
            <p className="muted">
              {money(sn.balance)}
            </p>
          )}
        </div>

        <div className="card">
          <h2>Avalanche target</h2>

          <p>
            {av ? av.name : "No active debt"}
          </p>

          {av && (
            <p className="muted">
              {av.annual_rate}% APR
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
