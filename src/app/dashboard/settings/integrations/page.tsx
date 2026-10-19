"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function IntegrationsSettingsPage() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  async function loadSettings() {
    try {
      setLoading(true);
      const res = await fetch("/api/portal-settings");
      if (res.ok) {
        const data = await res.json();
        setApiKey(data.settings.apiKey);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSettings();
  }, []);

  async function handleGenerateKey() {
    if (apiKey && !confirm("Are you sure? Any existing webhooks using the old key will stop working.")) {
      return;
    }

    try {
      setRegenerating(true);
      const res = await fetch("/api/portal-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ regenerateApiKey: true }),
      });
      const data = await res.json();
      if (res.ok) {
        setApiKey(data.settings.apiKey);
        setRevealed(true);
      }
    } catch (e) {
      alert("Failed to generate API key");
    } finally {
      setRegenerating(false);
    }
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "https://loop-ai-wu6n.vercel.app";
  const webhookUrl = `${origin}/api/v1/feedback/webhook`;

  const curlSnippet = `curl -X POST "${webhookUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${apiKey || "YOUR_API_KEY"}" \\
  -d '{
    "content": "The new reporting dashboard loads 2x faster, great job!",
    "source": "WEBSITE",
    "rating": 5
  }'`;

  return (
    <div className="max-w-3xl space-y-8">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Integrations & Webhooks</h1>
          <p className="mt-1 text-sm text-gray-500">
            Connect external tools, website forms, and customer support channels to LOOP.
          </p>
        </div>

        <Link
          href="/dashboard/settings"
          className="rounded-lg border px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
        >
          ← Settings
        </Link>
      </div>

      {/* API KEY SECTION */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-gray-900 border-b pb-3">Workspace API Key</h2>
        <p className="text-xs text-gray-600">
          Authenticate incoming feedback from custom backends, forms, Zapier, or website widgets.
          Keep this key secret.
        </p>

        {loading ? (
          <div className="text-xs text-gray-400">Loading API key...</div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type={revealed ? "text" : "password"}
                readOnly
                value={apiKey || "No API key generated yet"}
                className="flex-1 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-xs font-mono text-gray-800 outline-none select-all"
              />
              {apiKey && (
                <>
                  <button
                    onClick={() => setRevealed(!revealed)}
                    className="rounded-lg border px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    {revealed ? "Hide" : "Reveal"}
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(apiKey);
                      setCopiedKey(true);
                      setTimeout(() => setCopiedKey(false), 2000);
                    }}
                    className="rounded-lg bg-gray-900 px-3 py-2 text-xs font-semibold text-white hover:bg-black"
                  >
                    {copiedKey ? "✓ Copied" : "Copy"}
                  </button>
                </>
              )}
            </div>

            <div className="pt-2">
              <button
                type="button"
                disabled={regenerating}
                onClick={handleGenerateKey}
                className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700 hover:bg-violet-100 disabled:opacity-50"
              >
                {regenerating
                  ? "Generating..."
                  : apiKey
                  ? "🔄 Regenerate API Key"
                  : "+ Generate Secret API Key"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* INCOMING FEEDBACK WEBHOOK */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-gray-900 border-b pb-3">
          Incoming Feedback Webhook API
        </h2>
        <p className="text-xs text-gray-600">
          Send customer feedback directly into your LOOP workspace from any server, webhook, or script.
          Incoming feedback is automatically analyzed by AI and assigned themes.
        </p>

        <div>
          <label className="block text-xs font-bold text-gray-700">Webhook Endpoint URL</label>
          <div className="mt-1 flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={webhookUrl}
              className="flex-1 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-xs font-mono text-gray-700 select-all"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(webhookUrl);
                setCopiedSnippet(true);
                setTimeout(() => setCopiedSnippet(false), 2000);
              }}
              className="rounded-lg border px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
            >
              {copiedSnippet ? "✓ Copied" : "Copy URL"}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700">Example cURL Request</label>
          <pre className="mt-1 overflow-x-auto rounded-lg bg-gray-900 p-4 text-[11px] font-mono text-gray-200">
            {curlSnippet}
          </pre>
        </div>

        <div className="rounded-lg bg-gray-50 border p-4 text-xs text-gray-600 space-y-2">
          <p className="font-bold text-gray-800">Supported Payload Fields:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><code className="text-violet-600 font-semibold">content</code> (required): The customer's feedback message</li>
            <li><code className="text-violet-600 font-semibold">source</code> (optional): WEBSITE, EMAIL, SUPPORT, SURVEY, OTHER</li>
            <li><code className="text-violet-600 font-semibold">rating</code> (optional): Integer from 1 to 5</li>
            <li><code className="text-violet-600 font-semibold">category</code> (optional): Product feature area</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
