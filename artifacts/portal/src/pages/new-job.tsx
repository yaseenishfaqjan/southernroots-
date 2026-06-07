import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreateJob, getListJobsQueryKey, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const formSchema = z.object({
  customerName: z.string().min(2, "Name must be at least 2 characters."),
  phone: z.string().min(10, "Valid phone number required."),
  address: z.string().min(5, "Full address required."),
  serviceType: z.string().min(1, "Please select a service type."),
  planName: z.string().optional(),
  customerPrice: z.coerce.number().optional(),
  notes: z.string().optional(),
});

export default function NewJob() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createJob = useCreateJob();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerName: "",
      phone: "",
      address: "",
      serviceType: "",
      planName: "",
      notes: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    createJob.mutate({
      data: {
        ...values,
        customerPrice: values.customerPrice || null,
        planName: values.planName || null,
        notes: values.notes || null,
      }
    }, {
      onSuccess: () => {
        toast({
          title: "Lead Created",
          description: "The new job has been added to the board.",
        });
        queryClient.invalidateQueries({ queryKey: getListJobsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        setLocation("/jobs");
      },
      onError: (err: any) => {
        toast({
          title: "Error",
          description: err.message || "Failed to create lead.",
          variant: "destructive",
        });
      }
    });
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/jobs")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Lead</h1>
          <p className="text-sm text-gray-500">Enter details for a new customer job.</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium text-lg border-b pb-2">Customer Info</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="customerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="(555) 123-4567" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service Address</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Main St, City, ST 12345" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <h3 className="font-medium text-lg border-b pb-2">Job Details</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="serviceType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Service Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a service" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Pressure Washing">Pressure Washing</SelectItem>
                            <SelectItem value="Lawn Maintenance">Lawn Maintenance</SelectItem>
                            <SelectItem value="Landscaping">Landscaping</SelectItem>
                            <SelectItem value="Gutter Cleaning">Gutter Cleaning</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="planName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Plan Name (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Monthly Maintenance" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="customerPrice"
                  render={({ field }) => (
                    <FormItem className="md:w-1/2">
                      <FormLabel>Quoted Price ($)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" min="0" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormDescription>Leave blank if pricing is pending</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes for Dispatch/Sub</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Gate code, specific instructions, etc." 
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setLocation("/jobs")}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createJob.isPending}>
                  {createJob.isPending ? "Creating..." : "Create Lead"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}