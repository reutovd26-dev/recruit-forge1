/* =====================================================================
   СТРЕСС-ПАКЕТ RECRUIT FORGE · v2
   Волна 1: 9 схем, 164 объекта, 4 листа, 14 отрядов.
   Волна 2: +13 схем (конфигураторы с выбором, монстры, маунты, дроны,
   конструктор отрядов, пехота II, 4 сводки), ~150 объектов, 4 листа,
   14 отрядов. Всё генерируется локально, без сети и eval.
   ===================================================================== */
const STRESS_PACK_VERSION = 2;

function buildStressPack() {
  const schemas = [], objects = [], layouts = [], rosters = [];

  /* ---------- helpers ---------- */
  const newSchema = (name) => {
    const s = { id: uid(), name, version: 1, canvas: { w: 1580, h: 1300 },
      fields: [], nodes: [], links: [], changelog: [],
      layers: ["base", "set", "equipment", "add", "mul", "bounds"], stacking: "stack", _sy: 40 };
    schemas.push(s); return s;
  };
  const F = (s, name, type = "number", def = "0", formula = "", unit = "", min = null, max = null) => {
    const f = field(name, type, def, formula);
    f.unit = unit; f.min = min; f.max = max; f.order = s.fields.length;
    s.fields.push(f);
    const n = mkNode("field", 30, 40 + (s.fields.length - 1) * 76, 150, 64, name);
    n.props.fieldId = f.id; n.bind = f.id; s.nodes.push(n);
    return { f, n };
  };
  const CARD = (s, w, h, label = "Карточка") => {
    const c = mkNode("card", 360, 40, w, h, label, { layoutMode: "free" });
    s.nodes.push(c); return c;
  };
  const V = (s, c, kind, x, y, w, h, label, props = {}) => {
    const n = mkNode(kind, x, y, w, h, label, props);
    n.parent = c.id; s.nodes.push(n);
    s.links.push(link(c, "contains-out", n, "contains-in", "contains"));
    return n;
  };
  const B = (s, node, f) => {
    node.bind = f.f.id; node.props.field = f.f.name;
    s.links.push(link(f.n, "out", node, "data-in", "data")); return node;
  };
  const TBL = (s, c, x, y, w, h, fs) => {
    const t = V(s, c, "table", x, y, w, h, "Профиль", { fields: fs.map(f => f.f.name) });
    fs.forEach(f => s.links.push(link(f.n, "out", t, "data-in", "data"))); return t;
  };
  const MOD = (s, label, target, op, value, condExpr, layer = "add") => {
    const y = s._sy; s._sy += condExpr ? 175 : 95;
    const m = mkNode("modifier", 1120, y, 210, 76, label, { operation: op, value: String(value), layer });
    s.nodes.push(m); s.links.push(link(m, "out", target.n, "in", "modifies"));
    if (condExpr) {
      const c = mkNode("condition", 1120, y + 88, 210, 64, label + " · условие", { expr: condExpr, mode: "AND" });
      s.nodes.push(c); s.links.push(link(c, "out", m, "cond-in", "condition"));
    }
    return m;
  };
  const CON = (s, label, rule, value, scope, filterTag, message, per = 1) => {
    const y = s._sy; s._sy += 100;
    const c = mkNode("constraint", 1120, y, 240, 80, label, { rule, value, scope, filterTag, message, per });
    s.nodes.push(c); return c;
  };
  const OBJ = (s, name, vals, tags = [], folder = "", extra = {}) => {
    const o = { id: uid(), schema: s.id, schemaVersion: 1, name,
      values: Object.fromEntries(s.fields.map(f => [f.id, vals[f.name] !== undefined ? vals[f.name] : f.default])),
      tags, folder, notes: "", deleted: false, ...extra };
    objects.push(o); return o;
  };

  /* =====================================================================
     СХЕМА 1 · ОРУЖИЕ — СТРЕЛКОВОЕ (выбор режима и боеприпаса)
     ===================================================================== */
  const rw = newSchema("Оружие · Стрелковое");
  const rw_name = F(rw, "Имя", "text", "Лазган");
  const rw_rng = F(rw, "Дальность", "number", "24", "", "дюймы");
  const rw_a = F(rw, "A", "number", "1");
  const rw_bs = F(rw, "BS", "number", "4");
  const rw_s = F(rw, "S", "number", "3");
  const rw_ap = F(rw, "AP", "number", "0");
  const rw_d = F(rw, "D", "number", "1");
  const rw_mode = F(rw, "Режим", "number", "1", "", "1=точный 2=очередь 3=перегрев", 1, 3);
  const rw_ammo = F(rw, "Боеприпас", "text", "Обычные", "", "Обычные / Крак / Осколочные");
  const rw_hot = F(rw, "Перегрев", "flag", "false");
  const rw_cost = F(rw, "Стоимость", "calc", "0", "=[S]*2+[D]*3+[A]*2+MAX(0,-[AP])*2");
  const rw_spec = F(rw, "Особые", "tags", "");
  {
    const c = CARD(rw, 680, 220);
    B(rw, V(rw, c, "text", 16, 12, 648, 32, "Имя", { size: 18 }), rw_name);
    TBL(rw, c, 16, 52, 648, 60, [rw_rng, rw_a, rw_bs, rw_s, rw_ap, rw_d]);
    B(rw, V(rw, c, "number", 16, 124, 150, 64, "Стоимость", { unit: "оч." }), rw_cost);
    B(rw, V(rw, c, "stat", 180, 124, 120, 64, "Режим"), rw_mode);
    B(rw, V(rw, c, "tags", 314, 124, 350, 64, "Особые"), rw_spec);
  }
  MOD(rw, "Очередь: A×2", rw_a, "mul", 2, "[Режим]==2");
  MOD(rw, "Очередь: BS−1", rw_bs, "sub", 1, "[Режим]==2");
  MOD(rw, "Перегрев: D+2", rw_d, "add", 2, "[Режим]==3 OR [Перегрев]");
  MOD(rw, "Крак: AP−2", rw_ap, "sub", 2, '[Боеприпас]=="Крак"');
  MOD(rw, "Крак: D+1", rw_d, "add", 1, '[Боеприпас]=="Крак"');
  MOD(rw, "Осколочные: A+2", rw_a, "add", 2, '[Боеприпас]=="Осколочные"');
  MOD(rw, "Осколочные: S−1", rw_s, "sub", 1, '[Боеприпас]=="Осколочные"');
  MOD(rw, "Метка: Перегрев", rw_spec, "addTag", "Перегрев", "[Перегрев]");
  MOD(rw, "Метка: Крак", rw_spec, "addTag", "Крак", '[Боеприпас]=="Крак"');
  CON(rw, "Не более 3 тяжёлых", "max", 3, "roster", "Тяжёлое", "В отряде не более трёх тяжёлых орудий");
  CON(rw, "Не более 4 пистолетов", "max", 4, "roster", "Пистолет", "Слишком много пистолетов");
  const rangedDefs = [
    ["Лазган", 24, 1, 4, 3, 0, 1, 1, "Обычные", false, ["Имперское"]],
    ["Лазган «Дальний»", 36, 1, 4, 3, 0, 1, 1, "Обычные", false, ["Имперское", "Снайперское"]],
    ["Болтер", 24, 2, 3, 4, -1, 1, 1, "Обычные", false, ["Имперское"]],
    ["Штурмовой болтер", 24, 2, 3, 4, 0, 1, 1, "Обычные", false, ["Имперское", "Штурмовое"]],
    ["Тяжёлый болтер", 36, 3, 4, 5, -1, 2, 1, "Обычные", false, ["Имперское", "Тяжёлое"]],
    ["Плазма-ган", 24, 1, 3, 7, -3, 2, 1, "Обычные", true, ["Имперское"]],
    ["Плазма-пистолет", 12, 1, 3, 7, -3, 1, 1, "Обычные", true, ["Имперское", "Пистолет"]],
    ["Мельтаган", 12, 1, 3, 8, -4, "D6", 1, "Обычные", false, ["Имперское"]],
    ["Мульти-мельта", 18, 2, 4, 8, -4, "D6", 1, "Обычные", false, ["Имперское", "Тяжёлое"]],
    ["Огнемёт", 12, "D6", 3, 4, 0, 1, 1, "Обычные", false, ["Имперское", "Штурмовое"]],
    ["Тяжёлый огнемёт", 12, "D6", 3, 5, -1, 1, 1, "Обычные", false, ["Имперское", "Тяжёлое"]],
    ["Снайперская винтовка", 36, 1, 3, 4, 0, 2, 1, "Обычные", false, ["Имперское", "Снайперское"]],
    ["Ракетомёт", 48, 1, 4, 9, -2, "D6", 1, "Крак", false, ["Имперское", "Тяжёлое"]],
    ["Автопушка", 48, 4, 4, 7, -1, 2, 1, "Обычные", false, ["Имперское", "Тяжёлое"]],
    ["Лазпушка", 48, 1, 4, 9, -3, "D6", 1, "Обычные", false, ["Имперское", "Тяжёлое"]],
    ["Штурмовая пушка", 24, 6, 4, 6, -1, 1, 1, "Обычные", false, ["Имперское", "Тяжёлое"]],
    ["Грав-пушка", 18, 2, 3, 5, -3, 2, 1, "Обычные", false, ["Имперское"]],
    ["Болт-пистолет", 12, 1, 3, 4, -1, 1, 1, "Обычные", false, ["Имперское", "Пистолет"]],
    ["Дробовик", 12, 2, 4, 3, 0, 1, 1, "Осколочные", false, ["Имперское"]],
    ["Гаусс-бластер", 24, 2, 4, 5, -1, 1, 1, "Обычные", false, ["Ксенос", "Некроны"]],
    ["Осколочная пушка Тау", 18, 3, 4, 5, 0, 1, 1, "Обычные", false, ["Ксенос", "Тау"]],
    ["Рельсотрон", 60, 1, 4, 10, -4, "D6", 1, "Обычные", false, ["Ксенос", "Тау", "Тяжёлое"]],
    ["Шреддер", 18, 3, 4, 6, -1, 1, 1, "Обычные", false, ["Ксенос", "Эльдар"]],
    ["Иглер", 24, "D3", 4, 3, -1, 1, 1, "Обычные", false, ["Ксенос"]]
  ];
  const rangedObjs = rangedDefs.map(([n, rng, a, bs, s, ap, d, mode, ammo, hot, tags]) =>
    OBJ(rw, n, { "Имя": n, "Дальность": rng, "A": a, "BS": bs, "S": s, "AP": ap, "D": d, "Режим": mode, "Боеприпас": ammo, "Перегрев": hot }, tags, "Арсенал/Стрелковое"));

  /* =====================================================================
     СХЕМА 2 · ОРУЖИЕ — БЛИЖНИЙ БОЙ (выбор хвата, силовое/парное)
     ===================================================================== */
  const mw = newSchema("Оружие · Ближний бой");
  const mw_name = F(mw, "Имя", "text", "Цепной меч");
  const mw_ws = F(mw, "WS", "number", "3");
  const mw_a = F(mw, "A", "number", "1");
  const mw_s = F(mw, "S", "number", "4");
  const mw_ap = F(mw, "AP", "number", "0");
  const mw_d = F(mw, "D", "number", "1");
  const mw_grip = F(mw, "Хват", "number", "1", "", "1=одноручный 2=двуручный", 1, 2);
  const mw_power = F(mw, "Силовое", "flag", "false");
  const mw_pair = F(mw, "Парное", "flag", "false");
  const mw_cost = F(mw, "Стоимость", "calc", "0", "=[S]*2+[A]*3+[D]*2+MAX(0,-[AP])*2");
  const mw_spec = F(mw, "Особые", "tags", "");
  {
    const c = CARD(mw, 680, 220);
    B(mw, V(mw, c, "text", 16, 12, 648, 32, "Имя", { size: 18 }), mw_name);
    TBL(mw, c, 16, 52, 648, 60, [mw_ws, mw_a, mw_s, mw_ap, mw_d]);
    B(mw, V(mw, c, "number", 16, 124, 150, 64, "Стоимость", { unit: "оч." }), mw_cost);
    B(mw, V(mw, c, "stat", 180, 124, 120, 64, "Хват"), mw_grip);
    B(mw, V(mw, c, "tags", 314, 124, 350, 64, "Особые"), mw_spec);
  }
  MOD(mw, "Двуручный: S+2", mw_s, "add", 2, "[Хват]==2");
  MOD(mw, "Двуручный: A−1", mw_a, "sub", 1, "[Хват]==2");
  MOD(mw, "Силовое: AP−2", mw_ap, "sub", 2, "[Силовое]");
  MOD(mw, "Парное: A+1", mw_a, "add", 1, "[Парное]");
  MOD(mw, "Метка: Силовое", mw_spec, "addTag", "Силовое", "[Силовое]");
  MOD(mw, "Метка: Парное", mw_spec, "addTag", "Парное", "[Парное]");
  const meleeDefs = [
    ["Цепной меч", 3, 2, 4, -1, 1, 1, false, false, ["Имперское"]],
    ["Силовой меч", 3, 2, 5, -2, 1, 1, true, false, ["Имперское"]],
    ["Силовой кулак", 4, 2, 8, -2, 2, 1, true, false, ["Имперское"]],
    ["Громовой молот", 4, 2, 10, -2, 3, 2, true, false, ["Имперское"]],
    ["Цепная секира", 3, 3, 5, -1, 1, 2, false, false, ["Имперское"]],
    ["Боевой нож", 3, 2, 3, 0, 1, 1, false, true, ["Имперское"]],
    ["Когти молнии", 3, 3, 5, -2, 1, 1, true, true, ["Имперское"]],
    ["Энергомеч", 2, 3, 6, -3, 2, 1, true, false, ["Имперское"]],
    ["Цепной топор", 3, 2, 4, 0, 1, 1, false, false, ["Имперское"]],
    ["Силовой посох", 3, 2, 6, -1, 2, 2, true, false, ["Имперское"]],
    ["Чумной нож", 3, 2, 4, -1, 1, 1, false, false, ["Хаос", "Нургл"]],
    ["Костяные когти", 3, 3, 4, 0, 1, 1, false, true, ["Ксенос", "Тираниды"]],
    ["Демонический клинок", 2, 4, 7, -3, 3, 1, true, false, ["Хаос"]],
    ["Топор берсерка", 3, 3, 6, -1, 1, 2, false, false, ["Хаос", "Кхорн"]]
  ];
  const meleeObjs = meleeDefs.map(([n, ws, a, s, ap, d, grip, power, pair, tags]) =>
    OBJ(mw, n, { "Имя": n, "WS": ws, "A": a, "S": s, "AP": ap, "D": d, "Хват": grip, "Силовое": power, "Парное": pair }, tags, "Арсенал/Ближний бой"));

  /* =====================================================================
     СХЕМА 3 · ОРУЖИЕ — ЭКЗОТИКА (кубы, нестабильность)
     ===================================================================== */
  const ex = newSchema("Оружие · Экзотика");
  const ex_name = F(ex, "Имя", "text", "Археотех");
  const ex_s = F(ex, "S", "number", "2D6");
  const ex_d = F(ex, "D", "number", "D6");
  const ex_a = F(ex, "A", "number", "1");
  const ex_chaos = F(ex, "Нестабильность", "number", "1", "", "1=стабильно 2=риск 3=хаос", 1, 3);
  const ex_risk = F(ex, "Риск", "flag", "false");
  const ex_cost = F(ex, "Стоимость", "calc", "0", "=12+[A]*3+[Нестабильность]*4");
  const ex_spec = F(ex, "Особые", "tags", "");
  {
    const c = CARD(ex, 680, 220);
    B(ex, V(ex, c, "text", 16, 12, 648, 32, "Имя", { size: 18 }), ex_name);
    TBL(ex, c, 16, 52, 648, 60, [ex_s, ex_d, ex_a]);
    B(ex, V(ex, c, "number", 16, 124, 150, 64, "Стоимость", { unit: "оч." }), ex_cost);
    B(ex, V(ex, c, "stat", 180, 124, 150, 64, "Нестабильность"), ex_chaos);
    B(ex, V(ex, c, "tags", 344, 124, 320, 64, "Особые"), ex_spec);
  }
  MOD(ex, "Хаос: S×2", ex_s, "mul", 2, "[Нестабильность]==3");
  MOD(ex, "Риск: D+1", ex_d, "add", 1, "[Риск]");
  MOD(ex, "Метка: Нестабильное", ex_spec, "addTag", "Нестабильное", "[Нестабильность]>=2");
  CON(ex, "Экзотика: не более 2", "max", 2, "roster", "", "Не более двух экзотических орудий");
  const exoticDefs = [
    ["Археотех-излучатель", "2D6", "D6", 1, 2, true, ["Имперское", "Археотех"]],
    ["Нестабильная плазма", "D6+2", "D3", 2, 3, true, ["Имперское"]],
    ["Демоническая пушка", "2D6", "D6", "D3", 3, true, ["Хаос"]],
    ["Псионический разряд", "D6", "D3", 2, 2, false, ["Псайкер"]],
    ["Варп-клинок", "2D6", "D6", 2, 3, true, ["Хаос", "Псайкер"]],
    ["Энтропийный луч", "D6", "D6", 1, 2, false, ["Ксенос", "Некроны"]],
    ["Фосфорный бластер", "D6+1", "D3", 2, 1, false, ["Ксенос"]],
    ["Гравитонная имплозия", "2D6", "D6+2", 1, 3, true, ["Имперское", "Археотех"]]
  ];
  const exoticObjs = exoticDefs.map(([n, s, d, a, ch, risk, tags]) =>
    OBJ(ex, n, { "Имя": n, "S": s, "D": d, "A": a, "Нестабильность": ch, "Риск": risk }, tags, "Арсенал/Экзотика"));

  /* =====================================================================
     СХЕМА 4 · ПЕРСОНАЖ — ГЕРОЙ (способности, дар, реликвия)
     ===================================================================== */
  const hr = newSchema("Персонаж · Герой");
  const h_name = F(hr, "Имя", "text", "Герой");
  const h_role = F(hr, "Роль", "text", "Командир");
  const hM = F(hr, "M", "number", "6"), hWS = F(hr, "WS", "number", "2"), hBS = F(hr, "BS", "number", "2"),
    hS = F(hr, "S", "number", "4"), hT = F(hr, "T", "number", "4"), hW = F(hr, "W", "number", "5"),
    hA = F(hr, "A", "number", "4"), hLd = F(hr, "Ld", "number", "9"), hSv = F(hr, "Sv", "number", "3"), hOC = F(hr, "OC", "number", "2");
  const h_wounds = F(hr, "Раны", "calc", "0", "=[W]");
  const h_inv = F(hr, "Инвуль", "text", "—");
  const h_gift = F(hr, "Дар", "number", "0", "", "0=нет 1=слабый 2=средний 3=мощный", 0, 3);
  const h_relic = F(hr, "Реликвия", "flag", "false");
  const h_aura = F(hr, "Аура", "text", "Вдохновение: +1 Ld союзникам в 6 дюймах");
  const h_cost = F(hr, "Стоимость", "calc", "0", "=[W]*4+[S]+[T]+[A]*3+[Ld]*2+MAX(0,6-[Sv])*3+[Дар]*8+IF([Реликвия],10,0)");
  const h_spec = F(hr, "Особые", "tags", "");
  {
    const c = CARD(hr, 720, 400);
    B(hr, V(hr, c, "text", 16, 12, 688, 34, "Имя", { size: 20 }), h_name);
    B(hr, V(hr, c, "text", 16, 50, 688, 24, "Роль", { size: 13 }), h_role);
    TBL(hr, c, 16, 82, 688, 60, [hM, hWS, hBS, hS, hT, hW, hA, hLd, hSv, hOC]);
    B(hr, V(hr, c, "bar", 16, 152, 320, 56, "Раны", { max: 12, color: "#FF4D6D" }), h_wounds);
    B(hr, V(hr, c, "number", 350, 152, 160, 64, "Стоимость", { unit: "оч." }), h_cost);
    B(hr, V(hr, c, "text", 524, 152, 180, 64, "Инвуль", { size: 16 }), h_inv);
    B(hr, V(hr, c, "ability", 16, 226, 330, 84, "Аура", { desc: "Пока герой жив, союзники в 6 дюймах получают +1 к Ld." }), h_aura);
    const rel = V(hr, c, "ability", 360, 226, 344, 84, "Реликвия", { desc: "Носитель реликвии: +10 очков и особое правило." });
    B(hr, rel, h_relic); rel.condition = "[Реликвия]";
    B(hr, V(hr, c, "tags", 16, 320, 688, 56, "Особые"), h_spec);
  }
  MOD(hr, "Дар 3: W+2", hW, "add", 2, "[Дар]==3");
  MOD(hr, "Дар 2+: Ld+1", hLd, "add", 1, "[Дар]>=2");
  MOD(hr, "Метка: Псайкер", h_spec, "addTag", "Псайкер", "[Дар]>=1");
  MOD(hr, "Метка: Реликвия", h_spec, "addTag", "Реликвия", "[Реликвия]");
  const heroDefs = [
    ["Инквизитор Вейн", "Инквизиция", 6, 2, 2, 4, 4, 5, 4, 9, 3, 2, "4+", 1, true, ["Имперское", "Инквизиция"]],
    ["Комиссар Дрейк", "Имп. Гвардия", 6, 3, 3, 3, 3, 4, 3, 8, 4, 1, "—", 0, false, ["Имперское"]],
    ["Капитан Ролан", "Астартес", 6, 2, 2, 4, 4, 6, 5, 9, 2, 3, "4+", 0, true, ["Имперское", "Астартес"]],
    ["Библиарий Север", "Астартес", 6, 3, 3, 4, 4, 5, 4, 9, 3, 2, "5+", 3, false, ["Имперское", "Астартес", "Псайкер"]],
    ["Капеллан Морн", "Астартес", 6, 2, 3, 4, 4, 5, 4, 9, 3, 2, "4+", 0, true, ["Имперское", "Астартес"]],
    ["Магос К-17", "Механикус", 6, 3, 3, 4, 5, 6, 4, 8, 2, 2, "4+", 0, true, ["Имперское", "Механикус"]],
    ["Сестра-Канонисса Лира", "Сороритас", 6, 2, 2, 3, 3, 5, 4, 9, 3, 2, "4+", 1, true, ["Имперское", "Сороритас"]],
    ["Архонт Векс", "Эльдар", 7, 2, 2, 3, 3, 5, 5, 9, 4, 2, "4+", 0, false, ["Ксенос", "Эльдар"]],
    ["Провидец Аэлин", "Эльдар", 7, 3, 3, 3, 3, 4, 3, 9, 5, 1, "5+", 3, false, ["Ксенос", "Эльдар", "Псайкер"]],
    ["Командир Шас'о Кайс", "Тау", 6, 4, 3, 4, 4, 5, 4, 8, 3, 2, "4+", 0, true, ["Ксенос", "Тау"]]
  ];
  const heroObjs = heroDefs.map(([n, role, m, ws, bs, s, t, w, a, ld, sv, oc, inv, gift, relic, tags]) =>
    OBJ(hr, n, { "Имя": n, "Роль": role, "M": m, "WS": ws, "BS": bs, "S": s, "T": t, "W": w, "A": a, "Ld": ld, "Sv": sv, "OC": oc, "Инвуль": inv, "Дар": gift, "Реликвия": relic }, tags, "Герои"));

  /* =====================================================================
     СХЕМА 5 · НПС — БОЕЦ (массовка, ветеран, сержант)
     ===================================================================== */
  const ft = newSchema("НПС · Боец");
  const f_name = F(ft, "Имя", "text", "Боец");
  const fM = F(ft, "M", "number", "6"), fWS = F(ft, "WS", "number", "4"), fBS = F(ft, "BS", "number", "4"),
    fS = F(ft, "S", "number", "3"), fT = F(ft, "T", "number", "3"), fW = F(ft, "W", "number", "1"),
    fA = F(ft, "A", "number", "1"), fLd = F(ft, "Ld", "number", "6"), fSv = F(ft, "Sv", "number", "5");
  const f_cost = F(ft, "Стоимость", "calc", "0", "=[W]*2+[S]+[T]+[A]*2+MAX(0,6-[Sv])*2+IF([Ветеран],4,0)");
  const f_vet = F(ft, "Ветеран", "flag", "false");
  const f_gear = F(ft, "Снаряжение", "text", "Лазган");
  const f_spec = F(ft, "Особые", "tags", "");
  {
    const c = CARD(ft, 680, 230);
    B(ft, V(ft, c, "text", 16, 12, 648, 30, "Имя", { size: 17 }), f_name);
    TBL(ft, c, 16, 48, 648, 58, [fM, fWS, fBS, fS, fT, fW, fA, fLd, fSv]);
    B(ft, V(ft, c, "number", 16, 116, 150, 60, "Стоимость", { unit: "оч." }), f_cost);
    B(ft, V(ft, c, "text", 180, 116, 230, 60, "Снаряжение", { size: 13 }), f_gear);
    B(ft, V(ft, c, "tags", 424, 116, 240, 60, "Особые"), f_spec);
  }
  MOD(ft, "Ветеран: Ld+1", fLd, "add", 1, "[Ветеран]");
  MOD(ft, "Ветеран: A+1", fA, "add", 1, "[Ветеран]");
  MOD(ft, "Метка: Ветеран", f_spec, "addTag", "Ветеран", "[Ветеран]");
  CON(ft, "Отряду нужен сержант", "requires", "Сержант", "roster", "", "В отряде с бойцами должен быть сержант");
  CON(ft, "Не более 30 бойцов", "max", 30, "roster", "", "В отряде не более 30 бойцов");
  // [name, faction, M,WS,BS,S,T,W,A,Ld,Sv, gear]
  const fighterBases = [
    ["Гвардеец", "Имперское", 6, 4, 4, 3, 3, 1, 1, 6, 5, "Лазган"],
    ["Скитарий-рейнджер", "Механикус", 6, 4, 4, 3, 4, 1, 1, 7, 4, "Гальваническая винтовка"],
    ["Скитарий-вангард", "Механикус", 6, 4, 4, 3, 4, 1, 2, 7, 4, "Радиевый карабин"],
    ["Сестра Битвы", "Сороритас", 6, 4, 4, 3, 3, 1, 1, 7, 3, "Болтер"],
    ["Целестинка", "Сороритас", 6, 3, 3, 3, 3, 1, 1, 8, 3, "Плазма-пистолет"],
    ["Орк-бой", "Орки", 5, 4, 5, 4, 4, 1, 2, 6, 6, "Шутка"],
    ["Гретчин", "Орки", 5, 5, 5, 2, 2, 1, 1, 4, 6, "Грот-бластер"],
    ["Штормбой", "Орки", 6, 4, 5, 4, 4, 1, 2, 6, 6, "Шутка"],
    ["Некрон-воин", "Некроны", 5, 4, 4, 4, 4, 1, 1, 10, 4, "Гаусс-бластер"],
    ["Бессмертный", "Некроны", 5, 3, 3, 4, 4, 1, 1, 10, 3, "Гаусс-бластер"],
    ["Воин Тау", "Тау", 6, 5, 4, 3, 3, 1, 1, 6, 4, "Импульсный карабин"],
    ["Патфайндер", "Тау", 6, 5, 4, 3, 3, 1, 1, 6, 5, "Импульсный карабин"],
    ["Страж Эльдар", "Эльдар", 7, 3, 3, 3, 3, 1, 1, 7, 5, "Катапульта"],
    ["Гормагант", "Тираниды", 6, 4, 5, 3, 3, 1, 1, 5, 6, "Костяные когти"],
    ["Термагагант", "Тираниды", 6, 4, 5, 3, 3, 1, 1, 5, 6, "Пожиратель плоти"],
    ["Генокрад", "Тираниды", 6, 3, 4, 4, 3, 1, 2, 6, 5, "Когти"],
    ["Культист", "Хаос", 6, 4, 4, 3, 3, 1, 1, 6, 6, "Автоган"],
    ["Космодесантник", "Астартес", 6, 3, 3, 4, 4, 2, 2, 7, 3, "Болтер"],
    ["Разведчик", "Астартес", 6, 3, 3, 4, 4, 1, 1, 7, 4, "Снайперская винтовка"],
    ["Кабалит", "Эльдар", 6, 3, 3, 3, 3, 1, 1, 6, 4, "Осколочная пушка"]
  ];
  const fighterObjs = [];
  fighterBases.forEach(([n, fac, m, ws, bs, s, t, w, a, ld, sv, gear]) => {
    const tiers = [
      ["новобранец", { WS: ws + 1, BS: bs + 1, Ld: Math.max(3, ld - 1) }, false],
      ["боец", {}, false],
      ["ветеран", {}, true]
    ];
    tiers.forEach(([suffix, over, vet]) => {
      const name = n + "-" + suffix;
      fighterObjs.push(OBJ(ft, name, {
        "Имя": name, "M": m, "WS": over.WS ?? ws, "BS": over.BS ?? bs, "S": s, "T": t,
        "W": w, "A": a, "Ld": over.Ld ?? ld, "Sv": sv, "Ветеран": vet, "Снаряжение": gear
      }, [fac, vet ? "Ветеран" : "Пехота"], "НПС/Бойцы"));
    });
  });
  // сержанты фракций (тег «Сержант» для ограничения)
  const sergeantDefs = [
    ["Сержант Гвардии", "Имперское", 6, 4, 4, 3, 3, 1, 2, 7, 5],
    ["Скитарий-альфа", "Механикус", 6, 4, 4, 3, 4, 2, 2, 8, 4],
    ["Сестра-Супериор", "Сороритас", 6, 3, 3, 3, 3, 2, 2, 8, 3],
    ["Орк-сержант", "Орки", 5, 4, 5, 4, 4, 2, 3, 7, 6],
    ["Некрон-повелитель", "Некроны", 5, 3, 3, 4, 4, 2, 2, 10, 3],
    ["Тау-Шаас'ла", "Тау", 6, 5, 4, 3, 3, 2, 2, 7, 4],
    ["Страж-Экзарх", "Эльдар", 7, 3, 3, 3, 3, 2, 2, 8, 5],
    ["Тиранид-альфа", "Тираниды", 6, 3, 4, 4, 3, 2, 3, 6, 5],
    ["Сержант Астартес", "Астартес", 6, 3, 3, 4, 4, 2, 3, 8, 3],
    ["Культист-демагог", "Хаос", 6, 4, 4, 3, 3, 2, 2, 7, 6]
  ];
  sergeantDefs.forEach(([n, fac, m, ws, bs, s, t, w, a, ld, sv]) =>
    fighterObjs.push(OBJ(ft, n, { "Имя": n, "M": m, "WS": ws, "BS": bs, "S": s, "T": t, "W": w, "A": a, "Ld": ld, "Sv": sv, "Ветеран": true, "Снаряжение": "Болт-пистолет" }, [fac, "Сержант", "Ветеран"], "НПС/Сержанты")));

  /* =====================================================================
     СХЕМА 6 · НПС — ЭЛИТА (выбор брони)
     ===================================================================== */
  const el = newSchema("НПС · Элита");
  const e_name = F(el, "Имя", "text", "Элита");
  const eM = F(el, "M", "number", "5"), eWS = F(el, "WS", "number", "3"), eBS = F(el, "BS", "number", "3"),
    eS = F(el, "S", "number", "4"), eT = F(el, "T", "number", "5"), eW = F(el, "W", "number", "3"),
    eA = F(el, "A", "number", "3"), eLd = F(el, "Ld", "number", "8"), eSv = F(el, "Sv", "number", "2");
  const e_inv = F(el, "Инвуль", "text", "4+");
  const e_armor = F(el, "Броня", "number", "2", "", "1=лёгкая 2=средняя 3=тяжёлая", 1, 3);
  const e_cost = F(el, "Стоимость", "calc", "0", "=[W]*3+[S]*2+[T]*2+[A]*3+MAX(0,6-[Sv])*3+[Броня]*4");
  const e_spec = F(el, "Особые", "tags", "");
  {
    const c = CARD(el, 680, 230);
    B(el, V(el, c, "text", 16, 12, 648, 30, "Имя", { size: 17 }), e_name);
    TBL(el, c, 16, 48, 648, 58, [eM, eWS, eBS, eS, eT, eW, eA, eLd, eSv]);
    B(el, V(el, c, "number", 16, 116, 150, 60, "Стоимость", { unit: "оч." }), e_cost);
    B(el, V(el, c, "text", 180, 116, 120, 60, "Инвуль", { size: 15 }), e_inv);
    B(el, V(el, c, "tags", 314, 116, 350, 60, "Особые"), e_spec);
  }
  MOD(el, "Тяжёлая броня: Sv−1", eSv, "sub", 1, "[Броня]==3");
  MOD(el, "Тяжёлая броня: M−1", eM, "sub", 1, "[Броня]==3");
  MOD(el, "Метка: Тяжёлая броня", e_spec, "addTag", "Тяжёлая броня", "[Броня]==3");
  CON(el, "Элита: не более 1 на 5", "atMostPer", 1, "roster", "", "Слишком много элиты на отряд", 5);
  const eliteDefs = [
    ["Терминатор", "Астартес", 4, 3, 3, 4, 5, 3, 3, 8, 2, "4+", 3, ["Имперское", "Астартес"]],
    ["Штурмовой терминатор", "Астартес", 4, 3, 3, 4, 5, 3, 4, 8, 2, "4+", 3, ["Имперское", "Астартес"]],
    ["Ветеран Астартес", "Астартес", 6, 2, 2, 4, 4, 3, 4, 8, 2, "5+", 2, ["Имперское", "Астартес"]],
    ["Сангвардия", "Астартес", 6, 2, 2, 4, 4, 3, 4, 9, 2, "4+", 2, ["Имперское", "Астартес"]],
    ["Личгвард", "Некроны", 5, 3, 3, 5, 5, 3, 3, 10, 3, "4+", 3, ["Ксенос", "Некроны"]],
    ["Кризис Тау", "Тау", 6, 5, 4, 5, 5, 3, 3, 7, 3, "4+", 3, ["Ксенос", "Тау"]],
    ["Директ Авенджер", "Эльдар", 7, 3, 3, 3, 3, 2, 3, 8, 4, "5+", 2, ["Ксенос", "Эльдар"]],
    ["Ноб Орков", "Орки", 5, 3, 5, 5, 5, 3, 4, 7, 5, "—", 2, ["Ксенос", "Орки"]],
    ["Коммандо", "Орки", 6, 4, 5, 4, 4, 2, 3, 6, 6, "—", 1, ["Ксенос", "Орки"]],
    ["Сестра-Ретрибутор", "Сороритас", 6, 4, 3, 3, 3, 2, 2, 8, 3, "5+", 2, ["Имперское", "Сороритас"]],
    ["Доминьон", "Сороритас", 6, 4, 3, 3, 3, 2, 2, 8, 3, "5+", 2, ["Имперское", "Сороритас"]],
    ["Тиранский воин", "Тираниды", 6, 3, 4, 5, 5, 3, 4, 7, 4, "5+", 2, ["Ксенос", "Тираниды"]]
  ];
  const eliteObjs = eliteDefs.map(([n, fac, m, ws, bs, s, t, w, a, ld, sv, inv, armor, tags]) =>
    OBJ(el, n, { "Имя": n, "M": m, "WS": ws, "BS": bs, "S": s, "T": t, "W": w, "A": a, "Ld": ld, "Sv": sv, "Инвуль": inv, "Броня": armor }, tags, "НПС/Элита"));

  /* =====================================================================
     СХЕМА 7 · НПС — ПСАЙКЕР (выбор силы дара)
     ===================================================================== */
  const ps = newSchema("НПС · Псайкер");
  const p_name = F(ps, "Имя", "text", "Псайкер");
  const pM = F(ps, "M", "number", "6"), pWS = F(ps, "WS", "number", "3"), pBS = F(ps, "BS", "number", "3"),
    pS = F(ps, "S", "number", "3"), pT = F(ps, "T", "number", "3"), pW = F(ps, "W", "number", "3"),
    pA = F(ps, "A", "number", "2"), pLd = F(ps, "Ld", "number", "8"), pSv = F(ps, "Sv", "number", "4");
  const p_gift = F(ps, "Дар", "number", "1", "", "1=слабый 2=средний 3=мощный", 1, 3);
  const p_spells = F(ps, "Заклинания", "number", "1");
  const p_inv = F(ps, "Инвуль", "text", "5+");
  const p_cost = F(ps, "Стоимость", "calc", "0", "=[W]*3+[Ld]*2+[Дар]*10+[Заклинания]*5");
  const p_spec = F(ps, "Особые", "tags", "");
  {
    const c = CARD(ps, 680, 230);
    B(ps, V(ps, c, "text", 16, 12, 648, 30, "Имя", { size: 17 }), p_name);
    TBL(ps, c, 16, 48, 648, 58, [pM, pWS, pBS, pS, pT, pW, pA, pLd, pSv]);
    B(ps, V(ps, c, "number", 16, 116, 150, 60, "Стоимость", { unit: "оч." }), p_cost);
    B(ps, V(ps, c, "stat", 180, 116, 120, 60, "Дар"), p_gift);
    B(ps, V(ps, c, "tags", 314, 116, 350, 60, "Особые"), p_spec);
  }
  MOD(ps, "Дар 3: W+2", pW, "add", 2, "[Дар]==3");
  MOD(ps, "Дар 3: +1 заклинание", p_spells, "add", 1, "[Дар]==3");
  MOD(ps, "Дар 2+: Ld+1", pLd, "add", 1, "[Дар]>=2");
  MOD(ps, "Метка: Псайкер", p_spec, "addTag", "Псайкер", "[Дар]>=1");
  const psykerDefs = [
    ["Библиарий", "Астартес", 6, 3, 3, 4, 4, 4, 3, 9, 3, 2, 2, "5+", ["Имперское", "Астартес"]],
    ["Псайкер-Примарис", "Астартес", 6, 3, 3, 4, 4, 4, 3, 9, 3, 2, 2, "5+", ["Имперское", "Астартес"]],
    ["Колдун Хаоса", "Хаос", 6, 3, 3, 4, 4, 4, 3, 9, 4, 2, 2, "5+", ["Хаос"]],
    ["Провидец Эльдар", "Эльдар", 7, 3, 3, 3, 3, 3, 2, 9, 5, 3, 2, "5+", ["Ксенос", "Эльдар"]],
    ["Зоантроп", "Тираниды", 6, 4, 4, 4, 4, 4, 2, 7, 5, 3, 2, "5+", ["Ксенос", "Тираниды"]],
    ["Нейроантроп", "Тираниды", 6, 4, 4, 4, 4, 3, 2, 7, 5, 2, 1, "5+", ["Ксенос", "Тираниды"]],
    ["Сестра-Диалогус", "Сороритас", 6, 4, 4, 3, 3, 3, 2, 8, 3, 1, 1, "5+", ["Имперское", "Сороритас"]],
    ["Магос-Псайкер", "Механикус", 6, 4, 4, 4, 5, 4, 3, 8, 3, 1, 1, "5+", ["Имперское", "Механикус"]]
  ];
  const psykerObjs = psykerDefs.map(([n, fac, m, ws, bs, s, t, w, a, ld, sv, gift, spells, inv, tags]) =>
    OBJ(ps, n, { "Имя": n, "M": m, "WS": ws, "BS": bs, "S": s, "T": t, "W": w, "A": a, "Ld": ld, "Sv": sv, "Дар": gift, "Заклинания": spells, "Инвуль": inv }, [...tags, "Псайкер"], "НПС/Псайкеры"));

  /* =====================================================================
     СХЕМА 8 · НПС — ТЕХНИКА (повреждения, корпус)
     ===================================================================== */
  const vh = newSchema("НПС · Техника");
  const v_name = F(vh, "Имя", "text", "Машина");
  const vM = F(vh, "M", "number", "8"), vWS = F(vh, "WS", "number", "4"), vBS = F(vh, "BS", "number", "4"),
    vS = F(vh, "S", "number", "6"), vT = F(vh, "T", "number", "7"), vW = F(vh, "W", "number", "8"),
    vA = F(vh, "A", "number", "3"), vLd = F(vh, "Ld", "number", "8"), vSv = F(vh, "Sv", "number", "3");
  const v_hull = F(vh, "Корпус", "calc", "0", "=[W]");
  const v_dmg = F(vh, "Поврежден", "flag", "false");
  const v_cost = F(vh, "Стоимость", "calc", "0", "=[W]*4+[T]*3+[S]*2+[A]*3");
  const v_spec = F(vh, "Особые", "tags", "");
  {
    const c = CARD(vh, 680, 240);
    B(vh, V(vh, c, "text", 16, 12, 648, 30, "Имя", { size: 17 }), v_name);
    TBL(vh, c, 16, 48, 648, 58, [vM, vBS, vS, vT, vW, vA, vSv]);
    B(vh, V(vh, c, "bar", 16, 116, 320, 56, "Корпус", { max: 18, color: "#FB923C" }), v_hull);
    B(vh, V(vh, c, "number", 350, 116, 150, 60, "Стоимость", { unit: "оч." }), v_cost);
    B(vh, V(vh, c, "tags", 514, 116, 150, 60, "Особые"), v_spec);
  }
  MOD(vh, "Поврежден: M−3", vM, "sub", 3, "[Поврежден]");
  MOD(vh, "Поврежден: A−1", vA, "sub", 1, "[Поврежден]");
  MOD(vh, "Поврежден: BS+1", vBS, "add", 1, "[Поврежден]");
  MOD(vh, "Метка: Поврежден", v_spec, "addTag", "Поврежден", "[Поврежден]");
  CON(vh, "Не более 2 машин", "max", 2, "roster", "", "В отряде не более двух машин");
  const vehicleDefs = [
    ["Дредноут", "Астартес", 6, 3, 3, 6, 7, 8, 4, 8, 2, ["Имперское", "Астартес"]],
    ["Дредноут Кастеллан", "Астартес", 5, 3, 3, 7, 8, 12, 4, 8, 2, ["Имперское", "Астартес"]],
    ["Сентинель", "Имперское", 8, 4, 4, 5, 6, 6, 2, 7, 3, ["Имперское"]],
    ["Химера", "Имперское", 10, 4, 4, 6, 7, 10, 3, 7, 3, ["Имперское"]],
    ["Леман Русс", "Имперское", 10, 4, 4, 7, 8, 12, 3, 7, 2, ["Имперское"]],
    ["Рино", "Астартес", 10, 4, 3, 6, 7, 10, 3, 8, 3, ["Имперское", "Астартес"]],
    ["Тау-Дрон", "Тау", 8, 5, 4, 4, 5, 4, 2, 6, 4, ["Ксенос", "Тау"]],
    ["Три-сталкер", "Некроны", 8, 4, 4, 6, 7, 8, 3, 10, 3, ["Ксенос", "Некроны"]]
  ];
  const vehicleObjs = vehicleDefs.map(([n, fac, m, ws, bs, s, t, w, a, ld, sv, tags]) =>
    OBJ(vh, n, { "Имя": n, "M": m, "WS": ws, "BS": bs, "S": s, "T": t, "W": w, "A": a, "Ld": ld, "Sv": sv }, [...tags, "Техника"], "НПС/Техника"));

  /* =====================================================================
     СХЕМА 9 · СВОДКА ОТРЯДА (агрегаты слотов)
     ===================================================================== */
  const sm = newSchema("Сводка отряда");
  const s_name = F(sm, "Название", "text", "Отряд");
  const s_comp = F(sm, "Состав", "text", "—");
  const s_models = F(sm, "Моделей", "calc", "0", "=COUNT_SLOT(#Бойцы)+COUNT_SLOT(#Элита)+COUNT_SLOT(#Техника)+COUNT_SLOT(#Командир)");
  const s_pts_f = F(sm, "Очки бойцов", "calc", "0", "=SUM_SLOT(#Бойцы.Стоимость)");
  const s_pts_e = F(sm, "Очки элиты", "calc", "0", "=SUM_SLOT(#Элита.Стоимость)");
  const s_pts_v = F(sm, "Очки техники", "calc", "0", "=SUM_SLOT(#Техника.Стоимость)");
  const s_pts_c = F(sm, "Очки командира", "calc", "0", "=SUM_SLOT(#Командир.Стоимость)");
  const s_pts_w = F(sm, "Очки оружия", "calc", "0", "=SUM_SLOT(#Арсенал.Стоимость)");
  const s_total = F(sm, "Всего очков", "calc", "0", "=SUM_SLOT(#Бойцы.Стоимость)+SUM_SLOT(#Элита.Стоимость)+SUM_SLOT(#Техника.Стоимость)+SUM_SLOT(#Командир.Стоимость)+SUM_SLOT(#Арсенал.Стоимость)");
  {
    const c = CARD(sm, 680, 200);
    B(sm, V(sm, c, "text", 16, 12, 648, 30, "Название", { size: 18 }), s_name);
    B(sm, V(sm, c, "text", 16, 48, 648, 24, "Состав", { size: 12 }), s_comp);
    B(sm, V(sm, c, "stat", 16, 84, 200, 80, "Моделей"), s_models);
    B(sm, V(sm, c, "stat", 230, 84, 200, 80, "Всего очков"), s_total);
    B(sm, V(sm, c, "number", 444, 84, 220, 80, "Очки оружия", { unit: "оч." }), s_pts_w);
  }

  /* =====================================================================
     КОМПОНОВКИ (листы)
     ===================================================================== */
  const mkLayoutX = (name, w, h) => {
    const l = { id: uid(), name, canvas: { w, h }, pageFormat: "A4", pages: [{ h: 1120 }], nodes: [], links: [] };
    layouts.push(l); return l;
  };
  const Ltitle = (l, text, w) => {
    const t = mkNode("text", 40, 24, w - 80, 46, "Заголовок", { static: text, size: 22 });
    t.space = "layout"; l.nodes.push(t); return t;
  };
  const Lsec = (l, y, label, w, h) => {
    const sec = mkNode("section", 40, y, w - 80, h, label, { layoutMode: "free", autoHeight: true });
    sec.space = "layout"; l.nodes.push(sec); return sec;
  };
  const Lslot = (l, sec, label, schemaId, cols, view, h) => {
    const sw = mkNode("slot", 16, 40, sec.frame.w - 32, h, label, { sourceSchema: schemaId, autoHeight: true, cols, view });
    sw.parent = sec.id; sw.space = "layout"; l.nodes.push(sw);
    l.links.push(link(sec, "contains-out", sw, "contains-in", "contains"));
    return sw;
  };

  // Лист отряда
  const squadL = mkLayoutX("Лист отряда", 980, 2400);
  Ltitle(squadL, "ЛИСТ ОТРЯДА", 980);
  const sqSummary = Lslot(squadL, Lsec(squadL, 90, "Сводка", 980, 150), "Сводка", sm.id, 1, "full", 90);
  const sqCmd = Lslot(squadL, Lsec(squadL, 260, "Командир", 980, 340), "Командир", hr.id, 1, "full", 280);
  const sqFight = Lslot(squadL, Lsec(squadL, 620, "Бойцы", 980, 300), "Бойцы", ft.id, 4, "compact", 240);
  const sqElite = Lslot(squadL, Lsec(squadL, 940, "Элита", 980, 320), "Элита", el.id, 2, "full", 260);
  const sqVeh = Lslot(squadL, Lsec(squadL, 1280, "Техника", 980, 320), "Техника", vh.id, 2, "full", 260);
  const sqArs = Lslot(squadL, Lsec(squadL, 1620, "Арсенал", 980, 260), "Арсенал", rw.id, 3, "compact", 200);

  // Бестиарий
  const galL = mkLayoutX("Бестиарий", 1180, 3200);
  Ltitle(galL, "БЕСТИАРИЙ · ВСЕ НПС", 1180);
  const galFight = Lslot(galL, Lsec(galL, 90, "Пехота", 1180, 400), "Пехота", ft.id, 5, "compact", 340);
  const galElite = Lslot(galL, Lsec(galL, 510, "Элита", 1180, 360), "Элита", el.id, 4, "compact", 300);
  const galPsy = Lslot(galL, Lsec(galL, 890, "Псайкеры", 1180, 400), "Псайкеры", ps.id, 3, "full", 340);
  const galVeh = Lslot(galL, Lsec(galL, 1310, "Техника", 1180, 400), "Техника", vh.id, 2, "full", 340);

  // Витрина арсенала
  const arsL = mkLayoutX("Витрина арсенала", 1180, 2800);
  Ltitle(arsL, "ВИТРИНА АРСЕНАЛА", 1180);
  const arsR = Lslot(arsL, Lsec(arsL, 90, "Стрелковое", 1180, 500), "Стрелковое", rw.id, 3, "full", 440);
  const arsM = Lslot(arsL, Lsec(arsL, 610, "Ближний бой", 1180, 500), "Ближний бой", mw.id, 3, "full", 440);
  const arsE = Lslot(arsL, Lsec(arsL, 1130, "Экзотика", 1180, 400), "Экзотика", ex.id, 3, "full", 340);

  // Лист героя
  const heroL = mkLayoutX("Лист героя", 900, 1500);
  Ltitle(heroL, "ЛИСТ ГЕРОЯ", 900);
  const hHero = Lslot(heroL, Lsec(heroL, 90, "Герой", 900, 420), "Герой", hr.id, 1, "full", 360);
  const hMelee = Lslot(heroL, Lsec(heroL, 530, "Оружие героя", 900, 300), "Оружие героя", mw.id, 2, "full", 240);
  const hRanged = Lslot(heroL, Lsec(heroL, 850, "Дальнее оружие", 900, 300), "Дальнее оружие", rw.id, 2, "full", 240);

  /* =====================================================================
     РОСТЕРЫ (готовые отряды)
     ===================================================================== */
  const byName = (arr, n) => arr.find(o => o.name === n);
  const mkRoster = (name, layout, role, limit, folder, assigns) => {
    const r = { id: uid(), name, layout: layout.id,
      character: { name, role, notes: "", portrait: "" },
      assign: {}, limits: { points: limit }, folder };
    Object.entries(assigns).forEach(([slot, list]) => {
      r.assign[slot] = list.filter(Boolean).map(([o, count]) => ({ id: uid(), objectId: o.id, count: count || 1, alias: "", notes: "" }));
    });
    rosters.push(r); return r;
  };
  const summaryObj = (name, comp) => OBJ(sm, name, { "Название": name, "Состав": comp }, ["Сводка"], "Отряды");

  // 1 · Штурмовой отряд «Молот»
  {
    const s = summaryObj("Сводка · Молот", "Инквизитор + 10 гвардейцев + 2 терминатора");
    mkRoster("Штурмовой отряд «Молот»", squadL, "Инквизиция", 700, "Отряды", {
      [sqSummary.id]: [[s, 1]],
      [sqCmd.id]: [[byName(heroObjs, "Инквизитор Вейн"), 1]],
      [sqFight.id]: [[byName(fighterObjs, "Гвардеец-боец"), 10], [byName(fighterObjs, "Сержант Гвардии"), 1]],
      [sqElite.id]: [[byName(eliteObjs, "Терминатор"), 2]],
      [sqArs.id]: [[byName(rangedObjs, "Тяжёлый болтер"), 2], [byName(rangedObjs, "Лазпушка"), 1]]
    });
  }
  // 2 · Гарнизон «Щит»
  {
    const s = summaryObj("Сводка · Щит", "20 гвардейцев + сержант");
    mkRoster("Гарнизон «Щит»", squadL, "Имп. Гвардия", 600, "Отряды", {
      [sqSummary.id]: [[s, 1]],
      [sqFight.id]: [[byName(fighterObjs, "Гвардеец-боец"), 12], [byName(fighterObjs, "Гвардеец-ветеран"), 8], [byName(fighterObjs, "Сержант Гвардии"), 1]],
      [sqArs.id]: [[byName(rangedObjs, "Тяжёлый болтер"), 2]]
    });
  }
  // 3 · Механикус-манипула
  {
    const s = summaryObj("Сводка · Манипула", "Магос + 12 скитариев + дредноут");
    mkRoster("Механикус-манипула", squadL, "Адептус Механикус", 800, "Отряды", {
      [sqSummary.id]: [[s, 1]],
      [sqCmd.id]: [[byName(heroObjs, "Магос К-17"), 1]],
      [sqFight.id]: [[byName(fighterObjs, "Скитарий-рейнджер-боец"), 6], [byName(fighterObjs, "Скитарий-вангард-боец"), 6], [byName(fighterObjs, "Скитарий-альфа"), 1]],
      [sqVeh.id]: [[byName(vehicleObjs, "Дредноут Кастеллан"), 1]],
      [sqArs.id]: [[byName(rangedObjs, "Грав-пушка"), 2]]
    });
  }
  // 4 · Конвент Сестёр
  {
    const s = summaryObj("Сводка · Конвент", "Канонисса + 12 сестёр + ретрибуторы");
    mkRoster("Конвент Сестёр", squadL, "Адепта Сороритас", 750, "Отряды", {
      [sqSummary.id]: [[s, 1]],
      [sqCmd.id]: [[byName(heroObjs, "Сестра-Канонисса Лира"), 1]],
      [sqFight.id]: [[byName(fighterObjs, "Сестра Битвы-боец"), 10], [byName(fighterObjs, "Целестинка-боец"), 2], [byName(fighterObjs, "Сестра-Супериор"), 1]],
      [sqElite.id]: [[byName(eliteObjs, "Сестра-Ретрибутор"), 2]],
      [sqArs.id]: [[byName(rangedObjs, "Тяжёлый огнемёт"), 2]]
    });
  }
  // 5 · Орочья банда
  {
    const s = summaryObj("Сводка · Банда", "25 орков + ноб + гретчины");
    mkRoster("Орочья банда", squadL, "Орки", 700, "Отряды", {
      [sqSummary.id]: [[s, 1]],
      [sqFight.id]: [[byName(fighterObjs, "Орк-бой-боец"), 18], [byName(fighterObjs, "Гретчин-боец"), 7], [byName(fighterObjs, "Орк-сержант"), 1]],
      [sqElite.id]: [[byName(eliteObjs, "Ноб Орков"), 1]],
      [sqArs.id]: [[byName(rangedObjs, "Шутка") || byName(rangedObjs, "Дробовик"), 3]]
    });
  }
  // 6 · Некронская фаланга
  {
    const s = summaryObj("Сводка · Фаланга", "20 воинов + 5 бессмертных + личгвард");
    mkRoster("Некронская фаланга", squadL, "Некроны", 850, "Отряды", {
      [sqSummary.id]: [[s, 1]],
      [sqFight.id]: [[byName(fighterObjs, "Некрон-воин-боец"), 15], [byName(fighterObjs, "Бессмертный-боец"), 5], [byName(fighterObjs, "Некрон-повелитель"), 1]],
      [sqElite.id]: [[byName(eliteObjs, "Личгвард"), 2]],
      [sqArs.id]: [[byName(rangedObjs, "Гаусс-бластер"), 3]]
    });
  }
  // 7 · Кадр Тау
  {
    const s = summaryObj("Сводка · Кадр", "Шас'о + 12 воинов + кризисы + дрон");
    mkRoster("Кадр Тау", squadL, "Тау", 800, "Отряды", {
      [sqSummary.id]: [[s, 1]],
      [sqCmd.id]: [[byName(heroObjs, "Командир Шас'о Кайс"), 1]],
      [sqFight.id]: [[byName(fighterObjs, "Воин Тау-боец"), 8], [byName(fighterObjs, "Патфайндер-боец"), 4], [byName(fighterObjs, "Тау-Шаас'ла"), 1]],
      [sqElite.id]: [[byName(eliteObjs, "Кризис Тау"), 2]],
      [sqVeh.id]: [[byName(vehicleObjs, "Тау-Дрон"), 1]],
      [sqArs.id]: [[byName(rangedObjs, "Рельсотрон"), 1]]
    });
  }
  // 8 · Рой Тиранидов (стресс: 50+ моделей)
  {
    const s = summaryObj("Сводка · Рой", "50 гаунтов + воины + зоантроп");
    mkRoster("Рой Тиранидов", squadL, "Тираниды", 1200, "Отряды/Стресс", {
      [sqSummary.id]: [[s, 1]],
      [sqFight.id]: [[byName(fighterObjs, "Гормагант-боец"), 30], [byName(fighterObjs, "Термагагант-боец"), 20], [byName(fighterObjs, "Тиранид-альфа"), 1]],
      [sqElite.id]: [[byName(eliteObjs, "Тиранский воин"), 3]]
    });
  }
  // 9 · Ударный кулак (элита)
  {
    const s = summaryObj("Сводка · Кулак", "Капитан + 8 терминаторов");
    mkRoster("Ударный кулак", squadL, "Астартес", 900, "Отряды", {
      [sqSummary.id]: [[s, 1]],
      [sqCmd.id]: [[byName(heroObjs, "Капитан Ролан"), 1]],
      [sqElite.id]: [[byName(eliteObjs, "Терминатор"), 5], [byName(eliteObjs, "Сангвардия"), 3]],
      [sqFight.id]: [[byName(fighterObjs, "Сержант Астартес"), 1]]
    });
  }
  // 10 · Стресс-легион (100+ моделей)
  {
    const s = summaryObj("Сводка · Легион", "60 десантников + 10 терминаторов + 2 дредноута");
    mkRoster("Стресс-легион", squadL, "Астартес", 3000, "Отряды/Стресс", {
      [sqSummary.id]: [[s, 1]],
      [sqCmd.id]: [[byName(heroObjs, "Капитан Ролан"), 1]],
      [sqFight.id]: [[byName(fighterObjs, "Космодесантник-боец"), 40], [byName(fighterObjs, "Космодесантник-ветеран"), 20], [byName(fighterObjs, "Сержант Астартес"), 1]],
      [sqElite.id]: [[byName(eliteObjs, "Терминатор"), 10]],
      [sqVeh.id]: [[byName(vehicleObjs, "Дредноут"), 2]],
      [sqArs.id]: [[byName(rangedObjs, "Тяжёлый болтер"), 3]]
    });
  }
  // 11 · Бестиарий — все НПС
  mkRoster("Бестиарий · Все НПС", galL, "Каталог", 100000, "Каталоги", {
    [galFight.id]: fighterObjs.map(o => [o, 1]),
    [galElite.id]: eliteObjs.map(o => [o, 1]),
    [galPsy.id]: psykerObjs.map(o => [o, 1]),
    [galVeh.id]: vehicleObjs.map(o => [o, 1])
  });
  // 12 · Витрина арсенала — всё оружие
  mkRoster("Витрина арсенала", arsL, "Каталог", 100000, "Каталоги", {
    [arsR.id]: rangedObjs.map(o => [o, 1]),
    [arsM.id]: meleeObjs.map(o => [o, 1]),
    [arsE.id]: exoticObjs.map(o => [o, 1])
  });
  // 13 · Инквизитор соло
  mkRoster("Инквизитор Вейн (соло)", heroL, "Инквизиция", 400, "Герои", {
    [hHero.id]: [[byName(heroObjs, "Инквизитор Вейн"), 1]],
    [hMelee.id]: [[byName(meleeObjs, "Силовой меч"), 1]],
    [hRanged.id]: [[byName(rangedObjs, "Плазма-пистолет"), 1]]
  });
  // 14 · Псайкер-ковен
  mkRoster("Псайкер-ковен", galL, "Псайкеры", 100000, "Каталоги", {
    [galPsy.id]: psykerObjs.map(o => [o, 1])
  });

  return { schemas, objects, layouts, rosters };
}


function buildStressPack2() {
  const schemas = [], objects = [], layouts = [], rosters = [];

  /* ---------- helpers (те же, что в волне 1) ---------- */
  const newSchema = (name) => {
    const s = { id: uid(), name, version: 1, canvas: { w: 1580, h: 1300 },
      fields: [], nodes: [], links: [], changelog: [],
      layers: ["base", "set", "equipment", "add", "mul", "bounds"], stacking: "stack", _sy: 40 };
    schemas.push(s); return s;
  };
  const F = (s, name, type = "number", def = "0", formula = "", unit = "", min = null, max = null) => {
    const f = field(name, type, def, formula);
    f.unit = unit; f.min = min; f.max = max; f.order = s.fields.length;
    s.fields.push(f);
    const n = mkNode("field", 30, 40 + (s.fields.length - 1) * 76, 150, 64, name);
    n.props.fieldId = f.id; n.bind = f.id; s.nodes.push(n);
    return { f, n };
  };
  const CARD = (s, w, h, label = "Карточка") => {
    const c = mkNode("card", 360, 40, w, h, label, { layoutMode: "free" });
    s.nodes.push(c); return c;
  };
  const V = (s, c, kind, x, y, w, h, label, props = {}) => {
    const n = mkNode(kind, x, y, w, h, label, props);
    n.parent = c.id; s.nodes.push(n);
    s.links.push(link(c, "contains-out", n, "contains-in", "contains"));
    return n;
  };
  const B = (s, node, f) => {
    node.bind = f.f.id; node.props.field = f.f.name;
    s.links.push(link(f.n, "out", node, "data-in", "data")); return node;
  };
  const TBL = (s, c, x, y, w, h, fs) => {
    const t = V(s, c, "table", x, y, w, h, "Профиль", { fields: fs.map(f => f.f.name) });
    fs.forEach(f => s.links.push(link(f.n, "out", t, "data-in", "data"))); return t;
  };
  const MOD = (s, label, target, op, value, condExpr, layer = "add") => {
    const y = s._sy; s._sy += condExpr ? 175 : 95;
    const m = mkNode("modifier", 1120, y, 210, 76, label, { operation: op, value: String(value), layer });
    s.nodes.push(m); s.links.push(link(m, "out", target.n, "in", "modifies"));
    if (condExpr) {
      const c = mkNode("condition", 1120, y + 88, 210, 64, label + " · условие", { expr: condExpr, mode: "AND" });
      s.nodes.push(c); s.links.push(link(c, "out", m, "cond-in", "condition"));
    }
    return m;
  };
  const CON = (s, label, rule, value, scope, filterTag, message, per = 1) => {
    const y = s._sy; s._sy += 100;
    const c = mkNode("constraint", 1120, y, 240, 80, label, { rule, value, scope, filterTag, message, per });
    s.nodes.push(c); return c;
  };
  const OBJ = (s, name, vals, tags = [], folder = "", extra = {}) => {
    const o = { id: uid(), schema: s.id, schemaVersion: 1, name,
      values: Object.fromEntries(s.fields.map(f => [f.id, vals[f.name] !== undefined ? vals[f.name] : f.default])),
      tags, folder, notes: "", deleted: false, ...extra };
    objects.push(o); return o;
  };
  const FIT = (s) => { s.canvas.h = Math.max(1300, 80 + s.fields.length * 76, s._sy + 140); delete s._sy; };

  /* =====================================================================
     СХЕМА 10 · ОРУЖИЕ — КОНФИГУРАТОР (4 селектора + 2 флага)
     ===================================================================== */
  const cf = newSchema("Оружие · Конфигуратор");
  const cf_name = F(cf, "Имя", "text", "Модульный карабин");
  const cf_barrel = F(cf, "Ствол", "number", "1", "", "1=лаз 2=болт 3=плазма 4=мельта", 1, 4);
  const cf_power = F(cf, "Питание", "number", "1", "", "1=штатное 2=усиленное 3=форсаж", 1, 3);
  const cf_scope = F(cf, "Прицел", "number", "0", "", "0=нет 1=коллиматор 2=оптика", 0, 2);
  const cf_under = F(cf, "Подствольник", "number", "0", "", "0=нет 1=гранатомёт 2=огнемёт", 0, 2);
  const cf_bayonet = F(cf, "Штык", "flag", "false");
  const cf_silencer = F(cf, "Глушитель", "flag", "false");
  const cf_rng = F(cf, "Дальность", "number", "24", "", "дюймы");
  const cf_a = F(cf, "A", "number", "1");
  const cf_bs = F(cf, "BS", "number", "4");
  const cf_s = F(cf, "S", "number", "3");
  const cf_ap = F(cf, "AP", "number", "0");
  const cf_d = F(cf, "D", "number", "1");
  const cf_cost = F(cf, "Стоимость", "calc", "0", "=10+[S]*2+[D]*3+[A]*2+MAX(0,-[AP])*2+[Питание]*3+[Прицел]*4+[Подствольник]*6+IF([Штык],3,0)+IF([Глушитель],4,0)");
  const cf_spec = F(cf, "Особые", "tags", "");
  {
    const c = CARD(cf, 720, 330);
    B(cf, V(cf, c, "text", 16, 12, 688, 32, "Имя", { size: 18 }), cf_name);
    TBL(cf, c, 16, 52, 688, 60, [cf_rng, cf_a, cf_bs, cf_s, cf_ap, cf_d]);
    B(cf, V(cf, c, "stat", 16, 124, 110, 64, "Ствол"), cf_barrel);
    B(cf, V(cf, c, "stat", 138, 124, 110, 64, "Питание"), cf_power);
    B(cf, V(cf, c, "stat", 260, 124, 110, 64, "Прицел"), cf_scope);
    B(cf, V(cf, c, "stat", 382, 124, 130, 64, "Подствольник"), cf_under);
    B(cf, V(cf, c, "number", 524, 124, 180, 64, "Стоимость", { unit: "оч." }), cf_cost);
    const hot = V(cf, c, "ability", 16, 198, 330, 60, "Перегрев", { desc: "Плазменный ствол: при 1 на попадании носитель погибает." });
    B(cf, hot, cf_barrel); hot.condition = "[Ствол]==3";
    const melta = V(cf, c, "ability", 360, 198, 344, 60, "Мельта-правило", { desc: "В half-дальности урон +1." });
    B(cf, melta, cf_barrel); melta.condition = "[Ствол]==4";
    B(cf, V(cf, c, "tags", 16, 266, 688, 52, "Особые"), cf_spec);
  }
  MOD(cf, "Болт: A+1", cf_a, "add", 1, "[Ствол]==2");
  MOD(cf, "Болт: S+1", cf_s, "add", 1, "[Ствол]==2");
  MOD(cf, "Болт: AP−1", cf_ap, "sub", 1, "[Ствол]==2");
  MOD(cf, "Плазма: S+4", cf_s, "add", 4, "[Ствол]==3");
  MOD(cf, "Плазма: AP−3", cf_ap, "sub", 3, "[Ствол]==3");
  MOD(cf, "Плазма: D+1", cf_d, "add", 1, "[Ствол]==3");
  MOD(cf, "Мельта: S+5", cf_s, "add", 5, "[Ствол]==4");
  MOD(cf, "Мельта: AP−4", cf_ap, "sub", 4, "[Ствол]==4");
  MOD(cf, "Мельта: дальность 12", cf_rng, "set", 12, "[Ствол]==4");
  MOD(cf, "Форсаж: S+1", cf_s, "add", 1, "[Питание]==3");
  MOD(cf, "Форсаж: D+1", cf_d, "add", 1, "[Питание]==3");
  MOD(cf, "Оптика: BS−1", cf_bs, "sub", 1, "[Прицел]>=1");
  MOD(cf, "Оптика: +12 дальность", cf_rng, "add", 12, "[Прицел]==2");
  MOD(cf, "Гранатомёт: A+1", cf_a, "add", 1, "[Подствольник]==1");
  MOD(cf, "Метка: Перегрев", cf_spec, "addTag", "Перегрев", "[Ствол]==3");
  MOD(cf, "Метка: Мельта", cf_spec, "addTag", "Мельта", "[Ствол]==4");
  MOD(cf, "Метка: Гранаты", cf_spec, "addTag", "Гранаты", "[Подствольник]==1");
  MOD(cf, "Метка: Шаблон", cf_spec, "addTag", "Шаблон", "[Подствольник]==2");
  MOD(cf, "Метка: Штык", cf_spec, "addTag", "Штык", "[Штык]");
  MOD(cf, "Метка: Скрытность", cf_spec, "addTag", "Скрытность", "[Глушитель]");
  CON(cf, "Форсаж: не более 2", "max", 2, "roster", "Перегрев", "Не более двух перегреваемых стволов на отряд");
  // [имя, ствол, питание, прицел, подствольник, штык, глушитель, теги]
  const cfgDefs = [
    ["Лаз-карабин «Стандарт»", 1, 1, 0, 0, false, false, ["Имперское"]],
    ["Лаз-карабин «Марксман»", 1, 2, 2, 0, false, true, ["Имперское", "Снайперское"]],
    ["Лаз-карабин «Штурм»", 1, 2, 1, 1, true, false, ["Имперское", "Штурмовое"]],
    ["Болт-карабин «Гроза»", 2, 2, 1, 0, true, false, ["Имперское"]],
    ["Болт-карабин «Тишина»", 2, 1, 0, 0, false, true, ["Имперское", "Разведка"]],
    ["Болт-карабин «Гранат»", 2, 2, 0, 1, false, false, ["Имперское", "Штурмовое"]],
    ["Плазма-карабин «Форсаж»", 3, 3, 2, 0, false, false, ["Имперское", "Тяжёлое"]],
    ["Плазма-карабин «Щадящий»", 3, 1, 1, 0, false, false, ["Имперское"]],
    ["Мельта-карабин «Охотник»", 4, 2, 0, 0, false, false, ["Имперское", "Противотанковое"]],
    ["Мельта-карабин «Инферно»", 4, 3, 0, 2, false, false, ["Имперское", "Тяжёлое"]],
    ["Гибрид «Хамелеон»", 1, 3, 2, 2, false, true, ["Ксенос", "Тау"]],
    ["Гибрид «Всесожжение»", 3, 3, 0, 1, true, false, ["Хаос", "Тяжёлое"]]
  ];
  const cfgObjs = cfgDefs.map(([n, b, p, sc, u, bay, sil, tags]) =>
    OBJ(cf, n, { "Имя": n, "Ствол": b, "Питание": p, "Прицел": sc, "Подствольник": u, "Штык": bay, "Глушитель": sil }, tags, "Арсенал/Конфигуратор"));

  /* =====================================================================
     СХЕМА 11 · ОРУЖИЕ — РЕЛИКВИЯ (ступени пробуждения, проклятие)
     ===================================================================== */
  const rl = newSchema("Оружие · Реликвия");
  const rl_name = F(rl, "Имя", "text", "Реликвия");
  const rl_tier = F(rl, "Ступень", "number", "0", "", "0=спящая 1=пробуждена 2=вознесена 3=абсолют", 0, 3);
  const rl_curse = F(rl, "Проклятие", "flag", "false");
  const rl_ws = F(rl, "WS", "number", "3");
  const rl_a = F(rl, "A", "number", "2");
  const rl_s = F(rl, "S", "number", "4");
  const rl_ap = F(rl, "AP", "number", "0");
  const rl_d = F(rl, "D", "number", "1");
  const rl_cost = F(rl, "Стоимость", "calc", "0", "=8+[S]*2+[A]*3+[D]*2+MAX(0,-[AP])*2+[Ступень]*9+IF([Проклятие],6,0)");
  const rl_spec = F(rl, "Особые", "tags", "");
  {
    const c = CARD(rl, 720, 300);
    B(rl, V(rl, c, "text", 16, 12, 688, 32, "Имя", { size: 18 }), rl_name);
    TBL(rl, c, 16, 52, 688, 60, [rl_ws, rl_a, rl_s, rl_ap, rl_d]);
    B(rl, V(rl, c, "stat", 16, 124, 150, 64, "Ступень"), rl_tier);
    B(rl, V(rl, c, "number", 180, 124, 160, 64, "Стоимость", { unit: "оч." }), rl_cost);
    B(rl, V(rl, c, "tags", 354, 124, 350, 64, "Особые"), rl_spec);
    const whisper = V(rl, c, "ability", 16, 198, 688, 88, "Шёпот бездны", { desc: "Проклятая реликвия: носитель получает −1 Ld, но +1 урон в ближнем бою." });
    B(rl, whisper, rl_curse); whisper.condition = "[Проклятие]";
  }
  MOD(rl, "Ступень 1+: S+1", rl_s, "add", 1, "[Ступень]>=1");
  MOD(rl, "Ступень 2+: AP−2", rl_ap, "sub", 2, "[Ступень]>=2");
  MOD(rl, "Ступень 2+: A+1", rl_a, "add", 1, "[Ступень]>=2");
  MOD(rl, "Абсолют: D+2", rl_d, "add", 2, "[Ступень]==3");
  MOD(rl, "Абсолют: WS−1", rl_ws, "sub", 1, "[Ступень]==3");
  MOD(rl, "Проклятие: D+1", rl_d, "add", 1, "[Проклятие]");
  MOD(rl, "Метка: Пробуждена", rl_spec, "addTag", "Пробуждена", "[Ступень]>=1");
  MOD(rl, "Метка: Вознесена", rl_spec, "addTag", "Вознесена", "[Ступень]>=2");
  MOD(rl, "Метка: Проклятое", rl_spec, "addTag", "Проклятое", "[Проклятие]");
  CON(rl, "Абсолют: не более 1", "max", 1, "roster", "Вознесена", "В отряде не более одной вознесённой реликвии");
  const relicDefs = [
    ["Клинок Рассвета · спящий", 0, false, 3, 2, 4, 0, 1, ["Имперское"]],
    ["Клинок Рассвета · пробуждённый", 1, false, 3, 2, 4, 0, 1, ["Имперское"]],
    ["Клинок Рассвета · вознесённый", 2, false, 3, 2, 4, 0, 1, ["Имперское"]],
    ["Клинок Рассвета · абсолют", 3, false, 3, 2, 4, 0, 1, ["Имперское"]],
    ["Коса Пожирателя · спящая", 0, true, 3, 3, 5, -1, 2, ["Хаос", "Нургл"]],
    ["Коса Пожирателя · абсолют", 3, true, 3, 3, 5, -1, 2, ["Хаос", "Нургл"]],
    ["Копьё Аэлин · пробуждённое", 1, false, 2, 3, 5, -2, 2, ["Ксенос", "Эльдар"]],
    ["Молот Грома · вознесённый", 2, false, 4, 2, 8, -2, 3, ["Имперское", "Астартес"]]
  ];
  const relicObjs = relicDefs.map(([n, t, curse, ws, a, s, ap, d, tags]) =>
    OBJ(rl, n, { "Имя": n, "Ступень": t, "Проклятие": curse, "WS": ws, "A": a, "S": s, "AP": ap, "D": d }, tags, "Арсенал/Реликвии"));

  /* =====================================================================
     СХЕМА 12 · ПЕРСОНАЖ — КОМАНДИР (доктрины, ветеранство)
     ===================================================================== */
  const cm = newSchema("Персонаж · Командир");
  const cm_name = F(cm, "Имя", "text", "Командир");
  const cm_role = F(cm, "Роль", "text", "Лидер");
  const cmM = F(cm, "M", "number", "6"), cmWS = F(cm, "WS", "number", "2"), cmBS = F(cm, "BS", "number", "2"),
    cmS = F(cm, "S", "number", "4"), cmT = F(cm, "T", "number", "4"), cmW = F(cm, "W", "number", "5"),
    cmA = F(cm, "A", "number", "4"), cmLd = F(cm, "Ld", "number", "9"), cmSv = F(cm, "Sv", "number", "3"), cmOC = F(cm, "OC", "number", "2");
  const cm_doc = F(cm, "Доктрина", "number", "1", "", "1=штурм 2=оборона 3=разведка", 1, 3);
  const cm_vet = F(cm, "Ветеранство", "number", "0", "", "0=новичок 1=обстрелян 2=ветеран 3=легенда", 0, 3);
  const cm_insp = F(cm, "Вдохновение", "flag", "false");
  const cm_psy = F(cm, "Псайкер", "flag", "false");
  const cm_inv = F(cm, "Инвуль", "text", "4+");
  const cm_wounds = F(cm, "Раны", "calc", "0", "=[W]");
  const cm_cost = F(cm, "Стоимость", "calc", "0", "=[W]*4+[S]+[T]+[A]*3+[Ld]*2+MAX(0,6-[Sv])*3+[Ветеранство]*6+IF([Вдохновение],8,0)+IF([Псайкер],14,0)");
  const cm_spec = F(cm, "Особые", "tags", "");
  {
    const c = CARD(cm, 760, 430);
    B(cm, V(cm, c, "text", 16, 12, 728, 34, "Имя", { size: 20 }), cm_name);
    B(cm, V(cm, c, "text", 16, 50, 728, 24, "Роль", { size: 13 }), cm_role);
    TBL(cm, c, 16, 82, 728, 60, [cmM, cmWS, cmBS, cmS, cmT, cmW, cmA, cmLd, cmSv, cmOC]);
    B(cm, V(cm, c, "bar", 16, 152, 300, 56, "Раны", { max: 12, color: "#FF4D6D" }), cm_wounds);
    B(cm, V(cm, c, "stat", 330, 152, 120, 64, "Доктрина"), cm_doc);
    B(cm, V(cm, c, "stat", 464, 152, 130, 64, "Ветеранство"), cm_vet);
    B(cm, V(cm, c, "number", 608, 152, 136, 64, "Стоимость", { unit: "оч." }), cm_cost);
    const d1 = V(cm, c, "ability", 16, 228, 236, 88, "Доктрина штурма", { desc: "Отряд в 6″: +1″ к продвижению и +1 атака в charge-ход." });
    B(cm, d1, cm_doc); d1.condition = "[Доктрина]==1";
    const d2 = V(cm, c, "ability", 262, 228, 236, 88, "Доктрина обороны", { desc: "Отряд в 6″: +1 к спасброскам в укрытии, перестрелка без штрафа." });
    B(cm, d2, cm_doc); d2.condition = "[Доктрина]==2";
    const d3 = V(cm, c, "ability", 508, 228, 236, 88, "Доктрина разведки", { desc: "Отряд в 6″: переброс 1 на попадание, скрытное развёртывание." });
    B(cm, d3, cm_doc); d3.condition = "[Доктрина]==3";
    B(cm, V(cm, c, "text", 16, 326, 360, 40, "Инвуль", { size: 15 }), cm_inv);
    B(cm, V(cm, c, "tags", 390, 326, 354, 40, "Особые"), cm_spec);
  }
  MOD(cm, "Штурм: M+1", cmM, "add", 1, "[Доктрина]==1");
  MOD(cm, "Штурм: A+1", cmA, "add", 1, "[Доктрина]==1");
  MOD(cm, "Оборона: T+1", cmT, "add", 1, "[Доктрина]==2");
  MOD(cm, "Оборона: Sv−1", cmSv, "sub", 1, "[Доктрина]==2");
  MOD(cm, "Разведка: BS−1", cmBS, "sub", 1, "[Доктрина]==3");
  MOD(cm, "Разведка: Ld+1", cmLd, "add", 1, "[Доктрина]==3");
  MOD(cm, "Легенда: W+2", cmW, "add", 2, "[Ветеранство]==3");
  MOD(cm, "Ветеран+: A+1", cmA, "add", 1, "[Ветеранство]>=2");
  MOD(cm, "Метка: Аура 6″", cm_spec, "addTag", "Аура 6″", "[Вдохновение]");
  MOD(cm, "Метка: Псайкер", cm_spec, "addTag", "Псайкер", "[Псайкер]");
  MOD(cm, "Метка: Легенда", cm_spec, "addTag", "Легенда", "[Ветеранство]==3");
  CON(cm, "Один командир", "max", 1, "roster", "", "В отряде может быть только один командир");
  const commanderDefs = [
    ["Маршал Кастор", "Крестовый поход", 6, 2, 2, 4, 4, 6, 5, 9, 2, 2, 1, 3, true, false, "4+", ["Имперское", "Астартес"]],
    ["Полковник Вейра", "Имп. Гвардия", 6, 3, 3, 3, 3, 5, 3, 9, 4, 1, 2, 2, true, false, "—", ["Имперское"]],
    ["Шас'о Вьор'ла", "Тау", 6, 4, 3, 4, 4, 5, 4, 8, 3, 2, 3, 2, false, false, "4+", ["Ксенос", "Тау"]],
    ["Архонт Малак", "Тёмные Эльдар", 7, 2, 2, 3, 3, 5, 5, 9, 4, 2, 1, 3, false, false, "4+", ["Ксенос", "Тёмные Эльдар"]],
    ["Лорд-Кхорнат", "Хаос", 6, 2, 3, 5, 4, 6, 5, 9, 3, 2, 1, 2, false, false, "4+", ["Хаос", "Кхорн"]],
    ["Провидец Таль'сер", "Эльдар", 7, 3, 3, 3, 3, 4, 3, 9, 5, 1, 3, 3, false, true, "5+", ["Ксенос", "Эльдар", "Псайкер"]],
    ["Кустодий-Трибун", "Кустодес", 6, 2, 2, 5, 5, 7, 5, 10, 2, 3, 2, 3, true, false, "4+", ["Имперское", "Кустодес"]],
    ["Брат-Капитан Стен", "Серые Рыцари", 6, 2, 2, 4, 4, 6, 5, 9, 2, 2, 2, 2, false, true, "4+", ["Имперское", "Серые Рыцари", "Псайкер"]],
    ["Канонисса Аверия", "Сороритас", 6, 2, 2, 3, 3, 5, 4, 9, 3, 2, 2, 3, true, false, "4+", ["Имперское", "Сороритас"]],
    ["Железный Отец Дорн", "Механикус", 6, 3, 3, 4, 5, 6, 4, 8, 2, 2, 2, 1, false, false, "4+", ["Имперское", "Механикус"]]
  ];
  const commanderObjs = commanderDefs.map(([n, role, m, ws, bs, s, t, w, a, ld, sv, oc, doc, vet, insp, psy, inv, tags]) =>
    OBJ(cm, n, { "Имя": n, "Роль": role, "M": m, "WS": ws, "BS": bs, "S": s, "T": t, "W": w, "A": a, "Ld": ld, "Sv": sv, "OC": oc, "Доктрина": doc, "Ветеранство": vet, "Вдохновение": insp, "Псайкер": psy, "Инвуль": inv }, tags, "Герои/Командиры"));

  /* =====================================================================
     СХЕМА 13 · ПЕРСОНАЖ — СПЕЦИАЛИСТ (профессии, оснащение)
     ===================================================================== */
  const sp = newSchema("Персонаж · Специалист");
  const sp_name = F(sp, "Имя", "text", "Специалист");
  const sp_prof = F(sp, "Профессия", "number", "1", "", "1=медик 2=инженер 3=снайпер 4=связист", 1, 4);
  const sp_kit = F(sp, "Оснащение", "number", "1", "", "1=базовое 2=улучшенное 3=мастерское", 1, 3);
  const spM = F(sp, "M", "number", "6"), spWS = F(sp, "WS", "number", "4"), spBS = F(sp, "BS", "number", "4"),
    spS = F(sp, "S", "number", "3"), spT = F(sp, "T", "number", "3"), spW = F(sp, "W", "number", "2"),
    spA = F(sp, "A", "number", "2"), spLd = F(sp, "Ld", "number", "7"), spSv = F(sp, "Sv", "number", "4");
  const sp_cost = F(sp, "Стоимость", "calc", "0", "=[W]*3+[S]+[T]+[A]*2+[Ld]+MAX(0,6-[Sv])*2+[Профессия]*3+[Оснащение]*7");
  const sp_spec = F(sp, "Особые", "tags", "");
  {
    const c = CARD(sp, 720, 330);
    B(sp, V(sp, c, "text", 16, 12, 688, 30, "Имя", { size: 17 }), sp_name);
    TBL(sp, c, 16, 48, 688, 58, [spM, spWS, spBS, spS, spT, spW, spA, spLd, spSv]);
    B(sp, V(sp, c, "stat", 16, 116, 140, 60, "Профессия"), sp_prof);
    B(sp, V(sp, c, "stat", 168, 116, 140, 60, "Оснащение"), sp_kit);
    B(sp, V(sp, c, "number", 320, 116, 150, 60, "Стоимость", { unit: "оч." }), sp_cost);
    B(sp, V(sp, c, "tags", 484, 116, 220, 60, "Особые"), sp_spec);
    const a1 = V(sp, c, "ability", 16, 186, 330, 60, "Полевой медик", { desc: "В конце хода: союзник в 3″ восстанавливает 1 рану на 4+." });
    B(sp, a1, sp_prof); a1.condition = "[Профессия]==1";
    const a2 = V(sp, c, "ability", 360, 186, 344, 60, "Техножрец", { desc: "Машина в 3″ восстанавливает D3 корпуса." });
    B(sp, a2, sp_prof); a2.condition = "[Профессия]==2";
    const a3 = V(sp, c, "ability", 16, 256, 330, 60, "Меткий выстрел", { desc: "Снайперский выстрел: при 6+ цель получает смертельную рану." });
    B(sp, a3, sp_prof); a3.condition = "[Профессия]==3";
    const a4 = V(sp, c, "ability", 360, 256, 344, 60, "Вокс-сеть", { desc: "Приказы командира передаются на 12″ вместо 6″." });
    B(sp, a4, sp_prof); a4.condition = "[Профессия]==4";
  }
  MOD(sp, "Снайпер: BS−2", spBS, "sub", 2, "[Профессия]==3");
  MOD(sp, "Инженер: T+1", spT, "add", 1, "[Профессия]==2");
  MOD(sp, "Мастерское: W+1", spW, "add", 1, "[Оснащение]==3");
  MOD(sp, "Улучшенное+: Ld+1", spLd, "add", 1, "[Оснащение]>=2");
  MOD(sp, "Метка: Медик", sp_spec, "addTag", "Медик", "[Профессия]==1");
  MOD(sp, "Метка: Инженер", sp_spec, "addTag", "Инженер", "[Профессия]==2");
  MOD(sp, "Метка: Снайпер", sp_spec, "addTag", "Снайпер", "[Профессия]==3");
  MOD(sp, "Метка: Связист", sp_spec, "addTag", "Связист", "[Профессия]==4");
  CON(sp, "Не более 4 специалистов", "max", 4, "roster", "", "В отряде не более четырёх специалистов");
  const specDefs = [
    ["Аптекарий Юль", 1, 3, ["Имперское", "Астартес"]], ["Хирург Пластин", 1, 2, ["Имперское"]], ["Сестра-Медика", 1, 1, ["Имперское", "Сороритас"]],
    ["Инженер К-9", 2, 3, ["Имперское", "Механикус"]], ["Механик Дрон-Мастер", 2, 2, ["Ксенос", "Тау"]], ["Кузнец Хаоса", 2, 2, ["Хаос"]],
    ["Снайпер «Призрак»", 3, 3, ["Имперское"]], ["Винторез-Скорпион", 3, 2, ["Ксенос", "Эльдар"]], ["Стрелок Патфайндер", 3, 1, ["Ксенос", "Тау"]],
    ["Вокс-Оператор Лит", 4, 2, ["Имперское"]], ["Связист Астартес", 4, 1, ["Имперское", "Астартес"]], ["Глашатай Арлекинов", 4, 3, ["Ксенос", "Арлекины"]]
  ];
  const specObjs = specDefs.map(([n, prof, kit, tags]) =>
    OBJ(sp, n, { "Имя": n, "Профессия": prof, "Оснащение": kit }, tags, "Герои/Специалисты"));

  /* =====================================================================
     СХЕМА 14 · НПС — МОНСТР (размер, ярость, регенерация)
     ===================================================================== */
  const mn = newSchema("НПС · Монстр");
  const mn_name = F(mn, "Имя", "text", "Монстр");
  const mn_size = F(mn, "Размер", "number", "1", "", "1=малый 2=большой 3=исполин", 1, 3);
  const mn_rage = F(mn, "Ярость", "flag", "false");
  const mn_regen = F(mn, "Регенерация", "number", "0", "", "0=нет 1=слабая 2=мощная", 0, 2);
  const mnM = F(mn, "M", "number", "8"), mnWS = F(mn, "WS", "number", "3"), mnBS = F(mn, "BS", "number", "4"),
    mnS = F(mn, "S", "number", "6"), mnT = F(mn, "T", "number", "6"), mnW = F(mn, "W", "number", "8"),
    mnA = F(mn, "A", "number", "4"), mnLd = F(mn, "Ld", "number", "7"), mnSv = F(mn, "Sv", "number", "3");
  const mn_wounds = F(mn, "Раны", "calc", "0", "=[W]");
  const mn_cost = F(mn, "Стоимость", "calc", "0", "=[W]*4+[S]*2+[T]*3+[A]*3+MAX(0,6-[Sv])*3+[Размер]*8+IF([Ярость],10,0)+[Регенерация]*9");
  const mn_spec = F(mn, "Особые", "tags", "");
  {
    const c = CARD(mn, 720, 330);
    B(mn, V(mn, c, "text", 16, 12, 688, 30, "Имя", { size: 17 }), mn_name);
    TBL(mn, c, 16, 48, 688, 58, [mnM, mnWS, mnBS, mnS, mnT, mnW, mnA, mnLd, mnSv]);
    B(mn, V(mn, c, "bar", 16, 116, 300, 56, "Раны", { max: 20, color: "#FF4D6D" }), mn_wounds);
    B(mn, V(mn, c, "stat", 330, 116, 110, 60, "Размер"), mn_size);
    B(mn, V(mn, c, "number", 454, 116, 150, 60, "Стоимость", { unit: "оч." }), mn_cost);
    B(mn, V(mn, c, "tags", 618, 116, 86, 60, "Особые"), mn_spec);
    const agony = V(mn, c, "ability", 16, 182, 688, 60, "Смертельная агония", { desc: "При гибели: все в 3″ получают D3 смертельных ран на 4+." });
    B(mn, agony, mn_size); agony.condition = "[Размер]>=2";
    const frenzy = V(mn, c, "ability", 16, 252, 688, 60, "Бешенство", { desc: "Ярость: +2 атаки, но −1 Ld и нельзя отступать." });
    B(mn, frenzy, mn_rage); frenzy.condition = "[Ярость]";
  }
  MOD(mn, "Исполин: S+2", mnS, "add", 2, "[Размер]==3");
  MOD(mn, "Исполин: T+1", mnT, "add", 1, "[Размер]==3");
  MOD(mn, "Исполин: W+4", mnW, "add", 4, "[Размер]==3");
  MOD(mn, "Большой+: M+2", mnM, "add", 2, "[Размер]>=2");
  MOD(mn, "Ярость: A+2", mnA, "add", 2, "[Ярость]");
  MOD(mn, "Ярость: Ld−1", mnLd, "sub", 1, "[Ярость]");
  MOD(mn, "Мощная реген: W+2", mnW, "add", 2, "[Регенерация]==2");
  MOD(mn, "Метка: Регенерация", mn_spec, "addTag", "Регенерация", "[Регенерация]>=1");
  MOD(mn, "Метка: Исполин", mn_spec, "addTag", "Исполин", "[Размер]==3");
  MOD(mn, "Метка: Ярость", mn_spec, "addTag", "Ярость", "[Ярость]");
  CON(mn, "Не более 2 монстров", "max", 2, "roster", "", "В отряде не более двух монстров");
  const monsterDefs = [
    ["Карнефекс", "Тираниды", 7, 3, 4, 6, 7, 8, 4, 6, 3, 2, true, 0, ["Ксенос", "Тираниды"]],
    ["Карнефекс-Старожил", "Тираниды", 7, 3, 4, 6, 7, 8, 4, 6, 3, 3, true, 1, ["Ксенос", "Тираниды"]],
    ["Тиран Улья", "Тираниды", 8, 2, 3, 7, 7, 12, 5, 9, 2, 3, false, 2, ["Ксенос", "Тираниды"]],
    ["Демон-Принц", "Хаос", 8, 2, 3, 6, 6, 10, 5, 9, 3, 2, true, 1, ["Хаос"]],
    ["Великий Нечистый", "Хаос", 6, 3, 4, 7, 8, 14, 5, 8, 3, 3, false, 2, ["Хаос", "Нургл"]],
    ["Кровопускатель-Альфа", "Хаос", 8, 2, 4, 6, 5, 6, 6, 8, 4, 1, true, 0, ["Хаос", "Кхорн"]],
    ["Аватар Кхейна", "Эльдар", 7, 2, 3, 7, 7, 10, 6, 10, 2, 2, true, 0, ["Ксенос", "Эльдар"]],
    ["Зомби-Дракон", "Нежить", 6, 4, 5, 6, 6, 12, 4, 5, 4, 3, true, 1, ["Нежить"]],
    ["Гаргант-Сквиг", "Орки", 6, 4, 5, 7, 6, 10, 5, 6, 5, 2, true, 0, ["Ксенос", "Орки"]],
    ["Каноптек-Скорпек", "Некроны", 8, 3, 4, 6, 6, 8, 4, 10, 3, 2, false, 1, ["Ксенос", "Некроны"]]
  ];
  const monsterObjs = monsterDefs.map(([n, fac, m, ws, bs, s, t, w, a, ld, sv, size, rage, regen, tags]) =>
    OBJ(mn, n, { "Имя": n, "M": m, "WS": ws, "BS": bs, "S": s, "T": t, "W": w, "A": a, "Ld": ld, "Sv": sv, "Размер": size, "Ярость": rage, "Регенерация": regen }, [...tags, "Монстр"], "НПС/Монстры"));

  /* =====================================================================
     СХЕМА 15 · НПС — МОБИЛЬНЫЙ ЮНИТ (выбор маунта)
     ===================================================================== */
  const mb = newSchema("НПС · Мобильный юнит");
  const mb_name = F(mb, "Имя", "text", "Всадник");
  const mb_mount = F(mb, "Маунт", "number", "0", "", "0=пешком 1=конь 2=джетпак 3=байк", 0, 3);
  const mbM = F(mb, "M", "number", "6"), mbWS = F(mb, "WS", "number", "3"), mbBS = F(mb, "BS", "number", "3"),
    mbS = F(mb, "S", "number", "4"), mbT = F(mb, "T", "number", "4"), mbW = F(mb, "W", "number", "2"),
    mbA = F(mb, "A", "number", "2"), mbLd = F(mb, "Ld", "number", "7"), mbSv = F(mb, "Sv", "number", "3");
  const mb_cost = F(mb, "Стоимость", "calc", "0", "=[W]*3+[S]+[T]+[A]*2+[M]*2+MAX(0,6-[Sv])*2+[Маунт]*6");
  const mb_spec = F(mb, "Особые", "tags", "");
  {
    const c = CARD(mb, 720, 260);
    B(mb, V(mb, c, "text", 16, 12, 688, 30, "Имя", { size: 17 }), mb_name);
    TBL(mb, c, 16, 48, 688, 58, [mbM, mbWS, mbBS, mbS, mbT, mbW, mbA, mbLd, mbSv]);
    B(mb, V(mb, c, "stat", 16, 116, 140, 60, "Маунт"), mb_mount);
    B(mb, V(mb, c, "number", 168, 116, 150, 60, "Стоимость", { unit: "оч." }), mb_cost);
    B(mb, V(mb, c, "tags", 330, 116, 374, 60, "Особые"), mb_spec);
    const fly = V(mb, c, "ability", 16, 186, 688, 60, "Полёт", { desc: "Джетпак: перемещение через модели и местность без штрафа." });
    B(mb, fly, mb_mount); fly.condition = "[Маунт]==2";
  }
  MOD(mb, "Конь: M+4", mbM, "add", 4, "[Маунт]==1");
  MOD(mb, "Конь: A+1", mbA, "add", 1, "[Маунт]==1");
  MOD(mb, "Джетпак: M=12", mbM, "set", 12, "[Маунт]==2");
  MOD(mb, "Байк: M=14", mbM, "set", 14, "[Маунт]==3");
  MOD(mb, "Байк: T+1", mbT, "add", 1, "[Маунт]==3");
  MOD(mb, "Байк: W+1", mbW, "add", 1, "[Маунт]==3");
  MOD(mb, "Метка: Полёт", mb_spec, "addTag", "Полёт", "[Маунт]==2");
  MOD(mb, "Метка: Кавалерия", mb_spec, "addTag", "Кавалерия", "[Маунт]==1");
  MOD(mb, "Метка: Байк", mb_spec, "addTag", "Байк", "[Маунт]==3");
  CON(mb, "Кавалерия: не более 6", "max", 6, "roster", "Кавалерия", "Не более шести всадников на отряд");
  const mobileDefs = [
    ["Всадник Аттилан", "Имперское", 6, 3, 4, 4, 3, 2, 2, 7, 4, 1, ["Имперское"]],
    ["Всадник Сильван", "Эльдар", 7, 3, 3, 3, 3, 2, 2, 8, 4, 1, ["Ксенос", "Эльдар"]],
    ["Штурмовик Астартес", "Астартес", 6, 3, 3, 4, 4, 2, 2, 7, 3, 2, ["Имперское", "Астартес"]],
    ["Сангвиний-Страж", "Астартес", 6, 2, 3, 4, 4, 3, 3, 8, 2, 2, ["Имперское", "Астартес"]],
    ["Байкер Астартес", "Астартес", 6, 3, 3, 4, 5, 3, 2, 7, 3, 3, ["Имперское", "Астартес"]],
    ["Штормбой-Налётчик", "Орки", 6, 4, 5, 4, 4, 2, 3, 6, 6, 2, ["Ксенос", "Орки"]],
    ["Всадник-Скорпион", "Эльдар", 7, 3, 3, 3, 3, 2, 2, 8, 5, 3, ["Ксенос", "Эльдар"]],
    ["Джетпак-Кризис", "Тау", 6, 5, 4, 5, 5, 3, 3, 7, 3, 2, ["Ксенос", "Тау"]],
    ["Наездник-Культист", "Хаос", 6, 4, 4, 3, 3, 2, 2, 6, 6, 1, ["Хаос"]],
    ["Байкер-Ноб", "Орки", 5, 3, 5, 5, 5, 3, 4, 7, 5, 3, ["Ксенос", "Орки"]],
    ["Тёмный Всадник", "Тёмные Эльдар", 7, 3, 3, 3, 3, 2, 3, 7, 4, 3, ["Ксенос", "Тёмные Эльдар"]],
    ["Пехотинец-Рейнджер", "Имперское", 6, 4, 4, 3, 3, 1, 1, 6, 5, 0, ["Имперское"]]
  ];
  const mobileObjs = mobileDefs.map(([n, fac, m, ws, bs, s, t, w, a, ld, sv, mount, tags]) =>
    OBJ(mb, n, { "Имя": n, "M": m, "WS": ws, "BS": bs, "S": s, "T": t, "W": w, "A": a, "Ld": ld, "Sv": sv, "Маунт": mount }, tags, "НПС/Мобильные"));

  /* =====================================================================
     СХЕМА 16 · НПС — ДРОН/ЗВЕРЬ (тип и протокол)
     ===================================================================== */
  const dr = newSchema("НПС · Дрон и зверь");
  const dr_name = F(dr, "Имя", "text", "Дрон");
  const dr_type = F(dr, "Тип", "number", "1", "", "1=дрон 2=зверь 3=рой", 1, 3);
  const dr_proto = F(dr, "Протокол", "number", "1", "", "1=щит 2=маркер 3=атака", 1, 3);
  const drM = F(dr, "M", "number", "8"), drWS = F(dr, "WS", "number", "5"), drBS = F(dr, "BS", "number", "4"),
    drS = F(dr, "S", "number", "3"), drT = F(dr, "T", "number", "3"), drW = F(dr, "W", "number", "1"),
    drA = F(dr, "A", "number", "1"), drLd = F(dr, "Ld", "number", "6"), drSv = F(dr, "Sv", "number", "4");
  const dr_cost = F(dr, "Стоимость", "calc", "0", "=4+[W]*2+[S]+[T]+[A]*2+MAX(0,6-[Sv])+[Тип]*2+[Протокол]*3");
  const dr_spec = F(dr, "Особые", "tags", "");
  {
    const c = CARD(dr, 680, 230);
    B(dr, V(dr, c, "text", 16, 12, 648, 30, "Имя", { size: 17 }), dr_name);
    TBL(dr, c, 16, 48, 648, 58, [drM, drWS, drBS, drS, drT, drW, drA, drLd, drSv]);
    B(dr, V(dr, c, "stat", 16, 116, 110, 60, "Тип"), dr_type);
    B(dr, V(dr, c, "stat", 138, 116, 130, 60, "Протокол"), dr_proto);
    B(dr, V(dr, c, "number", 280, 116, 150, 60, "Стоимость", { unit: "оч." }), dr_cost);
    B(dr, V(dr, c, "tags", 444, 116, 220, 60, "Особые"), dr_spec);
  }
  MOD(dr, "Зверь: M+2", drM, "add", 2, "[Тип]==2");
  MOD(dr, "Зверь: WS−1", drWS, "sub", 1, "[Тип]==2");
  MOD(dr, "Рой: W+2", drW, "add", 2, "[Тип]==3");
  MOD(dr, "Рой: A+2", drA, "add", 2, "[Тип]==3");
  MOD(dr, "Щит: Sv−1", drSv, "sub", 1, "[Протокол]==1");
  MOD(dr, "Атака: A+1", drA, "add", 1, "[Протокол]==3");
  MOD(dr, "Метка: Полёт", dr_spec, "addTag", "Полёт", "[Тип]==1");
  MOD(dr, "Метка: Рой", dr_spec, "addTag", "Рой", "[Тип]==3");
  MOD(dr, "Метка: Маркер", dr_spec, "addTag", "Маркер", "[Протокол]==2");
  MOD(dr, "Метка: Щит", dr_spec, "addTag", "Щит-протокол", "[Протокол]==1");
  CON(dr, "Рой: не более 12", "max", 12, "roster", "Рой", "Слишком много роёв в отряде");
  const droneDefs = [
    ["Дрон-Щит Тау", 1, 1, ["Ксенос", "Тау"]], ["Дрон-Маркер Тау", 1, 2, ["Ксенос", "Тау"]], ["Дрон-Атака Тау", 1, 3, ["Ксенос", "Тау"]],
    ["Каноптек-Скарабей", 3, 3, ["Ксенос", "Некроны"]], ["Каноптек-Паук", 2, 1, ["Ксенос", "Некроны"]],
    ["Кибер-Волк", 2, 3, ["Имперское", "Астартес"]], ["Фенрирский Волк", 2, 3, ["Имперское", "Астартес"]],
    ["Гончая Хаоса", 2, 3, ["Хаос"]], ["Скарабей-Рой", 3, 1, ["Ксенос", "Некроны"]],
    ["Дрон-Разведчик", 1, 2, ["Имперское", "Механикус"]], ["Сервитор-Носильщик", 1, 1, ["Имперское", "Механикус"]],
    ["Рой-Пожиратель", 3, 3, ["Ксенос", "Тираниды"]]
  ];
  const droneObjs = droneDefs.map(([n, type, proto, tags]) =>
    OBJ(dr, n, { "Имя": n, "Тип": type, "Протокол": proto }, tags, "НПС/Дроны"));

  /* =====================================================================
     СХЕМА 17 · ОТРЯД — КОНСТРУКТОР (отряд как один объект)
     ===================================================================== */
  const sq = newSchema("Отряд · Конструктор");
  const sq_name = F(sq, "Название", "text", "Отряд");
  const sq_type = F(sq, "Тип", "number", "1", "", "1=линейная пехота 2=элита 3=быстрые", 1, 3);
  const sq_count = F(sq, "Численность", "number", "10", "", "бойцов", 5, 20);
  const sq_sgt = F(sq, "Сержант", "flag", "true");
  const sq_sw = F(sq, "Спецоружие", "number", "0", "", "стволов", 0, 3);
  const sq_support = F(sq, "Поддержка", "flag", "false");
  const sq_vets = F(sq, "Ветераны", "flag", "false");
  const sq_models = F(sq, "Моделей", "calc", "0", "=[Численность]+IF([Сержант],1,0)");
  const sq_ppm = F(sq, "Очки бойца", "calc", "0", "=IF([Тип]==1,8,IF([Тип]==2,18,12))");
  const sq_fire = F(sq, "Огневая мощь", "calc", "0", "=[Моделей]*IF([Тип]==2,2,1)+[Спецоружие]*3");
  const sq_grit = F(sq, "Стойкость", "calc", "0", "=[Моделей]+IF([Поддержка],4,0)+IF([Ветераны],2,0)");
  const sq_cost = F(sq, "Стоимость", "calc", "0", "=[Моделей]*[Очки бойца]+IF([Сержант],10,0)+[Спецоружие]*12+IF([Поддержка],25,0)+IF([Ветераны],[Моделей]*3,0)");
  const sq_spec = F(sq, "Особые", "tags", "");
  {
    const c = CARD(sq, 720, 330);
    B(sq, V(sq, c, "text", 16, 12, 688, 32, "Название", { size: 18 }), sq_name);
    B(sq, V(sq, c, "stat", 16, 52, 110, 64, "Тип"), sq_type);
    B(sq, V(sq, c, "stat", 138, 52, 130, 64, "Численность"), sq_count);
    B(sq, V(sq, c, "stat", 280, 52, 120, 64, "Моделей"), sq_models);
    B(sq, V(sq, c, "stat", 412, 52, 130, 64, "Спецоружие"), sq_sw);
    B(sq, V(sq, c, "number", 554, 52, 150, 64, "Стоимость", { unit: "оч." }), sq_cost);
    B(sq, V(sq, c, "bar", 16, 126, 330, 56, "Огневая мощь", { max: 50, color: "#22D3EE" }), sq_fire);
    B(sq, V(sq, c, "bar", 360, 126, 344, 56, "Стойкость", { max: 30, color: "#A3E635" }), sq_grit);
    const heavy = V(sq, c, "ability", 16, 192, 688, 60, "Тяжёлое вооружение", { desc: "2+ спецствола: отряд не может двигаться и стрелять в один ход без штрафа." });
    B(sq, heavy, sq_sw); heavy.condition = "[Спецоружие]>=2";
    B(sq, V(sq, c, "tags", 16, 262, 688, 52, "Особые"), sq_spec);
  }
  MOD(sq, "Ветераны: стойкость+3", sq_grit, "add", 3, "[Ветераны]");
  MOD(sq, "Быстрые: огневая мощь−2", sq_fire, "sub", 2, "[Тип]==3");
  MOD(sq, "Метка: Сержант", sq_spec, "addTag", "Сержант", "[Сержант]");
  MOD(sq, "Метка: Поддержка", sq_spec, "addTag", "Поддержка", "[Поддержка]");
  MOD(sq, "Метка: Ветераны", sq_spec, "addTag", "Ветераны", "[Ветераны]");
  MOD(sq, "Метка: Быстрые", sq_spec, "addTag", "Быстрые", "[Тип]==3");
  MOD(sq, "Метка: Элита", sq_spec, "addTag", "Элита", "[Тип]==2");
  CON(sq, "Спецоружие: 1 на 5 бойцов", "atMostPer", 1, "roster", "", "Слишком много спецоружия на отряд", 5);
  CON(sq, "Не более 6 отрядов", "max", 6, "roster", "", "В ростере не более шести отрядов-конструкторов");
  const squadDefs = [
    ["Пехотный взвод «Линия»", 1, 20, true, 2, false, false, ["Имперское"]],
    ["Пехотный взвод «Резерв»", 1, 10, true, 0, false, false, ["Имперское"]],
    ["Ветеранский взвод «Шторм»", 1, 15, true, 3, true, true, ["Имперское"]],
    ["Элитная команда «Клинок»", 2, 5, true, 2, false, true, ["Имперское", "Астартес"]],
    ["Элитная команда «Молот»", 2, 8, true, 3, true, true, ["Имперское", "Астартес"]],
    ["Терминаторский кулак", 2, 5, true, 2, false, true, ["Имперское", "Астартес"]],
    ["Разведрота «Тень»", 3, 8, true, 1, false, false, ["Имперское"]],
    ["Штурмовая рота «Вихрь»", 3, 12, true, 2, false, true, ["Имперское", "Астартес"]],
    ["Орочья ватага", 1, 20, true, 1, false, false, ["Ксенос", "Орки"]],
    ["Рой-волна", 3, 20, false, 0, false, false, ["Ксенос", "Тираниды"]],
    ["Кустодес-копьё", 2, 5, true, 1, true, true, ["Имперское", "Кустодес"]],
    ["Кабалитский клинок", 3, 10, true, 2, false, false, ["Ксенос", "Тёмные Эльдар"]]
  ];
  const squadCtorObjs = squadDefs.map(([n, type, count, sgt, sw, support, vets, tags]) =>
    OBJ(sq, n, { "Название": n, "Тип": type, "Численность": count, "Сержант": sgt, "Спецоружие": sw, "Поддержка": support, "Ветераны": vets }, tags, "Отряды/Конструктор", { costMode: "unit" }));

  /* =====================================================================
     СХЕМА 18 · НПС — ПЕХОТА II (новая волна, выбор роли)
     ===================================================================== */
  const i2 = newSchema("НПС · Пехота II");
  const i2_name = F(i2, "Имя", "text", "Боец");
  const i2_role = F(i2, "Роль", "number", "1", "", "1=стрелок 2=штурмовик 3=тяжёлый", 1, 3);
  const i2_vet = F(i2, "Ветеран", "flag", "false");
  const i2M = F(i2, "M", "number", "6"), i2WS = F(i2, "WS", "number", "3"), i2BS = F(i2, "BS", "number", "3"),
    i2S = F(i2, "S", "number", "4"), i2T = F(i2, "T", "number", "4"), i2W = F(i2, "W", "number", "2"),
    i2A = F(i2, "A", "number", "2"), i2Ld = F(i2, "Ld", "number", "7"), i2Sv = F(i2, "Sv", "number", "3");
  const i2_gear = F(i2, "Снаряжение", "text", "Болтер");
  const i2_cost = F(i2, "Стоимость", "calc", "0", "=[W]*2+[S]+[T]+[A]*2+MAX(0,6-[Sv])*2+[Роль]*2+IF([Ветеран],4,0)");
  const i2_spec = F(i2, "Особые", "tags", "");
  {
    const c = CARD(i2, 680, 230);
    B(i2, V(i2, c, "text", 16, 12, 648, 30, "Имя", { size: 17 }), i2_name);
    TBL(i2, c, 16, 48, 648, 58, [i2M, i2WS, i2BS, i2S, i2T, i2W, i2A, i2Ld, i2Sv]);
    B(i2, V(i2, c, "stat", 16, 116, 110, 60, "Роль"), i2_role);
    B(i2, V(i2, c, "number", 138, 116, 140, 60, "Стоимость", { unit: "оч." }), i2_cost);
    B(i2, V(i2, c, "text", 290, 116, 200, 60, "Снаряжение", { size: 13 }), i2_gear);
    B(i2, V(i2, c, "tags", 502, 116, 162, 60, "Особые"), i2_spec);
  }
  MOD(i2, "Штурмовик: M+2", i2M, "add", 2, "[Роль]==2");
  MOD(i2, "Штурмовик: WS−1", i2WS, "sub", 1, "[Роль]==2");
  MOD(i2, "Штурмовик: A+1", i2A, "add", 1, "[Роль]==2");
  MOD(i2, "Тяжёлый: M−1", i2M, "sub", 1, "[Роль]==3");
  MOD(i2, "Тяжёлый: S+1", i2S, "add", 1, "[Роль]==3");
  MOD(i2, "Тяжёлый: Sv−1", i2Sv, "sub", 1, "[Роль]==3");
  MOD(i2, "Ветеран: Ld+1", i2Ld, "add", 1, "[Ветеран]");
  MOD(i2, "Ветеран: A+1", i2A, "add", 1, "[Ветеран]");
  MOD(i2, "Метка: Ветеран", i2_spec, "addTag", "Ветеран", "[Ветеран]");
  MOD(i2, "Метка: Тяжёлый", i2_spec, "addTag", "Тяжёлое", "[Роль]==3");
  CON(i2, "Отряду нужен сержант", "requires", "Сержант", "roster", "", "В отряде с бойцами должен быть сержант");
  CON(i2, "Не более 40 бойцов", "max", 40, "roster", "", "В отряде не более 40 бойцов");
  // [имя, фракция, M,WS,BS,S,T,W,A,Ld,Sv, снаряжение]
  const infantry2Bases = [
    ["Кустодий-Страж", "Кустодес", 6, 2, 2, 5, 5, 3, 3, 9, 2, "Копьё стража"],
    ["Серый Рыцарь", "Серые Рыцари", 6, 2, 2, 4, 4, 3, 3, 8, 2, "Немезис-клинок"],
    ["Харткэйн-Воин", "Лиги Вотана", 5, 4, 4, 4, 5, 2, 2, 8, 3, "Болт-револьвер"],
    ["Кабалит-Налётчик", "Тёмные Эльдар", 7, 3, 3, 3, 3, 1, 2, 7, 4, "Осколочная пушка"],
    ["Арлекин-Плясун", "Арлекины", 8, 3, 3, 3, 3, 2, 4, 8, 6, "Поцелуй Арлекина"],
    ["Скорпион-Воин", "Эльдар", 7, 3, 3, 3, 3, 1, 2, 8, 5, "Цепной клинок"],
    ["Берсерк Кхорна", "Хаос", 6, 2, 4, 5, 4, 2, 4, 7, 3, "Цепной топор"],
    ["Чумной Десантник", "Хаос", 5, 3, 3, 4, 5, 2, 2, 7, 3, "Чумной болтер"],
    ["Рубрик-Десантник", "Хаос", 6, 3, 3, 4, 4, 2, 2, 8, 3, "Инферно-болтер"],
    ["Шумовой Десантник", "Хаос", 6, 3, 3, 4, 4, 2, 3, 7, 3, "Звуковая пушка"],
    ["Катачанец", "Имперское", 6, 3, 4, 4, 3, 1, 2, 6, 5, "Дробовик"],
    ["Скитарий-Пельтаст", "Механикус", 6, 4, 4, 3, 4, 1, 2, 7, 4, "Трансуранная аркебуза"]
  ];
  const roleNames = ["стрелок", "штурмовик", "тяжёлый"];
  const infantry2Objs = [];
  infantry2Bases.forEach(([n, fac, m, ws, bs, s, t, w, a, ld, sv, gear]) => {
    roleNames.forEach((rn, ri) => {
      const name = n + "-" + rn;
      infantry2Objs.push(OBJ(i2, name, {
        "Имя": name, "Роль": ri + 1, "Ветеран": false, "M": m, "WS": ws, "BS": bs, "S": s, "T": t,
        "W": w, "A": a, "Ld": ld, "Sv": sv, "Снаряжение": gear
      }, [fac, "Пехота II"], "НПС/Пехота II"));
    });
  });
  const sergeant2Defs = [
    ["Кустодий-Сержант", "Кустодес", 6, 2, 2, 5, 5, 3, 4, 10, 2, "Копьё стража"],
    ["Рыцарь-Юстициар", "Серые Рыцари", 6, 2, 2, 4, 4, 3, 4, 9, 2, "Немезис-демонмолот"],
    ["Харткэйн-Тейн", "Лиги Вотана", 5, 3, 3, 4, 5, 3, 3, 9, 3, "Плазменный клинок"],
    ["Кабалит-Сирен", "Тёмные Эльдар", 7, 3, 3, 3, 3, 2, 3, 8, 4, "Бластер"],
    ["Труппа-Мим", "Арлекины", 8, 3, 3, 3, 3, 3, 5, 9, 6, "Веер клинков"],
    ["Берсерк-Чемпион", "Хаос", 6, 2, 4, 5, 4, 3, 5, 8, 3, "Цепной топор чемпиона"],
    ["Чумной Чемпион", "Хаос", 5, 3, 3, 4, 5, 3, 3, 8, 3, "Чумной меч"],
    ["Катачан-Сержант", "Имперское", 6, 3, 4, 4, 3, 2, 3, 7, 5, "Силовой меч"]
  ];
  sergeant2Defs.forEach(([n, fac, m, ws, bs, s, t, w, a, ld, sv, gear]) =>
    infantry2Objs.push(OBJ(i2, n, { "Имя": n, "Роль": 1, "Ветеран": true, "M": m, "WS": ws, "BS": bs, "S": s, "T": t, "W": w, "A": a, "Ld": ld, "Sv": sv, "Снаряжение": gear }, [fac, "Сержант", "Ветеран", "Пехота II"], "НПС/Сержанты II")));

  /* =====================================================================
     СХЕМЫ 19–22 · СВОДКИ (по одной на лист: метки слотов уникальны,
     т.к. SUM_SLOT ищет слот по метке среди всех компоновок)
     ===================================================================== */
  const mkSummary = (name, modelsFormula, totalFormula, extraLabel, extraFormula) => {
    const s = newSchema(name);
    const f_name = F(s, "Название", "text", "Отряд");
    const f_comp = F(s, "Состав", "text", "—");
    const f_models = F(s, "Моделей", "calc", "0", modelsFormula);
    const f_total = F(s, "Всего очков", "calc", "0", totalFormula);
    const f_extra = F(s, extraLabel, "calc", "0", extraFormula);
    const c = CARD(s, 680, 200);
    B(s, V(s, c, "text", 16, 12, 648, 30, "Название", { size: 18 }), f_name);
    B(s, V(s, c, "text", 16, 48, 648, 24, "Состав", { size: 12 }), f_comp);
    B(s, V(s, c, "stat", 16, 84, 200, 80, "Моделей"), f_models);
    B(s, V(s, c, "stat", 230, 84, 200, 80, "Всего очков"), f_total);
    B(s, V(s, c, "number", 444, 84, 220, 80, extraLabel, { unit: "оч." }), f_extra);
    return s;
  };
  const s2cfg = mkSummary("Сводка · Конфигуратор",
    "=COUNT_SLOT(#Арсенал_CFG)+COUNT_SLOT(#Реликвии)",
    "=SUM_SLOT(#Арсенал_CFG.Стоимость)+SUM_SLOT(#Реликвии.Стоимость)",
    "Очки реликвий", "=SUM_SLOT(#Реликвии.Стоимость)");
  const s2mon = mkSummary("Сводка · Монстры",
    "=COUNT_SLOT(#Монстры_MON)+COUNT_SLOT(#Мобильные)+COUNT_SLOT(#Дроны)",
    "=SUM_SLOT(#Монстры_MON.Стоимость)+SUM_SLOT(#Мобильные.Стоимость)+SUM_SLOT(#Дроны.Стоимость)",
    "Очки дронов", "=SUM_SLOT(#Дроны.Стоимость)");
  const s2spec = mkSummary("Сводка · Специалист",
    "=COUNT_SLOT(#Командир_SPEC)+COUNT_SLOT(#Специалисты)",
    "=SUM_SLOT(#Командир_SPEC.Стоимость)+SUM_SLOT(#Специалисты.Стоимость)+SUM_SLOT(#Арсенал_SPEC.Стоимость)",
    "Очки оружия", "=SUM_SLOT(#Арсенал_SPEC.Стоимость)");
  const s2ctor = mkSummary("Сводка · Отряд",
    "=COUNT_SLOT(#Бойцы_II)+COUNT_SLOT(#Командир_CTOR)+COUNT_SLOT(#Монстры_CTOR)+SUM_SLOT(#Отряды.Моделей)",
    "=SUM_SLOT(#Бойцы_II.Стоимость)+SUM_SLOT(#Командир_CTOR.Стоимость)+SUM_SLOT(#Монстры_CTOR.Стоимость)+SUM_SLOT(#Отряды.Стоимость)",
    "Очки отрядов", "=SUM_SLOT(#Отряды.Стоимость)");

  /* =====================================================================
     КОМПОНОВКИ · ВОЛНА 2
     ===================================================================== */
  const mkLayoutX = (name, w, h) => {
    const l = { id: uid(), name, canvas: { w, h }, pageFormat: "A4", pages: [{ h: 1120 }], nodes: [], links: [] };
    layouts.push(l); return l;
  };
  const Ltitle = (l, text, w) => {
    const t = mkNode("text", 40, 24, w - 80, 46, "Заголовок", { static: text, size: 22 });
    t.space = "layout"; l.nodes.push(t); return t;
  };
  const Lsec = (l, y, label, w, h) => {
    const sec = mkNode("section", 40, y, w - 80, h, label, { layoutMode: "free", autoHeight: true });
    sec.space = "layout"; l.nodes.push(sec); return sec;
  };
  const Lslot = (l, sec, label, schemaId, cols, view, h) => {
    const sw = mkNode("slot", 16, 40, sec.frame.w - 32, h, label, { sourceSchema: schemaId, autoHeight: true, cols, view });
    sw.parent = sec.id; sw.space = "layout"; l.nodes.push(sw);
    l.links.push(link(sec, "contains-out", sw, "contains-in", "contains"));
    return sw;
  };

  // Лист конфигуратора
  const cfgL = mkLayoutX("Лист конфигуратора", 1180, 2600);
  Ltitle(cfgL, "ЛИСТ КОНФИГУРАТОРА", 1180);
  const cfSum = Lslot(cfgL, Lsec(cfgL, 90, "Сводка", 1180, 150), "Сводка_CFG", s2cfg.id, 1, "full", 90);
  const cfArs = Lslot(cfgL, Lsec(cfgL, 260, "Арсенал", 1180, 500), "Арсенал_CFG", cf.id, 2, "full", 440);
  const cfRel = Lslot(cfgL, Lsec(cfgL, 780, "Реликвии", 1180, 420), "Реликвии", rl.id, 2, "full", 360);

  // Каталог монстров
  const monL = mkLayoutX("Каталог монстров", 1180, 3400);
  Ltitle(monL, "КАТАЛОГ МОНСТРОВ И МОБИЛЬНЫХ", 1180);
  const monSum = Lslot(monL, Lsec(monL, 90, "Сводка", 1180, 150), "Сводка_MON", s2mon.id, 1, "full", 90);
  const monMon = Lslot(monL, Lsec(monL, 260, "Монстры", 1180, 500), "Монстры_MON", mn.id, 2, "full", 440);
  const monMob = Lslot(monL, Lsec(monL, 780, "Мобильные", 1180, 420), "Мобильные", mb.id, 3, "compact", 360);
  const monDr = Lslot(monL, Lsec(monL, 1220, "Дроны", 1180, 420), "Дроны", dr.id, 4, "compact", 360);

  // Лист специалиста
  const specL = mkLayoutX("Лист специалиста", 980, 2600);
  Ltitle(specL, "ЛИСТ СПЕЦИАЛИСТА", 980);
  const spSum = Lslot(specL, Lsec(specL, 90, "Сводка", 980, 150), "Сводка_SPEC", s2spec.id, 1, "full", 90);
  const spCmd = Lslot(specL, Lsec(specL, 260, "Командир", 980, 480), "Командир_SPEC", cm.id, 1, "full", 420);
  const spSpec = Lslot(specL, Lsec(specL, 760, "Специалисты", 980, 420), "Специалисты", sp.id, 2, "full", 360);
  const spArs = Lslot(specL, Lsec(specL, 1200, "Арсенал", 980, 320), "Арсенал_SPEC", cf.id, 3, "compact", 260);

  // Лист отряда-конструктора
  const ctorL = mkLayoutX("Лист отряда-конструктора", 980, 2800);
  Ltitle(ctorL, "ЛИСТ ОТРЯДА-КОНСТРУКТОРА", 980);
  const ctSum = Lslot(ctorL, Lsec(ctorL, 90, "Сводка", 980, 150), "Сводка_CTOR", s2ctor.id, 1, "full", 90);
  const ctCmd = Lslot(ctorL, Lsec(ctorL, 260, "Командир", 980, 480), "Командир_CTOR", cm.id, 1, "full", 420);
  const ctSquads = Lslot(ctorL, Lsec(ctorL, 760, "Отряды", 980, 420), "Отряды", sq.id, 2, "full", 360);
  const ctFight = Lslot(ctorL, Lsec(ctorL, 1200, "Бойцы", 980, 320), "Бойцы_II", i2.id, 4, "compact", 260);
  const ctMon = Lslot(ctorL, Lsec(ctorL, 1540, "Монстры", 980, 420), "Монстры_CTOR", mn.id, 1, "full", 360);

  /* =====================================================================
     РОСТЕРЫ · ВОЛНА 2
     ===================================================================== */
  const byName = (arr, n) => arr.find(o => o.name === n);
  const mkRoster = (name, layout, role, limit, folder, assigns) => {
    const r = { id: uid(), name, layout: layout.id,
      character: { name, role, notes: "", portrait: "" },
      assign: {}, limits: { points: limit }, folder };
    Object.entries(assigns).forEach(([slot, list]) => {
      r.assign[slot] = list.filter(Boolean).map(([o, count]) => ({ id: uid(), objectId: o.id, count: count || 1, alias: "", notes: "" }));
    });
    rosters.push(r); return r;
  };
  const summaryObj = (s, name, comp) => OBJ(s, name, { "Название": name, "Состав": comp }, ["Сводка"], "Отряды II");

  // 15 · Охота на монстра
  {
    const s = summaryObj(s2mon, "Сводка · Охота", "Тиран Улья + Карнефекс + волки");
    mkRoster("Охота на монстра", monL, "Тираниды", 1500, "Отряды II", {
      [monSum.id]: [[s, 1]],
      [monMon.id]: [[byName(monsterObjs, "Тиран Улья"), 1], [byName(monsterObjs, "Карнефекс"), 1]],
      [monMob.id]: [[byName(mobileObjs, "Пехотинец-Рейнджер"), 3]],
      [monDr.id]: [[byName(droneObjs, "Рой-Пожиратель"), 4]]
    });
  }
  // 16 · Кавалерийский клин
  {
    const s = summaryObj(s2mon, "Сводка · Клин", "6 всадников + байкеры");
    mkRoster("Кавалерийский клин", monL, "Имперское", 900, "Отряды II", {
      [monSum.id]: [[s, 1]],
      [monMob.id]: [[byName(mobileObjs, "Всадник Аттилан"), 3], [byName(mobileObjs, "Байкер Астартес"), 2], [byName(mobileObjs, "Всадник Сильван"), 1]],
      [monDr.id]: [[byName(droneObjs, "Дрон-Маркер Тау"), 2]]
    });
  }
  // 17 · Рой дронов (стресс: 60+ юнитов)
  {
    const s = summaryObj(s2mon, "Сводка · Рой дронов", "60 дронов и скарабеев");
    mkRoster("Рой дронов", monL, "Каталог", 2500, "Отряды II/Стресс", {
      [monSum.id]: [[s, 1]],
      [monDr.id]: [[byName(droneObjs, "Дрон-Щит Тау"), 12], [byName(droneObjs, "Дрон-Маркер Тау"), 12], [byName(droneObjs, "Дрон-Атака Тау"), 12], [byName(droneObjs, "Каноптек-Скарабей"), 12], [byName(droneObjs, "Скарабей-Рой"), 8], [byName(droneObjs, "Гончая Хаоса"), 6]]
    });
  }
  // 18 · Кустодес-щит
  {
    const s = summaryObj(s2ctor, "Сводка · Кустодес", "Трибун + 9 кустодиев + копьё");
    mkRoster("Кустодес-щит", ctorL, "Кустодес", 1600, "Отряды II", {
      [ctSum.id]: [[s, 1]],
      [ctCmd.id]: [[byName(commanderObjs, "Кустодий-Трибун"), 1]],
      [ctFight.id]: [[byName(infantry2Objs, "Кустодий-Страж-стрелок"), 6], [byName(infantry2Objs, "Кустодий-Страж-штурмовик"), 3], [byName(infantry2Objs, "Кустодий-Сержант"), 1]],
      [ctSquads.id]: [[byName(squadCtorObjs, "Кустодес-копьё"), 1]]
    });
  }
  // 19 · Серые Рыцари — удар
  {
    const s = summaryObj(s2ctor, "Сводка · Серые Рыцари", "Брат-Капитан + 12 рыцарей");
    mkRoster("Серые Рыцари — удар", ctorL, "Серые Рыцари", 1400, "Отряды II", {
      [ctSum.id]: [[s, 1]],
      [ctCmd.id]: [[byName(commanderObjs, "Брат-Капитан Стен"), 1]],
      [ctFight.id]: [[byName(infantry2Objs, "Серый Рыцарь-стрелок"), 6], [byName(infantry2Objs, "Серый Рыцарь-штурмовик"), 4], [byName(infantry2Objs, "Серый Рыцарь-тяжёлый"), 2], [byName(infantry2Objs, "Рыцарь-Юстициар"), 1]],
      [ctSquads.id]: [[byName(squadCtorObjs, "Элитная команда «Клинок»"), 1]]
    });
  }
  // 20 · Вотанская экспедиция
  {
    const s = summaryObj(s2ctor, "Сводка · Вотан", "Тейн + 15 харткэйнов");
    mkRoster("Вотанская экспедиция", ctorL, "Лиги Вотана", 1100, "Отряды II", {
      [ctSum.id]: [[s, 1]],
      [ctFight.id]: [[byName(infantry2Objs, "Харткэйн-Воин-стрелок"), 8], [byName(infantry2Objs, "Харткэйн-Воин-тяжёлый"), 4], [byName(infantry2Objs, "Харткэйн-Тейн"), 1]],
      [ctSquads.id]: [[byName(squadCtorObjs, "Пехотный взвод «Линия»"), 1]]
    });
  }
  // 21 · Тёмный набег
  {
    const s = summaryObj(s2ctor, "Сводка · Набег", "Архонт + 15 кабалитов + всадники");
    mkRoster("Тёмный набег", ctorL, "Тёмные Эльдар", 1000, "Отряды II", {
      [ctSum.id]: [[s, 1]],
      [ctCmd.id]: [[byName(commanderObjs, "Архонт Малак"), 1]],
      [ctFight.id]: [[byName(infantry2Objs, "Кабалит-Налётчик-стрелок"), 10], [byName(infantry2Objs, "Кабалит-Налётчик-штурмовик"), 5], [byName(infantry2Objs, "Кабалит-Сирен"), 1]],
      [ctSquads.id]: [[byName(squadCtorObjs, "Кабалитский клинок"), 1]]
    });
  }
  // 22 · Арлекинская труппа
  {
    const s = summaryObj(s2ctor, "Сводка · Труппа", "Мим + 12 арлекинов");
    mkRoster("Арлекинская труппа", ctorL, "Арлекины", 900, "Отряды II", {
      [ctSum.id]: [[s, 1]],
      [ctFight.id]: [[byName(infantry2Objs, "Арлекин-Плясун-штурмовик"), 8], [byName(infantry2Objs, "Арлекин-Плясун-стрелок"), 4], [byName(infantry2Objs, "Труппа-Мим"), 1]],
      [ctSquads.id]: [[byName(squadCtorObjs, "Разведрота «Тень»"), 1]]
    });
  }
  // 23 · Хаос — все легионы (стресс: 60+ моделей)
  {
    const s = summaryObj(s2ctor, "Сводка · Легионы", "60 десантников Хаоса + демон-принц");
    mkRoster("Хаос — все легионы", ctorL, "Хаос", 3200, "Отряды II/Стресс", {
      [ctSum.id]: [[s, 1]],
      [ctCmd.id]: [[byName(commanderObjs, "Лорд-Кхорнат"), 1]],
      [ctFight.id]: [[byName(infantry2Objs, "Берсерк Кхорна-штурмовик"), 15], [byName(infantry2Objs, "Чумной Десантник-стрелок"), 15], [byName(infantry2Objs, "Рубрик-Десантник-стрелок"), 15], [byName(infantry2Objs, "Шумовой Десантник-тяжёлый"), 10], [byName(infantry2Objs, "Берсерк-Чемпион"), 1], [byName(infantry2Objs, "Чумной Чемпион"), 1]],
      [ctMon.id]: [[byName(monsterObjs, "Демон-Принц"), 1]]
    });
  }
  // 24 · Витрина конфигураторов (каталог)
  mkRoster("Витрина конфигураторов", cfgL, "Каталог", 100000, "Каталоги II", {
    [cfArs.id]: cfgObjs.map(o => [o, 1]),
    [cfRel.id]: relicObjs.map(o => [o, 1])
  });
  // 25 · Каталог специалистов
  mkRoster("Каталог специалистов", specL, "Каталог", 100000, "Каталоги II", {
    [spCmd.id]: commanderObjs.map(o => [o, 1]),
    [spSpec.id]: specObjs.map(o => [o, 1]),
    [spArs.id]: cfgObjs.slice(0, 6).map(o => [o, 1])
  });
  // 26 · Стресс-мегаотряд (200+ моделей через конструкторы)
  {
    const s = summaryObj(s2ctor, "Сводка · Мегаотряд", "6 отрядов-конструкторов + 40 бойцов + исполин");
    mkRoster("Стресс-мегаотряд", ctorL, "Стресс", 8000, "Отряды II/Стресс", {
      [ctSum.id]: [[s, 1]],
      [ctCmd.id]: [[byName(commanderObjs, "Маршал Кастор"), 1]],
      [ctSquads.id]: [[byName(squadCtorObjs, "Пехотный взвод «Линия»"), 1], [byName(squadCtorObjs, "Ветеранский взвод «Шторм»"), 1], [byName(squadCtorObjs, "Элитная команда «Молот»"), 1], [byName(squadCtorObjs, "Штурмовая рота «Вихрь»"), 1], [byName(squadCtorObjs, "Орочья ватага"), 1], [byName(squadCtorObjs, "Рой-волна"), 1]],
      [ctFight.id]: [[byName(infantry2Objs, "Катачанец-стрелок"), 20], [byName(infantry2Objs, "Катачанец-штурмовик"), 10], [byName(infantry2Objs, "Скитарий-Пельтаст-тяжёлый"), 8], [byName(infantry2Objs, "Катачан-Сержант"), 1]],
      [ctMon.id]: [[byName(monsterObjs, "Великий Нечистый"), 1]]
    });
  }
  // 27 · Каталог конструкторов отрядов
  mkRoster("Каталог конструкторов", ctorL, "Каталог", 100000, "Каталоги II", {
    [ctSquads.id]: squadCtorObjs.map(o => [o, 1])
  });
  // 28 · Гибридная коалиция
  {
    const s = summaryObj(s2ctor, "Сводка · Коалиция", "Тау + Эльдар + Вотан против роя");
    mkRoster("Гибридная коалиция", ctorL, "Коалиция", 2600, "Отряды II", {
      [ctSum.id]: [[s, 1]],
      [ctCmd.id]: [[byName(commanderObjs, "Шас'о Вьор'ла"), 1]],
      [ctFight.id]: [[byName(infantry2Objs, "Харткэйн-Воин-стрелок"), 6], [byName(infantry2Objs, "Скорпион-Воин-штурмовик"), 6], [byName(infantry2Objs, "Харткэйн-Тейн"), 1]],
      [ctSquads.id]: [[byName(squadCtorObjs, "Разведрота «Тень»"), 1], [byName(squadCtorObjs, "Элитная команда «Клинок»"), 1]],
      [ctMon.id]: [[byName(monsterObjs, "Аватар Кхейна"), 1]]
    });
  }

  schemas.forEach(FIT);
  return { schemas, objects, layouts, rosters };
}

function applyStressPack(m) {
  m.settings ||= {};
  const prev = m.settings.stressPack || 0;
  if (prev >= STRESS_PACK_VERSION) return false;
  const add = (p) => {
    m.schemas.push(...p.schemas);
    m.objects.push(...p.objects);
    m.layouts.push(...p.layouts);
    m.rosters.push(...p.rosters);
  };
  if (prev < 1) add(buildStressPack());
  add(buildStressPack2());
  m.settings.stressPack = STRESS_PACK_VERSION;
  return true;
}
