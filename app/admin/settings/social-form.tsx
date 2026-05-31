"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { LoadingButton } from "@/components/ui/loading-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SocialIcon } from "@/components/social-icons";
import {
  RECOMMENDED_MAX_VISIBLE,
  SOCIAL_PLATFORMS,
  type SocialLink,
  type SocialPlatform,
} from "@/lib/social";

function looksLikeUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

const PLACEHOLDER: Record<SocialPlatform, string> = Object.fromEntries(
  SOCIAL_PLATFORMS.map((p) => [p.id, p.placeholder])
) as Record<SocialPlatform, string>;

const LABEL: Record<SocialPlatform, string> = Object.fromEntries(
  SOCIAL_PLATFORMS.map((p) => [p.id, p.label])
) as Record<SocialPlatform, string>;

export default function SocialForm({ links: initial }: { links: SocialLink[] }) {
  const router = useRouter();
  const [links, setLinks] = useState<SocialLink[]>(initial);
  const [saving, setSaving] = useState(false);

  const update = (platform: SocialPlatform, patch: Partial<SocialLink>) =>
    setLinks((prev) =>
      prev.map((l) => (l.platform === platform ? { ...l, ...patch } : l))
    );

  // What the public site will actually render: toggled on AND has a link.
  const visibleCount = useMemo(
    () => links.filter((l) => l.enabled && l.url.trim().length > 0).length,
    [links]
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const badlyFormed = links.find(
      (l) => l.enabled && l.url.trim().length > 0 && !looksLikeUrl(l.url.trim())
    );
    if (badlyFormed) {
      toast.error(
        `Enter a valid link (starting with https://) for ${LABEL[badlyFormed.platform]}.`
      );
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/social", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          links: links.map((l) => ({
            platform: l.platform,
            enabled: l.enabled,
            url: l.url.trim(),
          })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Could not save.");
        return;
      }
      toast.success("Social links saved. The public site now reflects them.");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="w-full max-w-lg">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Social links</CardTitle>
          <CardDescription>
            Shown at the top of the invitation. Toggle a platform on and paste
            its link — a platform only appears once it has a link. Leave
            everything off to hide them entirely.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          {links.map((link) => (
            <div
              key={link.platform}
              className="flex flex-wrap items-center gap-x-3 gap-y-2 sm:flex-nowrap sm:items-start"
            >
              <span
                className="inline-flex size-5 shrink-0 items-center justify-center text-[color:var(--primary)] sm:mt-7"
                aria-hidden="true"
              >
                <SocialIcon platform={link.platform} className="size-4" />
              </span>

              {/* Mobile-only inline label sits beside icon + switch on row 1 */}
              <Label
                htmlFor={`social-${link.platform}`}
                className="flex-1 min-w-0 sm:hidden"
              >
                {LABEL[link.platform]}
              </Label>

              <Switch
                className="shrink-0 sm:order-last sm:mt-7"
                aria-label={`Show ${LABEL[link.platform]}`}
                checked={link.enabled}
                onCheckedChange={(enabled) =>
                  update(link.platform, { enabled })
                }
              />

              {/* Input wraps to its own full-width row on mobile; inline at sm+ */}
              <div className="order-last w-full min-w-0 space-y-1.5 sm:order-0 sm:w-auto sm:flex-1">
                <Label
                  htmlFor={`social-${link.platform}`}
                  className="hidden sm:flex"
                >
                  {LABEL[link.platform]}
                </Label>
                <Input
                  id={`social-${link.platform}`}
                  type="url"
                  inputMode="url"
                  value={link.url}
                  disabled={!link.enabled}
                  placeholder={PLACEHOLDER[link.platform]}
                  onChange={(e) =>
                    update(link.platform, { url: e.target.value })
                  }
                  className="h-11 sm:h-9"
                />
              </div>
            </div>
          ))}

          <p
            className={
              visibleCount > RECOMMENDED_MAX_VISIBLE
                ? "text-xs text-amber-600"
                : "text-xs text-muted-foreground"
            }
          >
            {visibleCount === 0
              ? "No social links will be shown."
              : `${visibleCount} link${visibleCount === 1 ? "" : "s"} will show.`}{" "}
            For the cleanest look, we recommend showing at most{" "}
            {RECOMMENDED_MAX_VISIBLE}.
          </p>
        </CardContent>

        <CardFooter>
          <LoadingButton
            type="submit"
            loading={saving}
            className="h-11 w-full sm:h-9 sm:w-auto"
          >
            Save links
          </LoadingButton>
        </CardFooter>
      </form>
    </Card>
  );
}
