import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { fetchPrivatePhotoBlob } from "@/services/usersAPI";

export const generatePolicyContractPDF = async (
  policy: any,
  user: any
) => {
  try {
    const doc = new jsPDF("p", "mm", "a4");
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();
    const M = 15;

    // --- Header ---
    doc.setFillColor(248, 250, 252); // Slate-50
    doc.rect(0, 0, W, 25, "F");
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(22, 101, 52); // Green-800
    doc.text("STARHAWK\u2122", M, 16);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("INSURANCE CONTRACT CERTIFICATE", W - M, 16, { align: "right" });
    
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.3);
    doc.line(0, 25, W, 25);

    let y = 35;

    // --- Title ---
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 30);
    doc.text("Certificate of Insurance", W / 2, y, { align: "center" });
    y += 10;
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text(
      `This document certifies that the insurance policy described below is in force as of ${format(new Date(), "PPP")}.`,
      W / 2,
      y,
      { align: "center" }
    );
    y += 15;

    // --- Summary Section (Two Columns) ---
    doc.setFillColor(240, 253, 244); // Green-50
    doc.rect(M, y, W - M * 2, 35, "F");
    doc.setDrawColor(187, 247, 208); // Green-200
    doc.rect(M, y, W - M * 2, 35, "S");

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 30);
    
    // Left Col
    doc.text("Policy ID:", M + 5, y + 8);
    doc.text("Status:", M + 5, y + 16);
    doc.text("Coverage Type:", M + 5, y + 24);
    
    doc.setFont("helvetica", "normal");
    doc.text(policy.policyNumber || "N/A", M + 35, y + 8);
    doc.text(policy.status || "N/A", M + 35, y + 16);
    doc.text(policy.coverageLevel || "Standard", M + 35, y + 24);

    // Right Col
    const rightColX = W / 2 + 10;
    doc.setFont("helvetica", "bold");
    doc.text("Start Date:", rightColX, y + 8);
    doc.text("End Date:", rightColX, y + 16);
    doc.text("Issue Date:", rightColX, y + 24);

    doc.setFont("helvetica", "normal");
    doc.text(policy.startDate ? format(new Date(policy.startDate), "PPP") : "TBD", rightColX + 25, y + 8);
    doc.text(policy.endDate ? format(new Date(policy.endDate), "PPP") : "TBD", rightColX + 25, y + 16);
    doc.text(policy.issuedAt || policy.createdAt ? format(new Date(policy.issuedAt || policy.createdAt), "PPP") : "TBD", rightColX + 25, y + 24);

    const getValidStr = (val: any) => (val && val !== "null" && val !== "undefined" ? String(val) : "");
    const farmerName = `${getValidStr(policy.farmerId?.firstName)} ${getValidStr(policy.farmerId?.lastName)}`.trim() || getValidStr(user?.name) || "N/A";
    const locationParts = [policy.farmerId?.village, policy.farmerId?.cell, policy.farmerId?.sector, policy.farmerId?.district, policy.farmerId?.province].filter(p => !!p);
    const farmLocation = getValidStr(policy.farmId?.locationName) || (locationParts.length > 0 ? locationParts.join(", ") : "N/A");
    const farmerContact = getValidStr(policy.farmerId?.email) || getValidStr(policy.farmerId?.phoneNumber) || getValidStr(user?.phoneNumber) || getValidStr(user?.email) || "N/A";
    const insuredCrop = getValidStr(policy.cropType) || getValidStr(policy.farmId?.cropType) || "N/A";
    const providerName = getValidStr(policy.insurerId?.insurerProfile?.companyName) || getValidStr(policy.insurerId?.companyName) || getValidStr(policy.insurer?.companyName) || (policy.insurerId?.firstName ? `${getValidStr(policy.insurerId?.firstName)} ${getValidStr(policy.insurerId?.lastName)}`.trim() : "") || "Verified Provider";
    const insuredFarm = getValidStr(policy.farmName) || getValidStr(policy.farm?.name) || getValidStr(policy.farmId?.name) || "Assigned Farm";

    // --- Involved Parties Table ---
    autoTable(doc, {
      startY: y,
      theme: 'grid',
      headStyles: { fillColor: [22, 101, 52], fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      head: [['Role', 'Details']],
      body: [
        ['Insurer (Provider)', providerName],
        ['Farmer (Policyholder)', farmerName],
        ['Contact (Farmer)', farmerContact],
        ['Insured Farm', insuredFarm],
        ['Farm Location', farmLocation],
        ['Insured Crop', insuredCrop],
      ],
      margin: { left: M, right: M }
    });

    y = (doc as any).lastAutoTable.finalY + 10;

    // --- Financials Table ---
    const fallbackCoverage = typeof policy.premiumAmount === 'number' ? (
      policy.coverageLevel === 'PREMIUM' ? policy.premiumAmount * 20 :
      policy.coverageLevel === 'STANDARD' ? policy.premiumAmount * 15 :
      policy.premiumAmount * 10
    ) : null;
    const coverage = policy.coverageAmount || fallbackCoverage;

    autoTable(doc, {
      startY: y,
      theme: 'grid',
      headStyles: { fillColor: [30, 64, 175], fontSize: 9 }, // Blue-800
      bodyStyles: { fontSize: 8 },
      head: [['Financial Details', 'Amount']],
      body: [
        ['Total Coverage Limit', coverage ? `RWF ${coverage.toLocaleString()}` : 'N/A'],
        ['Premium Paid', policy.premiumAmount ? `RWF ${policy.premiumAmount.toLocaleString()}` : 'N/A'],
      ],
      margin: { left: M, right: M }
    });

    y = (doc as any).lastAutoTable.finalY + 15;

    // --- Terms and Conditions ---
    if (policy.termsAndConditions) {
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 30, 30);
      doc.text("Terms and Conditions", M, y);
      y += 6;

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80, 80, 80);
      
      // Strip HTML tags for PDF while preserving basic formatting (paragraphs, breaks, lists)
      const strippedTerms = policy.termsAndConditions
        .replace(/<li>/ig, '• ')
        .replace(/<\/li>/ig, '\n')
        .replace(/<br\s*[\/]?>/ig, '\n')
        .replace(/<\/p>/ig, '\n\n')
        .replace(/<[^>]+>/g, '') // strip remaining tags
        .replace(/&nbsp;/g, ' ')
        .replace(/\n\s*\n\s*\n/g, '\n\n') // prevent huge gaps
        .trim();
      
      const lines = doc.splitTextToSize(strippedTerms, W - M * 2);
      
      // Pagination check
      if (y + lines.length * 4 > H - 40) {
        doc.addPage();
        y = M;
      }
      
      doc.text(lines, M, y);
      y += lines.length * 4 + 15;
    }

    // --- Signatures ---
    if (y + 50 > H - 20) {
      doc.addPage();
      y = M + 10;
    }

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 30);
    doc.text("Signatures", M, y);
    y += 8;

    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);

    // Insurer Signature Box
    doc.line(M, y + 25, M + 60, y + 25);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("Insurer Authorized Signature", M, y + 30);
    doc.text(providerName, M, y + 35);
    
    doc.setTextColor(0, 128, 0);
    doc.text("e-Signed System Verified", M, y + 20);
    doc.setTextColor(30, 30, 30);

    // Farmer Signature Box
    const farmerX = W - M - 60;
    if (user?.signatureUrl) {
      try {
        let imgUrl = user.signatureUrl;

        if (!imgUrl.startsWith('http') && !imgUrl.startsWith('data:')) {
          const blobUrl = await fetchPrivatePhotoBlob(user.signatureUrl);
          if (!blobUrl) throw new Error("Failed to fetch signature image from API");
          imgUrl = blobUrl;
        }
        
        const resp = await fetch(imgUrl);
        if (!resp.ok) throw new Error("Failed to fetch signature image");
        
        const blob = await resp.blob();
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        
        doc.addImage(base64, 'PNG', farmerX, y, 60, 24);
      } catch (err) {
        console.warn("Could not load farmer signature for PDF", err);
      }
    }
    
    doc.line(farmerX, y + 25, farmerX + 60, y + 25);
    doc.text("Farmer (Policyholder) Signature", farmerX, y + 30);
    doc.text(farmerName, farmerX, y + 35);

    // --- Footer ---
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(150, 150, 150);
      doc.text(`STARHAWK\u2122 Policy Contract \u00B7 ${policy.policyNumber || "N/A"}`, W / 2, H - 10, { align: "center" });
      doc.text(`Page ${i} of ${totalPages}`, W - M, H - 10, { align: "right" });
    }

    // Save PDF
    const fileName = `starhawk-policy-${policy.policyNumber || "contract"}.pdf`;
    doc.save(fileName);
    return true;

  } catch (error) {
    console.error("Failed to generate Policy PDF:", error);
    throw error;
  }
};
