export type DomainEventType =
  | "LOT_INGESTED"
  | "LOT_UPDATED"
  | "LOT_COMPLETENESS_CHANGED"
  | "COST_ESTIMATE_CREATED"
  | "QUOTE_REQUEST_CREATED"
  | "ADVISORY_CASE_UPDATED"
  | "TARIFF_RULES_UPDATED";

export interface DomainEvent<TPayload = Record<string, unknown>> {
  type: DomainEventType;
  occurredAt: Date;
  module: string;
  payload: TPayload;
}

type EventHandler = (event: DomainEvent) => Promise<void> | void;

class InternalEventBus {
  private handlers: Map<DomainEventType, EventHandler[]> = new Map();

  subscribe(type: DomainEventType, handler: EventHandler): void {
    const existing = this.handlers.get(type) ?? [];
    existing.push(handler);
    this.handlers.set(type, existing);
  }

  async publish(event: DomainEvent): Promise<void> {
    const subscribers = this.handlers.get(event.type) ?? [];
    for (const handler of subscribers) {
      try {
        await handler(event);
      } catch (err) {
        console.error(`[EventBus] Error procesando evento ${event.type}:`, err);
      }
    }
  }
}

export const domainEventBus = new InternalEventBus();

