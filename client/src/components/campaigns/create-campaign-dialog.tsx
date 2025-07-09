import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { insertCampaignSchema, type GoogleAccount } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Upload, FileText, Users, Mail } from "lucide-react";

interface CreateCampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Updated schema for CSV data instead of sheet URL
const campaignSchema = z.object({
  name: z.string().min(1, "Campaign name is required"),
  description: z.string().optional(),
  csvData: z.array(z.record(z.string())).min(1, "CSV data is required"),
  eventTitleTemplate: z.string().min(1, "Event title template is required"),
  eventDescriptionTemplate: z.string().min(1, "Event description template is required"),
  confirmationEmailTemplate: z.string().min(1, "Confirmation email template is required"),
  senderName: z.string().optional(),
  eventDuration: z.number().min(15).max(240),
  timeZone: z.string(),
  selectedInboxes: z.array(z.number()).min(1, "At least one inbox must be selected"),
  status: z.string(),
  isActive: z.boolean(),
});

type CampaignFormData = z.infer<typeof campaignSchema>;

export function CreateCampaignDialog({ open, onOpenChange }: CreateCampaignDialogProps) {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<Record<string, string>[]>([]);
  const [csvPreview, setCsvPreview] = useState<Record<string, string>[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      name: "",
      description: "",
      csvData: [],
      eventTitleTemplate: "Meeting with {{name}}",
      eventDescriptionTemplate: "Hi {{name}}, I'm {{sender_name}} and I'm looking forward to our meeting!",
      confirmationEmailTemplate: "Thanks for accepting our meeting invitation!",
      senderName: "",
      eventDuration: 30,
      timeZone: "UTC",
      selectedInboxes: [],
      status: "active",
      isActive: true,
    },
  });

  // Get available Google accounts for inbox selection
  const { data: accounts = [] } = useQuery<GoogleAccount[]>({
    queryKey: ["/api/accounts"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: CampaignFormData) => {
      const response = await fetch("/api/campaigns", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create campaign");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Campaign created",
        description: "Your campaign has been created successfully.",
      });
      onOpenChange(false);
      form.reset();
      setCsvFile(null);
      setCsvData([]);
      setCsvPreview([]);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create campaign",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast({
        title: "Invalid file",
        description: "Please upload a CSV file",
        variant: "destructive",
      });
      return;
    }

    setCsvFile(file);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        toast({
          title: "Invalid CSV",
          description: "CSV must have at least a header row and one data row",
          variant: "destructive",
        });
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/['"]/g, ''));
      const rows = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/['"]/g, ''));
        const row: Record<string, string> = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        return row;
      }).filter(row => Object.values(row).some(val => val.trim() !== ''));

      setCsvData(rows);
      setCsvPreview(rows.slice(0, 3)); // Show first 3 rows for preview
      form.setValue('csvData', rows);
      
      toast({
        title: "CSV uploaded",
        description: `Loaded ${rows.length} prospects from CSV`,
      });
    };
    reader.readAsText(file);
  };

  const onSubmit = (data: CampaignFormData) => {
    if (csvData.length === 0) {
      toast({
        title: "No CSV data",
        description: "Please upload a CSV file with prospect data",
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate({
      ...data,
      csvData: csvData,
    });
  };

  const toggleInbox = (accountId: number) => {
    const current = form.getValues('selectedInboxes');
    const updated = current.includes(accountId)
      ? current.filter(id => id !== accountId)
      : [...current, accountId];
    form.setValue('selectedInboxes', updated);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create New Campaign
          </DialogTitle>
          <DialogDescription>
            Upload a CSV file with prospect data and configure your campaign settings.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Campaign Details */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Campaign Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Q1 Outreach Campaign" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Brief description of this campaign..." 
                        rows={2}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="senderName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sender Name (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="John Smith" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Personalize your outreach with {"{{sender_name}}"} variable in templates. Defaults to account name if empty.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* CSV Upload */}
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Upload Prospects CSV</Label>
                <div className="mt-2">
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-4 text-gray-500" />
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Click to upload</span> your CSV file
                        </p>
                        <p className="text-xs text-gray-500">CSV files only</p>
                      </div>
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                  {csvFile && (
                    <div className="mt-2 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-600">{csvFile.name}</span>
                      <Badge variant="secondary">{csvData.length} prospects</Badge>
                    </div>
                  )}
                </div>
              </div>

              {/* CSV Preview */}
              {csvPreview.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">CSV Preview (first 3 rows)</Label>
                  <div className="border rounded-md p-3 bg-gray-50 dark:bg-gray-800">
                    <div className="text-xs space-y-1 max-h-32 overflow-y-auto">
                      {csvPreview.map((row, index) => (
                        <div key={index} className="flex gap-4">
                          {Object.entries(row).map(([key, value]) => (
                            <span key={key} className="min-w-0">
                              <strong>{key}:</strong> {value}
                            </span>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Email Templates */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="eventTitleTemplate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Title Template</FormLabel>
                    <FormControl>
                      <Input placeholder="Meeting with {{name}}" {...field} />
                    </FormControl>
                    <FormDescription>
                      Use merge fields like {"{{name}}"}, {"{{company}}"}, {"{{sender_name}}"}, {"{{email}}"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="eventDescriptionTemplate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Description Template</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Hi {{name}}, looking forward to our meeting!"
                        rows={3}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmationEmailTemplate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmation Email Template</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Thanks for accepting our meeting invitation!"
                        rows={2}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Campaign Settings */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="eventDuration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Duration (minutes)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="15" 
                        max="240" 
                        {...field} 
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="timeZone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time Zone</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select timezone" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="America/New_York">Eastern Time</SelectItem>
                        <SelectItem value="America/Chicago">Central Time</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                        <SelectItem value="Europe/London">London</SelectItem>
                        <SelectItem value="Europe/Paris">Paris</SelectItem>
                        <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Inbox Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Select Sending Inboxes
              </Label>
              {accounts.length === 0 ? (
                <div className="text-sm text-gray-500 p-4 border rounded-md bg-gray-50 dark:bg-gray-800">
                  <Users className="h-4 w-4 inline mr-2" />
                  No accounts available. Please add Gmail accounts in Account Setup first.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                  {accounts.map((account) => (
                    <div key={account.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`account-${account.id}`}
                        checked={form.watch('selectedInboxes').includes(account.id)}
                        onCheckedChange={() => toggleInbox(account.id)}
                      />
                      <Label
                        htmlFor={`account-${account.id}`}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Mail className="h-3 w-3" />
                        {account.email}
                        {account.name && (
                          <Badge variant="secondary" className="text-xs">
                            {account.name}
                          </Badge>
                        )}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
              {form.watch('selectedInboxes').length > 0 && (
                <div className="text-sm text-green-600">
                  {form.watch('selectedInboxes').length} inbox(es) selected
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || csvData.length === 0 || form.watch('selectedInboxes').length === 0}
                className="flex-1"
              >
                {createMutation.isPending ? "Creating..." : "Create Campaign"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}