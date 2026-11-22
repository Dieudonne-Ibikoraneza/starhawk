import { GovAdministrativePage } from "./GovAdministrativePage";
export function GovSectorPage({
  sectorId,
  onBack,
  onRegionSelect,
  onFarmerSelect,
}: {
  sectorId: string;
  onBack: () => void;
  onRegionSelect?: (id: string) => void;
  onFarmerSelect?: (id: string) => void;
}) {
  return (
    <GovAdministrativePage
      regionId={sectorId}
      onBack={onBack}
      onRegionSelect={onRegionSelect}
      onFarmerSelect={onFarmerSelect}
    />
  );
}
