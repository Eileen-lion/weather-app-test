const form = document.querySelector('#weather-form');
const cityInput = document.querySelector('#city');
const submit = document.querySelector('#submit');
const status = document.querySelector('#status');
const card = document.querySelector('#weather');
const searchButtons = document.querySelectorAll('[data-city]');
const setText = (id, value) => { document.getElementById(id).textContent = value; };

function describeWeather(code, isDay) {
  if (code === 0) return [isDay ? '☀️' : '🌙', '맑음'];
  if (code === 1) return [isDay ? '🌤️' : '🌙', '대체로 맑음'];
  if (code === 2) return ['⛅', '구름 조금'];
  if (code === 3) return ['☁️', '흐림'];
  if ([45, 48].includes(code)) return ['🌫️', '안개'];
  if ([51, 53, 55].includes(code)) return ['🌦️', '이슬비'];
  if ([56, 57, 66, 67].includes(code)) return ['🌧️', '어는 비'];
  if ([61, 63, 65].includes(code)) return ['🌧️', '비'];
  if ([71, 73, 75, 77, 85, 86].includes(code)) return ['🌨️', '눈'];
  if ([80, 81, 82].includes(code)) return ['🌦️', '소나기'];
  if ([95, 96, 99].includes(code)) return ['⛈️', '뇌우'];
  return ['🌡️', '날씨 정보'];
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const city = cityInput.value.trim();
  if (city.length < 2) { status.textContent = '도시 이름을 2자 이상 입력해 주세요.'; status.className = 'error'; return; }
  submit.disabled = true;
  searchButtons.forEach(button => { button.disabled = true; });
  submit.textContent = '확인 중…';
  card.hidden = true;
  card.setAttribute('aria-busy', 'true');
  status.className = '';
  status.textContent = `${city}의 날씨를 가져오고 있습니다…`;
  try {
    const response = await fetch(`/api/weather?city=${encodeURIComponent(city)}`, { signal: AbortSignal.timeout(25000) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || '날씨를 가져오지 못했습니다.');
    const current = data.current;
    const [icon, description] = describeWeather(current.weather_code, current.is_day);
    const format = (value, unit) => Number.isFinite(value) ? `${Math.round(value)}${unit}` : '—';
    setText('location', data.location);
    setText('icon', icon);
    setText('description', description);
    setText('temperature', format(current.temperature_2m, ''));
    setText('feels-like', format(current.apparent_temperature, '°C'));
    setText('humidity', format(current.relative_humidity_2m, '%'));
    setText('wind', format(current.wind_speed_10m, ' km/h'));
    setText('updated', `${current.time.replace('T', ' ')} · ${data.timezone}`);
    card.hidden = false;
    status.textContent = `${data.location}의 현재 날씨입니다.`;
  } catch (error) {
    status.className = 'error';
    status.textContent = ['TimeoutError', 'AbortError', 'TypeError'].includes(error.name)
      ? '서버 연결을 확인하고 잠시 후 다시 시도해 주세요.' : error.message;
  } finally {
    card.setAttribute('aria-busy', 'false');
    submit.disabled = false;
    searchButtons.forEach(button => { button.disabled = false; });
    submit.textContent = '날씨 확인 ↗';
  }
});

searchButtons.forEach(button => button.addEventListener('click', () => {
  cityInput.value = button.dataset.city;
  form.requestSubmit();
}));
