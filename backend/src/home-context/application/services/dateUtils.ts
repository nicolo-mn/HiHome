export function getHourInRome(date: Date = new Date()): number {
  return (
    Number(
      new Intl.DateTimeFormat("en-US", {
        timeZone: "Europe/Rome",
        hour: "2-digit",
        hour12: false,
      }).format(date),
    ) % 24
  );
}
