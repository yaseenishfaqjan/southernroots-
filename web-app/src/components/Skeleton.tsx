// Shimmer placeholder rows for tables while data loads.
export function TableSkeleton({ rows = 5, cols }: { rows?: number; cols: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="border-b border-gray-50">
          {Array.from({ length: cols }).map((_, c) => (
            <td key={c} className="px-6 py-4">
              <div
                className="h-3.5 animate-pulse rounded bg-gray-100"
                style={{ width: `${45 + ((r + c) % 4) * 14}%` }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
