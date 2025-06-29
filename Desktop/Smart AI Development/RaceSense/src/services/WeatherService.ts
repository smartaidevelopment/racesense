interface WeatherCondition {
  temperature: number; // Celsius
  humidity: number; // percentage
  windSpeed: number; // m/s
  windDirection: number; // degrees
  pressure: number; // hPa
  description: string;
  visibility: number; // meters
  uvIndex: number;
  cloudCover: number; // percentage
}

interface TrackWeather extends WeatherCondition {
  trackTemperature: number; // estimated track surface temperature
  gripLevel: number; // 0-100, estimated grip based on conditions
  rainProbability: number; // percentage
  recommendedTires: "dry" | "intermediate" | "wet";
  timestamp: number;
  location: {
    name: string;
    lat: number;
    lng: number;
  };
}

interface WeatherForecast {
  current: TrackWeather;
  hourly: TrackWeather[];
  alerts: WeatherAlert[];
}

interface WeatherAlert {
  type: "rain" | "wind" | "temperature" | "visibility";
  severity: "low" | "medium" | "high";
  title: string;
  description: string;
  timeWindow: {
    start: number;
    end: number;
  };
}

// Racing track locations for weather data
const TRACK_LOCATIONS = {
  silverstone: { name: "Silverstone Circuit", lat: 52.0707, lng: -1.0174 },
  spa: { name: "Spa-Francorchamps", lat: 50.4372, lng: 5.9714 },
  monza: { name: "Monza", lat: 45.6156, lng: 9.2811 },
  nurburgring: { name: "Nürburgring", lat: 50.3356, lng: 6.9475 },
  suzuka: { name: "Suzuka", lat: 34.8431, lng: 136.5409 },
  interlagos: { name: "Interlagos", lat: -23.7036, lng: -46.6997 },
  monaco: { name: "Monaco", lat: 43.7347, lng: 7.4206 },
};

type WeatherListener = (weather: TrackWeather) => void;
type AlertListener = (alert: WeatherAlert) => void;

class WeatherService {
  private currentWeather: TrackWeather | null = null;
  private forecast: WeatherForecast | null = null;
  private updateInterval: NodeJS.Timeout | null = null;
  private currentLocation: { lat: number; lng: number; name: string } | null =
    null;

  private weatherListeners: WeatherListener[] = [];
  private alertListeners: AlertListener[] = [];

  // OpenWeatherMap API (free tier)
  private readonly API_KEY = "demo_key"; // In production, use environment variable
  private readonly BASE_URL = "https://api.openweathermap.org/data/2.5";

  constructor() {
    this.startWeatherUpdates();
  }

  // Set location for weather tracking
  setLocation(trackName: string): void {
    const location = TRACK_LOCATIONS[trackName as keyof typeof TRACK_LOCATIONS];
    if (location) {
      this.currentLocation = location;
      this.fetchWeatherData();
    }
  }

  // Auto-detect location using GPS
  async autoDetectLocation(): Promise<void> {
    if (!navigator.geolocation) {
      throw new Error("Geolocation not available");
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.currentLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            name: "Current Location",
          };
          this.fetchWeatherData();
          resolve();
        },
        (error) =>
          reject(new Error(`Location detection failed: ${error.message}`)),
        { enableHighAccuracy: true, timeout: 10000 },
      );
    });
  }

  // Start automatic weather updates
  private startWeatherUpdates(): void {
    // Update every 10 minutes
    this.updateInterval = setInterval(
      () => {
        if (this.currentLocation) {
          this.fetchWeatherData();
        }
      },
      10 * 60 * 1000,
    );
  }

  // Fetch weather data from API
  private async fetchWeatherData(): Promise<void> {
    if (!this.currentLocation) return;

    try {
      // For demo purposes, we'll simulate weather data
      // In production, replace with actual API calls
      const simulatedWeather = this.generateSimulatedWeather();
      this.currentWeather = simulatedWeather;

      // Create forecast
      this.forecast = {
        current: simulatedWeather,
        hourly: this.generateHourlyForecast(),
        alerts: this.checkWeatherAlerts(simulatedWeather),
      };

      // Notify listeners
      this.notifyWeatherListeners(simulatedWeather);

      // Check for alerts
      this.forecast.alerts.forEach((alert) => {
        this.notifyAlertListeners(alert);
      });

      console.log(`Weather updated for ${this.currentLocation.name}`);
    } catch (error) {
      console.error("Weather fetch failed:", error);
      // Fallback to simulated data
      this.fallbackToSimulatedWeather();
    }
  }

  // Generate realistic weather simulation for demo
  private generateSimulatedWeather(): TrackWeather {
    if (!this.currentLocation) {
      throw new Error("No location set");
    }

    // Base weather varies by location and time
    const now = new Date();
    const hour = now.getHours();
    const season = this.getSeason();

    // Temperature varies by location, season, and time of day
    let baseTemp = 20; // Default
    if (this.currentLocation.name.includes("Monaco")) baseTemp = 25;
    if (this.currentLocation.name.includes("Interlagos")) baseTemp = 28;
    if (this.currentLocation.name.includes("Silverstone")) baseTemp = 15;
    if (this.currentLocation.name.includes("Spa")) baseTemp = 12;

    // Seasonal adjustment
    if (season === "winter") baseTemp -= 10;
    if (season === "summer") baseTemp += 5;

    // Daily temperature curve
    const tempVariation = 8 * Math.sin(((hour - 6) * Math.PI) / 12);
    const temperature = baseTemp + tempVariation + (Math.random() - 0.5) * 4;

    // Other weather parameters
    const humidity = 40 + Math.random() * 40; // 40-80%
    const windSpeed = Math.random() * 15; // 0-15 m/s
    const windDirection = Math.random() * 360;
    const pressure = 1013 + (Math.random() - 0.5) * 40; // ±20 hPa
    const cloudCover = Math.random() * 100;
    const visibility = 5000 + Math.random() * 15000; // 5-20km
    const uvIndex = Math.max(0, (hour - 6) * 0.8 * (1 - cloudCover / 100));

    // Calculate track temperature (usually 10-20°C higher than air)
    const trackTempIncrease = 10 + (hour > 12 ? 10 : 5) + Math.random() * 5;
    const trackTemperature = temperature + trackTempIncrease;

    // Determine conditions
    const rainChance = cloudCover > 70 ? (cloudCover - 70) / 30 : 0;
    let description = "Clear";
    if (cloudCover > 80) description = "Overcast";
    else if (cloudCover > 50) description = "Partly Cloudy";
    else if (cloudCover > 20) description = "Few Clouds";

    if (rainChance > 0.3) description = "Rain";
    else if (rainChance > 0.1) description = "Light Rain";

    // Calculate grip level (affected by temperature, rain, track temp)
    let gripLevel = 85; // Base grip
    if (trackTemperature < 10) gripLevel -= 20; // Cold track
    if (trackTemperature > 60) gripLevel -= 15; // Very hot track
    if (description.includes("Rain")) gripLevel -= 30;
    if (windSpeed > 10) gripLevel -= 5;
    gripLevel = Math.max(30, Math.min(100, gripLevel));

    // Tire recommendation
    let recommendedTires: "dry" | "intermediate" | "wet" = "dry";
    if (description.includes("Rain") && rainChance > 0.5)
      recommendedTires = "wet";
    else if (description.includes("Rain") || humidity > 80)
      recommendedTires = "intermediate";

    return {
      temperature: Math.round(temperature * 10) / 10,
      humidity: Math.round(humidity),
      windSpeed: Math.round(windSpeed * 10) / 10,
      windDirection: Math.round(windDirection),
      pressure: Math.round(pressure),
      description,
      visibility: Math.round(visibility),
      uvIndex: Math.round(uvIndex * 10) / 10,
      cloudCover: Math.round(cloudCover),
      trackTemperature: Math.round(trackTemperature * 10) / 10,
      gripLevel: Math.round(gripLevel),
      rainProbability: Math.round(rainChance * 100),
      recommendedTires,
      timestamp: Date.now(),
      location: this.currentLocation,
    };
  }

  private getSeason(): "spring" | "summer" | "autumn" | "winter" {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return "spring";
    if (month >= 5 && month <= 7) return "summer";
    if (month >= 8 && month <= 10) return "autumn";
    return "winter";
  }

  private generateHourlyForecast(): TrackWeather[] {
    const forecast: TrackWeather[] = [];
    const baseWeather = this.currentWeather!;

    for (let i = 1; i <= 12; i++) {
      // Simulate hourly changes
      const tempChange = (Math.random() - 0.5) * 4;
      const humidityChange = (Math.random() - 0.5) * 20;
      const windChange = (Math.random() - 0.5) * 5;

      const hourlyWeather: TrackWeather = {
        ...baseWeather,
        temperature: baseWeather.temperature + tempChange,
        humidity: Math.max(
          20,
          Math.min(100, baseWeather.humidity + humidityChange),
        ),
        windSpeed: Math.max(0, baseWeather.windSpeed + windChange),
        trackTemperature: baseWeather.trackTemperature + tempChange + 2,
        timestamp: baseWeather.timestamp + i * 60 * 60 * 1000,
      };

      // Recalculate dependent values
      hourlyWeather.gripLevel = this.calculateGripLevel(hourlyWeather);
      hourlyWeather.recommendedTires = this.recommendTires(hourlyWeather);

      forecast.push(hourlyWeather);
    }

    return forecast;
  }

  private calculateGripLevel(weather: TrackWeather): number {
    let grip = 85;
    if (weather.trackTemperature < 10) grip -= 20;
    if (weather.trackTemperature > 60) grip -= 15;
    if (weather.description.includes("Rain")) grip -= 30;
    if (weather.windSpeed > 10) grip -= 5;
    return Math.max(30, Math.min(100, grip));
  }

  private recommendTires(
    weather: TrackWeather,
  ): "dry" | "intermediate" | "wet" {
    if (weather.description.includes("Rain") && weather.rainProbability > 50)
      return "wet";
    if (weather.description.includes("Rain") || weather.humidity > 80)
      return "intermediate";
    return "dry";
  }

  private checkWeatherAlerts(weather: TrackWeather): WeatherAlert[] {
    const alerts: WeatherAlert[] = [];
    const now = Date.now();

    // Rain alert
    if (weather.rainProbability > 30) {
      alerts.push({
        type: "rain",
        severity: weather.rainProbability > 70 ? "high" : "medium",
        title: "Rain Expected",
        description: `${weather.rainProbability}% chance of rain. Consider tire strategy.`,
        timeWindow: { start: now, end: now + 60 * 60 * 1000 },
      });
    }

    // Wind alert
    if (weather.windSpeed > 12) {
      alerts.push({
        type: "wind",
        severity: weather.windSpeed > 18 ? "high" : "medium",
        title: "Strong Winds",
        description: `Wind speed: ${weather.windSpeed} m/s. May affect handling.`,
        timeWindow: { start: now, end: now + 2 * 60 * 60 * 1000 },
      });
    }

    // Temperature alert
    if (weather.trackTemperature > 55 || weather.trackTemperature < 15) {
      alerts.push({
        type: "temperature",
        severity:
          weather.trackTemperature > 65 || weather.trackTemperature < 10
            ? "high"
            : "medium",
        title:
          weather.trackTemperature > 55
            ? "High Track Temperature"
            : "Low Track Temperature",
        description: `Track temp: ${weather.trackTemperature}°C. Adjust tire pressures and setup.`,
        timeWindow: { start: now, end: now + 3 * 60 * 60 * 1000 },
      });
    }

    // Visibility alert
    if (weather.visibility < 5000) {
      alerts.push({
        type: "visibility",
        severity: weather.visibility < 2000 ? "high" : "medium",
        title: "Poor Visibility",
        description: `Visibility: ${(weather.visibility / 1000).toFixed(1)}km. Exercise caution.`,
        timeWindow: { start: now, end: now + 60 * 60 * 1000 },
      });
    }

    return alerts;
  }

  private fallbackToSimulatedWeather(): void {
    if (!this.currentLocation) return;

    console.warn("Using fallback weather data");
    this.currentWeather = this.generateSimulatedWeather();
    this.notifyWeatherListeners(this.currentWeather);
  }

  private notifyWeatherListeners(weather: TrackWeather): void {
    this.weatherListeners.forEach((listener) => {
      try {
        listener(weather);
      } catch (error) {
        console.warn("Weather listener error:", error);
      }
    });
  }

  private notifyAlertListeners(alert: WeatherAlert): void {
    this.alertListeners.forEach((listener) => {
      try {
        listener(alert);
      } catch (error) {
        console.warn("Alert listener error:", error);
      }
    });
  }

  // Public methods
  getCurrentWeather(): TrackWeather | null {
    return this.currentWeather;
  }

  getForecast(): WeatherForecast | null {
    return this.forecast;
  }

  getAvailableLocations(): typeof TRACK_LOCATIONS {
    return TRACK_LOCATIONS;
  }

  // Event listeners
  onWeatherUpdate(listener: WeatherListener): () => void {
    this.weatherListeners.push(listener);

    // Immediately call with current data if available
    if (this.currentWeather) {
      listener(this.currentWeather);
    }

    return () => {
      const index = this.weatherListeners.indexOf(listener);
      if (index > -1) this.weatherListeners.splice(index, 1);
    };
  }

  onWeatherAlert(listener: AlertListener): () => void {
    this.alertListeners.push(listener);
    return () => {
      const index = this.alertListeners.indexOf(listener);
      if (index > -1) this.alertListeners.splice(index, 1);
    };
  }

  // Manual refresh
  async refreshWeather(): Promise<void> {
    if (this.currentLocation) {
      await this.fetchWeatherData();
    }
  }

  // Cleanup
  destroy(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    this.weatherListeners = [];
    this.alertListeners = [];
  }
}

export const weatherService = new WeatherService();
export type { WeatherCondition, TrackWeather, WeatherForecast, WeatherAlert };
