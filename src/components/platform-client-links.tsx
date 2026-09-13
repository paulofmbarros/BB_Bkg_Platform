"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Copy, ExternalLink } from "lucide-react";

export function PlatformClientLinks({
  workspaceUrl,
  bookingUrl,
}: {
  workspaceUrl: string;
  bookingUrl: string | null;
}) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">(
    "idle",
  );

  async function copyWorkspaceLink() {
    try {
      await navigator.clipboard.writeText(workspaceUrl);
      setCopyState("copied");
    } catch {
      const field = document.createElement("textarea");
      field.value = workspaceUrl;
      field.setAttribute("readonly", "");
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.append(field);
      field.select();
      const copied = document.execCommand("copy");
      field.remove();
      setCopyState(copied ? "copied" : "failed");
    }
  }

  return (
    <div className="platform-client-links">
      <button
        className="button secondary"
        type="button"
        onClick={copyWorkspaceLink}
      >
        {copyState === "copied" ? <Check size={16} /> : <Copy size={16} />}
        {copyState === "copied"
          ? "Workspace link copied"
          : "Copy owner workspace link"}
      </button>
      {bookingUrl && (
        <Link
          className="button secondary"
          href={bookingUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open customer booking page <ExternalLink size={16} />
        </Link>
      )}
      {copyState === "failed" && (
        <p className="platform-copy-failure" role="alert">
          Could not copy automatically. Use this address: {workspaceUrl}
        </p>
      )}
    </div>
  );
}
