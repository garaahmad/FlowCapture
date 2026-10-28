import Link from "next/link";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="container-shell grid min-h-screen place-items-center py-12 text-center">
      <div><Logo className="justify-center" /><h1 className="mt-8 text-3xl font-extrabold">Page not found</h1><p className="mt-3 text-muted">This page does not exist or is not available in this build.</p><Button asChild className="mt-6"><Link href="/">Return home</Link></Button></div>
    </main>
  );
}
