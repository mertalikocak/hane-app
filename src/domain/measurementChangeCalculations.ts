import { FullMeasurementRecord } from "./bodyTrackingTypes";

export type ChangeDirection = "decrease" | "increase" | "neutral";

export interface MetricChangeResult {
  currentValue: number;
  baselineValue: number;
  diff: number;
  formattedDiff: string;
  rawDiffFormatted: string;
  direction: ChangeDirection;
  unit: string;
}

export interface MetricChangesSummary {
  fromPrevious: MetricChangeResult | null;
  fromStart: MetricChangeResult | null;
}

/**
 * Calculates the difference between a current measurement value and a baseline measurement value.
 * Formats difference to 1 decimal place with direction arrow (↓, ↑) or "Değişmedi".
 *
 * @param currentValue Current measurement value
 * @param baselineValue Baseline measurement value (previous or start)
 * @param unit Measurement unit (kg, %, cm)
 * @returns MetricChangeResult or null if either value is invalid
 */
export function calculateMeasurementChange(
  currentValue?: number | null,
  baselineValue?: number | null,
  unit: string = ""
): MetricChangeResult | null {
  if (
    currentValue === undefined ||
    currentValue === null ||
    isNaN(currentValue) ||
    !Number.isFinite(currentValue) ||
    currentValue <= 0
  ) {
    return null;
  }

  if (
    baselineValue === undefined ||
    baselineValue === null ||
    isNaN(baselineValue) ||
    !Number.isFinite(baselineValue) ||
    baselineValue <= 0
  ) {
    return null;
  }

  const diff = Number((currentValue - baselineValue).toFixed(1));
  const rawDiffFormatted = Math.abs(diff).toFixed(1);

  let direction: ChangeDirection = "neutral";
  let formattedDiff = "Değişmedi";

  if (Math.abs(diff) < 0.05) {
    direction = "neutral";
    formattedDiff = "Değişmedi";
  } else if (diff < 0) {
    direction = "decrease";
    formattedDiff = `↓ ${rawDiffFormatted} ${unit}`.trim();
  } else {
    direction = "increase";
    formattedDiff = `↑ ${rawDiffFormatted} ${unit}`.trim();
  }

  return {
    currentValue,
    baselineValue,
    diff,
    formattedDiff,
    rawDiffFormatted,
    direction,
    unit,
  };
}

/**
 * Calculates metric change from the immediately preceding measurement record.
 * Assumes records are ordered chronologically descending (newest first at index 0).
 *
 * Rules:
 * - Returns null if there are fewer than 2 records.
 * - Returns null if either current or previous record lacks the metric value.
 */
export function calculateChangeFromPrevious(
  records: FullMeasurementRecord[],
  extractor: (rec: FullMeasurementRecord) => number | null | undefined,
  unit: string = ""
): MetricChangeResult | null {
  if (!records || records.length < 2) {
    return null;
  }

  const latest = records[0];
  const previous = records[1];

  const currentVal = extractor(latest);
  const previousVal = extractor(previous);

  return calculateMeasurementChange(currentVal, previousVal, unit);
}

/**
 * Calculates total metric change from the initial (oldest) recorded measurement.
 * Assumes records are ordered chronologically descending (newest first at index 0).
 *
 * Rules:
 * - Returns null if there are fewer than 2 records.
 * - Finds the initial baseline entry for this specific metric before the latest record.
 * - Returns null if no previous baseline is available.
 */
export function calculateChangeFromStart(
  records: FullMeasurementRecord[],
  extractor: (rec: FullMeasurementRecord) => number | null | undefined,
  unit: string = ""
): MetricChangeResult | null {
  if (!records || records.length < 2) {
    return null;
  }

  const latest = records[0];
  const currentVal = extractor(latest);

  if (
    currentVal === undefined ||
    currentVal === null ||
    isNaN(currentVal) ||
    !Number.isFinite(currentVal) ||
    currentVal <= 0
  ) {
    return null;
  }

  // Find the oldest record that has a valid value for this metric (excluding latest)
  let initialVal: number | null | undefined = null;
  for (let i = records.length - 1; i > 0; i--) {
    const val = extractor(records[i]);
    if (
      val !== undefined &&
      val !== null &&
      !isNaN(val) &&
      Number.isFinite(val) &&
      val > 0
    ) {
      initialVal = val;
      break;
    }
  }

  if (initialVal === null || initialVal === undefined) {
    return null;
  }

  return calculateMeasurementChange(currentVal, initialVal, unit);
}

/**
 * Convenience helper to compute both previous and start changes for a given metric.
 */
export function getMetricChangesSummary(
  records: FullMeasurementRecord[],
  extractor: (rec: FullMeasurementRecord) => number | null | undefined,
  unit: string = ""
): MetricChangesSummary {
  return {
    fromPrevious: calculateChangeFromPrevious(records, extractor, unit),
    fromStart: calculateChangeFromStart(records, extractor, unit),
  };
}
