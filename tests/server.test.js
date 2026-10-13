import test from 'node:test';
import assert from 'node:assert/strict';
import { createWeatherServer, getWeather } from '../backend/server.js';

const mockFetch = async (url) => {
  if (url.hostname === 'geocoding-api.open-meteo.com') {
    assert.equal(url.searchParams.get('name'), 'Seoul');
    return Response.json({ results: [{ name: '서울', country: '대한민국', latitude: 37.57, longitude: 126.98 }] });
  }
  assert.equal(url.hostname, 'api.open-meteo.com');
  assert.equal(url.searchParams.get('latitude'), '37.57');
  assert.equal(url.searchParams.get('timezone'), 'auto');
  return Response.json({ timezone: 'Asia/Seoul', current: { temperature_2m: 20, relative_humidity_2m: 55 } });
};

test('도시 좌표를 조회하고 현재 날씨를 반환한다', async () => {
  const weather = await getWeather('서울', mockFetch);
  assert.equal(weather.location, '서울, 대한민국');
  assert.equal(weather.current.temperature_2m, 20);
  assert.equal(weather.timezone, 'Asia/Seoul');
});

test('잘못된 입력, 도시 없음, 외부 API 실패를 구분한다', async () => {
  await assert.rejects(getWeather('', mockFetch), { status: 400 });
  await assert.rejects(getWeather('x'.repeat(101), mockFetch), { status: 400 });
  await assert.rejects(getWeather('없는도시', async () => Response.json({ results: [] })), { status: 404 });
  await assert.rejects(getWeather('서울', async () => new Response('', { status: 503 })), { status: 502 });
  await assert.rejects(getWeather('서울', async () => { throw new Error('timeout'); }), { status: 502 });
});

test('HTTP 서버가 화면과 API를 제공하고 다른 경로와 메서드를 차단한다', async (t) => {
  const server = createWeatherServer(mockFetch);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  const page = await fetch(base);
  assert.equal(page.status, 200);
  assert.match(await page.text(), /날씨 확인/);
  for (const path of ['/app.js', '/styles.css']) assert.equal((await fetch(base + path)).status, 200);
  const weather = await fetch(`${base}/api/weather?city=${encodeURIComponent(' 서울 ')}`);
  assert.equal(weather.status, 200);
  assert.equal((await weather.json()).current.temperature_2m, 20);
  assert.equal((await fetch(`${base}/api/weather`)).status, 400);
  assert.equal((await fetch(`${base}/backend/server.js`)).status, 404);
  assert.equal((await fetch(`${base}/api/weather`, { method: 'POST' })).status, 405);
});
