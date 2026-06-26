'use client';

import {
  createContext,
  forwardRef,
  useContext,
  useId,
  type ComponentProps,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { Legend, ResponsiveContainer, Tooltip } from 'recharts';
import { type LucideIcon } from '@stockflow/icons';
import { cn } from '../../lib/cn';

/** Per-series display config: a label, optional icon, and a CSS colour (typically `var(--chart-N)`). */
export interface ChartSeriesConfig {
  label?: ReactNode;
  icon?: LucideIcon;
  /** Any CSS colour; reference a theme token, e.g. `var(--chart-1)`. */
  color?: string;
}

/** Maps a data key (series) to its display config. */
export type ChartConfig = Record<string, ChartSeriesConfig>;

interface ChartContextValue {
  config: ChartConfig;
}

const ChartContext = createContext<ChartContextValue | null>(null);

/** Read the chart config. Returns an empty config outside a `ChartContainer` (graceful for tooltips). */
export function useChart(): ChartContextValue {
  return useContext(ChartContext) ?? { config: {} };
}

/** Build the `--color-<key>` custom properties that bridge the config to Recharts' SVG colours. */
function colorVars(config: ChartConfig): CSSProperties {
  const style: Record<string, string> = {};
  for (const [key, series] of Object.entries(config)) {
    if (series.color) style[`--color-${key}`] = series.color;
  }
  return style as CSSProperties;
}

export interface ChartContainerProps extends HTMLAttributes<HTMLDivElement> {
  config: ChartConfig;
  /** A single Recharts chart element (e.g. `<LineChart>…`). */
  children: ComponentProps<typeof ResponsiveContainer>['children'];
}

/**
 * ChartContainer — the token bridge for Recharts. Injects `--color-<key>` variables from `config`
 * (so series use `fill="var(--color-revenue)"`), themes axes/grid/text via tokens, and wraps a
 * `ResponsiveContainer`. Default aspect is video (16:9); override via className. Spec: docs/components/charts.md.
 */
export const ChartContainer = forwardRef<HTMLDivElement, ChartContainerProps>(function ChartContainer(
  { id, className, children, config, style, ...props },
  ref,
) {
  const uniqueId = useId();
  const chartId = `chart-${id ?? uniqueId.replace(/:/g, '')}`;

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        ref={ref}
        data-chart={chartId}
        className={cn(
          // Block layout with a definite size — Recharts' ResponsiveContainer measures this box, and a
          // flex item's percentage height/height can collapse to 0 (→ blank chart). aspect-video gives
          // a default height; pass an explicit height (e.g. h-72) via className to override.
          "relative aspect-video w-full text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
          className,
        )}
        style={{ ...colorVars(config), ...style }}
        {...props}
      >
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
});

/** Recharts `Tooltip` — pass `content={<ChartTooltipContent />}`. */
export const ChartTooltip = Tooltip;

interface TooltipPayloadItem {
  name?: string | number;
  value?: string | number;
  dataKey?: string | number;
  color?: string;
  payload?: Record<string, unknown>;
}

export interface ChartTooltipContentProps extends HTMLAttributes<HTMLDivElement> {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string | number;
  /** Hide the header label row. */
  hideLabel?: boolean;
  /** Hide the colour indicators. */
  hideIndicator?: boolean;
  /** Indicator shape. */
  indicator?: 'dot' | 'line';
  labelClassName?: string;
}

/** Token-styled tooltip body. Reads labels/colours from the chart config, falling back to the payload. */
export const ChartTooltipContent = forwardRef<HTMLDivElement, ChartTooltipContentProps>(
  function ChartTooltipContent(
    {
      active,
      payload,
      label,
      hideLabel = false,
      hideIndicator = false,
      indicator = 'dot',
      className,
      labelClassName,
    },
    ref,
  ) {
    // Note: Recharts injects its own tooltip props (coordinate, allowEscapeViewBox, …) here — we read
    // only what we need and never spread the rest onto the DOM.
    const { config } = useChart();
    if (!active || !payload?.length) return null;

    return (
      <div
        ref={ref}
        className={cn(
          'grid min-w-32 gap-1.5 rounded-lg border border-border bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-md',
          className,
        )}
      >
        {!hideLabel ? (
          <div className={cn('font-medium text-foreground', labelClassName)}>{label}</div>
        ) : null}
        <div className="grid gap-1.5">
          {payload.map((item, index) => {
            const configKey = String(item.dataKey ?? item.name ?? index);
            const series = config[configKey];
            const itemColor = series?.color ?? item.color;
            return (
              // Pie payloads share a dataKey, so the React key must include the index to stay unique.
              <div key={`${configKey}-${index}`} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5">
                  {!hideIndicator ? (
                    <span
                      aria-hidden="true"
                      className={cn(
                        'shrink-0 rounded-[2px]',
                        indicator === 'dot' ? 'size-2.5' : 'h-2.5 w-1',
                      )}
                      style={{ backgroundColor: itemColor }}
                    />
                  ) : null}
                  <span className="text-muted-foreground">{series?.label ?? item.name}</span>
                </div>
                <span className="font-medium tabular-nums text-foreground">{item.value}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  },
);

/** Recharts `Legend` — pass `content={<ChartLegendContent />}`. */
export const ChartLegend = Legend;

interface LegendPayloadItem {
  value?: string | number;
  dataKey?: string | number;
  color?: string;
}

export interface ChartLegendContentProps extends HTMLAttributes<HTMLDivElement> {
  payload?: LegendPayloadItem[];
  hideIcon?: boolean;
}

/** Token-styled legend. Reads labels from the chart config. */
export const ChartLegendContent = forwardRef<HTMLDivElement, ChartLegendContentProps>(
  function ChartLegendContent({ payload, hideIcon = false, className }, ref) {
    // Recharts injects legend props (iconSize, layout, …); read only what we need, never spread to DOM.
    const { config } = useChart();
    if (!payload?.length) return null;

    return (
      <div ref={ref} className={cn('flex flex-wrap items-center justify-center gap-4', className)}>
        {payload.map((item, index) => {
          const configKey = String(item.dataKey ?? item.value ?? index);
          const series = config[configKey];
          return (
            <div
              key={`${configKey}-${index}`}
              className="flex items-center gap-1.5 text-xs text-muted-foreground"
            >
              {!hideIcon ? (
                <span
                  aria-hidden="true"
                  className="size-2.5 shrink-0 rounded-[2px]"
                  style={{ backgroundColor: series?.color ?? item.color }}
                />
              ) : null}
              {series?.label ?? item.value}
            </div>
          );
        })}
      </div>
    );
  },
);
