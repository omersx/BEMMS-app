"use client"

import * as React from "react"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Shield, Loader2, CheckCircle2, ShieldCheck, XCircle } from "lucide-react"

export interface SignActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deviceName: string;
  assetNumber: string;
  recordType: string;
  recordNumber: string;
  actionLabel: string;
  workSummary: string;
  finalResult?: string;
  proposedDeviceStatus?: string;
  signaturePurpose: string;
  attestationText: string;
  signerName: string;
  signerRole: string;
  onSign: (password: string, comments?: string) => Promise<{ success: boolean; error?: string }>;
  nextStep?: string;
}

export function SignActionDialog({
  open,
  onOpenChange,
  deviceName,
  assetNumber,
  recordType,
  recordNumber,
  actionLabel,
  workSummary,
  finalResult,
  proposedDeviceStatus,
  signaturePurpose,
  attestationText,
  signerName,
  signerRole,
  onSign,
  nextStep,
}: SignActionDialogProps) {
  const [password, setPassword] = useState("")
  const [comments, setComments] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  const serverTime = new Date().toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  })

  // Reset state when opened
  React.useEffect(() => {
    if (open) {
      setPassword("")
      setComments("")
      setError(null)
      setSuccess(false)
      setIsSubmitting(false)
    }
  }, [open])

  const handleSign = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password) return

    setIsSubmitting(true)
    setError(null)

    try {
      const result = await onSign(password, comments)
      if (result.success) {
        setSuccess(true)
      } else {
        setError(result.error || "Failed to sign record. Please verify your credentials.")
      }
    } catch (err) {
      setError("An unexpected error occurred during signing.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={success ? undefined : onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-lg w-full max-h-[100dvh] overflow-y-auto sm:max-h-[90vh]">
        {success ? (
          <div className="flex flex-col items-center justify-center py-8 px-4 space-y-6 text-center animate-in fade-in zoom-in duration-300">
            <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center ring-8 ring-emerald-50 dark:ring-emerald-900/50">
              <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-500" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                {actionLabel} Signed Successfully
              </h2>
              <p className="text-sm text-muted-foreground max-w-[280px] mx-auto leading-relaxed">
                Signed by: <span className="font-medium text-foreground">{signerName}</span>, {signerRole}
                <br />
                {serverTime}
              </p>
            </div>

            <div className="w-full p-3 rounded-lg bg-muted/50 border border-border/50">
              <p className="text-sm font-medium text-foreground">
                Status: <span className="text-primary">{nextStep || 'Complete'}</span>
              </p>
            </div>

            <Button onClick={handleClose} className="w-full mt-2" variant="outline">
              Close
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader className="space-y-3 pb-2">
              <DialogTitle className="flex items-center gap-2 text-xl">
                <ShieldCheck className="h-5 w-5 text-primary" />
                {actionLabel}
              </DialogTitle>
              <DialogDescription className="sr-only">
                Review and sign the electronic record
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">Device: {deviceName} <span className="text-muted-foreground">• Asset: {assetNumber}</span></p>
                <p className="text-sm text-muted-foreground">Record: {recordType} {recordNumber}</p>
              </div>
              
              <Separator />
              
              <div className="space-y-2 text-sm">
                <div className="grid grid-cols-[100px_1fr] gap-2">
                  <span className="text-muted-foreground">Action:</span>
                  <span className="font-medium">{actionLabel}</span>
                </div>
                <div className="grid grid-cols-[100px_1fr] gap-2">
                  <span className="text-muted-foreground">Work Summary:</span>
                  <span>{workSummary}</span>
                </div>
                {finalResult && (
                  <div className="grid grid-cols-[100px_1fr] gap-2">
                    <span className="text-muted-foreground">Result:</span>
                    <span className="font-medium">{finalResult}</span>
                  </div>
                )}
                {proposedDeviceStatus && (
                  <div className="grid grid-cols-[100px_1fr] gap-2">
                    <span className="text-muted-foreground">Status:</span>
                    <span className="font-medium">{proposedDeviceStatus}</span>
                  </div>
                )}
              </div>

              <Separator />

              <blockquote className="border-l-4 border-primary/50 bg-muted/40 px-4 py-3 text-sm italic text-foreground/90 rounded-r-md">
                &quot;{attestationText}&quot;
              </blockquote>
              
              <div className="space-y-1 bg-primary/5 p-3 rounded-md border border-primary/10">
                <p className="text-sm">Signing as: <span className="font-semibold">{signerName}</span>, <span className="text-muted-foreground">{signerRole}</span></p>
                <p className="text-xs text-muted-foreground">Time: {serverTime}</p>
              </div>

              <Separator />
              
              <form onSubmit={handleSign} className="space-y-4 pt-1">
                <div className="space-y-2">
                  <Label htmlFor="password">Electronic Signature Password</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password to sign"
                    required
                    disabled={isSubmitting}
                  />
                  {error && (
                    <div className="flex items-center gap-1.5 text-sm text-destructive mt-1">
                      <XCircle className="h-4 w-4" />
                      <p>{error}</p>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="comments">Comments (optional)</Label>
                  <Textarea 
                    id="comments" 
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="Add any additional comments here..."
                    className="resize-none h-20"
                    disabled={isSubmitting}
                  />
                </div>
                
                <div className="pt-2">
                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium h-11"
                    disabled={!password || isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing Record...
                      </>
                    ) : (
                      <>
                        <Shield className="mr-2 h-4 w-4" />
                        Sign Record
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
