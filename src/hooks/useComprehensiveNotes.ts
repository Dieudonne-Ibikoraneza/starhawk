import { useState, useCallback, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import assessmentsApiService from "@/services/assessmentsApi";

interface UseComprehensiveNotesProps {
  assessmentId?: string;
  initialNotes?: string;
}

export const useComprehensiveNotes = ({
  assessmentId,
  initialNotes = "",
}: UseComprehensiveNotesProps) => {
  const { toast } = useToast();
  const [comprehensiveNotes, setComprehensiveNotes] = useState(
    initialNotes || "",
  );
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize notes when initialNotes changes (e.g., when assessment data loads)
  useEffect(() => {
    setComprehensiveNotes(initialNotes || "");
    setHasChanges(false);
  }, [initialNotes]);

  // Save notes to backend
  const saveNotes = useCallback(async () => {
    if (!assessmentId) {
      toast({
        title: "Error",
        description: "No assessment ID provided",
        variant: "destructive",
      });
      return false;
    }

    if (!hasChanges) {
      return true;
    }

    setIsSaving(true);
    try {
      await assessmentsApiService.updateAssessment(assessmentId, {
        comprehensiveNotes,
      });
      setLastSaved(new Date());
      setHasChanges(false);
      toast({
        title: "Success",
        description: "Notes saved successfully",
      });
      return true;
    } catch (error: any) {
      console.error("Failed to save notes:", error);
      const errorMessage = error.message || "Failed to save notes";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [assessmentId, comprehensiveNotes, hasChanges, toast]);

  // Handle notes change
  const handleNotesChange = useCallback(
    (value: string) => {
      setComprehensiveNotes(value);
      setHasChanges(value !== (initialNotes || ""));
    },
    [initialNotes],
  );

  // Generate report
  const generateReport = useCallback(async () => {
    if (!assessmentId) {
      toast({
        title: "Error",
        description: "No assessment ID provided",
        variant: "destructive",
      });
      return;
    }

    // First save any pending changes
    if (hasChanges) {
      const saved = await saveNotes();
      if (!saved) {
        return; // Don't proceed if save failed
      }
    }

    try {
      const report = await assessmentsApiService.generateReport(assessmentId);
      toast({
        title: "Success",
        description: "Report generated successfully",
      });
      return report;
    } catch (error: any) {
      console.error("Failed to generate report:", error);
      const errorMessage = error.message || "Failed to generate report";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    }
  }, [assessmentId, hasChanges, saveNotes, toast]);

  // Check if user can generate report
  const canGenerateReport = Boolean(assessmentId && comprehensiveNotes.trim());

  return {
    comprehensiveNotes,
    setComprehensiveNotes: handleNotesChange,
    saveNotes,
    generateReport,
    isSaving,
    lastSaved,
    hasChanges,
    canGenerateReport,
  };
};
