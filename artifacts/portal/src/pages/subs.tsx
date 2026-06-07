import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  useListSubcontractors, 
  getListSubcontractorsQueryKey, 
  useCreateSubcontractor,
  useDeleteSubcontractor,
  getGetDashboardSummaryQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Phone, UserPlus, Search, Trash2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  phone: z.string().min(10, "Valid phone number required."),
  specialty: z.string().min(2, "Specialty is required."),
  notes: z.string().optional(),
});

export default function Subs() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);

  const { data: subs, isLoading } = useListSubcontractors({
    query: { queryKey: getListSubcontractorsQueryKey() }
  });
  const createSub = useCreateSubcontractor();
  const deleteSub = useDeleteSubcontractor();

  const filteredSubs = subs?.filter(sub => 
    sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sub.specialty.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      phone: "",
      specialty: "",
      notes: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    createSub.mutate({
      data: {
        ...values,
        notes: values.notes || null,
      }
    }, {
      onSuccess: () => {
        toast({ title: "Subcontractor Added", description: `${values.name} has been added to your roster.` });
        queryClient.invalidateQueries({ queryKey: getListSubcontractorsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        setIsAddOpen(false);
        form.reset();
      },
      onError: (err: any) => {
        toast({ title: "Error", description: err.message || "Failed to add subcontractor.", variant: "destructive" });
      }
    });
  }

  function handleDelete(id: number, name: string) {
    deleteSub.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Removed", description: `${name} has been removed from roster.` });
        queryClient.invalidateQueries({ queryKey: getListSubcontractorsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
      },
      onError: (err: any) => {
        toast({ title: "Error", description: err.message || "Failed to delete. They might have active jobs.", variant: "destructive" });
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subcontractors</h1>
          <p className="text-sm text-gray-500">Manage your roster of service providers.</p>
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Subcontractor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add Subcontractor</DialogTitle>
              <DialogDescription>
                Add a new service provider to assign jobs to.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name or Business Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Smith Landscaping" {...field} />
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
                <FormField
                  control={form.control}
                  name="specialty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Specialty</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Pressure Washing" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Internal Notes</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Equipment they have, reliability, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={createSub.isPending}>
                    {createSub.isPending ? "Adding..." : "Add to Roster"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-md mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Search by name or specialty..." 
          className="pl-9 bg-white"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6 space-y-3">
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-full mt-4" />
              </CardContent>
            </Card>
          ))
        ) : filteredSubs && filteredSubs.length > 0 ? (
          filteredSubs.map(sub => (
            <Card key={sub.id} className="flex flex-col">
              <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
                <div>
                  <CardTitle className="text-lg">{sub.name}</CardTitle>
                  <p className="text-sm text-primary font-medium mt-1">{sub.specialty}</p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive h-8 w-8 -mr-2 -mt-2">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove {sub.name}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will remove them from your roster. You cannot delete a subcontractor that has active or historical jobs assigned to them.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => handleDelete(sub.id, sub.name)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Remove
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardHeader>
              <CardContent className="pt-0 flex-1 flex flex-col">
                <div className="flex items-center text-sm text-muted-foreground mb-4">
                  <Phone className="h-4 w-4 mr-2" />
                  {sub.phone}
                </div>
                {sub.notes && (
                  <div className="mt-auto bg-muted/50 p-3 rounded text-sm text-muted-foreground border">
                    {sub.notes}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12 bg-white rounded-lg border border-dashed">
            <UserPlus className="mx-auto h-12 w-12 text-muted-foreground opacity-20" />
            <h3 className="mt-4 text-lg font-medium text-foreground">No subcontractors found</h3>
            <p className="mt-1 text-muted-foreground">Add a sub to your roster to start dispatching jobs.</p>
          </div>
        )}
      </div>
    </div>
  );
}