import { ComponentEvent } from "../../domain";

const MS_PER_HOUR = 1000 * 60 * 60;

export type OnOffPair = { onType: string; offType: string };

export class OnOffIntervalCalculator {
  constructor(private readonly pair: OnOffPair) {}

  totalOnHours(
    eventLog: ComponentEvent[],
    rangeStart: Date,
    rangeEnd: Date,
  ): number {
    let totalMs = 0;
    for (const events of this.groupByComponent(eventLog).values()) {
      events.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      for (const [start, end] of this.intervalsForComponent(
        events,
        rangeStart,
        rangeEnd,
      )) {
        totalMs += end.getTime() - start.getTime();
      }
    }
    return totalMs / MS_PER_HOUR;
  }

  unionOnHours(
    eventLog: ComponentEvent[],
    rangeStart: Date,
    rangeEnd: Date,
  ): number {
    const intervals: [Date, Date][] = [];
    for (const events of this.groupByComponent(eventLog).values()) {
      events.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      intervals.push(
        ...this.intervalsForComponent(events, rangeStart, rangeEnd),
      );
    }
    intervals.sort((a, b) => a[0].getTime() - b[0].getTime());

    let totalMs = 0;
    let mergeStart: Date | null = null;
    let mergeEnd: Date | null = null;
    for (const [start, end] of intervals) {
      if (mergeStart === null) {
        mergeStart = start;
        mergeEnd = end;
      } else if (start <= mergeEnd!) {
        if (end > mergeEnd!) mergeEnd = end;
      } else {
        totalMs += mergeEnd!.getTime() - mergeStart.getTime();
        mergeStart = start;
        mergeEnd = end;
      }
    }
    if (mergeStart !== null) {
      totalMs += mergeEnd!.getTime() - mergeStart.getTime();
    }

    return totalMs / MS_PER_HOUR;
  }

  private groupByComponent(
    eventLog: ComponentEvent[],
  ): Map<string, ComponentEvent[]> {
    const byComponent = new Map<string, ComponentEvent[]>();
    for (const event of eventLog) {
      if (!this.isRelevant(event)) continue;
      const arr = byComponent.get(event.componentId) ?? [];
      arr.push(event);
      byComponent.set(event.componentId, arr);
    }
    return byComponent;
  }

  private isRelevant(event: ComponentEvent): boolean {
    return (
      event.eventType === this.pair.onType ||
      event.eventType === this.pair.offType
    );
  }

  private intervalsForComponent(
    events: ComponentEvent[],
    rangeStart: Date,
    rangeEnd: Date,
  ): [Date, Date][] {
    let lastPreRange: ComponentEvent | undefined;
    for (const e of events) {
      if (e.createdAt >= rangeStart) break;
      lastPreRange = e;
    }

    let cursor: Date | null =
      lastPreRange?.eventType === this.pair.onType ? rangeStart : null;

    const intervals: [Date, Date][] = [];
    for (const event of events) {
      if (event.createdAt < rangeStart) continue;
      if (event.createdAt > rangeEnd) break;

      if (event.eventType === this.pair.onType) {
        if (cursor === null) cursor = event.createdAt;
      } else {
        if (cursor !== null) {
          intervals.push([cursor, event.createdAt]);
        }
        cursor = null;
      }
    }

    if (cursor !== null) {
      intervals.push([cursor, rangeEnd]);
    }

    return intervals;
  }
}
