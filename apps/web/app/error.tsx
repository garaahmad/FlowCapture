"use client";

import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="container-shell grid min-h-screen place-items-center py-12">
      <div className="w-full max-w-md">
        <Alert tone="error" title="Something went wrong">The page could not be loaded. No action was confirmed.</Alert>
        <Button onClick={reset} className="mt-4 w-full">Try again</Button>
      </div>
    </main>
  );
}
