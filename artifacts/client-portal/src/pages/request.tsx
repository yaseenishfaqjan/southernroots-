import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useClientRequestService } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Sparkles, Sprout } from "lucide-react";

const requestSchema = z.object({
  customerName: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  address: z.string().min(5, "Please enter your full address"),
  serviceType: z.string().min(1, "Please select a service type"),
  notes: z.string().optional(),
});

type RequestFormValues = z.infer<typeof requestSchema>;

export default function RequestService() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createJob = useClientRequestService();

  // Pre-select service from query param (e.g. ?service=Pressure+Washing)
  const params = new URLSearchParams(window.location.search);
  const preselectedService = params.get("service") || "";

  const form = useForm<RequestFormValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      customerName: "",
      phone: "",
      address: "",
      serviceType: preselectedService,
      notes: "",
    },
  });

  const onSubmit = (data: RequestFormValues) => {
    createJob.mutate(
      { data },
      {
        onSuccess: (job) => {
          toast({
            title: "Request Received!",
            description: `Your Job ID is #${job.id}. We'll call you to confirm the date and time.`,
          });
          setLocation(`/job/${job.id}`);
        },
        onError: () => {
          toast({
            title: "Error submitting request",
            description: "Please try again or call us at (678) 555-0199.",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8 space-y-6">
      <Link href="/">
        <Button variant="ghost" size="sm" className="gap-2 -ml-3 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Button>
      </Link>

      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Request Service</h1>
        <p className="text-muted-foreground text-lg">
          Fill out the form below and we'll schedule a crew to take care of your property.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Service Details</CardTitle>
          <CardDescription>Tell us about you and what you need done.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="customerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
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
                        <Input type="tel" placeholder="(678) 555-0100" {...field} />
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
                      <Input placeholder="123 Main St, Atlanta, GA 30301" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="serviceType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Required</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a service type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Lawn Mowing">
                          <div className="flex items-center gap-2">
                            <Sprout className="w-4 h-4 text-green-600" />
                            <span>Lawn Mowing</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="Pressure Washing">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-blue-500" />
                            <span>Pressure Washing</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="Hedge Trimming">
                          <div className="flex items-center gap-2">
                            <Sprout className="w-4 h-4 text-green-600" />
                            <span>Hedge Trimming</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="Full Landscape">
                          <div className="flex items-center gap-2">
                            <Sprout className="w-4 h-4 text-emerald-700" />
                            <span>Full Landscape Package</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any special instructions, gate codes, or areas to focus on?"
                        className="resize-none h-24"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Helpful details for our crew when they arrive.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full text-lg h-12"
                disabled={createJob.isPending}
              >
                {createJob.isPending ? "Submitting..." : "Submit Request"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
