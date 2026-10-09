const QUESTIONS = [...VALUE_QUESTIONS, ...STYLE_QUESTIONS];
const $ = (id) => document.getElementById(id);

let gender = "여자";
let answers = [];
let result = null;

function show(id) {
  for (const s of document.querySelectorAll(".screen")) s.hidden = s.id !== id;
  window.scrollTo(0, 0);
}

// 새로고침해도 진행 상태를 이어 가도록 탭 단위로 저장한다.
const STORAGE_KEY = "wedding-test";

function save() {
  try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ gender, answers })); } catch {}
}

function clearSaved() {
  try { sessionStorage.removeItem(STORAGE_KEY); } catch {}
}

function restore() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY));
    const isValid = ["여자", "남자"].includes(saved?.gender) && Array.isArray(saved.answers)
      && saved.answers.length <= QUESTIONS.length
      && saved.answers.every((n, i) => Number.isInteger(n) && n >= 0 && n < QUESTIONS[i].options.length);
    if (!isValid) return false;
    ({ gender, answers } = saved);
    return true;
  } catch {
    return false;
  }
}

function renderQuestion() {
  save();
  const i = answers.length;
  if (i === QUESTIONS.length) return renderResult();
  const { q, options } = QUESTIONS[i];
  $("count").textContent = `${i + 1} / ${QUESTIONS.length}`;
  $("bar").style.width = `${(i / QUESTIONS.length) * 100}%`;
  $("question").textContent = q;
  $("options").replaceChildren(...options.map((o, n) => {
    const b = document.createElement("button");
    b.className = "choice";
    b.textContent = o.text;
    b.onclick = () => { answers.push(n); renderQuestion(); };
    return b;
  }));
  $("back").hidden = i === 0;
  show("quiz");
}

function renderResult() {
  const valueAnswers = answers.slice(0, VALUE_QUESTIONS.length);
  const styleAnswers = answers.slice(VALUE_QUESTIONS.length);
  const { key, value, valuePercent, stylePercent } = decideCharacter(valueAnswers, styleAnswers, { VALUE_QUESTIONS, STYLE_QUESTIONS });
  const c = CHARACTERS[key];
  result = c;

  const img = $("char-img");
  img.hidden = !c.image;
  img.onerror = () => { img.hidden = true; };
  if (c.image) {
    img.src = encodeURI(`서있는모습/${c.image}-${gender}.png`);
    img.alt = c.name;
  } else {
    img.removeAttribute("src");
  }

  $("char-name").textContent = c.name;
  const isSolo = key === "H" || key === "A";
  $("char-sub").hidden = !isSolo;
  $("char-sub").textContent = isSolo ? `그래도 자꾸 눈이 가는 곳: ${VALUE_NAMES[value]}` : "";
  $("char-line").textContent = c.line;
  $("char-intro").textContent = c.intro;
  $("char-desc").textContent = c.desc;
  renderBars("value-bars", valuePercent, VALUE_NAMES);
  renderBars("style-bars", stylePercent, STYLE_NAMES);
  show("result");
}

// 큰 비율부터 막대로 보여 준다.
function renderBars(id, percent, names) {
  const rows = Object.keys(percent).sort((a, b) => percent[b] - percent[a]).map((k) => {
    const row = document.createElement("div");
    row.className = "bar-row";
    const label = document.createElement("span");
    label.textContent = names[k];
    const track = document.createElement("div");
    track.className = "track";
    const fill = document.createElement("div");
    fill.style.width = `${percent[k]}%`;
    track.append(fill);
    const num = document.createElement("span");
    num.className = "num";
    num.textContent = `${percent[k]}%`;
    row.append(label, track, num);
    return row;
  });
  $(id).replaceChildren(...rows);
}

for (const b of document.querySelectorAll("[data-gender]")) {
  b.onclick = () => { gender = b.dataset.gender; answers = []; renderQuestion(); };
}
$("back").onclick = () => { answers.pop(); renderQuestion(); };
// 카카오 JavaScript 키는 등록한 도메인에서만 동작한다.
const KAKAO_KEY = "eddcdfcb6c5ae4b85f18cec5e60f48c8";
const hasKakao = typeof Kakao !== "undefined";
if (hasKakao && !Kakao.isInitialized()) Kakao.init(KAKAO_KEY);
$("share").hidden = !hasKakao;
$("share").onclick = () => {
  const home = new URL(".", location.href).href;
  const link = { mobileWebUrl: home, webUrl: home };
  Kakao.Share.sendDefault({
    objectType: "feed",
    content: {
      title: `나의 결혼 준비 캐릭터는 ${result.name}`,
      description: result.intro,
      imageUrl: new URL(encodeURI(`서있는모습/${result.image}-${gender}.png`), location.href).href,
      link,
    },
    buttons: [{ title: "나도 테스트하기", link }],
  });
};
$("restart").onclick = () => { answers = []; clearSaved(); show("start"); };
if (restore()) renderQuestion();
