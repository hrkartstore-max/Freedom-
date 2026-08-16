import { createClient } from "../../lib/supabase/server";
import { money } from "../../lib/money";

type Entry = {
  amount: number | string;
};

export default async function Budget() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: incomeData, error: incomeError } = await supabase
    .from("income_entries")
    .select("amount")
    .eq("user_id", user.id);

  const { data: expenseData, error: expenseError } = await supabase
    .from("expense_entries")
    .select("amount")
    .eq("user_id", user.id);

  if (incomeError || expenseError) {
    console.error("Budget data error:", incomeError || expenseError);

    return (
      <main className="container">
        <h1>Budget</h1>

        <div className="card">
          <p>Unable to load your budget data.</p>
          <p>Please try again later.</p>
        </div>
      </main>
    );
  }

  // Supabase can return null, so safely convert null to an empty array.
  const incomeEntries: Entry[] = incomeData ?? [];
  const expenseEntries: Entry[] = expenseData ?? [];

  const totalIncome = incomeEntries.reduce(
    (total, entry) => total + Number(entry.amount || 0),
    0
  );

  const totalExpenses = expenseEntries.reduce(
    (total, entry) => total + Number(entry.amount || 0),
    0
  );

  const available = totalIncome - totalExpenses;

  return (
    <main className="container">
      <h1>Budget</h1>

      <section className="grid g2">
        <div className="card">
          Income

          <div className="metric">
            {money(totalIncome)}
          </div>
        </div>

        <div className="card">
          Expenses

          <div className="metric">
            {money(totalExpenses)}
          </div>
        </div>
      </section>

      <div
        className="card"
        style={{ marginTop: 18 }}
      >
        Available after tracked expenses

        <div className="metric">
          {money(available)}
        </div>
      </div>
    </main>
  );
}
