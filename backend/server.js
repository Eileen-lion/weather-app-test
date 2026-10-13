import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

async function fetchJSON(url, fetcher) {
  try {
    const response = await fetcher(url, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error('Upstream error');
    return await response.json();
  } catch {
    throw new HttpError(502, '날씨 서비스에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.');
  }
}

export async function getWeather(city, fetcher = fetch) {
  if (!city || city.length < 2 || city.length > 100) {
    throw new HttpError(400, '도시 이름을 2~100자로 입력해 주세요.');
  }
  const geocoding = new URL('https://geocoding-api.open-meteo.com/v1/search');
  // GeoNames에서 한글 검색이 되지 않는 주요 도시를 지원합니다.
  const aliases = { 서울: 'Seoul', 부산: 'Busan', 인천: 'Incheon', 대구: 'Daegu', 대전: 'Daejeon', 광주: 'Gwangju', 울산: 'Ulsan', 제주: 'Jeju', 도쿄: 'Tokyo', 런던: 'London' };
  geocoding.search = new URLSearchParams({ name: aliases[city] || city, count: '1', language: 'ko', format: 'json' });
  const locations = await fetchJSON(geocoding, fetcher);
  const location = locations.results?.[0];
  if (!location) throw new HttpError(404, '도시를 찾지 못했습니다. 영문 이름으로도 검색해 보세요.');
  const forecast = new URL('https://api.open-meteo.com/v1/forecast');
  forecast.search = new URLSearchParams({
    latitude: location.latitude, longitude: location.longitude, timezone: 'auto',
    current: 'temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,is_day',
    temperature_unit: 'celsius', wind_speed_unit: 'kmh',
  });
  const weather = await fetchJSON(forecast, fetcher);
  if (!weather.current || !Number.isFinite(weather.current.temperature_2m)) {
    throw new HttpError(502, '현재 날씨 데이터를 받지 못했습니다. 다시 시도해 주세요.');
  }
  return {
    location: [location.name, location.admin1, location.country].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(', '),
    timezone: weather.timezone,
    current: weather.current,
  };
}

const assets = {
  '/': ['index.html', 'text/html; charset=utf-8'],
  '/styles.css': ['styles.css', 'text/css; charset=utf-8'],
  '/app.js': ['app.js', 'text/javascript; charset=utf-8'],
};

export function createWeatherServer(fetcher = fetch) {
  return createServer(async (req, res) => {
    const json = (status, data) => {
      res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify(data));
    };
    try {
      if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return json(405, { error: 'GET 요청만 지원합니다.' }); }
      const url = new URL(req.url, 'http://localhost');
      if (url.pathname === '/api/weather') {
        return json(200, await getWeather((url.searchParams.get('city') || '').trim(), fetcher));
      }
      const asset = assets[url.pathname];
      if (!asset) return json(404, { error: '페이지를 찾을 수 없습니다.' });
      const body = await readFile(new URL(`../frontend/${asset[0]}`, import.meta.url));
      res.writeHead(200, { 'Content-Type': asset[1], 'X-Content-Type-Options': 'nosniff' });
      res.end(body);
    } catch (error) {
      json(error.status || 500, { error: error.status ? error.message : '서버 오류가 발생했습니다.' });
    }
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 3000);
  createWeatherServer().listen(port, '127.0.0.1', () => console.log(`날씨 앱: http://localhost:${port}`));
}
