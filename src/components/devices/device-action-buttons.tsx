"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle, QrCode, Edit, ArrowLeftRight, Activity } from "lucide-react"
import Link from "next/link"
import { TransferDeviceDialog } from "./transfer-device-dialog"
import { ChangeStatusDialog } from "./change-status-dialog"
import { useRouter } from "next/navigation"

export interface DeviceActionButtonsProps {
  deviceId: string;
  deviceName: string;
  currentHospital: string;
  currentDepartment: string;
  currentLocation?: string;
  currentStatus: string;
  allowedActions?: string[];
}

export function DeviceActionButtons({
  deviceId,
  deviceName,
  currentHospital,
  currentDepartment,
  currentLocation,
  currentStatus,
  allowedActions = ["report_problem", "view_qr", "edit", "transfer", "change_status"],
}: DeviceActionButtonsProps) {
  const router = useRouter()
  const [transferOpen, setTransferOpen] = React.useState(false)
  const [statusOpen, setStatusOpen] = React.useState(false)

  const canReport = allowedActions.includes("report_problem")
  const canViewQr = allowedActions.includes("view_qr")
  const canEdit = allowedActions.includes("edit")
  const canTransfer = allowedActions.includes("transfer")
  const canChangeStatus = allowedActions.includes("change_status")

  const handleRefresh = () => {
    router.refresh()
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {canReport && (
          <Link href={`/tickets/create?deviceId=${deviceId}&source=device_profile`}>
            <Button
              variant="default"
              size="sm"
              className="bg-amber-600 hover:bg-amber-700 text-white font-medium"
            >
              <AlertTriangle className="w-4 h-4 mr-1.5" />
              Report Problem
            </Button>
          </Link>
        )}

        {canViewQr && (
          <Link href={`/devices/${deviceId}/qr`}>
            <Button variant="outline" size="sm">
              <QrCode className="w-4 h-4 mr-1.5" />
              QR Code
            </Button>
          </Link>
        )}

        {canEdit && (
          <Link href={`/devices/${deviceId}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="w-4 h-4 mr-1.5" />
              Edit
            </Button>
          </Link>
        )}

        {canTransfer && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTransferOpen(true)}
          >
            <ArrowLeftRight className="w-4 h-4 mr-1.5" />
            Transfer
          </Button>
        )}

        {canChangeStatus && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setStatusOpen(true)}
          >
            <Activity className="w-4 h-4 mr-1.5" />
            Change Status
          </Button>
        )}
      </div>

      {/* Transfer Dialog */}
      <TransferDeviceDialog
        open={transferOpen}
        onOpenChange={setTransferOpen}
        deviceId={deviceId}
        deviceName={deviceName}
        currentHospital={currentHospital}
        currentDepartment={currentDepartment}
        currentLocation={currentLocation}
        onSuccess={handleRefresh}
      />

      {/* Status Change Dialog */}
      <ChangeStatusDialog
        open={statusOpen}
        onOpenChange={setStatusOpen}
        deviceId={deviceId}
        deviceName={deviceName}
        currentStatus={currentStatus}
        onSuccess={handleRefresh}
      />
    </>
  )
}
