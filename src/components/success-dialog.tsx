"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, ExternalLink, Copy } from "lucide-react";
import Link from "next/link";

interface SuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string;
  transactionId: string;
}

export function SuccessDialog({
  open,
  onOpenChange,
  campaignId,
  transactionId,
}: SuccessDialogProps) {
  const handleCopyTxId = () => {
    if (transactionId) {
      navigator.clipboard.writeText(transactionId);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="flex flex-col items-center justify-center text-center pt-4">
          <div className="bg-green-100 p-3 rounded-full mb-4">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <DialogTitle className="text-2xl font-bold tracking-tight">
            Campaign Created!
          </DialogTitle>
          <DialogDescription className="text-lg mt-2">
            Your campaign has been successfully launched on Solana blockchain.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col space-y-4 py-4">
          <div className="flex flex-col space-y-2 bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div className="text-sm text-slate-500">Campaign ID</div>
            <div className="font-medium break-all">{campaignId}</div>
          </div>

          <div className="flex flex-col space-y-2 bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div className="text-sm text-slate-500">Transaction Signature</div>
            <div className="font-medium flex items-center justify-between">
              <span className="truncate mr-2">
                {transactionId &&
                  `${transactionId.substring(0, 8)}...${transactionId.substring(
                    transactionId.length - 8
                  )}`}
              </span>
              <Button variant="ghost" size="sm" onClick={handleCopyTxId}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="flex sm:flex-row flex-col gap-3 sm:gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Close
          </Button>

          <Button asChild className="flex-1 gap-2">
            <Link
              href={`https://explorer.solana.com/tx/${transactionId}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
            >
              View on Explorer
              <ExternalLink className="h-4 w-4" />
            </Link>
          </Button>

          <Button asChild className="flex-1 gap-2">
            <Link href="/campaigns">View Your Campaigns</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
