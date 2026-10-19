"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type PortalSettings = {
  id: string;
  name: string;
  slug: string | null;
  portalEnabled: boolean;
  portalName: string | null;
  portalDescription: string | null;
  portalLogoUrl: string | null;
  portalAccentColor: string | null;
  showNotPlanned: boolean;
  digestEnabled: boolean;
  digestEmail: string | null;
};

export default function PortalSettingsPage() {
  const [, setSettings] = useState<PortalSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form fields
  const [slug, setSlug] = useState("");
  const [portalEnabled, setPortalEnabled] = useState(true);
  const [portalName, setPortalName] = useState("");
  const [portalDescription, setPortalDescription] = useState("");
  const [portalLogoUrl, setPortalLogoUrl] = useState("");
  const [portalAccentColor, setPortalAccentColor] = useState("#6655e8");
  const [showNotPlanned, setShowNotPlanned] = useState(false);

  // Digest
  const [digestEnabled, setDigestEnabled] = useState(false);
  const [digestEmail, setDigestEmail] = useState("");
  const [testingDigest, setTestingDigest] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        const res = await fetch("/api/portal-settings");
        if (res.ok) {
          const data = await res.json();
          const s = data.settings;
          setSettings(s);
          setSlug(s.slug || s.name.toLowerCase().replace(/[^a-z0-9]/g, "-"));
          setPortalEnabled(s.portalEnabled ?? true);
          setPortalName(s.portalName || s.name || "");
          setPortalDescription(s.portalDescription || "");
          setPortalLogoUrl(s.portalLogoUrl || "");
          setPortalAccentColor(s.portalAccentColor || "#6655e8");
          setShowNotPlanned(s.showNotPlanned ?? false);
          setDigestEnabled(s.digestEnabled ?? false);
          setDigestEmail(s.digestEmail || "");
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/portal-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          portalEnabled,
          portalName,
          portalDescription,
          portalLogoUrl,
          portalAccentColor,
          showNotPlanned,
          digestEnabled,
          digestEmail,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update settings");
      }

      setSettings(data.settings);
      setMessage({ type: "success", text: "Portal settings saved successfully!" });
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to update settings",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleTestDigest() {
    try {
      setTestingDigest(true);
      const res = await fetch("/api/cron/digest?sendTest=true");
      const data = await res.json();
      if (res.ok && data.success && data.sent) {
        alert(
          `✓ Real Test Digest Sent!\n\nRecipient: ${data.recipient}\nProvider: ${data.provider}\nPeriod: ${data.period}\nFeedback Count: ${data.stats.totalFeedback}\nTop Requests: ${data.stats.topRequestsCount}\n\nPlease check your inbox and spam folder.`
        );
      } else {
        alert(
          data.error ||
            "Failed to deliver test digest. Please check your email configuration."
        );
      }
    } catch {
      alert("Error sending test digest email. Please try again.");
    } finally {
      setTestingDigest(false);
    }
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const publicUrl = slug ? `${origin}/portal/${slug}` : "";

  function copyUrl() {
    if (!publicUrl) return;
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return <div className="py-20 text-center text-sm text-gray-500">Loading portal settings...</div>;
  }

  return (
    <div className="max-w-3xl space-y-8">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Public Portal & Digest Settings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Configure your customer-facing feedback board, branding, and weekly email updates.
          </p>
        </div>

        <Link
          href="/dashboard/settings"
          className="rounded-lg border px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
        >
          ← Settings
        </Link>
      </div>

      {message && (
        <div
          className={`rounded-xl p-4 text-sm font-medium ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* SHAREABLE URL BOX */}
      {slug && (
        <div className="rounded-xl border border-violet-100 bg-violet-50/50 p-5">
          <h3 className="text-xs font-bold text-violet-900 uppercase tracking-wide">
            Your Public Portal Link
          </h3>
          <p className="mt-1 text-xs text-violet-700">
            Share this URL with your customers or link it inside your application.
          </p>

          <div className="mt-3 flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={publicUrl}
              className="flex-1 rounded-lg border border-violet-200 bg-white px-3 py-2 text-xs font-mono text-gray-800 outline-none select-all"
            />
            <button
              onClick={copyUrl}
              className="rounded-lg bg-violet-600 px-4 py-2 text-xs font-bold text-white hover:bg-violet-700 transition"
            >
              {copied ? "✓ Copied!" : "Copy Link"}
            </button>
            <Link
              href={publicUrl}
              target="_blank"
              className="rounded-lg border border-violet-300 bg-white px-3 py-2 text-xs font-semibold text-violet-700 hover:bg-violet-50"
            >
              Visit ↗
            </Link>
          </div>
        </div>
      )}

      {/* SETTINGS FORM */}
      <form onSubmit={handleSave} className="space-y-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-bold text-gray-900 border-b pb-3">Portal Configuration</h2>

        {/* Enable / Disable */}
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-semibold text-gray-900">Enable Public Portal</label>
            <p className="text-xs text-gray-500">Allow customers to view the board and submit requests.</p>
          </div>
          <input
            type="checkbox"
            checked={portalEnabled}
            onChange={(e) => setPortalEnabled(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
          />
        </div>

        {/* Portal Slug */}
        <div>
          <label className="block text-xs font-bold text-gray-700">Public Slug (URL Path) *</label>
          <div className="mt-1 flex items-center rounded-lg border border-gray-300 px-3 py-2 text-sm bg-gray-50">
            <span className="text-gray-400 text-xs">/portal/</span>
            <input
              type="text"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              placeholder="acme"
              className="flex-1 bg-transparent px-1 text-sm font-medium outline-none text-gray-900"
            />
          </div>
          <p className="mt-1 text-[11px] text-gray-400">Unique identifier for your portal.</p>
        </div>

        {/* Portal Name & Description */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold text-gray-700">Display Name</label>
            <input
              type="text"
              value={portalName}
              onChange={(e) => setPortalName(e.target.value)}
              placeholder="e.g. Acme Feedback"
              className="mt-1 w-full rounded-lg border border-gray-300 p-2 text-sm outline-none focus:border-violet-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700">Accent Color</label>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="color"
                value={portalAccentColor}
                onChange={(e) => setPortalAccentColor(e.target.value)}
                className="h-9 w-9 cursor-pointer rounded border border-gray-300"
              />
              <input
                type="text"
                value={portalAccentColor}
                onChange={(e) => setPortalAccentColor(e.target.value)}
                className="w-28 rounded-lg border border-gray-300 p-2 text-xs font-mono"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700">Tagline / Short Description</label>
          <textarea
            rows={2}
            value={portalDescription}
            onChange={(e) => setPortalDescription(e.target.value)}
            placeholder="Share your feedback, feature ideas, and vote on what we should build next."
            className="mt-1 w-full rounded-lg border border-gray-300 p-2 text-sm outline-none focus:border-violet-600"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700">Optional Logo URL</label>
          <input
            type="url"
            value={portalLogoUrl}
            onChange={(e) => setPortalLogoUrl(e.target.value)}
            placeholder="https://example.com/logo.png"
            className="mt-1 w-full rounded-lg border border-gray-300 p-2 text-sm outline-none"
          />
        </div>

        <div className="flex items-center justify-between border-t pt-4">
          <div>
            <label className="text-xs font-semibold text-gray-900">Show &quot;Not Planned&quot; Requests</label>
            <p className="text-[11px] text-gray-500">
              When checked, declined ideas are displayed with a &quot;Not Planned&quot; badge on public roadmap.
            </p>
          </div>
          <input
            type="checkbox"
            checked={showNotPlanned}
            onChange={(e) => setShowNotPlanned(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-violet-600"
          />
        </div>

        {/* WEEKLY FOUNDER DIGEST */}
        <div className="border-t pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Weekly Founder Email Digest</h3>
              <p className="text-xs text-gray-500">
                Receive an automatic 7-day summary of top votes, new feedback, and critical complaints.
              </p>
            </div>
            <input
              type="checkbox"
              checked={digestEnabled}
              onChange={(e) => setDigestEnabled(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-violet-600"
            />
          </div>

          {digestEnabled && (
            <div className="space-y-3 pl-4 border-l-2 border-violet-200">
              <div>
                <label className="block text-xs font-semibold text-gray-700">Digest Recipient Email</label>
                <input
                  type="email"
                  value={digestEmail}
                  onChange={(e) => setDigestEmail(e.target.value)}
                  placeholder="founder@example.com"
                  className="mt-1 w-full rounded-lg border border-gray-300 p-2 text-sm"
                />
              </div>

              <div>
                <button
                  type="button"
                  disabled={testingDigest}
                  onClick={handleTestDigest}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  {testingDigest ? "Sending Real Test Email..." : "✉️ Send Test Digest Email"}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-violet-700 disabled:opacity-50"
          >
            {saving ? "Saving Changes..." : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
