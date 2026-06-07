import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  CreditCard,
  FileText,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Leaf,
  Calendar,
  Receipt,
} from "lucide-react";

interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Invoice {
  id: number;
  jobId: number;
  invoiceNumber: string;
  customerName: string;
  customerPhone: string;
  serviceType: string;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: string;
  notes?: string | null;
  createdAt: string;
  sentAt?: string | null;
  paidAt?: string | null;
  stripePaymentLinkUrl?: string | null;
}

async function fetchInvoice(id: number): Promise<Invoice> {
  const res = await fetch(`/api/invoices/${id}`);
  if (!res.ok) throw new Error("Invoice not found");
  return res.json() as Promise<Invoice>;
}

function fmt(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; classes: string }> = {
    draft: { label: "Draft", classes: "bg-gray-100 text-gray-700" },
    sent: { label: "Sent", classes: "bg-blue-100 text-blue-700" },
    paid: { label: "Paid", classes: "bg-green-100 text-green-700" },
    overdue: { label: "Overdue", classes: "bg-red-100 text-red-700" },
    void: { label: "Void", classes: "bg-gray-100 text-gray-500" },
  };
  const c = config[status] ?? { label: status, classes: "bg-gray-100 text-gray-700" };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${c.classes}`}>
      {c.label}
    </span>
  );
}

export default function InvoiceView() {
  const params = useParams<{ invoiceId: string }>();
  const invoiceId = parseInt(params.invoiceId ?? "0", 10);

  const { data: invoice, isLoading, isError } = useQuery({
    queryKey: ["invoice", invoiceId],
    queryFn: () => fetchInvoice(invoiceId),
    enabled: !isNaN(invoiceId) && invoiceId > 0,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-green-600 animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (isError || !invoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Invoice Not Found</h2>
          <p className="text-gray-500 text-sm mb-6">
            We couldn't find this invoice. Please check the link or contact us.
          </p>
          <Link href="/">
            <span className="inline-flex items-center gap-2 text-green-600 font-medium hover:underline">
              <ArrowLeft className="w-4 h-4" />
              Go back
            </span>
          </Link>
        </div>
      </div>
    );
  }

  const isPaid = invoice.status === "paid";
  const canPay = !isPaid && !!invoice.stripePaymentLinkUrl;

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Header */}
      <div className="bg-white border-b px-4 py-4 flex items-center gap-3">
        <Link href={`/job/${invoice.jobId}`}>
          <span className="p-2 -ml-2 rounded-full hover:bg-gray-100 flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <Leaf className="w-5 h-5 text-green-600" />
          <span className="font-semibold text-gray-900">Southern Roots Turf</span>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">

        {/* Paid success banner */}
        {isPaid && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-5 flex items-start gap-4">
            <CheckCircle2 className="w-8 h-8 text-green-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-green-800 text-lg">Paid — Thank you!</p>
              <p className="text-green-700 text-sm mt-0.5">
                Your payment was received.
                {invoice.paidAt && (
                  <> Paid on {new Date(invoice.paidAt).toLocaleDateString()}.</>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Invoice header card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-green-600 text-white px-6 py-5">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 opacity-80" />
                <span className="text-sm font-medium opacity-90">Invoice</span>
              </div>
              <StatusBadge status={invoice.status} />
            </div>
            <p className="text-2xl font-bold mt-2">{invoice.invoiceNumber}</p>
            <p className="text-green-100 text-sm mt-1">{invoice.serviceType}</p>
          </div>

          <div className="px-6 py-4 space-y-3">
            <div className="flex items-start justify-between text-sm">
              <span className="text-gray-500">Customer</span>
              <span className="font-medium text-gray-900 text-right">{invoice.customerName}</span>
            </div>
            <div className="flex items-start justify-between text-sm">
              <div className="flex items-center gap-1.5 text-gray-500">
                <Calendar className="w-3.5 h-3.5" />
                <span>Date</span>
              </div>
              <span className="font-medium text-gray-900">
                {new Date(invoice.createdAt).toLocaleDateString()}
              </span>
            </div>
            {invoice.notes && (
              <div className="text-sm">
                <span className="text-gray-500">Notes</span>
                <p className="mt-1 text-gray-700 bg-gray-50 rounded-lg px-3 py-2">{invoice.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Line items */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-gray-400" />
            <h3 className="font-semibold text-gray-900 text-sm">Itemized Summary</h3>
          </div>

          {invoice.lineItems.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {invoice.lineItems.map((item, i) => (
                <div key={i} className="px-6 py-3 flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium text-gray-800">{item.description}</p>
                    {item.quantity > 1 && (
                      <p className="text-gray-400 text-xs mt-0.5">
                        {item.quantity} × {fmt(item.unitPrice)}
                      </p>
                    )}
                  </div>
                  <span className="font-semibold text-gray-900">{fmt(item.total)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-6 py-4 flex items-center justify-between text-sm">
              <span className="text-gray-700">{invoice.serviceType}</span>
              <span className="font-semibold text-gray-900">{fmt(invoice.subtotal)}</span>
            </div>
          )}

          <div className="px-6 py-4 border-t border-gray-100 space-y-2">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span>{fmt(invoice.subtotal)}</span>
            </div>
            {invoice.tax > 0 && (
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Tax</span>
                <span>{fmt(invoice.tax)}</span>
              </div>
            )}
            <div className="flex items-center justify-between font-bold text-gray-900 text-base pt-2 border-t border-gray-100">
              <span>Total Due</span>
              <span className="text-green-700">{fmt(invoice.total)}</span>
            </div>
          </div>
        </div>

        {/* Pay button */}
        {canPay && (
          <a
            href={invoice.stripePaymentLinkUrl!}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-3 bg-green-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-green-700 active:scale-[0.98] transition-all shadow-md"
          >
            <CreditCard className="w-5 h-5" />
            Pay Now — {fmt(invoice.total)}
          </a>
        )}

        {isPaid && (
          <Link href="/">
            <span className="w-full flex items-center justify-center gap-2 border border-gray-200 bg-white text-gray-700 py-4 rounded-2xl font-medium hover:bg-gray-50 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </span>
          </Link>
        )}

        <p className="text-center text-xs text-gray-400">
          Questions? Call us at (678) 555-0199
        </p>
      </div>
    </div>
  );
}
