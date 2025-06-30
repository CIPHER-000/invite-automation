import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
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
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { type GoogleAccount } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Send, Calendar, Clock, Mail, User } from "lucide-react";

interface ManualTestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const testInviteSchema = z.object({
  prospectEmail: z.string().email("Please enter a valid email"),
  prospectName: z.string().min(1, "Name is required"),
  prospectCompany: z.string().optional(),
  eventTitle: z.string().min(1, "Event title is required"),
  eventDescription: z.string().min(1, "Event description is required"),
  eventDuration: z.number().min(15).max(240),
  selectedAccountId: z.number({ required_error: "Please select an inbox" }),
  startTime: z.string().min(1, "Start time is required"),
});

type TestInviteFormData = z.infer<typeof testInviteSchema>;

export function ManualTestDialog({ open, onOpenChange }: ManualTestDialogProps) {
  const { toast } = useToast();
  const [isScheduling, setIsScheduling] = useState(false);

  const form = useForm<TestInviteFormData>({
    resolver: zodResolver(testInviteSchema),
    defaultValues: {
      prospectEmail: "",
      prospectName: "",
      prospectCompany: "",
      eventTitle: "Quick Meeting",
      eventDescription: "Looking forward to our conversation!",
      eventDuration: 30,
      selectedAccountId: undefined,
      startTime: "",
    },
  });

  // Get available Google accounts
  const { data: accounts = [] } = useQuery<GoogleAccount[]>({
    queryKey: ["/api/accounts"],
  });

  const sendTestMutation = useMutation({
    mutationFn: async (data: TestInviteFormData) => {
      const response = await fetch("/api/invites/manual-test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to send test invite");
      }
      
      return response.json();
    },
    onSuccess: (response) => {
      toast({
        title: "Test invite sent!",
        description: `Calendar invitation sent successfully to ${form.getValues('prospectEmail')}`,
      });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send invite",
        description: error.message || "Unable to send test invite",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TestInviteFormData) => {
    setIsScheduling(true);
    sendTestMutation.mutate(data);
    setTimeout(() => setIsScheduling(false), 2000);
  };

  // Generate default start time (1 hour from now)
  const getDefaultStartTime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    now.setMinutes(0);
    return now.toISOString().slice(0, 16); // Format for datetime-local input
  };

  const selectedAccount = accounts.find(acc => acc.id === form.watch('selectedAccountId'));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Send Test Invite
          </DialogTitle>
          <DialogDescription>
            Compose and send a calendar invitation directly to test your setup.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* Prospect Information */}
            <div className="space-y-4">
              <Label className="text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                Prospect Details
              </Label>
              
              <FormField
                control={form.control}
                name="prospectEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input placeholder="prospect@company.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="prospectName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="prospectCompany"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Company Inc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Event Details */}
            <div className="space-y-4">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Event Details
              </Label>

              <FormField
                control={form.control}
                name="eventTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Meeting with John" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="eventDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Looking forward to our conversation!"
                        rows={3}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time</FormLabel>
                      <FormControl>
                        <Input 
                          type="datetime-local" 
                          {...field}
                          defaultValue={getDefaultStartTime()}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="eventDuration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (minutes)</FormLabel>
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
              </div>
            </div>

            {/* Inbox Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Select Sending Inbox
              </Label>
              
              {accounts.length === 0 ? (
                <div className="text-sm text-gray-500 p-4 border rounded-md bg-gray-50 dark:bg-gray-800">
                  No accounts available. Please add Gmail accounts in Account Setup first.
                </div>
              ) : (
                <FormField
                  control={form.control}
                  name="selectedAccountId"
                  render={({ field }) => (
                    <FormItem>
                      <Select onValueChange={(value) => field.onChange(parseInt(value))}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose an inbox to send from" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {accounts.map((account) => (
                            <SelectItem key={account.id} value={account.id.toString()}>
                              <div className="flex items-center gap-2">
                                <Mail className="h-3 w-3" />
                                {account.email}
                                {account.name && (
                                  <Badge variant="secondary" className="text-xs">
                                    {account.name}
                                  </Badge>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {selectedAccount && (
                <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-900/20 p-2 rounded-md">
                  <Mail className="h-3 w-3" />
                  Will send from: {selectedAccount.email}
                  {selectedAccount.name && ` (${selectedAccount.name})`}
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
                disabled={sendTestMutation.isPending || isScheduling || accounts.length === 0}
                className="flex-1"
              >
                {sendTestMutation.isPending || isScheduling ? (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 animate-spin" />
                    Sending...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Send className="h-4 w-4" />
                    Send Test Invite
                  </div>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}