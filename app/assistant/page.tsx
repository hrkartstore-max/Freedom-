"use client";

import { useState } from "react";
import { createClient } from "../../lib/supabase/client";
import { money } from "../../lib/money";

type Loan = {
  name: string;
  balance: number | string;
  annual_rate: number | string;
  status: string;
};

export default function Assistant() {
  const [q, setQ] = useState("");
  const [a, setA] = useState(
    "Ask a question about your tracked debt."
  );
  const [loading, setLoading] = useState(false);

  async function ask(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!q.trim()) {
      setA("Please enter a question.");
      return;
    }

    setLoading(true);
    setA("Analyzing your debts...");

    try {
      const supabase = createClient();

      // Get signed-in user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error(userError);
        setA("Unable to verify your account. Please sign in again.");
        return;
      }

      if (!user) {
        setA("Please sign in.");
        return;
      }

      // Get active loans
      const { data, error } = await supabase
        .from("loans")
        .select("*")
        .eq("user_id", user.id)
        .neq("status", "CLOSED");

      if (error) {
        console.error(error);
        setA(
          "I couldn't load your loans. Please check your Supabase database and try again."
        );
        return;
      }

      // IMPORTANT:
      // Supabase data can be null, so convert it safely to an array.
      const loans: Loan[] = data ?? [];

      if (loans.length === 0) {
        setA("You have no active loans.");
        return;
      }

      // Snowball = smallest balance first
      const snowballLoan = [...loans].sort(
        (x, y) => Number(x.balance) - Number(y.balance)
      )[0];

      // Avalanche = highest interest rate first
      const avalancheLoan = [...loans].sort(
        (x, y) => Number(y.annual_rate) - Number(x.annual_rate)
      )[0];

      if (!snowballLoan || !avalancheLoan) {
        setA("Unable to determine your debt priorities.");
        return;
      }

      const question = q.toLowerCase();

      // Avalanche question
      if (
        question.includes("avalanche") ||
        question.includes("interest") ||
        question.includes("highest rate") ||
        question.includes("high interest")
      ) {
        setA(
          `Avalanche target: ${avalancheLoan.name}. ` +
            `Interest rate: ${Number(avalancheLoan.annual_rate).toFixed(2)}% APR. ` +
            `This method prioritizes the loan with the highest interest rate.`
        );
        return;
      }

      // Snowball question
      if (
        question.includes("snowball") ||
        question.includes("smallest") ||
        question.includes("first debt") ||
        question.includes("pay first")
      ) {
        setA(
          `Snowball target: ${snowballLoan.name}. ` +
            `Remaining balance: ${money(Number(snowballLoan.balance))}. ` +
            `This method prioritizes the smallest outstanding balance first.`
        );
        return;
      }

      // General debt question
      setA(
        `Snowball target: ${snowballLoan.name}, ` +
          `balance ${money(Number(snowballLoan.balance))}. ` +
          `Avalanche target: ${avalancheLoan.name}, ` +
          `${Number(avalancheLoan.annual_rate).toFixed(2)}% APR.`
      );
    } catch (error) {
      console.error(error);
      setA(
        "Something went wrong while analyzing your debt. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container">
      <h1>AI Financial Assistant</h1>

      <div className="card">
        <form className="form" onSubmit={ask}>
          <label htmlFor="question">
            Question
          </label>

          <textarea
            id="question"
            rows={4}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Which debt should I pay first?"
          />

          <button
            className="btn"
            type="submit"
            disabled={loading}
          >
            {loading ? "Analyzing..." : "Ask"}
          </button>
        </form>

        <h2>Answer</h2>

        <p>{a}</p>
      </div>
    </main>
  );
}
