import { listChecklistTemplates } from "@/lib/actions/checklists"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ClipboardCheck, Plus } from "lucide-react"
import Link from "next/link"

export default async function ChecklistTemplatesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Checklist Templates"
        description="Standardized inspection checklists, test procedures, and maintenance protocols"
      >
        <Link href="/maintenance/checklists/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Template
          </Button>
        </Link>
      </PageHeader>

      <Card className="border-dashed">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ClipboardCheck className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl">
            Checklist template management coming soon
          </CardTitle>
          <CardDescription className="max-w-md mx-auto">
            Design version-controlled maintenance checklists, safety inspection routines, and calibration steps with required pass/fail criteria and numerical measurements.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center pb-8 pt-4">
          <div className="flex gap-3">
            <Link href="/maintenance/checklists/new">
              <Button variant="outline" className="gap-2">
                <Plus className="w-4 h-4" />
                Create Template
              </Button>
            </Link>
            <Link href="/maintenance">
              <Button variant="ghost">
                Back to Maintenance
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
