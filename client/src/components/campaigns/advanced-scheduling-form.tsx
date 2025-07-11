import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Calendar, Clock, MapPin, Settings } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// Common timezones
const TIMEZONES = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Phoenix", label: "Arizona Time (MST)" },
  { value: "America/Anchorage", label: "Alaska Time (AKST)" },
  { value: "Pacific/Honolulu", label: "Hawaii Time (HST)" },
  { value: "UTC", label: "UTC (Coordinated Universal Time)" },
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Paris", label: "Paris (CET/CEST)" },
  { value: "Europe/Berlin", label: "Berlin (CET/CEST)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Asia/Shanghai", label: "Shanghai (CST)" },
  { value: "Asia/Kolkata", label: "India (IST)" },
  { value: "Australia/Sydney", label: "Sydney (AEST/AEDT)" },
];

const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday", short: "Sun" },
  { value: 1, label: "Monday", short: "Mon" },
  { value: 2, label: "Tuesday", short: "Tue" },
  { value: 3, label: "Wednesday", short: "Wed" },
  { value: 4, label: "Thursday", short: "Thu" },
  { value: 5, label: "Friday", short: "Fri" },
  { value: 6, label: "Saturday", short: "Sat" },
];

const advancedSchedulingSchema = z.object({
  dateRangeStart: z.string().min(1, "Start date is required"),
  dateRangeEnd: z.string().min(1, "End date is required"),
  selectedDaysOfWeek: z.array(z.number()).min(1, "Select at least one day"),
  timeWindowStart: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM format"),
  timeWindowEnd: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM format"),
  schedulingTimezone: z.string().min(1, "Timezone is required"),
}).refine((data) => {
  const startDate = new Date(data.dateRangeStart);
  const endDate = new Date(data.dateRangeEnd);
  return startDate <= endDate;
}, {
  message: "End date must be after start date",
  path: ["dateRangeEnd"],
}).refine((data) => {
  const [startHour, startMin] = data.timeWindowStart.split(':').map(Number);
  const [endHour, endMin] = data.timeWindowEnd.split(':').map(Number);
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  return startMinutes < endMinutes;
}, {
  message: "End time must be after start time",
  path: ["timeWindowEnd"],
});

export type AdvancedSchedulingFormData = z.infer<typeof advancedSchedulingSchema>;

interface AdvancedSchedulingFormProps {
  initialData?: Partial<AdvancedSchedulingFormData>;
  totalProspects: number;
  onValidate: (data: AdvancedSchedulingFormData) => Promise<{ valid: boolean; availableSlots?: number; errors?: string[] }>;
  onChange: (data: AdvancedSchedulingFormData) => void;
}

export function AdvancedSchedulingForm({ 
  initialData, 
  totalProspects, 
  onValidate, 
  onChange 
}: AdvancedSchedulingFormProps) {
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    availableSlots?: number;
    errors?: string[];
  } | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const form = useForm<AdvancedSchedulingFormData>({
    resolver: zodResolver(advancedSchedulingSchema),
    defaultValues: {
      dateRangeStart: initialData?.dateRangeStart || "",
      dateRangeEnd: initialData?.dateRangeEnd || "",
      selectedDaysOfWeek: initialData?.selectedDaysOfWeek || [1, 2, 3, 4, 5], // Mon-Fri
      timeWindowStart: initialData?.timeWindowStart || "09:00",
      timeWindowEnd: initialData?.timeWindowEnd || "17:00",
      schedulingTimezone: initialData?.schedulingTimezone || "America/New_York",
    },
  });

  const formData = form.watch();

  // Auto-validate when form data changes
  useEffect(() => {
    const validateConfig = async () => {
      if (
        formData.dateRangeStart &&
        formData.dateRangeEnd &&
        formData.selectedDaysOfWeek.length > 0 &&
        formData.timeWindowStart &&
        formData.timeWindowEnd &&
        formData.schedulingTimezone
      ) {
        setIsValidating(true);
        try {
          const result = await onValidate(formData);
          setValidationResult(result);
          onChange(formData);
        } catch (error) {
          setValidationResult({
            valid: false,
            errors: ["Failed to validate configuration"]
          });
        } finally {
          setIsValidating(false);
        }
      }
    };

    const timer = setTimeout(validateConfig, 500); // Debounce validation
    return () => clearTimeout(timer);
  }, [formData, onValidate, onChange]);

  const handleDayToggle = (dayValue: number) => {
    const currentDays = form.getValues("selectedDaysOfWeek");
    const newDays = currentDays.includes(dayValue)
      ? currentDays.filter(d => d !== dayValue)
      : [...currentDays, dayValue].sort();
    form.setValue("selectedDaysOfWeek", newDays);
  };

  const selectedTimezone = TIMEZONES.find(tz => tz.value === formData.schedulingTimezone);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Advanced Scheduling Configuration
        </CardTitle>
        <CardDescription>
          Configure when calendar invites should be sent with randomized time slots
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Form {...form}>
          {/* Date Range */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4" />
              <Label className="text-sm font-medium">Date Range</Label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dateRangeStart"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dateRangeEnd"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        min={formData.dateRangeStart || new Date().toISOString().split('T')[0]}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <Separator />

          {/* Days of Week */}
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="selectedDaysOfWeek"
              render={() => (
                <FormItem>
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4" />
                    <FormLabel>Days of the Week</FormLabel>
                  </div>
                  <FormDescription>
                    Select which days invites can be sent
                  </FormDescription>
                  <div className="grid grid-cols-7 gap-2">
                    {DAYS_OF_WEEK.map((day) => (
                      <div key={day.value} className="flex flex-col items-center">
                        <Checkbox
                          id={`day-${day.value}`}
                          checked={formData.selectedDaysOfWeek.includes(day.value)}
                          onCheckedChange={() => handleDayToggle(day.value)}
                        />
                        <Label
                          htmlFor={`day-${day.value}`}
                          className="text-xs text-center mt-1 cursor-pointer"
                        >
                          {day.short}
                        </Label>
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Separator />

          {/* Time Window */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4" />
              <Label className="text-sm font-medium">Time Window</Label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="timeWindowStart"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time</FormLabel>
                    <FormControl>
                      <Input
                        type="time"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="timeWindowEnd"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time</FormLabel>
                    <FormControl>
                      <Input
                        type="time"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <Separator />

          {/* Timezone */}
          <FormField
            control={form.control}
            name="schedulingTimezone"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4" />
                  <FormLabel>Timezone</FormLabel>
                </div>
                <FormDescription>
                  All scheduling will be done in this timezone
                </FormDescription>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {TIMEZONES.map((timezone) => (
                      <SelectItem key={timezone.value} value={timezone.value}>
                        {timezone.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </Form>

        <Separator />

        {/* Validation Results */}
        <div className="space-y-4">
          <Label className="text-sm font-medium">Validation Results</Label>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm font-medium">Prospects to Schedule</div>
              <div className="text-2xl font-bold text-blue-600">{totalProspects}</div>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm font-medium">Available Slots</div>
              <div className="text-2xl font-bold text-green-600">
                {isValidating ? "..." : validationResult?.availableSlots || 0}
              </div>
            </div>
          </div>

          {validationResult && (
            <div className="space-y-2">
              {validationResult.valid ? (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  ✓ Configuration Valid - {validationResult.availableSlots} slots available
                </Badge>
              ) : (
                <div className="space-y-2">
                  <Badge variant="destructive">
                    ✗ Configuration Invalid
                  </Badge>
                  {validationResult.errors?.map((error, index) => (
                    <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                      {error}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {selectedTimezone && (
            <div className="text-xs text-muted-foreground">
              Selected timezone: {selectedTimezone.label}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}