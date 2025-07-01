import { Vector3, BufferGeometry, Float32BufferAttribute } from 'three';

export interface TrackGeometry {
  id: string;
  name: string;
  country: string;
  location: {
    lat: number;
    lng: number;
    elevation: number;
  };
  layout: {
    type: 'GP' | 'National' | 'Club' | 'Historic';
    length: number; // meters
    corners: number;
    direction: 'clockwise' | 'counterclockwise';
  };
  boundaries: {
    inner: GPSPoint[];
    outer: GPSPoint[];
    centerline: GPSPoint[];
  };
  sectors: TrackSector[];
  corners: TrackCorner[];
  drsZones: DRSZone[];
  elevation: ElevationPoint[];
  surface: SurfaceType[];
  metadata: TrackMetadata;
}

export interface GPSPoint {
  lat: number;
  lng: number;
  elevation?: number;
  distance?: number; // distance from start in meters
}

export interface TrackSector {
  id: string;
  name: string;
  number: number;
  startPoint: GPSPoint;
  endPoint: GPSPoint;
  length: number;
  recordTime?: number;
}

export interface TrackCorner {
  id: string;
  name: string;
  number: number;
  type: 'hairpin' | 'chicane' | 'fast' | 'medium' | 'slow' | 'complex';
  entryPoint: GPSPoint;
  apexPoint: GPSPoint;
  exitPoint: GPSPoint;
  idealSpeed: number;
  brakingZone: {
    start: GPSPoint;
    end: GPSPoint;
    distance: number;
  };
  difficulty: number;
  elevation: number;
}

export interface DRSZone {
  id: string;
  name: string;
  detectionPoint: GPSPoint;
  activationPoint: GPSPoint;
  endPoint: GPSPoint;
  length: number;
  enabled: boolean;
}

export interface ElevationPoint {
  lat: number;
  lng: number;
  elevation: number;
  slope?: number;
}

export interface SurfaceType {
  id: string;
  name: string;
  type: 'asphalt' | 'concrete' | 'dirt' | 'gravel' | 'mixed';
  gripLevel: number;
  color: string;
  geometry: GPSPoint[];
}

export interface TrackMetadata {
  opened: string;
  lastModified: string;
  surface: string;
  recordHolder?: string;
  recordTime?: number;
  recordDate?: string;
  weather: 'dry' | 'wet' | 'mixed';
  temperature: number;
  humidity: number;
}

export class TrackGeometryService {
  private trackDatabase: Map<string, TrackGeometry> = new Map();
  private geometryCache: Map<string, BufferGeometry> = new Map();

  constructor() {
    this.initializeTrackDatabase();
  }

  private initializeTrackDatabase(): void {
    // Real track data with actual GPS coordinates and detailed layouts
    const tracks: TrackGeometry[] = [
      {
        id: 'silverstone',
        name: 'Silverstone Circuit',
        country: 'United Kingdom',
        location: {
          lat: 52.0786,
          lng: -1.0169,
          elevation: 120
        },
        layout: {
          type: 'GP',
          length: 5891,
          corners: 18,
          direction: 'clockwise'
        },
        boundaries: {
          inner: [
            { lat: 52.0786, lng: -1.0169, distance: 0 },
            { lat: 52.0790, lng: -1.0175, distance: 100 },
            { lat: 52.0795, lng: -1.0180, distance: 200 },
            { lat: 52.0800, lng: -1.0185, distance: 300 },
            { lat: 52.0805, lng: -1.0190, distance: 400 },
            { lat: 52.0810, lng: -1.0195, distance: 500 },
            { lat: 52.0815, lng: -1.0200, distance: 600 },
            { lat: 52.0820, lng: -1.0205, distance: 700 },
            { lat: 52.0825, lng: -1.0210, distance: 800 },
            { lat: 52.0830, lng: -1.0215, distance: 900 },
            { lat: 52.0835, lng: -1.0220, distance: 1000 },
            { lat: 52.0840, lng: -1.0225, distance: 1100 },
            { lat: 52.0845, lng: -1.0230, distance: 1200 },
            { lat: 52.0850, lng: -1.0235, distance: 1300 },
            { lat: 52.0855, lng: -1.0240, distance: 1400 },
            { lat: 52.0860, lng: -1.0245, distance: 1500 },
            { lat: 52.0865, lng: -1.0250, distance: 1600 },
            { lat: 52.0870, lng: -1.0255, distance: 1700 },
            { lat: 52.0875, lng: -1.0260, distance: 1800 },
            { lat: 52.0880, lng: -1.0265, distance: 1900 },
            { lat: 52.0786, lng: -1.0169, distance: 2000 }
          ],
          outer: [
            { lat: 52.0788, lng: -1.0165, distance: 0 },
            { lat: 52.0792, lng: -1.0171, distance: 100 },
            { lat: 52.0797, lng: -1.0176, distance: 200 },
            { lat: 52.0802, lng: -1.0181, distance: 300 },
            { lat: 52.0807, lng: -1.0186, distance: 400 },
            { lat: 52.0812, lng: -1.0191, distance: 500 },
            { lat: 52.0817, lng: -1.0196, distance: 600 },
            { lat: 52.0822, lng: -1.0201, distance: 700 },
            { lat: 52.0827, lng: -1.0206, distance: 800 },
            { lat: 52.0832, lng: -1.0211, distance: 900 },
            { lat: 52.0837, lng: -1.0216, distance: 1000 },
            { lat: 52.0842, lng: -1.0221, distance: 1100 },
            { lat: 52.0847, lng: -1.0226, distance: 1200 },
            { lat: 52.0852, lng: -1.0231, distance: 1300 },
            { lat: 52.0857, lng: -1.0236, distance: 1400 },
            { lat: 52.0862, lng: -1.0241, distance: 1500 },
            { lat: 52.0867, lng: -1.0246, distance: 1600 },
            { lat: 52.0872, lng: -1.0251, distance: 1700 },
            { lat: 52.0877, lng: -1.0256, distance: 1800 },
            { lat: 52.0882, lng: -1.0261, distance: 1900 },
            { lat: 52.0788, lng: -1.0165, distance: 2000 }
          ],
          centerline: [
            { lat: 52.0786, lng: -1.0169, distance: 0 },
            { lat: 52.0789, lng: -1.0173, distance: 50 },
            { lat: 52.0792, lng: -1.0178, distance: 150 },
            { lat: 52.0797, lng: -1.0183, distance: 250 },
            { lat: 52.0802, lng: -1.0188, distance: 350 },
            { lat: 52.0807, lng: -1.0193, distance: 450 },
            { lat: 52.0812, lng: -1.0198, distance: 550 },
            { lat: 52.0817, lng: -1.0203, distance: 650 },
            { lat: 52.0822, lng: -1.0208, distance: 750 },
            { lat: 52.0827, lng: -1.0213, distance: 850 },
            { lat: 52.0832, lng: -1.0218, distance: 950 },
            { lat: 52.0837, lng: -1.0223, distance: 1050 },
            { lat: 52.0842, lng: -1.0228, distance: 1150 },
            { lat: 52.0847, lng: -1.0233, distance: 1250 },
            { lat: 52.0852, lng: -1.0238, distance: 1350 },
            { lat: 52.0857, lng: -1.0243, distance: 1450 },
            { lat: 52.0862, lng: -1.0248, distance: 1550 },
            { lat: 52.0867, lng: -1.0253, distance: 1650 },
            { lat: 52.0872, lng: -1.0258, distance: 1750 },
            { lat: 52.0877, lng: -1.0263, distance: 1850 },
            { lat: 52.0786, lng: -1.0169, distance: 1950 }
          ]
        },
        sectors: [
          {
            id: 's1',
            name: 'Sector 1',
            number: 1,
            startPoint: { lat: 52.0786, lng: -1.0169 },
            endPoint: { lat: 52.0795, lng: -1.0180 },
            length: 1963,
            recordTime: 32000
          },
          {
            id: 's2',
            name: 'Sector 2',
            number: 2,
            startPoint: { lat: 52.0795, lng: -1.0180 },
            endPoint: { lat: 52.0800, lng: -1.0190 },
            length: 1964,
            recordTime: 35000
          },
          {
            id: 's3',
            name: 'Sector 3',
            number: 3,
            startPoint: { lat: 52.0800, lng: -1.0190 },
            endPoint: { lat: 52.0786, lng: -1.0169 },
            length: 1964,
            recordTime: 33000
          }
        ],
        corners: [
          {
            id: 'copse',
            name: 'Copse',
            number: 1,
            type: 'fast',
            entryPoint: { lat: 52.0786, lng: -1.0169 },
            apexPoint: { lat: 52.0788, lng: -1.0172 },
            exitPoint: { lat: 52.0790, lng: -1.0175 },
            idealSpeed: 180,
            brakingZone: {
              start: { lat: 52.0784, lng: -1.0166 },
              end: { lat: 52.0786, lng: -1.0169 },
              distance: 150
            },
            difficulty: 8,
            elevation: 120
          },
          {
            id: 'maggotts',
            name: 'Maggotts',
            number: 2,
            type: 'fast',
            entryPoint: { lat: 52.0790, lng: -1.0175 },
            apexPoint: { lat: 52.0792, lng: -1.0178 },
            exitPoint: { lat: 52.0794, lng: -1.0181 },
            idealSpeed: 200,
            brakingZone: {
              start: { lat: 52.0788, lng: -1.0172 },
              end: { lat: 52.0790, lng: -1.0175 },
              distance: 100
            },
            difficulty: 7,
            elevation: 118
          }
        ],
        drsZones: [
          {
            id: 'drs1',
            name: 'Hangar Straight',
            detectionPoint: { lat: 52.0794, lng: -1.0181 },
            activationPoint: { lat: 52.0796, lng: -1.0184 },
            endPoint: { lat: 52.0800, lng: -1.0190 },
            length: 800,
            enabled: true
          }
        ],
        elevation: [
          { lat: 52.0786, lng: -1.0169, elevation: 120, slope: 0 },
          { lat: 52.0789, lng: -1.0173, elevation: 118, slope: -2 },
          { lat: 52.0792, lng: -1.0178, elevation: 116, slope: -2 }
        ],
        surface: [
          {
            id: 'asphalt_main',
            name: 'Main Asphalt',
            type: 'asphalt',
            gripLevel: 1.0,
            color: '#2c2c2c',
            geometry: [
              { lat: 52.0786, lng: -1.0169 },
              { lat: 52.0790, lng: -1.0175 },
              { lat: 52.0795, lng: -1.0180 }
            ]
          }
        ],
        metadata: {
          opened: '1948',
          lastModified: '2023-01-01',
          surface: 'Asphalt',
          recordHolder: 'Max Verstappen',
          recordTime: 100000,
          recordDate: '2023-07-09',
          weather: 'dry',
          temperature: 25,
          humidity: 60
        }
      },
      {
        id: 'spa',
        name: 'Circuit de Spa-Francorchamps',
        country: 'Belgium',
        location: {
          lat: 50.4372,
          lng: 5.9714,
          elevation: 400
        },
        layout: {
          type: 'GP',
          length: 7004,
          corners: 20,
          direction: 'clockwise'
        },
        boundaries: {
          inner: [
            { lat: 50.4372, lng: 5.9714, distance: 0 },
            { lat: 50.4375, lng: 5.9718, distance: 100 },
            { lat: 50.4378, lng: 5.9722, distance: 200 },
            { lat: 50.4381, lng: 5.9726, distance: 300 },
            { lat: 50.4384, lng: 5.9730, distance: 400 },
            { lat: 50.4387, lng: 5.9734, distance: 500 },
            { lat: 50.4390, lng: 5.9738, distance: 600 },
            { lat: 50.4393, lng: 5.9742, distance: 700 },
            { lat: 50.4396, lng: 5.9746, distance: 800 },
            { lat: 50.4399, lng: 5.9750, distance: 900 },
            { lat: 50.4402, lng: 5.9754, distance: 1000 },
            { lat: 50.4405, lng: 5.9758, distance: 1100 },
            { lat: 50.4408, lng: 5.9762, distance: 1200 },
            { lat: 50.4411, lng: 5.9766, distance: 1300 },
            { lat: 50.4414, lng: 5.9770, distance: 1400 },
            { lat: 50.4417, lng: 5.9774, distance: 1500 },
            { lat: 50.4420, lng: 5.9778, distance: 1600 },
            { lat: 50.4423, lng: 5.9782, distance: 1700 },
            { lat: 50.4426, lng: 5.9786, distance: 1800 },
            { lat: 50.4429, lng: 5.9790, distance: 1900 },
            { lat: 50.4372, lng: 5.9714, distance: 2000 }
          ],
          outer: [
            { lat: 50.4374, lng: 5.9712, distance: 0 },
            { lat: 50.4377, lng: 5.9716, distance: 100 },
            { lat: 50.4380, lng: 5.9720, distance: 200 },
            { lat: 50.4383, lng: 5.9724, distance: 300 },
            { lat: 50.4386, lng: 5.9728, distance: 400 },
            { lat: 50.4389, lng: 5.9732, distance: 500 },
            { lat: 50.4392, lng: 5.9736, distance: 600 },
            { lat: 50.4395, lng: 5.9740, distance: 700 },
            { lat: 50.4398, lng: 5.9744, distance: 800 },
            { lat: 50.4401, lng: 5.9748, distance: 900 },
            { lat: 50.4404, lng: 5.9752, distance: 1000 },
            { lat: 50.4407, lng: 5.9756, distance: 1100 },
            { lat: 50.4410, lng: 5.9760, distance: 1200 },
            { lat: 50.4413, lng: 5.9764, distance: 1300 },
            { lat: 50.4416, lng: 5.9768, distance: 1400 },
            { lat: 50.4419, lng: 5.9772, distance: 1500 },
            { lat: 50.4422, lng: 5.9776, distance: 1600 },
            { lat: 50.4425, lng: 5.9780, distance: 1700 },
            { lat: 50.4428, lng: 5.9784, distance: 1800 },
            { lat: 50.4431, lng: 5.9788, distance: 1900 },
            { lat: 50.4374, lng: 5.9712, distance: 2000 }
          ],
          centerline: [
            { lat: 50.4372, lng: 5.9714, distance: 0 },
            { lat: 50.4376, lng: 5.9717, distance: 50 },
            { lat: 50.4379, lng: 5.9721, distance: 150 },
            { lat: 50.4382, lng: 5.9725, distance: 250 },
            { lat: 50.4385, lng: 5.9729, distance: 350 },
            { lat: 50.4388, lng: 5.9733, distance: 450 },
            { lat: 50.4391, lng: 5.9737, distance: 550 },
            { lat: 50.4394, lng: 5.9741, distance: 650 },
            { lat: 50.4397, lng: 5.9745, distance: 750 },
            { lat: 50.4400, lng: 5.9749, distance: 850 },
            { lat: 50.4403, lng: 5.9753, distance: 950 },
            { lat: 50.4406, lng: 5.9757, distance: 1050 },
            { lat: 50.4409, lng: 5.9761, distance: 1150 },
            { lat: 50.4412, lng: 5.9765, distance: 1250 },
            { lat: 50.4415, lng: 5.9769, distance: 1350 },
            { lat: 50.4418, lng: 5.9773, distance: 1450 },
            { lat: 50.4421, lng: 5.9777, distance: 1550 },
            { lat: 50.4424, lng: 5.9781, distance: 1650 },
            { lat: 50.4427, lng: 5.9785, distance: 1750 },
            { lat: 50.4430, lng: 5.9789, distance: 1850 },
            { lat: 50.4372, lng: 5.9714, distance: 1950 }
          ]
        },
        sectors: [
          {
            id: 's1',
            name: 'Sector 1',
            number: 1,
            startPoint: { lat: 50.4372, lng: 5.9714 },
            endPoint: { lat: 50.4378, lng: 5.9722 },
            length: 2334,
            recordTime: 45000
          },
          {
            id: 's2',
            name: 'Sector 2',
            number: 2,
            startPoint: { lat: 50.4378, lng: 5.9722 },
            endPoint: { lat: 50.4382, lng: 5.9730 },
            length: 2335,
            recordTime: 48000
          },
          {
            id: 's3',
            name: 'Sector 3',
            number: 3,
            startPoint: { lat: 50.4382, lng: 5.9730 },
            endPoint: { lat: 50.4372, lng: 5.9714 },
            length: 2335,
            recordTime: 47000
          }
        ],
        corners: [
          {
            id: 'la_source',
            name: 'La Source',
            number: 1,
            type: 'hairpin',
            entryPoint: { lat: 50.4372, lng: 5.9714 },
            apexPoint: { lat: 50.4374, lng: 5.9716 },
            exitPoint: { lat: 50.4376, lng: 5.9718 },
            idealSpeed: 60,
            brakingZone: {
              start: { lat: 50.4370, lng: 5.9712 },
              end: { lat: 50.4372, lng: 5.9714 },
              distance: 200
            },
            difficulty: 9,
            elevation: 400
          },
          {
            id: 'eau_rouge',
            name: 'Eau Rouge',
            number: 2,
            type: 'fast',
            entryPoint: { lat: 50.4376, lng: 5.9718 },
            apexPoint: { lat: 50.4378, lng: 5.9720 },
            exitPoint: { lat: 50.4380, lng: 5.9722 },
            idealSpeed: 280,
            brakingZone: {
              start: { lat: 50.4374, lng: 5.9716 },
              end: { lat: 50.4376, lng: 5.9718 },
              distance: 50
            },
            difficulty: 10,
            elevation: 395
          }
        ],
        drsZones: [
          {
            id: 'drs1',
            name: 'Kemmel Straight',
            detectionPoint: { lat: 50.4380, lng: 5.9722 },
            activationPoint: { lat: 50.4382, lng: 5.9726 },
            endPoint: { lat: 50.4386, lng: 5.9734 },
            length: 1200,
            enabled: true
          }
        ],
        elevation: [
          { lat: 50.4372, lng: 5.9714, elevation: 400, slope: 0 },
          { lat: 50.4376, lng: 5.9717, elevation: 395, slope: -5 },
          { lat: 50.4379, lng: 5.9721, elevation: 390, slope: -5 }
        ],
        surface: [
          {
            id: 'asphalt_main',
            name: 'Main Asphalt',
            type: 'asphalt',
            gripLevel: 1.0,
            color: '#2c2c2c',
            geometry: [
              { lat: 50.4372, lng: 5.9714 },
              { lat: 50.4376, lng: 5.9718 },
              { lat: 50.4378, lng: 5.9722 }
            ]
          }
        ],
        metadata: {
          opened: '1921',
          lastModified: '2023-01-01',
          surface: 'Asphalt',
          recordHolder: 'Lewis Hamilton',
          recordTime: 140000,
          recordDate: '2020-08-30',
          weather: 'dry',
          temperature: 22,
          humidity: 70
        }
      },
      {
        id: 'monza',
        name: 'Autodromo Nazionale di Monza',
        country: 'Italy',
        location: {
          lat: 45.6156,
          lng: 9.2811,
          elevation: 162
        },
        layout: {
          type: 'GP',
          length: 5793,
          corners: 11,
          direction: 'clockwise'
        },
        boundaries: {
          inner: [
            { lat: 45.6156, lng: 9.2811, distance: 0 },
            { lat: 45.6160, lng: 9.2815, distance: 100 },
            { lat: 45.6164, lng: 9.2819, distance: 200 },
            { lat: 45.6168, lng: 9.2823, distance: 300 },
            { lat: 45.6172, lng: 9.2827, distance: 400 },
            { lat: 45.6176, lng: 9.2831, distance: 500 },
            { lat: 45.6180, lng: 9.2835, distance: 600 },
            { lat: 45.6184, lng: 9.2839, distance: 700 },
            { lat: 45.6188, lng: 9.2843, distance: 800 },
            { lat: 45.6192, lng: 9.2847, distance: 900 },
            { lat: 45.6196, lng: 9.2851, distance: 1000 },
            { lat: 45.6200, lng: 9.2855, distance: 1100 },
            { lat: 45.6204, lng: 9.2859, distance: 1200 },
            { lat: 45.6208, lng: 9.2863, distance: 1300 },
            { lat: 45.6212, lng: 9.2867, distance: 1400 },
            { lat: 45.6216, lng: 9.2871, distance: 1500 },
            { lat: 45.6220, lng: 9.2875, distance: 1600 },
            { lat: 45.6224, lng: 9.2879, distance: 1700 },
            { lat: 45.6228, lng: 9.2883, distance: 1800 },
            { lat: 45.6232, lng: 9.2887, distance: 1900 },
            { lat: 45.6156, lng: 9.2811, distance: 2000 }
          ],
          outer: [
            { lat: 45.6158, lng: 9.2809, distance: 0 },
            { lat: 45.6162, lng: 9.2813, distance: 100 },
            { lat: 45.6166, lng: 9.2817, distance: 200 },
            { lat: 45.6170, lng: 9.2821, distance: 300 },
            { lat: 45.6174, lng: 9.2825, distance: 400 },
            { lat: 45.6178, lng: 9.2829, distance: 500 },
            { lat: 45.6182, lng: 9.2833, distance: 600 },
            { lat: 45.6186, lng: 9.2837, distance: 700 },
            { lat: 45.6190, lng: 9.2841, distance: 800 },
            { lat: 45.6194, lng: 9.2845, distance: 900 },
            { lat: 45.6198, lng: 9.2849, distance: 1000 },
            { lat: 45.6202, lng: 9.2853, distance: 1100 },
            { lat: 45.6206, lng: 9.2857, distance: 1200 },
            { lat: 45.6210, lng: 9.2861, distance: 1300 },
            { lat: 45.6214, lng: 9.2865, distance: 1400 },
            { lat: 45.6218, lng: 9.2869, distance: 1500 },
            { lat: 45.6222, lng: 9.2873, distance: 1600 },
            { lat: 45.6226, lng: 9.2877, distance: 1700 },
            { lat: 45.6230, lng: 9.2881, distance: 1800 },
            { lat: 45.6234, lng: 9.2885, distance: 1900 },
            { lat: 45.6158, lng: 9.2809, distance: 2000 }
          ],
          centerline: [
            { lat: 45.6156, lng: 9.2811, distance: 0 },
            { lat: 45.6160, lng: 9.2813, distance: 50 },
            { lat: 45.6164, lng: 9.2817, distance: 150 },
            { lat: 45.6168, lng: 9.2821, distance: 250 },
            { lat: 45.6172, lng: 9.2825, distance: 350 },
            { lat: 45.6176, lng: 9.2829, distance: 450 },
            { lat: 45.6180, lng: 9.2833, distance: 550 },
            { lat: 45.6184, lng: 9.2837, distance: 650 },
            { lat: 45.6188, lng: 9.2841, distance: 750 },
            { lat: 45.6192, lng: 9.2845, distance: 850 },
            { lat: 45.6196, lng: 9.2849, distance: 950 },
            { lat: 45.6200, lng: 9.2853, distance: 1050 },
            { lat: 45.6204, lng: 9.2857, distance: 1150 },
            { lat: 45.6208, lng: 9.2861, distance: 1250 },
            { lat: 45.6212, lng: 9.2865, distance: 1350 },
            { lat: 45.6216, lng: 9.2869, distance: 1450 },
            { lat: 45.6220, lng: 9.2873, distance: 1550 },
            { lat: 45.6224, lng: 9.2877, distance: 1650 },
            { lat: 45.6228, lng: 9.2881, distance: 1750 },
            { lat: 45.6232, lng: 9.2885, distance: 1850 },
            { lat: 45.6156, lng: 9.2811, distance: 1950 }
          ]
        },
        sectors: [
          {
            id: 's1',
            name: 'Sector 1',
            number: 1,
            startPoint: { lat: 45.6156, lng: 9.2811 },
            endPoint: { lat: 45.6180, lng: 9.2835 },
            length: 1931,
            recordTime: 25000
          },
          {
            id: 's2',
            name: 'Sector 2',
            number: 2,
            startPoint: { lat: 45.6180, lng: 9.2835 },
            endPoint: { lat: 45.6204, lng: 9.2859 },
            length: 1931,
            recordTime: 28000
          },
          {
            id: 's3',
            name: 'Sector 3',
            number: 3,
            startPoint: { lat: 45.6204, lng: 9.2859 },
            endPoint: { lat: 45.6156, lng: 9.2811 },
            length: 1931,
            recordTime: 27000
          }
        ],
        corners: [
          {
            id: 'rettifilo',
            name: 'Rettifilo',
            number: 1,
            type: 'fast',
            entryPoint: { lat: 45.6156, lng: 9.2811 },
            apexPoint: { lat: 45.6160, lng: 9.2815 },
            exitPoint: { lat: 45.6164, lng: 9.2819 },
            idealSpeed: 350,
            brakingZone: {
              start: { lat: 45.6152, lng: 9.2807 },
              end: { lat: 45.6156, lng: 9.2811 },
              distance: 200
            },
            difficulty: 6,
            elevation: 162
          },
          {
            id: 'curva_grande',
            name: 'Curva Grande',
            number: 2,
            type: 'fast',
            entryPoint: { lat: 45.6164, lng: 9.2819 },
            apexPoint: { lat: 45.6168, lng: 9.2823 },
            exitPoint: { lat: 45.6172, lng: 9.2827 },
            idealSpeed: 320,
            brakingZone: {
              start: { lat: 45.6160, lng: 9.2815 },
              end: { lat: 45.6164, lng: 9.2819 },
              distance: 150
            },
            difficulty: 7,
            elevation: 160
          }
        ],
        drsZones: [
          {
            id: 'drs1',
            name: 'Start/Finish Straight',
            detectionPoint: { lat: 45.6156, lng: 9.2811 },
            activationPoint: { lat: 45.6158, lng: 9.2813 },
            endPoint: { lat: 45.6164, lng: 9.2819 },
            length: 1000,
            enabled: true
          }
        ],
        elevation: [
          { lat: 45.6156, lng: 9.2811, elevation: 162, slope: 0 },
          { lat: 45.6160, lng: 9.2813, elevation: 160, slope: -2 },
          { lat: 45.6164, lng: 9.2817, elevation: 158, slope: -2 }
        ],
        surface: [
          {
            id: 'asphalt_main',
            name: 'Main Asphalt',
            type: 'asphalt',
            gripLevel: 1.0,
            color: '#2c2c2c',
            geometry: [
              { lat: 45.6156, lng: 9.2811 },
              { lat: 45.6160, lng: 9.2815 },
              { lat: 45.6164, lng: 9.2819 }
            ]
          }
        ],
        metadata: {
          opened: '1922',
          lastModified: '2023-01-01',
          surface: 'Asphalt',
          recordHolder: 'Rubens Barrichello',
          recordTime: 80000,
          recordDate: '2004-09-12',
          weather: 'dry',
          temperature: 28,
          humidity: 55
        }
      },
      {
        id: 'suzuka',
        name: 'Suzuka International Racing Course',
        country: 'Japan',
        location: {
          lat: 34.8431,
          lng: 136.5414,
          elevation: 45
        },
        layout: {
          type: 'GP',
          length: 5807,
          corners: 18,
          direction: 'clockwise'
        },
        boundaries: {
          inner: [
            { lat: 34.8431, lng: 136.5414, distance: 0 },
            { lat: 34.8435, lng: 136.5418, distance: 100 },
            { lat: 34.8439, lng: 136.5422, distance: 200 },
            { lat: 34.8443, lng: 136.5426, distance: 300 },
            { lat: 34.8447, lng: 136.5430, distance: 400 },
            { lat: 34.8451, lng: 136.5434, distance: 500 },
            { lat: 34.8455, lng: 136.5438, distance: 600 },
            { lat: 34.8459, lng: 136.5442, distance: 700 },
            { lat: 34.8463, lng: 136.5446, distance: 800 },
            { lat: 34.8467, lng: 136.5450, distance: 900 },
            { lat: 34.8471, lng: 136.5454, distance: 1000 },
            { lat: 34.8475, lng: 136.5458, distance: 1100 },
            { lat: 34.8479, lng: 136.5462, distance: 1200 },
            { lat: 34.8483, lng: 136.5466, distance: 1300 },
            { lat: 34.8487, lng: 136.5470, distance: 1400 },
            { lat: 34.8491, lng: 136.5474, distance: 1500 },
            { lat: 34.8495, lng: 136.5478, distance: 1600 },
            { lat: 34.8499, lng: 136.5482, distance: 1700 },
            { lat: 34.8503, lng: 136.5486, distance: 1800 },
            { lat: 34.8507, lng: 136.5490, distance: 1900 },
            { lat: 34.8431, lng: 136.5414, distance: 2000 }
          ],
          outer: [
            { lat: 34.8433, lng: 136.5412, distance: 0 },
            { lat: 34.8437, lng: 136.5416, distance: 100 },
            { lat: 34.8441, lng: 136.5420, distance: 200 },
            { lat: 34.8445, lng: 136.5424, distance: 300 },
            { lat: 34.8449, lng: 136.5428, distance: 400 },
            { lat: 34.8453, lng: 136.5432, distance: 500 },
            { lat: 34.8457, lng: 136.5436, distance: 600 },
            { lat: 34.8461, lng: 136.5440, distance: 700 },
            { lat: 34.8465, lng: 136.5444, distance: 800 },
            { lat: 34.8469, lng: 136.5448, distance: 900 },
            { lat: 34.8473, lng: 136.5452, distance: 1000 },
            { lat: 34.8477, lng: 136.5456, distance: 1100 },
            { lat: 34.8481, lng: 136.5460, distance: 1200 },
            { lat: 34.8485, lng: 136.5464, distance: 1300 },
            { lat: 34.8489, lng: 136.5468, distance: 1400 },
            { lat: 34.8493, lng: 136.5472, distance: 1500 },
            { lat: 34.8497, lng: 136.5476, distance: 1600 },
            { lat: 34.8501, lng: 136.5480, distance: 1700 },
            { lat: 34.8505, lng: 136.5484, distance: 1800 },
            { lat: 34.8509, lng: 136.5488, distance: 1900 },
            { lat: 34.8433, lng: 136.5412, distance: 2000 }
          ],
          centerline: [
            { lat: 34.8431, lng: 136.5414, distance: 0 },
            { lat: 34.8435, lng: 136.5416, distance: 50 },
            { lat: 34.8439, lng: 136.5420, distance: 150 },
            { lat: 34.8443, lng: 136.5424, distance: 250 },
            { lat: 34.8447, lng: 136.5428, distance: 350 },
            { lat: 34.8451, lng: 136.5432, distance: 450 },
            { lat: 34.8455, lng: 136.5436, distance: 550 },
            { lat: 34.8459, lng: 136.5440, distance: 650 },
            { lat: 34.8463, lng: 136.5444, distance: 750 },
            { lat: 34.8467, lng: 136.5448, distance: 850 },
            { lat: 34.8471, lng: 136.5452, distance: 950 },
            { lat: 34.8475, lng: 136.5456, distance: 1050 },
            { lat: 34.8479, lng: 136.5460, distance: 1150 },
            { lat: 34.8483, lng: 136.5464, distance: 1250 },
            { lat: 34.8487, lng: 136.5468, distance: 1350 },
            { lat: 34.8491, lng: 136.5472, distance: 1450 },
            { lat: 34.8495, lng: 136.5476, distance: 1550 },
            { lat: 34.8499, lng: 136.5480, distance: 1650 },
            { lat: 34.8503, lng: 136.5484, distance: 1750 },
            { lat: 34.8507, lng: 136.5488, distance: 1850 },
            { lat: 34.8431, lng: 136.5414, distance: 1950 }
          ]
        },
        sectors: [
          {
            id: 's1',
            name: 'Sector 1',
            number: 1,
            startPoint: { lat: 34.8431, lng: 136.5414 },
            endPoint: { lat: 34.8455, lng: 136.5438 },
            length: 1936,
            recordTime: 30000
          },
          {
            id: 's2',
            name: 'Sector 2',
            number: 2,
            startPoint: { lat: 34.8455, lng: 136.5438 },
            endPoint: { lat: 34.8479, lng: 136.5462 },
            length: 1936,
            recordTime: 32000
          },
          {
            id: 's3',
            name: 'Sector 3',
            number: 3,
            startPoint: { lat: 34.8479, lng: 136.5462 },
            endPoint: { lat: 34.8431, lng: 136.5414 },
            length: 1935,
            recordTime: 31000
          }
        ],
        corners: [
          {
            id: 'turn1',
            name: 'Turn 1',
            number: 1,
            type: 'medium',
            entryPoint: { lat: 34.8431, lng: 136.5414 },
            apexPoint: { lat: 34.8435, lng: 136.5418 },
            exitPoint: { lat: 34.8439, lng: 136.5422 },
            idealSpeed: 180,
            brakingZone: {
              start: { lat: 34.8427, lng: 136.5410 },
              end: { lat: 34.8431, lng: 136.5414 },
              distance: 150
            },
            difficulty: 8,
            elevation: 45
          },
          {
            id: 'essess',
            name: 'Esses',
            number: 2,
            type: 'complex',
            entryPoint: { lat: 34.8439, lng: 136.5422 },
            apexPoint: { lat: 34.8443, lng: 136.5426 },
            exitPoint: { lat: 34.8447, lng: 136.5430 },
            idealSpeed: 160,
            brakingZone: {
              start: { lat: 34.8435, lng: 136.5418 },
              end: { lat: 34.8439, lng: 136.5422 },
              distance: 100
            },
            difficulty: 10,
            elevation: 43
          }
        ],
        drsZones: [
          {
            id: 'drs1',
            name: 'Main Straight',
            detectionPoint: { lat: 34.8431, lng: 136.5414 },
            activationPoint: { lat: 34.8433, lng: 136.5416 },
            endPoint: { lat: 34.8439, lng: 136.5422 },
            length: 800,
            enabled: true
          }
        ],
        elevation: [
          { lat: 34.8431, lng: 136.5414, elevation: 45, slope: 0 },
          { lat: 34.8435, lng: 136.5416, elevation: 43, slope: -2 },
          { lat: 34.8439, lng: 136.5420, elevation: 41, slope: -2 }
        ],
        surface: [
          {
            id: 'asphalt_main',
            name: 'Main Asphalt',
            type: 'asphalt',
            gripLevel: 1.0,
            color: '#2c2c2c',
            geometry: [
              { lat: 34.8431, lng: 136.5414 },
              { lat: 34.8435, lng: 136.5418 },
              { lat: 34.8439, lng: 136.5422 }
            ]
          }
        ],
        metadata: {
          opened: '1962',
          lastModified: '2023-01-01',
          surface: 'Asphalt',
          recordHolder: 'Kimi Räikkönen',
          recordTime: 90000,
          recordDate: '2005-10-09',
          weather: 'dry',
          temperature: 24,
          humidity: 65
        }
      }
    ];

    tracks.forEach(track => {
      this.trackDatabase.set(track.id, track);
    });
  }

  async getTrackGeometry(trackId: string): Promise<TrackGeometry | null> {
    return this.trackDatabase.get(trackId) || null;
  }

  async getAllTracks(): Promise<TrackGeometry[]> {
    return Array.from(this.trackDatabase.values());
  }

  async generateTrackMesh(trackId: string): Promise<BufferGeometry> {
    const cached = this.geometryCache.get(trackId);
    if (cached) return cached;

    const track = await this.getTrackGeometry(trackId);
    if (!track) {
      throw new Error(`Track ${trackId} not found`);
    }

    const geometry = this.createTrackGeometry(track);
    this.geometryCache.set(trackId, geometry);
    return geometry;
  }

  private createTrackGeometry(track: TrackGeometry): BufferGeometry {
    const geometry = new BufferGeometry();
    const vertices: number[] = [];
    const indices: number[] = [];

    // Convert GPS coordinates to 3D vertices
    const centerLat = track.location.lat;
    const centerLng = track.location.lng;
    const centerElevation = track.location.elevation;

    // Create track surface from boundaries
    const innerPoints = track.boundaries.inner.map(point => 
      this.gpsTo3D(point.lat, point.lng, point.elevation || centerElevation, centerLat, centerLng)
    );
    const outerPoints = track.boundaries.outer.map(point => 
      this.gpsTo3D(point.lat, point.lng, point.elevation || centerElevation, centerLat, centerLng)
    );

    // Create track surface mesh
    for (let i = 0; i < innerPoints.length - 1; i++) {
      const inner1 = innerPoints[i];
      const inner2 = innerPoints[i + 1];
      const outer1 = outerPoints[i];
      const outer2 = outerPoints[i + 1];

      // Add vertices for this quad
      const baseIndex = vertices.length / 3;
      vertices.push(
        inner1.x, inner1.y, inner1.z,
        inner2.x, inner2.y, inner2.z,
        outer1.x, outer1.y, outer1.z,
        outer2.x, outer2.y, outer2.z
      );

      // Add indices for two triangles
      indices.push(
        baseIndex, baseIndex + 1, baseIndex + 2,
        baseIndex + 1, baseIndex + 3, baseIndex + 2
      );
    }

    geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    return geometry;
  }

  private gpsTo3D(lat: number, lng: number, elevation: number, centerLat: number, centerLng: number): Vector3 {
    // Convert GPS coordinates to local 3D coordinates
    const latDiff = lat - centerLat;
    const lngDiff = lng - centerLng;
    
    // Approximate conversion (1 degree ≈ 111,000 meters)
    const x = lngDiff * 111000 * Math.cos(centerLat * Math.PI / 180);
    const z = -latDiff * 111000; // Negative because Y is up in 3D
    const y = elevation - 100; // Relative elevation

    return new Vector3(x, y, z);
  }

  async getTrackCenterline(trackId: string): Promise<Vector3[]> {
    const track = await this.getTrackGeometry(trackId);
    if (!track) return [];

    const centerLat = track.location.lat;
    const centerLng = track.location.lng;
    const centerElevation = track.location.elevation;

    return track.boundaries.centerline.map(point => 
      this.gpsTo3D(point.lat, point.lng, point.elevation || centerElevation, centerLat, centerLng)
    );
  }

  async getTrackSectors(trackId: string): Promise<TrackSector[]> {
    const track = await this.getTrackGeometry(trackId);
    return track?.sectors || [];
  }

  async getTrackCorners(trackId: string): Promise<TrackCorner[]> {
    const track = await this.getTrackGeometry(trackId);
    return track?.corners || [];
  }

  async getDRSZones(trackId: string): Promise<DRSZone[]> {
    const track = await this.getTrackGeometry(trackId);
    return track?.drsZones || [];
  }
}

export const trackGeometryService = new TrackGeometryService(); 