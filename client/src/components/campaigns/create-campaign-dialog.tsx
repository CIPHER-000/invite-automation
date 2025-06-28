import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const createCampaignSchema = z.object({
  name: z.string().min(1, "Campaign name is required"),
  description: z.string().optional(),
  sheetUrl: z.string().url("Must be a valid Google Sheets URL"),
  sheetRange: z.string().default("A:Z"),
  eventTitleTemplate: z.string().min(1, "Event title template is required"),
  eventDescriptionTemplate: z.string().min(1, "Event description template is required"),
  confirmationEmailTemplate: z.string().min(1, "Confirmation email template is required"),
  eventDuration: z.number().min(15).max(480).default(30),
  timeZone: z.string().default("UTC"),
});

type CreateCampaignForm = z.infer<typeof createCampaignSchema>;

interface CreateCampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateCampaignDialog({ open, onOpenChange }: CreateCampaignDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CreateCampaignForm>({
    resolver: zodResolver(createCampaignSchema),
    defaultValues: {
      name: "",
      description: "",
      sheetUrl: "",
      sheetRange: "A:Z",
      eventTitleTemplate: "Demo Call with {{name}} from {{company}}",
      eventDescriptionTemplate: "Hi {{name}},\n\nLooking forward to our demo call to discuss how our solution can help {{company}}.\n\nBest regards",
      confirmationEmailTemplate: "Hi {{name}},\n\nThank you for accepting our calendar invitation! We're excited to connect with you and {{company}}.\n\nWe'll send you a reminder closer to the date.\n\nBest regards",
      eventDuration: 30,
      timeZone: "UTC",
    },
  });

  const createMutation = useMutation({
    mutationFn: api.createCampaign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Campaign created",
        description: "Your campaign has been created successfully.",
      });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create campaign",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateCampaignForm) => {
    createMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Campaign</DialogTitle>
          <DialogDescription>
            Set up a new calendar invite campaign with Google Sheets integration.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Campaign Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Q1 Product Demo Campaign" {...field} />
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
                      placeholder="Brief description of this campaign"
                      className="h-24"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sheetUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Google Sheet URL</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://docs.google.com/spreadsheets/d/..."
                      type="url"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Make sure the sheet is shared with your Google accounts
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="eventTitleTemplate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Title Template</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Demo Call with {{name}} from {{company}}"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Use {`{{fieldName}}`} for merge fields from your sheet
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
                      placeholder="Hi {{name}}, looking forward to our demo call..."
                      className="h-32"
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
                      placeholder="Thank you for accepting our invitation..."
                      className="h-32"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    This email will be sent when someone accepts the calendar invite
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="eventDuration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Duration (minutes)</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select duration" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">60 minutes</SelectItem>
                        <SelectItem value="90">90 minutes</SelectItem>
                        <SelectItem value="120">2 hours</SelectItem>
                      </SelectContent>
                    </Select>
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
                        <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                        <SelectItem value="America/New_York">Eastern Time</SelectItem>
                        <SelectItem value="America/Chicago">Central Time</SelectItem>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="Europe/London">GMT</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending}
                className="bg-primary text-white hover:bg-primary/90"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Campaign"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
