import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { CreateCampaignDialog } from "@/components/campaigns/create-campaign-dialog";
import logoPath from "@assets/shady5_no_bg_cropped_strict_1751311214067.png";

interface HeaderProps {
  title: string;
  subtitle?: string;
  showCreateButton?: boolean;
}

export function Header({ title, subtitle, showCreateButton = false }: HeaderProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  return (
    <>
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <img 
              src={logoPath} 
              alt="Logo" 
              className="h-16 w-auto"
            />
            <div>
              <h2 className="text-2xl font-semibold text-slate-800">{title}</h2>
              {subtitle && (
                <p className="text-slate-600 mt-1">{subtitle}</p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
              <span className="text-sm text-slate-600">System Active</span>
            </div>
            {showCreateButton && (
              <Button 
                onClick={() => setShowCreateDialog(true)}
                className="bg-primary text-white hover:bg-primary/90"
              >
                <Plus className="mr-2" size={16} />
                New Campaign
              </Button>
            )}
          </div>
        </div>
      </header>

      <CreateCampaignDialog 
        open={showCreateDialog} 
        onOpenChange={setShowCreateDialog} 
      />
    </>
  );
}
