'use client';

interface KeyEventsListProps {
  events: string[];
  className?: string;
}

export function KeyEventsList({ events, className }: KeyEventsListProps) {
  return (
    <ul className={`${className} space-y-2`}>
      {events.map((event, index) => (
        <li
          key={`${event}-${index}`}
          className="rounded-lg border border-white/10 bg-slate-900/55 px-3 py-2 text-sm text-slate-200"
        >
          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
            Event {index + 1}
          </p>
          <p className="mt-1">{event}</p>
        </li>
      ))}
    </ul>
  );
}
