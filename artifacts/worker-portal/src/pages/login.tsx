import { useEffect } from "react";
import { useLocation } from "wouter";
import { brand } from "@workspace/brand";
import { useAuth } from "@/hooks/use-auth";
import { Wifi, WifiOff, Star, TrendingUp, ChevronRight } from "lucide-react";

const DEMO_WORKERS = [
  { id: 1, name: "Marcus Webb",   initials: "MW", specialty: "Landscaping",              rating: 4.8, completionRate: 96, online: true,  color: "bg-emerald-500" },
  { id: 2, name: "Devon Price",   initials: "DP", specialty: "Pressure Washing",          rating: 4.6, completionRate: 91, online: true,  color: "bg-blue-500"    },
  { id: 3, name: "Ricky Tate",    initials: "RT", specialty: "Landscaping & Maintenance", rating: 4.9, completionRate: 98, online: false, color: "bg-violet-500"  },
  { id: 4, name: "Jayla Simmons", initials: "JS", specialty: "Pressure Washing",          rating: 4.7, completionRate: 88, online: true,  color: "bg-pink-500"    },
  { id: 5, name: "Carlos Mendez", initials: "CM", specialty: "Landscaping",               rating: 4.5, completionRate: 94, online: false, color: "bg-orange-500"  },
];

export default function Login() {
  const [, setLocation] = useLocation();
  const { workerId, setWorkerId } = useAuth();

  useEffect(() => {
    if (workerId) setLocation("/jobs");
  }, [workerId]);

  const handleSelect = (id: number) => {
    setWorkerId(id);
    setLocation("/jobs");
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-4 flex items-center justify-between">
        <img src="/logo.png" alt={brand.logoAlt} className="h-16 w-auto object-contain" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Worker Portal</span>
      </div>

      <div className="flex-1 flex flex-col px-4 py-8 max-w-md mx-auto w-full">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Who are you?</h2>
          <p className="text-muted-foreground text-sm">Select your profile to see your jobs and earnings.</p>
        </div>

        <div className="space-y-3">
          {DEMO_WORKERS.map((worker) => (
            <button
              key={worker.id}
              onClick={() => handleSelect(worker.id)}
              className="w-full bg-white rounded-2xl border border-gray-200 hover:border-primary hover:shadow-md active:scale-[0.98] transition-all duration-150 p-4 text-left group"
            >
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className={`w-14 h-14 ${worker.color} text-white rounded-xl flex items-center justify-center font-bold text-lg shrink-0 shadow-sm`}>
                  {worker.initials}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="font-bold text-gray-900">{worker.name}</span>
                    <div className="flex items-center gap-1">
                      {worker.online ? (
                        <>
                          <Wifi className="w-3.5 h-3.5 text-green-500" />
                          <span className="text-xs font-semibold text-green-600">Online</span>
                        </>
                      ) : (
                        <>
                          <WifiOff className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-xs font-semibold text-gray-400">Offline</span>
                        </>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{worker.specialty}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span className="text-xs font-bold text-gray-700">{worker.rating}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-xs font-semibold text-gray-600">{worker.completionRate}% completion</span>
                    </div>
                  </div>
                </div>

                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-primary shrink-0 transition-colors" />
              </div>
            </button>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          Demo mode — all profiles use live data
        </p>
      </div>
    </div>
  );
}
