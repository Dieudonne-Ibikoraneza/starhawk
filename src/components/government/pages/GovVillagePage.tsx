import { GovAdministrativePage } from "./GovAdministrativePage";
export function GovVillagePage({
  villageId,
  onBack,
  onRegionSelect,
  onFarmerSelect,
}: {
  villageId: string;
  onBack: () => void;
  onRegionSelect?: (id: string) => void;
  onFarmerSelect?: (id: string) => void;
}) {
  return (
    <GovAdministrativePage
      regionId={villageId}
      onBack={onBack}
      onRegionSelect={onRegionSelect}
      onFarmerSelect={onFarmerSelect}
    />
  );
}
