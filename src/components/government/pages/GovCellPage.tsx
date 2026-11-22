import { GovAdministrativePage } from "./GovAdministrativePage";
export function GovCellPage({
  cellId,
  onBack,
  onRegionSelect,
  onFarmerSelect,
}: {
  cellId: string;
  onBack: () => void;
  onRegionSelect?: (id: string) => void;
  onFarmerSelect?: (id: string) => void;
}) {
  return (
    <GovAdministrativePage
      regionId={cellId}
      onBack={onBack}
      onRegionSelect={onRegionSelect}
      onFarmerSelect={onFarmerSelect}
    />
  );
}
