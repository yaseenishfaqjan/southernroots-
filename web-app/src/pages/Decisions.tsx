import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, formatDate } from "../lib/api";

interface AiDecision {
  id: number;
  agent: string;
  input: unknown;
  output: string;
  reasoning: string | null;
  executedAt: string;
  success: boolean;
}

const agentColors: Record<string, string> = {
  quote: "bg-green-100 text-green-700",
  dispatch: "bg-blue-100 text-blue-700",
  billing: "bg-orange-100 text-orange-700",
  upsell: "bg-purple-100 text-purple-700",
  churn: "bg-red-100 text-red-700",
};

function AgentBadge({ agent }: { agent: string }) {
  const color =
    agentColors[agent.toLowerCase()] ?? "bg-gray-100 text-gray-700";
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}
    >
      {agent}
    </span>
  );
}

function CollapsibleJson({ data }: { data: unknown }) {
  const [open, setOpen] = useState(false);
  const preview = JSON.stringify(data).slice(0, 60);
  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-xs text-blue-600 hover:text-blue-800 font-mono"
      >
        {open ? "▼ collapse" : "▶ " + preview + (preview.length >= 60 ? "…" : "")}
      </button>
      {open && (
        <pre className="mt-2 text-xs bg-gray-50 rounded p-2 overflow-auto max-w-xs max-h-32 text-gray-600 border border-gray-200">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}

export default function Decisions() {
  const { data: decisions, isLoading } = useQuery<AiDecision[]>({
    queryKey: ["ai-decisions"],
    queryFn: () => api.get("/ai/decisions"),
    refetchInterval: 30_000,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">AI Decisions</h1>
        <p className="text-sm text-gray-500 mt-1">
          Full audit log of every autonomous AI action — refreshes every 30s
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {["Agent", "Input", "Output", "Reasoning", "Executed At"].map(
                (h) => (
                  <th
                    key={h}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading && (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-8 text-center text-gray-400"
                >
                  Loading AI decisions...
                </td>
              </tr>
            )}
            {decisions?.map((d) => (
              <tr key={d.id} className="hover:bg-gray-50 align-top">
                <td className="px-6 py-4">
                  <AgentBadge agent={d.agent} />
                  {!d.success && (
                    <div className="mt-1">
                      <span className="text-xs text-red-500">failed</span>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 max-w-xs">
                  <CollapsibleJson data={d.input} />
                </td>
                <td className="px-6 py-4 max-w-xs">
                  <p className="text-sm text-gray-700 line-clamp-3">
                    {d.output}
                  </p>
                </td>
                <td className="px-6 py-4 max-w-xs">
                  {d.reasoning ? (
                    <p className="text-xs text-gray-500 italic line-clamp-3">
                      {d.reasoning}
                    </p>
                  ) : (
                    <span className="text-gray-300 text-xs">—</span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                  {formatDate(d.executedAt)}
                </td>
              </tr>
            ))}
            {!isLoading && !decisions?.length && (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-8 text-center text-gray-400"
                >
                  No AI decisions logged yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
