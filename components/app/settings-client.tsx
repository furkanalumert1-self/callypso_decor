"use client";

import { CheckCircle2, CircleDashed } from "lucide-react";
import appConfig from "@/app.config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Icon } from "@/components/ui/icon";
import { useLang } from "@/components/i18n/language-provider";
import { toast } from "@/components/ui/toast";

export function SettingsClient({ connected }: { connected: Record<string, boolean> }) {
  const { t, ui } = useLang();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Brand */}
      <Card>
        <CardHeader>
          <CardTitle>{ui.brand}</CardTitle>
          <p className="text-sm text-muted-foreground">{ui.brandHint}</p>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>{ui.productName}</Label>
            <Input defaultValue={appConfig.name} readOnly />
          </div>
          {appConfig.domain && (
            <div className="space-y-1.5">
              <Label>{ui.domain}</Label>
              <Input defaultValue={appConfig.domain} readOnly />
            </div>
          )}
          <div className="space-y-1.5 sm:col-span-2">
            <Label>{ui.tagline}</Label>
            <Input defaultValue={t(appConfig.tagline)} readOnly />
          </div>
        </CardContent>
      </Card>

      {/* Integrations */}
      <Card>
        <CardHeader>
          <CardTitle>{ui.integrations}</CardTitle>
          <p className="text-sm text-muted-foreground">{ui.integrationsHint}</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {appConfig.integrations.map((it) => (
            <div key={it.key} className="flex items-center gap-4 rounded-lg border border-border p-4">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-muted text-muted-foreground">
                <Icon name="plug" className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{it.name}</p>
                  {it.required && <Badge tone="warning">{ui.required}</Badge>}
                </div>
                <p className="truncate text-sm text-muted-foreground">{it.purpose}</p>
              </div>
              {connected[it.key] ? (
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-success">
                  <CheckCircle2 className="h-4 w-4" /> {ui.connected}
                </span>
              ) : (
                <span className="inline-flex items-center gap-3">
                  <span className="hidden items-center gap-1.5 text-sm font-medium text-muted-foreground sm:inline-flex">
                    <CircleDashed className="h-4 w-4" /> {ui.demoMode}
                  </span>
                  <Button size="sm" variant="outline" onClick={() => toast(ui.fullVersion, "info")}>{ui.connect}</Button>
                </span>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => toast(ui.fullVersion, "info")}>{ui.saveChanges}</Button>
      </div>
    </div>
  );
}
