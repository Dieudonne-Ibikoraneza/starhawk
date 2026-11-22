import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ShieldCheck,
  XCircle,
  CheckCircle2,
  FileText,
  ZoomOut,
  ZoomIn,
  Printer,
  Download,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/government/gov-widgets";
import {
  createSubsidyInvoice,
  getSubsidyInvoice,
  recordSubsidyPayment,
  rejectSubsidyInvoice,
  type SubsidyInvoice,
} from "@/services/governmentApi";
import { date, label, money, governmentDate } from "./governmentFormat";
import {
  invoiceBreakdown,
  invoiceNumber,
  downloadSubsidyPdf,
} from "./governmentInvoice";
export function GovInvoicePage({
  invoice,
  regionId,
  onBack,
  onUpdated,
}: {
  invoice: SubsidyInvoice;
  regionId: string;
  onBack: () => void;
  onUpdated?: (invoice: SubsidyInvoice) => void;
}) {
  const [record, setRecord] = useState(invoice),
    [zoom, setZoom] = useState(1),
    [dialogKind, setDialogKind] = useState<"payment" | "reject">("payment"),
    [dialogOpen, setDialogOpen] = useState(false),
    [paymentReference, setPaymentReference] = useState(""),
    [paidAt, setPaidAt] = useState(governmentDate()),
    [reason, setReason] = useState(""),
    [documentError, setDocumentError] = useState("");
  const paper = useRef<HTMLDivElement>(null),
    client = useQueryClient();
  const query = useQuery({
    queryKey: ["government", "subsidy-invoice", regionId, record.id],
    queryFn: () => getSubsidyInvoice(regionId, record.id),
    enabled: record.status !== "NOT_ISSUED",
    initialData: record.status === "NOT_ISSUED" ? undefined : record,
    refetchInterval: 30000,
  });
  const current = query.data ?? record;
  const update = async (next: SubsidyInvoice) => {
    setRecord(next);
    client.setQueryData(
      ["government", "subsidy-invoice", regionId, next.id],
      next,
    );
    onUpdated?.(next);
    setDialogOpen(false);
    await client.invalidateQueries({
      predicate: (q) =>
        q.queryKey[0] === "government" &&
        ["subsidy-invoices", "overview", "season"].includes(
          String(q.queryKey[1]),
        ),
    });
  };
  const prepare = useMutation({
    mutationFn: () =>
      createSubsidyInvoice(regionId, current.insurerId, current.season),
    onSuccess: update,
  });
  const review = useMutation({
    mutationFn: () =>
      dialogKind === "payment"
        ? recordSubsidyPayment(regionId, current.id, paymentReference, paidAt)
        : rejectSubsidyInvoice(regionId, current.id, reason),
    onSuccess: update,
    onError: () => {
      void query.refetch();
    },
  });
  const breakdown = invoiceBreakdown(current);
  const print = () => {
    const popup = window.open("", "_blank", "width=900,height=1100");
    if (!popup) {
      setDocumentError("Allow the print window, then try again.");
      return;
    }
    popup.opener = null;
    popup.document.write(
      `<!doctype html><html><head><title>${invoiceNumber(current)}</title><style>body{font-family:Arial,sans-serif;padding:32px;color:#111827}table{width:100%;border-collapse:collapse}td,th{padding:10px;text-align:left;border-bottom:1px solid #ddd}.invoice-paper{zoom:1!important;width:100%!important}h1{font-size:24px}</style></head><body>${paper.current?.innerHTML ?? ""}</body></html>`,
    );
    popup.document.close();
    popup.focus();
    setTimeout(() => popup.print(), 150);
  };
  const download = async () => {
    try {
      setDocumentError("");
      await downloadSubsidyPdf(current);
    } catch {
      setDocumentError(
        "The PDF could not be generated. Try downloading it again.",
      );
    }
  };
  return (
    <div className="min-w-0 space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="flex items-start gap-4 md:items-center">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Back to subsidies"
            onClick={onBack}
            className="mt-1 shrink-0 md:mt-0"
          >
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </Button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="truncate text-xl font-bold tracking-tight md:text-2xl">
                Invoice {invoiceNumber(current)}
              </h1>
              <StatusBadge
                status={
                  current.status === "NOT_ISSUED"
                    ? "Not issued"
                    : current.overdue
                      ? "Overdue"
                      : label(current.status)
                }
              />
            </div>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              <span>
                {current.insurerName} ·{" "}
                {current.issuedAt
                  ? `Prepared ${date(current.issuedAt)}`
                  : "Calculated from unbilled issued policies"}
              </span>
            </p>
          </div>
        </div>
        <div className="flex w-full items-center gap-3 md:w-auto">
          <Button
            variant="outline"
            className="flex-1 gap-2 md:flex-none"
            disabled={current.status !== "PENDING" || review.isPending}
            onClick={() => {
              review.reset();
              setDialogKind("reject");
              setDialogOpen(true);
            }}
          >
            <XCircle className="h-4 w-4" />
            Reject
          </Button>
          <Button
            className="flex-1 gap-2 md:flex-none"
            disabled={
              prepare.isPending ||
              review.isPending ||
              ["PAID", "REJECTED"].includes(current.status) ||
              (current.status === "PENDING" && current.subsidyAmount <= 0)
            }
            onClick={() =>
              current.status === "NOT_ISSUED"
                ? prepare.mutate()
                : (review.reset(),
                  setDialogKind("payment"),
                  setDialogOpen(true))
            }
          >
            {prepare.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            <span>
              {prepare.isPending
                ? "Preparing…"
                : current.status === "NOT_ISSUED"
                  ? "Prepare Invoice"
                  : current.status === "PAID"
                    ? "Already Paid"
                    : current.status === "REJECTED"
                      ? "Rejected"
                      : "Process Payment"}
            </span>
          </Button>
        </div>
      </div>
      {(prepare.error || query.error) && (
        <p role="alert" className="text-sm text-red-600">
          {prepare.error?.message ?? query.error?.message}
        </p>
      )}
      <div className="grid min-w-0 items-start gap-6 lg:grid-cols-12">
        <div className="min-w-0 space-y-6 lg:col-span-5">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold">Payment Overview</h3>
            <div className="space-y-4">
              <OverviewRow name="Total Insured Premium">
                {money(current.premiumTotal)}
              </OverviewRow>
              <OverviewRow name="Government Subsidy Rate">
                <span className="text-blue-600">
                  {Math.round(current.subsidyRate * 100)}%
                </span>
              </OverviewRow>
              <OverviewRow name="Due Date">
                <span className="text-red-600">
                  {current.dueAt ? date(current.dueAt) : "Not issued"}
                </span>
              </OverviewRow>
              <div className="-mx-6 flex flex-wrap items-center justify-between gap-2 border-y border-emerald-100 bg-emerald-50 px-6 py-3">
                <span className="font-semibold text-emerald-800">
                  Total Subsidy Payment
                </span>
                <span className="font-mono text-xl font-bold text-emerald-700">
                  {money(current.subsidyAmount)}
                </span>
              </div>
              <OverviewRow name="Payment Method">
                Recorded bank transfer
              </OverviewRow>
              {current.paymentReference && (
                <OverviewRow name="Transfer reference">
                  {current.paymentReference}
                </OverviewRow>
              )}
              {current.rejectionReason && (
                <p className="text-sm text-red-600">
                  Rejection reason: {current.rejectionReason}
                </p>
              )}
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold">
              Cost Breakdown by Crop
            </h3>
            <div className="relative max-w-full overflow-x-auto rounded-xl border border-gray-100">
              <table className="w-full min-w-[380px] text-left text-sm">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-4 py-3 font-medium text-gray-500">
                      Crop / Category
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500">
                      Farms
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500">
                      Subsidy Allocation
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {breakdown.map((item) => (
                    <tr key={item.crop}>
                      <td className="px-4 py-3 font-medium">
                        {label(item.crop)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        {item.farms}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-mono">
                        {money(item.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="flex h-[500px] min-w-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-[#525659] shadow-inner lg:col-span-7 lg:h-[800px]">
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-[#1f2122] bg-[#323639] p-2 text-gray-300 shadow-sm">
            <div className="flex min-w-0 items-center gap-2">
              <FileText className="h-4 w-4 shrink-0" />
              <span className="max-w-[170px] truncate text-xs">
                {invoiceNumber(current)}_invoice.pdf
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Zoom out invoice"
                className="h-8 w-8 hover:bg-white/10 hover:text-white"
                disabled={zoom <= 0.5}
                onClick={() => setZoom((v) => Math.max(0.5, v - 0.25))}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span
                aria-label="Invoice zoom"
                className="w-10 text-center text-xs"
              >
                {Math.round(zoom * 100)}%
              </span>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Zoom in invoice"
                className="h-8 w-8 hover:bg-white/10 hover:text-white"
                disabled={zoom >= 2}
                onClick={() => setZoom((v) => Math.min(2, v + 0.25))}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Print invoice"
                className="h-8 w-8 hover:bg-white/10 hover:text-white"
                onClick={print}
              >
                <Printer className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Download invoice PDF"
                className="h-8 w-8 hover:bg-white/10 hover:text-white"
                onClick={download}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-auto p-4 md:p-8">
            <div
              ref={paper}
              style={{ zoom }}
              className="invoice-paper mx-auto min-w-[380px] max-w-[800px] bg-white p-6 text-[11px] text-gray-800 shadow-2xl"
            >
              <div className="mb-8 border-b pb-4">
                <p className="text-xl font-bold text-indigo-700">STARHAWK</p>
                <p className="mt-1 text-xs text-gray-500">
                  Government premium contribution statement
                </p>
              </div>
              <h2 className="mb-6 text-lg font-bold">
                {invoiceNumber(current)}
              </h2>
              <dl className="mb-6 grid grid-cols-2 gap-3">
                <div>
                  <dt className="text-gray-500">Insurer</dt>
                  <dd>{current.insurerName}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Period</dt>
                  <dd>{current.season}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Prepared</dt>
                  <dd>
                    {current.issuedAt
                      ? date(current.issuedAt)
                      : "Draft — not issued"}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Status</dt>
                  <dd>{label(current.status)}</dd>
                </div>
              </dl>
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b">
                    <th className="py-2">Policy</th>
                    <th className="py-2">Crop</th>
                    <th className="py-2 text-right">Premium</th>
                    <th className="py-2 text-right">Gov. share</th>
                  </tr>
                </thead>
                <tbody>
                  {current.lines.map((line) => (
                    <tr key={line.policyId} className="border-b">
                      <td className="py-2">{line.policyNumber}</td>
                      <td className="py-2">{label(line.crop)}</td>
                      <td className="py-2 text-right">
                        {line.premium.toLocaleString()}
                      </td>
                      <td className="py-2 text-right">
                        {line.subsidy.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-5 text-right font-bold">
                Total government contribution: {money(current.subsidyAmount)}
              </p>
              <p className="mt-12 border-t pt-4 text-[10px] text-gray-500">
                Calculated from recorded policy premiums at{" "}
                {current.subsidyRate * 100}%.{" "}
                {current.status === "PAID"
                  ? `Recorded transfer: ${current.paymentReference}.`
                  : "No payment has been recorded."}
              </p>
            </div>
          </div>
        </div>
      </div>
      {documentError && (
        <p role="alert" className="text-sm text-red-600">
          {documentError}
        </p>
      )}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open && !review.isPending) setDialogOpen(false);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {dialogKind === "payment"
                ? "Record completed bank transfer"
                : "Reject invoice"}
            </DialogTitle>
            <DialogDescription>
              {dialogKind === "payment"
                ? "Record a transfer already completed through your bank. This action updates the invoice record and does not send money."
                : "Provide the reason this premium contribution invoice cannot be accepted."}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              review.mutate();
            }}
            className="space-y-4"
          >
            {dialogKind === "payment" ? (
              <>
                <label className="block space-y-1 text-sm">
                  <span>Bank-transfer reference</span>
                  <Input
                    required
                    minLength={3}
                    maxLength={128}
                    value={paymentReference}
                    onChange={(event) =>
                      setPaymentReference(event.target.value)
                    }
                  />
                </label>
                <label className="block space-y-1 text-sm">
                  <span>Payment date</span>
                  <Input
                    type="date"
                    required
                    max={governmentDate()}
                    value={paidAt}
                    onChange={(event) => setPaidAt(event.target.value)}
                  />
                </label>
              </>
            ) : (
              <label className="block space-y-1 text-sm">
                <span>Rejection reason</span>
                <textarea
                  required
                  minLength={3}
                  maxLength={1000}
                  className="min-h-24 w-full rounded-md border border-gray-200 p-3"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                />
              </label>
            )}
            {review.error && (
              <p role="alert" className="text-sm text-red-600">
                {review.error.message}
              </p>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={review.isPending}
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={review.isPending}>
                {review.isPending
                  ? "Saving…"
                  : dialogKind === "payment"
                    ? "Record payment"
                    : "Reject invoice"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
function OverviewRow({
  name,
  children,
}: {
  name: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 py-2">
      <span className="text-gray-500">{name}</span>
      <span className="break-all font-mono font-medium">{children}</span>
    </div>
  );
}
