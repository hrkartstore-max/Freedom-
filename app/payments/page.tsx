import { createClient } from "../../lib/supabase/server";
import { money } from "../../lib/money";

type Payment = {
  id: string;
  payment_date: string;
  amount: number | string;
  interest: number | string;
  principal: number | string;
};

export default async function Payments() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("loan_payments")
    .select("id, payment_date, amount, interest, principal")
    .eq("user_id", user.id)
    .order("payment_date", { ascending: false });

  if (error) {
    console.error("Payments error:", error);

    return (
      <main className="container">
        <h1>Payments</h1>

        <div className="card">
          <p>Unable to load your payments.</p>
          <p className="muted">Please try again later.</p>
        </div>
      </main>
    );
  }

  const payments: Payment[] = data ?? [];

  return (
    <main className="container">
      <h1>Payments</h1>

      {payments.length === 0 ? (
        <div className="card">
          <h2>No payments yet</h2>
          <p className="muted">
            Your loan payments will appear here once recorded.
          </p>
        </div>
      ) : (
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Amount</th>
                <th>Interest</th>
                <th>Principal</th>
              </tr>
            </thead>

            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td>{payment.payment_date}</td>
                  <td>{money(Number(payment.amount))}</td>
                  <td>{money(Number(payment.interest))}</td>
                  <td>{money(Number(payment.principal))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
