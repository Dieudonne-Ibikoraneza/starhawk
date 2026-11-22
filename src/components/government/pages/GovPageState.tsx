import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function GovPageState({
  loading,
  error,
  retry,
}: {
  loading: boolean;
  error?: Error | null;
  retry?: () => void;
}) {
  if (loading)
    return (
      <div
        role="status"
        className="flex min-h-[280px] items-center justify-center gap-3 text-sm text-gray-500"
      >
        <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
        Loading government records…
      </div>
    );
  if (error)
    return (
      <div
        role="alert"
        className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700"
      >
        <p>{error.message}</p>
        {retry && (
          <Button variant="outline" className="mt-3" onClick={retry}>
            Try again
          </Button>
        )}
      </div>
    );
  return null;
}
