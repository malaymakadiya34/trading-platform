import { LoadingState } from "@/src/components/ui/data-states";

export default function DashboardLoading() {
  return (
    <main className="min-h-screen bg-[#06101c] px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-[1600px]">
        <LoadingState
          description="Loading the authenticated trading workspace."
          title="Preparing dashboard"
        />
      </div>
    </main>
  );
}
