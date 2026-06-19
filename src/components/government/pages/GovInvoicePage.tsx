import { ArrowLeft, CheckCircle2, Download, FileText, Printer, ShieldCheck, XCircle, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/government/gov-widgets";
import { rwf, type InvoiceRow } from "@/components/government/gov-data";

export function GovInvoicePage({
  invoice,
  onBack,
}: {
  invoice: InvoiceRow;
  onBack: () => void;
}) {
  return (
    <div className="flex flex-col space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start md:items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0 mt-1 md:mt-0">
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          </Button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground truncate">Invoice {invoice.id}</h1>
              <StatusBadge status={invoice.status} />
            </div>
            <p className="text-sm md:text-base text-muted-foreground flex flex-wrap items-center gap-2 mt-1">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              <span className="truncate">Issued by {invoice.insurer} on {invoice.issued}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto pl-14 md:pl-0">
          <Button variant="outline" className="gap-2 flex-1 md:flex-none">
            <XCircle className="h-4 w-4" /> Reject
          </Button>
          <Button className="gap-2 flex-1 md:flex-none" disabled={invoice.status === "Paid"}>
            <CheckCircle2 className="h-4 w-4" /> 
            <span className="truncate">{invoice.status === "Paid" ? "Already Paid" : "Process Payment"}</span>
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Descriptive Data & Breakdown */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="font-semibold text-lg mb-4">Payment Overview</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-500">Total Insured Premium</span>
                <span className="font-mono font-medium">{rwf(invoice.totalPremium || 0)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-500">Government Subsidy Rate</span>
                <span className="font-mono font-medium text-blue-600">{(invoice.subsidyRate || 0) * 100}%</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-500">Due Date</span>
                <span className="font-medium text-red-600">{invoice.dueDate || "N/A"}</span>
              </div>
              <div className="flex justify-between items-center py-3 bg-emerald-50 -mx-6 px-6 border-y border-emerald-100">
                <span className="font-semibold text-emerald-800">Total Subsidy Payment</span>
                <span className="font-mono text-xl font-bold text-emerald-700">{rwf(invoice.subsidyAmount)}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-gray-500 text-sm">Payment Method</span>
                <span className="text-sm font-medium">{invoice.paymentMethod || "Bank Transfer"}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              Cost Breakdown by Crop
            </h3>
            <div className="overflow-hidden rounded-xl border border-gray-100">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-4 py-3 font-medium text-gray-500">Crop / Category</th>
                    <th className="px-4 py-3 font-medium text-gray-500 text-right">Farms</th>
                    <th className="px-4 py-3 font-medium text-gray-500 text-right">Subsidy Allocation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(invoice.breakdown || []).map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">{item.category}</td>
                      <td className="px-4 py-3 text-right font-mono text-gray-600">{item.farms.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-mono font-medium text-gray-900">{rwf(item.amount)}</td>
                    </tr>
                  ))}
                  {(!invoice.breakdown || invoice.breakdown.length === 0) && (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-gray-500 italic">No breakdown data available.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right Side: PDF Viewer */}
        <div className="lg:col-span-7 rounded-2xl border border-gray-200 bg-[#525659] shadow-inner overflow-hidden flex flex-col h-[500px] lg:h-[800px]">
          {/* PDF Toolbar */}
          <div className="bg-[#323639] border-b border-[#1f2122] p-2 flex items-center justify-between text-gray-300 shadow-sm shrink-0">
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-300 hover:text-white hover:bg-white/10">
                <FileText className="h-4 w-4" />
              </Button>
              <div className="h-4 w-px bg-gray-600 mx-2" />
              <span className="text-xs font-medium truncate max-w-[200px]">{invoice.id}_invoice_document.pdf</span>
            </div>
            
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-300 hover:text-white hover:bg-white/10">
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-xs font-medium w-12 text-center">100%</span>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-300 hover:text-white hover:bg-white/10">
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-300 hover:text-white hover:bg-white/10">
                <Printer className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-300 hover:text-white hover:bg-white/10">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Document Container */}
          <div className="flex-1 overflow-auto p-4 md:p-8 flex items-start justify-center custom-scrollbar">
            {invoice.pdfUrl ? (
              <img 
                src={invoice.pdfUrl} 
                alt="Invoice PDF Document" 
                className="w-full max-w-[800px] bg-white shadow-2xl shadow-black/50 ring-1 ring-black/10"
              />
            ) : (
              <div className="w-full max-w-[800px] aspect-[1/1.4] bg-white shadow-2xl flex items-center justify-center text-gray-400">
                <FileText className="h-16 w-16 opacity-20" />
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
