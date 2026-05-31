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
    <Card className="max-w-lg">
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
            <div key={link.platform} className="flex items-start gap-3">
              <span
                className="mt-7 inline-flex size-5 shrink-0 items-center justify-center text-[color:var(--primary)]"
                aria-hidden="true"
              >
                <SocialIcon platform={link.platform} className="size-4" />
              </span>

              <div className="flex-1 space-y-1.5">
                <Label htmlFor={`social-${link.platform}`}>
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
                />
              </div>

              <Switch
                className="mt-7"
                aria-label={`Show ${LABEL[link.platform]}`}
                checked={link.enabled}
                onCheckedChange={(enabled) =>
                  update(link.platform, { enabled })
                }
              />
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
          <LoadingButton type="submit" loading={saving}>
            Save links
          </LoadingButton>
        </CardFooter>
      </form>
    </Card>
  );
}
