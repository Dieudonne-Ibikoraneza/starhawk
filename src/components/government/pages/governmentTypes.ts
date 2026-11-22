export interface LatLng {
  lat: number;
  lng: number;
}
export interface NdviCell {
  id: string;
  polygon: LatLng[];
  ndvi: number;
  color: string;
}
export interface ClaimPhoto {
  id: string;
  url: string;
  caption: string;
}
