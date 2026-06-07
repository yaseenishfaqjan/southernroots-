import { useState } from "react";
import { useLocation, Link } from "wouter";
import { brand } from "@workspace/brand";
import { useClientLookupJob } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Search, Sparkles, Sprout } from "lucide-react";

export default function Home() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const lookupJob = useClientLookupJob();

  const [phone, setPhone] = useState("");
  const [jobId, setJobId] = useState("");

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !jobId) {
      toast({
        title: "Missing Information",
        description: "Please enter both your phone number and job ID.",
        variant: "destructive",
      });
      return;
    }

    const numericJobId = parseInt(jobId, 10);
    if (isNaN(numericJobId)) {
      toast({
        title: "Invalid Job ID",
        description: "Job ID must be a number.",
        variant: "destructive",
      });
      return;
    }

    lookupJob.mutate(
      { data: { phone, jobId: numericJobId } },
      {
        onSuccess: (job) => {
          setLocation(`/job/${job.id}`);
        },
        onError: () => {
          toast({
            title: "Job not found",
            description: "We couldn't find a job with that phone number and ID. Check your confirmation text.",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <div className="flex-1 flex flex-col">
      <section className="bg-primary text-primary-foreground py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center space-y-6">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight">
            Track your landscape & pressure washing service
          </h1>
          <p className="text-lg sm:text-xl opacity-90 max-w-2xl mx-auto">
            Welcome to the {brand.name} Client Portal. Enter your details below to check the status of your current job, or request a new service.
          </p>
        </div>
      </section>

      <section className="flex-1 -mt-10 px-4 pb-16">
        <div className="container mx-auto max-w-xl">
          <Card className="shadow-xl border-0 shadow-black/5">
            <CardHeader className="space-y-1 text-center pb-8 pt-8">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Search className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-2xl">Look up your service</CardTitle>
              <CardDescription className="text-base">
                Enter your phone number and the Job ID provided in your confirmation text.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLookup} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="e.g., (678) 555-0101"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="h-12 text-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="jobId">Job ID</Label>
                    <Input
                      id="jobId"
                      type="text"
                      placeholder="e.g., 6"
                      value={jobId}
                      onChange={(e) => setJobId(e.target.value)}
                      className="h-12 text-lg"
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full h-12 text-lg font-medium"
                  disabled={lookupJob.isPending}
                >
                  {lookupJob.isPending ? "Looking up..." : "Check Status"}
                </Button>
              </form>

              <div className="mt-8 pt-6 border-t text-center space-y-4">
                <p className="text-muted-foreground text-sm">Need a new service?</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link href="/request?service=Lawn+Mowing">
                    <Button variant="outline" className="w-full sm:w-auto gap-2">
                      <Sprout className="w-4 h-4 text-green-600" />
                      Landscaping Request
                    </Button>
                  </Link>
                  <Link href="/request?service=Pressure+Washing">
                    <Button variant="outline" className="w-full sm:w-auto gap-2">
                      <Sparkles className="w-4 h-4 text-blue-500" />
                      Pressure Washing
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
