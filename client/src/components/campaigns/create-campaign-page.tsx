import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { insertCampaignSchema, type GoogleAccount } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { 
  Plus, 
  Upload, 
  FileText, 
  Users, 
  Mail, 
  Calendar, 
  Clock,
  Settings,
  Target,
  MessageSquare,
  MapPin,
  ArrowLeft,
  Save,
  Eye
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { AdvancedSchedulingForm, type AdvancedSchedulingFormData } from "./advanced-scheduling-form";
import { SubjectLinePreview } from "./subject-line-preview";

const campaignFormSchema = insertCampaignSchema.extend({
  selectedInboxes: z.array(z.number()).min(1, "Select at least one inbox"),
  csvFile: z.any().optional(),
});

type CampaignFormData = z.infer<typeof campaignFormSchema>;

export default function CreateCampaignPage() {
  const [, navigate] = useLocation();
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [schedulingMode, setSchedulingMode] = useState<"immediate" | "advanced">("immediate");
  const [advancedSchedulingData, setAdvancedSchedulingData] = useState<AdvancedSchedulingFormData | null>(null);
  const [activeTab, setActiveTab] = useState("basic");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch Google accounts for inbox selection
  const { data: accounts = [] } = useQuery({
    queryKey: ["/api/accounts"],
    queryFn: async () => {
      const response = await fetch("/api/accounts");
      return response.json();
    },
  });

  const form = useForm<CampaignFormData>({
    resolver: zodResolver(campaignFormSchema),
    defaultValues: {
      name: "",
      description: "",
      eventTitleTemplate: "Meeting with {{name}}",
      eventDescriptionTemplate: "Hi {{name}}, looking forward to our meeting to discuss how we can help {{company}}!",
      confirmationEmailTemplate: "Thanks {{name}} for accepting our meeting invitation! We're excited to speak with you.",
      senderName: "",
      subjectLine: "",
      timeZone: "America/New_York",
      eventDuration: 30,
      maxInvitesPerInbox: 20,
      maxDailyCampaignInvites: 100,
      selectedInboxes: [],
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CampaignFormData) => {
      const formData = new FormData();
      
      // Add campaign data
      Object.entries(data).forEach(([key, value]) => {
        if (key === 'selectedInboxes') {
          formData.append(key, JSON.stringify(value));
        } else if (key !== 'csvFile' && value !== null && value !== undefined) {
          formData.append(key, value.toString());
        }
      });

      // Add scheduling data if advanced mode
      if (schedulingMode === "advanced" && advancedSchedulingData) {
        formData.append('schedulingMode', 'advanced');
        formData.append('advancedScheduling', JSON.stringify(advancedSchedulingData));
      } else {
        formData.append('schedulingMode', 'immediate');
      }

      // Add CSV file
      if (csvFile) {
        formData.append('csvFile', csvFile);
      }

      return apiRequest('/api/campaigns', {
        method: 'POST',
        body: formData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      toast({
        title: "Campaign created",
        description: "Your campaign has been created successfully and is now active.",
      });
      navigate("/campaigns");
    },
    onError: (error: any) => {
      console.error("Create campaign error:", error);
      toast({
        title: "Failed to create campaign",
        description: error.message || "An error occurred while creating the campaign.",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setCsvFile(file);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        toast({
          title: "Invalid CSV",
          description: "CSV file must have at least a header row and one data row.",
          variant: "destructive",
        });
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim());
      const data = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        return row;
      });

      setCsvData(data);
    };
    
    reader.readAsText(file);
  };

  const toggleInbox = (inboxId: number) => {
    const current = form.getValues('selectedInboxes');
    const updated = current.includes(inboxId)
      ? current.filter(id => id !== inboxId)
      : [...current, inboxId];
    form.setValue('selectedInboxes', updated);
  };

  const handleAdvancedSchedulingChange = (data: AdvancedSchedulingFormData) => {
    setAdvancedSchedulingData(data);
  };

  const handleAdvancedSchedulingValidation = (isValid: boolean) => {
    // Handle validation state if needed
  };

  const onSubmit = (data: CampaignFormData) => {
    if (!csvFile) {
      toast({
        title: "CSV Required",
        description: "Please upload a CSV file with prospect data.",
        variant: "destructive",
      });
      return;
    }

    if (schedulingMode === "advanced" && !advancedSchedulingData) {
      toast({
        title: "Scheduling Required",
        description: "Please complete the advanced scheduling configuration.",
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate(data);
  };

  const canProceedToNext = (tab: string) => {
    switch (tab) {
      case "basic":
        return form.watch("name") && form.watch("description");
      case "prospects":
        return csvFile && csvData.length > 0;
      case "messaging":
        return form.watch("eventTitleTemplate") && form.watch("eventDescriptionTemplate");
      case "scheduling":
        return schedulingMode === "immediate" || advancedSchedulingData;
      case "inboxes":
        return form.watch("selectedInboxes").length > 0;
      default:
        return true;
    }
  };

  const getNextTab = (currentTab: string) => {
    const tabs = ["basic", "prospects", "messaging", "scheduling", "inboxes", "review"];
    const currentIndex = tabs.indexOf(currentTab);
    return tabs[currentIndex + 1] || tabs[tabs.length - 1];
  };

  const getPrevTab = (currentTab: string) => {
    const tabs = ["basic", "prospects", "messaging", "scheduling", "inboxes", "review"];
    const currentIndex = tabs.indexOf(currentTab);
    return tabs[currentIndex - 1] || tabs[0];
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/campaigns")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Campaigns
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create New Campaign</h1>
            <p className="text-muted-foreground">
              Set up a new calendar invite campaign with automated prospect outreach
            </p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="basic" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Basic Info
                </TabsTrigger>
                <TabsTrigger value="prospects" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Prospects
                </TabsTrigger>
                <TabsTrigger value="messaging" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Messaging
                </TabsTrigger>
                <TabsTrigger value="scheduling" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Scheduling
                </TabsTrigger>
                <TabsTrigger value="inboxes" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Inboxes
                </TabsTrigger>
                <TabsTrigger value="review" className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Review
                </TabsTrigger>
              </TabsList>

              {/* Basic Information */}
              <TabsContent value="basic" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Campaign Information
                    </CardTitle>
                    <CardDescription>
                      Set up the basic details for your campaign
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
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
                      name="senderName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sender Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Your Name" {...field} />
                          </FormControl>
                          <FormDescription>
                            This name will be used in merge fields like {"{{sender_name}}"}
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

                    <div className="flex justify-end">
                      <Button
                        type="button"
                        onClick={() => setActiveTab("prospects")}
                        disabled={!canProceedToNext("basic")}
                      >
                        Next: Prospects
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Prospects */}
              <TabsContent value="prospects" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Prospect Data
                    </CardTitle>
                    <CardDescription>
                      Upload your prospect list as a CSV file
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
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
                          <div className="mt-4 p-4 border rounded-lg bg-green-50 dark:bg-green-900/20">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-green-600" />
                              <span className="text-sm text-green-600 font-medium">{csvFile.name}</span>
                              <Badge variant="secondary">{csvData.length} prospects</Badge>
                            </div>
                            {csvData.length > 0 && (
                              <div className="mt-2 text-xs text-gray-600">
                                Columns: {Object.keys(csvData[0]).join(", ")}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setActiveTab("basic")}
                      >
                        Previous: Basic Info
                      </Button>
                      <Button
                        type="button"
                        onClick={() => setActiveTab("messaging")}
                        disabled={!canProceedToNext("prospects")}
                      >
                        Next: Messaging
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Messaging */}
              <TabsContent value="messaging" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      Email Templates
                    </CardTitle>
                    <CardDescription>
                      Customize the messages sent to your prospects
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="subjectLine"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Subject Line (Optional)</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Hi from {{sender_name}}"
                              maxLength={100}
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Use merge fields: {"{{name}}"}, {"{{company}}"}, {"{{sender_name}}"}, {"{{email}}"}. 
                            Defaults to "Hi from {"{{sender_name}}"}" if empty.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <SubjectLinePreview 
                      template={form.watch("subjectLine") || "Hi from {{sender_name}}"}
                      senderName={form.watch("senderName") || "Your Name"}
                    />

                    <Separator />

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

                    <div className="flex justify-between">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setActiveTab("prospects")}
                      >
                        Previous: Prospects
                      </Button>
                      <Button
                        type="button"
                        onClick={() => setActiveTab("scheduling")}
                        disabled={!canProceedToNext("messaging")}
                      >
                        Next: Scheduling
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Scheduling */}
              <TabsContent value="scheduling" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Scheduling Configuration
                    </CardTitle>
                    <CardDescription>
                      Choose when and how invites should be sent
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <Label className="text-sm font-medium">Scheduling Mode</Label>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="immediate"
                            value="immediate"
                            checked={schedulingMode === "immediate"}
                            onChange={(e) => setSchedulingMode(e.target.value as "immediate" | "advanced")}
                            className="h-4 w-4"
                          />
                          <Label htmlFor="immediate" className="cursor-pointer">
                            Immediate - Start sending invites right away
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="advanced"
                            value="advanced"
                            checked={schedulingMode === "advanced"}
                            onChange={(e) => setSchedulingMode(e.target.value as "immediate" | "advanced")}
                            className="h-4 w-4"
                          />
                          <Label htmlFor="advanced" className="cursor-pointer">
                            Advanced - Configure specific date ranges and time windows
                          </Label>
                        </div>
                      </div>
                    </div>

                    {schedulingMode === "advanced" && (
                      <div className="border rounded-lg p-4">
                        <AdvancedSchedulingForm
                          totalProspects={csvData.length}
                          onValidate={handleAdvancedSchedulingValidation}
                          onChange={handleAdvancedSchedulingChange}
                          initialData={advancedSchedulingData || undefined}
                        />
                      </div>
                    )}

                    <Separator />

                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <h4 className="text-sm font-medium">Rate Limiting Controls</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="maxInvitesPerInbox"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Max Invites Per Inbox/Day</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="1" 
                                  max="50" 
                                  placeholder="20"
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
                          name="maxDailyCampaignInvites"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Max Daily Campaign Invites</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="1" 
                                  max="1000" 
                                  placeholder="100"
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

                    <div className="flex justify-between">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setActiveTab("messaging")}
                      >
                        Previous: Messaging
                      </Button>
                      <Button
                        type="button"
                        onClick={() => setActiveTab("inboxes")}
                        disabled={!canProceedToNext("scheduling")}
                      >
                        Next: Inboxes
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Inboxes */}
              <TabsContent value="inboxes" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="h-5 w-5" />
                      Sending Inboxes
                    </CardTitle>
                    <CardDescription>
                      Select which email accounts will send the invites
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {accounts.length === 0 ? (
                      <div className="text-center p-8 border rounded-lg bg-gray-50 dark:bg-gray-800">
                        <Mail className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <h3 className="text-lg font-medium mb-2">No Email Accounts</h3>
                        <p className="text-sm text-gray-500 mb-4">
                          You need to set up email accounts before creating a campaign.
                        </p>
                        <Button 
                          onClick={() => navigate("/inbox-setup")}
                          className="flex items-center gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Add Email Account
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-3">
                          {accounts.map((account: GoogleAccount) => (
                            <div key={account.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                              <Checkbox
                                id={`account-${account.id}`}
                                checked={form.watch('selectedInboxes').includes(account.id)}
                                onCheckedChange={() => toggleInbox(account.id)}
                              />
                              <div className="flex-1 flex items-center gap-3">
                                <Mail className="h-4 w-4 text-gray-500" />
                                <div>
                                  <div className="font-medium">{account.email}</div>
                                  {account.name && (
                                    <div className="text-sm text-gray-500">{account.name}</div>
                                  )}
                                </div>
                                {account.name && (
                                  <Badge variant="secondary" className="text-xs">
                                    {account.name}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        {form.watch('selectedInboxes').length > 0 && (
                          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <div className="text-sm text-green-600 font-medium">
                              {form.watch('selectedInboxes').length} inbox(es) selected
                            </div>
                            <div className="text-xs text-green-600 mt-1">
                              Invites will be distributed across these accounts
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex justify-between">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setActiveTab("scheduling")}
                      >
                        Previous: Scheduling
                      </Button>
                      <Button
                        type="button"
                        onClick={() => setActiveTab("review")}
                        disabled={!canProceedToNext("inboxes")}
                      >
                        Next: Review
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Review */}
              <TabsContent value="review" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="h-5 w-5" />
                      Review & Create Campaign
                    </CardTitle>
                    <CardDescription>
                      Review your campaign settings before creating
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Campaign Name</Label>
                          <div className="text-sm">{form.watch("name") || "Not set"}</div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Description</Label>
                          <div className="text-sm">{form.watch("description") || "Not set"}</div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Sender Name</Label>
                          <div className="text-sm">{form.watch("senderName") || "Not set"}</div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Prospects</Label>
                          <div className="text-sm">{csvData.length} prospects uploaded</div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Event Duration</Label>
                          <div className="text-sm">{form.watch("eventDuration")} minutes</div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Time Zone</Label>
                          <div className="text-sm">{form.watch("timeZone")}</div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Scheduling Mode</Label>
                          <div className="text-sm capitalize">{schedulingMode}</div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Selected Inboxes</Label>
                          <div className="text-sm">{form.watch("selectedInboxes").length} inboxes</div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex justify-between">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setActiveTab("inboxes")}
                      >
                        Previous: Inboxes
                      </Button>
                      <Button
                        type="submit"
                        disabled={createMutation.isPending}
                        className="flex items-center gap-2"
                      >
                        <Save className="h-4 w-4" />
                        {createMutation.isPending ? "Creating..." : "Create Campaign"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </form>
        </Form>
      </div>
    </div>
  );
}