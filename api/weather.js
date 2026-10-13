import { getWeather } from '../backend/server.js';

// Vercel이 요청마다 실행합니다. 별도의 listen() 호출은 필요하지 않습니다.
export function createWeatherHandler(fetcher = fetch) {
  return async function handler(req, res) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET');
      res.statusCode = 405;
      return res.end(JSON.stringify({ error: 'GET 요청만 지원합니다.' }));
    }
    try {
      const url = new URL(req.url, 'http://localhost');
      const weather = await getWeather((url.searchParams.get('city') || '').trim(), fetcher);
      res.statusCode = 200;
      res.end(JSON.stringify(weather));
    } catch (error) {
      res.statusCode = error.status || 500;
      res.end(JSON.stringify({ error: error.status ? error.message : '서버 오류가 발생했습니다.' }));
    }
  };
}

export default createWeatherHandler();
