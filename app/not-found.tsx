import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";
import { buttonClass, Card, EmptyState } from "@/components/ui";

export default function NotFound() {
  return (
    <Card>
      <EmptyState
        icon={<SearchX className="size-5" />}
        title="Workspace page not found"
        description="The page may have moved, or the prospect link may no longer be available in this workspace."
        action={
          <Link href="/" className={buttonClass("primary")}>
            <ArrowLeft className="size-4" />
            Back to Dashboard
          </Link>
        }
      />
    </Card>
  );
}
