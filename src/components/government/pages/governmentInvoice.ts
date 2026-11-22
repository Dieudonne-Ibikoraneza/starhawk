import type { SubsidyInvoice } from "@/services/governmentApi";
import { label } from "./governmentFormat";
export function invoiceNumber(invoice: SubsidyInvoice) {
  return invoice.status === "NOT_ISSUED"
    ? "DRAFT"
    : `INV-${invoice.id.slice(-8).toUpperCase()}`;
}
export function invoiceBreakdown(invoice: SubsidyInvoice) {
  const groups = new Map<string, { farms: Set<string>; amount: number }>();
  for (const line of invoice.lines) {
    const key = line.crop ?? "OTHER",
      group = groups.get(key) ?? { farms: new Set<string>(), amount: 0 };
    group.farms.add(line.farmId);
    group.amount += line.subsidy;
    groups.set(key, group);
  }
  return [...groups].map(([crop, row]) => ({
    crop,
    farms: row.farms.size,
    amount: row.amount,
  }));
}
export async function downloadSubsidyPdf(invoice: SubsidyInvoice) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  const doc = new jsPDF();
  doc.setFontSize(20);
  doc.text("STARHAWK", 14, 20);
  doc.setFontSize(11);
  doc.text("Government premium contribution statement", 14, 29);
  doc.text(`${invoiceNumber(invoice)} | ${invoice.season}`, 14, 40);
  doc.text(`Insurer: ${invoice.insurerName}`, 14, 48);
  autoTable(doc, {
    startY: 58,
    head: [["Policy", "Crop", "Premium (RWF)", "Government share (RWF)"]],
    body: invoice.lines.map((line) => [
      line.policyNumber,
      label(line.crop),
      line.premium.toLocaleString(),
      line.subsidy.toLocaleString(),
    ]),
    foot: [
      [
        "Total",
        "",
        invoice.premiumTotal.toLocaleString(),
        invoice.subsidyAmount.toLocaleString(),
      ],
    ],
    styles: { fontSize: 9 },
    headStyles: { fillColor: [79, 70, 229] },
  });
  doc.save(
    `${invoiceNumber(invoice)}-${invoice.season.replace(/ /g, "-")}.pdf`,
  );
}
