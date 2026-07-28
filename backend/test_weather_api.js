const fs = require('fs');
const path = require('path');

// Load environment variables from backend/.env
const dotenvPath = path.join(__dirname, '.env');
if (fs.existsSync(dotenvPath)) {
  require('dotenv').config({ path: dotenvPath });
}

// Get API key from arguments or environment variable
const apiKey = process.argv[2] || process.env.WEATHER_API_KEY;
const apiProvider = process.argv[3] || 'openweathermap'; // 'openweathermap' or 'weatherapi'

console.log('\x1b[36m=== Weather API Key Validation ===\x1b[0m\n');

if (!apiKey) {
  console.log('\x1b[31m[Error] No API Key provided.\x1b[0m');
  console.log('Usage: node test_weather_api.js <API_KEY> [openweathermap|weatherapi]');
  console.log('Or define WEATHER_API_KEY in backend/.env\n');
  process.exit(1);
}

const maskedKey = apiKey.length > 8 ? `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}` : 'Invalid Length';
console.log(`Testing key (${maskedKey}) using provider: \x1b[35m${apiProvider}\x1b[0m...\n`);

async function testOpenWeatherMap(key) {
  const url = `https://api.openweathermap.org/data/2.5/weather?q=London&appid=${key}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    
    if (res.ok) {
      console.log('OpenWeatherMap: \x1b[32m[Working] (API responded successfully)\x1b[0m');
      console.log(`Location: ${data.name}, ${data.sys?.country}`);
      console.log(`Condition: ${data.weather?.[0]?.description}`);
      console.log(`Temp: ${(data.main?.temp - 273.15).toFixed(1)}°C\n`);
      return true;
    } else {
      console.log(`OpenWeatherMap: \x1b[31m[Failed] (Status ${res.status})\x1b[0m`);
      console.log(`Response: ${JSON.stringify(data)}\n`);
      return false;
    }
  } catch (err) {
    console.log(`OpenWeatherMap: \x1b[31m[Failed] (Connection Error)\x1b[0m`);
    console.error(err);
    return false;
  }
}

async function testWeatherApi(key) {
  const url = `https://api.weatherapi.com/v1/current.json?key=${key}&q=London`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    
    if (res.ok) {
      console.log('WeatherAPI: \x1b[32m[Working] (API responded successfully)\x1b[0m');
      console.log(`Location: ${data.location?.name}, ${data.location?.country}`);
      console.log(`Condition: ${data.current?.condition?.text}`);
      console.log(`Temp: ${data.current?.temp_c}°C\n`);
      return true;
    } else {
      console.log(`WeatherAPI: \x1b[31m[Failed] (Status ${res.status})\x1b[0m`);
      console.log(`Response: ${JSON.stringify(data)}\n`);
      return false;
    }
  } catch (err) {
    console.log(`WeatherAPI: \x1b[31m[Failed] (Connection Error)\x1b[0m`);
    console.error(err);
    return false;
  }
}

async function main() {
  if (apiProvider.toLowerCase() === 'openweathermap') {
    await testOpenWeatherMap(apiKey);
  } else if (apiProvider.toLowerCase() === 'weatherapi') {
    await testWeatherApi(apiKey);
  } else {
    console.log(`\x1b[31mUnknown provider: ${apiProvider}\x1b[0m. Supported providers: openweathermap, weatherapi`);
  }
  console.log('\x1b[36m==================================\x1b[0m');
}

main();
