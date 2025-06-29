// Comprehensive global racing tracks database for RaceSense
// Professional racing circuits from around the world

import { RacingTrack, TrackPoint } from "../types/track";

// Helper function to generate realistic track maps (simplified for performance)
const generateTrackMap = (key: string, length: number): TrackPoint[] => {
  // This would normally load actual GPS coordinates
  // For now, generating representative points based on track characteristics
  const points: TrackPoint[] = [];
  const numPoints = Math.max(20, Math.floor(length / 100));

  // Use track-specific generation logic
  switch (key) {
    case "silverstone":
      return generateSilverstoneMap();
    case "spa":
      return generateSpaMap();
    case "monza":
      return generateMonzaMap();
    case "monaco":
      return generateMonacoMap();
    case "suzuka":
      return generateSuzukaMap();
    case "kymiring":
      return generateKymiRingMap();
    case "ahvenisto":
      return generateAhvenistoMap();
    case "alastaro":
      return generateAlastaroMap();
    case "botniaring":
      return generateBotniaRingMap();
    case "powerpark":
      return generatePowerParkMap();
    default:
      // Generic track generation
      for (let i = 0; i < numPoints; i++) {
        const angle = (i / numPoints) * 2 * Math.PI;
        points.push({
          lat: 50.0 + Math.cos(angle) * 0.01,
          lng: 0.0 + Math.sin(angle) * 0.01,
          elevation: Math.sin(angle * 3) * 10,
        });
      }
      return points;
  }
};

// Specific track map generators (simplified)
const generateSilverstoneMap = (): TrackPoint[] => [
  { lat: 52.0786, lng: -1.0169, elevation: 150 },
  { lat: 52.079, lng: -1.0165, elevation: 152 },
  { lat: 52.0795, lng: -1.016, elevation: 155 },
  { lat: 52.08, lng: -1.0145, elevation: 158 },
  { lat: 52.0785, lng: -1.013, elevation: 160 },
  { lat: 52.077, lng: -1.0125, elevation: 155 },
  { lat: 52.0755, lng: -1.0135, elevation: 150 },
  { lat: 52.0745, lng: -1.015, elevation: 148 },
  { lat: 52.075, lng: -1.0175, elevation: 150 },
  { lat: 52.0765, lng: -1.0185, elevation: 152 },
  { lat: 52.078, lng: -1.0175, elevation: 150 },
];

const generateSpaMap = (): TrackPoint[] => [
  { lat: 50.4372, lng: 5.9714, elevation: 400 },
  { lat: 50.438, lng: 5.972, elevation: 405 },
  { lat: 50.439, lng: 5.973, elevation: 420 },
  { lat: 50.4425, lng: 5.9801, elevation: 450 }, // Eau Rouge
  { lat: 50.444, lng: 5.985, elevation: 480 },
  { lat: 50.442, lng: 5.992, elevation: 500 },
  { lat: 50.438, lng: 6.0, elevation: 480 },
  { lat: 50.4321, lng: 6.0089, elevation: 460 }, // Les Combes
  { lat: 50.428, lng: 6.005, elevation: 440 },
  { lat: 50.425, lng: 5.998, elevation: 420 },
  { lat: 50.4298, lng: 5.9867, elevation: 410 }, // Stavelot
  { lat: 50.435, lng: 5.975, elevation: 400 },
];

const generateMonzaMap = (): TrackPoint[] => [
  { lat: 45.6156, lng: 9.2811, elevation: 162 },
  { lat: 45.617, lng: 9.282, elevation: 163 },
  { lat: 45.6189, lng: 9.2756, elevation: 164 }, // Curva Grande
  { lat: 45.618, lng: 9.27, elevation: 165 },
  { lat: 45.615, lng: 9.265, elevation: 166 },
  { lat: 45.61, lng: 9.268, elevation: 167 },
  { lat: 45.6078, lng: 9.2701, elevation: 168 }, // Lesmo
  { lat: 45.609, lng: 9.275, elevation: 167 },
  { lat: 45.611, lng: 9.28, elevation: 166 },
  { lat: 45.6123, lng: 9.2889, elevation: 164 }, // Parabolica
  { lat: 45.6145, lng: 9.285, elevation: 163 },
];

const generateMonacoMap = (): TrackPoint[] => [
  { lat: 43.7347, lng: 7.4206, elevation: 50 },
  { lat: 43.735, lng: 7.421, elevation: 52 },
  { lat: 43.7355, lng: 7.422, elevation: 55 }, // Sainte Devote
  { lat: 43.7365, lng: 7.4235, elevation: 65 },
  { lat: 43.7375, lng: 7.425, elevation: 75 }, // Massenet
  { lat: 43.738, lng: 7.427, elevation: 80 }, // Casino
  { lat: 43.7375, lng: 7.4285, elevation: 75 },
  { lat: 43.7365, lng: 7.4295, elevation: 65 }, // Mirabeau
  { lat: 43.7355, lng: 7.4285, elevation: 55 },
  { lat: 43.7345, lng: 7.427, elevation: 45 },
  { lat: 43.734, lng: 7.425, elevation: 40 }, // Swimming Pool
  { lat: 43.7342, lng: 7.423, elevation: 45 },
  { lat: 43.7345, lng: 7.4215, elevation: 48 },
];

const generateSuzukaMap = (): TrackPoint[] => [
  { lat: 34.8431, lng: 136.5407, elevation: 45 },
  { lat: 34.844, lng: 136.5415, elevation: 47 },
  { lat: 34.845, lng: 136.5425, elevation: 50 }, // Turn 1
  { lat: 34.8465, lng: 136.544, elevation: 55 }, // S Curves
  { lat: 34.848, lng: 136.546, elevation: 60 },
  { lat: 34.849, lng: 136.5485, elevation: 65 }, // Dunlop Corner
  { lat: 34.8485, lng: 136.551, elevation: 70 },
  { lat: 34.8475, lng: 136.5525, elevation: 75 }, // Degner
  { lat: 34.846, lng: 136.5535, elevation: 72 },
  { lat: 34.8445, lng: 136.554, elevation: 68 }, // Hairpin
  { lat: 34.843, lng: 136.553, elevation: 65 },
  { lat: 34.842, lng: 136.5515, elevation: 60 }, // Spoon
  { lat: 34.8415, lng: 136.549, elevation: 55 },
  { lat: 34.842, lng: 136.5465, elevation: 50 }, // 130R
  { lat: 34.8425, lng: 136.544, elevation: 47 },
  { lat: 34.8428, lng: 136.542, elevation: 45 },
];

// Finnish track map generators
const generateKymiRingMap = (): TrackPoint[] => [
  { lat: 60.8851, lng: 26.5447, elevation: 85 },
  { lat: 60.8855, lng: 26.5452, elevation: 87 },
  { lat: 60.8865, lng: 26.5465, elevation: 90 },
  { lat: 60.8875, lng: 26.5475, elevation: 95 },
  { lat: 60.888, lng: 26.5485, elevation: 100 },
  { lat: 60.8875, lng: 26.5495, elevation: 105 },
  { lat: 60.8865, lng: 26.5505, elevation: 110 },
  { lat: 60.885, lng: 26.551, elevation: 115 },
  { lat: 60.8835, lng: 26.5505, elevation: 120 },
  { lat: 60.8825, lng: 26.5495, elevation: 115 },
  { lat: 60.882, lng: 26.5485, elevation: 110 },
  { lat: 60.8825, lng: 26.5475, elevation: 105 },
  { lat: 60.8835, lng: 26.5465, elevation: 100 },
  { lat: 60.8845, lng: 26.5455, elevation: 90 },
  { lat: 60.885, lng: 26.545, elevation: 87 },
];

const generateAhvenistoMap = (): TrackPoint[] => [
  { lat: 61.0156, lng: 24.4789, elevation: 105 },
  { lat: 61.016, lng: 24.4795, elevation: 107 },
  { lat: 61.0165, lng: 24.4805, elevation: 110 },
  { lat: 61.0168, lng: 24.4815, elevation: 115 },
  { lat: 61.0165, lng: 24.4825, elevation: 118 },
  { lat: 61.016, lng: 24.483, elevation: 120 },
  { lat: 61.015, lng: 24.4828, elevation: 118 },
  { lat: 61.0145, lng: 24.482, elevation: 115 },
  { lat: 61.0142, lng: 24.481, elevation: 112 },
  { lat: 61.0145, lng: 24.48, elevation: 110 },
  { lat: 61.015, lng: 24.4792, elevation: 107 },
  { lat: 61.0154, lng: 24.4787, elevation: 105 },
];

const generateAlastaroMap = (): TrackPoint[] => [
  { lat: 60.9523, lng: 23.0234, elevation: 45 },
  { lat: 60.953, lng: 23.0245, elevation: 48 },
  { lat: 60.9535, lng: 23.0255, elevation: 52 },
  { lat: 60.954, lng: 23.0265, elevation: 55 },
  { lat: 60.9535, lng: 23.0275, elevation: 60 },
  { lat: 60.9525, lng: 23.028, elevation: 65 },
  { lat: 60.9515, lng: 23.0285, elevation: 68 },
  { lat: 60.9505, lng: 23.028, elevation: 70 },
  { lat: 60.95, lng: 23.027, elevation: 65 },
  { lat: 60.9505, lng: 23.026, elevation: 60 },
  { lat: 60.951, lng: 23.025, elevation: 55 },
  { lat: 60.9515, lng: 23.024, elevation: 50 },
  { lat: 60.952, lng: 23.0235, elevation: 47 },
];

const generateBotniaRingMap = (): TrackPoint[] => [
  { lat: 62.5012, lng: 25.4456, elevation: 125 },
  { lat: 62.5018, lng: 25.4465, elevation: 127 },
  { lat: 62.5025, lng: 25.4475, elevation: 130 },
  { lat: 62.5028, lng: 25.4485, elevation: 135 },
  { lat: 62.5025, lng: 25.4495, elevation: 140 },
  { lat: 62.5015, lng: 25.45, elevation: 145 },
  { lat: 62.5005, lng: 25.4495, elevation: 142 },
  { lat: 62.4995, lng: 25.4485, elevation: 138 },
  { lat: 62.4998, lng: 25.4475, elevation: 135 },
  { lat: 62.5005, lng: 25.4465, elevation: 130 },
  { lat: 62.501, lng: 25.4458, elevation: 127 },
];

const generatePowerParkMap = (): TrackPoint[] => [
  { lat: 63.2345, lng: 23.1567, elevation: 55 },
  { lat: 63.235, lng: 23.1572, elevation: 56 },
  { lat: 63.2355, lng: 23.158, elevation: 58 },
  { lat: 63.2358, lng: 23.1585, elevation: 60 },
  { lat: 63.2355, lng: 23.159, elevation: 62 },
  { lat: 63.2348, lng: 23.1592, elevation: 63 },
  { lat: 63.234, lng: 23.159, elevation: 62 },
  { lat: 63.2335, lng: 23.1585, elevation: 60 },
  { lat: 63.2338, lng: 23.158, elevation: 58 },
  { lat: 63.2342, lng: 23.1572, elevation: 56 },
  { lat: 63.2344, lng: 23.1568, elevation: 55 },
];

export const RACING_TRACKS: RacingTrack[] = [
  // Formula 1 Circuits
  {
    id: "silverstone-gp",
    name: "Silverstone Circuit",
    shortName: "Silverstone",
    country: "United Kingdom",
    region: "Europe",
    city: "Silverstone",
    type: "formula1",
    category: "professional",
    startFinishLine: {
      point1: { lat: 52.0786, lng: -1.0169, elevation: 150 },
      point2: { lat: 52.0784, lng: -1.0165, elevation: 150 },
      bearing: 180,
      width: 15,
    },
    sectors: [
      {
        id: 1,
        name: "Sector 1",
        startPoint: { lat: 52.0786, lng: -1.0169 },
        endPoint: { lat: 52.08, lng: -1.0145 },
        length: 1980,
        type: "complex",
        difficulty: "medium",
      },
      {
        id: 2,
        name: "Sector 2",
        startPoint: { lat: 52.08, lng: -1.0145 },
        endPoint: { lat: 52.0745, lng: -1.015 },
        length: 2011,
        type: "complex",
        difficulty: "hard",
      },
      {
        id: 3,
        name: "Sector 3",
        startPoint: { lat: 52.0745, lng: -1.015 },
        endPoint: { lat: 52.0786, lng: -1.0169 },
        length: 1900,
        type: "complex",
        difficulty: "medium",
      },
    ],
    trackMap: generateTrackMap("silverstone", 5891),
    pitLane: {
      entry: { lat: 52.078, lng: -1.0175 },
      exit: { lat: 52.0785, lng: -1.017 },
      speedLimit: 80,
      boxes: [
        { lat: 52.0782, lng: -1.0172 },
        { lat: 52.0783, lng: -1.0171 },
      ],
    },
    metadata: {
      length: 5891,
      elevation: 15,
      surface: "asphalt",
      direction: "clockwise",
      lapRecord: {
        time: 85862, // 1:25.862
        driver: "Lewis Hamilton",
        vehicle: "Mercedes W11",
        year: 2020,
      },
      safety: {
        fiaGrade: "1",
        barriers: ["tecpro", "armco"],
        runoffAreas: true,
      },
      facilities: {
        pitBoxes: 30,
        grandstands: 12,
        capacity: 150000,
      },
    },
    weatherZones: [
      {
        id: "main",
        name: "Main Circuit",
        coordinates: { lat: 52.0786, lng: -1.0169 },
        radius: 2000,
      },
    ],
    timezone: "Europe/London",
    website: "https://www.silverstone.co.uk",
    established: 1948,
  },

  {
    id: "spa-francorchamps",
    name: "Circuit de Spa-Francorchamps",
    shortName: "Spa",
    country: "Belgium",
    region: "Europe",
    city: "Spa",
    type: "formula1",
    category: "professional",
    startFinishLine: {
      point1: { lat: 50.4372, lng: 5.9714, elevation: 400 },
      point2: { lat: 50.437, lng: 5.971, elevation: 400 },
      bearing: 90,
      width: 15,
    },
    sectors: [
      {
        id: 1,
        name: "Eau Rouge Complex",
        startPoint: { lat: 50.4372, lng: 5.9714 },
        endPoint: { lat: 50.4425, lng: 5.9801 },
        length: 2344,
        type: "complex",
        difficulty: "extreme",
      },
      {
        id: 2,
        name: "Les Combes to Pouhon",
        startPoint: { lat: 50.4425, lng: 5.9801 },
        endPoint: { lat: 50.4321, lng: 6.0089 },
        length: 2493,
        type: "complex",
        difficulty: "hard",
      },
      {
        id: 3,
        name: "Stavelot to La Source",
        startPoint: { lat: 50.4321, lng: 6.0089 },
        endPoint: { lat: 50.4372, lng: 5.9714 },
        length: 2167,
        type: "complex",
        difficulty: "medium",
      },
    ],
    trackMap: generateTrackMap("spa", 7004),
    metadata: {
      length: 7004,
      elevation: 100,
      surface: "asphalt",
      direction: "clockwise",
      lapRecord: {
        time: 103693, // 1:43.693
        driver: "Valtteri Bottas",
        vehicle: "Mercedes W11",
        year: 2020,
      },
      safety: {
        fiaGrade: "1",
        barriers: ["tecpro", "armco", "tire"],
        runoffAreas: true,
      },
      facilities: {
        pitBoxes: 30,
        grandstands: 8,
        capacity: 70000,
      },
    },
    weatherZones: [
      {
        id: "eau_rouge",
        name: "Eau Rouge",
        coordinates: { lat: 50.4425, lng: 5.9801 },
        radius: 1000,
      },
      {
        id: "les_combes",
        name: "Les Combes",
        coordinates: { lat: 50.4321, lng: 6.0089 },
        radius: 1000,
      },
    ],
    timezone: "Europe/Brussels",
    website: "https://www.spa-francorchamps.be",
    established: 1921,
  },

  {
    id: "monza",
    name: "Autodromo Nazionale di Monza",
    shortName: "Monza",
    country: "Italy",
    region: "Europe",
    city: "Monza",
    type: "formula1",
    category: "professional",
    startFinishLine: {
      point1: { lat: 45.6156, lng: 9.2811, elevation: 162 },
      point2: { lat: 45.6154, lng: 9.2809, elevation: 162 },
      bearing: 0,
      width: 15,
    },
    sectors: [
      {
        id: 1,
        name: "Curva Grande Complex",
        startPoint: { lat: 45.6156, lng: 9.2811 },
        endPoint: { lat: 45.6189, lng: 9.2756 },
        length: 1932,
        type: "straight",
        difficulty: "medium",
      },
      {
        id: 2,
        name: "Lesmo Complex",
        startPoint: { lat: 45.6189, lng: 9.2756 },
        endPoint: { lat: 45.6078, lng: 9.2701 },
        length: 1839,
        type: "complex",
        difficulty: "hard",
      },
      {
        id: 3,
        name: "Parabolica",
        startPoint: { lat: 45.6078, lng: 9.2701 },
        endPoint: { lat: 45.6156, lng: 9.2811 },
        length: 2022,
        type: "corner",
        difficulty: "medium",
      },
    ],
    trackMap: generateTrackMap("monza", 5793),
    metadata: {
      length: 5793,
      elevation: 8,
      surface: "asphalt",
      direction: "clockwise",
      lapRecord: {
        time: 79350, // 1:19.350
        driver: "Rubens Barrichello",
        vehicle: "Ferrari F2004",
        year: 2004,
      },
      safety: {
        fiaGrade: "1",
        barriers: ["tecpro", "armco"],
        runoffAreas: true,
      },
      facilities: {
        pitBoxes: 30,
        grandstands: 6,
        capacity: 113860,
      },
    },
    weatherZones: [
      {
        id: "main",
        name: "Main Circuit",
        coordinates: { lat: 45.6156, lng: 9.2811 },
        radius: 1500,
      },
    ],
    timezone: "Europe/Rome",
    website: "https://www.monzanet.it",
    established: 1922,
  },

  {
    id: "monaco",
    name: "Circuit de Monaco",
    shortName: "Monaco",
    country: "Monaco",
    region: "Europe",
    city: "Monaco",
    type: "formula1",
    category: "professional",
    startFinishLine: {
      point1: { lat: 43.7347, lng: 7.4206, elevation: 50 },
      point2: { lat: 43.7345, lng: 7.4204, elevation: 50 },
      bearing: 45,
      width: 12,
    },
    sectors: [
      {
        id: 1,
        name: "Sainte Devote to Massenet",
        startPoint: { lat: 43.7347, lng: 7.4206 },
        endPoint: { lat: 43.7375, lng: 7.425 },
        length: 1051,
        type: "complex",
        difficulty: "extreme",
      },
      {
        id: 2,
        name: "Casino to Swimming Pool",
        startPoint: { lat: 43.7375, lng: 7.425 },
        endPoint: { lat: 43.734, lng: 7.425 },
        length: 1136,
        type: "complex",
        difficulty: "extreme",
      },
      {
        id: 3,
        name: "Rascasse to Start/Finish",
        startPoint: { lat: 43.734, lng: 7.425 },
        endPoint: { lat: 43.7347, lng: 7.4206 },
        length: 1077,
        type: "complex",
        difficulty: "hard",
      },
    ],
    trackMap: generateTrackMap("monaco", 3264),
    metadata: {
      length: 3264,
      elevation: 42,
      surface: "asphalt",
      direction: "clockwise",
      lapRecord: {
        time: 70166, // 1:10.166
        driver: "Lewis Hamilton",
        vehicle: "Mercedes W11",
        year: 2021,
      },
      safety: {
        fiaGrade: "1",
        barriers: ["armco", "concrete"],
        runoffAreas: false,
      },
      facilities: {
        pitBoxes: 24,
        grandstands: 4,
        capacity: 37000,
      },
    },
    weatherZones: [
      {
        id: "harbor",
        name: "Harbor Section",
        coordinates: { lat: 43.734, lng: 7.425 },
        radius: 500,
      },
    ],
    timezone: "Europe/Monaco",
    website: "https://www.acm.mc",
    established: 1929,
  },

  {
    id: "suzuka",
    name: "Suzuka International Racing Course",
    shortName: "Suzuka",
    country: "Japan",
    region: "Asia",
    city: "Suzuka",
    type: "formula1",
    category: "professional",
    startFinishLine: {
      point1: { lat: 34.8431, lng: 136.5407, elevation: 45 },
      point2: { lat: 34.8429, lng: 136.5405, elevation: 45 },
      bearing: 270,
      width: 15,
    },
    sectors: [
      {
        id: 1,
        name: "S Curves to Dunlop",
        startPoint: { lat: 34.8431, lng: 136.5407 },
        endPoint: { lat: 34.849, lng: 136.5485 },
        length: 1641,
        type: "complex",
        difficulty: "hard",
      },
      {
        id: 2,
        name: "Degner to Spoon",
        startPoint: { lat: 34.849, lng: 136.5485 },
        endPoint: { lat: 34.842, lng: 136.5515 },
        length: 1983,
        type: "complex",
        difficulty: "extreme",
      },
      {
        id: 3,
        name: "130R to Chicane",
        startPoint: { lat: 34.842, lng: 136.5515 },
        endPoint: { lat: 34.8431, lng: 136.5407 },
        length: 2139,
        type: "complex",
        difficulty: "extreme",
      },
    ],
    trackMap: generateTrackMap("suzuka", 5763),
    metadata: {
      length: 5763,
      elevation: 35,
      surface: "asphalt",
      direction: "clockwise",
      lapRecord: {
        time: 90983, // 1:30.983
        driver: "Lewis Hamilton",
        vehicle: "Mercedes W11",
        year: 2019,
      },
      safety: {
        fiaGrade: "1",
        barriers: ["tecpro", "armco", "tire"],
        runoffAreas: true,
      },
      facilities: {
        pitBoxes: 30,
        grandstands: 10,
        capacity: 155000,
      },
    },
    weatherZones: [
      {
        id: "main",
        name: "Main Circuit",
        coordinates: { lat: 34.8431, lng: 136.5407 },
        radius: 2000,
      },
    ],
    timezone: "Asia/Tokyo",
    website: "https://www.suzukacircuit.jp",
    established: 1962,
  },

  // MotoGP Circuits
  {
    id: "jerez",
    name: "Circuito de Jerez",
    shortName: "Jerez",
    country: "Spain",
    region: "Europe",
    city: "Jerez de la Frontera",
    type: "motogp",
    category: "professional",
    startFinishLine: {
      point1: { lat: 36.7085, lng: -6.0336, elevation: 95 },
      point2: { lat: 36.7083, lng: -6.0334, elevation: 95 },
      bearing: 180,
      width: 12,
    },
    sectors: [
      {
        id: 1,
        name: "Lorenzo Corner",
        startPoint: { lat: 36.7085, lng: -6.0336 },
        endPoint: { lat: 36.7095, lng: -6.035 },
        length: 1465,
        type: "complex",
        difficulty: "medium",
      },
      {
        id: 2,
        name: "Angel Nieto Corner",
        startPoint: { lat: 36.7095, lng: -6.035 },
        endPoint: { lat: 36.7075, lng: -6.0365 },
        length: 1574,
        type: "complex",
        difficulty: "hard",
      },
      {
        id: 3,
        name: "Peluqui to Start",
        startPoint: { lat: 36.7075, lng: -6.0365 },
        endPoint: { lat: 36.7085, lng: -6.0336 },
        length: 1575,
        type: "complex",
        difficulty: "medium",
      },
    ],
    trackMap: generateTrackMap("jerez", 4614),
    metadata: {
      length: 4614,
      elevation: 25,
      surface: "asphalt",
      direction: "clockwise",
      lapRecord: {
        time: 98469, // 1:38.469
        driver: "Fabio Quartararo",
        vehicle: "Yamaha YZR-M1",
        year: 2020,
      },
      safety: {
        fiaGrade: "1",
        barriers: ["armco", "tire"],
        runoffAreas: true,
      },
      facilities: {
        pitBoxes: 40,
        grandstands: 8,
        capacity: 90000,
      },
    },
    weatherZones: [
      {
        id: "main",
        name: "Main Circuit",
        coordinates: { lat: 36.7085, lng: -6.0336 },
        radius: 1500,
      },
    ],
    timezone: "Europe/Madrid",
    website: "https://www.circuitodejerez.com",
    established: 1985,
  },

  // IndyCar
  {
    id: "indianapolis",
    name: "Indianapolis Motor Speedway",
    shortName: "Indy 500",
    country: "United States",
    region: "North America",
    city: "Indianapolis",
    type: "indycar",
    category: "professional",
    startFinishLine: {
      point1: { lat: 39.7951, lng: -86.2348, elevation: 223 },
      point2: { lat: 39.7949, lng: -86.2346, elevation: 223 },
      bearing: 0,
      width: 15,
    },
    sectors: [
      {
        id: 1,
        name: "Turn 1",
        startPoint: { lat: 39.7951, lng: -86.2348 },
        endPoint: { lat: 39.7965, lng: -86.2365 },
        length: 1006,
        type: "corner",
        difficulty: "extreme",
      },
      {
        id: 2,
        name: "Turn 2",
        startPoint: { lat: 39.7965, lng: -86.2365 },
        endPoint: { lat: 39.7975, lng: -86.2355 },
        length: 1006,
        type: "corner",
        difficulty: "extreme",
      },
      {
        id: 3,
        name: "Turn 3",
        startPoint: { lat: 39.7975, lng: -86.2355 },
        endPoint: { lat: 39.7965, lng: -86.234 },
        length: 1006,
        type: "corner",
        difficulty: "extreme",
      },
      {
        id: 4,
        name: "Turn 4",
        startPoint: { lat: 39.7965, lng: -86.234 },
        endPoint: { lat: 39.7951, lng: -86.2348 },
        length: 1006,
        type: "corner",
        difficulty: "extreme",
      },
    ],
    trackMap: generateTrackMap("indianapolis", 4024),
    metadata: {
      length: 4024,
      elevation: 3,
      surface: "asphalt",
      direction: "counterclockwise",
      lapRecord: {
        time: 37616, // 37.616 seconds (average speed 385+ km/h)
        driver: "Arie Luyendyk",
        vehicle: "Reynard 97I",
        year: 1996,
      },
      safety: {
        fiaGrade: "1",
        barriers: ["concrete", "tecpro"],
        runoffAreas: true,
      },
      facilities: {
        pitBoxes: 33,
        grandstands: 25,
        capacity: 350000,
      },
    },
    weatherZones: [
      {
        id: "oval",
        name: "Oval Track",
        coordinates: { lat: 39.7951, lng: -86.2348 },
        radius: 1500,
      },
    ],
    timezone: "America/New_York",
    website: "https://www.indianapolismotorspeedway.com",
    established: 1909,
  },

  // NASCAR
  {
    id: "daytona",
    name: "Daytona International Speedway",
    shortName: "Daytona",
    country: "United States",
    region: "North America",
    city: "Daytona Beach",
    type: "nascar",
    category: "professional",
    startFinishLine: {
      point1: { lat: 29.1864, lng: -81.0715, elevation: 15 },
      point2: { lat: 29.1862, lng: -81.0713, elevation: 15 },
      bearing: 90,
      width: 18,
    },
    sectors: [
      {
        id: 1,
        name: "Turn 1 & 2",
        startPoint: { lat: 29.1864, lng: -81.0715 },
        endPoint: { lat: 29.189, lng: -81.0735 },
        length: 1207,
        type: "corner",
        difficulty: "extreme",
      },
      {
        id: 2,
        name: "Backstretch",
        startPoint: { lat: 29.189, lng: -81.0735 },
        endPoint: { lat: 29.189, lng: -81.0685 },
        length: 945,
        type: "straight",
        difficulty: "extreme",
      },
      {
        id: 3,
        name: "Turn 3 & 4",
        startPoint: { lat: 29.189, lng: -81.0685 },
        endPoint: { lat: 29.1864, lng: -81.0705 },
        length: 1207,
        type: "corner",
        difficulty: "extreme",
      },
      {
        id: 4,
        name: "Frontstretch",
        startPoint: { lat: 29.1864, lng: -81.0705 },
        endPoint: { lat: 29.1864, lng: -81.0715 },
        length: 1158,
        type: "straight",
        difficulty: "extreme",
      },
    ],
    trackMap: generateTrackMap("daytona", 4517),
    metadata: {
      length: 4517,
      elevation: 6,
      surface: "asphalt",
      direction: "counterclockwise",
      lapRecord: {
        time: 51998, // 51.998 seconds (qualifying)
        driver: "Bill Elliott",
        vehicle: "Ford Thunderbird",
        year: 1987,
      },
      safety: {
        barriers: ["concrete", "armco"],
        runoffAreas: true,
      },
      facilities: {
        pitBoxes: 43,
        grandstands: 15,
        capacity: 101500,
      },
    },
    weatherZones: [
      {
        id: "oval",
        name: "Oval Track",
        coordinates: { lat: 29.1864, lng: -81.0715 },
        radius: 1200,
      },
    ],
    timezone: "America/New_York",
    website: "https://www.daytonainternationalspeedway.com",
    established: 1959,
  },

  // Finnish Racing Circuits
  {
    id: "kymiring",
    name: "KymiRing",
    shortName: "KymiRing",
    country: "Finland",
    region: "Europe",
    city: "Iitti",
    type: "motogp",
    category: "professional",
    startFinishLine: {
      point1: { lat: 60.8851, lng: 26.5447, elevation: 85 },
      point2: { lat: 60.8849, lng: 26.5445, elevation: 85 },
      bearing: 180,
      width: 15,
    },
    sectors: [
      {
        id: 1,
        name: "Start Complex",
        startPoint: { lat: 60.8851, lng: 26.5447 },
        endPoint: { lat: 60.8865, lng: 26.5465 },
        length: 1397,
        type: "complex",
        difficulty: "medium",
      },
      {
        id: 2,
        name: "Forest Section",
        startPoint: { lat: 60.8865, lng: 26.5465 },
        endPoint: { lat: 60.8835, lng: 26.5495 },
        length: 1456,
        type: "complex",
        difficulty: "hard",
      },
      {
        id: 3,
        name: "Stadium Complex",
        startPoint: { lat: 60.8835, lng: 26.5495 },
        endPoint: { lat: 60.8851, lng: 26.5447 },
        length: 1771,
        type: "complex",
        difficulty: "medium",
      },
    ],
    trackMap: generateTrackMap("kymiring", 4624),
    pitLane: {
      entry: { lat: 60.8845, lng: 26.544 },
      exit: { lat: 60.8855, lng: 26.5445 },
      speedLimit: 60,
      boxes: [
        { lat: 60.8847, lng: 26.5442 },
        { lat: 60.8849, lng: 26.5443 },
      ],
    },
    metadata: {
      length: 4624,
      elevation: 35,
      surface: "asphalt",
      direction: "clockwise",
      lapRecord: {
        time: 105234, // 1:45.234 (estimated MotoGP time)
        driver: "Test Rider",
        vehicle: "MotoGP",
        year: 2019,
      },
      safety: {
        fiaGrade: "1",
        barriers: ["tecpro", "armco", "tire"],
        runoffAreas: true,
      },
      facilities: {
        pitBoxes: 40,
        grandstands: 8,
        capacity: 50000,
      },
    },
    weatherZones: [
      {
        id: "main_circuit",
        name: "Main Circuit",
        coordinates: { lat: 60.8851, lng: 26.5447 },
        radius: 1500,
      },
      {
        id: "forest_section",
        name: "Forest Section",
        coordinates: { lat: 60.8865, lng: 26.5465 },
        radius: 800,
      },
    ],
    timezone: "Europe/Helsinki",
    website: "https://www.kymiring.fi",
    established: 2019,
  },

  {
    id: "ahvenisto",
    name: "Ahvenisto Hämeenlinna",
    shortName: "Ahvenisto",
    country: "Finland",
    region: "Europe",
    city: "Hämeenlinna",
    type: "circuit",
    category: "professional",
    startFinishLine: {
      point1: { lat: 61.0156, lng: 24.4789, elevation: 105 },
      point2: { lat: 61.0154, lng: 24.4787, elevation: 105 },
      bearing: 90,
      width: 12,
    },
    sectors: [
      {
        id: 1,
        name: "Main Straight",
        startPoint: { lat: 61.0156, lng: 24.4789 },
        endPoint: { lat: 61.0165, lng: 24.4805 },
        length: 945,
        type: "straight",
        difficulty: "easy",
      },
      {
        id: 2,
        name: "Technical Section",
        startPoint: { lat: 61.0165, lng: 24.4805 },
        endPoint: { lat: 61.0145, lng: 24.4815 },
        length: 1134,
        type: "complex",
        difficulty: "hard",
      },
      {
        id: 3,
        name: "Back Straight",
        startPoint: { lat: 61.0145, lng: 24.4815 },
        endPoint: { lat: 61.0156, lng: 24.4789 },
        length: 1121,
        type: "complex",
        difficulty: "medium",
      },
    ],
    trackMap: generateTrackMap("ahvenisto", 3200),
    metadata: {
      length: 3200,
      elevation: 15,
      surface: "asphalt",
      direction: "clockwise",
      lapRecord: {
        time: 78560, // 1:18.560 (estimated touring car time)
        driver: "Local Champion",
        vehicle: "Touring Car",
        year: 2023,
      },
      safety: {
        fiaGrade: "3",
        barriers: ["armco", "tire"],
        runoffAreas: true,
      },
      facilities: {
        pitBoxes: 20,
        grandstands: 3,
        capacity: 15000,
      },
    },
    weatherZones: [
      {
        id: "main_circuit",
        name: "Main Circuit",
        coordinates: { lat: 61.0156, lng: 24.4789 },
        radius: 1000,
      },
    ],
    timezone: "Europe/Helsinki",
    website: "https://www.ahvenisto.fi",
    established: 1967,
  },

  {
    id: "alastaro",
    name: "Alastaro Circuit",
    shortName: "Alastaro",
    country: "Finland",
    region: "Europe",
    city: "Alastaro",
    type: "circuit",
    category: "professional",
    startFinishLine: {
      point1: { lat: 60.9523, lng: 23.0234, elevation: 45 },
      point2: { lat: 60.9521, lng: 23.0232, elevation: 45 },
      bearing: 270,
      width: 12,
    },
    sectors: [
      {
        id: 1,
        name: "Main Straight Complex",
        startPoint: { lat: 60.9523, lng: 23.0234 },
        endPoint: { lat: 60.9535, lng: 23.0255 },
        length: 1567,
        type: "complex",
        difficulty: "medium",
      },
      {
        id: 2,
        name: "Technical Esses",
        startPoint: { lat: 60.9535, lng: 23.0255 },
        endPoint: { lat: 60.951, lng: 23.0275 },
        length: 1633,
        type: "complex",
        difficulty: "hard",
      },
      {
        id: 3,
        name: "Stadium Section",
        startPoint: { lat: 60.951, lng: 23.0275 },
        endPoint: { lat: 60.9523, lng: 23.0234 },
        length: 1400,
        type: "complex",
        difficulty: "medium",
      },
    ],
    trackMap: generateTrackMap("alastaro", 4600),
    metadata: {
      length: 4600,
      elevation: 25,
      surface: "asphalt",
      direction: "clockwise",
      lapRecord: {
        time: 96789, // 1:36.789 (estimated GT time)
        driver: "Finnish Champion",
        vehicle: "GT3",
        year: 2022,
      },
      safety: {
        fiaGrade: "2",
        barriers: ["tecpro", "armco", "tire"],
        runoffAreas: true,
      },
      facilities: {
        pitBoxes: 25,
        grandstands: 5,
        capacity: 25000,
      },
    },
    weatherZones: [
      {
        id: "main_circuit",
        name: "Main Circuit",
        coordinates: { lat: 60.9523, lng: 23.0234 },
        radius: 1200,
      },
    ],
    timezone: "Europe/Helsinki",
    website: "https://www.alastaro.fi",
    established: 1991,
  },

  {
    id: "botniaring",
    name: "BotniaMRing",
    shortName: "BotniaMRing",
    country: "Finland",
    region: "Europe",
    city: "Uurainen",
    type: "circuit",
    category: "club",
    startFinishLine: {
      point1: { lat: 62.5012, lng: 25.4456, elevation: 125 },
      point2: { lat: 62.501, lng: 25.4454, elevation: 125 },
      bearing: 45,
      width: 10,
    },
    sectors: [
      {
        id: 1,
        name: "Start Section",
        startPoint: { lat: 62.5012, lng: 25.4456 },
        endPoint: { lat: 62.5025, lng: 25.4475 },
        length: 845,
        type: "complex",
        difficulty: "medium",
      },
      {
        id: 2,
        name: "Forest Complex",
        startPoint: { lat: 62.5025, lng: 25.4475 },
        endPoint: { lat: 62.4995, lng: 25.4485 },
        length: 1255,
        type: "complex",
        difficulty: "hard",
      },
      {
        id: 3,
        name: "Back to Start",
        startPoint: { lat: 62.4995, lng: 25.4485 },
        endPoint: { lat: 62.5012, lng: 25.4456 },
        length: 900,
        type: "complex",
        difficulty: "medium",
      },
    ],
    trackMap: generateTrackMap("botniaring", 3000),
    metadata: {
      length: 3000,
      elevation: 20,
      surface: "asphalt",
      direction: "clockwise",
      lapRecord: {
        time: 72345, // 1:12.345 (estimated club racing time)
        driver: "Club Champion",
        vehicle: "Club Racer",
        year: 2023,
      },
      safety: {
        barriers: ["armco", "tire"],
        runoffAreas: true,
      },
      facilities: {
        pitBoxes: 15,
        grandstands: 2,
        capacity: 5000,
      },
    },
    weatherZones: [
      {
        id: "circuit",
        name: "Circuit",
        coordinates: { lat: 62.5012, lng: 25.4456 },
        radius: 800,
      },
    ],
    timezone: "Europe/Helsinki",
    website: "https://www.botniamring.fi",
    established: 2008,
  },

  {
    id: "powerpark",
    name: "PowerPark Raceway",
    shortName: "PowerPark",
    country: "Finland",
    region: "Europe",
    city: "Alahärmä",
    type: "karting",
    category: "club",
    startFinishLine: {
      point1: { lat: 63.2345, lng: 23.1567, elevation: 55 },
      point2: { lat: 63.2343, lng: 23.1565, elevation: 55 },
      bearing: 0,
      width: 8,
    },
    sectors: [
      {
        id: 1,
        name: "Main Complex",
        startPoint: { lat: 63.2345, lng: 23.1567 },
        endPoint: { lat: 63.2355, lng: 23.158 },
        length: 456,
        type: "complex",
        difficulty: "medium",
      },
      {
        id: 2,
        name: "Technical Section",
        startPoint: { lat: 63.2355, lng: 23.158 },
        endPoint: { lat: 63.2335, lng: 23.1585 },
        length: 534,
        type: "complex",
        difficulty: "hard",
      },
      {
        id: 3,
        name: "Speed Section",
        startPoint: { lat: 63.2335, lng: 23.1585 },
        endPoint: { lat: 63.2345, lng: 23.1567 },
        length: 410,
        type: "straight",
        difficulty: "easy",
      },
    ],
    trackMap: generateTrackMap("powerpark", 1400),
    metadata: {
      length: 1400,
      elevation: 8,
      surface: "asphalt",
      direction: "clockwise",
      lapRecord: {
        time: 47890, // 47.890 seconds (karting)
        driver: "Karting Champion",
        vehicle: "Racing Kart",
        year: 2023,
      },
      safety: {
        barriers: ["tire", "armco"],
        runoffAreas: true,
      },
      facilities: {
        pitBoxes: 20,
        grandstands: 1,
        capacity: 2000,
      },
    },
    weatherZones: [
      {
        id: "karting_track",
        name: "Karting Track",
        coordinates: { lat: 63.2345, lng: 23.1567 },
        radius: 400,
      },
    ],
    timezone: "Europe/Helsinki",
    website: "https://www.powerpark.fi",
    established: 2005,
  },

  // Club Racing / Autocross
  {
    id: "autocross-generic",
    name: "Generic Autocross Course",
    shortName: "Autocross",
    country: "Various",
    region: "Global",
    city: "Various",
    type: "autocross",
    category: "club",
    startFinishLine: {
      point1: { lat: 0, lng: 0, elevation: 0 },
      point2: { lat: 0, lng: 0, elevation: 0 },
      bearing: 0,
      width: 8,
    },
    sectors: [
      {
        id: 1,
        name: "Section 1",
        startPoint: { lat: 0, lng: 0 },
        endPoint: { lat: 0, lng: 0 },
        length: 250,
        type: "complex",
        difficulty: "medium",
      },
      {
        id: 2,
        name: "Section 2",
        startPoint: { lat: 0, lng: 0 },
        endPoint: { lat: 0, lng: 0 },
        length: 300,
        type: "complex",
        difficulty: "hard",
      },
      {
        id: 3,
        name: "Section 3",
        startPoint: { lat: 0, lng: 0 },
        endPoint: { lat: 0, lng: 0 },
        length: 250,
        type: "complex",
        difficulty: "medium",
      },
    ],
    trackMap: generateTrackMap("autocross", 800),
    metadata: {
      length: 800,
      elevation: 5,
      surface: "asphalt",
      direction: "clockwise",
      safety: {
        barriers: ["tire", "concrete"],
        runoffAreas: false,
      },
      facilities: {
        pitBoxes: 0,
        grandstands: 0,
        capacity: 500,
      },
    },
    weatherZones: [
      {
        id: "course",
        name: "Autocross Course",
        coordinates: { lat: 0, lng: 0 },
        radius: 500,
      },
    ],
    timezone: "UTC",
    established: 1950,
  },

  // Karting
  {
    id: "karting-cik",
    name: "CIK-FIA Karting Track",
    shortName: "Karting",
    country: "Various",
    region: "Global",
    city: "Various",
    type: "karting",
    category: "professional",
    startFinishLine: {
      point1: { lat: 0, lng: 0, elevation: 0 },
      point2: { lat: 0, lng: 0, elevation: 0 },
      bearing: 0,
      width: 8,
    },
    sectors: [
      {
        id: 1,
        name: "Technical Section",
        startPoint: { lat: 0, lng: 0 },
        endPoint: { lat: 0, lng: 0 },
        length: 400,
        type: "complex",
        difficulty: "hard",
      },
      {
        id: 2,
        name: "High Speed Section",
        startPoint: { lat: 0, lng: 0 },
        endPoint: { lat: 0, lng: 0 },
        length: 450,
        type: "straight",
        difficulty: "medium",
      },
      {
        id: 3,
        name: "Chicane Complex",
        startPoint: { lat: 0, lng: 0 },
        endPoint: { lat: 0, lng: 0 },
        length: 350,
        type: "chicane",
        difficulty: "hard",
      },
    ],
    trackMap: generateTrackMap("karting", 1200),
    metadata: {
      length: 1200,
      elevation: 8,
      surface: "asphalt",
      direction: "clockwise",
      safety: {
        barriers: ["tire", "armco"],
        runoffAreas: true,
      },
      facilities: {
        pitBoxes: 40,
        grandstands: 4,
        capacity: 5000,
      },
    },
    weatherZones: [
      {
        id: "track",
        name: "Karting Track",
        coordinates: { lat: 0, lng: 0 },
        radius: 800,
      },
    ],
    timezone: "UTC",
    established: 1960,
  },
];

// Export track database organized by type
export const TRACKS_BY_TYPE = {
  formula1: RACING_TRACKS.filter((track) => track.type === "formula1"),
  motogp: RACING_TRACKS.filter((track) => track.type === "motogp"),
  indycar: RACING_TRACKS.filter((track) => track.type === "indycar"),
  nascar: RACING_TRACKS.filter((track) => track.type === "nascar"),
  circuit: RACING_TRACKS.filter((track) => track.type === "circuit"),
  autocross: RACING_TRACKS.filter((track) => track.type === "autocross"),
  karting: RACING_TRACKS.filter((track) => track.type === "karting"),
  hillclimb: RACING_TRACKS.filter((track) => track.type === "hillclimb"),
  drag: RACING_TRACKS.filter((track) => track.type === "drag"),
  rally: RACING_TRACKS.filter((track) => track.type === "rally"),
  drifting: RACING_TRACKS.filter((track) => track.type === "drifting"),
};

export const TRACKS_BY_REGION = {
  Europe: RACING_TRACKS.filter((track) => track.region === "Europe"),
  "North America": RACING_TRACKS.filter(
    (track) => track.region === "North America",
  ),
  Asia: RACING_TRACKS.filter((track) => track.region === "Asia"),
  "South America": RACING_TRACKS.filter(
    (track) => track.region === "South America",
  ),
  Africa: RACING_TRACKS.filter((track) => track.region === "Africa"),
  Oceania: RACING_TRACKS.filter((track) => track.region === "Oceania"),
  Global: RACING_TRACKS.filter((track) => track.region === "Global"),
};

export default RACING_TRACKS;
