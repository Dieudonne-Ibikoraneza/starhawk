// Example of enhanced forecast data from Meteosource API
// Based on: https://www.meteosource.com/api/v1/free/point?place_id=kigali&sections=all&timezone=Africa/Kigali&language=en&units=metric&key=kd21d3jso0f85cirisa7hsryyhb0ru9hj2xntowo

const exampleForecastData = {
  // Current Weather (Real-time)
  current: {
    temperature: 21.5, // °C
    summary: "Partly clear",
    windSpeed: 4.0, // km/h (converted from 1.1 m/s)
    windDir: "NW",
    cloudCover: 35, // %
    precipitation: 0.0, // mm
    precipitationType: "none",
    location: "1.94995S, 30.05885E",
    elevation: 1542 // meters
  },

  // Hourly Forecast (Next 24 hours)
  hourly: [
    {
      time: "2025-10-17T19:00:00",
      temperature: 21.5,
      summary: "Partly clear",
      precipitation: 0.0,
      precipitationType: "none"
    },
    {
      time: "2025-10-17T20:00:00", 
      temperature: 20.5,
      summary: "Partly clear",
      precipitation: 0.0,
      precipitationType: "none"
    },
    {
      time: "2025-10-18T11:00:00",
      temperature: 24.8,
      summary: "Light rain",
      precipitation: 0.3,
      precipitationType: "rain"
    },
    {
      time: "2025-10-18T16:00:00",
      temperature: 23.5,
      summary: "Thunderstorm", 
      precipitation: 2.5,
      precipitationType: "rain"
    }
  ],

  // Daily Forecast (Next 7 days)
  daily: [
    {
      date: "2025-10-17",
      temperature: { max: 27, min: 16 },
      summary: "Mostly cloudy, fewer clouds in the afternoon and evening. Temperature 16/27 °C.",
      precipitation: 0.0,
      precipitationType: "none",
      cloudCover: 71,
      windSpeed: 6.1, // km/h
      windDir: "N"
    },
    {
      date: "2025-10-18", 
      temperature: { max: 26, min: 16 },
      summary: "Possible rain changing to cloudy by evening. Temperature 16/26 °C.",
      precipitation: 4.4,
      precipitationType: "rain",
      cloudCover: 77,
      windSpeed: 5.4, // km/h
      windDir: "NNW"
    },
    {
      date: "2025-10-22",
      temperature: { max: 24, min: 16 },
      summary: "Light rain changing to light ice pellets by evening. Temperature 16/24 °C.",
      precipitation: 10.8,
      precipitationType: "rain", 
      cloudCover: 96,
      windSpeed: 4.7, // km/h
      windDir: "NNE"
    }
  ]
};

export default exampleForecastData;
