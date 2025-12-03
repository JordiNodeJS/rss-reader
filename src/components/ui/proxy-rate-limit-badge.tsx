"use client";

import React from "react";
import { Badge } from "./badge";
import { Tooltip, TooltipTrigger, TooltipContent } from "./tooltip";

interface Props {
  remaining: number;
  resetAt: number; // timestamp in ms
  limit?: number;
  className?: string;
}

export default function ProxyRateLimitBadge({
  remaining,
  resetAt,
  limit = 5,
  className = "",
}: Props) {
  // Format reset time as a localized time string (do not rely on Date.now for purity)
  const resetTimeStr = new Date(resetAt).toLocaleTimeString();
  const text = remaining > 0 ? `${remaining} libres` : `Límite alcanzado`;
  const tooltip =
    remaining > 0
      ? `Quedan ${remaining} de ${limit}. Se reinicia a ${resetTimeStr}`
      : `Has alcanzado ${limit} resúmenes gratuitos por hora. Se reinicia a ${resetTimeStr}`;

  const variant = remaining > 0 ? "default" : "destructive";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge className={className} variant={variant}>
          Proxy: {text}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}
