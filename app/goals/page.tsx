import { createClient } from "../../lib/supabase/server";
import { money } from "../../lib/money";

type Goal = {
  id: string;
  name: string;
  current_amount: number | string | null;
  target_amount: number | string | null;
};

export default async function Goals() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const {
    data: goalData,
    error: goalError,
  } = await supabase
    .from("financial_goals")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (goalError) {
    console.error("Goals data error:", goalError);

    return (
      <main className="container">
        <h1>Goals</h1>

        <div className="card">
          <p>Unable to load your financial goals.</p>
          <p>Please try again later.</p>
        </div>
      </main>
    );
  }

  const goals: Goal[] = goalData ?? [];

  return (
    <main className="container">
      <h1>Goals</h1>

      {goals.length === 0 ? (
        <div className="card">
          <p>No financial goals yet.</p>
        </div>
      ) : (
        <div className="grid g2">
          {goals.map((goal) => {
            const current = Number(goal.current_amount ?? 0);
            const target = Number(goal.target_amount ?? 0);

            const percentage =
              target > 0
                ? Math.min(
                    100,
                    Math.round((current / target) * 100)
                  )
                : 0;

            return (
              <div className="card" key={goal.id}>
                <h2>{goal.name}</h2>

                <p>
                  {money(current)} / {money(target)}
                </p>

                <p className="muted">
                  {percentage}% complete
                </p>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
