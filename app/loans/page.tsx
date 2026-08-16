import { createClient } from "../../lib/supabase/server";
import { money } from "../../lib/money";

type Loan = {
  id: string;
  name: string;
  balance: number | string;
  annual_rate: number | string;
  emi: number | string;
};

export default async function Loans() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("loans")
    .select("id, name, balance, annual_rate, emi")
    .eq("user_id", user.id)
    .order("balance", { ascending: true });

  if (error) {
    console.error("Loans error:", error);

    return (
      <main className="container">
        <h1>Loans</h1>
        <div className="card">
          <p>Unable to load your loans.</p>
          <p className="muted">Please try again later.</p>
        </div>
      </main>
    );
  }

  const loans: Loan[] = data ?? [];

  return (
    <main className="container">
      <h1>Loans</h1>

      {loans.length === 0 ? (
        <div className="card">
          <h2>No loans yet</h2>
          <p className="muted">
            Add your first loan to start tracking your debt.
          </p>
        </div>
      ) : (
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Balance</th>
                <th>APR</th>
                <th>EMI</th>
              </tr>
            </thead>

            <tbody>
              {loans.map((loan) => (
                <tr key={loan.id}>
                  <td>{loan.name}</td>
                  <td>{money(Number(loan.balance))}</td>
                  <td>{Number(loan.annual_rate)}%</td>
                  <td>{money(Number(loan.emi))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="muted">
        Use the Supabase-connected form in the full source to add or edit
        loans.
      </p>
    </main>
  );
}
