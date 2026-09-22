"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { UpgradeModalProps } from "@/utils/types";
import PricingCards from "@/components/ui/pricing-component";

const UpgradeModel = ({
  isOpen,
  onClose,
}: UpgradeModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        overlayClassName="bg-black/30 backdrop-blur-xs dark:bg-black/50"
        className="max-h-[95vh] w-full overflow-y-auto border-none bg-transparent p-2 shadow-none sm:max-w-4xl sm:p-4"
      >
        <DialogTitle className="sr-only">Upgrade to Pro</DialogTitle>
        <DialogDescription className="sr-only">
          Choose a plan to upgrade your account
        </DialogDescription>

        {/* Pricing Cards only */}
        <div className="w-full">
          <PricingCards hideHeading onSubscriptionComplete={onClose} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UpgradeModel;
