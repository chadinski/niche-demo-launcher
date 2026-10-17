"use client";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui";
export function DemoFeedbackForm({ token }: { token: string }) {
  const [busy, setBusy] = useState(false),
    [sent, setSent] = useState(false),
    [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/share/${token}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(form)),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Feedback could not be saved.");
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  if (sent)
    return (
      <p
        role="status"
        className="mt-6 rounded-xl bg-emerald-50 p-5 text-emerald-800"
      >
        Your feedback has been saved for the designer. Thank you.
      </p>
    );
  return (
    <form onSubmit={submit} className="mt-6 space-y-4">
      <label className="block">
        <span className="field-label">Your name</span>
        <input
          name="name"
          className="field-input"
          autoComplete="name"
          required
          maxLength={120}
        />
      </label>
      <label className="block">
        <span className="field-label">Email for a reply (optional)</span>
        <input
          name="email"
          type="email"
          className="field-input"
          autoComplete="email"
          maxLength={320}
        />
      </label>
      <label className="block">
        <span className="field-label">Feedback or question</span>
        <textarea
          name="message"
          className="field-input min-h-32"
          required
          maxLength={4000}
        />
      </label>
      <div className="hidden" aria-hidden="true">
        <input name="companyFax" tabIndex={-1} autoComplete="off" />
      </div>
      <p className="text-xs leading-5 text-slate-500">
        Your name, message, and optional email are shared with the designer.
        Submitting feedback does not subscribe you to marketing.
      </p>
      {error ? (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      ) : null}
      <Button type="submit" loading={busy}>
        Send feedback
      </Button>
    </form>
  );
}
