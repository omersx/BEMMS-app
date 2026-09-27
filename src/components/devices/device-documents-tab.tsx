"use client"

import { FileText, Download } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface DeviceDocumentsTabProps {
  documents: any[];
  deviceId: string;
}

const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const categoryLabels: Record<string, string> = {
  user_manual: "User Manual",
  service_manual: "Service Manual",
  certificate: "Certificate",
  calibration_report: "Calibration Report",
  photo: "Photo",
  other: "Other"
}

export function DeviceDocumentsTab({ documents, deviceId }: DeviceDocumentsTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Device Documents</h3>
        <Button variant="outline" size="sm" disabled>
          Upload Document
        </Button>
      </div>

      {(!documents || documents.length === 0) ? (
        <div className="text-center py-12 border rounded-lg bg-muted/20">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h4 className="text-lg font-medium text-foreground">No documents found</h4>
          <p className="text-muted-foreground text-sm mt-1">Upload manuals, certificates, and other device documentation here.</p>
        </div>
      ) : (
        <div className="border rounded-md">
          <div className="grid grid-cols-12 gap-4 p-4 border-b bg-muted/50 font-medium text-sm">
            <div className="col-span-4">File Name</div>
            <div className="col-span-2">Category</div>
            <div className="col-span-2">Size</div>
            <div className="col-span-2">Visibility</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>
          <div className="divide-y">
            {documents.map((doc) => (
              <div key={doc.id} className="grid grid-cols-12 gap-4 p-4 items-center text-sm hover:bg-muted/20 transition-colors">
                <div className="col-span-4 font-medium flex items-center gap-2 truncate">
                  <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="truncate">{doc.fileName}</span>
                </div>
                <div className="col-span-2">
                  <Badge variant="secondary" className="font-normal">
                    {categoryLabels[doc.category] || doc.category}
                  </Badge>
                </div>
                <div className="col-span-2 text-muted-foreground">
                  {formatSize(doc.fileSize)}
                </div>
                <div className="col-span-2">
                  <Badge variant="outline" className={cn(
                    "font-normal capitalize",
                    doc.visibility === 'biomedical_only' ? 'text-purple-700 bg-purple-50 border-purple-200' : 'text-green-700 bg-green-50 border-green-200'
                  )}>
                    {doc.visibility.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="col-span-2 text-right">
                  <Button variant="ghost" size="icon" title="Download">
                    <Download className="w-4 h-4" />
                    <span className="sr-only">Download</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
