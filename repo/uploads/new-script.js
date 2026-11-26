"use strict";
      /* RECRUIT FORGE / offline browser edition. No eval, remote assets or dependencies. */
      const $ = (s) => document.querySelector(s),
        $$ = (s) => [...document.querySelectorAll(s)];
      const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
      const esc = (s) =>
        String(s ?? "").replace(
          /[&<>"']/g,
          (c) =>
            ({
              "&": "&amp;",
              "<": "&lt;",
              ">": "&gt;",
              '"': "&quot;",
              "'": "&#39;",
            })[c],
        );
      const clone = (value) => {
        if (typeof globalThis.structuredClone === "function") return globalThis.structuredClone(value);
        const seen = new WeakMap();
        const copy = (v) => {
          if (v === null || typeof v !== "object") return v;
          if (seen.has(v)) return seen.get(v);
          if (v instanceof Date) return new Date(v.getTime());
          if (v instanceof RegExp) return new RegExp(v.source, v.flags);
          if (v instanceof Map) { const r = new Map(); seen.set(v,r); v.forEach((x,k)=>r.set(copy(k),copy(x))); return r; }
          if (v instanceof Set) { const r = new Set(); seen.set(v,r); v.forEach(x=>r.add(copy(x))); return r; }
          if (v instanceof ArrayBuffer) return v.slice(0);
          if (ArrayBuffer.isView(v)) return new DataView(v.buffer.slice(v.byteOffset,v.byteOffset+v.byteLength));
          const r = Array.isArray(v) ? [] : Object.create(Object.getPrototypeOf(v));
          seen.set(v,r); Object.keys(v).forEach(k=>{r[k]=copy(v[k]);}); return r;
        };
        return copy(value);
      };
      function capturePointer(el,id) { try { if(el?.isConnected && id!=null) el.setPointerCapture(id); } catch {} }
      function releasePointer(el,id) { try { if(el?.hasPointerCapture?.(id)) el.releasePointerCapture(id); } catch {} }
      const uid = () =>
        globalThis.crypto?.randomUUID?.() ||
        "id-" +
          Date.now().toString(36) +
          "-" +
          Math.random().toString(36).slice(2);
      const num = (v) => {
        if (typeof v === "number") return Number.isFinite(v) ? v : 0;
        const d = dice(v);
        if (d) return d.avg;
        const n = parseFloat(String(v).replace("½", ".5").replace(",", "."));
        return Number.isFinite(n) ? n : 0;
      };
      const dice = (v) => {
        const m = /^(\d*)D(\d+)([+-]\d+)?$/i.exec(String(v || "").trim());
        if (!m) return null;
        const n = +(m[1] || 1),
          s = +m[2],
          b = +(m[3] || 0);
        if (n < 1 || n > 100 || s < 2 || s > 1000)
          throw Error("#ОШИБКА: недопустимые кубы");
        return { min: n + b, max: n * s + b, avg: (n * (s + 1)) / 2 + b };
      };
      const stable = (o) => {
        if (Array.isArray(o)) return "[" + o.map(stable).join(",") + "]";
        if (o && typeof o === "object")
          return (
            "{" +
            Object.keys(o)
              .sort()
              .map((k) => JSON.stringify(k) + ":" + stable(o[k]))
              .join(",") +
            "}"
          );
        return JSON.stringify(o) ?? "null";
      };
      const VALUE_TYPES = {
        text: "Текст",
        number: "Число",
        tags: "Список",
        flag: "Да/Нет",
        ref: "Ссылка",
        calc: "Формула",
      };
      const KINDS = {
        section: {
          label: "Секция",
          color: "#F5A524",
          cat: "visual",
          ports: { in: ["cond-in","contains-in"], out: ["contains-out"] },
          min: [120, 70],
        },
        card: {
          label: "Карточка",
          color: "#F5A524",
          cat: "visual",
          ports: { in: ["data-in", "cond-in"], out: ["contains-out"] },
          min: [120, 80],
        },
        row: {
          label: "Ряд",
          color: "#F5A524",
          cat: "visual",
          ports: { in: [], out: ["contains-out"] },
          min: [80, 40],
        },
        column: {
          label: "Колонка",
          color: "#F5A524",
          cat: "visual",
          ports: { in: [], out: ["contains-out"] },
          min: [60, 60],
        },
        slot: {
          label: "Слот объектов",
          color: "#A78BFA",
          cat: "visual",
          ports: {
            in: ["refers-in", "constrains-in", "cond-in"],
            out: ["contains-out"],
          },
          min: [160, 100],
        },
        stat: {
          label: "Плашка",
          color: "#22D3EE",
          cat: "visual",
          ports: { in: ["data-in", "mod-in", "cond-in"], out: [] },
          min: [64, 64],
        },
        text: {
          label: "Текст",
          color: "#22D3EE",
          cat: "visual",
          ports: { in: ["data-in", "cond-in"], out: [] },
          min: [60, 36],
        },
        number: {
          label: "Число",
          color: "#22D3EE",
          cat: "visual",
          ports: { in: ["data-in", "mod-in"], out: [] },
          min: [64, 48],
        },
        bar: {
          label: "Полоса",
          color: "#22D3EE",
          cat: "visual",
          ports: { in: ["data-in"], out: [] },
          min: [80, 48],
        },
        tags: {
          label: "Список тегов",
          color: "#22D3EE",
          cat: "visual",
          ports: { in: ["data-in"], out: [] },
          min: [80, 40],
        },
        table: {
          label: "Таблица",
          color: "#22D3EE",
          cat: "visual",
          ports: { in: ["data-in", "refers-in"], out: ["refers-out"] },
          min: [160, 70],
        },
        ability: {
          label: "Способность",
          color: "#22D3EE",
          cat: "visual",
          ports: { in: ["data-in", "cond-in"], out: [] },
          min: [120, 64],
        },
        divider: {
          label: "Разделитель",
          color: "#8797AE",
          cat: "visual",
          ports: { in: ["cond-in"], out: [] },
          min: [40, 16],
        },
        image: {
          label: "Изображение",
          color: "#8797AE",
          cat: "visual",
          ports: { in: ["data-in"], out: [] },
          min: [48, 48],
        },
        field: {
          label: "Поле",
          color: "#22D3EE",
          cat: "service",
          ports: { in: ["in"], out: ["out"] },
          min: [130, 64],
        },
        modifier: {
          label: "Модификатор",
          color: "#FF4D6D",
          cat: "service",
          ports: { in: ["cond-in"], out: ["out"] },
          min: [160, 76],
        },
        condition: {
          label: "Условие",
          color: "#E879F9",
          cat: "service",
          ports: { in: ["cond-in"], out: ["out"] },
          min: [150, 64],
        },
        constraint: {
          label: "Ограничение",
          color: "#FB923C",
          cat: "service",
          ports: { in: [], out: ["out"] },
          min: [160, 64],
        },
      };
      const CONTAINERS = ["section", "card", "row", "column", "slot"];
      const VISUAL = Object.keys(KINDS).filter(
        (k) => KINDS[k].cat === "visual",
      );
      const LINKS = {
        contains: { label: "содержит", color: "#F5A524" },
        data: { label: "данные", color: "#22D3EE" },
        derive: { label: "вычисляется из", color: "#A3E635" },
        refers: { label: "ссылается на", color: "#A78BFA" },
        modifies: { label: "изменяет", color: "#FF4D6D" },
        condition: { label: "при условии", color: "#E879F9" },
        flow: { label: "порядок", color: "#65A30D" },
        constrains: { label: "ограничивает", color: "#FB923C" },
      };
      const CONNECTION_MATRIX = {
        field: {
          field: ["derive"],
          stat: ["data"],
          number: ["data"],
          text: ["data"],
          bar: ["data"],
          tags: ["data"],
          table: ["data"],
          ability: ["data"],
          image: ["data"],
          card: ["data"],
          slot: ["refers"],
        },
        container: { any: ["contains"] },
        modifier: {
          field: ["modifies"],
          stat: ["modifies"],
          number: ["modifies"],
          slot: ["modifies"],
        },
        condition: { any: ["condition"] },
        constraint: { field: ["constrains"], slot: ["constrains"] },
        any: { any: ["flow"] },
      };
function linkTypeFor(a, ap, b, bp) {
 if (!a || !b || a.id === b.id) return null;
 const out = ap.endsWith('-out') || ap === 'out', inn = bp.endsWith('-in') || bp === 'in';
 if ((out && !inn) || (!out && inn)) return null;
 const [f,t,fp,tp] = out ? [a,b,ap,bp] : [b,a,bp,ap];
 const cat = CONTAINERS.includes(f.kind) ? 'container' : f.kind;
 const allowed = CONNECTION_MATRIX[cat]?.[t.kind] || CONNECTION_MATRIX[cat]?.any || [];
 const portTypes = {data:['data-in'],derive:['in'],modifies:['in','mod-in'],constrains:['in','constrains-in'],refers:['refers-in'],contains:['contains-in'],condition:['cond-in'],flow:['flow-in']};
 const type = allowed.find(x => portTypes[x]?.includes(tp) && (x !== 'flow' || fp === 'flow-out'));
 if (type === 'contains' && (!CONTAINERS.includes(f.kind) || ['divider','image'].includes(t.kind))) return null;
 if (type === 'condition' && f.kind !== 'condition') return null;
 return type || null;
}
      function mkNode(
        kind,
        x = 60,
        y = 60,
        w,
        h,
        label,
        props = {},
        parent = null,
      ) {
        return {
          id: uid(),
          space: "schema",
          kind,
          parent,
          frame: {
            x,
            y,
            w: w || KINDS[kind].min[0] + 40,
            h: h || KINDS[kind].min[1] + 20,
          },
          layoutMode: CONTAINERS.includes(kind) ? "free" : undefined,
          z: 1,
          locked: false,
          hidden: false,
          label: label || KINDS[kind].label,
          ports: [...KINDS[kind].ports.in, ...KINDS[kind].ports.out],
          props: { padding: 8, gap: 8, cols: 2, ...props },
          bind: null,
          condition: null,
          notes: "",
        };
      }
      const link = (a, ap, b, bp, type, props = {}) => ({
        id: uid(),
        from: { node: a.id, port: ap },
        to: { node: b.id, port: bp },
        type,
        props: {
          layer: "add",
          weight: 1,
          repeatBy: "",
          condition: "",
          ...props,
        },
      });
      function field(name, type = "number", def = "0", formula = "") {
        return {
          id: uid(),
          name,
          type,
          unit: "",
          default: def,
          formula,
          width: 90,
          order: 0,
          min: null,
          max: null,
          round: null,
          removed: false,
        };
      }
      function mkSchema(name, preset = "empty") {
        const s = {
          id: uid(),
          name,
          version: 1,
          canvas: { w: 1200, h: 800 },
          fields: [],
          nodes: [],
          links: [],
          changelog: [],
          layers: ["base", "set", "equipment", "add", "mul", "bounds"],
          stacking: "stack",
        };
        const add = (n, f) => {
          s.nodes.push(n);
          if (f) {
            f.order = s.fields.length;
            s.fields.push(f);
            n.props.fieldId = f.id;
            n.bind = f.id;
          }
          return n;
        };
        if (
          preset === "stats" ||
          (preset === "empty" && name === "Характеристики")
        ) {
          ["M", "WS", "BS", "S", "T", "W", "A", "Ld", "Sv", "OC"].forEach(
            (k, i) =>
              add(
                mkNode("field", 30, 30 + i * 76, 140, 64, k),
                field(k, "number", "3"),
              ),
          );
          add(
            mkNode("field", 30, 790, 140, 64, "Имя"),
            field("Имя", "text", "Персонаж"),
          );
          const t = add(
            mkNode("table", 260, 80, 850, 100, "Статлайн", {
              fields: ["M", "WS", "BS", "S", "T", "W", "A", "Ld", "Sv", "OC"],
            }),
          );
          s.nodes
            .filter((n) => n.kind === "field" && n.label !== "Имя")
            .forEach((n) => s.links.push(link(n, "out", t, "data-in", "data")));
        } else if (preset !== "empty") {
          const defs =
            preset === "table"
              ? [
                  ["Имя", "text", "Новый профиль"],
                  ["S", "number", "3"],
                  ["A", "number", "1"],
                  ["D", "number", "1"],
                  ["Стоимость", "calc", "0", "=[S]*[D]"],
                ]
              : [
                  ["Имя", "text", "Новый объект"],
                  ["S", "number", "3"],
                  ["A", "number", "1"],
                  ["D", "number", "1"],
                  ["Стоимость", "calc", "0", "=[S]*[D]+[A]"],
                  ["Экипировано", "flag", "true"],
                ];
          const fs = defs.map(([n, t, d, f]) =>
            add(
              mkNode("field", 30, 40 + s.fields.length * 80, 140, 64, n),
              field(n, t, d, f),
            ),
          );
          const c = mkNode("card", 240, 60, 440, 330, "Карточка", {
            layoutMode: "flow",
          });
          s.nodes.push(c);
          const name = add(
            mkNode("text", 16, 36, 400, 40, "Имя", {
              field: fs[0].label,
              size: 18,
            }),
            null,
          );
          c.id;
          name.parent = c.id;
          s.links.push(
            link(c, "contains-out", name, "contains-in", "contains"),
            link(fs[0], "out", name, "data-in", "data"),
          );
          if (preset === "table") {
            const t = mkNode("table", 16, 90, 400, 100, "Профили", {
              fields: fs.map((n) => n.label),
            });
            t.parent = c.id;
            s.nodes.push(t);
            fs.forEach((n) =>
              s.links.push(link(n, "out", t, "data-in", "data")),
            );
          } else
            fs.slice(1, 4).forEach((f, i) => {
              const n = mkNode("stat", 16 + i * 132, 90, 116, 80, f.label, {
                field: f.label,
              });
              n.parent = c.id;
              s.nodes.push(n);
              s.links.push(
                link(c, "contains-out", n, "contains-in", "contains"),
                link(f, "out", n, "data-in", "data"),
              );
            });
          if (preset === "slot") {
            const slot = mkNode("slot", 730, 60, 400, 240, "Объекты", {
              sourceSchema: s.id,
              autoHeight: true,
              cols: 1,
            });
            s.nodes.push(slot);
          }
        }
        normalizeSchema(s);
        return s;
      }
      function buildDemo() {
        const weapons = mkSchema("Оружие", "card");
        weapons.name = "Оружие";
        weapons.fields.find((f) => f.name === "Имя").default = "Лазган";
        weapons.fields.push(field("Перегрев", "flag", "false"));
        const over = mkNode("field", 30, 520, 140, 64, "Перегрев", {
          fieldId: weapons.fields.at(-1).id,
        });
        weapons.nodes.push(over);
        const mod = mkNode("modifier", 220, 530, 190, 80, "Перегрев: +1 S", {
            operation: "add",
            value: "1",
            layer: "add",
          }),
          cond = mkNode("condition", 220, 640, 190, 70, "Перегрев = да", {
            expr: "[Перегрев]",
            mode: "AND",
          });
        weapons.nodes.push(mod, cond);
        weapons.links.push(
          link(
            mod,
            "out",
            weapons.nodes.find((n) => n.label === "S" && n.kind === "field"),
            "in",
            "modifies",
          ),
          link(cond, "out", mod, "cond-in", "condition"),
        );
        const heavy = mkNode(
          "constraint",
          440,
          530,
          220,
          80,
          "Не более 2 тяжёлых",
          {
            rule: "max",
            value: 2,
            scope: "roster",
            filterTag: "Тяжёлое",
            message: "Не более двух тяжёлых оружий",
          },
        );
        weapons.nodes.push(heavy);
        const stats = mkSchema("Характеристики", "stats");
        stats.fields.forEach((f) => {
          if (f.name === "Имя") f.default = "Дознаватель";
        });
        const defs = [
          ["Лазган", 3, 1, 1, 0, false],
          ["Болтер", 4, 1, 2, -1, false],
          ["Плазма-ган", 7, 1, 3, -3, true],
          ["Цепной меч", 4, 2, 2, -1, false],
          ["Тяжёлый болтер", 5, 2, 2, -1, false],
          ["Мельтаган", 8, 1, 3, -4, false],
        ];
        const objects = defs.map(([name, S, A, D, AP, hot], i) => ({
          id: uid(),
          schema: weapons.id,
          schemaVersion: weapons.version,
          name,
          values: Object.fromEntries(
            weapons.fields.map((f) => [
              f.id,
              f.name === "Имя"
                ? name
                : f.name === "S"
                  ? S
                  : f.name === "A"
                    ? A
                    : f.name === "D"
                      ? D
                      : f.name === "Перегрев"
                        ? hot
                        : f.default,
            ]),
          ),
          tags: i > 3 ? ["Тяжёлое"] : ["Имперское"],
          folder: "Арсенал",
          notes: "",
          favorite: i === 0,
          deleted: false,
        }));
        const unit = {
          id: uid(),
          schema: stats.id,
          schemaVersion: 1,
          name: "Дознаватель",
          values: Object.fromEntries(
            stats.fields.map((f) => [f.id, f.default]),
          ),
          tags: [],
          folder: "",
          notes: "",
          deleted: false,
        };
        objects.push(unit);
        const layout = mkLayout("Подробный", weapons.id, stats.id);
        const roster = {
          id: uid(),
          name: "Дознаватель",
          layout: layout.id,
          character: {
            name: "Дознаватель",
            role: "Аколит Инквизиции",
            notes: "",
            portrait: "",
          },
          assign: {},
          limits: { points: 100 },
          folder: "",
        };
        roster.assign[
          layout.nodes.find(
            (n) => n.kind === "slot" && n.props.sourceSchema === stats.id,
          ).id
        ] = [{ id: uid(), objectId: unit.id, count: 1, alias: "", notes: "" }];
        roster.assign[
          layout.nodes.find(
            (n) => n.kind === "slot" && n.props.sourceSchema === weapons.id,
          ).id
        ] = [
          {
            id: uid(),
            objectId: objects[0].id,
            count: 1,
            alias: "",
            notes: "",
          },
        ];
        return {
          format: "rforge/2",
          schemas: [weapons, stats],
          objects,
          layouts: [layout],
          rosters: [roster],
          fragments: [],
          views: [],
          settings: { theme: "Кузня", locale: "ru", view: {} },
        };
      }
      function mkLayout(name, weaponId, statId, detail = 1) {
        const l = {
          id: uid(),
          name,
          canvas: { w: 900, h: 1400 },
          pageFormat: "A4",
          pages: [{ h: 1120 }],
          nodes: [],
          links: [],
        };
        const title = mkNode("text", 40, 24, 820, 50, "Заголовок", {
          static: "ЛИСТ ПЕРСОНАЖА",
          size: 22,
        });
        title.space = "layout";
        const sec = mkNode(
          "section",
          40,
          95,
          820,
          detail ? 240 : 160,
          "Характеристики",
          { layoutMode: "free", autoHeight: false },
        );
        sec.space = "layout";
        const slot = mkNode(
          "slot",
          16,
          40,
          788,
          detail ? 180 : 100,
          "Профиль",
          {
            sourceSchema: statId,
            autoHeight: true,
            cols: 1,
            view: detail ? "full" : "compact",
          },
        );
        slot.parent = sec.id;
        slot.space = "layout";
        const sec2 = mkNode(
          "section",
          40,
          detail ? 365 : 285,
          820,
          380,
          "Арсенал",
          { layoutMode: "free", autoHeight: false },
        );
        sec2.space = "layout";
        const sw = mkNode("slot", 16, 40, 788, 300, "Оружие", {
          sourceSchema: weaponId,
          autoHeight: true,
          cols: detail ? 2 : 1,
          view: detail ? "full" : "compact",
        });
        sw.parent = sec2.id;
        sw.space = "layout";
        l.nodes = [title, sec, slot, sec2, sw];
        l.links = [
          link(sec, "contains-out", slot, "contains-in", "contains"),
          link(sec2, "contains-out", sw, "contains-in", "contains"),
        ];
        return l;
      }
      /* Normalize legacy name-keyed data; IDs are the storage keys, names only formula labels. */
function normalizeSchema(s) {
 s.id ||= uid(); s.version ??= 1; s.changelog ||= []; s.layers ||= ['base','set','equipment','add','mul','bounds'];
 s.canvas ||= {w:1200,h:800}; s.fields ||= []; s.nodes ||= []; s.links ||= []; s.stacking ||= 'stack';
 const ids = new Set(), fids = new Set();
 s.fields.forEach((f,i) => { if (!f.id || fids.has(f.id)) f.id=uid(); fids.add(f.id); if(!VALUE_TYPES[f.type]) throw Error('Неизвестный тип поля '+f.name); f.order ??= i; });
 s.nodes.forEach(n => {
  if(!KINDS[n.kind]) throw Error('Неизвестный блок '+n.kind);
  if(!n.id || ids.has(n.id)) n.id=uid(); ids.add(n.id); n.props ||= {};
  n.frame ||= {x:0,y:0,w:160,h:80};
  for(const k of ['x','y','w','h']) if(!Number.isFinite(n.frame[k])) throw Error('Некорректные координаты '+n.label);
  n.frame.w=Math.max(KINDS[n.kind].min[0],n.frame.w); n.frame.h=Math.max(KINDS[n.kind].min[1],n.frame.h);
  n.ports=[...KINDS[n.kind].ports.in,...KINDS[n.kind].ports.out];
  if(n.kind==='field' && !n.props.fieldId) {const f=s.fields.find(f=>f.name===n.label);if(f)n.props.fieldId=f.id;}
  if(VISUAL.includes(n.kind) && !n.bind) {const f=s.fields.find(f=>f.name===n.props.field);if(f)n.bind=f.id;}
  n.layoutMode ||= CONTAINERS.includes(n.kind) ? (n.props.layoutMode || 'free') : undefined;
  if(n.props.anchors){const a={};ANCHOR_SIDES.forEach(k=>{if(n.props.anchors[k])a[k]=true;});if(Object.keys(a).length)n.props.anchors=a;else delete n.props.anchors;}
  if(n.props.anchorMargin){const m=n.props.anchorMargin;['l','r','t','b'].forEach(k=>m[k]=Math.max(0,+m[k]||0));}
 });
 const nodes=new Map(s.nodes.map(n=>[n.id,n]));
 s.links=s.links.filter(l=>l?.from && l?.to && LINKS[l.type] && nodes.has(l.from.node) && nodes.has(l.to.node));
 s.links.forEach(l=>{
  l.id ||= uid(); l.props={layer:'add',weight:1,repeatBy:'',condition:'',...l.props};
  const f=nodes.get(l.from.node),t=nodes.get(l.to.node);
  if(l.type==='contains') t.parent=f.id;
  if(l.type==='data' && f.kind==='field') {const fd=s.fields.find(x=>x.id===f.props.fieldId);if(fd){t.bind=fd.id;t.props.field=fd.name;}}
  if(l.type==='modifies') {const target=t.kind==='field'?t.props.fieldId:t.bind;if(target)f.props.targetField=target;}
  if(l.type==='refers' && t.kind==='slot') t.props.sourceSchema=f.props.schemaId || s.id;
 });
 s.nodes.forEach(n=>{if(n.parent && (!nodes.has(n.parent)||!CONTAINERS.includes(nodes.get(n.parent).kind)||isDescendant(n.parent,n.id,s)))n.parent=null;});
 // Structural ownership is one source of truth, not a stale duplicate link.
 s.links=s.links.filter(l=>l.type!=='contains' || nodes.get(l.to.node)?.parent===l.from.node);
 s.nodes.forEach(n=>{if(n.parent && !s.links.some(l=>l.type==='contains'&&l.to.node===n.id))s.links.push(link(nodes.get(n.parent),'contains-out',n,'contains-in','contains'));});
 s.fields.forEach(f=>s.nodes.filter(n=>n.kind==='field'&&n.props.fieldId===f.id).forEach(n=>{n.bind=f.id;n.label=f.name;}));
}
      function normalize(m) {
        if (
          !m ||
          m.format !== "rforge/2" ||
          !["schemas", "objects", "layouts", "rosters"].every((k) =>
            Array.isArray(m[k]),
          )
        )
          throw Error(
            "Ожидается проект rforge/2 с schemas, objects, layouts, rosters",
          );
        if (
          m.schemas.length > 200 ||
          m.objects.length > 100000 ||
          m.layouts.length > 500 ||
          m.rosters.length > 1000
        )
          throw Error("Превышен лимит импорта");
        m.settings ||= {};
        m.fragments ||= [];
        m.views ||= [];
        const schemaIds=new Set();
        m.schemas.forEach(s=>{const old=s.id;if(!s.id||schemaIds.has(s.id))s.id=uid();schemaIds.add(s.id);if(old&&old!==s.id)m.objects.forEach(o=>{if(o.schema===old)o.schema=s.id;});});
        m.schemas.forEach(normalizeSchema);
        const oids = new Set();
        m.objects.forEach((o) => {
          if (!o.id || oids.has(o.id)) o.id = uid();
          oids.add(o.id);
          if (!m.schemas.some((s) => s.id === o.schema))
            throw Error("Объект ссылается на отсутствующую схему");
          o.values ||= {};
          o.schemaVersion ??= 1;
          o.tags ||= [];
          o.name = String(o.name || "Без имени");
          const s = m.schemas.find((s) => s.id === o.schema);
          o.deleted ??= false; o.folder ||= ''; o.notes ||= '';
        });
        m.layouts.forEach((l) => {
          l.nodes ||= [];
          l.links ||= [];
          l.canvas ||= { w: 900, h: 1400 };
          normalizeSchema(l);
          l.nodes.forEach((n) => {
            n.space = "layout";
            if (
              n.props.sourceSchema &&
              !m.schemas.some((s) => s.id === n.props.sourceSchema)
            )
              n.props.sourceSchema = null;
          });
          l.links = l.links.filter(
            (x) =>
              l.nodes.some((n) => n.id === x.from.node) &&
              l.nodes.some((n) => n.id === x.to.node),
          );
        });
        const entityIds=new Set(m.schemas.flatMap(s=>[s.id,...s.nodes.map(n=>n.id),...s.fields.map(f=>f.id)]));
        [...m.layouts,...m.rosters].forEach(x=>{if(!x.id||entityIds.has(x.id))x.id=uid();entityIds.add(x.id);});
        m.rosters.forEach((r) => {
          r.assign ||= {};
          r.character ||= { name: r.name || "Персонаж", role: "", notes: "" };
          r.limits ||= { points: 100 };
          if (!m.layouts.some((l) => l.id === r.layout))
            r.layout = m.layouts[0]?.id || null;
          Object.keys(r.assign).forEach((k) => {
            if (!Array.isArray(r.assign[k])) {
              delete r.assign[k];
              return;
            }
            r.assign[k] = r.assign[k]
              .filter((a) =>
                m.objects.some((o) => o.id === (a.objectId || a.object)),
              )
              .map((a) => ({
                ...a,
                id: a.id || uid(),
                objectId: a.objectId || a.object,
                count: Math.max(1, Math.floor(+a.count || 1)),
              }));
          });
        });
        if (!m.schemas.length) throw Error("В проекте нет схем");
        if (!m.layouts.length)
          m.layouts.push(mkLayout("Лист", m.schemas[0].id, null));
        if (!m.rosters.length)
          m.rosters.push({
            id: uid(),
            name: "Персонаж",
            layout: m.layouts[0].id,
            character: { name: "Персонаж", role: "", notes: "" },
            limits: { points: 100 },
            assign: {},
          });
        return m;
      }
      const normalizeModel = normalize;
      const state = {
        model: normalize(buildDemo()),
        ui: {
          module: "schema",
          activeSchema: 0,
          activeLayout: 0,
          activeRoster: 0,
          selection: new Set(),
          selLink: null,
          view: { x: 30, y: 30, zoom: 1 },
          views: {},
          snap: true,
          snapEdges: true,
          snapCenters: true,
          snapEqual: false,
          guides: true,
          autoflow: true,
          snapRadius: 6,
          gridStep: 16,
          rpTab: "insp",
          baseView: "grid",
          previewObj: null,
          showRules: true,
          compact: false,
          linkFilter: "all",
          simple: false,
          locale: "ru",
          baseSearch: "",
          baseTag: "",
          baseFolder: "",
          baseFavorite: false,
          baseSort: "",
          gridFocus: { r: 0, c: 0 },
          gridAnchor: null,
          gridSel: new Set(),
          objectSel: new Set(),
          minimap: true,
          dirty: false,
        },
      };
      const schema = () => state.model.schemas[state.ui.activeSchema];
      const layout = () => state.model.layouts[state.ui.activeLayout];
      const roster = () => state.model.rosters[state.ui.activeRoster];
      const spaceRef = () =>
        state.ui.module === "schema"
          ? schema()
          : state.ui.module === "layout"
            ? layout()
            : null;
      const nodeById = (id) => spaceRef()?.nodes.find((n) => n.id === id);
      const fieldOf = (n) =>
        schema().fields.find((f) => f.id === (n.props.fieldId || n.bind));
      const fieldByName = (s, n) =>
        s.fields.find((f) => f.name === n && !f.removed);
      const objectsOfSchema = (s = schema()) =>
        state.model.objects.filter((o) => o.schema === s.id && !o.deleted);
      const previewObject = () =>
        state.ui.previewObj &&
        !state.ui.previewObj.deleted &&
        state.ui.previewObj.schema === schema().id
          ? state.ui.previewObj
          : objectsOfSchema()[0] || null;
      let sheetRosterContext = null;
      const activeAssign = (slotId) => {
        const r = sheetRosterContext || roster();
        return r?.assign[slotId] || [];
      };
      const rosterForLayout = (sp) => state.model.rosters.find(r=>r.layout===sp?.id) || roster();
      function worldFrame(n, sp = spaceRef()) {
        let x = n.frame.x,
          y = n.frame.y,
          p = n.parent,
          guard = 0;
        while (p && guard++ < 100) {
          const a = sp.nodes.find((v) => v.id === p);
          if (!a) break;
          x += a.frame.x;
          y += a.frame.y;
          p = a.parent;
        }
        return { x, y, w: n.frame.w, h: n.frame.h };
      }
      function visibleNode(n, sp = spaceRef(), obj = null) {
        if (n.hidden) return false;
        let p = n.parent,
          g = 0;
        while (p && g++ < 100) {
          const a = sp.nodes.find((v) => v.id === p);
          if (!a || a.hidden || (a.condition && !truth(a.condition, obj)))
            return false;
          p = a.parent;
        }
        return !n.condition || truth(n.condition, obj);
      }
      function truth(expr, obj) {
        if (!expr) return true;
        const r = Expr.run(expr, context(obj));
        return !r?.err && !!num(r);
      }
      function context(obj, slotId = null) {
        const s =
          state.model.schemas.find((s) => s.id === obj?.schema) || schema();
        return {
          get: (name) => {
            if (name.startsWith("@") || name.startsWith("#"))
              return aggregate(name, obj, slotId);
            const f = fieldByName(s, name);
            if (!f) throw Error("#НЕТ ПОЛЯ: " + name);
            return computeField(s, obj, f.name).value;
          },
          raw: (name) => rawValue(s, obj, name),
          obj,
          slotId,
        };
      }
      function aggregate(ref, obj, slotId) {
        const [target, fn] = ref.split(".");
        const f = fn || "Стоимость";
        let objs = [];
        if (target.startsWith("#")) {
          const name = target.slice(1);
          const slot = state.model.layouts
            .flatMap((l) => l.nodes)
            .find(
              (n) => n.id === name || (n.label === name && n.kind === "slot"),
            );
          const assigns = slot
            ? roster()?.assign[slot.id] || []
            : slotId
              ? activeAssign(slotId)
              : [];
          objs = assigns
            .flatMap((a) =>
              Array.from({ length: a.count }, () =>
                state.model.objects.find((o) => o.id === a.objectId),
              ),
            )
            .filter(Boolean);
        } else
          objs = state.model.objects.filter(
            (o) => o.name === target.slice(1) && !o.deleted,
          );
        return {
          values: objs.map((o) => {
            const s = state.model.schemas.find((s) => s.id === o.schema);
            return f === "__tags" ? o.tags : computeField(s, o, f).value;
          }),
          count: objs.length,
        };
      }
      /* Safe expression tokenizer + Pratt parser. Limits checked at parse AND evaluation. */
      const Expr = {
        tokenize(src) {
          src = String(src).trim().replace(/^=/, "");
          if (src.length > 2000) throw Error("#ОШИБКА: длина выражения > 2000");
          const ts = [];
          let i = 0;
          while (i < src.length) {
            const c = src[i];
            if (/\s/.test(c)) {
              i++;
              continue;
            }
            if (c === "[") {
              const j = src.indexOf("]", i);
              if (j < 0) throw Error("#ОШИБКА: незакрытая скобка");
              ts.push({ t: "ref", v: src.slice(i + 1, j) });
              i = j + 1;
              continue;
            }
            if (c === '"' || c === "'") {
              const q = c;
              let j = i + 1,
                v = "";
              while (j < src.length && src[j] !== q) {
                if (src[j] === "\\") j++;
                v += src[j++] || "";
              }
              if (j >= src.length) throw Error("#ОШИБКА: незакрытая строка");
              ts.push({ t: "str", v });
              i = j + 1;
              continue;
            }
            if ("[@#]".includes(c)) {
              let j = i + 1;
              while (j < src.length && /[\p{L}\p{N}_.\-+]/u.test(src[j])) j++;
              if (src[j] === ".")
                while (j < src.length && /[\p{L}\p{N}_.\-]/u.test(src[j])) j++;
              ts.push({ t: "ref", v: src.slice(i, j) });
              i = j;
              continue;
            }
            if (/\d/.test(c)) {
              const m = /^(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/.exec(
                src.slice(i),
              );
              ts.push({ t: "num", v: +m[0] });
              i += m[0].length;
              continue;
            }
            const op = ["<=", ">=", "==", "!=", "&&", "||"].find((x) =>
              src.startsWith(x, i),
            );
            if (op) {
              ts.push({ t: "op", v: op });
              i += op.length;
              continue;
            }
            if ("+-*/%^(),<>!".includes(c)) {
              ts.push({ t: "op", v: c });
              i++;
              continue;
            }
            if (/[\p{L}_]/u.test(c)) {
              let j = i + 1;
              while (j < src.length && /[\p{L}\p{N}_]/u.test(src[j])) j++;
              ts.push({ t: "id", v: src.slice(i, j) });
              i = j;
              continue;
            }
            throw Error("#ОШИБКА: символ " + c);
          }
          return ts;
        },
        parse(src) {
          if (typeof src === "string" && /^(\d*)D\d+/i.test(src.trim()))
            return { n: "num", v: dice(src).avg };
          const ts = this.tokenize(src);
          let p = 0,
            count = 0;
          const peek = () => ts[p],
            take = () => ts[p++];
          const prec = {
            "||": 1,
            OR: 1,
            "&&": 2,
            AND: 2,
            "==": 3,
            "!=": 3,
            "<": 3,
            ">": 3,
            "<=": 3,
            ">=": 3,
            "+": 4,
            "-": 4,
            "*": 5,
            "/": 5,
            "%": 5,
            "^": 6,
          };
          const atom = (depth) => {
            if (depth > 64 || ++count > 300) throw Error("#ОШИБКА: лимит AST");
            const t = take();
            if (!t) throw Error("#ОШИБКА: пустое выражение");
            if (t.t === "num" || t.t === "str") return { n: "lit", v: t.v };
            if (t.t === "ref") return { n: "ref", v: t.v };
            if (t.v === "(") {
              const e = expr(0, depth + 1);
              if (take()?.v !== ")") throw Error("#ОШИБКА: ожидается )");
              return e;
            }
            if (
              t.v === "-" ||
              t.v === "!" ||
              String(t.v).toUpperCase() === "NOT"
            )
              return {
                n: "un",
                op: t.v === "-" ? "-" : "!",
                a: atom(depth + 1),
              };
            if (t.t === "id") {
              const fn = t.v.toUpperCase();
              if (["AND", "OR", "NOT"].includes(fn)) return { n: "id", v: fn };
              if (fn === "TRUE" || fn === "FALSE")
                return { n: "lit", v: fn === "TRUE" ? 1 : 0 };
              if (
                ![
                  "SUM",
                  "MIN",
                  "MAX",
                  "AVG",
                  "ROUND",
                  "CEIL",
                  "FLOOR",
                  "ABS",
                  "IF",
                  "COUNT",
                  "CONCAT",
                  "SUM_SLOT",
                  "COUNT_SLOT",
                  "HAS_TAG",
                ].includes(fn)
              )
                throw Error("#ОШИБКА: функция " + fn);
              if (take()?.v !== "(") throw Error("#ОШИБКА: ожидается (");
              const args = [];
              if (peek()?.v !== ")") {
                do {
                  args.push(expr(0, depth + 1));
                } while (peek()?.v === "," && take());
              }
              if (take()?.v !== ")") throw Error("#ОШИБКА: ожидается )");
              return { n: "call", fn, args };
            }
            throw Error("#ОШИБКА: токен " + t.v);
          };
          const expr = (min, depth = 0) => {
            let a = atom(depth);
            while (peek()) {
              const v = peek().t === "id" ? peek().v.toUpperCase() : peek().v;
              if (!(v in prec) || prec[v] < min) break;
              take();
              a = { n: "bin", op: v, a, b: expr(prec[v] + 1, depth + 1) };
              if (++count > 300) throw Error("#ОШИБКА: лимит AST");
            }
            return a;
          };
          const root = expr(0);
          if (p < ts.length) throw Error("#ОШИБКА: лишний токен " + ts[p].v);
          return root;
        },
        run(src, ctx) {
          const start = performance.now();
          let steps = 0;
          const go = (a, d = 0) => {
            if (d > 64 || ++steps > 2000 || performance.now() - start > 50)
              throw Error("#ОШИБКА: лимит вычисления");
            switch (a.n) {
              case "lit":
                return a.v;
              case "id":
                return a.v;
              case "ref":
                return ctx.get(a.v);
              case "un":
                return a.op === "-"
                  ? -num(go(a.a, d + 1))
                  : num(go(a.a, d + 1))
                    ? 0
                    : 1;
              case "bin": {
                const op = a.op,
                  L = go(a.a, d + 1);
                if (op === "AND" || op === "&&")
                  return num(L) ? num(go(a.b, d + 1)) : 0;
                if (op === "OR" || op === "||")
                  return num(L) ? num(L) : num(go(a.b, d + 1));
                const R = go(a.b, d + 1);
                if (
                  op === "+" &&
                  (typeof L === "string" || typeof R === "string")
                )
                  return String(L) + String(R);
                const x = num(L),
                  y = num(R);
                switch (op) {
                  case "+":
                    return x + y;
                  case "-":
                    return x - y;
                  case "*":
                    return x * y;
                  case "/":
                    if (!y) throw Error("#ДЕЛ0");
                    return x / y;
                  case "%":
                    if (!y) throw Error("#ДЕЛ0");
                    return x % y;
                  case "^":
                    return x ** y;
                  case "<":
                    return +(x < y);
                  case ">":
                    return +(x > y);
                  case "<=":
                    return +(x <= y);
                  case ">=":
                    return +(x >= y);
                  case "==":
                    return +(L === R || x === y);
                  case "!=":
                    return +(L !== R && x !== y);
                }
                break;
              }
              case "call": {
                if (a.fn === "IF")
                  return num(go(a.args[0], d + 1))
                    ? go(a.args[1], d + 1)
                    : go(a.args[2] || a.args[0], d + 1);
                const vals = a.args.map((x) => go(x, d + 1)),
                  flat = vals.flatMap((v) => v?.values || [v]),
                  ns = flat.map(num);
                switch (a.fn) {
                  case "SUM":
                  case "SUM_SLOT":
                    return ns.reduce((a, b) => a + b, 0);
                  case "COUNT":
                  case "COUNT_SLOT":
                    return vals[0]?.count ?? flat.length;
                  case "MIN":
                    return Math.min(...ns);
                  case "MAX":
                    return Math.max(...ns);
                  case "AVG":
                    return ns.reduce((a, b) => a + b, 0) / (ns.length || 1);
                  case "ROUND":
                    return (
                      Math.round(ns[0] * 10 ** (ns[1] || 0)) /
                      10 ** (ns[1] || 0)
                    );
                  case "CEIL":
                    return Math.ceil(ns[0]);
                  case "FLOOR":
                    return Math.floor(ns[0]);
                  case "ABS":
                    return Math.abs(ns[0]);
                  case "CONCAT":
                    return flat.join("");
                  case "HAS_TAG":
                    return +(ctx.obj?.tags || []).includes(vals[0]);
                }
                break;
              }
            }
            throw Error("#ОШИБКА");
          };
          try {
            const v = go(this.parse(src));
            if (typeof v === "number" && !Number.isFinite(v))
              throw Error("#ОШИБКА: не finite");
            return v;
          } catch (e) {
            return { err: String(e.message || e).replace(/^Error: /, "") };
          }
        },
        refs(src) {
          const out = [];
          const walk = (a) => {
            if (!a || typeof a !== "object") return;
            if (a.n === "ref") out.push(a.v);
            Object.values(a).forEach(walk);
          };
          try {
            walk(this.parse(src));
          } catch {}
          return out;
        },
      };
      let computeStack = [],
        computeCache = new Map(),
        cacheEpoch = 0;
      function invalidate() {
        computeCache.clear();
        cacheEpoch++;
      }
      function rawValue(s, o, name) {
        const f = fieldByName(s, name);
        if (!f) return null;
        return o?.values[f.id] ?? o?.values[f.name] ?? f.default;
      }
function computeField(s,obj,name,withTrail=false) {
 if(!obj)return {value:null,trail:withTrail?[{op:'Нет объекта',from:'—',to:'—'}]:[]};
 const f=fieldByName(s,name); if(!f)return {value:{err:'#НЕТ ПОЛЯ: '+name},trail:[]};
 const key=obj.id+':'+f.id+':'+cacheEpoch;
 if(!withTrail && computeCache.has(key))return computeCache.get(key);
 if(computeStack.includes(key))return {value:{err:'#ЦИКЛ: '+[...computeStack.map(k=>k.split(':').slice(0,2).join(':')),obj.id+':'+f.id].join(' → ')},trail:[]};
 computeStack.push(key); const trail=[]; let base,val;
 try {
  const raw=rawValue(s,obj,f.name),override=typeof raw==='string'&&raw.startsWith('=');
  if(f.type==='calc'||override){const src=f.type==='calc'?(override?raw:f.formula):raw;base=Expr.run(src||'0',context(obj));trail.push({op:'Формула '+(src||'0'),from:'база',to:base});}
  else {base=raw; if(f.type==='number')base=num(base);if(f.type==='flag')base=base===true||base==='true'||base==='Да';if(f.type==='tags')base=Array.isArray(base)?base:String(base||'').split(',').map(x=>x.trim()).filter(Boolean);trail.push({op:'База · '+f.name,from:'—',to:base});}
  val=base;
  if(!val?.err && ['number','flag','tags','text'].includes(f.type)) {
   const targets=new Set(s.nodes.filter(n=>(n.kind==='field'&&n.props.fieldId===f.id)||n.bind===f.id).map(n=>n.id));
   let mods=s.links.filter(l=>l.type==='modifies'&&targets.has(l.to.node)).map(l=>({m:s.nodes.find(n=>n.id===l.from.node),l})).filter(x=>x.m);
   mods=[...new Map(mods.map(x=>[x.m.id,x])).values()];
   if(s.stacking==='uniqueByName')mods=mods.filter((x,i)=>mods.findIndex(y=>y.m.label===x.m.label)===i);
   if(s.stacking==='highest')mods.sort((a,b)=>num(b.m.props.value)-num(a.m.props.value));
   mods.sort((a,b)=>s.layers.indexOf(a.l.props.layer||a.m.props.layer)-s.layers.indexOf(b.l.props.layer||b.m.props.layer));
   if(s.stacking==='highest')mods=mods.slice(0,1);
   for(const {m,l} of mods){
    let enabled=(!m.props.condition||truth(m.props.condition,obj))&&(!l.props.condition||truth(l.props.condition,obj));
    if(enabled)enabled=s.links.filter(x=>x.type==='condition'&&x.to.node===m.id).every(x=>{const c=s.nodes.find(n=>n.id===x.from.node);return !c||conditionValue(c,obj,s,new Set());});
    if(!enabled){trail.push({op:m.label,source:m.id,from:val,to:'условие ложно'});continue;}
    let repeat=l.props.repeatBy||m.props.repeatBy||1;
    if(typeof repeat==='string'&&/^[=#@]/.test(repeat))repeat=num(Expr.run(repeat,context(obj)));
    const times=clamp(Math.floor(Number(repeat)||1),0,1000),weight=num(l.props.weight??1);
    let mv=m.props.value?.startsWith?.('=')?Expr.run(m.props.value,context(obj)):m.props.value;
    if(mv?.err){val=mv;break;}
    if(m.props.operation==='div'&&!num(mv)){val={err:'#ДЕЛ0'};break;}
    for(let k=0;k<times;k++){
     const before=Array.isArray(val)?[...val]:val,op=m.props.operation;
     if(f.type==='tags'){if(op==='addTag'||op==='add')val=[...new Set([...val,String(mv)])];if(op==='removeTag'||op==='sub')val=val.filter(x=>x!==String(mv));if(op==='set')val=String(mv).split(',').map(x=>x.trim()).filter(Boolean);}
     else if(f.type==='flag'&&op==='set')val=!!num(mv);
     else if(f.type==='text'&&op==='set')val=String(mv);
     else if(typeof val==='number'){
      const amount=num(mv)*weight;
      switch(op){case 'set':val=num(mv);break;case 'add':val+=amount;break;case 'sub':val-=amount;break;case 'mul':val*=amount;break;case 'div':val/=amount;break;case 'min':val=Math.max(val,num(mv));break;case 'max':val=Math.min(val,num(mv));break;}
     }
     trail.push({op:m.label+' · '+op+(times>1?' ×'+times:'')+' · слой '+(l.props.layer||m.props.layer),source:m.id,from:before,to:Array.isArray(val)?[...val]:val});
    }
    if(val?.err||!Number.isFinite(val)&&typeof val==='number'){val=val?.err?val:{err:'#ОШИБКА: не finite'};break;}
   }
  }
  if(typeof val==='number'&&!val?.err){for(const [bound,label] of [['min','Нижняя граница'],['max','Верхняя граница']])if(f[bound]!=null&&f[bound]!==''){const b=val;val=bound==='min'?Math.max(val,+f.min):Math.min(val,+f.max);trail.push({op:label,from:b,to:val});}if(f.round!=null&&f.round!==''){const b=val;val=Math.round(val*10**+f.round)/10**+f.round;trail.push({op:'Округление',from:b,to:val});}}
 }catch(e){val={err:String(e.message||e).replace(/^Error: /,'')};}finally{computeStack.pop();}
 const result={value:val===undefined?base:val,trail};computeCache.set(key,result);return withTrail?result:{value:result.value,trail:[]};
}
function conditionValue(n,obj,s=schema(),seen=new Set()) {
 if(!n||seen.has(n.id))return false; seen.add(n.id);
 const saved=state.model.schemas.find(x=>x.nodes.includes(n))||s;
 if(n.props.expr){const r=Expr.run(n.props.expr,context(obj));if(r?.err||!num(r))return false;}
 const children=s.links.filter(l=>l.type==='condition'&&l.to.node===n.id).map(l=>s.nodes.find(x=>x.id===l.from.node)).filter(Boolean);
 if(!children.length)return true;
 const vals=children.map(c=>conditionValue(c,obj,s,new Set(seen)));return n.props.mode==='OR'?vals.some(Boolean):vals.every(Boolean);
}
      function displayValue(s, o, n) {
        const v = computeField(s, o, n).value;
        return v?.err
          ? v.err
          : Array.isArray(v)
            ? v.join(", ")
            : typeof v === "boolean"
              ? v
                ? "Да"
                : "Нет"
              : (v ?? "—");
      }
      function objectCost(o, count = 1) {
        const s = state.model.schemas.find((s) => s.id === o.schema);
        const f = s.fields.find((f) => /стоимость|cost|points/i.test(f.name));
        const p = f ? num(computeField(s, o, f.name).value) : 0;
        const mode = o.costMode || "model";
        if (mode === "unit") return p;
        if (mode === "tiers") {
          const tiers = (o.costTiers || "1:10")
            .split(",")
            .map((x) => x.split(":").map(Number));
          return tiers.filter((t) => count >= t[0]).at(-1)?.[1] || 0;
        }
        return p * count;
      }
      /* Transactions: a completed gesture or a form commit creates exactly one history entry. */
      let history = [],
        histIdx = -1,
        errorLog = [],
        autosaveTimer,
        saveWarned = false;
      function snapshot(label) {
        const data = clone(state.model);
        data.settings.view = clone(state.ui.views);
        data.settings.theme =
          $("#ctrl-theme")?.value || state.model.settings.theme;
        data.settings.locale = state.ui.locale;
        if (histIdx >= 0 && stable(history[histIdx].data) === stable(data))
          return;
        history = history.slice(0, histIdx + 1);
        history.push({ label, data, t: new Date().toLocaleTimeString() });
        if (history.length > 100) history.shift();
        histIdx = history.length - 1;
        invalidate();
        state.ui.dirty = true;
        renderHistory();
        clearTimeout(autosaveTimer);
        autosaveTimer = setTimeout(() => saveLocal(), 500);
      }
      function restoreHistory(i) {
        if (i < 0 || i >= history.length) return;
        histIdx = i;
        state.model = clone(history[i].data);
        normalize(state.model);
        fixIndices();
        state.ui.selection.clear();
        state.ui.selLink = null;
        invalidate();
        refresh();
        saveLocal();
      }
      function undo() {
        if (histIdx > 0) {
          restoreHistory(histIdx - 1);
          toast("Отменено: " + history[histIdx + 1].label);
        }
      }
      function redo() {
        if (histIdx < history.length - 1) {
          restoreHistory(histIdx + 1);
          toast("Повторено: " + history[histIdx].label);
        }
      }
      function renderHistory() {
        const el = $("#hist-list");
        if (el)
          el.innerHTML = history
            .map(
              (h, i) =>
                `<div class="hist-item ${i === histIdx ? "active" : ""}" data-i="${i}"><span class="t">${esc(h.t)}</span>${esc(h.label)}${i > histIdx ? " · отменено" : ""}</div>`,
            )
            .reverse()
            .join("");
      }
      function saveLocal() {
        try {
          state.model.settings.view = clone(state.ui.views);
          localStorage.setItem(
            "rforge.autosave",
            JSON.stringify({
              model: state.model,
              saved: new Date().toISOString(),
            }),
          );
          state.ui.dirty = false;
          $("#save-state").textContent = "Сохранено локально";
        } catch (e) {
          $("#save-state").textContent = "Сохраните файл";
          if (!saveWarned) {
            toast(
              "Автосохранение недоступно. Экспортируйте проект в файл.",
              "err",
            );
            saveWarned = true;
          }
        }
      }
      function backup(label = "Резервная копия") {
        try {
          const key = "rforge.backups",
            arr = JSON.parse(localStorage.getItem(key) || "[]");
          arr.unshift({
            id: uid(),
            label,
            t: new Date().toISOString(),
            model: clone(state.model),
          });
          localStorage.setItem(key, JSON.stringify(arr.slice(0, 20)));
        } catch {}
      }
      function backupDialog() {
        let arr = [];
        try {
          arr = JSON.parse(localStorage.getItem("rforge.backups") || "[]");
        } catch {}
        openModal(
          "Резервные копии",
          `<p class="muted">Последние 20 копий. Автосохранение каждые 30 секунд; копия перед импортом и удалением.</p><button class="btn" id="backup-now">Создать копию сейчас</button>` +
            arr
              .map(
                (b, i) =>
                  `<div class="pick-row"><b>${esc(b.label)}</b><span class="muted">${esc(new Date(b.t).toLocaleString())}</span><button class="btn" data-restore="${i}">Восстановить</button></div>`,
              )
              .join(""),
          '<button class="btn" id="b-close">Закрыть</button>',
        );
        $("#backup-now").onclick = () => {
          backup();
          backupDialog();
        };
        $("#b-close").onclick = closeModal;
        $$("[data-restore]").forEach(
          (b) =>
            (b.onclick = () => {
              backup("Перед восстановлением");
              state.model = normalize(clone(arr[+b.dataset.restore].model));
              fixIndices();
              snapshot("Восстановление копии");
              refresh();
              closeModal();
            }),
        );
      }
      function fixIndices() {
        state.ui.activeSchema = clamp(
          state.ui.activeSchema,
          0,
          state.model.schemas.length - 1,
        );
        state.ui.activeLayout = clamp(
          state.ui.activeLayout,
          0,
          state.model.layouts.length - 1,
        );
        state.ui.activeRoster = clamp(
          state.ui.activeRoster,
          0,
          state.model.rosters.length - 1,
        );
        state.ui.previewObj = null;
      }
      function refresh() {
        invalidate();
        buildToolbar();
        renderPalette();
        renderCanvas();
        renderBase();
        renderChar();
        renderInspector();
        renderCrumbs();
        validate();
        updateStatusSel();
        syncControls();
      }
      function toast(msg, type = "info", undoFn) {
        const t = document.createElement("div");
        t.className = "toast " + type;
        t.setAttribute("role", "status");
        t.innerHTML =
          `<span>${esc(msg)}</span>` +
          (undoFn ? '<button class="undo">Отменить</button>' : "");
        if (undoFn)
          t.querySelector("button").onclick = () => {
            undoFn();
            t.remove();
          };
        $("#toasts").appendChild(t);
        while ($("#toasts").children.length > 4)
          $("#toasts").firstChild.remove();
        setTimeout(() => t.remove(), 6000);
      }
      let modalReturnFocus = null,
        modalCleanup = null;
      function openModal(title, body, foot) {
        if ($("#modal-backdrop").classList.contains("open")) closeModal();
        modalReturnFocus = document.activeElement;
        $("#modal").setAttribute("role", "dialog");
        $("#modal").setAttribute("aria-modal", "true");
        $("#modal").setAttribute("aria-labelledby", "modal-title");
        $("#modal").innerHTML =
          `<h3 id="modal-title">${esc(title)}</h3><div class="m-body">${body}</div><div class="m-foot">${foot || '<button class="btn" onclick="closeModal()">Закрыть</button>'}</div>`;
        $("#modal-backdrop").classList.add("open");
        setTimeout(
          () =>
            $(
              "#modal input:not([type=checkbox]),#modal select,#modal button",
            )?.focus(),
          30,
        );
      }
      function closeModal() {
        modalCleanup?.();
        modalCleanup = null;
        $("#modal-backdrop").classList.remove("open");
        modalReturnFocus?.focus?.();
      }
      function confirmDialog(title, text, fn) {
        backup(title);
        openModal(
          title,
          `<p>${esc(text)}</p><p class="muted">Перед операцией создана резервная копия. Действие можно отменить через Ctrl+Z.</p>`,
          `<button class="btn" onclick="closeModal()">Отмена</button><button class="btn danger" id="confirm-yes">Удалить</button>`,
        );
        $("#confirm-yes").onclick = () => {
          closeModal();
          fn();
        };
      }
      function showCtx(x, y, items) {
        const c = $("#ctx");
        c.innerHTML = items
          .map((it, i) =>
            it === "-"
              ? "<hr>"
              : `<button class="ci" data-i="${i}">${esc(it.label)}<span class="hk">${esc(it.hk || "")}</span></button>`,
          )
          .join("");
        c.style.display = "block";
        c.style.left = clamp(x, 4, innerWidth - c.offsetWidth - 4) + "px";
        c.style.top = clamp(y, 4, innerHeight - c.offsetHeight - 4) + "px";
        c.onclick = (e) => {
          const b = e.target.closest("[data-i]");
          if (b) {
            c.style.display = "none";
            items[+b.dataset.i].fn?.();
          }
        };
      }
      function showAudit(x, y, title, trail) {
        const a = $("#audit");
        a.innerHTML =
          `<h5>${esc(title)} — аудит</h5>` +
          trail
            .map(
              (s) =>
                `<div class="step"><span class="op">${esc(s.op)}</span><span>${esc(Array.isArray(s.from) ? s.from.join(", ") : s.from)} →</span><span class="res">${esc(Array.isArray(s.to) ? s.to.join(", ") : s.to)}</span></div>`,
            )
            .join("");
        a.style.display = "block";
        a.style.left = clamp(x, 8, innerWidth - a.offsetWidth - 8) + "px";
        a.style.top = clamp(y, 8, innerHeight - a.offsetHeight - 8) + "px";
      }
      function auditField(s, o, name, e) {
        e?.stopPropagation();
        const r = computeField(s, o, name, true);
        showAudit(
          e?.clientX || innerWidth / 2,
          e?.clientY || innerHeight / 2,
          name,
          r.trail,
        );
      }
      window.addEventListener("error", (e) => {
        errorLog.push({
          t: new Date().toISOString(),
          message: e.message,
          stack: e.error?.stack,
        });
        toast("Ошибка: " + e.message, "err");
      });
      window.addEventListener("unhandledrejection", (e) => {
        errorLog.push({
          t: new Date().toISOString(),
          message: String(e.reason),
        });
        toast("Ошибка операции: " + e.reason, "err");
      });
      /* Canvas: world coordinates, local child frames, pointer capture, transactional gestures. */
      const viewport = $("#viewport"),
        world = $("#world"),
        nodesLayer = $("#nodes-layer"),
        linkSvg = $("#link-svg"),
        overlay = $("#overlay");
      let gesture = null,
        spaceDown = false,
        clipboard = null,
        lastPointer = { x: 0, y: 0 },
        dragGhost = null,
        paletteDrag = null;
      function screenToWorld(x, y) {
        const r = viewport.getBoundingClientRect(),
          v = state.ui.view;
        return {
          x: (x - r.left - v.x) / v.zoom,
          y: (y - r.top - v.y) / v.zoom,
        };
      }
      function viewFor() {
        return state.ui.views[state.ui.module] || state.ui.view;
      }
      function applyView() {
        const v = state.ui.view;
        world.style.transform = `translate(${v.x}px,${v.y}px) scale(${v.zoom})`;
        const g = state.ui.gridStep * v.zoom;
        viewport.style.backgroundImage =
          "linear-gradient(var(--border) 1px,transparent 1px),linear-gradient(90deg,var(--border) 1px,transparent 1px),linear-gradient(var(--border) 1px,transparent 1px),linear-gradient(90deg,var(--border) 1px,transparent 1px)";
        viewport.style.backgroundSize = `${g * 4}px ${g * 4}px,${g * 4}px ${g * 4}px,${g}px ${g}px,${g}px ${g}px`;
        viewport.style.backgroundPosition = `${v.x}px ${v.y}px`;
        $("#zoom-ind").textContent = Math.round(v.zoom * 100) + "%";
        const z = $("#ctrl-zoom");
        if (z && +z.value !== Math.round(v.zoom * 100)) {
          z.value = Math.round(v.zoom * 100);
          z.closest(".ctrl").querySelector(".val").textContent = z.value;
          if($('#ctrl-zoom-step'))$('#ctrl-zoom-step').value=z.value;
        }
        drawRulers();
        drawMinimap();
      }
      function zoomAt(cx, cy, z) {
        const r = viewport.getBoundingClientRect(),
          v = state.ui.view,
          p = screenToWorld(cx, cy);
        v.zoom = clamp(z, 0.1, 8);
        v.x = cx - r.left - p.x * v.zoom;
        v.y = cy - r.top - p.y * v.zoom;
        applyView();
      }
      function zoomCenter(z) {
        const r = viewport.getBoundingClientRect();
        zoomAt(r.left + r.width / 2, r.top + r.height / 2, z);
      }
      function fitAll(selected = false) {
        const sp = spaceRef();
        if (!sp) return;
        const ns = sp.nodes.filter(
          (n) => (!selected || state.ui.selection.has(n.id)) && !n.hidden,
        );
        if (!ns.length) {
          state.ui.view = { x: 30, y: 30, zoom: 1 };
          applyView();
          return;
        }
        const fs = ns.map((n) => worldFrame(n)),
          x = Math.min(...fs.map((f) => f.x)),
          y = Math.min(...fs.map((f) => f.y)),
          X = Math.max(...fs.map((f) => f.x + f.w)),
          Y = Math.max(...fs.map((f) => f.y + f.h)),
          z = clamp(
            Math.min(
              (viewport.clientWidth - 70) / (X - x),
              (viewport.clientHeight - 90) / (Y - y),
            ),
            0.1,
            8,
          );
        state.ui.view = {
          zoom: z,
          x: (viewport.clientWidth - (X - x) * z) / 2 - x * z,
          y: (viewport.clientHeight - (Y - y) * z) / 2 - y * z,
        };
        applyView();
      }
      function focusNode(id, mod = "schema") {
        setModule(mod);
        const n = nodeById(id);
        if (!n) return;
        state.ui.selection = new Set([id]);
        const f = worldFrame(n),
          v = state.ui.view;
        v.x = viewport.clientWidth / 2 - (f.x + f.w / 2) * v.zoom;
        v.y = viewport.clientHeight / 2 - (f.y + f.h / 2) * v.zoom;
        renderCanvas();
        renderInspector();
      }
      viewport.addEventListener(
        "wheel",
        (e) => {
          e.preventDefault();
          if (e.ctrlKey || e.metaKey)
            zoomAt(
              e.clientX,
              e.clientY,
              state.ui.view.zoom * Math.exp(-e.deltaY * 0.003),
            );
          else {
            state.ui.view.x -= e.shiftKey ? e.deltaY : e.deltaX;
            state.ui.view.y -= e.shiftKey ? 0 : e.deltaY;
            applyView();
          }
        },
        { passive: false },
      );
      $("#z-in").onclick = () => zoomCenter(state.ui.view.zoom * 1.2);
      $("#z-out").onclick = () => zoomCenter(state.ui.view.zoom / 1.2);
      $("#z-fit").onclick = () => fitAll();
      $("#z-100").onclick = () => zoomCenter(1);
      const fitSel = document.createElement("button");
      fitSel.className = "tb-btn";
      fitSel.textContent = "⛶□";
      fitSel.title = "Вписать выделенное · Ctrl+2";
      fitSel.onclick = () => fitAll(true);
      $("#zoom-toolbar").appendChild(fitSel);
      function drawRulers() {
        const rx = $("#ruler-x"),
          ry = $("#ruler-y"),
          v = state.ui.view;
        rx.width = Math.max(1, viewport.clientWidth - 20);
        ry.height = Math.max(1, viewport.clientHeight - 20);
        const cx = rx.getContext("2d"),
          cy = ry.getContext("2d");
        cx.fillStyle = cy.fillStyle = getComputedStyle(
          document.body,
        ).getPropertyValue("--muted");
        cx.font = cy.font = "10px monospace";
        let step = state.ui.gridStep * 4;
        while (step * v.zoom < 45) step *= 2;
        for (
          let x = Math.floor(-v.x / v.zoom / step) * step;
          x * v.zoom + v.x < rx.width;
          x += step
        ) {
          const p = x * v.zoom + v.x;
          cx.fillRect(p, 14, 1, 6);
          cx.fillText(String(Math.round(x)), p + 2, 11);
        }
        for (
          let y = Math.floor(-v.y / v.zoom / step) * step;
          y * v.zoom + v.y < ry.height;
          y += step
        ) {
          const p = y * v.zoom + v.y;
          cy.fillRect(14, p, 6, 1);
          cy.save();
          cy.translate(10, p + 3);
          cy.rotate(-Math.PI / 2);
          cy.fillText(String(Math.round(y)), 0, 0);
          cy.restore();
        }
        const p = screenToWorld(lastPointer.x, lastPointer.y);
        cx.fillStyle = "#F5A524";
        cx.fillRect(p.x * v.zoom + v.x, 0, 1, 20);
        cy.fillRect(0, p.y * v.zoom + v.y, 20, 1);
      }
      let miniTransform = { scale: 1, x: 0, y: 0 };
      function drawMinimap() {
        const mm = $("#minimap");
        mm.classList.toggle("hidden", !state.ui.minimap);
        if (!state.ui.minimap) return;
        const c = mm.getContext("2d"),
          sp = spaceRef();
        c.clearRect(0, 0, 160, 110);
        if (!sp) return;
        const maxX = Math.max(
            sp.canvas.w,
            ...sp.nodes.map((n) => worldFrame(n).x + n.frame.w),
          ),
          maxY = Math.max(
            sp.canvas.h,
            ...sp.nodes.map((n) => worldFrame(n).y + n.frame.h),
          ),
          sc = Math.min(156 / maxX, 106 / maxY);
        miniTransform = { scale: sc, x: 2, y: 2 };
        sp.nodes
          .filter((n) => !n.hidden)
          .forEach((n) => {
            const f = worldFrame(n);
            c.fillStyle = KINDS[n.kind].color;
            c.fillRect(
              f.x * sc + 2,
              f.y * sc + 2,
              Math.max(2, f.w * sc),
              Math.max(2, f.h * sc),
            );
          });
        const v = state.ui.view;
        c.strokeStyle = "#22D3EE";
        c.strokeRect(
          (-v.x / v.zoom) * sc + 2,
          (-v.y / v.zoom) * sc + 2,
          (viewport.clientWidth / v.zoom) * sc,
          (viewport.clientHeight / v.zoom) * sc,
        );
      }
      $("#minimap").style.pointerEvents = "auto";
      $("#minimap").onpointerdown = (e) => {
        const move = (ev) => {
          const r = e.target.getBoundingClientRect(),
            p = screenToWorld(0, 0);
          const x =
              (ev.clientX - r.left - miniTransform.x) / miniTransform.scale,
            y = (ev.clientY - r.top - miniTransform.y) / miniTransform.scale;
          state.ui.view.x = viewport.clientWidth / 2 - x * state.ui.view.zoom;
          state.ui.view.y = viewport.clientHeight / 2 - y * state.ui.view.zoom;
          applyView();
        };
        capturePointer(e.target, e.pointerId);
        move(e);
        e.target.onpointermove = move;
        e.target.onpointerup = e.target.onpointercancel = () => {
          e.target.onpointermove =
            e.target.onpointerup =
            e.target.onpointercancel =
              null;
        };
      };
      function portPos(n, p, sp = spaceRef()) {
        const f = worldFrame(n, sp),
          d = KINDS[n.kind].ports;
        if (p === "flow-out") return { x: f.x + f.w / 2, y: f.y + f.h };
        if (p === "flow-in") return { x: f.x + f.w / 2, y: f.y };
        if (p === "contains-out") return { x: f.x + f.w, y: f.y + 20 };
        if (p === "contains-in") return { x: f.x + 10, y: f.y };
        const ins = d.in.includes(p),
          arr = ins ? d.in : d.out,
          i = arr.indexOf(p);
        return {
          x: ins ? f.x : f.x + f.w,
          y: f.y + (f.h * (i + 1)) / (arr.length + 1),
        };
      }
      function linkPath(l, sp = spaceRef()) {
        const a = sp.nodes.find((n) => n.id === l.from.node),
          b = sp.nodes.find((n) => n.id === l.to.node);
        if (!a || !b) return "";
        const p = portPos(a, l.from.port, sp),
          q = portPos(b, l.to.port, sp),
          curve =
            parseFloat(
              getComputedStyle(document.documentElement).getPropertyValue(
                "--curve",
              ),
            ) || 0;
        const siblings = sp.links.filter(
            (x) =>
              (x.from.node === l.from.node && x.to.node === l.to.node) ||
              (x.from.node === l.to.node && x.to.node === l.from.node),
          ),
          fan = (siblings.indexOf(l) - (siblings.length - 1) / 2) * 10,
          dy = Math.max(25, (Math.abs(q.x - p.x) * curve) / 150);
        if (curve < 5) {
          const mid = (p.x + q.x) / 2 + fan;
          return `M${p.x},${p.y} L${mid},${p.y + fan} L${mid},${q.y + fan} L${q.x},${q.y}`;
        }
        return `M${p.x},${p.y} C${p.x + dy},${p.y + fan} ${q.x - dy},${q.y + fan} ${q.x},${q.y}`;
      }
      function nodeSchema(n) {
        return state.ui.module === "layout"
          ? state.model.schemas.find((s) => s.id === n.props.sourceSchema) ||
              schema()
          : schema();
      }
      function originalNodeContent(
        n,
        sp = spaceRef(),
        obj = null,
        result = false,
      ) {
        const s = nodeSchema(n),
          o =
            obj ||
            (state.ui.module === "layout"
              ? objectsOfSchema(s)[0]
              : previewObject()),
          fn =
            n.props.field ||
            fieldOf(n)?.name ||
            s.fields.find((f) => f.id === n.bind)?.name;
        const v = fn && o ? displayValue(s, o, fn) : "—";
        switch (n.kind) {
          case "field": {
            const f = fieldOf(n);
            return `<span class="stat-lbl">${esc(VALUE_TYPES[f?.type] || "")}</span><b>${esc(f?.name || n.label)}</b><small>${esc(f?.formula || f?.default || "")}</small>`;
          }
          case "modifier":
            return `<b>${esc(n.label)}</b><small>${esc(n.props.operation)} ${esc(n.props.value)} · ${esc(n.props.layer)}</small>`;
          case "condition":
            return `<b>${esc(n.props.mode || "AND")}</b><small>${esc(n.props.expr || "вложенные условия")}</small>`;
          case "constraint":
            return `<b>${esc(n.label)}</b><small>${esc(n.props.rule)} ${esc(n.props.value)} · ${esc(n.props.scope)}</small>`;
          case "stat":
            return `<div class="stat-lbl">${esc(fn || n.label)}</div><div class="stat-val" data-audit="${esc(fn || "")}" data-schema="${s.id}" data-object="${o?.id || ""}">${esc(v)}</div>`;
          case "number":
            return `<div class="stat-lbl">${esc(n.label)}</div><div class="mono value" data-audit="${esc(fn || "")}" data-schema="${s.id}" data-object="${o?.id || ""}">${esc(v)} ${esc(n.props.unit || "")}</div>`;
          case "text":
            return `<div style="font-size:${clamp(n.props.size || 14, 11, 24)}px;white-space:pre-wrap">${esc(fn && o ? v : n.props.static || n.label)}</div>`;
          case "bar":
            return `<div class="stat-lbl">${esc(fn || n.label)} · ${esc(v)}</div><div class="bar-track"><div class="bar-fill" style="width:${clamp((num(v) / (+n.props.max || 10)) * 100, 0, 100)}%;background:${safeColor(n.props.color)}"></div></div>`;
          case "tags":
            return `<div class="chips">${
              String(v)
                .split(",")
                .filter((x) => x && x !== "—")
                .map((t) => `<span class="chip">${esc(t.trim())}</span>`)
                .join("") || "—"
            }</div>`;
          case "table": {
            const fs = n.props.fields?.length
              ? n.props.fields
              : s.fields.filter((f) => f.type === "number").map((f) => f.name);
            const rows =
              n.props.rowsFrom === "roster"
                ? activeAssign(n.id)
                    .map((a) =>
                      state.model.objects.find((o) => o.id === a.objectId),
                    )
                    .filter(Boolean)
                : o
                  ? [o]
                  : [];
            return `<div class="table-wrap"><table class="mini-table"><thead><tr>${fs.map((f) => `<th>${esc(f)}</th>`).join("")}</tr></thead><tbody>${rows.map((o) => `<tr>${fs.map((f) => `<td data-audit="${esc(f)}" data-schema="${s.id}" data-object="${o.id}">${esc(displayValue(s, o, f))}</td>`).join("")}</tr>`).join("") || `<tr>${fs.map(() => "<td>—</td>").join("")}</tr>`}</tbody></table></div>`;
          }
          case "ability":
            return `<details ${state.ui.showRules ? "open" : ""}><summary>${esc(fn && o ? v : n.label)}</summary><p>${esc(n.props.desc || "Описание способности не задано. Добавьте его в инспекторе.")}</p></details>`;
          case "divider":
            return "<hr>";
          case "image": {
            const src = safeImage(n.props.src);
            return src
              ? `<img src="${esc(src)}" alt="${esc(n.label)}" style="width:100%;height:100%;object-fit:${n.props.fit === "fill" ? "fill" : n.props.fit === "cover" ? "cover" : "contain"}">`
              : '<div class="image-empty">▧<small>Выберите изображение</small></div>';
          }
          case "slot": {
            const sc = state.model.schemas.find(
              (s) => s.id === n.props.sourceSchema,
            );
            return `<small>Схема: ${esc(sc?.name || "не выбрана")}</small>${result ? "" : '<small class="muted">Перетащите объект сюда или нажмите «＋» в модуле Персонаж.</small>'}`;
          }
          default:
            return `<small>${esc(n.label)}</small>`;
        }
      }
      function safeColor(c) {
        return /^#[\da-f]{3,8}$/i.test(c || "") ? c : "var(--cyan)";
      }
      function safeImage(s) {
        return /^data:image\/(png|jpeg|webp|gif);base64,[a-z\d+/=]+$/i.test(
          s || "",
        )
          ? s
          : "";
      }
function buildNodeEl(n,sp=spaceRef(),obj=null,result=false){
 const el=document.createElement('div'),f=worldFrame(n,sp);
 el.className=`node k-${n.kind}${state.ui.selection.has(n.id)?' selected':''}${n.locked?' locked':''}`;el.dataset.id=n.id;
 el.style.cssText=`left:${f.x}px;top:${f.y}px;width:${n.frame.w}px;height:${n.frame.h}px;z-index:${depth(n,sp)*1000+(n.z||1)};padding:0;--node-pad:${n.props.padding??8}px;${n.props.fontSize?'font-size:'+clamp(n.props.fontSize,11,24)+'px;':''}${n.props.align?'text-align:'+(['left','center','right'].includes(n.props.align)?n.props.align:'left')+';':''}`;
 el.classList.toggle('overflow',n.props.overflow==='clip');if(n.props.overflow==='scroll')el.style.overflow='auto';
 const head=!['divider','image'].includes(n.kind);
 el.innerHTML=`${head?`<div class="n-head"><span class="kind-dot" style="background:${KINDS[n.kind].color}"></span><span class="n-label" title="${esc(n.label)}">${esc(n.label)}</span>${n.kind==='slot'?`<button class="mini-action slot-add" data-id="${n.id}" title="Наполнить слот">＋</button>`:''}</div>`:''}<div class="n-body">${nodePreviewContent(n,sp,obj,result)}</div>`;
 if(!result){
  const ports=[...KINDS[n.kind].ports.in,...KINDS[n.kind].ports.out,'flow-in','flow-out'];if(CONTAINERS.includes(n.kind))ports.push('contains-in');
  ports.forEach(p=>{const pos=portPos(n,p,sp),d=document.createElement('button');d.className='port';d.dataset.node=n.id;d.dataset.port=p;d.style.left=pos.x-f.x+'px';d.style.top=pos.y-f.y+'px';d.style.background=portColor(n,p);d.title=KINDS[n.kind].label+' · '+p+(n.props.field?' · '+n.props.field:'');d.setAttribute('aria-label',d.title);el.appendChild(d);});
  ['nw','n','ne','e','se','s','sw','w'].forEach(h=>{const d=document.createElement('div');d.className='handle '+h;d.dataset.h=h;el.appendChild(d);});
  el.querySelector('.slot-add')?.addEventListener('click',e=>{e.stopPropagation();openPicker(n.id);});
 }
 el.querySelectorAll('[data-audit]').forEach(v=>v.addEventListener('click',e=>{const s=state.model.schemas.find(s=>s.id===v.dataset.schema),o=state.model.objects.find(o=>o.id===v.dataset.object);if(s&&o&&v.dataset.audit)auditField(s,o,v.dataset.audit,e);}));
 return el;
}
      function portColor(n, p) {
        if (p.startsWith("flow")) return "#65A30D";
        if (p.startsWith("contains")) return "#F5A524";
        return (
          {
            field: "#22D3EE",
            modifier: "#FF4D6D",
            condition: "#E879F9",
            constraint: "#FB923C",
            slot: "#A78BFA",
          }[n.kind] || "#22D3EE"
        );
      }
      function renderCanvas() {
        if (!["schema", "layout"].includes(state.ui.module)) return;
        const sp = spaceRef();
        nodesLayer.innerHTML = "";
        linkSvg.innerHTML = "";
        overlay.innerHTML = "";
        if (!sp) return;
        autoLayout(sp);
        world.style.width = sp.canvas.w + "px";
        world.style.height = sp.canvas.h + "px";
        linkSvg.setAttribute("width", sp.canvas.w + 4000);
        linkSvg.setAttribute("height", sp.canvas.h + 4000);
        linkSvg.innerHTML =
          "<defs>" +
          Object.entries(LINKS)
            .map(
              ([k, v]) =>
                `<marker id="arrow-${k}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="${v.color}" stroke="none"/></marker>`,
            )
            .join("") +
          "</defs>";
        sp.links.forEach((l) => {
          if (
            !sp.nodes.some((n) => n.id === l.from.node) ||
            !sp.nodes.some((n) => n.id === l.to.node)
          )
            return;
          if (
            state.ui.linkFilter === "selected" &&
            !state.ui.selection.has(l.from.node) &&
            !state.ui.selection.has(l.to.node)
          )
            return;
          if (state.ui.linkFilter === "data" && l.type !== "data") return;
          if (
            state.ui.linkFilter === "modifiers" &&
            !["modifies", "condition"].includes(l.type)
          )
            return;
          const p = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "path",
          );
          p.setAttribute("d", linkPath(l));
          p.setAttribute("stroke", LINKS[l.type].color);
          p.setAttribute("marker-end", `url(#arrow-${l.type})`);
          p.dataset.id = l.id;
          p.classList.toggle("sel", state.ui.selLink === l.id);
          const a = sp.nodes.find((n) => n.id === l.from.node),
            b = sp.nodes.find((n) => n.id === l.to.node);
          p.addEventListener("pointerdown", (e) => {
            e.stopPropagation();
            state.ui.selection.clear();
            state.ui.selLink = l.id;
            renderCanvas();
            renderInspector();
          });
          p.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            state.ui.selLink = l.id;
            showCtx(e.clientX, e.clientY, [
              {
                label: "Настройки связи",
                fn: () => {
                  state.ui.rpTab = "insp";
                  renderInspector();
                },
              },
              { label: "Удалить связь", hk: "Delete", fn: deleteSelected },
            ]);
          });
          linkSvg.appendChild(p);
        });
        const paint = (n, obj = null) => {
          if (!visibleNode(n, sp, obj)) return;
          const el = buildNodeEl(n, sp, obj);
          nodesLayer.appendChild(el);
          sp.nodes
            .filter((c) => c.parent === n.id)
            .sort((a, b) => (a.z || 0) - (b.z || 0))
            .forEach((c) => paint(c, obj));
        };
        sp.nodes
          .filter((n) => !n.parent)
          .sort((a, b) => (a.z || 0) - (b.z || 0))
          .forEach((n) => paint(n));
        applyView();
        updateStatusSel();
      }
      function autoLayout(sp) {
        for (let pass = 0; pass < 20; pass++) {
          let changed = false;
          const order = [...sp.nodes].sort(
            (a, b) => depth(b, sp) - depth(a, sp),
          );
          for (const n of order) {
            if (!CONTAINERS.includes(n.kind)) continue;
            const kids = sp.nodes.filter((c) => c.parent === n.id && !c.hidden);
            if (n.kind === "slot" && n.props.autoHeight) {
              const sc = state.model.schemas.find(
                  (s) => s.id === n.props.sourceSchema,
                ),
                count = activeAssign(n.id).reduce((a, b) => a + b.count, 0),
                cols = clamp(+n.props.cols || 1, 1, 8),
                cardH =
                  n.props.view === "compact"
                    ? 54
                    : sc?.nodes.length
                      ? 150
                      : 110;
              const h = Math.max(
                KINDS.slot.min[1],
                48 + Math.ceil(count / cols) * (cardH + (n.props.gap || 8)),
              );
              if (n.frame.h !== h) {
                n.frame.h = h;
                changed = true;
              }
            }
            if (["flow", "grid"].includes(n.layoutMode || n.props.layoutMode)) {
              const gap = +n.props.gap || 8,
                pad = +n.props.padding || 8,
                cols =
                  n.layoutMode === "grid" || n.props.layoutMode === "grid"
                    ? clamp(+n.props.cols || 2, 1, 12)
                    : n.kind === "row"
                      ? kids.length
                      : 1,
                cw = Math.max(
                  40,
                  (n.frame.w - pad * 2 - gap * (cols - 1)) / cols,
                );
              let x = pad,
                y = 32;
              const heights = [];
              kids.forEach((c, i) => {
                const col = cols === 1 ? 0 : i % cols;
                if (cols > 1 && col === 0 && i) {
                  y += Math.max(...heights.splice(0)) + gap;
                }
                c.frame.x = x + col * (cw + gap);
                c.frame.y = y;
                if (cols === 1) y += c.frame.h + gap;
                else heights.push(c.frame.h);
                c.frame.w = Math.min(c.frame.w, cw);
              });
              if (cols > 1) y += Math.max(0, ...heights);
              if (n.props.autoHeight && n.frame.h !== y + pad) {
                n.frame.h = y + pad;
                changed = true;
              }
            }
            if (n.props.autoHeight && n.kind !== "slot") {
              const h = Math.max(
                KINDS[n.kind].min[1],
                32 +
                  (+n.props.padding || 8) +
                  Math.max(0, ...kids.map((c) => c.frame.y + c.frame.h)),
              );
              if (h !== n.frame.h) {
                n.frame.h = h;
                changed = true;
              }
            }
          }
          if (state.ui.autoflow)
            sp.nodes
              .filter((n) => !n.parent)
              .sort((a, b) => a.frame.y - b.frame.y)
              .forEach((n, i, arr) => {
                for (let j = 0; j < i; j++) {
                  const a = arr[j];
                  if (
                    n.frame.x < a.frame.x + a.frame.w &&
                    n.frame.x + n.frame.w > a.frame.x &&
                    n.frame.y < a.frame.y + a.frame.h &&
                    n.frame.y + n.frame.h > a.frame.y
                  ) {
                    const d = a.frame.y + a.frame.h + 8 - n.frame.y;
                    n.frame.y += d;
                    arr
                      .slice(i + 1)
                      .filter(
                        (b) =>
                          b.frame.x < n.frame.x + n.frame.w &&
                          b.frame.x + b.frame.w > n.frame.x &&
                          b.frame.y < n.frame.y + d,
                      )
                      .forEach((b) => (b.frame.y += d));
                  }
                }
              });
          if (!changed) break;
        }
      }
      function depth(n, sp) {
        let d = 0,
          p = n.parent;
        while (p && d < 100) {
          p = sp.nodes.find((n) => n.id === p)?.parent;
          d++;
        }
        return d;
      }
function reparent(n,parent,sp=spaceRef(),point=null){
 if(parent===n.id||(parent&&isDescendant(parent,n.id,sp))||['divider','image'].includes(n.kind)&&parent&&sp.nodes.find(x=>x.id===parent)?.kind==='slot')return false;
 const old=worldFrame(n,sp),p=sp.nodes.find(x=>x.id===parent);
 if(parent&&(!p||!CONTAINERS.includes(p.kind)))return false;
 sp.links=sp.links.filter(l=>!(l.type==='contains'&&l.to.node===n.id));
 n.parent=parent||null;const pf=p?worldFrame(p,sp):{x:0,y:0};
 n.frame.x=old.x-pf.x;n.frame.y=old.y-pf.y;
 if(!parent&&point){n.frame.x=point.x;n.frame.y=point.y;}
 if(p)sp.links.push(link(p,'contains-out',n,'contains-in','contains'));
 return true;
}
      function isDescendant(id, ancestor, sp) {
        let n = sp.nodes.find((n) => n.id === id),
          g = 0;
        while (n?.parent && g++ < 100) {
          if (n.parent === ancestor) return true;
          n = sp.nodes.find((x) => x.id === n.parent);
        }
        return false;
      }
      function hitContainer(p, exclude = []) {
        return spaceRef()
          ?.nodes.filter(
            (n) =>
              CONTAINERS.includes(n.kind) &&
              !n.hidden &&
              !n.locked &&
              !exclude.includes(n.id) &&
              !exclude.some((id) => isDescendant(n.id, id, spaceRef())),
          )
          .map((n) => ({ n, f: worldFrame(n) }))
          .filter(
            ({ f }) =>
              p.x >= f.x && p.x <= f.x + f.w && p.y >= f.y && p.y <= f.y + f.h,
          )
          .sort((a, b) => depth(b.n, spaceRef()) - depth(a.n, spaceRef()))[0]
          ?.n;
      }
      function startGesture(g, e) {
        gesture = { ...g, id: e.pointerId, moved: false };
        capturePointer(viewport, e.pointerId);
        e.preventDefault();
      }
      viewport.addEventListener("pointerdown", (e) => {
        const sp = spaceRef();
        if (!sp || e.target.closest("#minimap,#zoom-toolbar")) return;
        lastPointer = { x: e.clientX, y: e.clientY };
        const ne = e.target.closest(".node"),
          n = ne ? nodeById(ne.dataset.id) : null,
          port = e.target.closest(".port"),
          handle = e.target.closest(".handle");
        if (
          e.button === 1 ||
          spaceDown ||
          (e.altKey && e.button === 0 && !handle)
        ) {
          startGesture(
            {
              type: "pan",
              sx: e.clientX,
              sy: e.clientY,
              ox: state.ui.view.x,
              oy: state.ui.view.y,
            },
            e,
          );
          viewport.classList.add("panning");
          return;
        }
        if (e.button !== 0) return;
        if (port) {
          startGesture(
            {
              type: "link",
              from: nodeById(port.dataset.node),
              port: port.dataset.port,
            },
            e,
          );
          return;
        }
        if (n?.locked) {
          toast("Блок заблокирован. L — разблокировать.", "info");
          return;
        }
        if (handle && n) {
          startGesture(
            {
              type: "resize",
              ids: [...state.ui.selection],
              handle: handle.dataset.h,
              starts: Object.fromEntries(
                [...state.ui.selection].map((id) => [id, { ...nodeById(id).frame }]),
              ),
              sx: e.clientX,
              sy: e.clientY,
            },
            e,
          );
          return;
        }
        if (n) {
          if (e.shiftKey) {
            state.ui.selection.has(n.id)
              ? state.ui.selection.delete(n.id)
              : state.ui.selection.add(n.id);
          } else if (!state.ui.selection.has(n.id))
            state.ui.selection = new Set([n.id]);
          state.ui.selLink = null;
          renderCanvas();
          renderInspector();
          startGesture(
            {
              type: "move",
              ids: [...state.ui.selection].filter((id) => !nodeById(id).locked && ![...state.ui.selection].some(other=>other!==id&&isDescendant(id,other,sp))),
              starts: Object.fromEntries(
                [...state.ui.selection].map((id) => [
                  id,
                  { ...nodeById(id).frame },
                ]),
              ),
              original: sp.nodes
                .filter((n) => state.ui.selection.has(n.id))
                .map((n) => ({ id: n.id, parent: n.parent })),
              sx: e.clientX,
              sy: e.clientY,
            },
            e,
          );
          return;
        }
        startGesture(
          {
            type: "marquee",
            sx: e.clientX,
            sy: e.clientY,
            full: e.altKey,
            add: e.shiftKey,
          },
          e,
        );
      });
      viewport.addEventListener("pointermove", (e) => {
        lastPointer = { x: e.clientX, y: e.clientY };
        const w = screenToWorld(e.clientX, e.clientY);
        $("#status-pos").textContent =
          `x:${w.x.toFixed(1)} y:${w.y.toFixed(1)} · ${Math.round(state.ui.view.zoom * 100)}%`;
        if (!gesture) return;
        const g = gesture,
          v = state.ui.view,
          sp = spaceRef(),
          dx = (e.clientX - g.sx) / v.zoom,
          dy = (e.clientY - g.sy) / v.zoom;
        g.moved ||= Math.hypot(e.clientX - g.sx, e.clientY - g.sy) > 3;
        if (g.type === "pan") {
          v.x = g.ox + e.clientX - g.sx;
          v.y = g.oy + e.clientY - g.sy;
          applyView();
          return;
        }
        if (g.type === "move") {
          let guides = [];
          const r = state.ui.snapRadius / v.zoom;
          g.ids.forEach((id) => {
            const n = nodeById(id),
              st = g.starts[id];
            if (!n) return;
            let x = st.x + dx,
              y = st.y + dy;
            if (state.ui.snap) {
              const step = state.ui.gridStep;
              x = Math.round(x / step) * step;
              y = Math.round(y / step) * step;
            }
            if (state.ui.snapEdges || state.ui.snapCenters)
              sp.nodes
                .filter(
                  (o) =>
                    !g.ids.includes(o.id) && !o.hidden && o.parent === n.parent,
                )
                .forEach((o) => {
                  const edges = state.ui.snapEdges
                      ? [o.frame.x, o.frame.x + o.frame.w]
                      : [],
                    centers = state.ui.snapCenters
                      ? [o.frame.x + o.frame.w / 2 - n.frame.w / 2]
                      : [];
                  for (const a of [...edges, ...centers])
                    if (Math.abs(x - a) < r) {
                      x = a;
                      guides.push({ v: a });
                    }
                  const ys = state.ui.snapEdges
                      ? [o.frame.y, o.frame.y + o.frame.h]
                      : [],
                    cy = state.ui.snapCenters
                      ? [o.frame.y + o.frame.h / 2 - n.frame.h / 2]
                      : [];
                  for (const a of [...ys, ...cy])
                    if (Math.abs(y - a) < r) {
                      y = a;
                      guides.push({ h: a });
                    }
                });
            n.frame.x = x;
            n.frame.y = y;
            const el = nodesLayer.querySelector(`[data-id="${id}"]`);
            if (el) el.style.transform = `translate(${x-st.x}px,${y-st.y}px)`;
            sp.nodes.filter(c=>isDescendant(c.id,id,sp)).forEach(c=>{const ch=nodesLayer.querySelector(`[data-id="${c.id}"]`);if(ch)ch.style.transform=`translate(${x-st.x}px,${y-st.y}px)`;});
          });
          sp.links.forEach((l) => {
            const p = linkSvg.querySelector(`[data-id="${l.id}"]`);
            if (p) p.setAttribute("d", linkPath(l));
          });
          drawGuides(guides);
          const n = nodeById(g.ids[0]);
          if (n)
            setHint(
              `Перемещение: X ${n.frame.x.toFixed(1)} Y ${n.frame.y.toFixed(1)} · Δ ${dx.toFixed(1)}, ${dy.toFixed(1)} · W ${n.frame.w} H ${n.frame.h}`,
            );
          return;
        }
        if (g.type === "resize") {
          const n = nodeById(g.ids[0]);
          if (!n) return;
          const s = g.starts[n.id],
            h = g.handle,
            min = KINDS[n.kind].min;
          let x = s.x,
            y = s.y,
            w = s.w,
            hh = s.h;
          const sx = e.ctrlKey
              ? Math.round(dx / state.ui.gridStep) * state.ui.gridStep
              : dx,
            sy = e.ctrlKey
              ? Math.round(dy / state.ui.gridStep) * state.ui.gridStep
              : dy;
          if (h.includes("e")) w = Math.max(min[0], s.w + sx);
          if (h.includes("s")) hh = Math.max(min[1], s.h + sy);
          if (h.includes("w")) {
            w = Math.max(min[0], s.w - sx);
            x = s.x + s.w - w;
          }
          if (h.includes("n")) {
            hh = Math.max(min[1], s.h - sy);
            y = s.y + s.h - hh;
          }
          if (e.shiftKey) {
            const ratio = s.w / s.h;
            if (h.length === 2) {
              hh = Math.max(min[1], w / ratio);
              w = hh * ratio;
              if (h.includes("w")) x = s.x + s.w - w;
              if (h.includes("n")) y = s.y + s.h - hh;
            }
          }
          if (e.altKey) {
            x = s.x + (s.w - w) / 2;
            y = s.y + (s.h - hh) / 2;
          }
          const rx = w / s.w,
            ry = hh / s.h;
          g.ids.forEach((id) => {
            const t = nodeById(id),
              st = g.starts[id];
            t.frame = {
              x: x + (st.x - s.x) * rx,
              y: y + (st.y - s.y) * ry,
              w: Math.max(KINDS[t.kind].min[0], st.w * rx),
              h: Math.max(KINDS[t.kind].min[1], st.h * ry),
            };
          });
          g.ids.forEach((id) => {
            const t = nodeById(id),
              st = g.starts[id],
              el = nodesLayer.querySelector(`[data-id="${id}"]`);
            if (!t || !st || !el) return;
            Object.assign(el.style, {width:t.frame.w+'px',height:t.frame.h+'px',transform:`translate(${t.frame.x-st.x}px,${t.frame.y-st.y}px)`});
          });
          sp.links.forEach((l) =>
            linkSvg
              .querySelector(`[data-id="${l.id}"]`)
              ?.setAttribute("d", linkPath(l)),
          );
          setHint(
            `Размер: ${w.toFixed(1)} × ${hh.toFixed(1)} · Shift пропорции · Alt от центра`,
          );
          return;
        }
        if (g.type === "link") {
          const a = portPos(g.from, g.port);
          if (!g.temp) {
            g.temp = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "path",
            );
            g.temp.setAttribute("stroke", "#E9EEF7");
            g.temp.setAttribute("stroke-dasharray", "4 4");
            linkSvg.appendChild(g.temp);
          }
          g.temp.setAttribute("d", `M${a.x},${a.y} L${w.x},${w.y}`);
          $$(".port").forEach((p) => {
            const n = nodeById(p.dataset.node),
              ok = n && linkTypeFor(g.from, g.port, n, p.dataset.port);
            p.classList.toggle("pulse", !!ok);
            p.classList.toggle("dim", !ok);
          });
          return;
        }
        if (g.type === "marquee") {
          const r = viewport.getBoundingClientRect(),
            m = $("#marquee");
          m.style.display = "block";
          Object.assign(m.style, {
            left: Math.min(g.sx, e.clientX) - r.left + "px",
            top: Math.min(g.sy, e.clientY) - r.top + "px",
            width: Math.abs(e.clientX - g.sx) + "px",
            height: Math.abs(e.clientY - g.sy) + "px",
          });
        }
      });
      function finishGesture(e, cancel = false) {
        if (!gesture) return;
        const g = gesture;
        gesture = null;
        viewport.classList.remove("panning");
        try {
          releasePointer(viewport, g.id);
        } catch {}
        $("#marquee").style.display = "none";
        g.temp?.remove();
        $$(".port").forEach((p) => p.classList.remove("pulse", "dim"));
        overlay.innerHTML = "";
        const sp = spaceRef();
        if (cancel) {
          if (g.starts)
            Object.entries(g.starts).forEach(([id, f]) => {
              const n = nodeById(id);
              if (n) n.frame = f;
            });
          if (g.original)
            g.original.forEach((o) => {
              const n = nodeById(o.id);
              if (n) n.parent = o.parent;
            });
          renderCanvas();
          return;
        }
        if (g.type === "move" && g.moved) {
          const n = nodeById(g.ids[0]);
          if (n) {
            const f = worldFrame(n),
              target = hitContainer({ x: f.x + f.w / 2, y: f.y + 12 }, g.ids);
            if (target?.id !== n.parent) reparent(n, target?.id, sp);
          }
          snapshot("Перемещение блоков");
          refresh();
        }
        if (g.type === "resize" && g.moved) {
          snapshot("Изменение размера");
          refresh();
        }
        if (g.type === "link") {
          const el = document.elementFromPoint(e.clientX, e.clientY),
            port = el?.closest(".port"),
            body = el?.closest(".node"),
            p = screenToWorld(e.clientX, e.clientY);
          if (port) {
            connectNodes(
              g.from,
              g.port,
              nodeById(port.dataset.node),
              port.dataset.port,
            );
          } else if (body) {
            const target = nodeById(body.dataset.id),
              options = [
                ...KINDS[target.kind].ports.in,
                ...KINDS[target.kind].ports.out,
              ].filter((tp) => linkTypeFor(g.from, g.port, target, tp));
            if (options.length === 1)
              connectNodes(g.from, g.port, target, options[0]);
            else if (options.length)
              showCtx(
                e.clientX,
                e.clientY,
                options.map((tp) => ({
                  label: tp,
                  fn: () => connectNodes(g.from, g.port, target, tp),
                })),
              );
            else toast("Нет совместимых портов", "err");
          } else openRadial(e.clientX, e.clientY, g.from, g.port, p);
        }
        if (g.type === "marquee" && g.moved) {
          const a = screenToWorld(g.sx, g.sy),
            b = screenToWorld(e.clientX, e.clientY),
            x = Math.min(a.x, b.x),
            y = Math.min(a.y, b.y),
            X = Math.max(a.x, b.x),
            Y = Math.max(a.y, b.y);
          if (!g.add) state.ui.selection.clear();
          sp.nodes
            .filter((n) => !n.hidden && !n.locked)
            .forEach((n) => {
              const f = worldFrame(n),
                hit = g.full
                  ? f.x >= x && f.y >= y && f.x + f.w <= X && f.y + f.h <= Y
                  : f.x < X && f.x + f.w > x && f.y < Y && f.y + f.h > y;
              if (hit) state.ui.selection.add(n.id);
            });
          renderCanvas();
          renderInspector();
        }
        setHintFor(state.ui.module);
      }
      viewport.addEventListener("pointerup", (e) => finishGesture(e));
      viewport.addEventListener("pointercancel", (e) => finishGesture(e, true));
      window.addEventListener("blur", () => {
        spaceDown = false;
        finishGesture({}, true);
      });
function connectNodes(a,ap,b,bp){
 const sp=spaceRef(),type=linkTypeFor(a,ap,b,bp);
 if(!type){toast('Запрещённое соединение: несовместимые порты','err');return false;}
 if(sp.links.some(l=>l.from.node===a.id&&l.from.port===ap&&l.to.node===b.id&&l.to.port===bp)){toast('Такая связь уже существует','info');return false;}
 const l=link(a,ap,b,bp,type);
 if(type==='contains'){if(!reparent(b,a.id,sp)){toast('Нельзя вложить блок в этого потомка','err');return false;}}
 if(type==='data'){
  const f=fieldOf(a);if(!f||f.removed){toast('У поля нет активного определения','err');return false;}
  if(b.kind==='table'){b.props.fields=[...new Set([...(b.props.fields||[]),f.name])];}
  else {b.props.previousBinding={bind:b.bind,field:b.props.field};b.bind=f.id;b.props.field=f.name;}
 }
 if(type==='derive'){
  const target=fieldOf(b),source=fieldOf(a);if(!target||!source||target.removed||source.removed)return false;
  const old=target.formula||'';target.type='calc';
  if(!old||old==='=')target.formula='=['+source.name+']';
  else if(!Expr.refs(old).includes(source.name))target.formula=old+'+['+source.name+']';
  l.props.addedTerm=!old||old==='='?'=['+source.name+']':'+['+source.name+']';
  b.label=target.name;
 }
 if(type==='modifies'){
  const target=b.kind==='field'?fieldOf(b):schema().fields.find(f=>f.id===b.bind);
  if(!target){toast('Сначала привяжите цель к полю схемы','err');return false;}
  a.props.targetField=target.id;
 }
 if(type==='refers'&&b.kind==='slot'){
  const id=a.props.schemaId||(a.kind==='field'?schema().id:null);
  if(!state.model.schemas.some(s=>s.id===id)){toast('Источник не указывает на схему','err');return false;}
  b.props.sourceSchema=id;
 }
 sp.links.push(l);
 if(sp===schema())bumpSchema(sp,[{op:'connect',linkId:l.id,type}]);
 state.ui.selLink=l.id;state.ui.selection.clear();snapshot('Связь: '+LINKS[type].label);refresh();toast('Связано: '+a.label+' → '+b.label,'ok');return true;
}
      function openRadial(x, y, a, p, wp) {
        const sp = spaceRef(),
          items = [];
        Object.keys(KINDS)
          .filter((k) => sp === schema() || VISUAL.includes(k))
          .forEach((k) => {
            const n = { kind: k, id: "new" },
              ports = [
                ...KINDS[k].ports.in,
                ...KINDS[k].ports.out,
                "flow-in",
                "flow-out",
                "contains-in",
              ];
            for (const tp of ports) {
              const t = linkTypeFor(a, p, n, tp);
              if (t)
                items.push({
                  label: KINDS[k].label + " · " + LINKS[t].label,
                  fn: () => {
                    const real = mkNode(k, wp.x, wp.y);
                    real.space = sp === schema() ? "schema" : "layout";
                    sp.nodes.push(real);
                    if (k === "field") {
                      const f = field("Поле" + (schema().fields.length + 1));
                      schema().fields.push(f);
                      real.props.fieldId = f.id;
                      real.bind = f.id;
                      real.label = f.name;
                    }
                    connectNodes(a, p, real, tp);
                  },
                });
            }
          });
        if (items.length) showCtx(x, y, items);
        else toast("Для этого порта нет совместимых блоков", "err");
      }
      function drawGuides(gs) {
        overlay.innerHTML = "";
        if (!state.ui.guides) return;
        gs.forEach((g) => {
          const d = document.createElement("div");
          d.className = "guide";
          d.style.cssText =
            g.v !== undefined
              ? `left:${g.v}px;top:0;width:1px;height:5000px`
              : `top:${g.h}px;left:0;height:1px;width:5000px`;
          overlay.appendChild(d);
        });
      }
      /* Palette, object library, layers and fragments. */
      function renderPalette() {
        const p = $("#palette"),
          mod = state.ui.module;
        p.classList.remove("hidden");
        p.innerHTML = `<div class="pal-search"><input id="pal-search" placeholder="Поиск блоков / объектов" aria-label="Поиск"></div><div id="pal-content" class="pal-list"></div>`;
        const box = $("#pal-content");
        const add = (label, color, fn, drag) => {
          const b = document.createElement("button");
          b.className = "pal-item";
          b.title = label;
          b.setAttribute('aria-label', label);
          b.innerHTML = `<span class="sw" style="background:${color}"></span><span>${esc(label)}</span>`;
          b.onclick = fn;
          if (drag) {
            b.draggable = true;
            b.ondragstart = (e) => {
              drag(e);
              b.classList.add("dragging");
            };
            b.ondragend = () => {
              b.classList.remove("dragging");
              dragGhost?.remove();
              dragGhost = null;
            };
          }
          box.appendChild(b);
        };
        const heading = (t) => {
          const h = document.createElement("h4");
          h.textContent = t;
          box.appendChild(h);
        };
        if (["schema", "layout"].includes(mod)) {
          heading("Блоки · клик / двойной клик");
          Object.entries(KINDS)
            .filter(
              ([k, d]) =>
                (mod === "schema" || d.cat === "visual") &&
                (!state.ui.simple ||
                  ["section", "card", "slot", "stat", "text", "field"].includes(
                    k,
                  )),
            )
            .forEach(([k, d]) =>
              add(
                d.label,
                d.color,
                () => dropKindCenter(k),
                (e) => {
                  paletteDrag = { kind: k };
                  e.dataTransfer.setData("text/plain", "forge:kind:" + k);
                  const r = viewport.getBoundingClientRect();
                  dragGhost = document.createElement("div");
                  dragGhost.className = "drag-ghost";
                  dragGhost.textContent = d.label;
                  document.body.appendChild(dragGhost);
                  dragGhost.style.left = r.left + 30 + "px";
                  dragGhost.style.top = r.top + 30 + "px";
                },
              ),
            );
          if (mod === "schema") {
            heading("Поля схемы");
            schema()
              .fields.filter((f) => !f.removed)
              .forEach((f) => {
                const n = schema().nodes.find(
                  (n) => n.kind === "field" && n.props.fieldId === f.id,
                );
                add(
                  f.name + " · " + VALUE_TYPES[f.type],
                  "#22D3EE",
                  () => (n ? focusNode(n.id) : addField()),
                  (e) => {
                    if (n) {
                      paletteDrag = { nodeId: n.id };
                      e.dataTransfer.setData(
                        "text/plain",
                        "forge:field:" + n.id,
                      );
                    }
                  },
                );
              });
          }
          if (mod === "layout") {
            heading("Компоновки");
            state.model.layouts.forEach((l, i) =>
              add(l.name, "#A78BFA", () => {
                state.ui.activeLayout = i;
                refresh();
              }),
            );
            heading("Схемы → слот");
            state.model.schemas.forEach((s) =>
              add(
                s.name,
                "#A78BFA",
                () => {
                  const n = mkNode("slot", 100, 100, 600, 180, s.name, {
                    sourceSchema: s.id,
                    autoHeight: true,
                  });
                  n.space = "layout";
                  layout().nodes.push(n);
                  commitNode(n);
                },
                (e) => {
                  paletteDrag = { schemaId: s.id };
                  e.dataTransfer.setData("text/plain", "forge:schema:" + s.id);
                },
              ),
            );
          }
          heading("Объекты → в слот");
          objectsOfSchema(state.ui.module === "layout" ? schema() : schema())
            .slice(0, 100)
            .forEach((o) =>
              add(
                o.name,
                "#A78BFA",
                () => {
                  if (mod === "layout") {
                    const slot = layout().nodes.find(
                      (n) =>
                        n.kind === "slot" && n.props.sourceSchema === o.schema,
                    );
                    if (slot) addToSlot(slot.id, o.id);
                    else toast("Сначала создайте слот этой схемы", "err");
                  } else {
                    state.ui.previewObj = o;
                    state.ui.rpTab = "prev";
                    renderInspector();
                  }
                },
                (e) => {
                  paletteDrag = { objectId: o.id };
                  e.dataTransfer.setData("text/plain", "forge:object:" + o.id);
                },
              ),
            );
          heading("Инструменты");
          add("▤ Слои и вложенность", "#F5A524", layersDialog);
          add("⌘ Граф зависимостей", "#A3E635", graphDialog);
          add("▧ Фрагменты", "#A78BFA", fragmentsDialog);
          add("✓ Проверить", "#FB923C", () => {
            $("#drawer-val").classList.add("open");
            validate();
          });
        } else if (mod === "base") {
          heading("Папки");
          add("Все объекты", "#F5A524", () => {
            state.ui.baseFolder = "";
            renderBase();
          });
          [
            ...new Set(state.model.objects.map((o) => o.folder || "Без папки")),
          ].forEach((f) =>
            add(
              "▰ " + f,
              "#F5A524",
              () => {
                state.ui.baseFolder = f === "Без папки" ? "" : f;
                renderBase();
              },
              (e) => e.dataTransfer.setData("text/plain", "forge:folder:" + f),
            ),
          );
          add("★ Избранное", "#F5A524", () => {
            state.ui.baseFavorite = !state.ui.baseFavorite;
            renderBase();
          });
          heading("Корзина");
          add("Восстановление объектов", "#FB923C", trashDialog);
          heading("Импорт");
          add("CSV / XLSX", "#22D3EE", importTableDialog);
          add("BattleScribe XML", "#A78BFA", importBattleScribe);
          heading("Сохранённые виды");
          state.model.views.forEach((v) =>
            add(v.name, "#A78BFA", () => {
              Object.assign(state.ui, v.filter);
              $("#base-search").value = state.ui.baseSearch;
              renderBase();
            }),
          );
          add("＋ Сохранить текущий вид", "#A3E635", saveViewDialog);
        } else {
          heading("Персонажи и отряды");
          state.model.rosters.forEach((r, i) =>
            add(
              r.name,
              "#F5A524",
              () => {
                state.ui.activeRoster = i;
                refresh();
              },
              (e) => e.dataTransfer.setData("text/plain", "forge:roster:" + i),
            ),
          );
          add("＋ Новый персонаж / отряд", "#A3E635", newRosterDialog);
          heading("Объекты");
          state.model.objects
            .filter((o) => !o.deleted)
            .slice(0, 200)
            .forEach((o) =>
              add(
                o.name,
                "#22D3EE",
                () =>
                  openObjectForm(
                    state.model.schemas.find((s) => s.id === o.schema),
                    o,
                  ),
                (e) => {
                  paletteDrag = { objectId: o.id };
                  e.dataTransfer.setData("text/plain", "forge:object:" + o.id);
                },
              ),
            );
          heading("Библиотека");
          add("Экспорт и печать", "#F5A524", exportDialog);
          add("Резервные копии", "#A78BFA", backupDialog);
        }
        $("#pal-search").oninput = (e) => {
          const q = e.target.value.toLowerCase();
          box
            .querySelectorAll(".pal-item")
            .forEach((b) =>
              b.classList.toggle(
                "hidden",
                !b.textContent.toLowerCase().includes(q),
              ),
            );
        };
      }
      document.addEventListener("dragover", (e) => {
        if (dragGhost) {
          dragGhost.style.left = e.clientX + 12 + "px";
          dragGhost.style.top = e.clientY + 12 + "px";
        }
      });
      viewport.addEventListener("dragover", (e) => {
        e.preventDefault();
        const p = screenToWorld(e.clientX, e.clientY),
          target = hitContainer(p);
        $$(".drop-target").forEach((el) => el.classList.remove("drop-target"));
        if (target)
          nodesLayer
            .querySelector(`[data-id="${target.id}"]`)
            ?.classList.add("drop-target");
      });
      viewport.addEventListener("drop", (e) => {
        e.preventDefault();
        $$(".drop-target").forEach((el) => el.classList.remove("drop-target"));
        const data = e.dataTransfer.getData("text/plain"),
          p = screenToWorld(e.clientX, e.clientY),
          target = hitContainer(p);
        if (paletteDrag?.kind) {
          const k = paletteDrag.kind;
          if (state.ui.module === "layout" && !VISUAL.includes(k)) return;
          addNodeAt(k, p.x, p.y, target?.id);
        } else if (paletteDrag?.schemaId) {
          const n = mkNode("slot", p.x, p.y, 600, 180, "Слот", {
            sourceSchema: paletteDrag.schemaId,
            autoHeight: true,
          });
          n.space = "layout";
          layout().nodes.push(n);
          if (target) reparent(n, target.id);
          commitNode(n);
        } else if (paletteDrag?.nodeId) {
          const n = nodeById(paletteDrag.nodeId);
          if (target && linkTypeFor(n, "out", target, "data-in"))
            connectNodes(n, "out", target, "data-in");
        } else if (paletteDrag?.objectId) {
          const slot =
            target?.kind === "slot"
              ? target
              : layout()?.nodes.find(
                  (n) =>
                    n.kind === "slot" &&
                    n.props.sourceSchema ===
                      state.model.objects.find(
                        (o) => o.id === paletteDrag.objectId,
                      )?.schema,
                );
          if (slot) addToSlot(slot.id, paletteDrag.objectId);
          else toast("Перетащите объект на совместимый слот", "err");
        }
        paletteDrag = null;
        dragGhost?.remove();
        dragGhost = null;
      });
      function dropKindCenter(k) {
        const p = screenToWorld(
          viewport.getBoundingClientRect().left + viewport.clientWidth / 2,
          viewport.getBoundingClientRect().top + viewport.clientHeight / 2,
        );
        addNodeAt(k, p.x - 80, p.y - 40);
      }
      function defaultProps(k) {
        return k === "modifier"
          ? { operation: "add", value: "1", layer: "add" }
          : k === "condition"
            ? { mode: "AND", expr: "[Экипировано]" }
            : k === "constraint"
              ? { rule: "max", value: 2, scope: "roster" }
              : k === "slot"
                ? { sourceSchema: schema().id, autoHeight: true, cols: 1 }
                : k === "text"
                  ? { static: "Текст", size: 14 }
                  : {};
      }
      function addNodeAt(k, x, y, parent = null) {
        const sp = spaceRef();
        if (!sp) return;
        if (sp !== schema() && !VISUAL.includes(k)) {
          toast("Служебные блоки доступны только в схеме", "err");
          return;
        }
        const n = mkNode(k, x, y, null, null, null, defaultProps(k));
        n.space = sp === schema() ? "schema" : "layout";
        sp.nodes.push(n);
        if (k === "field") {
          const f = field(
            "Поле" + (schema().fields.filter((f) => !f.removed).length + 1),
          );
          f.order = schema().fields.length;
          schema().fields.push(f);
          n.props.fieldId = f.id;
          n.bind = f.id;
          n.label = f.name;
          schema().changelog.push({
            version: schema().version + 1,
            op: "add_field",
            fieldId: f.id,
            name: f.name,
          });
        }
        if (parent) reparent(n, parent);
        commitNode(n);
        if (k === "field") fieldWizard(n);
        else if (k === "slot") slotWizard(n);
        else if (["modifier", "condition", "constraint"].includes(k))
          blockWizard(n);
        else if (VISUAL.includes(k) && k !== "divider" && state.model.settings.blockWizard !== false)
          blockWizard(n);
        return n;
      }
      function commitNode(n) {
        state.ui.selection = new Set([n.id]);
        state.ui.selLink = null;
        snapshot("Создание: " + n.label);
        refresh();
        toast("Создан блок «" + n.label + "»", "ok");
      }
      function duplicateSelected() {
        const sp = spaceRef();
        if (!sp || !state.ui.selection.size) return;
        const ids = [...state.ui.selection],
          map = new Map(),
          roots = ids.filter((id) => !ids.includes(nodeById(id).parent));
        ids.forEach((id) => {
          const c = clone(nodeById(id));
          c.id = uid();
          map.set(id, c);
          sp.nodes.push(c);
        });
        ids.forEach((id) => {
          const c = map.get(id);
          c.parent = map.get(c.parent)?.id || c.parent;
          if (roots.includes(id)) {
            c.frame.x += 24;
            c.frame.y += 24;
          }
        });
        sp.links
          .filter((l) => map.has(l.from.node) && map.has(l.to.node))
          .forEach((l) =>
            sp.links.push({
              ...clone(l),
              id: uid(),
              from: { ...l.from, node: map.get(l.from.node).id },
              to: { ...l.to, node: map.get(l.to.node).id },
            }),
          );
        state.ui.selection = new Set(ids.map((id) => map.get(id).id));
        snapshot("Дублирование фрагмента");
        refresh();
      }
function deleteSelected(){
 const sp=spaceRef();if(!sp)return;
 if(state.ui.selLink){const l=sp.links.find(l=>l.id===state.ui.selLink);if(!l)return;
  const a=sp.nodes.find(n=>n.id===l.from.node),b=sp.nodes.find(n=>n.id===l.to.node);
  sp.links=sp.links.filter(x=>x.id!==l.id);
  if(l.type==='contains'&&b){const f=worldFrame(b,sp);b.parent=null;b.frame.x=f.x;b.frame.y=f.y;}
  if(l.type==='data'&&b){const prev=b.props.previousBinding;b.bind=prev?.bind||null;if(prev?.field)b.props.field=prev.field;else delete b.props.field;delete b.props.previousBinding;if(b.kind==='table')b.props.fields=(b.props.fields||[]).filter(n=>n!==fieldOf(a)?.name);}
  if(l.type==='derive'&&b){const f=fieldOf(b);if(f&&l.props.addedTerm)f.formula=f.formula.replace(l.props.addedTerm,'');}
  if(l.type==='modifies'&&a&&!sp.links.some(x=>x.type==='modifies'&&x.from.node===a.id))delete a.props.targetField;
  if(l.type==='refers'&&b?.kind==='slot')b.props.sourceSchema=null;
  state.ui.selLink=null;if(sp===schema())bumpSchema(sp,[{op:'disconnect',linkId:l.id,type:l.type}]);snapshot('Удаление связи');refresh();toast('Связь и её свойство удалены','err',undo);return;
 }
 const ids=new Set(state.ui.selection);if(!ids.size)return;
 sp.nodes.filter(n=>[...ids].some(id=>isDescendant(n.id,id,sp))).forEach(n=>ids.add(n.id));
 if([...ids].some(id=>nodeById(id)?.locked)){toast('Сначала разблокируйте блоки (L)','err');return;}
 const links=sp.links.filter(l=>ids.has(l.from.node)||ids.has(l.to.node)).length;
 confirmDialog('Удалить блоки?',`${ids.size} блоков и ${links} связей. Дочерние блоки удаляются вместе с контейнером.`,()=>{
  const removed=sp.nodes.filter(n=>ids.has(n.id));
  if(sp===schema()){const fids=removed.filter(n=>n.kind==='field').map(n=>n.props.fieldId);schema().fields.forEach(f=>{if(fids.includes(f.id))f.removed=true;});if(fids.length)bumpSchema(schema(),fids.map(fieldId=>({op:'remove_field',fieldId})));}
  sp.nodes=sp.nodes.filter(n=>!ids.has(n.id));sp.links=sp.links.filter(l=>!ids.has(l.from.node)&&!ids.has(l.to.node));state.ui.selection.clear();snapshot('Удаление блоков');refresh();toast('Удалено '+ids.size+' блоков','err',undo);
 });
}
      function alignSelected(mode) {
        const sp = spaceRef(),
          ns = [...state.ui.selection]
            .map(nodeById)
            .filter((n) => n && !n.locked);
        if (ns.length < 2) {
          toast("Выделите минимум два блока", "info");
          return;
        }
        const minx = Math.min(...ns.map((n) => n.frame.x)),
          maxx = Math.max(...ns.map((n) => n.frame.x + n.frame.w)),
          miny = Math.min(...ns.map((n) => n.frame.y)),
          maxy = Math.max(...ns.map((n) => n.frame.y + n.frame.h));
        if (["left", "right", "top", "bottom"].includes(mode))
          ns.forEach((n) => {
            if (mode === "left") n.frame.x = minx;
            if (mode === "right") n.frame.x = maxx - n.frame.w;
            if (mode === "top") n.frame.y = miny;
            if (mode === "bottom") n.frame.y = maxy - n.frame.h;
          });
        if (["centerX", "centerY"].includes(mode))
          ns.forEach((n) => {
            if (mode === "centerX") n.frame.x = (minx + maxx - n.frame.w) / 2;
            else n.frame.y = (miny + maxy - n.frame.h) / 2;
          });
        if (["distX", "distY"].includes(mode)) {
          if (ns.length < 3) return;
          const key = mode === "distX" ? "x" : "y",
            dim = mode === "distX" ? "w" : "h";
          ns.sort((a, b) => a.frame[key] - b.frame[key]);
          const gap =
            ((mode === "distX" ? maxx - minx : maxy - miny) -
              ns.reduce((a, n) => a + n.frame[dim], 0)) /
            (ns.length - 1);
          let pos = mode === "distX" ? minx : miny;
          ns.forEach((n) => {
            n.frame[key] = pos;
            pos += n.frame[dim] + gap;
          });
        }
        if (["sameW", "sameH", "sameSize"].includes(mode)) {
          if (mode !== "sameH") ns.forEach((n) => (n.frame.w = ns[0].frame.w));
          if (mode !== "sameW") ns.forEach((n) => (n.frame.h = ns[0].frame.h));
        }
        snapshot("Выравнивание");
        refresh();
      }
      function layersDialog() {
        const sp = spaceRef();
        if (!sp) return;
        const row = (n, d = 0) =>
          `<div class="layer-row" data-id="${n.id}" style="padding-left:${d * 16 + 8}px"><button data-select="${n.id}">${esc(n.label)} <small>${esc(KINDS[n.kind].label)}</small></button><button data-lock="${n.id}">${n.locked ? "▣" : "□"}</button><button data-hide="${n.id}">${n.hidden ? "◌" : "◉"}</button><select data-parent="${n.id}"><option value="">Корень</option>${sp.nodes
            .filter(
              (p) =>
                CONTAINERS.includes(p.kind) &&
                p.id !== n.id &&
                !isDescendant(p.id, n.id, sp),
            )
            .map(
              (p) =>
                `<option value="${p.id}" ${p.id === n.parent ? "selected" : ""}>${esc(p.label)}</option>`,
            )
            .join("")}</select></div>` +
          (d < 30
            ? sp.nodes
                .filter((c) => c.parent === n.id)
                .map((c) => row(c, d + 1))
                .join("")
            : "");
        openModal(
          "Слои и вложенность",
          `<input id="layer-search" placeholder="Поиск блока" style="width:100%"><div>${sp.nodes
            .filter((n) => !n.parent)
            .map((n) => row(n))
            .join("")}</div>`,
          `<button class="btn" id="layers-group">Сгруппировать</button><button class="btn" onclick="closeModal()">Готово</button>`,
        );
        $("#layer-search").oninput = (e) =>
          $$(".layer-row").forEach((r) =>
            r.classList.toggle(
              "hidden",
              !r.textContent
                .toLowerCase()
                .includes(e.target.value.toLowerCase()),
            ),
          );
        $$("[data-select]").forEach(
          (b) =>
            (b.onclick = () => {
              closeModal();
              focusNode(b.dataset.select);
            }),
        );
        $$("[data-lock]").forEach(
          (b) =>
            (b.onclick = () => {
              nodeById(b.dataset.lock).locked = !nodeById(b.dataset.lock)
                .locked;
              snapshot("Блокировка");
              refresh();
              layersDialog();
            }),
        );
        $$("[data-hide]").forEach(
          (b) =>
            (b.onclick = () => {
              nodeById(b.dataset.hide).hidden = !nodeById(b.dataset.hide)
                .hidden;
              snapshot("Видимость");
              refresh();
              layersDialog();
            }),
        );
        $$("[data-parent]").forEach(
          (s) =>
            (s.onchange = () => {
              if (reparent(nodeById(s.dataset.parent), s.value || null)) {
                snapshot("Вложенность");
                refresh();
                layersDialog();
              }
            }),
        );
        $("#layers-group").onclick = () => {
          closeModal();
          groupSelected();
        };
      }
      function groupSelected() {
        const sp = spaceRef(),
          ns = [...state.ui.selection].map(nodeById).filter(Boolean);
        if (!ns.length) return;
        const x = Math.min(...ns.map((n) => worldFrame(n).x)),
          y = Math.min(...ns.map((n) => worldFrame(n).y)),
          g = mkNode(
            "card",
            x,
            y,
            Math.max(...ns.map((n) => worldFrame(n).x + n.frame.w)) - x + 16,
            Math.max(...ns.map((n) => worldFrame(n).y + n.frame.h)) - y + 40,
            "Группа",
          );
        g.space = sp === schema() ? "schema" : "layout";
        sp.nodes.push(g);
        ns.forEach((n) => reparent(n, g.id));
        state.ui.selection = new Set([g.id]);
        snapshot("Группировка");
        refresh();
      }
      function ungroupSelected() {
        const sp = spaceRef();
        [...state.ui.selection]
          .map(nodeById)
          .filter((n) => n && CONTAINERS.includes(n.kind))
          .forEach((n) => {
            sp.nodes
              .filter((c) => c.parent === n.id)
              .forEach((c) => reparent(c, n.parent));
            sp.nodes = sp.nodes.filter((x) => x.id !== n.id);
            sp.links = sp.links.filter(
              (l) => l.from.node !== n.id && l.to.node !== n.id,
            );
          });
        state.ui.selection.clear();
        snapshot("Разгруппировка");
        refresh();
      }
      function fragmentsDialog() {
        openModal(
          "Фрагменты",
          `<button class="btn" id="frag-save">Сохранить выделение как фрагмент</button>` +
            state.model.fragments
              .map(
                (f, i) =>
                  `<div class="pick-row"><b>${esc(f.name)}</b><span>${f.nodes.length} блоков</span><button class="btn" data-frag="${i}">Вставить</button></div>`,
              )
              .join(""),
          '<button class="btn" onclick="closeModal()">Закрыть</button>',
        );
        $("#frag-save").onclick = () => {
          const sp = spaceRef();
          if (!sp || !state.ui.selection.size) {
            toast("Выделите блоки на холсте", "info");
            return;
          }
          const ids = new Set(state.ui.selection);
          sp.nodes
            .filter((n) => [...ids].some((id) => isDescendant(n.id, id, sp)))
            .forEach((n) => ids.add(n.id));
          state.model.fragments.push({
            id: uid(),
            name: "Фрагмент " + (state.model.fragments.length + 1),
            nodes: sp.nodes.filter((n) => ids.has(n.id)).map(clone),
            links: sp.links
              .filter((l) => ids.has(l.from.node) && ids.has(l.to.node))
              .map(clone),
          });
          snapshot("Сохранение фрагмента");
          fragmentsDialog();
        };
        $$("[data-frag]").forEach(
          (b) =>
            (b.onclick = () => {
              const f = state.model.fragments[+b.dataset.frag],
                sp = spaceRef(),
                map = new Map();
              f.nodes.forEach((n) => {
                const c = clone(n);
                c.id = uid();
                c.frame.x += 40;
                c.frame.y += 40;
                map.set(n.id, c.id);
                sp.nodes.push(c);
              });
              f.nodes.forEach((n) => {
                const c = sp.nodes.find((x) => x.id === map.get(n.id));
                c.parent = map.get(c.parent) || null;
              });
              f.links.forEach((l) =>
                sp.links.push({
                  ...clone(l),
                  id: uid(),
                  from: { ...l.from, node: map.get(l.from.node) },
                  to: { ...l.to, node: map.get(l.to.node) },
                }),
              );
              state.ui.selection = new Set(map.values());
              snapshot("Вставка фрагмента");
              closeModal();
              refresh();
            }),
        );
      }
      function graphDialog() {
        const rows = [];
        state.model.schemas.forEach((s) => {
          s.fields
            .filter((f) => !f.removed)
            .forEach((f) => {
              Expr.refs(f.formula).forEach((r) =>
                rows.push({ from: r, to: f.name, op: "формула", s }),
              );
              s.links
                .filter(
                  (l) =>
                    l.type === "modifies" &&
                    s.nodes.find((n) => n.id === l.to.node)?.props.fieldId ===
                      f.id,
                )
                .forEach((l) =>
                  rows.push({
                    from: s.nodes.find((n) => n.id === l.from.node)?.label,
                    to: f.name,
                    op: "модификатор",
                    s,
                  }),
                );
            });
        });
        openModal(
          "Граф зависимостей · Derived",
          `<p class="muted">Автогенерируется из формул и связей. Только чтение; клик открывает источник.</p><svg width="640" height="${Math.max(100, rows.length * 54 + 30)}" viewBox="0 0 640 ${Math.max(100, rows.length * 54 + 30)}" style="max-width:100%">${rows.map((r, i) => `<g data-graph="${i}" style="cursor:pointer"><rect x="10" y="${i * 54 + 10}" width="180" height="36" rx="5" fill="#1B2331" stroke="#22D3EE"/><text x="20" y="${i * 54 + 33}" fill="#E9EEF7" font-size="12">${esc(r.from)}</text><path d="M190 ${i * 54 + 28}H390" stroke="#A3E635" stroke-width="2"/><text x="225" y="${i * 54 + 22}" fill="#8797AE" font-size="10">${esc(r.op)}</text><rect x="390" y="${i * 54 + 10}" width="200" height="36" rx="5" fill="#1B2331" stroke="#F5A524"/><text x="400" y="${i * 54 + 33}" fill="#E9EEF7" font-size="12">${esc(r.to)}</text></g>`).join("")}</svg>${!rows.length ? "<p>Создайте формулу или связь, чтобы увидеть зависимости.</p>" : ""}`,
        );
        $$("[data-graph]").forEach(
          (g) =>
            (g.onclick = () => {
              const r = rows[+g.dataset.graph];
              state.ui.activeSchema = state.model.schemas.indexOf(r.s);
              closeModal();
              setModule("schema");
              const n = schema().nodes.find((n) => n.label === r.from);
              if (n) focusNode(n.id);
            }),
        );
      }
      /* Property inspector: all edits commit atomically; field renames use a diff dialog. */
      function inp(id, label, value, type = "text", extra = "") {
        return `<div class="insp-row"><label for="${id}">${esc(label)}</label><input id="${id}" type="${type}" value="${esc(value)}" ${extra}></div>`;
      }
      function sel(id, label, value, opts) {
        // Совместимость: sel(id, label, opts) — значение по умолчанию первый пункт.
        if (opts === undefined && Array.isArray(value)) { opts = value; value = Array.isArray(opts[0]) ? opts[0][0] : opts[0]; }
        opts = Array.isArray(opts) ? opts : [];
        return `<div class="insp-row"><label for="${id}">${esc(label)}</label><select id="${id}">${opts
          .map((o) => {
            const [v, t] = Array.isArray(o) ? o : [o, o];
            return `<option value="${esc(v)}" ${String(v) === String(value) ? "selected" : ""}>${esc(t)}</option>`;
          })
          .join("")}</select></div>`;
      }
      function renderInspector() {
        const body = $("#rp-body"),
          sp = spaceRef();
        $$(".rp-tab").forEach((b) =>
          b.classList.toggle("active", b.dataset.rp === state.ui.rpTab),
        );
        if (state.ui.rpTab === "prev") {
          renderPreview();
          return;
        }
        if (state.ui.module === "char") {
          rosterInspector();
          return;
        }
        if (state.ui.module === "base") {
          body.innerHTML =
            '<h4>База объектов</h4><p class="muted">Двойной клик — правка. Shift — диапазон. Ctrl+Enter — значение во все выделенные ячейки.</p><button class="btn" id="insp-bulk">Изменить выделенные</button><button class="btn" id="insp-grid-help">Клавиши грида</button>';
          $("#insp-bulk").onclick = bulkEditDialog;
          $("#insp-grid-help").onclick = () => helpDialog("grid");
          return;
        }
        if (!sp) return;
        if (state.ui.selLink) {
          const l = sp.links.find((l) => l.id === state.ui.selLink);
          if (l) {
            body.innerHTML =
              `<h4>Связь · ${esc(LINKS[l.type].label)}</h4><p>${esc(nodeById(l.from.node)?.label)} → ${esc(nodeById(l.to.node)?.label)}</p>` +
              inp("l-condition", "Условие", l.props.condition || "") +
              inp(
                "l-repeat",
                "Повторять, раз",
                l.props.repeatBy || 1,
                "number",
                'min="1" max="1000"',
              ) +
              inp("l-weight", "Вес", l.props.weight ?? 1, "number") +
              sel("l-layer", "Слой", l.props.layer || "add", [
                "base",
                "set",
                "equipment",
                "add",
                "mul",
                "bounds",
              ]) +
              '<button class="btn danger" id="l-delete">Удалить связь</button>';
            ["condition", "repeatBy", "weight", "layer"].forEach(
              (k) =>
                ($("#l-" + (k === "repeatBy" ? "repeat" : k)).onchange = (
                  e,
                ) => {
                  l.props[k] = e.target.value;
                  snapshot("Свойство связи");
                  refresh();
                }),
            );
            $("#l-delete").onclick = deleteSelected;
            return;
          }
        }
        const n = nodeById([...state.ui.selection][0]);
        if (!n) {
          body.innerHTML = `<div class="empty-state"><span>▧</span><h4>Структура начинается с блока</h4><p>Выберите блок на холсте или добавьте его из палитры. Потяните от порта, чтобы связать данные.</p><button class="btn primary" id="empty-add">＋ Добавить поле / секцию</button></div>`;
          $("#empty-add").onclick = () =>
            dropKindCenter(state.ui.module === "schema" ? "field" : "section");
          return;
        }
        let html =
          `<h4>${esc(KINDS[n.kind].label)} ${state.ui.selection.size > 1 ? "· " + state.ui.selection.size + " блоков" : ""}</h4>` +
          inp("i-label", "Название", n.label) +
          `<div class="insp-grid">${inp("i-x", "X", n.frame.x)}${inp("i-y", "Y", n.frame.y)}${inp("i-w", "Ширина", n.frame.w)}${inp("i-h", "Высота", n.frame.h)}</div>`;
        if (n.kind === "field") {
          const f = fieldOf(n);
          html += `<button class="btn" id="i-field-edit">Настроить поле · ${esc(VALUE_TYPES[f?.type])}</button>`;
        }
        if (
          VISUAL.includes(n.kind) &&
          !["divider", "image", "section", "row", "column"].includes(n.kind)
        )
          html += sel("i-bind", "Источник данных", n.bind || "", [
            ["", "—"],
            ...schema()
              .fields.filter((f) => !f.removed)
              .map((f) => [f.id, f.name]),
          ]);
        if (CONTAINERS.includes(n.kind))
          html +=
            sel("i-layout", "Раскладка детей", n.layoutMode || "free", [
              ["free", "Свободная"],
              ["flow", "Поток"],
              ["grid", "Сетка"],
            ]) +
            inp(
              "i-cols",
              "Колонок",
              n.props.cols || 2,
              "number",
              'min="1" max="12"',
            ) +
            inp("i-gap", "Зазор", n.props.gap ?? 8, "number") +
            `<label class="check-row"><input type="checkbox" id="i-auto" ${n.props.autoHeight ? "checked" : ""}> Автовысота</label>`;
        if (n.kind === "slot")
          html +=
            sel("i-source", "Схема объектов", n.props.sourceSchema || "", [
              ["", "—"],
              ...state.model.schemas.map((s) => [s.id, s.name]),
            ]) +
            sel("i-slotview", "Вид карточек", n.props.view || "full", [
              ["full", "По шаблону"],
              ["compact", "Компактно"],
            ]) +
            `<button class="btn primary" id="i-fill">＋ Наполнить слот</button>`;
        if (n.kind === "text")
          html +=
            inp("i-static", "Статичный текст", n.props.static || "") +
            inp("i-size", "Размер текста", n.props.size || 14, "number");
        if (n.kind === "bar")
          html +=
            inp("i-max", "Максимум", n.props.max || 10, "number") +
            inp("i-color", "Цвет полосы", n.props.color || "#22D3EE", "color");
        if (n.kind === "image")
          html +=
            '<div class="insp-row"><label>Изображение с устройства</label><input type="file" id="i-image" accept="image/png,image/jpeg,image/webp,image/gif"></div>';
        if (n.kind === "ability")
          html += inp("i-desc", "Описание правила", n.props.desc || "");
        if (n.kind === "table")
          html +=
            inp(
              "i-fields",
              "Колонки через запятую",
              (n.props.fields || schema().fields.map((f) => f.name)).join(","),
            ) +
            sel("i-rows", "Строки", n.props.rowsFrom || "object", [
              ["object", "Предпросмотр объекта"],
              ["roster", "Объекты ростера"],
            ]);
        if (["modifier", "condition", "constraint"].includes(n.kind))
          html += `<button class="btn" id="i-wizard">Мастер ${esc(KINDS[n.kind].label)}</button>`;
        html +=
          inp(
            "i-condition",
            "Условие видимости",
            n.condition || "",
            "text",
            'placeholder="[Экипировано]"',
          ) +
          inp("i-notes", "Заметка", n.notes || "") +
          inp("i-font", "Размер шрифта", n.props.fontSize || 13, "number") +
          sel("i-align", "Выравнивание", n.props.align || "left", [
            ["left", "Влево"],
            ["center", "Центр"],
            ["right", "Вправо"],
          ]) +
          inp(
            "i-padding",
            "Внутренний отступ",
            n.props.padding ?? 8,
            "number",
          ) +
          sel("i-overflow", "Переполнение", n.props.overflow || "grow", [
            ["grow", "Расти"],
            ["clip", "Обрезать"],
            ["scroll", "Прокрутка"],
            ["shrinkText", "Уменьшить текст"],
          ]) +
          anchorInspector(n) +
          `<div class="insp-grid"><label class="check-row"><input id="i-lock" type="checkbox" ${n.locked ? "checked" : ""}> Блокировать</label><label class="check-row"><input id="i-hide" type="checkbox" ${n.hidden ? "checked" : ""}> Скрыть</label></div><div class="button-row"><button class="btn" id="i-auto-size">По содержимому</button><button class="btn" id="i-square">Квадрат</button><button class="btn" id="i-parent-width">Ширина родителя</button><button class="btn" id="i-front">Наверх</button><button class="btn" id="i-back">Вниз</button><button class="btn" id="i-dup">Дублировать</button><button class="btn danger" id="i-del">Удалить</button></div>`;
        body.innerHTML = html;
        const bind = (id, fn) => {
          const el = $(id);
          if (el)
            el.onchange = () => {
              const before=clone(state.model);
              try { fn(el.type === "checkbox" ? el.checked : el.value); snapshot("Правка свойства"); refresh(); }
              catch(err) { state.model=before;invalidate();renderInspector();toast(err.message,'err'); }
            };
        };
        bind("#i-label", (v) => {
          if (n.kind === "field") {
            renameFieldDialog(fieldOf(n), v);
          } else n.label = v;
        });
        ["x", "y", "w", "h"].forEach((k) =>
          bind("#i-" + k, (v) => {
            let a = +v;
            if (/^[+*/]/.test(v))
              a = Expr.run("=" + n.frame[k] + v, context(previewObject()));
            if (v.endsWith("%")) a = (n.frame[k] * parseFloat(v)) / 100;
            if (!Number.isFinite(a)) a = n.frame[k];
            n.frame[k] = ["w", "h"].includes(k)
              ? Math.max(KINDS[n.kind].min[k === "w" ? 0 : 1], a)
              : a;
          }),
        );
        bind("#i-bind", (v) => {
          n.bind = v || null;
          const f = schema().fields.find((f) => f.id === v);
          if (f) n.props.field = f.name;
          else delete n.props.field;
          sp.links = sp.links.filter(
            (l) => !(l.type === "data" && l.to.node === n.id),
          );
          const fn = sp.nodes.find(
            (x) => x.kind === "field" && x.props.fieldId === v,
          );
          if (fn) sp.links.push(link(fn, "out", n, "data-in", "data"));
        });
        bind("#i-layout", (v) => {
          if(v==='free' && n.props.savedPositions)n.props.savedPositions.forEach(p=>{const c=sp.nodes.find(x=>x.id===p.id);if(c){c.frame.x=p.x;c.frame.y=p.y;}});
          else n.props.savedPositions=sp.nodes.filter(c=>c.parent===n.id).map(c=>({id:c.id,x:c.frame.x,y:c.frame.y}));
          n.layoutMode=v;n.props.layoutMode=v;
        });
        bind("#i-cols", (v) => (n.props.cols = clamp(+v || 1, 1, 12)));
        bind("#i-gap", (v) => (n.props.gap = Math.max(0, +v || 0)));
        bind("#i-auto", (v) => (n.props.autoHeight = v));
        bind("#i-source", (v) => {
          n.props.sourceSchema = v;
          sp.links = sp.links.filter(
            (l) => !(l.type === "refers" && l.to.node === n.id),
          );
        });
        bind("#i-slotview", (v) => (n.props.view = v));
        [
          "static",
          "size",
          "max",
          "color",
          "desc",
          "fields",
          "rowsFrom",
          "condition",
          "notes",
          "fontSize",
          "align",
          "padding",
          "overflow",
        ].forEach((k) =>
          bind(
            "#i-" + ({ rowsFrom: "rows", fontSize: "font" }[k] || k),
            (v) => {
              if (k === "fields")
                n.props[k] = v
                  .split(",")
                  .map((x) => x.trim())
                  .filter(Boolean);
              else if (k === "condition") n.condition = v || null;
              else
                n.props[k] = ["size", "max", "fontSize", "padding"].includes(k)
                  ? +v
                  : v;
            },
          ),
        );
        ["left", "right", "top", "bottom"].forEach((side) =>
          bind("#i-anch-" + side, (v) => setAnchor(n, side, v, sp)),
        );
        bind("#i-anch-margin", (v) => {
          const m = Math.max(0, +v || 0);
          n.props.anchorMargin = { l: m, r: m, t: m, b: m };
          applyAnchors(sp);
        });
        bind("#i-lock", (v) => (n.locked = v));
        bind("#i-hide", (v) => (n.hidden = v));
        $("#i-field-edit")?.addEventListener("click", () => fieldWizard(n));
        $("#i-wizard")?.addEventListener("click", () => blockWizard(n));
        $("#i-fill")?.addEventListener("click", () => openPicker(n.id));
        $("#i-dup").onclick = duplicateSelected;
        $("#i-del").onclick = deleteSelected;
        $("#i-auto-size").onclick = () => {
          n.frame.h = Math.max(
            KINDS[n.kind].min[1],
            60 +
              sp.nodes
                .filter((c) => c.parent === n.id)
                .reduce((a, c) => a + c.frame.h, 0),
          );
          snapshot("Авторазмер");
          refresh();
        };
        $("#i-square").onclick = () => {
          n.frame.w = n.frame.h = Math.max(
            n.frame.w,
            n.frame.h,
            ...KINDS[n.kind].min,
          );
          snapshot("Квадрат");
          refresh();
        };
        $("#i-parent-width").onclick = () => {
          const p = sp.nodes.find((x) => x.id === n.parent);
          n.frame.w = (p?.frame.w || sp.canvas.w) - 16;
          n.frame.x = 8;
          snapshot("Ширина родителя");
          refresh();
        };
        $("#i-front").onclick = () => {
          n.z = Math.max(0, ...sp.nodes.map((n) => n.z || 0)) + 1;
          snapshot("Порядок");
          refresh();
        };
        $("#i-back").onclick = () => {
          n.z = Math.min(0, ...sp.nodes.map((n) => n.z || 0)) - 1;
          snapshot("Порядок");
          refresh();
        };
        $("#i-image")?.addEventListener("change", async (e) => {
          const f = e.target.files[0];
          if (!f) return;
          if (f.size > 4e6) {
            toast("Изображение должно быть меньше 4 МБ", "err");
            return;
          }
          n.props.src = await fileData(f);
          snapshot("Изображение");
          refresh();
        });
      }
      function renderPreview() {
        const s = schema(),
          o = previewObject();
        $("#rp-body").innerHTML = `<h4>Живой предпросмотр</h4>${sel(
          "pv-obj",
          "Объект",
          o?.id || "",
          objectsOfSchema().map((o) => [o.id, o.name]),
        )}<div id="preview-box">${renderSchemaCard(s, o)}</div><button class="btn primary" id="pv-create" style="margin-top:12px">＋ Создать объект по схеме</button>`;
        $("#pv-obj").onchange = (e) => {
          state.ui.previewObj = state.model.objects.find(
            (o) => o.id === e.target.value,
          );
          renderCanvas();
          renderPreview();
        };
        $("#pv-create").onclick = () => openObjectForm(s, null);
      }
      function renderSchemaCard(s, o) {
        return `<div class="object-preview"><h4>${esc(o?.name || "Нет объекта")}</h4>${
          s
            ? s.fields
                .filter((f) => !f.removed)
                .map(
                  (f) =>
                    `<div class="kv"><span>${esc(f.name)}</span><b data-preview-field="${esc(f.name)}">${esc(o ? displayValue(s, o, f.name) : "—")}</b></div>`,
                )
                .join("")
            : "<p>Создайте первую схему.</p>"
        }</div>`;
      }
      function bumpSchema(s, changes = []) {
        if (s !== schema()) return;
        s.version++;
        changes.forEach((c) => s.changelog.push({ ...c, version: s.version }));
      }
function fieldWizard(n){
 const f=fieldOf(n);if(!f)return;
 openModal('Мастер поля',inp('f-name','Имя поля',f.name)+sel('f-type','Тип',f.type,Object.entries(VALUE_TYPES))+inp('f-unit','Единица',f.unit||'')+inp('f-default','По умолчанию',f.default)+inp('f-formula','Формула',f.formula||'','text','placeholder="=[S]*[D]"')+inp('f-width','Ширина колонки',f.width||90,'number')+inp('f-min','Минимум',f.min??'')+inp('f-max','Максимум',f.max??'')+inp('f-round','Знаков после запятой',f.round??'')+'<p class="muted">Функции: SUM, MIN, MAX, AVG, ROUND, CEIL, FLOOR, ABS, IF, COUNT, CONCAT, SUM_SLOT, COUNT_SLOT, HAS_TAG. Кубы — среднее значение.</p>','<button class="btn" id="f-cancel">Отмена</button><button class="btn primary" id="f-save">Сохранить поле</button>');
 $('#f-cancel').onclick=()=>{closeModal();if(!schema().nodes.some(x=>x.id!==n.id))renderInspector();};
 $('#f-save').onclick=()=>{
  const v=Object.fromEntries(['name','type','unit','default','formula','width','min','max','round'].map(k=>[k,$('#f-'+k).value.trim()]));
  if(!v.name||schema().fields.some(x=>x.id!==f.id&&!x.removed&&x.name===v.name)){toast('Имя поля должно быть непустым и уникальным','err');return;}
  if(v.formula)try{Expr.parse(v.formula)}catch(e){toast(e.message,'err');return;}
  const apply=()=>{const old=f.name;Object.assign(f,v);['width','min','max','round'].forEach(k=>f[k]=v[k]===''?null:+v[k]);if(f.type==='calc'&&!f.formula)f.formula='=0';rewriteSchemaReferences(schema(),old,v.name,f.id);bumpSchema(schema(),[{op:'rename_field',fieldId:f.id,from:old,to:v.name},{op:'retype_field',fieldId:f.id,type:v.type}]);n.label=v.name;snapshot('Настройка поля');closeModal();refresh();};
  if(v.name!==f.name){closeModal();renameFieldDialog(f,v.name,apply);}else apply();
 };
}
      function rewriteField(src, oldName, newName) {
        return String(src || "").replace(/\[([^\]]+)\]/g, (m, n) =>
          n === oldName ? "[" + newName + "]" : m,
        );
      }
function renameFieldDialog(f,newName,apply){
 if(!f)return;if(!newName||schema().fields.some(x=>x.id!==f.id&&!x.removed&&x.name===newName)){toast('Имя занято или пусто','err');renderInspector();return;}
 const affected=expressionSources(schema()).filter(x=>Expr.refs(x.get()).includes(f.name));
 openModal('Переименование поля · предпросмотр',`<p><b>${esc(f.name)} → ${esc(newName)}</b></p><p>Объектов: ${objectsOfSchema().length}. Значения сохраняются по ID. Будет переписано выражений: ${affected.length}.</p>`+affected.map(x=>`<div class="diff"><b>${esc(x.label)}</b><del>${esc(x.get())}</del><ins>${esc(rewriteField(x.get(),f.name,newName))}</ins></div>`).join(''),'<button class="btn" id="rename-cancel">Отмена</button><button class="btn primary" id="rename-ok">Переименовать</button>');
 $('#rename-cancel').onclick=()=>{closeModal();renderInspector();};
 $('#rename-ok').onclick=()=>{closeModal();if(apply)apply();else{const old=f.name;f.name=newName;rewriteSchemaReferences(schema(),old,newName,f.id);bumpSchema(schema(),[{op:'rename_field',fieldId:f.id,from:old,to:newName}]);snapshot('Переименование поля');refresh();}};
}
      function addField() {
        dropKindCenter("field");
      }
      function blockWizard(n) {
        let body = "";
        if (n.kind === "modifier")
          body =
            sel("w-op", "Операция", n.props.operation || "add", [
              "set",
              "add",
              "sub",
              "mul",
              "div",
              "min",
              "max",
              "addTag",
              "removeTag",
            ]) +
            inp("w-value", "Значение / выражение", n.props.value || "1") +
            sel("w-layer", "Слой", n.props.layer || "add", schema().layers) +
            inp("w-condition", "Условие", n.props.condition || "") +
            inp("w-repeat", "Повторитель", n.props.repeatBy || 1, "number");
        if (n.kind === "condition")
          body =
            sel("w-mode", "Группа", n.props.mode || "AND", ["AND", "OR"]) +
            inp("w-expr", "Выражение", n.props.expr || "") +
            `<p class="muted">Вложенные условия соединяются линией «при условии». AND — все истинны; OR — хотя бы одно.</p><div class="field-suggestions">${schema()
              .fields.map(
                (f) =>
                  `<button class="chip" data-insert="${esc(f.name)}">${esc(f.name)}</button>`,
              )
              .join("")}</div>`;
        if (n.kind === "constraint")
          body =
            sel("w-rule", "Правило", n.props.rule || "max", [
              ["min", "Не менее"],
              ["max", "Не более"],
              ["exactly", "Ровно"],
              ["atLeastPer", "Не менее на N"],
              ["atMostPer", "Не более на N"],
              ["forbiddenWith", "Запрещено с"],
              ["requires", "Требует"],
            ]) +
            inp("w-value", "Число / тег", n.props.value ?? 2) +
            sel("w-scope", "Область", n.props.scope || "roster", [
              ["slot", "Слот"],
              ["section", "Секция"],
              ["roster", "Весь лист"],
            ]) +
            inp("w-filter", "Фильтр по тегу", n.props.filterTag || "") +
            inp("w-per", "На каждые N", n.props.per || 1, "number") +
            inp("w-message", "Сообщение", n.props.message || "");
        /* ОК-02: мастер визуального блока — подпись, привязка к полю (или создать поле), стиль. */
        if (VISUAL.includes(n.kind) && n.kind !== "slot") {
          const s = state.ui.module === "schema" ? schema() : state.model.schemas.find((x) => x.id === n.props.sourceSchema) || schema();
          const flds = (s?.fields || []).filter((f) => !f.removed);
          const needs = ["stat", "number", "bar", "tags", "ability", "table"].includes(n.kind);
          body =
            inp("w-label", "Подпись блока", n.label) +
            (n.kind === "text" ? inp("w-static", "Свой текст (если без привязки)", n.props.static || "") : "") +
            sel("w-bind", needs ? "Привязка к полю (обязательно)" : "Привязка к полю", n.props.field || "", [["", needs ? "— выберите поле —" : "— без привязки —"], ["__new", "＋ Создать поле…"], ...flds.map((f) => [f.name, f.name + " · " + VALUE_TYPES[f.type]])]) +
            (n.kind === "image" ? inp("w-src", "Файл изображения (data URL или путь)", n.props.src || "") : "") +
            inp("w-font", "Размер шрифта, px", n.props.fontSize || 13, "number") +
            sel("w-align", "Выравнивание", n.props.align || "left", [["left", "Слева"], ["center", "По центру"], ["right", "Справа"]]) +
            `<p class="muted">Привязка создаёт настоящую связь «данные»: линия на холсте и значение в предпросмотре. Esc — отмена без изменений.</p>`;
        }
        openModal(
          "Мастер · " + KINDS[n.kind].label,
          body,
          '<button class="btn" onclick="closeModal()">Отмена</button><button class="btn primary" id="w-save">Применить</button>',
        );
        $$("[data-insert]").forEach(
          (b) =>
            (b.onclick = () => ($("#w-expr").value += `[${b.dataset.insert}]`)),
        );
        $("#w-save").onclick = () => {
          [
            "op",
            "value",
            "layer",
            "condition",
            "repeat",
            "mode",
            "expr",
            "rule",
            "scope",
            "filter",
            "per",
            "message",
          ].forEach((k) => {
            const el = $("#w-" + k);
            if (el)
              n.props[
                { op: "operation", filter: "filterTag", repeat: "repeatBy" }[
                  k
                ] || k
              ] = el.value;
          });
          if (n.kind === "constraint")
            n.props.value = Number.isFinite(+n.props.value)
              ? +n.props.value
              : n.props.value;
          if (VISUAL.includes(n.kind) && n.kind !== "slot") {
            const lab = $("#w-label"); if (lab && lab.value.trim()) n.label = lab.value.trim();
            const st = $("#w-static"); if (st) n.props.static = st.value;
            const sr = $("#w-src"); if (sr) n.props.src = sr.value;
            const fo = $("#w-font"); if (fo) n.props.fontSize = clamp(+fo.value || 13, 11, 24);
            const al = $("#w-align"); if (al) n.props.align = al.value;
            const bd = $("#w-bind");
            if (bd) {
              const s = state.ui.module === "schema" ? schema() : state.model.schemas.find((x) => x.id === n.props.sourceSchema) || schema();
              if (bd.value === "__new") {
                const f = field("Поле" + (s.fields.filter((x) => !x.removed).length + 1));
                f.order = s.fields.length; s.fields.push(f);
                const fn = mkNode("field", n.frame.x - 220, n.frame.y); fn.space = "schema"; fn.props.fieldId = f.id; fn.bind = f.id; fn.label = f.name;
                if (state.ui.module === "schema") { schema().nodes.push(fn); connectNodes(fn, "data-out", n, "data-in"); }
                else { n.props.field = f.name; n.bind = f.id; }
                bumpSchema(s, [{ op: "add_field", fieldId: f.id, name: f.name }]);
              } else if (bd.value) {
                const f = s.fields.find((x) => x.name === bd.value && !x.removed);
                const src = state.ui.module === "schema" ? schema().nodes.find((x) => x.kind === "field" && x.props.fieldId === f?.id) : null;
                if (src && state.ui.module === "schema") connectNodes(src, "data-out", n, "data-in");
                else if (f) { n.props.field = f.name; n.bind = f.id; }
              } else { delete n.props.field; n.bind = null; }
            }
          }
          snapshot("Настройка " + KINDS[n.kind].label);
          closeModal();
          refresh();
        };
      }
      function slotWizard(n) {
        openModal(
          "Настройки слота",
          sel(
            "w-schema",
            "Схема",
            n.props.sourceSchema,
            state.model.schemas.map((s) => [s.id, s.name]),
          ) +
            sel("w-layout", "Раскладка", n.props.layoutMode || "grid", [
              ["grid", "Сетка"],
              ["flow", "Поток"],
              ["free", "Свободная"],
            ]) +
            inp("w-cols", "Колонок", n.props.cols || 1, "number") +
            inp("w-gap", "Зазор", n.props.gap || 8, "number") +
            `<label class="check-row"><input type="checkbox" id="w-auto" ${n.props.autoHeight ? "checked" : ""}> Автоматическая высота</label>`,
          '<button class="btn" onclick="closeModal()">Отмена</button><button class="btn primary" id="w-save">Применить</button>',
        );
        $("#w-save").onclick = () => {
          n.props.sourceSchema = $("#w-schema").value;
          n.props.layoutMode = $("#w-layout").value;
          n.layoutMode = n.props.layoutMode;
          n.props.cols = clamp(+$("#w-cols").value || 1, 1, 12);
          n.props.gap = +$("#w-gap").value || 0;
          n.props.autoHeight = $("#w-auto").checked;
          snapshot("Настройка слота");
          closeModal();
          refresh();
        };
      }
      /* Objects and spreadsheet. Raw values are keyed by field ID; formulas remain readable. */
      function parseInput(v, type) {
        if (type === "number") {
          if (dice(v)) return String(v).trim();
          if (v === "½") return 0.5;
          const n = Number(String(v).replace(",", "."));
          if (!Number.isFinite(n))
            throw Error("Введите число, ½ или запись кубов 2D6");
          return n;
        }
        if (type === "flag")
          return v === true || v === "true" || v === "Да" || v === "1";
        if (type === "tags")
          return Array.isArray(v)
            ? v
            : String(v || "")
                .split(",")
                .map((x) => x.trim())
                .filter(Boolean);
        return String(v ?? "");
      }
      function openObjectForm(s, obj) {
        const isNew = !obj;
        if (isNew)
          obj = {
            id: uid(),
            schema: s.id,
            schemaVersion: s.version,
            name: "Новый объект",
            values: Object.fromEntries(s.fields.map((f) => [f.id, f.default])),
            tags: [],
            folder: "",
            notes: "",
            deleted: false,
          };
        if (obj.schemaVersion < s.version) {
          migrateDialog(s, obj, () => openObjectForm(s, obj));
          return;
        }
        const draft = clone(obj);
        const body = `<div class="object-form-columns"><div>${inp("o-name", "Отображаемое имя", draft.name)}${s.fields
          .filter((f) => !f.removed)
          .map((f) => {
            const v = draft.values[f.id] ?? f.default;
            return f.type === "flag"
              ? `<label class="check-row"><input type="checkbox" data-of="${f.id}" data-type="flag" ${v === true || v === "true" ? "checked" : ""}> ${esc(f.name)}</label>`
              : f.type === "ref"
                ? sel("of-" + f.id, f.name, v, [
                    ["", "—"],
                    ...state.model.objects
                      .filter((o) => !o.deleted)
                      .map((o) => [o.id, o.name]),
                  ]).replace(
                    'id="of-',
                    'data-of="' + f.id + '" data-type="ref" id="of-',
                  )
                : inp(
                    "of-" + f.id,
                    f.name +
                      " · " +
                      VALUE_TYPES[f.type] +
                      (f.unit ? " (" + f.unit + ")" : ""),
                    Array.isArray(v) ? v.join(", ") : v,
                  ).replace(
                    'id="of-',
                    'data-of="' + f.id + '" data-type="' + f.type + '" id="of-',
                  );
          })
          .join(
            "",
          )}${inp("o-tags", "Теги объекта", draft.tags.join(", "))}${inp("o-folder", "Папка", draft.folder || "")}<div class="insp-row"><label>Заметка</label><textarea id="o-notes">${esc(draft.notes || "")}</textarea></div>${sel(
          "o-costmode",
          "Режим стоимости",
          draft.costMode || "model",
          [
            ["model", "За модель"],
            ["unit", "За юнит"],
            ["tiers", "Ступени"],
          ],
        )}${inp("o-tiers", "Ступени: количество:очки", draft.costTiers || "1:10,5:45")}</div><div><h4>Живой предпросмотр</h4><div id="o-preview">${renderSchemaCard(s, draft)}</div></div></div>`;
        openModal(
          (isNew ? "Новый объект · " : "Объект · ") + s.name,
          body,
          '<button class="btn" onclick="closeModal()">Отмена</button><button class="btn primary" id="o-save">Сохранить</button>',
        );
        const read = () => {
          draft.name = $("#o-name").value || "Без имени";
          draft.tags = $("#o-tags")
            .value.split(",")
            .map((x) => x.trim())
            .filter(Boolean);
          draft.folder = $("#o-folder").value;
          draft.notes = $("#o-notes").value;
          draft.costMode = $("#o-costmode").value;
          draft.costTiers = $("#o-tiers").value;
          $$("[data-of]").forEach((el) => {
            draft.values[el.dataset.of] = parseInput(
              el.type === "checkbox" ? el.checked : el.value,
              el.dataset.type,
            );
          });
        };
        const preview = () => {
          try {
            read();
            invalidate();
            $("#o-preview").innerHTML = renderSchemaCard(s, draft);
            $$("#o-preview [data-preview-field]").forEach(
              (el) =>
                (el.onclick = (e) =>
                  auditField(s, draft, el.dataset.previewField, e)),
            );
          } catch (e) {
            $("#o-preview").textContent = e.message;
          }
        };
        $("#modal").addEventListener("input", preview);
        preview();
        $("#o-save").onclick = () => {
          try {
            read();
            if (isNew) state.model.objects.push(draft);
            else Object.assign(obj, draft);
            state.ui.previewObj = draft;
            snapshot(isNew ? "Создание объекта" : "Правка объекта");
            closeModal();
            refresh();
            toast("Объект сохранён", "ok");
          } catch (e) {
            toast(e.message, "err");
          }
        };
      }
function migrateDialog(s,o,done){
 const changes=s.changelog.filter(c=>c.version>o.schemaVersion),missing=s.fields.filter(f=>!f.removed&&o.values[f.id]===undefined);
 openModal('Миграция объекта',`<p>${esc(o.name)} · версия ${o.schemaVersion} → ${s.version}. Затронут один объект.</p>`+changes.map(c=>`<div class="diff">${esc(c.op)} · ${esc(c.name||c.from||c.fieldId||'')} → ${esc(c.to||c.type||'')}</div>`).join('')+`<p>Новых значений по умолчанию: ${missing.length}. Данные удалённых полей сохраняются. Необратимых потерь нет.</p>`,'<button class="btn" id="migrate-cancel">Отмена</button><button class="btn primary" id="migrate-ok">Мигрировать</button>');
 $('#migrate-cancel').onclick=closeModal;
 $('#migrate-ok').onclick=()=>{s.fields.forEach(f=>{if(o.values[f.id]===undefined)o.values[f.id]=f.default;});o.schemaVersion=s.version;snapshot('Миграция объекта');closeModal();refresh();done?.();};
}
      function filteredObjects() {
        const q = state.ui.baseSearch.toLowerCase();
        let arr = objectsOfSchema().filter(
          (o) =>
            (!q ||
              [o.name, o.folder, o.notes, ...o.tags, ...Object.values(o.values)]
                .join(" ")
                .toLowerCase()
                .includes(q)) &&
            (!state.ui.baseTag || o.tags.includes(state.ui.baseTag)) &&
            (!state.ui.baseFolder || o.folder === state.ui.baseFolder) &&
            (!state.ui.baseFavorite || o.favorite),
        );
        if (state.ui.baseSort) {
          const [id, dir] = state.ui.baseSort.split(":");
          arr.sort((a, b) => {
            const x = id === "name" ? a.name : (a.values[id] ?? ""),
              y = id === "name" ? b.name : (b.values[id] ?? "");
            return (
              (typeof x === "number"
                ? x - y
                : String(x).localeCompare(String(y))) *
              (dir === "desc" ? -1 : 1)
            );
          });
        }
        return arr;
      }
      function renderBase() {
        if (state.ui.module !== "base") return;
        const tb = $("#grid-toolbar");
        tb.innerHTML = `<select id="base-schema-sel" aria-label="Схема">${state.model.schemas.map((s, i) => `<option value="${i}" ${i === state.ui.activeSchema ? "selected" : ""}>${esc(s.name)}</option>`).join("")}</select><button class="tb-btn" id="base-add">＋ Объект</button><button class="tb-btn" id="base-dup">⧉ Дублировать</button><button class="tb-btn" id="base-del">✕ В корзину</button><input id="base-search" placeholder="Поиск…" value="${esc(state.ui.baseSearch)}"><select id="base-tag"><option value="">Все теги</option>${[...new Set(objectsOfSchema().flatMap((o) => o.tags))].map((t) => `<option ${t === state.ui.baseTag ? "selected" : ""}>${esc(t)}</option>`).join("")}</select><button class="tb-btn ${state.ui.baseFavorite ? "on" : ""}" id="base-fav">★ Избранное</button><button class="tb-btn" id="base-bulk">Массовая правка</button><button class="tb-btn" id="base-view-toggle">${state.ui.baseView === "grid" ? "▦ Карточки" : "▤ Таблица"}</button>`;
        $("#base-schema-sel").onchange = (e) => switchSchema(+e.target.value);
        $("#base-search").oninput = (e) => {
          state.ui.baseSearch = e.target.value;
          renderBaseContent();
        };
        $("#base-tag").onchange = (e) => {
          state.ui.baseTag = e.target.value;
          renderBaseContent();
        };
        $("#base-add").onclick = () => openObjectForm(schema(), null);
        $("#base-dup").onclick = duplicateObjects;
        $("#base-del").onclick = deleteObjects;
        $("#base-fav").onclick = () => {
          state.ui.baseFavorite = !state.ui.baseFavorite;
          renderBase();
        };
        $("#base-bulk").onclick = bulkEditDialog;
        $("#base-view-toggle").onclick = () => {
          state.ui.baseView = state.ui.baseView === "grid" ? "cards" : "grid";
          renderBase();
        };
        renderBaseContent();
      }
      function renderBaseContent() {
        state.ui.gridFocus.r = clamp(
          state.ui.gridFocus.r,
          0,
          Math.max(0, filteredObjects().length - 1),
        );
        state.ui.gridFocus.c = clamp(
          state.ui.gridFocus.c,
          0,
          schema().fields.filter((f) => !f.removed).length,
        );
        if (state.ui.baseView === "grid") renderGrid();
        else renderCards();
        updateCellAddr();
      }
      function switchSchema(i) {
        state.ui.activeSchema = i;
        state.ui.previewObj = null;
        state.ui.selection.clear();
        state.ui.gridFocus = { r: 0, c: 0 };
        state.ui.gridSel.clear();
        state.ui.objectSel.clear();
        refresh();
      }
      function renderGrid() {
        const objs = filteredObjects(),
          fs = schema().fields.filter((f) => !f.removed),
          cols = [
            { id: "name", name: "Имя", type: "text" },
            ...fs,
            { id: "tags", name: "Теги", type: "tags" },
          ];
        $("#grid-scroll").classList.remove("hidden");
        $("#cards-view").classList.add("hidden");
        const focus = state.ui.gridFocus;
        let html =
          '<table class="grid"><thead><tr><th>№</th>' +
          cols
            .map(
              (f, c) =>
                `<th data-sort="${f.id}" style="width:${f.width || 100}px;min-width:${f.width || 100}px">${esc(f.name)} ↕<span class="col-resize" data-col="${c}"></span></th>`,
            )
            .join("") +
          "</tr></thead><tbody>";
        objs.forEach((o, r) => {
          html += `<tr data-row="${r}"><td class="rownum" draggable="true" data-reorder="${r}">${r + 1}</td>`;
          cols.forEach((f, c) => {
            const raw =
              f.id === "name"
                ? o.name
                : f.id === "tags"
                  ? o.tags
                  : o.values[f.id];
            const v =
              f.type === "calc" ? computeField(schema(), o, f.name).value : raw;
            const err = v?.err,
              range = inGridRange(r, c),
              sel = state.ui.gridSel.has(r + ":" + c);
            html += `<td tabindex="0" class="cell ${focus.r === r && focus.c === c ? "focused" : ""} ${range ? "in-range" : ""} ${err ? "err" : ""}" data-r="${r}" data-c="${c}" title="${esc(err || (Array.isArray(v) ? v.join(", ") : v))}">${esc(Array.isArray(v) ? v.join(", ") : typeof v === "boolean" ? (v ? "Да" : "Нет") : (v ?? ""))}${focus.r === r && focus.c === c ? '<span class="fill-handle" title="Тяните для заполнения"></span>' : ""}</td>`;
          });
          html += "</tr>";
        });
        html += "</tbody></table>";
        if (!objs.length)
          html +=
            '<div class="empty-state"><h4>Здесь будут объекты этой схемы</h4><p>Создайте первый объект или импортируйте таблицу.</p><button class="btn primary" onclick="openObjectForm(schema(),null)">＋ Создать объект</button></div>';
        $("#grid-scroll").innerHTML = html;
        $$("th[data-sort]").forEach(
          (th) =>
            (th.onclick = (e) => {
              if (e.target.classList.contains("col-resize")) return;
              const id = th.dataset.sort;
              state.ui.baseSort =
                id + ":" + (state.ui.baseSort === id + ":asc" ? "desc" : "asc");
              renderGrid();
            }),
        );
        $$(".col-resize").forEach((h) => {
          h.ondblclick = () => {
            fs[+h.dataset.col - 1] && (fs[+h.dataset.col - 1].width = 140);
            renderGrid();
          };
          h.onpointerdown = (e) => {
            e.stopPropagation();
            const f = cols[+h.dataset.col],
              start = e.clientX,
              w = f.width || 100;
            capturePointer(h, e.pointerId);
            h.onpointermove = (ev) => {
              const el = $(`th[data-sort="${f.id}"]`);
              el.style.width = el.style.minWidth =
                Math.max(60, w + ev.clientX - start) + "px";
            };
            const finishResize=(ev)=>{
              f.width=Math.max(60,w+(ev?.clientX??start)-start);
              h.onpointermove=h.onpointerup=h.onpointercancel=null;
              releasePointer(h,ev?.pointerId);
              snapshot("Ширина колонки");
            };
            h.onpointerup=finishResize;
            h.onpointercancel=finishResize;
          };
        });
        $$(".rownum").forEach(
          (td) =>
            (td.ondragstart = (e) =>
              e.dataTransfer.setData(
                "text/plain",
                "forge:row:" + td.dataset.reorder,
              )),
        );
        $$("tr[data-row]").forEach((tr) => {
          tr.ondragover = (e) => e.preventDefault();
          tr.ondrop = (e) => {
            const data = e.dataTransfer.getData("text/plain");
            if (!data.startsWith("forge:row:")) return;
            e.preventDefault();
            const from = +data.split(":")[2],
              to = +tr.dataset.row,
              arr = state.model.objects,
              o = arr.splice(arr.indexOf(objs[from]), 1)[0];
            arr.splice(arr.indexOf(objs[to]), 0, o);
            snapshot("Порядок строк");
            renderGrid();
          };
        });
        updateCellAddr();
      }
      function gridCols() {
        return [
          { id: "name", name: "Имя", type: "text" },
          ...schema().fields.filter((f) => !f.removed),
          { id: "tags", name: "Теги", type: "tags" },
        ];
      }
      function inGridRange(r, c) {
        const a = state.ui.gridAnchor || state.ui.gridFocus,
          b = state.ui.gridFocus;
        return (
          r >= Math.min(a.r, b.r) &&
          r <= Math.max(a.r, b.r) &&
          c >= Math.min(a.c, b.c) &&
          c <= Math.max(a.c, b.c)
        );
      }
      function gridCells() {
        const out = [],
          objs = filteredObjects(),
          cols = gridCols();
        for (let r = 0; r < objs.length; r++)
          for (let c = 0; c < cols.length; c++)
            if (inGridRange(r, c)) out.push({ o: objs[r], f: cols[c], r, c });
        return out;
      }
      function updateCellAddr() {
        const o = filteredObjects()[state.ui.gridFocus.r],
          f = gridCols()[state.ui.gridFocus.c];
        if (!o || !f) {
          $("#cell-addr").textContent = "—";
          $("#formula-input").value = "";
          return;
        }
        $("#cell-addr").textContent = state.ui.gridFocus.r + 1 + "·" + f.name;
        $("#formula-input").value =
          f.id === "name"
            ? o.name
            : f.id === "tags"
              ? o.tags.join(", ")
              : String(o.values[f.id] ?? f.default ?? "");
        highlightDependencies();
      }
      function highlightDependencies() {
        $$(".src-hl,.dep-hl").forEach((el) =>
          el.classList.remove("src-hl", "dep-hl"),
        );
        const o = filteredObjects()[state.ui.gridFocus.r],
          f = gridCols()[state.ui.gridFocus.c];
        if (!o || !f) return;
        const refs = Expr.refs(o.values[f.id] || f.formula || "");
        refs.forEach((n) => {
          const c = gridCols().findIndex((f) => f.name === n);
          if (c >= 0)
            $(
              `td[data-r="${state.ui.gridFocus.r}"][data-c="${c}"]`,
            )?.classList.add("src-hl");
        });
        schema().fields.forEach((x, c) => {
          if (Expr.refs(o.values[x.id] || x.formula || "").includes(f.name))
            $(
              `td[data-r="${state.ui.gridFocus.r}"][data-c="${c + 1}"]`,
            )?.classList.add("dep-hl");
        });
      }
      function setGridFocus(r, c, extend = false) {
        const objs = filteredObjects(),
          cols = gridCols();
        if (!objs.length) return;
        const focus={r:clamp(r,0,objs.length-1),c:clamp(c,0,cols.length-1)};
        if(!extend)state.ui.gridAnchor={...focus};
        else if(state.ui.gridAnchor)state.ui.gridAnchor={r:clamp(state.ui.gridAnchor.r,0,objs.length-1),c:clamp(state.ui.gridAnchor.c,0,cols.length-1)};
        state.ui.gridFocus=focus;
        state.ui.gridSel = new Set(gridCells().map((x) => x.r + ":" + x.c));
        renderGrid();
        $(
          `td[data-r="${state.ui.gridFocus.r}"][data-c="${state.ui.gridFocus.c}"]`,
        )?.scrollIntoView({ block: "nearest", inline: "nearest" });
      }
      let gridEdit = null,
        gridDrag = null;
      $("#grid-scroll").addEventListener("pointerdown", (e) => {
        const td = e.target.closest("td.cell");
        if (!td || e.target.tagName === "INPUT") return;
        const r = +td.dataset.r,
          c = +td.dataset.c;
        if (e.target.classList.contains("fill-handle")) {
          gridDrag = {
            type: "fill",
            r,
            c,
            anchor: { ...state.ui.gridFocus },
            startX: e.clientX,
            startY: e.clientY,
          };
          capturePointer($("#grid-scroll"), e.pointerId);
          e.preventDefault();
          return;
        }
        gridDrag = { type: "select", r, c };
        setGridFocus(r, c, e.shiftKey);
        //	td пересоздаётся в renderGrid — захватываем указатель на контейнере.
        capturePointer($("#grid-scroll"), e.pointerId);
      });
      $("#grid-scroll").addEventListener("pointermove", (e) => {
        if (!gridDrag) return;
        const td = document
          .elementFromPoint(e.clientX, e.clientY)
          ?.closest("td.cell");
        if (!td) return;
        const r = +td.dataset.r,
          c = +td.dataset.c;
        if (gridDrag.type === "select") setGridFocus(r, c, true);
        else {
          state.ui.gridFocus = { r, c };
          state.ui.gridAnchor = gridDrag.anchor;
          $$("td.cell").forEach((td) =>
            td.classList.toggle(
              "in-range",
              inGridRange(+td.dataset.r, +td.dataset.c),
            ),
          );
          const a=gridDrag.anchor,srcObj=filteredObjects()[a.r],srcCol=gridCols()[a.c];
          const raw=srcCol?.id==='name'?srcObj?.name:srcCol?.id==='tags'?srcObj?.tags:srcObj?.values[srcCol?.id];
          $$('td.cell').forEach(td=>{td.classList.remove('fill-preview');if(td!==document.elementFromPoint(e.clientX,e.clientY)?.closest('td.cell')&&inGridRange(+td.dataset.r,+td.dataset.c)&&!(+td.dataset.r===a.r&&+td.dataset.c===a.c)){td.classList.add('fill-preview');td.title='Будет заполнено: '+(Array.isArray(raw)?raw.join(', '):raw??'');}});
          setHint('Заполнить '+gridCells().length+' ячеек · источником будет R'+(a.r+1)+' · отпустите для применения');
        }
      });
      $("#grid-scroll").addEventListener("pointerup", (e) => {
        if (gridDrag?.type === "fill") {
          fillGrid();
        }
        releasePointer($("#grid-scroll"), e.pointerId);
        gridDrag = null;
      });
      $("#grid-scroll").addEventListener("pointercancel", (e) => {
        releasePointer($("#grid-scroll"), e.pointerId);
        gridDrag = null;
        renderGrid();
      });
      $("#grid-scroll").addEventListener("lostpointercapture", () => {
        if(gridDrag){gridDrag=null;renderGrid();}
      });
      $("#grid-scroll").addEventListener("dblclick", (e) => {
        const td = e.target.closest("td.cell");
        if (td) startEdit(td);
      });
      function startEdit(td, initial) {
        if (td.querySelector("input") || gridEdit) return;
        const r = +td.dataset.r,
          c = +td.dataset.c,
          o = filteredObjects()[r],
          f = gridCols()[c];
        if (!o) return;
        const before = $("#formula-input").value,
          input = document.createElement("input");
        input.value =
          initial ??
          (f.id === "name"
            ? o.name
            : f.id === "tags"
              ? o.tags.join(", ")
              : (o.values[f.id] ?? ""));
        td.textContent = "";
        td.appendChild(input);
        gridEdit = { r, c, commit: null };
        input.focus();
        if (initial === undefined) input.select();
        let done = false;
        const finish = (commit, dr = 0, dc = 0) => {
          if (done) return;
          done = true;
          gridEdit = null;
          if (commit) {
            const previous = f.id === "name" ? o.name : f.id === "tags" ? clone(o.tags) : o.values[f.id];
            try {
              setObjectValue(o, f, input.value);
              snapshot("Правка ячейки");
              invalidate();
              renderBase();
              renderCanvas();
              renderChar();
              validate();
            } catch (e) {
              if (f.id === "name") o.name = previous;
              else if (f.id === "tags") o.tags = previous;
              else if (previous === undefined) delete o.values[f.id];
              else o.values[f.id] = previous;
              invalidate(); toast("Значение не изменено: " + e.message, "err");
              renderGrid();
            }
          } else renderGrid();
          if (dr || dc) setGridFocus(r + dr, c + dc);
        };
        gridEdit.commit = finish;
        input.onkeydown = (e) => {
          e.stopPropagation();
          if (e.key === "Escape") finish(false);
          if (e.key === "Enter") {
            if(e.ctrlKey){done=true;gridEdit=null;try{setObjectValue(o,f,input.value);applyFormulaToRange(input.value);}catch(err){toast(err.message,'err');renderGrid();}}
            else finish(true,1,0);
          }
          if (e.key === "Tab") { finish(true, 0, e.shiftKey ? -1 : 1); e.preventDefault(); return; }
          if (e.key === "Escape" || e.key === "Enter") e.preventDefault();
        };
        input.onblur = () => finish(true);
      }
      function setObjectValue(o, f, v) {
        if (f.id === "name") o.name = String(v);
        else if (f.id === "tags") o.tags = parseInput(v, "tags");
        else o.values[f.id] = parseInput(v, f.type);
      }
      function moveFocus(dr, dc, extend = false) {
        const f = state.ui.gridFocus;
        setGridFocus(f.r + dr, f.c + dc, extend);
      }
      function transactObjects(label, change, message) {
        const before = clone(state.model.objects);
        try {
          const count = change();
          if (count) { snapshot(label); refresh(); toast(message || "Изменено ячеек: " + count, "ok"); }
          return count || 0;
        } catch (e) {
          state.model.objects = before; invalidate(); renderBase(); renderChar(); validate();
          toast("Изменения отменены целиком: " + e.message, "err");
          return 0;
        }
      }
      function copyTextFallback(text) {
        const area = document.createElement("textarea");
        area.value = text; area.style.cssText = "position:fixed;left:-9999px;top:0";
        document.body.appendChild(area); area.select();
        let ok = false; try { ok = document.execCommand("copy"); } catch {}
        area.remove(); return ok;
      }
      function applyFormulaToRange(v) {
        return transactObjects("Массовая правка диапазона", () => {
          const cells = gridCells();
          cells.forEach(({o,f}) => {
            if (f.type === "calc" && String(v).startsWith("=")) Expr.run(v, context(o));
            setObjectValue(o,f,v);
          });
          return cells.length;
        });
      }
function fillGrid(){
 return transactObjects("Заполнение диапазона", () => {
  const cells=gridCells(),a=gridDrag?.anchor||state.ui.gridAnchor||state.ui.gridFocus,o=filteredObjects()[a.r],f=gridCols()[a.c];if(!o||!f)return 0;
  const source=f.id==='name'?o.name:f.id==='tags'?o.tags:(o.values[f.id]??f.default??'');
  const vertical=Math.abs(state.ui.gridFocus.r-a.r)>=Math.abs(state.ui.gridFocus.c-a.c);let count=0;
  cells.forEach(({o,f,r,c})=>{if(r===a.r&&c===a.c)return;const val=String(source).startsWith('=')&&f.type!=='calc'&&!vertical?shiftFormula(source,c-a.c):clone(source);if(f.type==='calc'&&String(val).startsWith('='))Expr.run(val,context(o));setObjectValue(o,f,val);count++;});return count;
 });
}
      function shiftFormula(src, d) {
        const names = gridCols().map((f) => f.name);
        return src.replace(/\[([^\]]+)\]/g, (m, n) => {
          const i = names.indexOf(n);
          return i >= 0
            ? "[" + (names[clamp(i + d, 0, names.length - 1)] || n) + "]"
            : m;
        });
      }
      $("#formula-input").onkeydown = (e) => {
        if (e.key === "Enter") {
          const v = e.target.value;
          e.preventDefault();
          if (e.ctrlKey) applyFormulaToRange(v);
          else {
            const o = filteredObjects()[state.ui.gridFocus.r],
              f = gridCols()[state.ui.gridFocus.c];
            if (o && f) {
              try {
                setObjectValue(o, f, v);
                snapshot("Строка формул");
                refresh();
                moveFocus(1, 0);
              } catch (err) {
                toast(err.message, "err");
              }
            }
          }
        }
        if (e.key === "Escape") updateCellAddr();
        e.stopPropagation();
      };
      async function gridClipboard(e, cut = false) {
        const cells = gridCells();
        if (!cells.length) return;
        const rs = [...new Set(cells.map((c) => c.r))].sort((a, b) => a - b),
          cs = [...new Set(cells.map((c) => c.c))].sort((a, b) => a - b),
          text = rs
            .map((r) =>
              cs
                .map((c) => {
                  const x = cells.find((x) => x.r === r && x.c === c);
                  if (!x) return "";
                  const v =
                    x.f.id === "name"
                      ? x.o.name
                      : x.f.id === "tags"
                        ? x.o.tags
                        : x.o.values[x.f.id];
                  return Array.isArray(v) ? v.join(",") : (v ?? "");
                })
                .join("\t"),
            )
            .join("\n");
        try {
          await navigator.clipboard.writeText(text);
          if (cut) transactObjects("Вырезание ячеек",()=>{cells.forEach(({o,f})=>setObjectValue(o,f,""));return cells.length;});
          else toast("Скопировано как TSV", "ok");
        } catch {
          if(!cut && copyTextFallback(text)){toast("Скопировано как TSV","ok");return;}
          if(cut){toast("Копирование недоступно: исходные значения сохранены","err");return;}
          openModal(
            "Буфер обмена",
            '<textarea id="clip-text" style="width:100%;height:180px">' +
              esc(text) +
              "</textarea>",
          );
          $("#clip-text").select();
        }
      }
      async function pasteGrid() {
        let text = "";
        try {
          text = await navigator.clipboard.readText();
        } catch {
          openModal(
            "Вставить TSV",
            '<textarea id="paste-text" style="width:100%;height:160px" placeholder="Вставьте ячейки из Excel"></textarea>',
            '<button class="btn primary" id="paste-ok">Вставить</button>',
          );
          $("#paste-ok").onclick = () => {
            const v = $("#paste-text").value;
            closeModal();
            pasteGridText(v);
          };
          return;
        }
        pasteGridText(text);
      }
      function pasteGridText(text) {
        return transactObjects("Вставка TSV", () => {
          const normalized=String(text).replace(/\r/g,"").replace(/\n$/,"");
          if(!normalized)return 0;
          const rows=normalized.split("\n").map(r=>r.split("\t")),objs=filteredObjects(),cols=gridCols(),start={...state.ui.gridFocus};let count=0;
          rows.forEach((row,dr)=>row.forEach((v,dc)=>{const o=objs[start.r+dr],f=cols[start.c+dc];if(o&&f){if(f.type==="calc"&&v.startsWith("="))Expr.run(v,context(o));setObjectValue(o,f,v);count++;}}));
          return count;
        }, undefined);
      }
      function selectedObjects() {
        const ids = state.ui.objectSel.size
          ? state.ui.objectSel
          : new Set(gridCells().map((c) => c.o.id));
        return objectsOfSchema().filter((o) => ids.has(o.id));
      }
      function duplicateObjects() {
        const arr = selectedObjects();
        if (!arr.length) {
          toast("Выделите объекты или ячейки", "info");
          return;
        }
        arr.forEach((o) => {
          const c = clone(o);
          c.id = uid();
          c.name += " (копия)";
          state.model.objects.push(c);
        });
        snapshot("Дублирование объектов");
        refresh();
        toast("Создано копий: " + arr.length, "ok");
      }
      function deleteObjects() {
        const arr = selectedObjects();
        if (!arr.length) return;
        confirmDialog(
          "Переместить в корзину?",
          `${arr.length} объектов. Назначения в ростерах сохранятся и будут восстановлены вместе с объектами.`,
          () => {
            arr.forEach((o) => (o.deleted = true));
            state.ui.objectSel.clear();
            snapshot("Удаление объектов");
            refresh();
            toast("В корзине: " + arr.length, "err", undo);
          },
        );
      }
      function trashDialog() {
        const arr = state.model.objects.filter((o) => o.deleted);
        openModal(
          "Корзина",
          arr
            .map(
              (o) =>
                `<div class="pick-row"><b>${esc(o.name)}</b><button class="btn" data-trash="${o.id}">Восстановить</button></div>`,
            )
            .join("") || "<p>Корзина пуста.</p>",
        );
        $$("[data-trash]").forEach(
          (b) =>
            (b.onclick = () => {
              state.model.objects.find(
                (o) => o.id === b.dataset.trash,
              ).deleted = false;
              snapshot("Восстановление объекта");
              refresh();
              trashDialog();
            }),
        );
      }
      function bulkEditDialog() {
        const arr = selectedObjects();
        openModal(
          "Массовая правка · " + arr.length + " объектов",
          sel("bulk-field", "Поле", "name", [
            ["name", "Имя"],
            ["tags", "Теги"],
            ...schema().fields.map((f) => [f.id, f.name]),
          ]) +
            inp("bulk-value", "Новое значение", "") +
            sel("bulk-tag", "Действие с тегами", "add", [
              ["add", "Добавить тег"],
              ["remove", "Убрать тег"],
            ]),
          '<button class="btn" onclick="closeModal()">Отмена</button><button class="btn primary" id="bulk-ok">Применить</button>',
        );
        $("#bulk-ok").onclick = () => {
          const id=$("#bulk-field").value,v=$("#bulk-value").value,action=$("#bulk-tag").value;
          const f=id==="name"?{id:"name"}:id==="tags"?{id:"tags",type:"tags"}:schema().fields.find(f=>f.id===id);
          if(!f)return;
          const count=transactObjects("Массовая правка",()=>{
            arr.forEach(o=>{setObjectValue(o,f,v);if(id==="tags"){const tags=parseInput(v,"tags");o.tags=action==="add"?[...new Set([...o.tags,...tags])]:o.tags.filter(t=>!tags.includes(t));}});
            return arr.length;
          });
          if(count)closeModal();
        };
      }
      function renderCards() {
        const s = schema();
        $("#grid-scroll").classList.add("hidden");
        const view = $("#cards-view");
        view.classList.remove("hidden");
        view.innerHTML =
          filteredObjects()
            .map(
              (o) =>
                `<article class="obj-card" draggable="true" data-id="${o.id}"><div class="card-select"><input type="checkbox" data-select-object="${o.id}" ${state.ui.objectSel.has(o.id) ? "checked" : ""}><button class="mini-action" data-fav="${o.id}" title="Избранное">${o.favorite ? "★" : "☆"}</button></div><h5>${esc(o.name)}</h5>${renderSchemaCard(s, o)}<small>${esc(o.folder || "Без папки")}</small></article>`,
            )
            .join("") ||
          '<div class="empty-state"><h4>Нет объектов в этом виде</h4><button class="btn primary" onclick="openObjectForm(schema(),null)">＋ Создать объект</button></div>';
        $$("[data-select-object]").forEach(
          (el) =>
            (el.onchange = () => {
              el.checked
                ? state.ui.objectSel.add(el.dataset.selectObject)
                : state.ui.objectSel.delete(el.dataset.selectObject);
            }),
        );
        $$("[data-fav]").forEach(
          (b) =>
            (b.onclick = (e) => {
              e.stopPropagation();
              const o = state.model.objects.find((o) => o.id === b.dataset.fav);
              o.favorite = !o.favorite;
              snapshot("Избранное");
              renderCards();
            }),
        );
        $$(".obj-card").forEach((el) => {
          el.onclick = (e) => {
            if (e.target.closest("input,button")) return;
            openObjectForm(
              s,
              state.model.objects.find((o) => o.id === el.dataset.id),
            );
          };
          el.ondragstart = (e) =>
            e.dataTransfer.setData(
              "text/plain",
              "forge:object:" + el.dataset.id,
            );
          el.ondragover = (e) => e.preventDefault();
          el.ondrop = (e) => {
            const d = e.dataTransfer.getData("text/plain");
            if (d.startsWith("forge:folder:")) {
              const o = state.model.objects.find((o) => o.id === el.dataset.id);
              o.folder = d.slice(13);
              snapshot("Папка объекта");
              refresh();
            }
          };
        });
      }
      function saveViewDialog() {
        openModal(
          "Сохранить вид",
          inp("view-name", "Название", "Мой вид"),
          '<button class="btn primary" id="view-save">Сохранить</button>',
        );
        $("#view-save").onclick = () => {
          state.model.views.push({
            id: uid(),
            name: $("#view-name").value,
            filter: Object.fromEntries(
              [
                "baseSearch",
                "baseTag",
                "baseFolder",
                "baseFavorite",
                "baseSort",
              ].map((k) => [k, state.ui[k]]),
            ),
          });
          snapshot("Сохранённый вид");
          closeModal();
          renderPalette();
        };
      }
      /* Roster composition and live WYSIWYG sheet. */
      function addToSlot(slotId, objectId, count = 1) {
        const r = roster(),
          l = state.model.layouts.find((l) =>
            l.nodes.some((n) => n.id === slotId),
          ),
          n = l?.nodes.find((n) => n.id === slotId),
          o = state.model.objects.find((o) => o.id === objectId && !o.deleted);
        if (!n || !o || n.props.sourceSchema !== o.schema) {
          toast("Объект не соответствует схеме слота", "err");
          return;
        }
        r.assign[slotId] ||= [];
        const existing = r.assign[slotId].find((a) => a.objectId === objectId);
        if (existing) existing.count += count;
        else
          r.assign[slotId].push({
            id: uid(),
            objectId,
            count,
            alias: "",
            notes: "",
          });
        snapshot("Наполнение слота");
        refresh();
        toast("Добавлено: " + o.name, "ok");
      }
      function sheetHTML(
        r = roster(),
        l = state.model.layouts.find((l) => l.id === r.layout),
        interactive = true,
      ) {
        if (!l) return "<p>Нет компоновки</p>";
        const sp = clone(l);
        autoLayout(sp);
        const total = rosterTotal(r);
        let html = `<div class="sheet-canvas" style="width:${sp.canvas.w}px;height:${Math.max(sp.canvas.h, ...sp.nodes.map((n) => worldFrame(n, sp).y + n.frame.h + 40))}px"><div class="sheet-topline"><span>${esc(r.character.name)} · ${esc(r.character.role || "")}</span><b>${total} / ${r.limits.points} оч.</b></div>`;
        if (r.character.portrait)
          html += `<img class="sheet-portrait" src="${esc(safeImage(r.character.portrait))}" alt="Портрет">`;
        const draw = (n, obj = null, a = null) => {
          if (!visibleNode(n, sp, obj)) return;
          const el = buildNodeEl(n, sp, obj, true);
          el.style.left = worldFrame(n, sp).x + "px";
          el.style.top = worldFrame(n, sp).y + "px";
          if (n.kind === "slot") {
            const sc = state.model.schemas.find(
                (s) => s.id === n.props.sourceSchema,
              ),
              assigns = r.assign[n.id] || [],
              cols = clamp(+n.props.cols || 1, 1, 8),
              gap = n.props.gap || 8,
              pad = n.props.padding || 8,
              w = (n.frame.w - pad * 2 - gap * (cols - 1)) / cols;
            el.querySelector(".n-body").innerHTML =
              `<div class="slot-cards" style="grid-template-columns:repeat(${cols},minmax(0,1fr));gap:${gap}px">${
                assigns
                  .map((a, i) => {
                    const o = state.model.objects.find(
                      (o) => o.id === a.objectId && !o.deleted,
                    );
                    if (!o)
                      return `<div class="missing-object">Объект в корзине <button data-trash-restore="${a.objectId}">Восстановить</button></div>`;
                    return renderedSlotCard(sc, o, a, n, i, w, interactive);
                  })
                  .join("") ||
                '<div class="slot-empty">Пустой слот · нажмите ＋ Наполнить</div>'
              }</div>`;
            if (interactive) {
              const button = document.createElement("button");
              button.className = "btn slot-fill-button";
              button.textContent = "＋ Наполнить";
              button.onclick = () => openPicker(n.id);
              el.appendChild(button);
              el.ondragover = (e) => e.preventDefault();
              el.ondrop = (e) => {
                e.preventDefault();
                const d = e.dataTransfer.getData("text/plain");
                if (d.startsWith("forge:object:")) addToSlot(n.id, d.slice(13));
                if (d.startsWith("forge:assignment:")) {
                  const [, from, id] = d.split(":"),
                    entry = r.assign[from]?.find((a) => a.id === id);
                  if (entry && from !== n.id) {
                    const obj = state.model.objects.find(
                      (o) => o.id === entry.objectId,
                    );
                    if (obj.schema === n.props.sourceSchema) {
                      r.assign[from] = r.assign[from].filter(
                        (a) => a.id !== id,
                      );
                      r.assign[n.id] ||= [];
                      r.assign[n.id].push(entry);
                      snapshot("Перемещение между слотами");
                      refresh();
                    }
                  }
                }
              };
            }
          }
          html += el.outerHTML;
          sp.nodes
            .filter((c) => c.parent === n.id)
            .forEach((c) => draw(c, obj, a));
        };
        sp.nodes.filter((n) => !n.parent).forEach((n) => draw(n));
        html +=
          (r.character.notes
            ? `<div class="sheet-notes">${esc(r.character.notes)}</div>`
            : "") + "</div>";
        return html;
      }
      function renderedSlotCard(s, o, a, n, index, width, interactive) {
        const compact = n.props.view === "compact" || state.ui.compact;
        let content = "";
        if (compact) {
          content = s.fields
            .filter((f) => ["number", "calc"].includes(f.type))
            .slice(0, 6)
            .map(
              (f) =>
                `<span>${esc(f.name)} <b data-live-field="${esc(f.name)}" data-s="${s.id}" data-o="${o.id}">${esc(displayValue(s, o, f.name))}</b></span>`,
            )
            .join(" ");
        } else {
          const visual = s.nodes.filter(
            (x) => x.kind !== "field" && VISUAL.includes(x.kind),
          );
          if (visual.length) {
            const root = visual.filter(
                (x) => !x.parent || !visual.some((y) => y.id === x.parent),
              ),
              sx = Math.min(0, ...root.map((n) => n.frame.x)),
              sy = Math.min(0, ...root.map((n) => n.frame.y)),
              maxW = Math.max(...root.map((n) => n.frame.x + n.frame.w)) - sx,
              scale = Math.min(1, (width - 20) / Math.max(100, maxW));
            const card = document.createElement("div");
            card.className = "template-card";
            const draw = (nd) => {
              const el = buildNodeEl(nd, s, o, true);
              el.style.left = (nd.frame.x - sx) * scale + "px";
              el.style.top = (nd.frame.y - sy) * scale + "px";
              el.style.width = nd.frame.w * scale + "px";
              el.style.height = nd.frame.h + "px";
              card.appendChild(el);
              s.nodes
                .filter((c) => c.parent === nd.id)
                .forEach((c) => {
                  const ch = buildNodeEl(c, s, o, true);
                  ch.style.left = (nd.frame.x + c.frame.x - sx) * scale + "px";
                  ch.style.top = (nd.frame.y + c.frame.y - sy) * scale + "px";
                  ch.style.width = c.frame.w * scale + "px";
                  card.appendChild(ch);
                });
            };
            root.forEach(draw);
            card.style.height =
              Math.max(
                70,
                ...s.nodes
                  .filter(
                    (n) =>
                      ![
                        "field",
                        "modifier",
                        "condition",
                        "constraint",
                      ].includes(n.kind),
                  )
                  .map((n) => n.frame.y + n.frame.h - sy),
              ) + "px";
            content = card.outerHTML;
          } else content = renderSchemaCard(s, o);
        }
        return `<div class="roster-card ${compact ? "compact" : ""}" draggable="${interactive}" data-assignment="${a.id}" data-slot="${n.id}" data-index="${index}" data-object="${o.id}" data-schema="${s.id}"><div class="roster-card-head"><b>${esc(a.alias || o.name)}</b><span class="count-badge">×${a.count}</span>${interactive ? `<button data-act="edit" title="Имя и заметка экземпляра">✎</button><button data-act="dec" aria-label="Уменьшить количество">−</button><button data-act="inc" aria-label="Увеличить количество">＋</button><button data-act="rm" aria-label="Удалить">×</button>` : ""}</div><div class="roster-card-content">${content}</div><div class="roster-card-foot"><span>${esc(o.tags.join(" · "))}</span><b>${objectCost(o, a.count)} оч.</b></div>${a.notes ? `<p class="instance-note">${esc(a.notes)}</p>` : ""}</div>`;
      }
      function renderChar() {
        if (state.ui.module !== "char") return;
        const r = roster();
        $("#char-view").innerHTML =
          `<div class="sheet-scale" style="transform:scale(${state.ui.charZoom || 0.85});width:${(state.model.layouts.find((l) => l.id === r.layout)?.canvas.w || 900) * (state.ui.charZoom || 0.85)}px">${sheetHTML(r)}</div>`;
        $$(".roster-card").forEach((card) => {
          card.ondragstart = (e) =>
            e.dataTransfer.setData(
              "text/plain",
              "forge:assignment:" +
                card.dataset.slot +
                ":" +
                card.dataset.assignment,
            );
          card.ondblclick = (e) => {
            if (e.target.closest("button")) return;
            const o = state.model.objects.find(
                (o) => o.id === card.dataset.object,
              ),
              s = state.model.schemas.find((s) => s.id === card.dataset.schema);
            openObjectForm(s, o);
          };
          card.querySelectorAll("[data-act]").forEach(
            (b) =>
              (b.onclick = (e) => {
                e.stopPropagation();
                const a = r.assign[card.dataset.slot][+card.dataset.index],
                  act = b.dataset.act;
                if (act === "inc") a.count++;
                if (act === "dec") a.count = Math.max(1, a.count - 1);
                if (act === "rm") {
                  r.assign[card.dataset.slot].splice(+card.dataset.index, 1);
                  snapshot("Удаление из набора");
                  refresh();
                  toast("Объект убран из слота", "err", undo);
                  return;
                }
                if (act === "edit") {
                  assignmentDialog(a);
                  return;
                }
                snapshot("Количество экземпляров");
                refresh();
              }),
          );
        });
        $$("[data-trash-restore]").forEach(
          (b) =>
            (b.onclick = () => {
              const o = state.model.objects.find(
                (o) => o.id === b.dataset.trashRestore,
              );
              if (o) o.deleted = false;
              snapshot("Восстановление");
              refresh();
            }),
        );
        $$("[data-live-field]").forEach(
          (el) =>
            (el.onclick = (e) =>
              auditField(
                state.model.schemas.find((s) => s.id === el.dataset.s),
                state.model.objects.find((o) => o.id === el.dataset.o),
                el.dataset.liveField,
                e,
              )),
        );
      }
      function assignmentDialog(a) {
        const o = state.model.objects.find((o) => o.id === a.objectId);
        if(!o){toast("Объект больше не существует","err");return;}
        openModal(
          "Экземпляр · " + o.name,
          inp("a-alias", "Отображаемое имя", a.alias || o.name) +
            inp(
              "a-count",
              "Количество",
              a.count,
              "number",
              'min="1" max="1000"',
            ) +
            '<div class="insp-row"><label>Заметка экземпляра</label><textarea id="a-notes">' +
            esc(a.notes || "") +
            "</textarea></div>",
          '<button class="btn" onclick="closeModal()">Отмена</button><button class="btn primary" id="a-save">Сохранить</button>',
        );
        $("#a-save").onclick = () => {
          a.alias = $("#a-alias").value;
          a.count = clamp(+$("#a-count").value || 1, 1, 1000);
          a.notes = $("#a-notes").value;
          snapshot("Экземпляр объекта");
          closeModal();
          refresh();
        };
      }
      function openPicker(slotId) {
        const l = state.model.layouts.find((l) =>
            l.nodes.some((n) => n.id === slotId),
          ),
          slot = l?.nodes.find((n) => n.id === slotId),
          s = state.model.schemas.find((s) => s.id === slot.props.sourceSchema);
        if (!slot || !s) {
          toast(!slot ? "Слот больше не существует. Обновите лист." : "Сначала выберите схему слота", "err");
          return;
        }
        const objs = objectsOfSchema(s);
        openModal(
          "Наполнение · " + slot.label,
          inp("pick-search", "Поиск", "") +
            inp("pick-tag", "Фильтр по тегу", "") +
            inp(
              "pick-count",
              "Количество каждого",
              1,
              "number",
              'min="1" max="1000"',
            ) +
            `<div id="pick-list">${objs.map((o) => `<label class="pick-row" data-pick="${o.id}"><input type="checkbox" value="${o.id}"><b>${esc(o.name)}</b><span class="muted">${esc(o.tags.join(", "))}</span><span>${objectCost(o)} оч.</span></label>`).join("")}</div><div id="pick-preview"></div>`,
          '<button class="btn" onclick="closeModal()">Отмена</button><button class="btn primary" id="pick-ok">Добавить выбранные</button>',
        );
        const filter = () => {
          const q = $("#pick-search").value.toLowerCase(),
            tag = $("#pick-tag").value.toLowerCase();
          $$("[data-pick]").forEach((el) => {
            const o = objs.find((o) => o.id === el.dataset.pick);
            el.classList.toggle(
              "hidden",
              !o.name.toLowerCase().includes(q) ||
                !o.tags.join(" ").toLowerCase().includes(tag),
            );
          });
          const selected = $$("#pick-list input:checked").map((el) => el.value);
          $("#pick-preview").innerHTML = selected
            .map((id) =>
              renderSchemaCard(
                s,
                objs.find((o) => o.id === id),
              ),
            )
            .join("");
        };
        $("#pick-search").oninput = filter;
        $("#pick-tag").oninput = filter;
        $("#pick-list").onchange = filter;
        $("#pick-ok").onclick = () => {
          const ids = $$("#pick-list input:checked").map((el) => el.value),
            count = clamp(+$("#pick-count").value || 1, 1, 1000);
          if (!ids.length) {
            toast("Выберите хотя бы один объект", "info");
            return;
          }
          closeModal();
          ids.forEach((id) => addToSlot(slotId, id, count));
        };
      }
      function rosterTotal(r) {
        let total = 0;
        Object.values(r.assign).forEach((as) =>
          as.forEach((a) => {
            const o = state.model.objects.find(
              (o) => o.id === a.objectId && !o.deleted,
            );
            if (o) total += objectCost(o, a.count);
          }),
        );
        return total;
      }
      function rosterInspector() {
        const r = roster();
        $("#rp-body").innerHTML =
          "<h4>Персонаж / отряд</h4>" +
          inp("r-name", "Имя", r.character.name) +
          inp("r-role", "Роль / фракция", r.character.role || "") +
          inp("r-limit", "Лимит очков", r.limits.points, "number") +
          inp("r-folder", "Папка", r.folder || "") +
          '<div class="insp-row"><label>Заметки</label><textarea id="r-notes">' +
          esc(r.character.notes || "") +
          '</textarea></div><div class="insp-row"><label>Портрет</label><input id="r-portrait" type="file" accept="image/png,image/jpeg,image/webp"></div><div class="summary-box">' +
          rosterTotal(r) +
          " / " +
          r.limits.points +
          " оч.<br>" +
          Object.values(r.assign)
            .flat()
            .reduce((n, a) => n + a.count, 0) +
          ' объектов</div><button class="btn primary" id="r-export">Экспорт / печать</button><button class="btn danger" id="r-delete">Удалить ростер</button>';
        ["name", "role", "notes"].forEach(
          (k) =>
            ($("#r-" + k).onchange = (e) => {
              r.character[k] = e.target.value;
              if (k === "name") r.name = e.target.value;
              snapshot("Данные персонажа");
              refresh();
            }),
        );
        $("#r-limit").onchange = (e) => {
          r.limits.points = Math.max(0, +e.target.value || 0);
          snapshot("Лимит очков");
          refresh();
        };
        $("#r-folder").onchange = (e) => {
          r.folder = e.target.value;
          snapshot("Папка ростера");
          refresh();
        };
        $("#r-portrait").onchange = async (e) => {
          const f = e.target.files[0];
          if (f && f.size < 4e6) {
            r.character.portrait = await fileData(f);
            snapshot("Портрет");
            refresh();
          }
        };
        $("#r-export").onclick = exportDialog;
        $("#r-delete").onclick = () => {
          if (state.model.rosters.length < 2) {
            toast("Должен остаться хотя бы один ростер", "err");
            return;
          }
          confirmDialog("Удалить ростер?", r.name, () => {
            state.model.rosters.splice(state.ui.activeRoster, 1);
            fixIndices();
            snapshot("Удаление ростера");
            refresh();
          });
        };
      }
      function newRosterDialog() {
        openModal(
          "Новый персонаж / отряд",
          inp("new-r-name", "Имя", "Новый отряд") +
            sel(
              "new-r-layout",
              "Компоновка",
              layout().id,
              state.model.layouts.map((l) => [l.id, l.name]),
            ) +
            inp("new-r-points", "Лимит очков", 500, "number"),
          '<button class="btn" onclick="closeModal()">Отмена</button><button class="btn primary" id="new-r-save">Создать</button>',
        );
        $("#new-r-save").onclick = () => {
          state.model.rosters.push({
            id: uid(),
            name: $("#new-r-name").value,
            layout: $("#new-r-layout").value,
            character: { name: $("#new-r-name").value, role: "", notes: "" },
            limits: { points: +$("#new-r-points").value || 500 },
            assign: {},
          });
          state.ui.activeRoster = state.model.rosters.length - 1;
          snapshot("Новый ростер");
          closeModal();
          refresh();
        };
      }
      function originalValidate() {
        const errs = [];
        state.model.schemas.forEach((s) => {
          s.fields
            .filter((f) => !f.removed)
            .forEach((f) => {
              if (f.formula) {
                try {
                  const ast = Expr.parse(f.formula);
                  Expr.refs(f.formula).forEach((n) => {
                    if (
                      !fieldByName(s, n) &&
                      !n.startsWith("@") &&
                      !n.startsWith("#")
                    )
                      errs.push({
                        sev: "err",
                        msg: `${s.name} / ${f.name}: нет поля ${n}`,
                        src: s.name,
                        go: () => {
                          state.ui.activeSchema =
                            state.model.schemas.indexOf(s);
                          setModule("schema");
                        },
                      });
                  });
                } catch (e) {
                  errs.push({
                    sev: "err",
                    msg: `${f.name}: ${e.message}`,
                    src: s.name,
                  });
                }
              }
            });
          const sample = objectsOfSchema(s)[0];
          if (sample)
            s.fields
              .filter((f) => f.type === "calc")
              .forEach((f) => {
                const r = computeField(s, sample, f.name);
                if (r.value?.err)
                  errs.push({
                    sev: "err",
                    msg: s.name + " / " + f.name + ": " + r.value.err,
                    src: s.name,
                    go: () => {
                      state.ui.activeSchema = state.model.schemas.indexOf(s);
                      setModule("base");
                    },
                  });
              });
          s.links.forEach((l) => {
            if (
              !s.nodes.some((n) => n.id === l.from.node) ||
              !s.nodes.some((n) => n.id === l.to.node)
            )
              errs.push({ sev: "err", msg: "Висячая связь", src: s.name });
          });
          s.nodes
            .filter(
              (n) =>
                VISUAL.includes(n.kind) &&
                ["stat", "number", "bar", "tags"].includes(n.kind) &&
                !n.bind &&
                !n.props.field,
            )
            .forEach((n) =>
              errs.push({
                sev: "warn",
                msg: "Без данных: " + n.label,
                src: s.name,
                go: () => focusNode(n.id),
              }),
            );
        });
        state.model.rosters.forEach((r) => {
          const total = rosterTotal(r),
            lay = state.model.layouts.find((l) => l.id === r.layout);
          if (total > r.limits.points)
            errs.push({
              sev: "err",
              msg: `${r.name}: ${total} > ${r.limits.points} оч.`,
              src: r.name,
              go: () => {
                state.ui.activeRoster = state.model.rosters.indexOf(r);
                setModule("char");
              },
              fix: () => {
                r.limits.points = total;
                snapshot("Исправление лимита");
                refresh();
              },
            });
          if (!lay) return;
          const all = lay.nodes
            .filter((n) => n.kind === "slot")
            .flatMap((slot) =>
              (r.assign[slot.id] || []).map((a) => ({
                ...a,
                slot,
                object: state.model.objects.find(
                  (o) => o.id === a.objectId && !o.deleted,
                ),
              })),
            );
          all
            .filter((a) => !a.object)
            .forEach((a) =>
              errs.push({
                sev: "warn",
                msg: "Объект в корзине или отсутствует",
                src: r.name,
              }),
            );
          lay.nodes
            .filter((n) => n.kind === "slot")
            .forEach((slot) => {
              if (!slot.props.sourceSchema)
                errs.push({
                  sev: "warn",
                  msg: "Слот без схемы: " + slot.label,
                  src: lay.name,
                  go: () => focusNode(slot.id, "layout"),
                });
            });
          state.model.schemas.forEach((s) =>
            s.nodes
              .filter((n) => n.kind === "constraint")
              .forEach((c) => {
                const p = c.props,
                  targets = all.filter(
                    (a) =>
                      a.object?.schema === s.id &&
                      (!p.filterTag || a.object.tags.includes(p.filterTag)),
                  ),
                  scope =
                    p.scope === "slot"
                      ? targets.filter((a) => {
                          const slot = a.slot;
                          return state.ui.lastConstraintSlot
                            ? slot.id === state.ui.lastConstraintSlot
                            : true;
                        })
                      : targets,
                  n = scope.reduce((a, b) => a + b.count, 0),
                  rule = p.rule,
                  value = +p.value;
                let bad = false;
                if (["min", "max", "exactly"].includes(rule))
                  bad =
                    rule === "min"
                      ? n < value
                      : rule === "max"
                        ? n > value
                        : n !== value;
                if (["atLeastPer", "atMostPer"].includes(rule)) {
                  const per = Math.max(1, +p.per || 1),
                    units = Math.max(
                      1,
                      Math.ceil(all.reduce((a, b) => a + b.count, 0) / per),
                    );
                  bad =
                    rule === "atLeastPer"
                      ? n < value * units
                      : n > value * units;
                }
                if (rule === "requires")
                  bad =
                    n > 0 &&
                    !all.some((a) => a.object.tags.includes(String(p.value)));
                if (rule === "forbiddenWith")
                  bad =
                    n > 0 &&
                    all.some((a) => a.object.tags.includes(String(p.value)));
                if (bad)
                  errs.push({
                    sev: "err",
                    msg: `${r.name}: ${p.message || c.label + " · " + rule + " " + p.value} (сейчас ${n})`,
                    src: c.label,
                    go: () => {
                      state.ui.activeRoster = state.model.rosters.indexOf(r);
                      setModule("char");
                    },
                  });
              }),
          );
        });
        const badge = $("#err-badge");
        badge.className =
          "err-badge " + (errs.some((e) => e.sev === "err") ? "bad" : "ok");
        badge.textContent = (errs.length ? "⚠ " : "✓ ") + errs.length;
        badge.title = errs.length + " ошибок и предупреждений";
        $("#val-list").innerHTML =
          errs
            .map(
              (e, i) =>
                `<div class="val-item ${e.sev}">${esc(e.msg)}<small>${esc(e.src)}</small><div class="button-row">${e.go ? `<button class="mini-action" data-val-go="${i}">Перейти →</button>` : ""}${e.fix ? `<button class="mini-action" data-val-fix="${i}">Исправить</button>` : ""}</div></div>`,
            )
            .join("") ||
          '<div class="empty-state">✓ Ошибок нет. Ростер валиден.</div>';
        $$("[data-val-go]").forEach(
          (b) => (b.onclick = () => errs[+b.dataset.valGo].go?.()),
        );
        $$("[data-val-fix]").forEach(
          (b) => (b.onclick = () => errs[+b.dataset.valFix].fix?.()),
        );
        return errs;
      }
      function validateSchema() {
        return validate().filter((e) => e.src === schema().name);
      }
      /* Navigation, schema/layout commands and persistent view controls. */
      function setModule(mod) {
        gridEdit?.commit?.(true);
        if (gesture) finishGesture({}, true);
        state.ui.views[state.ui.module] = clone(state.ui.view);
        state.ui.module = mod;
        state.ui.view = state.ui.views[mod]
          ? clone(state.ui.views[mod])
          : { x: 30, y: 30, zoom: 1 };
        state.ui.selection.clear();
        state.ui.selLink = null;
        $$(".modtab").forEach((t) => {
          t.classList.toggle("active", t.dataset.mod === mod);
          t.setAttribute("aria-selected", String(t.dataset.mod === mod));
        });
        $("#canvas-wrap").classList.toggle(
          "hidden",
          !["schema", "layout"].includes(mod),
        );
        $("#base-view").classList.toggle("hidden", mod !== "base");
        $("#char-view").classList.toggle("hidden", mod !== "char");
        $("#rightpanel").classList.remove("mobile-open");
        state.ui.rpTab = mod === "char" ? "insp" : state.ui.rpTab;
        buildToolbar();
        renderPalette();
        renderCanvas();
        renderBase();
        renderChar();
        renderInspector();
        renderCrumbs();
        setHintFor(mod);
        validate();
      }
      function setHint(t) {
        $("#status-hint").textContent = t;
        $("#status-hint").title = t;
      }
      function setHintFor(m) {
        setHint(
          {
            schema:
              "СХЕМЫ · Поля → связи → живой предпросмотр. Тяните от порта; Esc отменяет жест.",
            base: "БАЗА · Enter/F2 — правка; Shift — диапазон; Ctrl+Enter — заполнить выделенное.",
            layout:
              "ЛИСТ · Размещайте блоки мышью. Объекты из палитры можно перетащить в слот.",
            char: "ПЕРСОНАЖ · ＋ наполняет слот; ± меняет количество; двойной клик открывает объект.",
          }[m],
        );
      }
      function renderCrumbs() {
        const mod = {
            schema: "Схемы",
            base: "База",
            layout: "Лист",
            char: "Персонаж",
          }[state.ui.module],
          extra =
            state.ui.module === "schema" || state.ui.module === "base"
              ? schema().name
              : state.ui.module === "layout"
                ? layout().name
                : roster().name;
        $("#crumbs").innerHTML =
          `<button data-nav="schema">Имперская Кузня</button><span class="sep">/</span><button data-nav="${state.ui.module}">${mod}</button><span class="sep">/</span><span title="${esc(extra)}">${esc(extra)}</span>`;
        $$("[data-nav]").forEach(
          (b) => (b.onclick = () => setModule(b.dataset.nav)),
        );
      }
      function buildToolbar() {
        const tb = $("#toolbar"),
          mod = state.ui.module;
        let html = "";
        const btn = (id, t, title = "") =>
          `<button class="tb-btn" id="${id}" title="${esc(title || t)}">${t}</button>`;
        if (["schema", "layout"].includes(mod)) {
          if (mod === "schema")
            html += `<div class="grp"><label>Схема</label><select id="tb-schema">${state.model.schemas.map((s, i) => `<option value="${i}" ${i === state.ui.activeSchema ? "selected" : ""}>${esc(s.name)} · v${s.version}</option>`).join("")}</select>${btn("tb-newschema", "＋", "Новая схема")}${btn("tb-dupschema", "⧉", "Дублировать схему")}${btn("tb-delschema", "✕", "Удалить схему")}${btn("tb-schema-settings", "⚙", "Настройки холста")}</div><div class="grp">${btn("tb-check", "✓ Проверить")}${btn("tb-newobj", "＋ Объект")}${btn("tb-design", "Дизайн")}${btn("tb-result", "Результат")}</div>`;
          else
            html += `<div class="grp"><label>Лист</label><select id="tb-layout">${state.model.layouts.map((l, i) => `<option value="${i}" ${i === state.ui.activeLayout ? "selected" : ""}>${esc(l.name)}</option>`).join("")}</select>${btn("tb-newlayout", "＋ Лист")}${btn("tb-duplayout", "⧉")}${btn("tb-dellayout", "✕")}${btn("tb-layout-settings", "⚙ Холст")}</div><div class="grp">${btn("tb-col", "↓ В столбик")}${btn("tb-pack", "▣ Уплотнить")}${btn("tb-snap-grid", "▦ К сетке")}${btn("tb-autoflow", "Автопоток")}</div>`;
          html += `<div class="grp">${btn("tb-undo", "↶", "Ctrl+Z")}${btn("tb-redo", "↷", "Ctrl+Shift+Z")}${btn("tb-search", "⌕ Поиск", "Ctrl+F")}${btn("tb-layers", "▤ Слои")}${btn("tb-graph", "⌘ Граф")}${btn("tb-align", "⇔ Выровнять")}${btn("tb-group", "▣ Группа", "Ctrl+G")}${btn("tb-links", "Связи: все")}${btn("tb-inspector", "Инспектор")}</div>`;
        } else if (mod === "base")
          html = `<div class="grp">${btn("base-trash", "Корзина")}${btn("base-import", "Импорт CSV / XLSX")}${btn("base-export", "Экспорт объектов")}${btn("base-help", "Клавиши грида")}</div>`;
        else
          html = `<div class="grp"><label>Персонаж</label><select id="tb-roster">${state.model.rosters.map((r, i) => `<option value="${i}" ${i === state.ui.activeRoster ? "selected" : ""}>${esc(r.name)}</option>`).join("")}</select><label>Лист</label><select id="tb-charlayout">${state.model.layouts.map((l) => `<option value="${l.id}" ${l.id === roster().layout ? "selected" : ""}>${esc(l.name)}</option>`).join("")}</select>${btn("tb-rules", "Правила: вкл")}${btn("tb-compact", "Компактно")}${btn("tb-char-minus", "−")}${btn("tb-char-plus", "＋")}${btn("tb-export", "Экспорт / PDF")}${btn("tb-inspector", "Данные")}</div>`;
        tb.innerHTML = html;
        const on = (id, fn) => {
          const el = $("#" + id);
          if (el) el.onclick = fn;
        };
        on("tb-schema", () => {});
        if ($("#tb-schema"))
          $("#tb-schema").onchange = (e) => switchSchema(+e.target.value);
        if ($("#tb-layout"))
          $("#tb-layout").onchange = (e) => {
            state.ui.activeLayout = +e.target.value;
            refresh();
          };
        if ($("#tb-roster"))
          $("#tb-roster").onchange = (e) => {
            state.ui.activeRoster = +e.target.value;
            refresh();
          };
        if ($("#tb-charlayout"))
          $("#tb-charlayout").onchange = (e) => {
            roster().layout = e.target.value;
            snapshot("Компоновка персонажа");
            refresh();
          };
        on("tb-newschema", newSchemaDialog);
        on("tb-dupschema", () => {
          const s = clone(schema());
          s.id = uid();
          s.name += " (копия)";
          state.model.schemas.push(s);
          state.ui.activeSchema = state.model.schemas.length - 1;
          snapshot("Дублирование схемы");
          refresh();
        });
        on("tb-delschema", () => {
          if (state.model.schemas.length < 2) {
            toast("Нельзя удалить последнюю схему", "err");
            return;
          }
          confirmDialog(
            "Удалить схему?",
            schema().name + " и все её объекты, связи и назначения.",
            () => {
              const id = schema().id;
              state.model.schemas.splice(state.ui.activeSchema, 1);
              state.model.objects = state.model.objects.filter(
                (o) => o.schema !== id,
              );
              state.model.layouts.forEach((l) =>
                l.nodes
                  .filter((n) => n.props.sourceSchema === id)
                  .forEach((n) => (n.props.sourceSchema = null)),
              );
              fixIndices();
              snapshot("Удаление схемы");
              refresh();
              toast("Схема удалена", "err", undo);
            },
          );
        });
        on("tb-schema-settings", canvasSettings);
        on("tb-layout-settings", canvasSettings);
        on("tb-check", () => {
          validate();
          $("#drawer-val").classList.add("open");
        });
        on("tb-newobj", () => openObjectForm(schema(), null));
        on("tb-design", () => {
          state.ui.resultMode = false;
          renderCanvas();
          toast("Режим дизайна", "info");
        });
        on("tb-result", () => {
          state.ui.resultMode = true;
          renderCanvas();
          toast("Предпросмотр на реальном объекте", "info");
        });
        on("tb-newlayout", newLayoutDialog);
        on("tb-duplayout", () => {
          const l = clone(layout());
          l.id = uid();
          l.name += " (копия)";
          state.model.layouts.push(l);
          state.ui.activeLayout = state.model.layouts.length - 1;
          snapshot("Дублирование компоновки");
          refresh();
        });
        on("tb-dellayout", () => {
          if (state.model.layouts.length < 2) {
            toast("Нельзя удалить последнюю компоновку", "err");
            return;
          }
          confirmDialog("Удалить компоновку?", layout().name, () => {
            state.model.layouts.splice(state.ui.activeLayout, 1);
            fixIndices();
            state.model.rosters.forEach((r) => {
              if (!state.model.layouts.some((l) => l.id === r.layout))
                r.layout = layout().id;
            });
            snapshot("Удаление компоновки");
            refresh();
          });
        });
        on("tb-col", () => {
          let y = 20;
          layout()
            .nodes.filter((n) => !n.parent)
            .sort((a, b) => a.frame.y - b.frame.y)
            .forEach((n) => {
              n.frame.x = 30;
              n.frame.y = y;
              y += n.frame.h + 16;
            });
          snapshot("В столбик");
          refresh();
        });
        on("tb-pack", () => {
          state.ui.autoflow = true;
          autoLayout(layout());
          snapshot("Уплотнение");
          refresh();
          syncControls();
        });
        on("tb-snap-grid", () => {
          spaceRef().nodes.forEach((n) => {
            n.frame.x =
              Math.round(n.frame.x / state.ui.gridStep) * state.ui.gridStep;
            n.frame.y =
              Math.round(n.frame.y / state.ui.gridStep) * state.ui.gridStep;
          });
          snapshot("Привязка к сетке");
          refresh();
        });
        on("tb-autoflow", () => {
          state.ui.autoflow = !state.ui.autoflow;
          refresh();
          syncControls();
        });
        on("tb-undo", undo);
        on("tb-redo", redo);
        on("tb-search", searchDialog);
        on("tb-layers", layersDialog);
        on("tb-graph", graphDialog);
        on("tb-align", () => {
          const b = $("#tb-align").getBoundingClientRect();
          showCtx(b.left, b.bottom, [
            ...[
              "left",
              "right",
              "top",
              "bottom",
              "centerX",
              "centerY",
              "distX",
              "distY",
              "sameW",
              "sameH",
              "sameSize",
            ].map((k) => ({
              label: {
                left: "По левому краю",
                right: "По правому краю",
                top: "По верхнему краю",
                bottom: "По нижнему краю",
                centerX: "Центр по X",
                centerY: "Центр по Y",
                distX: "Распределить по X",
                distY: "Распределить по Y",
                sameW: "Одинаковая ширина",
                sameH: "Одинаковая высота",
                sameSize: "Одинаковый размер",
              }[k],
              fn: () => alignSelected(k),
            })),
          ]);
        });
        on("tb-group", groupSelected);
        on("tb-links", () => {
          const modes = ["all", "data", "modifiers", "selected"];
          state.ui.linkFilter =
            modes[(modes.indexOf(state.ui.linkFilter) + 1) % modes.length];
          $("#tb-links").textContent =
            "Связи: " +
            {
              all: "все",
              data: "данные",
              modifiers: "модификаторы",
              selected: "выделенное",
            }[state.ui.linkFilter];
          renderCanvas();
        });
        on("tb-inspector", () => {
          $("#rightpanel").classList.toggle("mobile-open");
          state.ui.rpTab = "insp";
          renderInspector();
        });
        on("base-trash", trashDialog);
        on("base-import", importTableDialog);
        on("base-export", exportDialog);
        on("base-help", () => helpDialog("grid"));
        on("tb-rules", () => {
          state.ui.showRules = !state.ui.showRules;
          $("#tb-rules").textContent =
            "Правила: " + (state.ui.showRules ? "вкл" : "выкл");
          renderChar();
        });
        on("tb-compact", () => {
          state.ui.compact = !state.ui.compact;
          $("#tb-compact").classList.toggle("on", state.ui.compact);
          renderChar();
        });
        on("tb-char-minus", () => {
          state.ui.charZoom = clamp(
            (state.ui.charZoom || 0.85) - 0.1,
            0.3,
            1.5,
          );
          renderChar();
        });
        on("tb-char-plus", () => {
          state.ui.charZoom = clamp(
            (state.ui.charZoom || 0.85) + 0.1,
            0.3,
            1.5,
          );
          renderChar();
        });
        on("tb-export", exportDialog);
        $("#tb-undo")?.toggleAttribute("disabled", histIdx <= 0);
        $("#tb-redo")?.toggleAttribute(
          "disabled",
          histIdx >= history.length - 1,
        );
      }
      function newSchemaDialog() {
        openModal(
          "Новая схема",
          inp("ns-name", "Название", "Новая схема") +
            sel("ns-preset", "Заготовка", "empty", [
              ["empty", "Пустая"],
              ["card", "Карточка"],
              ["stats", "Линейка характеристик"],
              ["table", "Таблица профилей"],
              ["slot", "Слот-лист"],
            ]) +
            inp("ns-w", "Ширина холста", 1200, "number") +
            inp("ns-h", "Высота холста", 800, "number") +
            '<p class="muted">Каждая заготовка содержит реальные поля, блоки и связи.</p>',
          '<button class="btn" onclick="closeModal()">Отмена</button><button class="btn primary" id="ns-create">Создать</button>',
        );
        $("#ns-create").onclick = () => {
          const name = $("#ns-name").value.trim();
          if (!name) return;
          const s = mkSchema(name, $("#ns-preset").value);
          s.canvas = {
            w: clamp(+$("#ns-w").value || 1200, 300, 10000),
            h: clamp(+$("#ns-h").value || 800, 300, 10000),
          };
          state.model.schemas.push(s);
          state.ui.activeSchema = state.model.schemas.length - 1;
          snapshot("Новая схема");
          closeModal();
          setModule("schema");
          fitAll();
        };
      }
      function newLayoutDialog() {
        openModal(
          "Новая компоновка",
          inp("nl-name", "Название", "Новый лист") +
            sel("nl-preset", "Вид", "compact", [
              ["compact", "Компактный"],
              ["full", "Подробный"],
              ["print", "Печатный"],
            ]),
          '<button class="btn" onclick="closeModal()">Отмена</button><button class="btn primary" id="nl-create">Создать</button>',
        );
        $("#nl-create").onclick = () => {
          const mode = $("#nl-preset").value,
            l = mkLayout(
              $("#nl-name").value,
              schema().id,
              state.model.schemas.find((s) => s.name === "Характеристики")?.id,
              mode === "compact" ? 0 : 1,
            );
          if (mode === "compact")
            l.nodes
              .filter((n) => n.kind === "slot")
              .forEach((n) => {
                n.props.view = "compact";
                n.props.cols = 2;
              });
          state.model.layouts.push(l);
          state.ui.activeLayout = state.model.layouts.length - 1;
          snapshot("Новая компоновка");
          closeModal();
          refresh();
          fitAll();
        };
      }
      function canvasSettings() {
        const sp = spaceRef();
        openModal(
          "Настройки холста",
          inp("cs-w", "Ширина", sp.canvas.w, "number") +
            inp("cs-h", "Высота", sp.canvas.h, "number") +
            inp(
              "cs-grid",
              "Шаг сетки",
              state.ui.gridStep,
              "number",
              'min="4" max="64"',
            ) +
            sel("cs-format", "Формат страницы", sp.pageFormat || "A4", [
              "A4",
              "Letter",
              "Custom",
            ]) +
            `<label class="check-row"><input type="checkbox" id="cs-mini" ${state.ui.minimap ? "checked" : ""}> Мини-карта</label>`,
          '<button class="btn" onclick="closeModal()">Отмена</button><button class="btn primary" id="cs-save">Применить</button>',
        );
        $("#cs-save").onclick = () => {
          sp.canvas = {
            w: clamp(+$("#cs-w").value || 1200, 300, 20000),
            h: clamp(+$("#cs-h").value || 1400, 300, 20000),
          };
          sp.pageFormat = $("#cs-format").value;
          state.ui.gridStep = clamp(+$("#cs-grid").value || 16, 4, 64);
          state.ui.minimap = $("#cs-mini").checked;
          snapshot("Настройки холста");
          closeModal();
          refresh();
        };
      }
      function searchDialog() {
        openModal(
          "Поиск блоков и команд",
          inp("search-q", "Имя / поле / команда", "") +
            '<div id="search-results"></div>',
        );
        const commands = [
          { label: "Новая схема", fn: newSchemaDialog },
          { label: "Новый объект", fn: () => openObjectForm(schema(), null) },
          { label: "Экспорт", fn: exportDialog },
          { label: "Слои", fn: layersDialog },
          { label: "Граф зависимостей", fn: graphDialog },
          { label: "Справка", fn: () => helpDialog() },
          { label: "Резервные копии", fn: backupDialog },
        ];
        const run = () => {
          const q = $("#search-q").value.toLowerCase(),
            sp = spaceRef(),
            ns = sp
              ? sp.nodes.filter((n) =>
                  (n.label + " " + (n.props.field || ""))
                    .toLowerCase()
                    .includes(q),
                )
              : [],
            items = [
              ...ns.map((n) => ({
                label: n.label + " · " + KINDS[n.kind].label,
                fn: () => {
                  closeModal();
                  focusNode(n.id);
                },
              })),
              ...commands.filter((c) => c.label.toLowerCase().includes(q)),
            ];
          $("#search-results").innerHTML =
            items
              .map(
                (x, i) =>
                  `<button class="pick-row search-result" data-result="${i}" style="width:100%">${esc(x.label)}</button>`,
              )
              .join("") || "<p>Ничего не найдено.</p>";
          $$("[data-result]").forEach(
            (b) => (b.onclick = () => items[+b.dataset.result].fn()),
          );
        };
        $("#search-q").oninput = run;
        $("#search-q").onkeydown = (e) => {
          if (e.key === "Enter") $(".search-result")?.click();
        };
        run();
      }
      const CONTROLS = [
        {
          id: "zoom",
          label: "Зум холста",
          target: "view.zoom",
          type: "range",
          min: 10,
          max: 800,
          step: 1,
          def: 100,
          get: () => Math.round(state.ui.view.zoom * 100),
          apply: (v) => zoomCenter(v / 100),
        },
        {
          id: "grid",
          label: "Шаг сетки",
          target: "gridStep",
          type: "range",
          min: 4,
          max: 64,
          step: 1,
          def: 16,
          get: () => state.ui.gridStep,
          apply: (v) => {
            state.ui.gridStep = v;
            applyView();
          },
        },
        {
          id: "magnet",
          label: "Радиус магнита",
          target: "snapRadius",
          type: "range",
          min: 0,
          max: 20,
          def: 6,
          get: () => state.ui.snapRadius,
          apply: (v) => (state.ui.snapRadius = v),
        },
        {
          id: "radius",
          label: "Скругление блоков",
          target: "css.radius",
          type: "range",
          min: 0,
          max: 24,
          def: 8,
          get: () => parseFloat(cssVar("--radius")),
          apply: (v) => setCss("--radius", v + "px"),
        },
        {
          id: "density",
          label: "Плотность (gap)",
          target: "css.gap",
          type: "range",
          min: 4,
          max: 24,
          def: 10,
          get: () => parseFloat(cssVar("--gap")),
          apply: (v) => {
            setCss("--gap", v + "px");
            setCss("--ui-pad", v + "px");
          },
        },
        {
          id: "fontscale",
          label: "Масштаб шрифта",
          target: "css.font-scale",
          type: "range",
          min: 80,
          max: 140,
          def: 100,
          get: () => parseFloat(cssVar("--font-scale")) * 100,
          apply: (v) => {
            setCss("--font-scale", v / 100);
            document.body.style.fontSize = Math.max(11, (13 * v) / 100) + "px";
          },
        },
        {
          id: "hue",
          label: "Оттенок палитры",
          target: "css.accent-h",
          type: "range",
          min: 0,
          max: 360,
          def: 38,
          get: () => parseFloat(cssVar("--accent-h")),
          apply: (v) => {
            setCss("--accent-h", v);
            setCss("--accent", `hsl(${v},91%,55%)`);
          },
        },
        {
          id: "shadow",
          label: "Глубина теней",
          target: "css.shadow-depth",
          type: "range",
          min: 0,
          max: 100,
          def: 50,
          get: () => parseFloat(cssVar("--shadow-depth")),
          apply: (v) => {
            setCss("--shadow-depth", v);
            setCss(
              "--elevation",
              `0 ${v / 10}px ${v / 2}px rgba(0,0,0,${v / 200})`,
            );
          },
        },
        {
          id: "curve",
          label: "Кривизна связей",
          target: "css.curve",
          type: "range",
          min: 0,
          max: 100,
          def: 60,
          get: () => parseFloat(cssVar("--curve")),
          apply: (v) => {
            setCss("--curve", v + "%");
            renderCanvas();
          },
        },
        {
          id: "portsize",
          label: "Размер портов",
          target: "css.port-size",
          type: "range",
          min: 8,
          max: 20,
          def: 12,
          get: () => parseFloat(cssVar("--port-size")),
          apply: (v) => {
            setCss("--port-size", v + "px");
            renderCanvas();
          },
        },
        {
          id: "theme",
          label: "Тема",
          target: "theme",
          type: "select",
          opts: ["Кузня", "Терминал", "Пергамент"],
          def: "Кузня",
          get: () => state.model.settings.theme,
          apply: (v) => setTheme(v),
        },
        {
          id: "snap",
          label: "Привязка",
          target: "snap",
          type: "toggle",
          def: true,
          get: () => state.ui.snap,
          apply: (v) => (state.ui.snap = v),
        },
        {
          id: "guides",
          label: "Направляющие",
          target: "guides",
          type: "toggle",
          def: true,
          get: () => state.ui.guides,
          apply: (v) => (state.ui.guides = v),
        },
        {
          id: "autoflow",
          label: "Автопоток",
          target: "autoflow",
          type: "toggle",
          def: true,
          get: () => state.ui.autoflow,
          apply: (v) => {
            state.ui.autoflow = v;
            renderCanvas();
          },
        },
      ];
      const cssVar = (k) =>
        getComputedStyle(document.documentElement).getPropertyValue(k).trim();
      const setCss = (k, v) => document.documentElement.style.setProperty(k, v);
      const ACTIONS = [
        { id: "reset", label: "⟲ Сброс вида", fn: resetControls },
        { id: "random", label: "＋ Случайный объект", fn: randomObject },
        { id: "export", label: "⇩ Экспорт", fn: exportDialog },
        { id: "import", label: "⇧ Импорт проекта", fn: importJSON },
      ];
      function buildCtrlPanel() {
        const cp = $("#ctrlpanel");
        cp.innerHTML = "";
        CONTROLS.forEach((c) => {
          if (!c.apply) throw Error("Контракт контрола нарушен: " + c.id);
          const d = document.createElement("div");
          d.className = "ctrl";
          d.innerHTML = `<label for="ctrl-${c.id}">${c.label}<span class="val">${c.def}</span></label>`;
          let el;
          if (c.type === "range") {
            el = document.createElement("input");
            el.type = "range";
            el.min = c.min;
            el.max = c.max;
            el.step = c.step || 1;
          } else if (c.type === "toggle") {
            el = document.createElement("input");
            el.type = "checkbox";
          } else {
            el = document.createElement("select");
            el.innerHTML = c.opts.map((o) => `<option>${o}</option>`).join("");
          }
          el.id = "ctrl-" + c.id;
          if (c.id === 'zoom') { const row=document.createElement('div');row.className='ctrl-zoom-row';const step=document.createElement('input');step.type='number';step.id='ctrl-zoom-step';step.min=10;step.max=800;step.value=c.get();step.title='Точный зум, %';step.setAttribute('aria-label','Точный зум, %');step.oninput=()=>{if(+step.value>=10&&+step.value<=800){c.apply(+step.value);el.value=step.value;d.querySelector('.val').textContent=step.value;state.model.settings.controls.zoom=+step.value;}};step.onchange=()=>snapshot('Точный зум');d.appendChild(row);row.append(el,step);cp.appendChild(d); }
          if(el) d.appendChild(el);
          cp.appendChild(d);
          el = $('#ctrl-'+c.id);
          el.title = c.label + " → " + c.target;
          cp.appendChild(d);
          const value = () =>
            c.type === "toggle"
              ? el.checked
              : c.type === "range"
                ? +el.value
                : el.value;
          el.oninput = () => {
            c.apply(value());
            d.querySelector(".val").textContent =
              c.type === "toggle" ? (el.checked ? "вкл" : "выкл") : el.value;
            state.model.settings.controls ||= {}; state.model.settings.controls[c.id] = value();
          };
          el.onchange = () => {
            snapshot("Настройка вида: " + c.label);
            saveLocal();
          };
          c.apply(c.def);
        });
        const sep = document.createElement("span");
        sep.className = "ctrl-sep";
        cp.appendChild(sep);
        ACTIONS.forEach((a) => {
          const b = document.createElement("button");
          b.id = "act-" + a.id;
          b.className = "ctrl-btn " + (a.id === "export" ? "primary" : "");
          b.textContent = a.label;
          b.onclick = a.fn;
          cp.appendChild(b);
        });
        syncControls();
      }
      function syncControls() {
        CONTROLS.forEach((c) => {
          const el = $("#ctrl-" + c.id);
          if (!el) return;
          const v = c.get();
          if ($('#ctrl-zoom-step')) $('#ctrl-zoom-step').value = Math.round(state.ui.view.zoom*100);
          if (c.type === "toggle") el.checked = !!v;
          else el.value = v;
          el.closest(".ctrl").querySelector(".val").textContent =
            c.type === "toggle" ? (v ? "вкл" : "выкл") : Math.round(v);
        });
      }
      function resetControls() {
        CONTROLS.forEach((c) => c.apply(c.def));
        state.ui.view = { x: 30, y: 30, zoom: 1 };
        state.ui.views = {};
        applyView();
        syncControls();
        snapshot("Сброс вида");
        toast("Все 14 контролов сброшены", "ok");
      }
      function setTheme(name) {
        state.model.settings.theme = name;
        const vars =
          name === "Терминал"
            ? {
                "--bg-deep": "#040A07",
                "--bg": "#07130D",
                "--surface": "#0A1A12",
                "--surface-2": "#0F2418",
                "--border": "#28513C",
                "--text": "#E5F5E9",
                "--muted": "#9CB8A7",
                "--accent": "#4ADE80",
                "--accent-h": "140",
                "--cyan": "#7DD3FC",
              }
            : name === "Пергамент"
              ? {
                  "--bg-deep": "#EFE8DC",
                  "--bg": "#F5EFE3",
                  "--surface": "#ECE4D4",
                  "--surface-2": "#E2D8C4",
                  "--border": "#B5A78E",
                  "--text": "#2A241A",
                  "--muted": "#655B49",
                  "--accent": "#9A5800",
                  "--accent-h": "35",
                  "--cyan": "#006477",
                  "--lime": "#426B08",
                  "--red": "#B51D3A",
                  "--magenta": "#9D287E",
                  "--violet": "#6540A4",
                  "--amber": "#9A4800",
                }
              : {
                  "--bg-deep": "#080A0F",
                  "--bg": "#0E1219",
                  "--surface": "#141A24",
                  "--surface-2": "#1B2331",
                  "--border": "#2C3849",
                  "--text": "#E9EEF7",
                  "--muted": "#8797AE",
                  "--accent": "#F5A524",
                  "--accent-h": "38",
                  "--cyan": "#22D3EE",
                  "--lime": "#A3E635",
                  "--red": "#FF4D6D",
                  "--magenta": "#E879F9",
                  "--violet": "#A78BFA",
                  "--amber": "#FB923C",
                };
        Object.entries(vars).forEach(([k, v]) => setCss(k, v));
        document.documentElement.dataset.theme = name;
      }
      function randomObject() {
        const s = schema(),
          o = {
            id: uid(),
            schema: s.id,
            schemaVersion: s.version,
            name: "Образец-" + (objectsOfSchema().length + 1),
            values: {},
            tags: ["Образец"],
            folder: "Образцы",
            notes: "",
            deleted: false,
          };
        s.fields.forEach(
          (f) =>
            (o.values[f.id] =
              f.type === "number"
                ? Math.floor(Math.random() * 8) + 1
                : f.type === "flag"
                  ? false
                  : f.type === "tags"
                    ? ["Образец"]
                    : f.type === "text"
                      ? o.name
                      : f.default),
        );
        state.model.objects.push(o);
        state.ui.previewObj = o;
        snapshot("Случайный объект");
        refresh();
        toast("Создан " + o.name, "ok");
      }
      /* Files: JSON, CSV, standalone HTML, text, PNG, print, native ZIP .rforge. */
      function download(data, name, type = "application/octet-stream") {
        const blob = data instanceof Blob ? data : new Blob([data], { type }),
          url = URL.createObjectURL(blob),
          a = document.createElement("a");
        a.href = url;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      }
      const fileData = (f) =>
        new Promise((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => resolve(r.result);
          r.onerror = () => reject(r.error);
          r.readAsDataURL(f);
        });
      function projectData() {
        const m = clone(state.model);
        m.settings.view = clone(state.ui.views);
        m.settings.filters = Object.fromEntries(
          [
            "baseSearch",
            "baseTag",
            "baseFolder",
            "baseFavorite",
            "baseSort",
            "linkFilter",
            "showRules",
            "compact",
          ].map((k) => [k, state.ui[k]]),
        );
        return m;
      }
      function exportJSON() {
        download(
          stable(projectData()),
          "recruit-forge.rforge.json",
          "application/json",
        );
        toast("Проект экспортирован", "ok");
      }
      function textRoster(r = roster()) {
        let out = [
          r.character.name + " · " + r.character.role,
          rosterTotal(r) + " / " + r.limits.points + " оч.",
        ];
        state.model.layouts
          .find((l) => l.id === r.layout)
          ?.nodes.filter((n) => n.kind === "slot")
          .forEach((n) => {
            out.push("\n" + n.label);
            (r.assign[n.id] || []).forEach((a) => {
              const o = state.model.objects.find(
                (o) => o.id === a.objectId && !o.deleted,
              );
              if (!o) return;
              const s = state.model.schemas.find((s) => s.id === o.schema);
              out.push(
                "  " +
                  a.count +
                  "× " +
                  (a.alias || o.name) +
                  " — " +
                  objectCost(o, a.count) +
                  " оч.",
              );
              out.push(
                "    " +
                  s.fields
                    .filter((f) => !f.removed && f.name !== "Имя")
                    .map((f) => f.name + ": " + displayValue(s, o, f.name))
                    .join(" · "),
              );
              if (a.notes) out.push("    Заметка: " + a.notes);
            });
          });
        out.push(
          "\n" +
            validate()
              .map((e) => e.msg)
              .join("\n"),
        );
        return out.join("\n");
      }
      function csvEscape(s) {
        s = String(s ?? "");
        return /[",\n;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
      }
      function exportCSV() {
        const s = schema(),
          fs = s.fields.filter((f) => !f.removed),
          rows = [
            ["Имя", ...fs.map((f) => f.name), "Теги", "Папка", "Заметка"],
            ...objectsOfSchema().map((o) => [
              o.name,
              ...fs.map((f) => o.values[f.id] ?? ""),
              o.tags.join(","),
              o.folder,
              o.notes,
            ]),
          ];
        download(
          "\uFEFF" + rows.map((r) => r.map(csvEscape).join(",")).join("\r\n"),
          "objects.csv",
          "text/csv;charset=utf-8",
        );
      }
      const EXPORT_CSS = `*{box-sizing:border-box}body{margin:0;background:#0e1219;color:#e9eef7;font:14px system-ui,sans-serif;padding:30px}.export-page{max-width:940px;margin:auto}.export-title{color:#f5a524;border-bottom:2px solid #f5a524;padding-bottom:16px}.sheet-canvas{position:relative;margin:20px auto;max-width:100%;overflow:visible}.sheet-topline{position:absolute;left:30px;top:0;right:30px;display:flex;justify-content:space-between;color:#f5a524}.node{position:absolute;border:1px solid #2c3849;border-radius:6px;background:#1b2331;overflow:hidden}.n-head{height:28px;padding:5px 8px;font-size:11px;color:#8797ae;display:flex;gap:6px}.kind-dot{width:8px;height:8px;border-radius:2px;display:inline-block;margin-top:3px}.n-body{padding:6px 8px}.stat-val,.value{font:700 23px monospace;color:#22d3ee}.stat-lbl{font-size:10px;color:#8797ae}.mini-table{width:100%;border-collapse:collapse;font:12px monospace}.mini-table td,.mini-table th{border:1px solid #2c3849;padding:5px;text-align:center}.chips{display:flex;flex-wrap:wrap;gap:4px}.chip{border:1px solid #22d3ee;color:#22d3ee;border-radius:10px;padding:2px 6px;font-size:11px}.roster-card{border:1px solid #2c3849;border-radius:6px;background:#141a24;padding:8px;min-width:0;overflow:hidden}.roster-card-head,.roster-card-foot{display:flex;justify-content:space-between;gap:8px}.roster-card-head{color:#f5a524}.roster-card-foot{font-size:11px;color:#8797ae;margin-top:6px}.slot-cards{display:grid;align-items:start}.slot-empty{padding:18px;color:#8797ae}.template-card{position:relative;overflow:hidden}.template-card .n-head{display:none}.count-badge{color:#22d3ee}.instance-note,.sheet-notes{font-size:12px;color:#8797ae}.sheet-notes{position:absolute;bottom:10px;left:40px}.kv{display:flex;justify-content:space-between;padding:3px;border-bottom:1px solid #2c3849}.kv b{color:#22d3ee}.bar-track{height:10px;background:#080a0f}.bar-fill{height:100%;background:#22d3ee}img{max-width:100%}.missing-object{color:#ff4d6d}button{display:none}.sheet-portrait{position:absolute;right:30px;top:35px;width:100px;height:100px;object-fit:contain}.compact .roster-card-content{font:12px monospace;color:#22d3ee}.compact .roster-card-content span{margin-right:8px}details summary{cursor:pointer}small{display:block;color:#8797ae}hr{border:0;border-top:1px solid #2c3849}@media print{body{background:white;color:#17212b;padding:0}.export-page{max-width:none}.node,.roster-card{background:#f7f8fa;border-color:#aab3bd;break-inside:avoid}.sheet-canvas{margin:0}.stat-val,.value,.kv b,.chip{color:#006477}.n-head,.stat-lbl,.roster-card-foot,small{color:#526071}.roster-card-head,.sheet-topline,.export-title{color:#805000}.sheet-canvas{page-break-inside:avoid}.export-title{font-size:18px}@page{size:A4;margin:14mm}}`;
      function exportHTML() {
        const r = roster();
        state.model.layouts.find((l) => l.id === r.layout) &&
          autoLayout(state.model.layouts.find((l) => l.id === r.layout));
        const content = sheetHTML(
          r,
          state.model.layouts.find((l) => l.id === r.layout),
          false,
        );
        const doc =
          '<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' +
          esc(r.character.name) +
          " — Recruit Forge</title><style>" +
          EXPORT_CSS +
          '</style><main class="export-page"><h1 class="export-title">' +
          esc(r.character.name) +
          "</h1>" +
          content +
          "<p>" +
          esc(textRoster()).replace(/\n/g, "<br>") +
          "</p></main></html>";
        download(doc, "roster.html", "text/html;charset=utf-8");
        toast("Автономный HTML экспортирован", "ok");
      }
      function exportPNGCanvas() {
        const r=roster(),l = state.model.layouts.find((l) => l.id === r.layout);
        if(!l)throw Error("Нет компоновки");
        const previous=sheetRosterContext;sheetRosterContext=r;
        try { autoLayout(l);
        const width = l.canvas.w,
          height = Math.max(
            l.canvas.h,
            ...l.nodes.map((n) => worldFrame(n, l).y + n.frame.h + 50),
          ),
          canvas = document.createElement("canvas");
        canvas.width = width * 2;
        canvas.height = height * 2;
        const c = canvas.getContext("2d");
        c.scale(2, 2);
        c.fillStyle = "#0E1219";
        c.fillRect(0, 0, width, height);
        c.fillStyle = "#F5A524";
        c.font = "bold 24px system-ui";
        c.fillText(roster().character.name, 35, 38);
        c.font = "14px monospace";
        c.fillText(
          rosterTotal(roster()) + " / " + roster().limits.points + " оч.",
          width - 180,
          38,
        );
        const draw = (n) => {
          const f = worldFrame(n, l);
          if (n.hidden) return;
          c.strokeStyle = "#2C3849";
          c.fillStyle = "#141A24";
          c.fillRect(f.x, f.y, f.w, f.h);
          c.strokeRect(f.x, f.y, f.w, f.h);
          c.fillStyle = "#F5A524";
          c.font = "bold 13px system-ui";
          c.fillText(n.label, f.x + 10, f.y + 20, Math.max(20, f.w - 20));
          if (n.kind === "slot") {
            const assigns = roster().assign[n.id] || [],
              cols = +n.props.cols || 1,
              cw = (f.w - 24) / cols;
            assigns.forEach((a, i) => {
              const o = state.model.objects.find(
                (o) => o.id === a.objectId && !o.deleted,
              );
              if (!o) return;
              const s = state.model.schemas.find((s) => s.id === o.schema),
                x = f.x + 12 + (i % cols) * cw,
                y = f.y + 38 + Math.floor(i / cols) * 105;
              c.fillStyle = "#E9EEF7";
              c.font = "bold 14px system-ui";
              c.fillText(a.count + "× " + (a.alias || o.name), x, y, cw - 15);
              c.font = "12px monospace";
              c.fillStyle = "#22D3EE";
              const text = s.fields
                .filter((f) => !f.removed && f.type !== "text")
                .map((f) => f.name + ":" + displayValue(s, o, f.name))
                .join("  ");
              wrapCanvas(c, text, x, y + 22, cw - 18, 17);
              c.fillStyle = "#F5A524";
              c.fillText(objectCost(o, a.count) + " оч.", x, y + 83);
            });
          } else if (VISUAL.includes(n.kind)) {
            const text = n.props.static || n.label;
            c.fillStyle = "#E9EEF7";
            c.font = "14px system-ui";
            wrapCanvas(c, text, f.x + 10, f.y + 42, f.w - 20, 19);
          }
        };
        l.nodes.forEach(draw);
        return new Promise((resolve,reject)=>canvas.toBlob((b) => {
          if(!b){reject(Error("PNG не создан"));return;}
          download(b, "roster.png", "image/png");
          toast("PNG экспортирован · 2× · совместимый режим", "ok");resolve(b);
        }, "image/png"));
        } finally { sheetRosterContext=previous; }
      }
      function wrapCanvas(c, text, x, y, w, line) {
        let row = "",
          yy = y;
        for (const word of String(text).split(" ")) {
          if (c.measureText(row + word).width > w) {
            c.fillText(row, x, yy);
            row = "";
            yy += line;
          }
          row += word + " ";
        }
        c.fillText(row, x, yy);
      }
      function printSheet() {
        const old = $("#print-root");
        old?.remove();
        const root = document.createElement("div");
        root.id = "print-root";
        root.innerHTML =
          "<style>" +
          EXPORT_CSS +
          '</style><div class="export-page">' +
          sheetHTML(
            roster(),
            state.model.layouts.find((l) => l.id === roster().layout),
            false,
          ) +
          "</div>";
        document.body.appendChild(root);
        window.print();
        setTimeout(() => root.remove(), 1000);
      }
      function exportDialog() {
        openModal(
          "Экспорт",
          sel("ex-format", "Формат", "html", [
            ["json", "JSON · весь проект"],
            ["rforge", "RFORGE · ZIP-архив"],
            ["csv", "CSV · объекты текущей схемы"],
            ["html", "HTML · автономный лист"],
            ["png", "PNG · изображение 2×"],
            ["text", "Текст · для мессенджера"],
            ["pdf", "PDF · диалог печати"],
            ["schema", "JSON · текущая схема"],
            ["layout", "JSON · текущая компоновка"],
            ["roster", "JSON · текущий ростер"],
          ]) +
            '<pre class="export-preview">' +
            esc(textRoster().slice(0, 2200)) +
            "</pre>",
          '<button class="btn" id="ex-copy">Копировать текст</button><button class="btn primary" id="ex-download">Скачать / печать</button>',
        );
        $("#ex-copy").onclick = async () => {
          try {
            await navigator.clipboard.writeText(textRoster());
            toast("Текст скопирован", "ok");
          } catch {
            download(textRoster(), "roster.txt", "text/plain");
          }
        };
        $("#ex-download").onclick = async (event) => {
          const button=event.currentTarget;button.disabled=true;
          try {
          const f = $("#ex-format").value;
          closeModal();
          if (f === "json") exportJSON();
          if (f === "rforge")
            download(
              await makeZip({
                "manifest.json": JSON.stringify({
                  format: "rforge/2",
                  created: new Date().toISOString(),
                }),
                "model.json": stable(projectData()),
              }),
              "project.rforge",
              "application/zip",
            );
          if (f === "csv") exportCSV();
          if (f === "html") exportHTML();
          if (f === "png") await exportPNG();
          if (f === "text")
            download(textRoster(), "roster.txt", "text/plain;charset=utf-8");
          if (f === "pdf") printSheet();
          if (f === "schema")
            download(stable({format:'rforge/part',kind:'schema',schema:schema(),objects:objectsOfSchema()}), "schema.json", "application/json");
          if (f === "layout")
            download(stable({format:'rforge/part',kind:'layout',layout:layout()}), "layout.json", "application/json");
          if (f === "roster")
            download(stable({format:'rforge/part',kind:'roster',roster:roster()}), "roster.json", "application/json");
          } catch(e) { toast("Ошибка экспорта: "+e.message,"err"); }
          finally { if(button.isConnected)button.disabled=false; }
        };
      }
      function pickFile(accept, fn) {
        const el = document.createElement("input");
        el.type = "file";
        el.accept = accept;
        el.onchange = async () => {
          try {
            if (el.files[0]) await fn(el.files[0]);
          } catch (e) {
            toast("Ошибка импорта: " + e.message, "err");
          }
        };
        el.click();
      }
      function importJSON() {
        pickFile(".json,.rforge", async (f) => {
          const m = await parseProjectFile(f),part=m.__importPart;
          delete m.__importPart;
          const summary=part?{
            schemas:part.kind==="schema"?1:0,
            objects:part.kind==="schema"?part.objectIds.length:0,
            layouts:part.kind==="layout"?1:0,
            rosters:part.kind==="roster"?1:0
          }:m;
          openModal(
            "Импорт проекта",
            `<p>Файл: ${esc(f.name)}</p><div class="summary-box">${summary.schemas.length??summary.schemas} схем · ${summary.objects.length??summary.objects} объектов · ${summary.layouts.length??summary.layouts} листов · ${summary.rosters.length??summary.rosters} ростеров</div>${sel(
              "import-mode",
              "Режим",
              part?"merge":"replace",
              [
                ...(part?[]:[["replace", "Заменить проект"]]),
                ["merge", part?"Добавить к текущему проекту":"Объединить (конфликты ID переименовываются)"],
              ],
            )}<p class="muted">Формат проверен. При замене текущий проект сохраняется в резервную копию. При объединении совпадающие ID получают новые значения; ссылки сохраняются. Отдельная схема, лист или ростер добавляется к текущему проекту без дублирования остальных данных.</p>`,
            '<button class="btn" onclick="closeModal()">Отмена</button><button class="btn primary" id="import-ok">Импортировать</button>',
          );
          $("#import-ok").onclick = async () => {
            const button=$("#import-ok");button.disabled=true;
            try {
            backup("Перед импортом");
            if (!part && $("#import-mode").value === "replace") state.model = m;
            else if(part) state.model = m;
            else {
              const map = new Map();
              const occupied = new Set(["schemas", "objects", "layouts", "rosters"].flatMap(k => state.model[k].map(x => x.id)));
              ["schemas", "objects", "layouts", "rosters"].forEach(k => m[k].forEach(x => {
                if (!x.id || occupied.has(x.id)) { const id = uid(); map.set(x.id,id); x.id=id; }
                occupied.add(x.id);
              }));
              m.schemas.concat(m.layouts).forEach(sp => {
                const taken = new Set();
                sp.nodes.forEach(n => { if(taken.has(n.id)){const id=uid();map.set(n.id,id);n.id=id;} taken.add(n.id); });
                sp.fields?.forEach(f => { if(taken.has(f.id)){const id=uid();map.set(f.id,id);f.id=id;} taken.add(f.id); });
              });
              const ref = v => map.get(v) || v;
              const remap = (x) => {
                if(!x || typeof x !== "object") return;
                ["schema","layout","objectId","parent","bind"].forEach(k=>{if(x[k])x[k]=ref(x[k]);});
                if(x.from?.node)x.from.node=ref(x.from.node);
                if(x.to?.node)x.to.node=ref(x.to.node);
                if(x.props)["sourceSchema","schemaId","fieldId","targetField","repeatBy"].forEach(k=>{if(x.props[k])x.props[k]=ref(x.props[k]);});
                if(x.assign){const entries=Object.entries(x.assign);x.assign={};entries.forEach(([key,as])=>{as.forEach(remap);x.assign[ref(key)]=as;});}
                x.nodes?.forEach(remap); x.links?.forEach(remap);
              };
              ["schemas", "objects", "layouts", "rosters"].forEach((k) => {
                m[k].forEach(remap);
                state.model[k].push(...m[k]);
              });
            }
            normalize(state.model);
            state.ui.selection.clear();state.ui.selLink=null;state.ui.objectSel.clear();state.ui.gridSel.clear();
            state.ui.activeSchema=0;state.ui.activeLayout=0;state.ui.activeRoster=0;
            if(!part)applySettings(state.model.settings);
            fixIndices();
            snapshot("Импорт проекта");
            closeModal();
            refresh();
            toast("Проект импортирован", "ok");
            } catch(e) { button.disabled=false;toast("Ошибка импорта: "+e.message,"err"); }
          };
        });
      }
      async function parseProjectFile(f) {
        if (f.size > 50e6) throw Error("Файл больше 50 МБ");
        const addPart=(kind,item,objects=[])=>{
          if(!item || typeof item!=="object")throw Error("В файле отсутствует "+kind);
          const m=clone(state.model);
          if(kind==="schema"){m.schemas.push(item);m.objects.push(...objects);}
          if(kind==="layout")m.layouts.push(item);
          if(kind==="roster")m.rosters.push(item);
          normalize(m);
          m.__importPart={kind,id:item.id,objectIds:objects.map(o=>o.id)};
          return m;
        };
        if (/\.rforge$/i.test(f.name)) {
          const files=await readZip(await f.arrayBuffer());
          if(!files["manifest.json"]||!files["model.json"])throw Error("В архиве нет manifest.json или model.json");
          const manifest=JSON.parse(files["manifest.json"]);
          if(manifest.format!=="rforge/2")throw Error("Неизвестная версия архива");
          return normalize(JSON.parse(files["model.json"]));
        }
        let data;
        try{data=JSON.parse(await f.text());}catch{throw Error("Файл не содержит корректный JSON");}
        if(!data||typeof data!=="object")throw Error("Пустой или неверный файл проекта");
        if(data.format==="rforge/2")return normalize(data);
        if(data.format==="rforge/part"){
          if(data.kind==="schema")return addPart("schema",data.schema,Array.isArray(data.objects)?data.objects:[]);
          if(data.kind==="layout")return addPart("layout",data.layout);
          if(data.kind==="roster")return addPart("roster",data.roster);
          throw Error("Неизвестный тип части проекта");
        }
        if(Array.isArray(data.nodes)&&Array.isArray(data.links)&&data.canvas)return addPart("layout",data);
        if(Array.isArray(data.fields)&&Array.isArray(data.nodes)&&Array.isArray(data.links))return addPart("schema",data);
        if(data.character&&data.assign&&data.layout)return addPart("roster",data);
        throw Error("Ожидается проект rforge/2 или отдельная схема / компоновка / ростер");
      }
      /* Store-only ZIP reader/writer, no compression dependency. */
      const crcTable = Array.from({ length: 256 }, (_, n) => {
        for (let k = 0; k < 8; k++)
          n = n & 1 ? 0xedb88320 ^ (n >>> 1) : n >>> 1;
        return n >>> 0;
      });
      function crc32(a) {
        let c = 0xffffffff;
        for (const b of a) c = crcTable[(c ^ b) & 255] ^ (c >>> 8);
        return (c ^ 0xffffffff) >>> 0;
      }
      async function makeZip(files) {
        const enc = new TextEncoder(),
          parts = [],
          central = [];
        let offset = 0;
        for (const [name, text] of Object.entries(files)) {
          const n = enc.encode(name),
            a = typeof text === "string" ? enc.encode(text) : text,
            crc = crc32(a),
            h = new Uint8Array(30 + n.length),
            v = new DataView(h.buffer);
          v.setUint32(0, 0x04034b50, true);
          v.setUint16(4, 20, true);
          v.setUint16(6, 0x800, true);
          v.setUint16(12, 0, true);
          v.setUint32(14, crc, true);
          v.setUint32(18, a.length, true);
          v.setUint32(22, a.length, true);
          v.setUint16(26, n.length, true);
          h.set(n, 30);
          parts.push(h, a);
          const c = new Uint8Array(46 + n.length),
            d = new DataView(c.buffer);
          d.setUint32(0, 0x02014b50, true);
          d.setUint16(4, 20, true);
          d.setUint16(6, 20, true);
          d.setUint16(8, 0x800, true);
          d.setUint32(16, crc, true);
          d.setUint32(20, a.length, true);
          d.setUint32(24, a.length, true);
          d.setUint16(28, n.length, true);
          d.setUint32(42, offset, true);
          c.set(n, 46);
          central.push(c);
          offset += h.length + a.length;
        }
        const size = central.reduce((n, a) => n + a.length, 0),
          end = new Uint8Array(22),
          d = new DataView(end.buffer);
        d.setUint32(0, 0x06054b50, true);
        d.setUint16(8, central.length, true);
        d.setUint16(10, central.length, true);
        d.setUint32(12, size, true);
        d.setUint32(16, offset, true);
        return new Blob([...parts, ...central, end], {
          type: "application/zip",
        });
      }
      async function readZip(buffer) {
        const a = new Uint8Array(buffer),
          v = new DataView(buffer),
          out = {};
        let p = 0;
        while (p + 30 <= a.length && v.getUint32(p, true) === 0x04034b50) {
          const method = v.getUint16(p + 8, true),
            size = v.getUint32(p + 18, true),
            n = v.getUint16(p + 26, true),
            extra = v.getUint16(p + 28, true),
            name = new TextDecoder().decode(a.slice(p + 30, p + 30 + n)),
            start = p + 30 + n + extra,
            data = a.slice(start, start + size);
          if (method === 0) out[name] = new TextDecoder().decode(data);
          else if (method === 8 && typeof DecompressionStream !== "undefined")
            out[name] = await new Response(
              new Blob([data])
                .stream()
                .pipeThrough(new DecompressionStream("deflate-raw")),
            ).text();
          else throw Error("Сжатие ZIP не поддерживается");
          p = start + size;
        }
        if (!Object.keys(out).length) throw Error("Повреждённый ZIP");
        return out;
      }
      function parseCSV(text) {
        text = text.replace(/^\uFEFF/, "");
        const delim = text.split("\n")[0].includes("\t")
          ? "\t"
          : text.split("\n")[0].includes(";")
            ? ";"
            : ",";
        const rows = [];
        let row = [],
          cell = "",
          quoted = false;
        for (let i = 0; i < text.length; i++) {
          const c = text[i];
          if (c === '"') {
            if (quoted && text[i + 1] === '"') {
              cell += '"';
              i++;
            } else quoted = !quoted;
          } else if (c === delim && !quoted) {
            row.push(cell);
            cell = "";
          } else if ((c === "\n" || c === "\r") && !quoted) {
            if (c === "\r" && text[i + 1] === "\n") i++;
            row.push(cell);
            if (row.some((x) => x !== "")) rows.push(row);
            row = [];
            cell = "";
          } else cell += c;
        }
        row.push(cell);
        if (row.some((x) => x !== "")) rows.push(row);
        return rows;
      }
      async function tableRows(f) {
        if (/\.xlsx$/i.test(f.name)) {
          const files = await readZip(await f.arrayBuffer()),
            parse = (s) => {
              const d = new DOMParser().parseFromString(s, "application/xml");
              return d.getElementsByTagNameNS("*", "sheetData")[0];
            };
          const shared = files["xl/sharedStrings.xml"]
              ? Array.from(
                  new DOMParser()
                    .parseFromString(
                      files["xl/sharedStrings.xml"],
                      "application/xml",
                    )
                    .getElementsByTagNameNS("*", "si"),
                ).map((si) =>
                  Array.from(si.getElementsByTagNameNS("*", "t"))
                    .map((t) => t.textContent)
                    .join(""),
                )
              : [],
            sheet = parse(files["xl/worksheets/sheet1.xml"]);
          if (!sheet) throw Error("Первый лист XLSX не найден");
          return Array.from(sheet.getElementsByTagNameNS("*", "row")).map(
            (row) => {
              const arr = [];
              Array.from(row.getElementsByTagNameNS("*", "c")).forEach((c) => {
                const ref = c.getAttribute("r") || "A1",
                  letters = ref.match(/[A-Z]+/)[0];
                let col = 0;
                for (const ch of letters)
                  col = col * 26 + ch.charCodeAt(0) - 64;
                const val =
                  Array.from(c.getElementsByTagNameNS("*", "v"))[0]
                    ?.textContent ||
                  Array.from(c.getElementsByTagNameNS("*", "t"))[0]
                    ?.textContent ||
                  "";
                arr[col - 1] = c.getAttribute("t") === "s" ? shared[+val] : val;
              });
              return arr.map((v) => v ?? "");
            },
          );
        }
        return parseCSV(await f.text());
      }
      function importTableDialog() {
        pickFile(".csv,.tsv,.txt,.xlsx", async (f) => {
          const rows = await tableRows(f);
          if (rows.length < 2)
            throw Error("Нужны заголовок и хотя бы одна строка");
          const headers = rows[0],
            data = rows.slice(1);
          openModal(
            "Импорт таблицы · предпросмотр",
            `<p>${esc(f.name)} · ${data.length} строк</p><div class="mapping-grid">${headers
              .map(
                (h, i) =>
                  `<label>${esc(h)}<select data-map="${i}"><option value="">Пропустить</option><option value="name" ${/имя|name/i.test(h) ? "selected" : ""}>Имя</option><option value="tags" ${/теги|tags/i.test(h) ? "selected" : ""}>Теги</option>${schema()
                    .fields.map(
                      (f) =>
                        `<option value="${f.id}" ${f.name === h ? "selected" : ""}>${esc(f.name)}</option>`,
                    )
                    .join("")}</select></label>`,
              )
              .join(
                "",
              )}</div><div class="table-wrap"><table class="mini-table">${rows
              .slice(0, 11)
              .map(
                (r) =>
                  `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`,
              )
              .join("")}</table></div>`,
            '<button class="btn" onclick="closeModal()">Отмена</button><button class="btn primary" id="table-import">Импортировать</button>',
          );
          $("#table-import").onclick = () => {
            const map = $$("[data-map]").map((el) => [
              +el.dataset.map,
              el.value,
            ]);
            let count = 0,
              errors = 0;
            data.forEach((row) => {
              const o = {
                id: uid(),
                schema: schema().id,
                schemaVersion: schema().version,
                name: "Импорт",
                values: Object.fromEntries(
                  schema().fields.map((f) => [f.id, f.default]),
                ),
                tags: [],
                folder: "Импорт",
                notes: "",
                deleted: false,
              };
              let ok = true;
              map.forEach(([i, id]) => {
                if (!id) return;
                try {
                  if (id === "name") o.name = row[i] || "Без имени";
                  else if (id === "tags") o.tags = parseInput(row[i], "tags");
                  else
                    o.values[id] = parseInput(
                      row[i],
                      schema().fields.find((f) => f.id === id).type,
                    );
                } catch {
                  ok = false;
                }
              });
              if (ok) {
                state.model.objects.push(o);
                count++;
              } else errors++;
            });
            snapshot("Импорт таблицы");
            closeModal();
            refresh();
            toast(
              `Импортировано ${count}, ошибок ${errors}`,
              errors ? "info" : "ok",
            );
          };
        });
      }
      function importBattleScribe() {
        pickFile(".xml,.gst,.cat,.gstz,.catz", async (f) => {
          let text;
          if (/z$/.test(f.name)) {
            const files = await readZip(await f.arrayBuffer());
            text = Object.values(files)[0];
          } else text = await f.text();
          const doc = new DOMParser().parseFromString(text, "text/xml");
          if (doc.querySelector("parsererror")) throw Error("Некорректный XML");
          const s = mkSchema(f.name.replace(/\.[^.]+$/, ""), "empty"),
            report = [],
            types = [
              "selectionEntries",
              "selectionEntry",
              "entryLinks",
              "profiles",
              "profile",
              "rules",
              "rule",
              "constraints",
              "constraint",
              "modifiers",
              "modifier",
              "modifierGroups",
              "conditions",
              "conditionGroups",
              "costs",
            ];
          let count = 0;
          const visit = (el, parent) => {
            const tag = el.tagName.replace(/^.*:/, "");
            if (["selectionEntry", "profile", "rule"].includes(tag)) {
              const name = el.getAttribute("name") || "Запись " + ++count,
                n = mkNode(
                  "field",
                  30 + (count % 5) * 180,
                  40 + Math.floor(count / 5) * 90,
                  160,
                  70,
                  name,
                );
              let chars = Array.from(
                el.getElementsByTagNameNS("*", "characteristic"),
              );
              let type = chars.length ? "text" : "number",
                def = chars
                  .map((c) => c.getAttribute("name") + ": " + c.textContent)
                  .join("; ");
              if (!chars.length) {
                const cost = el.getElementsByTagNameNS("*", "cost")[0];
                def = cost?.getAttribute("value") || "0";
              }
              const fd = field(name, type, def);
              fd.id = uid();
              if (s.fields.some((f) => f.name === name)) {
                report.push("Дубликат имени: " + name);
                return;
              }
              s.fields.push(fd);
              n.props.fieldId = fd.id;
              n.bind = fd.id;
              n.parent = parent;
              s.nodes.push(n);
            }
            if (!types.includes(tag) && parent) {
              report.push("Не перенесено: " + tag);
              return;
            }
            Array.from(el.children).forEach((c) => visit(c, parent));
          };
          visit(doc.documentElement, null);
          const card = mkNode(
            "card",
            30,
            Math.max(140, s.nodes.length * 12),
            700,
            140,
            "Импортированные профили",
            { layoutMode: "flow" },
          );
          s.nodes.push(card);
          s.nodes
            .filter((n) => !n.parent)
            .forEach((n) => {
              n.parent = card.id;
            });
          s.importReport = report;
          state.model.schemas.push(s);
          state.ui.activeSchema = state.model.schemas.length - 1;
          snapshot("Импорт BattleScribe");
          refresh();
          openModal(
            "Отчёт импорта BattleScribe",
            `<p>Перенесено записей: ${count}. Ограничения и условия требуют проверки: автоматический маппинг неполный.</p><pre class="export-preview">${esc(report.join("\n") || "Нераспознанных конструкций нет.")}</pre>`,
          );
        });
      }
      /* Context menus, shortcuts and accessible dialogs. */
      viewport.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        const ne = e.target.closest(".node");
        if (ne) {
          const n = nodeById(ne.dataset.id);
          if (!state.ui.selection.has(n.id))
            state.ui.selection = new Set([n.id]);
          renderCanvas();
          renderInspector();
          showCtx(e.clientX, e.clientY, [
            {
              label: "Переименовать / свойства",
              hk: "F2",
              fn: () => {
                $("#rightpanel").classList.add("mobile-open");
                state.ui.rpTab = "insp";
                renderInspector();
                $("#i-label")?.focus();
              },
            },
            { label: "Дублировать", hk: "Ctrl+D", fn: duplicateSelected },
            { label: "Слои / вложить в…", fn: layersDialog },
            ...anchorMenuItems(n),
            {
              label: "Выровнять по сетке",
              fn: () => {
                $("#tb-snap-grid")?.click();
              },
            },
            {
              label: n.locked ? "Разблокировать" : "Блокировать",
              hk: "L",
              fn: () => toggleNodeFlag("locked"),
            },
            {
              label: n.hidden ? "Показать" : "Скрыть",
              hk: "H",
              fn: () => toggleNodeFlag("hidden"),
            },
            {
              label: "Наверх",
              hk: "]",
              fn: () => {
                $("#i-front")?.click();
              },
            },
            {
              label: "Назад",
              hk: "[",
              fn: () => {
                $("#i-back")?.click();
              },
            },
            { label: "Сохранить фрагмент", fn: fragmentsDialog },
            { label: "Удалить", hk: "Delete", fn: deleteSelected },
          ]);
        } else
          showCtx(e.clientX, e.clientY, [
            { label: "Создать блок · поиск", hk: "Tab", fn: searchDialog },
            { label: "Вставить", hk: "Ctrl+V", fn: pasteNodes },
            { label: "Настройки холста", fn: canvasSettings },
            { label: "Вписать всё", hk: "Ctrl+1", fn: () => fitAll() },
          ]);
      });
      function toggleNodeFlag(key) {
        const ns = [...state.ui.selection].map(nodeById).filter(Boolean);
        if (!ns.length) return;
        const value = !ns[0][key];
        ns.forEach((n) => (n[key] = value));
        snapshot(key === "locked" ? "Блокировка" : "Видимость");
        refresh();
      }
      function copyNodes(cut = false) {
        const sp = spaceRef();
        if (!sp || !state.ui.selection.size) return;
        const ids = new Set(state.ui.selection);
        sp.nodes
          .filter((n) => [...ids].some((id) => isDescendant(n.id, id, sp)))
          .forEach((n) => ids.add(n.id));
        clipboard = {
          nodes: sp.nodes.filter((n) => ids.has(n.id)).map(clone),
          links: sp.links
            .filter((l) => ids.has(l.from.node) && ids.has(l.to.node))
            .map(clone),
        };
        navigator.clipboard
          ?.writeText(
            JSON.stringify({ format: "rforge/fragment", ...clipboard }),
          )
          .catch(() => {});
        if (cut) deleteSelected();
        else toast("Фрагмент скопирован", "ok");
      }
      function pasteNodes() {
        if (!clipboard) {
          toast("Буфер пуст", "info");
          return;
        }
        const sp = spaceRef(),
          map = new Map(),
          p = screenToWorld(lastPointer.x, lastPointer.y);
        clipboard.nodes.forEach((n) => {
          const c = clone(n);
          c.id = uid();
          map.set(n.id, c.id);
          sp.nodes.push(c);
        });
        const root = clipboard.nodes.find((n) => !map.has(n.parent)),
          dx = root ? p.x - root.frame.x : 24,
          dy = root ? p.y - root.frame.y : 24;
        clipboard.nodes.forEach((n) => {
          const c = sp.nodes.find((x) => x.id === map.get(n.id));
          c.parent = map.get(c.parent) || null;
          if (!c.parent) {
            c.frame.x += dx;
            c.frame.y += dy;
          }
        });
        clipboard.links.forEach((l) =>
          sp.links.push({
            ...clone(l),
            id: uid(),
            from: { ...l.from, node: map.get(l.from.node) },
            to: { ...l.to, node: map.get(l.to.node) },
          }),
        );
        state.ui.selection = new Set(map.values());
        snapshot("Вставка фрагмента");
        refresh();
      }
      function inlineRename() {
        const n = nodeById([...state.ui.selection][0]);
        if (!n) return;
        if (n.kind === "field") {
          fieldWizard(n);
          return;
        }
        const label = nodesLayer.querySelector(`[data-id="${n.id}"] .n-label`);
        if (!label) return;
        const input = document.createElement("input");
        input.value = n.label;
        label.textContent = "";
        label.appendChild(input);
        input.focus();
        input.select();
        let done = false;
        const finish = (ok) => {
          if (done) return;
          done = true;
          if (ok && input.value.trim()) {
            n.label = input.value.trim();
            snapshot("Переименование");
          }
          renderCanvas();
          renderInspector();
        };
        input.onkeydown = (e) => {
          e.stopPropagation();
          if (e.key === "Enter") finish(true);
          if (e.key === "Escape") finish(false);
        };
        input.onblur = () => { if (!done) finish(true); };
      }
      viewport.addEventListener("dblclick", (e) => {
        if (e.target.closest("input,button,.port,.handle")) return;
        const el = e.target.closest(".node");
        if (el) {
          const n = nodeById(el.dataset.id);
          state.ui.selection = new Set([n.id]);
          if (CONTAINERS.includes(n.kind)) {
            state.ui.selection = new Set(
              spaceRef()
                .nodes.filter((c) => c.parent === n.id)
                .map((c) => c.id),
            );
            state.ui.container = n.id;
            renderCanvas();
            renderInspector();
            setHint("Внутри контейнера " + n.label + ". Esc — выйти.");
          } else inlineRename();
        }
      });
      const SHORTCUTS = [
        ["Tab", "Поиск / создание блока"],
        ["Ctrl+K", "Командная строка"],
        ["Ctrl+F", "Поиск блоков"],
        ["Ctrl+A / Esc", "Выделить всё / снять"],
        ["Ctrl+C/X/V/D", "Копировать / вырезать / вставить / дублировать"],
        ["Ctrl+Z / Ctrl+Shift+Z", "Отменить / повторить"],
        ["Delete", "Удалить выделенное"],
        ["Стрелки / Shift / Alt", "Сдвиг 1 px / шаг сетки / 0,1 px"],
        ["Shift+клик", "Добавить к выделению"],
        ["Alt+рамка", "Выделение по полному вхождению"],
        ["Space+drag / средняя кнопка", "Панорамирование"],
        ["Ctrl+колесо", "Зум к курсору"],
        ["Ctrl+0 / Ctrl+1 / Ctrl+2", "100% / вписать всё / вписать выделенное"],
        ["Двойной клик", "Войти в контейнер / переименовать / править ячейку"],
        ["F2 / Enter", "Переименовать / править"],
        ["Ctrl+Enter", "Применить значение ко всему диапазону"],
        ["Ctrl+G / Ctrl+Shift+G", "Группировать / разгруппировать"],
        ["[ / ]", "Назад / вперёд по Z"],
        ["L / H", "Блокировать / скрыть"],
        ["F1", "Справка"],
      ];
      document.addEventListener("keydown", (e) => {
        const key = e.key.toLowerCase(),
          ctrl = e.ctrlKey || e.metaKey,
          modal = $("#modal-backdrop").classList.contains("open");
        if (modal) {
          if (e.key === "Escape") {
            e.preventDefault();
            closeModal();
            return;
          }
          if (e.key === "Tab") {
            const focusable = $$(
                '#modal button,#modal input,#modal select,#modal textarea,#modal [tabindex="0"]',
              ).filter((x) => !x.disabled && x.offsetParent !== null),
              first = focusable[0],
              last = focusable.at(-1);
            if (e.shiftKey && document.activeElement === first) {
              last?.focus();
              e.preventDefault();
            } else if (!e.shiftKey && document.activeElement === last) {
              first?.focus();
              e.preventDefault();
            }
          }
          return;
        }
        if ($("#onboard").style.display === "flex") {
          if (e.key === "Escape") $("#ob-skip").click();
          return;
        }
        if (e.key === "F1") {
          e.preventDefault();
          helpDialog();
          return;
        }
        const tag = document.activeElement?.tagName;
        if (
          ["INPUT", "TEXTAREA", "SELECT"].includes(tag) ||
          document.activeElement?.isContentEditable
        ) {
          if (e.key === "Escape") document.activeElement.blur();
          return;
        }
        if (e.code === "Space") {
          spaceDown = true;
          viewport.classList.add("space");
          e.preventDefault();
          return;
        }
        if (e.key === "Escape") {
          if (gesture) finishGesture({}, true);
          else if (state.ui.container) {
            state.ui.container = null;
            state.ui.selection.clear();
          } else {
            state.ui.selection.clear();
            state.ui.selLink = null;
          }
          $$(".drawer").forEach((d) => d.classList.remove("open"));
          $("#audit").style.display = "none";
          $("#ctx").style.display = "none";
          $("#rightpanel").classList.remove("mobile-open");
          renderCanvas();
          renderInspector();
          return;
        }
        if (ctrl && key === "z") {
          e.preventDefault();
          e.shiftKey ? redo() : undo();
          return;
        }
        if (ctrl && key === "y") {
          e.preventDefault();
          redo();
          return;
        }
        if (ctrl && key === "k") {
          e.preventDefault();
          searchDialog();
          return;
        }
        if (ctrl && key === "f") {
          e.preventDefault();
          if (state.ui.module === "base") $("#base-search")?.focus();
          else searchDialog();
          return;
        }
        if (state.ui.module === "base" && state.ui.baseView === "grid") {
          if (ctrl && ["c", "x", "v"].includes(key)) {
            e.preventDefault();
            if (key === "v") pasteGrid();
            else gridClipboard(e, key === "x");
            return;
          }
          if (
            ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)
          ) {
            e.preventDefault();
            const d = {
              ArrowUp: [-1, 0],
              ArrowDown: [1, 0],
              ArrowLeft: [0, -1],
              ArrowRight: [0, 1],
            }[e.key];
            moveFocus(d[0], d[1], e.shiftKey);
            return;
          }
          if (e.key === "Tab") {
            e.preventDefault();
            moveFocus(0, e.shiftKey ? -1 : 1);
            return;
          }
          if (e.key === "Enter" || e.key === "F2") {
            e.preventDefault();
            const td = $(
              `td.cell[data-r="${state.ui.gridFocus.r}"][data-c="${state.ui.gridFocus.c}"]`,
            );
            if (td) startEdit(td);
            return;
          }
          if (e.key === "Delete") {
            e.preventDefault();
            applyFormulaToRange("");
            return;
          }
          if (ctrl && (e.key === "Home" || e.key === "End")) {
            e.preventDefault();
            setGridFocus(
              e.key === "Home" ? 0 : filteredObjects().length - 1,
              e.key === "Home" ? 0 : gridCols().length - 1,
              e.shiftKey,
            );
            return;
          }
          if (
            !ctrl &&
            !e.altKey &&
            e.key.length === 1 &&
            /[\p{L}\d=+\-]/u.test(e.key)
          ) {
            const td = $(
              `td.cell[data-r="${state.ui.gridFocus.r}"][data-c="${state.ui.gridFocus.c}"]`,
            );
            if (td) startEdit(td, e.key);
            e.preventDefault();
            return;
          }
        }
        if (!["schema", "layout"].includes(state.ui.module)) return;
        if (e.key === "Tab" && !ctrl) {
          e.preventDefault();
          searchDialog();
          return;
        }
        if (ctrl && key === "a") {
          e.preventDefault();
          state.ui.selection = new Set(
            spaceRef()
              .nodes.filter(
                (n) =>
                  !n.hidden &&
                  !n.locked &&
                  (state.ui.container
                    ? n.parent === state.ui.container
                    : !n.parent),
              )
              .map((n) => n.id),
          );
          renderCanvas();
          renderInspector();
          return;
        }
        if (ctrl && key === "d") {
          e.preventDefault();
          duplicateSelected();
          return;
        }
        if (ctrl && ["c", "x", "v"].includes(key)) {
          e.preventDefault();
          if (key === "v") pasteNodes();
          else copyNodes(key === "x");
          return;
        }
        if (ctrl && key === "g") {
          e.preventDefault();
          e.shiftKey ? ungroupSelected() : groupSelected();
          return;
        }
        if (ctrl && ["0", "1", "2"].includes(key)) {
          e.preventDefault();
          key === "0" ? zoomCenter(1) : fitAll(key === "2");
          return;
        }
        if (e.key === "Delete" || e.key === "Backspace") {
          e.preventDefault();
          deleteSelected();
          return;
        }
        if (e.key === "F2" || e.key === "Enter") {
          e.preventDefault();
          inlineRename();
          return;
        }
        if (key === "l" || key === "h") {
          toggleNodeFlag(key === "l" ? "locked" : "hidden");
          return;
        }
        if (e.key === "[" || e.key === "]") {
          const sp = spaceRef();
          [...state.ui.selection]
            .map(nodeById)
            .filter(Boolean)
            .forEach((n) => (n.z = (n.z || 0) + (e.key === "]" ? 1 : -1)));
          snapshot("Порядок блоков");
          refresh();
          return;
        }
        if (
          ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)
        ) {
          e.preventDefault();
          const step = e.shiftKey ? state.ui.gridStep : e.altKey ? 0.1 : 1,
            d = {
              ArrowUp: [0, -step],
              ArrowDown: [0, step],
              ArrowLeft: [-step, 0],
              ArrowRight: [step, 0],
            }[e.key];
          [...state.ui.selection]
            .map(nodeById)
            .filter((n) => n && !n.locked)
            .forEach((n) => {
              n.frame.x += d[0];
              n.frame.y += d[1];
            });
          renderCanvas();
          clearTimeout(window.arrowTimer);
          window.arrowTimer = setTimeout(
            () => snapshot("Сдвиг стрелками"),
            250,
          );
        }
      });
      document.addEventListener("keyup", (e) => {
        if (e.code === "Space") {
          spaceDown = false;
          viewport.classList.remove("space");
        }
      });
      document.addEventListener("click", (e) => {
        if (!e.target.closest("#ctx")) $("#ctx").style.display = "none";
        if (!e.target.closest("#audit,[data-audit]"))
          $("#audit").style.display = "none";
      });
      $("#modal-backdrop").addEventListener("mousedown", (e) => {
        if (e.target.id === "modal-backdrop") closeModal();
      });
      function updateStatusSel() {
        const ns = [...state.ui.selection].map(nodeById).filter(Boolean);
        $("#status-sel").textContent = ns.length
          ? "Выделено: " +
            ns.length +
            " · " +
            Math.round(
              Math.max(...ns.map((n) => n.frame.x + n.frame.w)) -
                Math.min(...ns.map((n) => n.frame.x)),
            ) +
            "×" +
            Math.round(
              Math.max(...ns.map((n) => n.frame.y + n.frame.h)) -
                Math.min(...ns.map((n) => n.frame.y)),
            )
          : "";
      }
      function helpDialog(section) {
        openModal(
          "Справка · RECRUIT FORGE",
          `<div class="help-tabs"><button class="btn" data-help-tab="guide">Руководство</button><button class="btn" data-help-tab="grid">Таблица объектов</button><button class="btn" data-help-tab="keys">Горячие клавиши</button><button class="btn" id="help-onboard">Обучение · 4 шага</button><button class="btn" id="help-tests">Самопроверка</button><button class="btn" id="help-log">Отчёт для разработчика</button></div><div id="help-content"></div>`,
        );
        const show = (t) => {
          $("#help-content").innerHTML =
            t === "keys"
              ? inp("key-search", "Поиск клавиш", "") +
                SHORTCUTS.map(
                  ([k, v]) =>
                    `<div class="help-key"><kbd>${esc(k)}</kbd><span>${esc(v)}</span></div>`,
                ).join("")
              : t === "grid"
                ? "<h4>Работа как в Excel</h4><p>Клик выделяет ячейку. Shift+клик или Shift+стрелки выделяют диапазон. Enter/F2 или начало ввода открывают редактор. Enter подтверждает и идёт вниз; Tab — вправо; Esc отменяет без записи истории.</p><p>Ctrl+Enter в строке формул применяет значение ко всему диапазону. Квадрат в правом нижнем углу активной ячейки заполняет соседние ячейки. Ctrl+C/X копирует TSV; Ctrl+V вставляет многострочный блок.</p><p>Формулы начинаются с =. Ссылки на поля: [S], [D]. Чужой объект: @Лазган.S. Агрегат слота: #Оружие.Стоимость. Ошибки показываются в ячейке; клик по числу открывает аудит.</p>"
                : `<h4>Схема → База → Лист → Персонаж</h4><p><b>1. Схема.</b> Добавьте поле, задайте тип и формулу. Потяните от круглого порта поля к порту плашки: связь данных немедленно изменит предпросмотр. Модификатор соедините с полем, условие — с модификатором.</p><p><b>2. База.</b> Создайте объект по схеме. Таблица редактирует реальные значения; карточки показывают результат. Удаление перемещает объект в корзину.</p><p><b>3. Лист.</b> Разместите секции и слоты. Выберите схему слота в инспекторе. Автовысота растёт по набору активного персонажа и выталкивает нижние блоки.</p><p><b>4. Персонаж.</b> Наполните слоты, меняйте количество и заметки экземпляров. Очки и ограничения проверяются сразу. Экспортируйте автономный HTML, PNG, текст или PDF через печать.</p><h4>Жесты</h4><p>Перетаскивание из палитры, двойной клик по палитре, Tab и Ctrl+K создают блоки. Space+drag — пан, Ctrl+колесо — зум. Esc отменяет жест. У контейнера доступны свободная раскладка, поток и сетка.</p><h4>Данные и безопасность</h4><p>Всё работает без сети. Автосохранение находится в localStorage этого браузера; для переноса используйте JSON или .rforge. Очистка данных браузера удалит локальные копии. Формулы разбираются собственным парсером, без eval. Изображения встраиваются в проект.</p><h4>Границы этой браузерной редакции</h4><p>SQLite, установщики Windows/Android и полная локализация не входят в один HTML. BattleScribe импортирует профили с отчётом; сложные правила нужно проверить вручную. Производительность зависит от устройства.</p>`;
          if ($("#key-search"))
            $("#key-search").oninput = (e) =>
              $$(".help-key").forEach((r) =>
                r.classList.toggle(
                  "hidden",
                  !r.textContent
                    .toLowerCase()
                    .includes(e.target.value.toLowerCase()),
                ),
              );
        };
        show(section || "guide");
        $$("[data-help-tab]").forEach(
          (b) => (b.onclick = () => show(b.dataset.helpTab)),
        );
        $("#help-onboard").onclick = () => {
          closeModal();
          startOnboard();
        };
        $("#help-tests").onclick = () => {
          const results = selfTest();
          $("#help-content").innerHTML =
            "<h4>Самопроверка ядра</h4>" +
            results
              .map(
                (r) =>
                  `<div class="val-item ${r.ok ? "ok" : "err"}">${r.ok ? "✓" : "✕"} ${esc(r.name)}<small>${esc(r.detail)}</small></div>`,
              )
              .join("");
        };
        $("#help-log").onclick = () =>
          download(
            JSON.stringify(
              {
                date: new Date().toISOString(),
                errors: errorLog,
                format: state.model.format,
                userAgent: navigator.userAgent,
              },
              null,
              2,
            ),
            "rforge-diagnostics.json",
            "application/json",
          );
      }
      function openHelp() {
        helpDialog();
      }
      /* Built-in deterministic checks, callable from help. */
      function selfTest() {
        const results = [],
          test = (name, fn) => {
            try {
              const detail = fn();
              results.push({ name, ok: true, detail: String(detail ?? "OK") });
            } catch (e) {
              results.push({ name, ok: false, detail: e.message });
            }
          },
          assert = (v, m = "Проверка не пройдена") => {
            if (!v) throw Error(m);
          };
        test("Парсер: приоритет и скобки", () =>
          assert(num(Expr.run("=2+3*4", context(null))) === 14));
        test("Сравнения и логика", () =>
          assert(num(Expr.run("=2<3 AND NOT 0", context(null))) === 1));
        test("Функции и округление", () =>
          assert(num(Expr.run("=ROUND(AVG(1,2,3),1)", context(null))) === 2));
        test("Запрет неизвестных функций", () =>
          assert(Expr.run("=ALERT(1)", context(null)).err));
        test("Деление на ноль", () =>
          assert(Expr.run("=1/0", context(null)).err === "#ДЕЛ0"));
        test("Лимит длины формулы", () =>
          assert(
            Expr.run("=" + Array(2002).fill("1").join("+"), context(null)).err,
          ));
        test("Кубы: среднее 2D6", () => assert(dice("2D6").avg === 7));
        const s = schema(),
          o = previewObject();
        if (o)
          test("Живые значения и аудит", () => {
            const f = s.fields.find((f) => f.type === "number");
            const r = computeField(s, o, f.name, true);
            assert(!r.value.err);
            assert(r.trail.length > 0);
            return f.name + " = " + r.value;
          });
        test("Связи: допустимость данных", () =>
          assert(
            linkTypeFor(
              { kind: "field", id: "a" },
              "out",
              { kind: "stat", id: "b" },
              "data-in",
            ) === "data",
          ));
        test("Связи: запрет несовместимых", () =>
          assert(
            linkTypeFor(
              { kind: "modifier", id: "a" },
              "out",
              { kind: "tags", id: "b" },
              "data-in",
            ) === null,
          ));
        test("JSON round-trip", () =>
          assert(
            stable(JSON.parse(stable(state.model))) === stable(state.model),
          ));
        test("14 контролов имеют привязку", () => {
          assert(CONTROLS.length === 14);
          CONTROLS.forEach((c) =>
            assert(c.apply && c.target && $("#ctrl-" + c.id)),
          );
          return "14 / 14";
        });
        test("Якоря: растягивание и отступ (КЛ-04)", () => {
          const l = mkLayout("Тест якорей"),
            sec = l.nodes.find((n) => CONTAINERS.includes(n.kind)) || l.nodes[0],
            kid = mkNode("stat", 10, 10);
          kid.parent = sec.id;
          l.nodes.push(kid);
          sec.frame.w = 400; sec.frame.h = 300;
          setAnchor(kid, "left", true, l);
          setAnchor(kid, "right", true, l);
          setAnchor(kid, "top", true, l);
          kid.props.anchorMargin = { l: 10, r: 10, t: 10, b: 10 };
          applyAnchors(l);
          assert(kid.frame.x === 10 && kid.frame.w === 380, "растягивание по ширине");
          sec.frame.w = 600;
          applyAnchors(l);
          assert(kid.frame.w === 580 && kid.frame.y === 10, "пересчёт при росте родителя");
          setAnchor(kid, "bottom", true, l);
          assert(kid.frame.h === 300 - kid.frame.y - anchorMargin(kid).b, "растягивание по высоте");
          return "w=" + kid.frame.w + " h=" + kid.frame.h;
        });
        test("Кнопки: контракт привязки (ПР-08)", () => {
          const bad = buttonContract();
          assert(!bad.length, "Без обработчика: " + bad.join(", "));
          return "все кнопки привязаны";
        });
        test("Каталог: 14 визуальных + 4 служебных", () =>
          assert(Object.keys(KINDS).length === 18));
        test("Экранирование пользовательского HTML", () =>
          assert(esc("<img onerror=alert(1)>").includes("&lt;")));
        test("Циклические формулы не зависают", () => {
          const a = mkSchema("Цикл", "empty"),
            f1 = field("A", "calc", "0", "=[B]"),
            f2 = field("B", "calc", "0", "=[A]");
          a.fields.push(f1, f2);
          const obj = {
            id: uid(),
            schema: a.id,
            name: "Тест",
            values: {},
            tags: [],
          };
          const prev = state.model.schemas;
          state.model.schemas.push(a);
          const r = computeField(a, obj, "A");
          state.model.schemas = prev;
          invalidate();
          assert(r.value.err?.includes("#ЦИКЛ"));
          return r.value.err;
        });
        return results;
      }
      /* First-run tour. */
      const OB = [
        [
          "Палитра",
          "Слева — строительные блоки и объекты. Перетащите блок на холст или нажмите на него. Поиск сверху фильтрует библиотеку.",
        ],
        [
          "Холст",
          "Структура рисуется мышью. Потяните от порта к совместимому порту: линия немедленно создаёт зависимость.",
        ],
        [
          "Инспектор и предпросмотр",
          "Справа уточняются свойства. Вкладка предпросмотра показывает настоящий объект; клик по числу раскрывает аудит.",
        ],
        [
          "Готовый лист",
          "Перейдите в Персонаж: наполните слоты, проверьте очки и экспортируйте результат. Все настройки вида внизу работают и сохраняются.",
        ],
      ];
      let obI = 0;
      function startOnboard() {
        obI = 0;
        $("#onboard").style.display = "flex";
        showOb();
      }
      function showOb() {
        $("#ob-title").textContent = obI + 1 + " / 4 · " + OB[obI][0];
        $("#ob-text").textContent = OB[obI][1];
        $("#ob-next").textContent = obI === 3 ? "Начать работу" : "Далее";
        $$(".ob-focus").forEach((el) => el.classList.remove("ob-focus"));
        [$("#palette"), $("#canvas-wrap"), $("#rightpanel"), $("#ctrlpanel")][
          obI
        ]?.classList.add("ob-focus");
      }
      function finishOnboard() {
        $("#onboard").style.display = "none";
        $$(".ob-focus").forEach((el) => el.classList.remove("ob-focus"));
        try {
          localStorage.setItem("rforge.onboard", "1");
        } catch {}
      }
      $("#ob-next").onclick = () => {
        if (obI === 3) finishOnboard();
        else {
          obI++;
          showOb();
        }
      };
      $("#ob-skip").onclick = finishOnboard;
      /* Bootstrap and recovery. */
      function originalAddShellButtons() {
        const actions = $(".hdr-actions"),
          tools = document.createElement("div");
        tools.className = "header-tools";
        tools.innerHTML =
          '<button class="icon-btn" id="btn-undo" title="Отменить · Ctrl+Z">↶</button><button class="icon-btn" id="btn-redo" title="Повторить · Ctrl+Shift+Z">↷</button><button class="icon-btn" id="btn-backups" title="Резервные копии">▣</button><button class="icon-btn" id="btn-locale" title="Переключить язык интерфейса">RU</button><button class="icon-btn" id="btn-simple" title="Простой / расширенный режим">Базовый</button><span id="save-state" class="muted">Локально</span>';
        actions.prepend(tools);
        $("#btn-undo").onclick = undo;
        $("#btn-redo").onclick = redo;
        $("#btn-backups").onclick = backupDialog;
        $("#btn-simple").onclick = () => {
          state.ui.simple = !state.ui.simple;
          $("#btn-simple").textContent = state.ui.simple
            ? "Базовый"
            : "Расширенный";
          renderPalette();
          toast(
            state.ui.simple
              ? "Базовый режим: 6 основных блоков"
              : "Расширенный режим: все блоки",
            "info",
          );
        };
        $("#btn-locale").onclick = toggleLocale;
        const close = document.createElement("button");
        close.className = "drawer-close";
        close.textContent = "×";
        close.title = "Закрыть панель";
        $$(".drawer").forEach((d) => {
          const b = close.cloneNode(true);
          b.onclick = () => d.classList.remove("open");
          d.prepend(b);
        });
        const extra = $("#grid-toolbar");
        $("#formula-bar").insertAdjacentHTML(
          "beforeend",
          '<button class="tb-btn" id="grid-apply-range" title="Применить ко всему диапазону · Ctrl+Enter">⇥ Диапазон</button>',
        );
        $("#grid-apply-range").onclick = () =>
          applyFormulaToRange($("#formula-input").value);
      }
      const EN = {
        Схемы: "Schemas",
        База: "Database",
        Лист: "Layout",
        Персонаж: "Roster",
        Инспектор: "Inspector",
        Предпросмотр: "Preview",
        Валидация: "Validation",
        "История операций": "Operation history",
        "Зум холста": "Canvas zoom",
        "Шаг сетки": "Grid step",
        "Радиус магнита": "Magnet radius",
        "Скругление блоков": "Block radius",
        "Плотность (gap)": "Density (gap)",
        "Масштаб шрифта": "Font scale",
        "Оттенок палитры": "Accent hue",
        "Глубина теней": "Shadow depth",
        "Кривизна связей": "Link curvature",
        "Размер портов": "Port size",
        Тема: "Theme",
        Привязка: "Snap",
        Направляющие: "Guides",
        Автопоток: "Auto flow",
        "⟲ Сброс вида": "⟲ Reset view",
        "＋ Случайный объект": "＋ Random object",
        "⇩ Экспорт": "⇩ Export",
        "⇧ Импорт проекта": "⇧ Import project",
        "? Справка": "? Help",
        "⧗ История": "⧗ History",
      };
      const ruText = new Map();
      function toggleLocale() {
        state.ui.locale = state.ui.locale === "ru" ? "en" : "ru";
        $("#btn-locale").textContent = state.ui.locale.toUpperCase();
        document.documentElement.lang = state.ui.locale;
        const walk = document.createTreeWalker(
          document.body,
          NodeFilter.SHOW_TEXT,
          {
            acceptNode: (n) =>
              ["SCRIPT", "STYLE", "INPUT", "TEXTAREA"].includes(
                n.parentElement.tagName,
              )
                ? NodeFilter.FILTER_REJECT
                : NodeFilter.FILTER_ACCEPT,
          },
        );
        const nodes = [];
        while (walk.nextNode()) nodes.push(walk.currentNode);
        nodes.forEach((n) => {
          const text = n.textContent.trim();
          if (!ruText.has(n)) ruText.set(n, n.textContent);
          const orig = ruText.get(n);
          n.textContent =
            state.ui.locale === "en" && EN[text]
              ? orig.replace(text, EN[text])
              : orig;
        });
        CONTROLS.forEach((c) => {
          const label = $("#ctrl-" + c.id)
            ?.closest(".ctrl")
            .querySelector("label");
          if (label) {
            const text =
              state.ui.locale === "en" ? EN[c.label] || c.label : c.label;
            label.firstChild.textContent = text;
          }
        });
        state.model.settings.locale = state.ui.locale;
        snapshot("Язык интерфейса");
        toast(
          state.ui.locale === "en"
            ? "Navigation and view controls: English. Detailed wizards remain Russian."
            : "Русский интерфейс",
          "info",
        );
      }
/* Iteration 2: transactional geometry, live slots, faithful exports, responsive shell.
   All corrections are local; no network, libraries, eval or new Function. */
function expressionSources(s=schema()) {
 const out=[];
 s.fields.forEach(f=>out.push({label:'Поле '+f.name,get:()=>f.formula||'',set:v=>f.formula=v}));
 s.nodes.forEach(n=>['expr','condition'].forEach(k=>{if(n.props[k]!==undefined)out.push({label:n.label+' · '+k,get:()=>n.props[k],set:v=>n.props[k]=v});}));
 s.nodes.forEach(n=>{if(n.condition!==undefined)out.push({label:n.label+' · видимость',get:()=>n.condition||'',set:v=>n.condition=v});});
 s.links.forEach(l=>out.push({label:'Связь '+l.id,get:()=>l.props.condition||'',set:v=>l.props.condition=v}));
 objectsOfSchema(s).forEach(o=>s.fields.forEach(f=>{if(typeof o.values[f.id]==='string'&&o.values[f.id].startsWith('='))out.push({label:o.name+' / '+f.name,get:()=>o.values[f.id],set:v=>o.values[f.id]=v});}));
 return out;
}
function rewriteSchemaReferences(s,oldName,newName,fieldId) {
 expressionSources(s).forEach(x=>x.set(rewriteField(x.get(),oldName,newName)));
 s.nodes.forEach(n=>{if(n.props.field===oldName)n.props.field=newName;if(n.kind==='field'&&n.props.fieldId===fieldId)n.label=newName;if(n.kind==='table'&&Array.isArray(n.props.fields))n.props.fields=n.props.fields.map(x=>x===oldName?newName:x);});
}
function layoutAll(){state.model.layouts.forEach(l=>autoLayout(l));}
function snapshot(label){
 layoutAll();const data=projectData();
 if(histIdx>=0&&stable(history[histIdx].data)===stable(data))return;
 history=history.slice(0,histIdx+1);history.push({label,data,t:new Date().toLocaleTimeString()});if(history.length>100)history.shift();histIdx=history.length-1;
 invalidate();state.ui.dirty=true;renderHistory();clearTimeout(autosaveTimer);autosaveTimer=setTimeout(saveLocal,500);
}
function projectData(){
 const m=clone(state.model);m.settings.view={...clone(state.ui.views),[state.ui.module]:clone(state.ui.view)};
 m.settings.controls=Object.fromEntries(CONTROLS.map(c=>[c.id,c.get()]));
 m.settings.filters=Object.fromEntries(['baseSearch','baseTag','baseFolder','baseFavorite','baseSort','linkFilter','showRules','compact','simple','locale','activeSchema','activeLayout','activeRoster','baseView','snapEdges','snapCenters','snapEqual','minimap'].map(k=>[k,state.ui[k]]));
 return m;
}
function applySettings(settings={}){
 if(settings.filters)for(const k of ['baseSearch','baseTag','baseFolder','baseFavorite','baseSort','linkFilter','showRules','compact','simple','locale','baseView','snapEdges','snapCenters','snapEqual','minimap'])if(settings.filters[k]!==undefined)state.ui[k]=settings.filters[k];
 ['activeSchema','activeLayout','activeRoster'].forEach(k=>{if(Number.isInteger(settings.filters?.[k]))state.ui[k]=settings.filters[k];});fixIndices();
 state.ui.views=clone(settings.view||{});state.ui.view=clone(state.ui.views[state.ui.module]||{x:30,y:30,zoom:1});
 CONTROLS.forEach(c=>{const v=settings.controls?.[c.id]??settings.view?.[c.id];if(v!==undefined)c.apply(c.id==='zoom'?state.ui.view.zoom*100:v);});
 setTheme(settings.theme||state.model.settings.theme||'Кузня');syncControls();applyView();
}
function restoreHistory(i){
 if(i<0||i>=history.length)return;histIdx=i;state.model=normalize(clone(history[i].data));applySettings(state.model.settings);state.ui.selection.clear();state.ui.selLink=null;invalidate();refresh();saveLocal();
}
function saveLocal(){
 try{localStorage.setItem('rforge.autosave',JSON.stringify({model:projectData(),saved:new Date().toISOString()}));state.ui.dirty=false;$('#save-state').textContent='Сохранено локально';}
 catch(e){$('#save-state').textContent='Сохраните файл';if(!saveWarned){toast('Автосохранение недоступно. Экспортируйте проект в файл.','err');saveWarned=true;}}
}
function refresh(){invalidate();layoutAll();buildToolbar();renderPalette();renderCanvas();renderBase();renderChar();renderInspector();renderCrumbs();validate();updateStatusSel();syncControls();}
/* КЛ-04: anchors — блок привязан к краям родителя и растягивается вместе с ним. */
const ANCHOR_SIDES=['left','right','top','bottom'];
function anchorMargin(n){const m=n.props.anchorMargin||{};return {l:+m.l||0,r:+m.r||0,t:+m.t||0,b:+m.b||0};}
function setAnchor(n,side,on,sp=spaceRef()){
 if(!ANCHOR_SIDES.includes(side))return false;
 const a={...(n.props.anchors||{})},m=anchorMargin(n),p=sp.nodes.find(x=>x.id===n.parent),pw=p?p.frame.w:sp.canvas.w,ph=p?p.frame.h:sp.canvas.h;
 if(on){ // запоминаем текущий отступ от выбранного края как якорный
  if(side==='left')m.l=n.frame.x; if(side==='right')m.r=pw-n.frame.x-n.frame.w;
  if(side==='top')m.t=n.frame.y; if(side==='bottom')m.b=ph-n.frame.y-n.frame.h;
 }
 a[side]=!!on; n.props.anchors=a; n.props.anchorMargin=m; applyAnchors(sp); return true;
}
function applyAnchors(sp){
 if(!sp)return 0; let changed=0;
 const order=[...sp.nodes].sort((a,b)=>depth(a,sp)-depth(b,sp));
 for(const n of order){
  const a=n.props.anchors; if(!a||n.locked)continue;
  const p=sp.nodes.find(x=>x.id===n.parent); if(n.parent&&!p)continue;
  const pw=p?p.frame.w:sp.canvas.w,ph=p?p.frame.h:sp.canvas.h,m=anchorMargin(n),min=KINDS[n.kind]?.min||[24,24];
  let {x,y,w,h}=n.frame;
  if(a.left&&a.right){x=m.l;w=Math.max(min[0],pw-m.l-m.r);}
  else if(a.left)x=m.l; else if(a.right)x=pw-m.r-w;
  if(a.top&&a.bottom){y=m.t;h=Math.max(min[1],ph-m.t-m.b);}
  else if(a.top)y=m.t; else if(a.bottom)y=ph-m.b-h;
  if(x!==n.frame.x||y!==n.frame.y||w!==n.frame.w||h!==n.frame.h){Object.assign(n.frame,{x,y,w,h});changed++;}
 }
 return changed;
}
function anchorMenuItems(n,sp=spaceRef()){
 const a=n.props.anchors||{};
 return ANCHOR_SIDES.map(s=>({label:(a[s]?'✓ ':'')+({left:'Якорь: левый край',right:'Якорь: правый край',top:'Якорь: верх',bottom:'Якорь: низ'})[s],fn:()=>{setAnchor(n,s,!a[s],sp);snapshot('Якоря');refresh();}}));
}
function anchorInspector(n){
 const a=n.props.anchors||{},m=anchorMargin(n),box=s=>`<label class="check-row"><input type="checkbox" id="i-anch-${s}" ${a[s]?'checked':''}> ${({left:'к левому краю',right:'к правому краю',top:'к верху',bottom:'к низу'})[s]}</label>`;
 const both=(a.left&&a.right)||(a.top&&a.bottom);
 return `<div class="insp-section"><h4>Якоря</h4><div class="insp-grid">${ANCHOR_SIDES.map(box).join('')}</div>${inp('i-anch-margin','Отступ от края',m.l,'number','min="0"')}<small class="muted">${both?'Два противоположных якоря — блок растягивается по родителю.':'Один якорь — блок держит отступ при изменении родителя.'}</small></div>`;
}
function autoLayout(sp){
 const previous=sp.nodes.map(n=>({id:n.id,y:n.frame.y,h:n.frame.h}));
 for(let pass=0;pass<20;pass++){
  let changed=false;const order=[...sp.nodes].sort((a,b)=>depth(b,sp)-depth(a,sp));
  for(const n of order){
   if(!CONTAINERS.includes(n.kind)||n.hidden)continue;
   const kids=sp.nodes.filter(c=>c.parent===n.id&&!c.hidden),gap=Math.max(0,+n.props.gap||0),pad=+n.props.padding||0;
   if(n.kind==='slot'&&n.props.autoHeight){const s=state.model.schemas.find(s=>s.id===n.props.sourceSchema),as=activeAssign(n.id),cols=clamp(+n.props.cols||1,1,8),rows=[];
    as.forEach((a,i)=>{const o=state.model.objects.find(o=>o.id===a.objectId&&!o.deleted);const h=o?slotCardHeight(n,s,o,a):45;const r=Math.floor(i/cols);rows[r]=Math.max(rows[r]||0,h);});
    const h=Math.max(KINDS.slot.min[1],40+pad*2+(rows.length?rows.reduce((a,b)=>a+b,0)+(rows.length-1)*gap:55));if(n.frame.h!==h){n.frame.h=h;changed=true;}
   }
   const mode=n.layoutMode||n.props.layoutMode;
   if(['flow','grid'].includes(mode)){
    const cols=mode==='grid'?clamp(+n.props.cols||2,1,12):n.kind==='row'?Math.max(1,kids.length):1,cw=Math.max(40,(n.frame.w-pad*2-gap*(cols-1))/cols);let y=32+pad,rowH=0;
    kids.forEach((c,i)=>{const col=i%cols;if(col===0&&i){y+=rowH+gap;rowH=0;}c.frame.x=pad+col*(cw+gap);c.frame.y=y;c.frame.w=cw;rowH=Math.max(rowH,c.frame.h);});
    if(n.props.autoHeight){const h=Math.max(KINDS[n.kind].min[1],y+rowH+pad);if(h!==n.frame.h){n.frame.h=h;changed=true;}}
   }else if(n.props.autoHeight&&n.kind!=='slot'){const h=Math.max(KINDS[n.kind].min[1],32+pad+Math.max(0,...kids.map(c=>c.frame.y+c.frame.h)));if(h!==n.frame.h){n.frame.h=h;changed=true;}}
  }
  if(applyAnchors(sp))changed=true;
  if(state.ui.autoflow){
   const roots=sp.nodes.filter(n=>!n.parent&&!n.hidden&&!n.locked&&!(n.props.anchors?.top||n.props.anchors?.bottom)).sort((a,b)=>a.frame.y-b.frame.y);
   for(let i=0;i<roots.length;i++)for(let j=0;j<i;j++){const a=roots[j],b=roots[i];if(b.frame.x<a.frame.x+a.frame.w&&b.frame.x+b.frame.w>a.frame.x&&b.frame.y<a.frame.y+a.frame.h+gapValue()){const d=a.frame.y+a.frame.h+gapValue()-b.frame.y;if(d>0){b.frame.y+=d;changed=true;}}}
  }
  if(!changed)break;
 }
}
function gapValue(){return parseFloat(cssVar('--gap'))||10;}
function slotCardHeight(n,s,o,a){
 if(!o||!s)return 45;if(n.props.view==='compact'||state.ui.compact)return 82+(a.notes?22:0);
 const visual=s.nodes.filter(x=>VISUAL.includes(x.kind)&&!x.hidden),roots=visual.filter(x=>!x.parent||!visual.some(y=>y.id===x.parent));
 const h=Math.max(70,...roots.map(x=>x.frame.h));return h+76+(a.notes?22:0);
}
function reparent(n,parent,sp=spaceRef(),point=null){
 if(parent===n.id||(parent&&isDescendant(parent,n.id,sp)))return false;
 const old=worldFrame(n,sp),p=sp.nodes.find(x=>x.id===parent);if(parent&&(!p||!CONTAINERS.includes(p.kind)))return false;
 sp.links=sp.links.filter(l=>!(l.type==='contains'&&l.to.node===n.id));n.parent=parent||null;const pf=p?worldFrame(p,sp):{x:0,y:0};n.frame.x=old.x-pf.x;n.frame.y=old.y-pf.y;
 if(!parent&&point){n.frame.x=point.x;n.frame.y=point.y;}if(p)sp.links.push(link(p,'contains-out',n,'contains-in','contains'));return true;
}
function visibleNode(n,sp=spaceRef(),obj=null){
 if(n.hidden)return false;let cur=n,g=0;const s=state.model.schemas.find(s=>s.nodes.includes(n))||schema();
 while(cur&&g++<100){if(cur.hidden||(cur.condition&&!truth(cur.condition,obj)))return false;if(!cur.parent)break;cur=sp.nodes.find(x=>x.id===cur.parent);}
 if(g>=100)return false;
 return !sp.links.filter(l=>l.type==='condition'&&l.to.node===n.id).some(l=>{const c=sp.nodes.find(x=>x.id===l.from.node);return c&&!conditionValue(c,obj,s);});
}
function renderCanvas(){
 if(!['schema','layout'].includes(state.ui.module))return;const sp=spaceRef();nodesLayer.innerHTML='';linkSvg.innerHTML='';overlay.innerHTML='';if(!sp)return;
 world.style.width=sp.canvas.w+'px';world.style.height=sp.canvas.h+'px';linkSvg.setAttribute('width',sp.canvas.w+4000);linkSvg.setAttribute('height',sp.canvas.h+4000);
 linkSvg.innerHTML='<defs>'+Object.entries(LINKS).map(([k,v])=>`<marker id="arrow-${k}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" fill="${v.color}"/></marker>`).join('')+'</defs>';
 sp.links.forEach(l=>{
  if(state.ui.linkFilter==='selected'&&!state.ui.selection.has(l.from.node)&&!state.ui.selection.has(l.to.node))return;
  if(state.ui.linkFilter==='data'&&l.type!=='data'||state.ui.linkFilter==='modifiers'&&!['modifies','condition'].includes(l.type))return;
  const a=sp.nodes.find(n=>n.id===l.from.node),b=sp.nodes.find(n=>n.id===l.to.node);if(!a||!b)return;
  const p=document.createElementNS('http://www.w3.org/2000/svg','path');p.setAttribute('d',linkPath(l));p.setAttribute('stroke',LINKS[l.type].color);p.setAttribute('marker-end',`url(#arrow-${l.type})`);p.dataset.id=l.id;p.classList.toggle('sel',state.ui.selLink===l.id);
  p.addEventListener('pointerdown',e=>{e.stopPropagation();state.ui.selection.clear();state.ui.selLink=l.id;state.ui.rpTab='insp';renderCanvas();renderInspector();});
  p.addEventListener('contextmenu',e=>{e.preventDefault();state.ui.selLink=l.id;showCtx(e.clientX,e.clientY,[{label:'Настройки связи',fn:()=>{state.ui.rpTab='insp';renderInspector();$('#rightpanel').classList.add('mobile-open');}},{label:'Удалить связь',hk:'Delete',fn:deleteSelected}]);});linkSvg.appendChild(p);
 });
 const paint=(n,obj=null)=>{if(!visibleNode(n,sp,obj))return;nodesLayer.appendChild(buildNodeEl(n,sp,obj));sp.nodes.filter(c=>c.parent===n.id).sort((a,b)=>(a.z||0)-(b.z||0)).forEach(c=>paint(c,obj));};
 sp.nodes.filter(n=>!n.parent).sort((a,b)=>(a.z||0)-(b.z||0)).forEach(n=>paint(n));applyView();updateStatusSel();
}
function nodePreviewContent(n,sp=spaceRef(),obj=null,result=false){
 const s=nodeSchema(n),o=obj||(state.ui.module==='layout'?objectsOfSchema(s)[0]:previewObject()),f=s.fields.find(f=>f.id===n.bind)||fieldByName(s,n.props.field),fn=f?.name,v=fn&&o?displayValue(s,o,fn):'—';
 if(n.kind==='slot'){
  const sc=state.model.schemas.find(s=>s.id===n.props.sourceSchema),as=activeAssign(n.id),cols=clamp(+n.props.cols||1,1,8),gap=+n.props.gap||8,width=(n.frame.w-16-gap*(cols-1))/cols;
  return `<small>Схема: ${esc(sc?.name||'не выбрана')} · ${as.reduce((n,a)=>n+a.count,0)} объектов</small><div class="slot-cards" style="grid-template-columns:repeat(${cols},minmax(0,1fr));gap:${gap}px">${as.map((a,i)=>{const o=state.model.objects.find(o=>o.id===a.objectId&&!o.deleted);return o?renderedSlotCard(sc,o,a,n,i,width,false):'<div class="missing-object">Объект в корзине</div>';}).join('')||'<div class="slot-empty">Перетащите объект сюда или нажмите ＋</div>'}</div>`;
 }
 if(n.kind==='stat'||n.kind==='number')return `<div class="stat-lbl">${esc(n.kind==='stat'?(fn||n.label):n.label)}</div><div class="${n.kind==='stat'?'stat-val':'mono value'}" data-audit="${esc(fn||'')}" data-schema="${s.id}" data-object="${o?.id||''}">${esc(v)} ${esc(n.props.unit||'')}</div>`;
 if(n.kind==='text')return `<div style="font-size:${clamp(n.props.size||14,11,24)}px;white-space:pre-wrap">${esc(fn&&o?v:n.props.static||n.label)}</div>`;
 if(n.kind==='image'){const src=safeImage(n.props.src);return src?`<img src="${esc(src)}" alt="${esc(n.label)}" style="width:100%;height:100%;object-fit:${['fill','cover','contain'].includes(n.props.fit)?n.props.fit:'contain'}">`:'<div class="image-empty">▧<small>Выберите изображение</small></div>';}
 // Existing safe renderer handles the remaining block kinds.
 return originalNodeContent(n,sp,obj,result);
}
function renderedSlotCard(s,o,a,n,index,width,interactive){
 const compact=n.props.view==='compact'||state.ui.compact;let content='';
 if(compact)content=s.fields.filter(f=>!f.removed&&['number','calc'].includes(f.type)).slice(0,6).map(f=>`<span>${esc(f.name)} <b data-live-field="${esc(f.name)}" data-s="${s.id}" data-o="${o.id}">${esc(displayValue(s,o,f.name))}</b></span>`).join(' ');
 else{
  const visual=s.nodes.filter(x=>VISUAL.includes(x.kind)),roots=visual.filter(x=>!x.parent||!visual.some(y=>y.id===x.parent));
  if(visual.length){const sx=Math.min(...roots.map(x=>x.frame.x)),sy=Math.min(...roots.map(x=>x.frame.y)),maxW=Math.max(100,...roots.map(x=>x.frame.x+x.frame.w))-sx,scale=Math.min(1,Math.max(40,width-20)/maxW),card=document.createElement('div');card.className='template-card';
   visual.forEach(nd=>{if(!visibleNode(nd,s,o))return;const el=buildNodeEl(nd,s,o,true),f=worldFrame(nd,s);el.style.left=(f.x-sx)*scale+'px';el.style.top=f.y-sy+'px';el.style.width=nd.frame.w*scale+'px';card.appendChild(el);});
   card.style.height=Math.max(70,...roots.map(x=>x.frame.h))+'px';content=card.outerHTML;
  }else content=renderSchemaCard(s,o);
 }
 return `<div class="roster-card ${compact?'compact':''}" draggable="${interactive}" data-assignment="${a.id}" data-slot="${n.id}" data-index="${index}" data-object="${o.id}" data-schema="${s.id}"><div class="roster-card-head"><b>${esc(a.alias||o.name)}</b><span class="count-badge">×${a.count}</span>${interactive?'<button data-act="edit" title="Имя и заметка экземпляра">✎</button><button data-act="dec" aria-label="Уменьшить количество">−</button><button data-act="inc" aria-label="Увеличить количество">＋</button><button data-act="rm" aria-label="Удалить">×</button>':''}</div><div class="roster-card-content">${content}</div><div class="roster-card-foot"><span>${esc(o.tags.join(' · '))}</span><b>${objectCost(o,a.count)} оч.</b></div>${a.notes?`<p class="instance-note">${esc(a.notes)}</p>`:''}</div>`;
}
function sheetHTML(r=roster(),l=state.model.layouts.find(l=>l.id===r.layout),interactive=true){
 if(!l)return '<div class="empty-state"><h4>Лист начнётся с компоновки</h4><button class="btn" onclick="setModule(\'layout\')">Создать компоновку</button></div>';
 const sp=clone(l);autoLayout(sp);const height=Math.max(sp.canvas.h,...sp.nodes.filter(n=>visibleNode(n,sp)).map(n=>worldFrame(n,sp).y+n.frame.h+40));
 let html=`<div class="sheet-canvas" style="width:${sp.canvas.w}px;height:${height}px"><div class="sheet-topline"><span>${esc(r.character.name)} · ${esc(r.character.role||'')}</span><b>${rosterTotal(r)} / ${r.limits.points} оч.</b></div>`;
 if(r.character.portrait)html+=`<img class="sheet-portrait" src="${esc(safeImage(r.character.portrait))}" alt="Портрет">`;
 const draw=(n,obj=null)=>{if(!visibleNode(n,sp,obj))return;const el=buildNodeEl(n,sp,obj,true);if(n.kind==='slot'&&interactive){const b=document.createElement('button');b.className='btn slot-fill-button';b.dataset.id=n.id;b.textContent='＋ Наполнить';b.onclick=()=>openPicker(n.id);el.appendChild(b);el.ondragover=e=>e.preventDefault();el.ondrop=e=>{e.preventDefault();const d=e.dataTransfer.getData('text/plain');if(d.startsWith('forge:object:'))addToSlot(n.id,d.slice(13));if(d.startsWith('forge:assignment:')){const [,from,id]=d.split(':'),a=r.assign[from]?.find(a=>a.id===id),o=state.model.objects.find(o=>o.id===a?.objectId);if(a&&o?.schema===n.props.sourceSchema&&from!==n.id){r.assign[from]=r.assign[from].filter(x=>x.id!==id);(r.assign[n.id]||=[]).push(a);snapshot('Перемещение между слотами');refresh();}}};}html+=el.outerHTML;sp.nodes.filter(c=>c.parent===n.id).forEach(c=>draw(c,obj));};
 sp.nodes.filter(n=>!n.parent).sort((a,b)=>(a.z||0)-(b.z||0)).forEach(n=>draw(n));return html+(r.character.notes?`<div class="sheet-notes">${esc(r.character.notes)}</div>`:'')+'</div>';
}
function renderChar(){
 if(state.ui.module!=='char')return;const r=roster(),l=state.model.layouts.find(l=>l.id===r.layout),z=state.ui.charZoom||.85,w=l?.canvas.w||900;
 $('#char-view').innerHTML=`<div class="sheet-scale" style="transform:scale(${z});width:${w*z}px;height:${Math.max(l?.canvas.h||1000,...(l?.nodes||[]).map(n=>worldFrame(n,l).y+n.frame.h+40))*z}px">${sheetHTML(r)}</div>`;
 $$('#char-view .roster-card').forEach(card=>{
  card.ondragstart=e=>e.dataTransfer.setData('text/plain','forge:assignment:'+card.dataset.slot+':'+card.dataset.assignment);
  card.ondblclick=e=>{if(e.target.closest('button'))return;const o=state.model.objects.find(o=>o.id===card.dataset.object),s=state.model.schemas.find(s=>s.id===card.dataset.schema);openObjectForm(s,o);};
  card.querySelectorAll('[data-act]').forEach(b=>b.onclick=e=>{e.stopPropagation();const a=r.assign[card.dataset.slot][+card.dataset.index],act=b.dataset.act;if(act==='edit'){assignmentDialog(a);return;}if(act==='inc')a.count++;if(act==='dec')a.count=Math.max(1,a.count-1);if(act==='rm')r.assign[card.dataset.slot].splice(+card.dataset.index,1);snapshot(act==='rm'?'Удаление из набора':'Количество экземпляров');refresh();if(act==='rm')toast('Объект убран из слота','err',undo);});
 });
 $$('#char-view [data-live-field]').forEach(el=>el.onclick=e=>auditField(state.model.schemas.find(s=>s.id===el.dataset.s),state.model.objects.find(o=>o.id===el.dataset.o),el.dataset.liveField,e));
 $$('#char-view [data-trash-restore]').forEach(b=>b.onclick=()=>{const o=state.model.objects.find(o=>o.id===b.dataset.trashRestore);if(o)o.deleted=false;snapshot('Восстановление');refresh();});
}
function exportHTML(){
 const r=roster(),l=state.model.layouts.find(l=>l.id===r.layout),content=sheetHTML(r,l,false),css=$('style').textContent;
 const doc=`<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(r.character.name)} — Recruit Forge</title><style>${css}\nhtml,body{height:auto;overflow:auto}body{padding:20px}.export-page{width:${l?.canvas.w||900}px;max-width:none;margin:auto}.sheet-canvas{margin:0}.node{box-shadow:none}.sheet-canvas .n-head{cursor:default}button{display:none!important}@media(max-width:940px){body{padding:8px;overflow:auto}}@media print{body{padding:0}.export-page{max-width:190mm}.sheet-canvas{page-break-inside:avoid}@page{size:A4;margin:12mm}}</style></head><body><main class="export-page">${content}</main></body></html>`;
 download(doc,'roster.html','text/html;charset=utf-8');toast('Автономный HTML экспортирован','ok');return doc;
}
async function exportPNG(){
 const r=roster(),l=state.model.layouts.find(l=>l.id===r.layout);if(!l)throw Error('Нет компоновки');
 try {
  const html=sheetHTML(r,l,false),doc=new DOMParser().parseFromString(html,'text/html'),canvasNode=doc.querySelector('.sheet-canvas');
  if(!canvasNode)throw Error('Лист пуст');
  const width=Math.ceil(parseFloat(canvasNode.style.width)||l.canvas.w),height=Math.ceil(parseFloat(canvasNode.style.height)||l.canvas.h);
  if(width<1||height<1||width*height*4>64000000)throw Error('Лист слишком большой для PNG');
  const cloneNode=canvasNode.cloneNode(true);cloneNode.querySelectorAll('button,.ov-badge').forEach(b=>b.remove());
  const wrapper=document.createElement('div');wrapper.setAttribute('xmlns','http://www.w3.org/1999/xhtml');
  const style=document.createElement('style');style.textContent=$('style').textContent+'button,.ov-badge{display:none!important}.node{box-shadow:none}.sheet-canvas{margin:0}';wrapper.append(style,cloneNode);
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><foreignObject width="100%" height="100%">${new XMLSerializer().serializeToString(wrapper)}</foreignObject></svg>`;
  const url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml;charset=utf-8'}));
  try{
   const img=new Image();await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Время отрисовки истекло')),12000);img.onload=()=>{clearTimeout(timer);resolve();};img.onerror=()=>{clearTimeout(timer);reject(Error('SVG-отрисовка недоступна'));};img.src=url;});
   const canvas=document.createElement('canvas');canvas.width=width*2;canvas.height=height*2;const c=canvas.getContext('2d');if(!c)throw Error('Canvas недоступен');c.scale(2,2);c.fillStyle=cssVar('--bg')||'#0E1219';c.fillRect(0,0,width,height);c.drawImage(img,0,0);
   const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw Error('PNG не создан');download(blob,'roster.png','image/png');toast('PNG экспортирован · 2× · все страницы','ok');return blob;
  }finally{URL.revokeObjectURL(url);}
 } catch(e){console.warn('PNG: совместимый режим',e);return exportPNGCanvas();}
}
function printSheet(){
 $('#print-root')?.remove();
 const root=document.createElement('div');root.id='print-root';root.innerHTML=sheetHTML(roster(),state.model.layouts.find(l=>l.id===roster().layout),false);document.body.appendChild(root);
 let cleaned=false;const cleanup=()=>{if(cleaned)return;cleaned=true;root.remove();window.removeEventListener('afterprint',cleanup);clearTimeout(timer);};
 const timer=setTimeout(cleanup,60000);window.addEventListener('afterprint',cleanup);window.print();
}
function validate(){
 const errs=originalValidate();
 state.model.rosters.forEach(r=>{const l=state.model.layouts.find(l=>l.id===r.layout);if(!l)return;const all=l.nodes.filter(n=>n.kind==='slot').flatMap(slot=>(r.assign[slot.id]||[]).map(a=>({...a,slot,object:state.model.objects.find(o=>o.id===a.objectId&&!o.deleted)})));
  state.model.schemas.forEach(s=>s.nodes.filter(n=>n.kind==='constraint').forEach(c=>{const p=c.props,linked=l.nodes.filter(n=>n.kind==='slot'&&s.links.some(link=>link.type==='constrains'&&link.from.node===c.id&&link.to.node===n.id));
   let groups=[all];if(p.scope==='slot')groups=(linked.length?linked:l.nodes.filter(n=>n.kind==='slot')).map(slot=>all.filter(a=>a.slot.id===slot.id));
   if(p.scope==='section'){const sections=l.nodes.filter(n=>['section','card'].includes(n.kind));groups=sections.map(sec=>all.filter(a=>a.slot.parent===sec.id||isDescendant(a.slot.id,sec.id,l)));}
   groups.forEach(group=>{const targets=group.filter(a=>a.object?.schema===s.id&&(!p.filterTag||a.object.tags.includes(p.filterTag))),n=targets.reduce((sum,a)=>sum+a.count,0),v=+p.value;let bad=['min','max','exactly'].includes(p.rule)?(p.rule==='min'?n<v:p.rule==='max'?n>v:n!==v):false;
    if(['atLeastPer','atMostPer'].includes(p.rule)){const per=Math.max(1,+p.per||1),units=Math.max(1,Math.ceil(group.reduce((sum,a)=>sum+a.count,0)/per));bad=p.rule==='atLeastPer'?n<v*units:n>v*units;}
    if(p.rule==='requires')bad=n>0&&!group.some(a=>a.object?.tags.includes(String(p.value)));
    if(p.rule==='forbiddenWith')bad=n>0&&group.some(a=>a.object?.tags.includes(String(p.value)));
    if(bad){const old=errs.findIndex(e=>e.src===c.label&&e.msg.startsWith(r.name+':'));const item={sev:'err',msg:`${r.name}: ${p.message||c.label+' · '+p.rule+' '+p.value} (сейчас ${n})`,src:c.label,go:()=>{state.ui.activeSchema=state.model.schemas.indexOf(s);focusNode(c.id);},fix:p.rule==='max'?()=>{let remaining=Math.max(0,n-v);for(const a of targets){if(remaining<=0)break;const take=Math.min(remaining,a.count);a.count-=take;remaining-=take;if(a.count===0)r.assign[a.slot.id]=r.assign[a.slot.id].filter(x=>x.id!==a.id);}snapshot('Исправление ограничения');refresh();}:undefined};if(old>=0)errs[old]=item;else errs.push(item);}
   });
  }));
 });
 const badge=$('#err-badge');badge.className='err-badge '+(errs.some(e=>e.sev==='err')?'bad':'ok');badge.textContent=(errs.length?'⚠ ':'✓ ')+errs.length;badge.title=errs.filter(e=>e.sev==='err').length+' ошибок, '+errs.filter(e=>e.sev==='warn').length+' предупреждений';
 $('#val-list').innerHTML=errs.map((e,i)=>`<div class="val-item ${e.sev}">${esc(e.msg)}<small>${esc(e.src)}</small><div class="button-row">${e.go?`<button class="mini-action" data-val-go="${i}">Перейти →</button>`:''}${e.fix?`<button class="mini-action" data-val-fix="${i}">Исправить</button>`:''}</div></div>`).join('')||'<div class="empty-state">✓ Ошибок нет. Ростер валиден.</div>';
 $$('[data-val-go]').forEach(b=>b.onclick=()=>errs[+b.dataset.valGo].go?.());$$('[data-val-fix]').forEach(b=>b.onclick=()=>errs[+b.dataset.valFix].fix?.());return errs;
}
function graphDialog(){
 const rows=[];state.model.schemas.forEach(s=>{s.fields.filter(f=>!f.removed).forEach(f=>Expr.refs(f.formula).forEach(r=>rows.push({from:r,to:f.name,op:'формула',s})));s.links.filter(l=>['modifies','derive','data','condition','constrains'].includes(l.type)).forEach(l=>{const a=s.nodes.find(n=>n.id===l.from.node),b=s.nodes.find(n=>n.id===l.to.node);if(a&&b)rows.push({from:a.label,to:b.label,op:LINKS[l.type].label,s,id:a.id});});});
 openModal('Граф зависимостей · Derived',`<p class="muted">Автогенерируется из формул и связей. Только чтение. Клик открывает источник.</p><div class="graph-list">${rows.map((r,i)=>`<button class="pick-row" data-graph="${i}"><b>${esc(r.from)}</b><span>→ ${esc(r.op)} →</span><b>${esc(r.to)}</b><small>${esc(r.s.name)}</small></button>`).join('')||'<div class="empty-state">Создайте формулу или связь, чтобы увидеть зависимости.</div>'}</div>`);
 $$('[data-graph]').forEach(b=>b.onclick=()=>{const r=rows[+b.dataset.graph];state.ui.activeSchema=state.model.schemas.indexOf(r.s);closeModal();setModule('schema');const n=schema().nodes.find(n=>n.id===r.id||n.label===r.from);if(n)focusNode(n.id);});return rows;
}
function addShellButtons(){
 originalAddShellButtons();const tools=$('.header-tools');$('#btn-locale').remove();
 const pal=document.createElement('button');pal.id='btn-palette';pal.className='icon-btn';pal.textContent='☰';pal.title='Показать / скрыть палитру';pal.onclick=()=>{$('#palette').classList.toggle('mobile-open');pal.setAttribute('aria-expanded',String($('#palette').classList.contains('mobile-open')));};$('header').prepend(pal);
 const insp=document.createElement('button');insp.id='btn-inspector';insp.className='icon-btn';insp.textContent='⚙';insp.title='Открыть инспектор';insp.onclick=()=>$('#rightpanel').classList.toggle('mobile-open');tools.append(insp);
 $('#btn-simple').textContent=state.ui.simple?'Базовый':'Расширенный';$('#btn-simple').onclick=()=>{state.ui.simple=!state.ui.simple;$('#btn-simple').textContent=state.ui.simple?'Базовый':'Расширенный';renderPalette();snapshot('Режим интерфейса');toast(state.ui.simple?'Базовый режим: 6 блоков':'Расширенный режим: все блоки','info');};
 const fit=document.createElement('button');fit.id='z-fit-selection';fit.className='tb-btn';fit.textContent='⛶□';fit.title='Вписать выделенное · Ctrl+2';fit.onclick=()=>fitAll(true);$('#zoom-toolbar').append(fit);
 const mini=document.createElement('button');mini.id='z-minimap';mini.className='tb-btn';mini.textContent='▧';mini.title='Включить / отключить мини-карту';mini.onclick=()=>{state.ui.minimap=!state.ui.minimap;applyView();snapshot('Мини-карта');};$('#zoom-toolbar').append(mini);
}
/* ПР-08 / ВИ-11: каждая кнопка обязана работать. Статические кнопки оболочки
   привязываются один раз, динамические (лист персонажа) — через делегирование,
   так как sheetHTML сериализуется в строку и теряет прямые обработчики. */
function bindShellButtons(){
 $$('.modtab').forEach(t=>t.onclick=()=>setModule(t.dataset.mod));
 $$('.rp-tab').forEach(t=>t.onclick=()=>{state.ui.rpTab=t.dataset.rp;renderInspector();$('#rightpanel').classList.add('mobile-open');});
 const badge=$('#err-badge');if(badge)badge.onclick=()=>{const d=$('#drawer-val'),open=d.classList.contains('open');$$('.drawer').forEach(x=>x.classList.remove('open'));if(!open){validate();d.classList.add('open');}};
 const hist=$('#btn-history');if(hist)hist.onclick=()=>{const d=$('#drawer-hist'),open=d.classList.contains('open');$$('.drawer').forEach(x=>x.classList.remove('open'));if(!open){renderHistory();d.classList.add('open');}};
 const fs=$('#z-fit-selection');if(fs)fs.onclick=()=>{if(!state.ui.selection.size){toast('Сначала выделите блок на холсте','info');return;}fitAll(true);};
 const zv=$('#base-view-toggle');if(zv&&!zv.onclick)zv.onclick=()=>{state.ui.baseView=state.ui.baseView==='grid'?'cards':'grid';renderBase();};
 // Делегирование: кнопки внутри отрендеренного листа персонажа.
 $('#char-view').addEventListener('click',e=>{
  const fill=e.target.closest('.slot-fill-button,.slot-add');
  if(fill){e.stopPropagation();const host=fill.closest('[data-id]');if(host)openPicker(host.dataset.id);return;}
  const act=e.target.closest('[data-act]'),card=e.target.closest('.roster-card');
  if(act&&card){e.stopPropagation();const r=roster(),a=(r.assign[card.dataset.slot]||[])[+card.dataset.index];if(!a)return;
   const k=act.dataset.act;if(k==='edit'){assignmentDialog(a);return;}
   if(k==='inc')a.count++;if(k==='dec')a.count=Math.max(1,a.count-1);
   if(k==='rm')r.assign[card.dataset.slot].splice(+card.dataset.index,1);
   snapshot(k==='rm'?'Удаление из набора':'Количество экземпляров');refresh();if(k==='rm')toast('Объект убран из слота','err',undo);return;}
  const live=e.target.closest('[data-live-field]');
  if(live){auditField(state.model.schemas.find(s=>s.id===live.dataset.s),state.model.objects.find(o=>o.id===live.dataset.o),live.dataset.liveField,e);return;}
  const restore=e.target.closest('[data-trash-restore]');
  if(restore){const o=state.model.objects.find(o=>o.id===restore.dataset.trashRestore);if(o)o.deleted=false;snapshot('Восстановление');refresh();}
 });
 $('#char-view').addEventListener('dblclick',e=>{
  if(e.target.closest('button'))return;const card=e.target.closest('.roster-card');if(!card)return;
  openObjectForm(state.model.schemas.find(s=>s.id===card.dataset.schema),state.model.objects.find(o=>o.id===card.dataset.object));
 });
 // Drag&drop объектов и экземпляров в слоты листа — тоже делегированием.
 const cv=$('#char-view');
 cv.addEventListener('dragstart',e=>{const c=e.target.closest('.roster-card');if(c)e.dataTransfer.setData('text/plain','forge:assignment:'+c.dataset.slot+':'+c.dataset.assignment);});
 cv.addEventListener('dragover',e=>{if(e.target.closest('.k-slot'))e.preventDefault();});
 cv.addEventListener('drop',e=>{
  const host=e.target.closest('.k-slot');if(!host)return;e.preventDefault();
  const r=roster(),id=host.dataset.id,slot=state.model.layouts.flatMap(l=>l.nodes).find(n=>n.id===id),data=e.dataTransfer.getData('text/plain');
  if(data.startsWith('forge:object:'))addToSlot(id,data.slice(13));
  else if(data.startsWith('forge:assignment:')){const [,from,aid]=data.split(':'),a=r.assign[from]?.find(x=>x.id===aid),o=state.model.objects.find(o=>o.id===a?.objectId);
   if(a&&o?.schema===slot?.props.sourceSchema&&from!==id){r.assign[from]=r.assign[from].filter(x=>x.id!==aid);(r.assign[id]||=[]).push(a);snapshot('Перемещение между слотами');refresh();}
   else if(a)toast('Слот принимает только объекты своей схемы','err');}
 });
}
/* Автотест контракта кнопок: у каждой видимой кнопки есть обработчик. */
function buttonContract(){
 const bad=[],own=b=>{if(b.onclick||b.hasAttribute('onclick'))return true;let p=b.parentElement;while(p){if(p.id==='char-view')return true;p=p.parentElement;}return false;};
 $$('button').forEach(b=>{if(!b.offsetParent&&b.getClientRects().length===0&&!b.closest('#modal,#ctx'))return;if(!own(b)&&!b.dataset.mod&&!b.dataset.rp&&!b.closest('.node,.layer-row,#toasts'))bad.push((b.id||b.className||'button')+':'+b.textContent.trim().slice(0,24));});
 return bad;
}

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


function initialize(){
 addShellButtons();bindShellButtons();let recovered=false;
 try{const saved=JSON.parse(localStorage.getItem('rforge.autosave')||'null');if(saved?.model){state.model=normalize(saved.model);recovered=true;}}
 catch(e){errorLog.push({message:'Восстановление автосохранения: '+e.message});setTimeout(()=>toast('Автосохранение повреждено. Загружена демо-модель; проверьте резервные копии.','err'),200);}
 try{if(applyStressPack(state.model)){setTimeout(()=>toast('Стресс-пакет v'+STRESS_PACK_VERSION+': '+state.model.schemas.length+' шаблонов · '+state.model.objects.length+' объектов · '+state.model.layouts.length+' листов · '+state.model.rosters.length+' отрядов','ok'),600);}}catch(e){errorLog.push({message:'Стресс-пакет: '+e.message});}
 buildCtrlPanel();normalize(state.model);if(recovered)applySettings(state.model.settings);fixIndices();setModule('schema');layoutAll();snapshot('Исходное состояние');setTimeout(()=>fitAll(),40);
 setInterval(()=>{if(state.ui.dirty)backup('Автосохранение');saveLocal();},30000);window.addEventListener('beforeunload',saveLocal);
 new ResizeObserver(()=>{applyView();if(state.ui.module==='char')renderChar();}).observe($('#center'));
 let first=true;try{first=!localStorage.getItem('rforge.onboard')}catch{}if(first)setTimeout(startOnboard,250);
 window.RForge={state,Expr,computeField,conditionValue,linkTypeFor,stable,normalize,selfTest,CONTROLS,snapshot,undo,redo,refresh,setModule,addNodeAt,connectNodes,deleteSelected,openObjectForm,addToSlot,exportHTML,exportPNG,exportCSV,exportJSON,projectData,parseCSV,makeZip,readZip,rosterTotal,validate,fitAll,screenToWorld,zoomAt,spaceRef,fieldByName,renderGrid,filteredObjects,setGridFocus,applyFormulaToRange,fillGrid,reparent,autoLayout,worldFrame,applySettings,graphDialog,fieldWizard,renameFieldDialog,openPicker,parseProjectFile,sheetHTML,history:()=>history,histIdx:()=>histIdx,finishGesture,pasteGridText,setObjectValue,gridCells,deleteObjects,duplicateObjects,blockWizard,slotWizard,importJSON,applyView,renderCanvas,renderChar,toast,saveLocal};
}

/* =====================================================================
   Iteration 3 — многостраничность (КЛ-06/07, ПП-02/05), индикатор
   переполнения, тач-режим (АМ-06), полная локализация RU/EN (ЛК-01/02),
   экспорт BattleScribe (ХР-06, NR-17). Только локальные правки:
   без сети, библиотек, eval и new Function.
   ===================================================================== */

/* ---------------- 1. Страницы листа (КЛ-06) ---------------- */
const PAGE_FORMATS = {
  A4: { w: 794, h: 1123, css: "A4", label: "A4 · 210×297 мм" },
  Letter: { w: 816, h: 1056, css: "letter", label: "Letter · 216×279 мм" },
  A5: { w: 559, h: 794, css: "A5", label: "A5 · 148×210 мм" },
  Custom: null,
};
const isPageSpace = (sp) => !!sp && (sp.space === "layout" || state.model.layouts.includes(sp));
function pageMetrics(sp) {
  const f = PAGE_FORMATS[sp?.pageFormat] || PAGE_FORMATS.A4;
  const h = clamp(+sp?.pageHeight || +sp?.pages?.[0]?.h || f.h, 200, 20000);
  const gap = clamp(Number.isFinite(+sp?.pageGap) ? +sp.pageGap : 24, 0, 400);
  return { h, gap, w: f ? f.w : sp?.canvas?.w || 900, format: sp?.pageFormat || "A4" };
}
const pageTop = (sp, i) => { const m = pageMetrics(sp); return i * (m.h + m.gap); };
const pageAt = (sp, y) => { const m = pageMetrics(sp); return Math.max(0, Math.floor(y / (m.h + m.gap))); };
function sheetBottom(sp) {
  let b = 0;
  (sp?.nodes || []).forEach((n) => { if (n.hidden) return; const f = worldFrame(n, sp); b = Math.max(b, f.y + n.frame.h); });
  return b + 24;
}
const pageCount = (sp) => { const m = pageMetrics(sp); return Math.max(1, pageAt(sp, Math.max(0,sheetBottom(sp)-1)) + 1); };
function tallBlocks(sp) {
  const m = pageMetrics(sp);
  return sp.nodes.filter((n) => !n.parent && !n.hidden && n.frame.h > m.h - 16);
}
/* Автоперенос: блок не разрывается между страницами — целиком уходит на следующую. */
function paginate(sp) {
  if (!isPageSpace(sp) || !sp.multipage) return 0;
  const m = pageMetrics(sp);
  let moved = 0;
  for (let pass = 0; pass < 12; pass++) {
    let changed = false;
    const roots = sp.nodes.filter((n) => !n.parent && !n.hidden && !n.locked).sort((a, b) => a.frame.y - b.frame.y);
    for (const n of roots) {
      const i = pageAt(sp, n.frame.y), end = pageTop(sp, i) + m.h;
      if (n.frame.y + n.frame.h > end + 0.5 && n.frame.h <= m.h - 16) {
        n.frame.y = pageTop(sp, i + 1) + 12;
        changed = true; moved++;
      }
    }
    if (!changed) break;
  }
  const need = pageCount(sp) * (m.h + m.gap) - m.gap;
  if (sp.canvas.h < need) sp.canvas.h = need;
  return moved;
}
function fitPageWidth(sp) {
  const f = PAGE_FORMATS[sp.pageFormat];
  if (!f || !sp.canvas.w) return 0;
  const k = f.w / sp.canvas.w;
  if (Math.abs(k - 1) < 0.01) return 0;
  sp.nodes.forEach((n) => {
    n.frame.x = Math.round(n.frame.x * k);
    n.frame.w = Math.max(KINDS[n.kind]?.min?.[0] || 24, Math.round(n.frame.w * k));
  });
  sp.canvas.w = f.w;
  return sp.nodes.length;
}
const mkLayoutPrev = mkLayout;
mkLayout = function (...a) {
  const l = mkLayoutPrev(...a);
  l.space = "layout";
  l.pageFormat = l.pageFormat || "A4";
  l.multipage = !!l.multipage;
  l.pageGap = Number.isFinite(+l.pageGap) ? +l.pageGap : 24;
  l.pageHeight = +l.pageHeight || +l.pages?.[0]?.h || 1123;
  return l;
};
const normalizePrev = normalize;
normalize = function (m) {
  const r = normalizePrev(m);
  r.layouts.forEach((l) => {
    l.space = "layout";
    if (PAGE_FORMATS[l.pageFormat] === undefined) l.pageFormat = "A4";
    l.multipage = !!l.multipage;
    l.pageGap = Number.isFinite(+l.pageGap) ? +l.pageGap : 24;
    l.pageHeight = clamp(+l.pageHeight || +l.pages?.[0]?.h || (PAGE_FORMATS[l.pageFormat]?.h ?? 1123), 200, 20000);
    l.pages = [{ h: l.pageHeight }];
  });
  return r;
};
const autoLayoutPrev = autoLayout;
autoLayout = function (sp) {
  autoLayoutPrev(sp);
  for (let i = 0; i < 2; i++) { if (!paginate(sp)) break; autoLayoutPrev(sp); }
};
/* Рамки страниц на холсте компоновки. */
function drawPageFrames() {
  if (state.ui.module !== "layout") return;
  const sp = spaceRef();
  if (!sp || !sp.multipage) return;
  const m = pageMetrics(sp), count = pageCount(sp), tall = new Set(tallBlocks(sp).map((n) => n.id));
  for (let i = 0; i < count; i++) {
    const over = sp.nodes.some((n) => !n.parent && !n.hidden && tall.has(n.id) && pageAt(sp, n.frame.y) === i);
    const d = document.createElement("div");
    d.className = "page-frame" + (over ? " over" : "");
    d.style.cssText = `left:0;top:${pageTop(sp, i)}px;width:${sp.canvas.w}px;height:${m.h}px`;
    d.innerHTML = `<span class="page-tag">Страница ${i + 1} / ${count} · ${esc(m.format)} · ${m.h}px</span>`;
    nodesLayer.appendChild(d);
  }
}
const renderCanvasPrev = renderCanvas;
renderCanvas = function () { renderCanvasPrev(); drawPageFrames(); };

function pageDialog(l) {
  l = l || (state.ui.module === "char" ? state.model.layouts.find((x) => x.id === roster().layout) : layout());
  if (!l) { toast("Сначала создайте компоновку", "err"); return; }
  const m = pageMetrics(l);
  openModal(
    "Страницы листа · КЛ-06",
    sel("pg-format", "Формат", l.pageFormat || "A4", Object.keys(PAGE_FORMATS).map((k) => [k, PAGE_FORMATS[k] ? PAGE_FORMATS[k].label : "Произвольный"])) +
      inp("pg-h", "Высота страницы, px", m.h, "number", 'min="200" max="20000"') +
      inp("pg-gap", "Зазор между страницами, px", m.gap, "number", 'min="0" max="400"') +
      `<label class="check-row"><input type="checkbox" id="pg-multi" ${l.multipage ? "checked" : ""}> Многостраничный лист: блоки не разрываются, переполнение уходит на следующую страницу</label>
       <label class="check-row"><input type="checkbox" id="pg-fitw"> Подогнать ширину холста под формат (${PAGE_FORMATS[l.pageFormat]?.w || l.canvas.w} px, пропорционально)</label>
       <div class="page-stats" id="pg-stats"></div>`,
    '<button class="btn" onclick="closeModal()">Отмена</button><button class="btn primary" id="pg-save">Применить</button>',
  );
  const stats = () => {
    const probe = clone(l);
    probe.space = "layout";
    probe.pageFormat = $("#pg-format").value;
    probe.pageHeight = clamp(+$("#pg-h").value || m.h, 200, 20000);
    probe.pageGap = clamp(+$("#pg-gap").value || 0, 0, 400);
    probe.multipage = $("#pg-multi").checked;
    autoLayout(probe);
    const tall = tallBlocks(probe), cnt = probe.multipage ? pageCount(probe) : 1;
    $("#pg-stats").innerHTML =
      `<b>Страниц: ${cnt}</b> · блоков: ${probe.nodes.filter((n) => !n.hidden).length} · выше страницы: ${tall.length}
       ${tall.length ? `<ul>${tall.map((n) => `<li>${esc(n.label)} — ${Math.round(n.frame.h)}px</li>`).join("")}</ul><small class="muted">Такие блоки не переносятся автоматически: уменьшите высоту или включите автовысоту.</small>` : "<div class='muted'>Все блоки помещаются на страницы.</div>"}`;
  };
  ["pg-format", "pg-h", "pg-gap", "pg-multi"].forEach((id) => { const el = $("#" + id); if (el) el.oninput = el.onchange = stats; });
  stats();
  $("#pg-save").onclick = () => {
    l.pageFormat = $("#pg-format").value;
    l.pageHeight = clamp(+$("#pg-h").value || m.h, 200, 20000);
    l.pageGap = clamp(+$("#pg-gap").value || 0, 0, 400);
    l.multipage = $("#pg-multi").checked;
    l.pages = [{ h: l.pageHeight }];
    if ($("#pg-fitw").checked) fitPageWidth(l);
    paginate(l);
    snapshot("Настройки страниц");
    closeModal();
    refresh();
    toast(l.multipage ? `Страниц: ${pageCount(l)} · формат ${l.pageFormat}` : "Одностраничный лист", "ok");
  };
}
const buildToolbarPrev = buildToolbar;
buildToolbar = function () {
  buildToolbarPrev();
  const tb = $("#toolbar");
  if (!tb || !["layout", "char"].includes(state.ui.module)) { applyLocaleSoon(); return; }
  const l = state.ui.module === "layout" ? layout() : state.model.layouts.find((x) => x.id === roster().layout);
  if (!l) { applyLocaleSoon(); return; }
  const g = document.createElement("div");
  g.className = "grp";
  g.innerHTML =
    `<button class="tb-btn" id="tb-pages" title="Формат страниц, разрывы, автоперенос">▤ Страницы: ${l.multipage ? pageCount(l) : 1}</button>` +
    (state.ui.module === "layout" ? '<button class="tb-btn" id="tb-paginate" title="Разнести блоки по страницам, не разрывая их">↧ Разбить</button>' : "");
  tb.appendChild(g);
  $("#tb-pages").onclick = () => pageDialog(l);
  const p = $("#tb-paginate");
  if (p) p.onclick = () => {
    l.multipage = true;
    const moved = paginate(l);
    snapshot("Разбиение на страницы");
    refresh();
    toast(moved ? `Перенесено блоков: ${moved} · страниц ${pageCount(l)}` : "Все блоки уже помещаются", moved ? "ok" : "info");
  };
  applyLocaleSoon();
};

/* Лист с реальными страницами, колонтитулами и разрывами при печати. */
sheetHTML = function (r = roster(), l = state.model.layouts.find((x) => x.id === r.layout), interactive = true) {
  if (!l) return '<div class="empty-state"><h4>Лист начнётся с компоновки</h4><button class="btn" onclick="setModule(\'layout\')">Создать компоновку</button></div>';
  const sp = clone(l);
  sp.space = "layout";
  const previousRoster=sheetRosterContext;
  sheetRosterContext=r;
  try {
  autoLayout(sp);
  const multi = !!sp.multipage, m = pageMetrics(sp);
  sp.canvas.h = Math.max(sp.canvas.h, sheetBottom(sp));
  const bottom = sp.canvas.h;
  const count = multi ? pageCount(sp) : 1;
  const ph = multi ? m.h : bottom;
  const total = count * ph + (multi ? (count - 1) * m.gap : 0);
  const rootOf = (n) => { let c = n, g = 0; while (c.parent && g++ < 100) { const p = sp.nodes.find((x) => x.id === c.parent); if (!p) break; c = p; } return c; };
  const pageOfNode = (n) => (multi ? clamp(pageAt(sp, worldFrame(rootOf(n), sp).y + 1), 0, count - 1) : 0);
  const draw = (n, top) => {
    if (!visibleNode(n, sp, null)) return "";
    const el = buildNodeEl(n, sp, null, true);
    el.style.top = (parseFloat(el.style.top) - top) + "px";
    if (n.kind === "slot" && interactive) {
      const b = document.createElement("button");
      b.className = "btn slot-fill-button";
      b.dataset.id = n.id;
      b.textContent = "＋ Наполнить";
      el.appendChild(b);
    }
    return el.outerHTML + sp.nodes.filter((c) => c.parent === n.id).sort((a, b) => (a.z || 0) - (b.z || 0)).map((c) => draw(c, top)).join("");
  };
  let html = `<div class="sheet-canvas${multi ? " multipage" : ""}" style="width:${sp.canvas.w}px;height:${total}px">`;
  for (let i = 0; i < count; i++) {
    const top = multi ? pageTop(sp, i) : 0;
    html += `<div class="sheet-page" style="width:${sp.canvas.w}px;height:${ph}px;${multi && i < count - 1 ? "margin-bottom:" + m.gap + "px" : ""}">`;
    if (i === 0) {
      html += `<div class="sheet-topline"><span>${esc(r.character.name)} · ${esc(r.character.role || "")}</span><b>${rosterTotal(r)} / ${r.limits.points} оч.</b></div>`;
      if (r.character.portrait) html += `<img class="sheet-portrait" src="${esc(safeImage(r.character.portrait))}" alt="Портрет">`;
    }
    html += sp.nodes.filter((n) => !n.parent && pageOfNode(n) === i).sort((a, b) => (a.z || 0) - (b.z || 0)).map((n) => draw(n, top)).join("");
    if (i === count - 1 && r.character.notes) html += `<div class="sheet-notes">${esc(r.character.notes)}</div>`;
    html += `<div class="page-foot"><span>${esc(r.character.name)} · ${rosterTotal(r)} оч.</span><span>${esc(l.name)} · ${multi ? `Страница ${i + 1} / ${count}` : "Один лист"}</span></div></div>`;
  }
  return html + "</div>";
  } finally { sheetRosterContext=previousRoster; }
};
const renderCharPrev = renderChar;
renderChar = function () {
  renderCharPrev();
  const sc = $("#char-view .sheet-canvas"), wrap = $("#char-view .sheet-scale");
  if (sc && wrap) {
    const z = state.ui.charZoom || 0.85;
    wrap.style.height = (parseFloat(sc.style.height) || sc.offsetHeight || 1000) * z + "px";
    wrap.style.width = (parseFloat(sc.style.width) || 900) * z + "px";
  }
  applyLocaleSoon();
};
exportHTML = function () {
  const r = roster(), l = state.model.layouts.find((x) => x.id === r.layout), content = sheetHTML(r, l, false), css = $("style").textContent;
  const fmt = PAGE_FORMATS[l?.pageFormat] || PAGE_FORMATS.A4;
  const scale = Math.min(1, 718 / (l?.canvas.w || 900)).toFixed(3);
  const doc = `<!doctype html><html lang="${state.ui.locale || "ru"}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(r.character.name)} — Recruit Forge</title><style>${css}
html,body{height:auto;overflow:auto}body{padding:20px}.export-page{width:${l?.canvas.w || 900}px;max-width:none;margin:auto}
.sheet-canvas{margin:0;overflow:visible;border:0;background:transparent;box-shadow:none}.sheet-page{margin-inline:auto;box-shadow:var(--elevation)}
.node{box-shadow:none}.sheet-canvas .n-head{cursor:default}button{display:none!important}.ov-badge{display:none!important}
@media(max-width:940px){body{padding:8px;overflow:auto}.export-page{width:auto}.sheet-canvas{zoom:.5}}
@media print{body{padding:0;background:#fff}.export-page{width:auto;max-width:none}.sheet-canvas{zoom:${scale}}.sheet-page{page-break-after:always;break-after:page;border:0;box-shadow:none;background:#fff}.sheet-page:last-child{page-break-after:auto;break-after:auto}@page{size:${fmt.css} portrait;margin:10mm}}
</style></head><body><main class="export-page">${content}</main></body></html>`;
  download(doc, "roster.html", "text/html;charset=utf-8");
  toast("Автономный HTML экспортирован · страниц: " + (l?.multipage ? pageCount(l) : 1), "ok");
  return doc;
};
const printSheetPrev = printSheet;
printSheet = function () {
  const l = state.model.layouts.find((x) => x.id === roster().layout), fmt = PAGE_FORMATS[l?.pageFormat] || PAGE_FORMATS.A4;
  const scale = Math.min(1, 718 / (l?.canvas.w || 900)).toFixed(3);
  $("#print-page-size")?.remove();
  const st = document.createElement("style");
  st.id = "print-page-size";
  st.textContent = `@page{size:${fmt.css} portrait;margin:10mm}
#print-root .sheet-canvas{width:${l?.canvas.w || 900}px!important;max-width:none!important;zoom:${scale};border:0!important;background:#fff!important}
#print-root .sheet-page{page-break-after:always;break-after:page;border:0!important;background:#fff!important}
#print-root .sheet-page:last-child{page-break-after:auto;break-after:auto}`;
  document.head.appendChild(st);
  printSheetPrev();
  const cleanup=()=>{st.remove();window.removeEventListener("afterprint",cleanup);clearTimeout(timer);};
  const timer=setTimeout(cleanup,60000);window.addEventListener("afterprint",cleanup);
};

/* ---------------- 2. Индикатор переполнения (КЛ-07) ---------------- */
function overflowInfo(n, sp) {
  if (!sp || n.hidden) return null;
  if (isPageSpace(sp) && sp.multipage && !n.parent) {
    const m = pageMetrics(sp);
    if (n.frame.h > m.h - 16) return { kind: "page", label: "Выше страницы" };
  }
  if (n.kind === "slot" && !n.props.autoHeight) {
    const s = state.model.schemas.find((x) => x.id === n.props.sourceSchema), as = activeAssign(n.id);
    if (s && as.length) {
      const cols = clamp(+n.props.cols || 1, 1, 8), gap = +n.props.gap || 8, pad = +n.props.padding || 0;
      const avail = n.frame.h - 40 - pad * 2;
      let used = 0, rowH = 0, fit = 0;
      for (let i = 0; i < as.length; i++) {
        const o = state.model.objects.find((x) => x.id === as[i].objectId && !x.deleted);
        const h = o ? slotCardHeight(n, s, o, as[i]) : 45;
        if (i % cols === 0 && i) { used += rowH + gap; rowH = 0; }
        rowH = Math.max(rowH, h);
        if (used + rowH <= avail) fit = i + 1; else break;
      }
      if (as.length - fit > 0) return { kind: "slot", label: `+${as.length - fit} не помещается`, count: as.length - fit };
    }
  }
  if (CONTAINERS.includes(n.kind) && n.props.overflow && n.props.overflow !== "grow") {
    const out = sp.nodes.filter((c) => c.parent === n.id && !c.hidden && c.frame.y + c.frame.h > n.frame.h - 4).length;
    if (out > 0) return { kind: "container", label: `+${out} не помещается`, count: out };
  }
  return null;
}
const buildNodeElPrev = buildNodeEl;
buildNodeEl = function (n, sp = spaceRef(), obj = null, result = false) {
  const el = buildNodeElPrev(n, sp, obj, result);
  const info = overflowInfo(n, sp);
  if (info) {
    el.classList.add("has-overflow");
    const b = document.createElement("div");
    b.className = "ov-badge";
    b.innerHTML = `⚠ ${esc(info.label)} <button type="button" data-ovfix="${esc(n.id)}" data-ovkind="${info.kind}" title="Устранить переполнение">исправить</button>`;
    el.appendChild(b);
  }
  return el;
};
document.addEventListener("click", (e) => {
  const b = e.target.closest?.("[data-ovfix]");
  if (!b) return;
  e.preventDefault();
  e.stopPropagation();
  const id = b.dataset.ovfix, kind = b.dataset.ovkind;
  let sp = spaceRef(), n = sp?.nodes.find((x) => x.id === id);
  if (!n) for (const l of state.model.layouts) { const f = l.nodes.find((x) => x.id === id); if (f) { sp = l; n = f; break; } }
  if (!n) return;
  if (kind === "page") n.frame.h = Math.max(KINDS[n.kind].min[1], pageMetrics(sp).h - 24);
  else if (kind === "slot") n.props.autoHeight = true;
  else { n.props.autoHeight = true; n.props.overflow = "grow"; }
  snapshot("Исправление переполнения");
  refresh();
  toast("Переполнение устранено: " + n.label, "ok", undo);
}, true);

/* ---------------- 3. Тач-режим (АМ-06) ---------------- */
function setTouch(on) {
  state.ui.touch = !!on;
  document.body.classList.toggle("touch-mode", !!on);
  const b = $("#btn-touch");
  if (b) { b.classList.toggle("active", !!on); b.setAttribute("aria-pressed", String(!!on)); }
}
const touchPts = new Map();
let pinch = null, lpTimer = 0, lpStart = null;
viewport.addEventListener("pointerdown", (e) => {
  if (e.pointerType !== "touch") return;
  touchPts.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (touchPts.size === 2) {
    clearTimeout(lpTimer); lpTimer = 0;
    if (gesture) finishGesture({}, true);
    const [a, b] = [...touchPts.values()];
    pinch = { d: Math.hypot(a.x - b.x, a.y - b.y) || 1, z: state.ui.view.zoom, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 };
    capturePointer(viewport, e.pointerId);
    setHint("Два пальца: панорама и зум");
    return;
  }
  const ne = e.target.closest(".node");
  if (ne && !e.target.closest(".port,.handle")) {
    lpStart = { x: e.clientX, y: e.clientY, id: ne.dataset.id };
    clearTimeout(lpTimer);
    lpTimer = setTimeout(() => {
      lpTimer = 0;
      if (gesture) finishGesture({}, true);
      state.ui.selection.clear();
      state.ui.selection.add(lpStart.id);
      renderCanvas();
      renderInspector();
      const el = nodesLayer.querySelector(`.node[data-id="${lpStart.id}"]`);
      (el || ne).dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, cancelable: true, clientX: lpStart.x, clientY: lpStart.y }));
    }, 480);
  }
}, true);
viewport.addEventListener("pointermove", (e) => {
  if (e.pointerType !== "touch") return;
  if (touchPts.has(e.pointerId)) touchPts.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (lpTimer && lpStart && Math.hypot(e.clientX - lpStart.x, e.clientY - lpStart.y) > 10) { clearTimeout(lpTimer); lpTimer = 0; }
  if (pinch && touchPts.size >= 2) {
    if (gesture) finishGesture({}, true);
    const [a, b] = [...touchPts.values()];
    const d = Math.hypot(a.x - b.x, a.y - b.y) || 1, mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    const z = clamp(pinch.z * (d / pinch.d), 0.1, 8);
    zoomAt(pinch.mx, pinch.my, z);
    state.ui.view.x += mx - pinch.mx;
    state.ui.view.y += my - pinch.my;
    pinch = { d, z, mx, my };
    applyView();
    syncControls();
    e.preventDefault();
    e.stopPropagation();
  }
}, true);
const endTouch = (e) => {
  if (e.pointerType !== "touch") return;
  touchPts.delete(e.pointerId);
  clearTimeout(lpTimer); lpTimer = 0;
  if (touchPts.size < 2) pinch = null;
};
viewport.addEventListener("pointerup", endTouch, true);
viewport.addEventListener("pointercancel", endTouch, true);

/* ---------------- 4. Локализация RU / EN (ЛК-01/02) ---------------- */
const EN3 = {
  "Схемы": "Schemas", "База": "Database", "Лист": "Layout", "Персонаж": "Roster",
  "Инспектор": "Inspector", "Предпросмотр": "Preview", "Валидация": "Validation",
  "История операций": "Operation history", "Далее": "Next", "Пропустить": "Skip",
  "⧉ Дублировать": "⧉ Duplicate", "⧗ История": "⧗ History", "＋ Объект": "＋ Object",
  "? Справка": "? Help", "Имперская Кузня": "Imperial Forge",
  "Зум холста": "Canvas zoom", "Шаг сетки": "Grid step", "Радиус магнита": "Magnet radius",
  "Скругление блоков": "Block radius", "Плотность (gap)": "Density (gap)", "Масштаб шрифта": "Font scale",
  "Оттенок палитры": "Accent hue", "Глубина теней": "Shadow depth", "Кривизна связей": "Link curvature",
  "Размер портов": "Port size", "Тема": "Theme", "Привязка": "Snap", "Направляющие": "Guides",
  "Автопоток": "Auto flow", "⟲ Сброс вида": "⟲ Reset view", "＋ Случайный объект": "＋ Random object",
  "⇩ Экспорт": "⇩ Export", "⇧ Импорт проекта": "⇧ Import project",
  "Библиотека": "Library", "Блоки · клик / двойной клик": "Blocks · click / double click",
  "Инструменты": "Tools", "Компоновки": "Layouts", "Корзина": "Trash", "Объекты": "Objects",
  "Объекты → в слот": "Objects → into slot", "Папки": "Folders", "Персонажи и отряды": "Characters & squads",
  "Поля схемы": "Schema fields", "Сохранённые виды": "Saved views", "Схемы → слот": "Schemas → slot",
  "Импорт": "Import", "База объектов": "Object database", "Живой предпросмотр": "Live preview",
  "Секция": "Section", "Карточка": "Card", "Ряд": "Row", "Колонка": "Column",
  "Слот объектов": "Object slot", "Плашка": "Stat tile", "Текст": "Text", "Число": "Number",
  "Полоса": "Bar", "Список тегов": "Tag list", "Таблица": "Table", "Способность": "Ability",
  "Разделитель": "Divider", "Изображение": "Image", "Поле": "Field", "Модификатор": "Modifier",
  "Условие": "Condition", "Ограничение": "Constraint",
  "содержит": "contains", "данные": "data", "вычисляется из": "derived from", "ссылается на": "refers to",
  "изменяет": "modifies", "при условии": "when", "порядок": "order", "ограничивает": "constrains",
  "Новая схема": "New schema", "Новый объект": "New object", "Дублировать": "Duplicate", "Удалить": "Delete",
  "Вставить": "Paste", "Наверх": "Bring to front", "Назад": "Send to back", "Группа": "Group",
  "Слои": "Layers", "Слои / вложить в…": "Layers / nest into…", "Граф зависимостей": "Dependency graph",
  "Настройки холста": "Canvas settings", "Настройки связи": "Link settings", "Удалить связь": "Delete link",
  "Переименовать / свойства": "Rename / properties", "Сохранить фрагмент": "Save fragment",
  "Создать блок · поиск": "Create block · search", "Выровнять по сетке": "Align to grid",
  "Вписать всё": "Fit all", "Резервные копии": "Backups", "Справка": "Help", "Экспорт": "Export",
  "Поиск": "Search", "Имя / поле / команда": "Name / field / command", "Поиск клавиш": "Search shortcuts",
  "Самопроверка ядра": "Core self-test", "Жесты": "Gestures", "Работа как в Excel": "Excel-like editing",
  "Данные и безопасность": "Data & safety", "Границы этой браузерной редакции": "Limits of this browser edition",
  "Схема → База → Лист → Персонаж": "Schema → Database → Layout → Roster",
  "X": "X", "Y": "Y", "Ширина": "Width", "Высота": "Height", "Имя": "Name", "Название": "Title",
  "Подпись блока": "Block label", "Тип": "Type", "Единица": "Unit", "По умолчанию": "Default",
  "Формула": "Formula", "Выражение": "Expression", "Значение / выражение": "Value / expression",
  "Ширина колонки": "Column width", "Знаков после запятой": "Decimal places", "Минимум": "Minimum",
  "Максимум": "Maximum", "Имя поля": "Field name", "Источник данных": "Data source",
  "Свой текст (если без привязки)": "Static text (when unbound)", "Статичный текст": "Static text",
  "Размер текста": "Text size", "Размер шрифта": "Font size", "Размер шрифта, px": "Font size, px",
  "Внутренний отступ": "Padding", "Зазор": "Gap", "Колонок": "Columns", "Колонки через запятую": "Columns, comma separated",
  "Раскладка": "Layout mode", "Раскладка детей": "Children layout", "Переполнение": "Overflow",
  "Выравнивание": "Alignment", "Цвет полосы": "Bar colour", "Изображение": "Image",
  "Файл изображения (data URL или путь)": "Image file (data URL or path)",
  "Условие видимости": "Visibility condition", "Якоря": "Anchors", "Отступ от края": "Edge margin",
  "к левому краю": "to left edge", "к правому краю": "to right edge", "к верху": "to top", "к низу": "to bottom",
  "Слой": "Layer", "Повторитель": "Repeater", "Повторять, раз": "Repeat, times", "Вес": "Weight",
  "Операция": "Operation", "Режим": "Mode", "Правило": "Rule", "Область": "Scope",
  "Описание правила": "Rule description", "Сообщение": "Message", "На каждые N": "Per every N",
  "Ступени: количество:очки": "Tiers: count:points", "Режим стоимости": "Cost mode",
  "Схема объектов": "Object schema", "Количество": "Count", "Количество каждого": "Count of each",
  "Отображаемое имя": "Display name", "Заметка": "Note", "Теги объекта": "Object tags",
  "Фильтр по тегу": "Tag filter", "Папка": "Folder", "Новое значение": "New value",
  "Действие с тегами": "Tag action", "Число / тег": "Number / tag", "Вид": "View",
  "Вид карточек": "Card view", "Заготовка": "Preset", "Компоновка": "Layout", "Формат": "Format",
  "Формат страницы": "Page format", "Ширина холста": "Canvas width", "Высота холста": "Canvas height",
  "Лимит очков": "Points limit", "Роль / фракция": "Role / faction", "Персонаж / отряд": "Character / squad",
  "Строки": "Rows", "Заполнить ": "Fill ", "Внутри контейнера ": "Inside container ",
  "Здесь будут объекты этой схемы": "Objects of this schema will appear here",
  "Нет объектов в этом виде": "No objects in this view",
  "Структура начинается с блока": "A structure starts with a block",
  "Лист начнётся с компоновки": "The sheet starts with a layout",
  "Отмена": "Cancel", "Закрыть": "Close", "Сохранить": "Save", "Применить": "Apply",
  "Создать": "Create", "Отменить": "Undo", "Повторить": "Redo", "Удалить": "Delete",
  "Сохранено локально": "Saved locally", "Локально": "Local", "Сохраните файл": "Save a file",
  "Базовый": "Basic", "Расширенный": "Advanced", "Компактно": "Compact", "Данные": "Data",
  "Экспорт / PDF": "Export / PDF", "Импорт CSV / XLSX": "Import CSV / XLSX",
  "Экспорт объектов": "Export objects", "Клавиши грида": "Grid shortcuts",
  "↓ В столбик": "↓ Stack", "▣ Уплотнить": "▣ Pack", "▦ К сетке": "▦ To grid",
  "⌕ Поиск": "⌕ Search", "▤ Слои": "▤ Layers", "⌘ Граф": "⌘ Graph", "⇔ Выровнять": "⇔ Align",
  "▣ Группа": "▣ Group", "＋ Лист": "＋ Layout", "⚙ Холст": "⚙ Canvas", "✓ Проверить": "✓ Validate",
  "Дизайн": "Design", "Результат": "Result", "Инспектор": "Inspector",
  "Мастер поля": "Field wizard", "Мастер блока": "Block wizard", "Мастер связи": "Link wizard",
  "Мастер модификатора": "Modifier wizard", "Мастер условия": "Condition wizard",
  "Мастер ограничения": "Constraint wizard", "Настройки слота": "Slot settings",
  "Выбор объектов": "Object picker", "Переименование поля": "Field rename",
  "Миграция схемы": "Schema migration", "Подтверждение удаления": "Delete confirmation",
  "Горячие клавиши": "Hotkeys", "Страницы листа · КЛ-06": "Sheet pages",
  "Высота страницы, px": "Page height, px", "Зазор между страницами, px": "Gap between pages, px",
  "Произвольный": "Custom", "Страницы": "Pages", "↧ Разбить": "↧ Paginate",
  "исправить": "fix", "не помещается": "do not fit", "Выше страницы": "Taller than page",
  "＋ Наполнить": "＋ Fill", "Перейти →": "Go →", "Исправить": "Fix",
  "СХЕМЫ · Поля → связи → живой предпросмотр. Тяните от порта; Esc отменяет жест.":
    "SCHEMAS · Fields → links → live preview. Drag from a port; Esc cancels the gesture.",
  "БАЗА · Enter/F2 — правка; Shift — диапазон; Ctrl+Enter — заполнить выделенное.":
    "DATABASE · Enter/F2 edits; Shift selects a range; Ctrl+Enter fills the selection.",
  "ЛИСТ · Размещайте блоки мышью. Объекты из палитры можно перетащить в слот.":
    "LAYOUT · Place blocks with the mouse. Drag objects from the palette into a slot.",
  "ПЕРСОНАЖ · ＋ наполняет слот; ± меняет количество; двойной клик открывает объект.":
    "ROSTER · ＋ fills a slot; ± changes count; double click opens the object.",
  "Два пальца: панорама и зум": "Two fingers: pan and zoom",
};
const EN3_PATTERNS = [
  [/^Страница (\d+) \/ (\d+)$/, "Page $1 / $2"],
  [/^Страницы: (\d+)$/, "Pages: $1"],
  [/^▤ Страницы: (\d+)$/, "▤ Pages: $1"],
  [/^Связи: (.+)$/, "Links: $1"],
  [/^Правила: (вкл|выкл)$/, "Rules: $1"],
  [/^Страниц: (\d+)/, "Pages: $1"],
  [/^\+(\d+) не помещается$/, "+$1 do not fit"],
  [/^Объектов: (\d+)$/, "Objects: $1"],
  [/^Выделено: (\d+)$/, "Selected: $1"],
];
const LOCALE_SKIP = "#nodes-layer,#char-view,#grid-scroll,#cards-view,#preview-box,.export-preview,#minimap,#pick-list,.roster-card,.template-card,#hist-list,.graph-list";
const origText3 = new WeakMap(), origAttr3 = new WeakMap();
function tr3(text) {
  const k = text.trim();
  if (!k) return null;
  if (EN3[k]) return text.replace(k, EN3[k]);
  for (const [re, rep] of EN3_PATTERNS) if (re.test(k)) return text.replace(k, k.replace(re, rep));
  return null;
}
function applyLocale() {
  const en = state.ui.locale === "en";
  const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(n) {
      const p = n.parentElement;
      if (!p || ["SCRIPT", "STYLE", "TEXTAREA", "INPUT", "OPTION", "SELECT"].includes(p.tagName)) return NodeFilter.FILTER_REJECT;
      if (p.closest(LOCALE_SKIP)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  const list = [];
  while (walk.nextNode()) list.push(walk.currentNode);
  list.forEach((n) => {
    if (!origText3.has(n)) origText3.set(n, n.textContent);
    const orig = origText3.get(n);
    if (!en) { if (n.textContent !== orig) n.textContent = orig; return; }
    const t = tr3(orig);
    if (t && n.textContent !== t) n.textContent = t;
  });
  $$("[title],[placeholder],[aria-label]").forEach((el) => {
    if (el.closest(LOCALE_SKIP)) return;
    let store = origAttr3.get(el);
    if (!store) { store = {}; origAttr3.set(el, store); }
    ["title", "placeholder", "aria-label"].forEach((a) => {
      if (!el.hasAttribute(a)) return;
      if (store[a] === undefined) store[a] = el.getAttribute(a);
      const orig = store[a];
      if (!en) { if (el.getAttribute(a) !== orig) el.setAttribute(a, orig); return; }
      const t = tr3(orig);
      if (t && el.getAttribute(a) !== t) el.setAttribute(a, t);
    });
  });
  document.documentElement.lang = en ? "en" : "ru";
}
let localeRAF = 0;
function applyLocaleSoon() {
  if (state.ui.locale !== "en" || localeRAF) return;
  localeRAF = requestAnimationFrame(() => { localeRAF = 0; applyLocale(); });
}
toggleLocale = function () {
  state.ui.locale = state.ui.locale === "en" ? "ru" : "en";
  const b = $("#btn-locale");
  if (b) b.textContent = state.ui.locale.toUpperCase();
  state.model.settings.locale = state.ui.locale;
  applyLocale();
  snapshot("Язык интерфейса");
  toast(state.ui.locale === "en" ? "Interface language: English" : "Язык интерфейса: русский", "info");
};
/* Локализация применяется после каждой перерисовки интерфейса. */
[["refresh", () => refresh], ["openModal", () => openModal], ["showCtx", () => showCtx], ["toast", () => toast],
 ["renderInspector", () => renderInspector], ["renderPalette", () => renderPalette], ["renderBase", () => renderBase],
 ["renderGrid", () => renderGrid], ["setHint", () => setHint], ["renderCrumbs", () => renderCrumbs]].forEach(([name, get]) => {
  const prev = get();
  const wrapped = function (...a) { const r = prev.apply(this, a); applyLocaleSoon(); return r; };
  if (name === "refresh") refresh = wrapped;
  else if (name === "openModal") openModal = wrapped;
  else if (name === "showCtx") showCtx = wrapped;
  else if (name === "toast") toast = wrapped;
  else if (name === "renderInspector") renderInspector = wrapped;
  else if (name === "renderPalette") renderPalette = wrapped;
  else if (name === "renderBase") renderBase = wrapped;
  else if (name === "renderGrid") renderGrid = wrapped;
  else if (name === "setHint") setHint = wrapped;
  else if (name === "renderCrumbs") renderCrumbs = wrapped;
});

/* ---------------- 5. Экспорт BattleScribe .cat (ХР-06) ---------------- */
function battleScribeXML(s = schema()) {
  const X = (v) => String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const fields = s.fields.filter((f) => !f.removed);
  const objs = objectsOfSchema(s);
  const typeId = "profile-" + s.id, ptName = s.name || "Профиль";
  let out = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n`;
  out += `<catalogue id="${X(s.id)}" name="${X(s.name)}" revision="${s.version || 1}" battleScribeVersion="2.03" gameSystemId="${X(s.id)}" gameSystemRevision="1" xmlns="http://www.battlescribe.net/schema/catalogueSchema">\n`;
  out += `  <profileTypes>\n    <profileType id="${X(typeId)}" name="${X(ptName)}">\n      <characteristicTypes>\n`;
  fields.forEach((f) => { out += `        <characteristicType id="${X(f.id)}" name="${X(f.name)}"/>\n`; });
  out += `      </characteristicTypes>\n    </profileType>\n  </profileTypes>\n`;
  out += `  <categoryEntries>\n    <categoryEntry id="${X(s.id)}-cat" name="${X(s.name)}" hidden="false"/>\n  </categoryEntries>\n`;
  out += `  <selectionEntries>\n`;
  objs.forEach((o) => {
    out += `    <selectionEntry id="${X(o.id)}" name="${X(o.name)}" type="model" hidden="false">\n`;
    out += `      <constraints>\n`;
    s.nodes.filter((n) => n.kind === "constraint").forEach((n) => {
      const p = n.props || {}, type = p.exactly != null && p.exactly !== "" ? "exactly" : p.min ? "min" : "max";
      const val = type === "exactly" ? p.exactly : type === "min" ? p.min : p.max;
      if (val == null || val === "") return;
      out += `        <constraint id="${X(n.id)}-${X(o.id)}" type="${type}" value="${X(val)}" scope="roster" shared="true"/>\n`;
    });
    out += `      </constraints>\n      <profiles>\n        <profile id="${X(o.id)}-p" name="${X(o.name)}" typeId="${X(typeId)}" typeName="${X(ptName)}" hidden="false">\n          <characteristics>\n`;
    fields.forEach((f) => { out += `            <characteristic name="${X(f.name)}" typeId="${X(f.id)}">${X(displayValue(s, o, f.name))}</characteristic>\n`; });
    out += `          </characteristics>\n        </profile>\n      </profiles>\n`;
    out += `      <costs>\n        <cost name="pts" typeId="points" value="${X(objectCost(o, 1))}"/>\n      </costs>\n`;
    const mods = s.links.filter((l) => l.type === "modifies");
    if (mods.length) {
      out += `      <modifiers>\n`;
      mods.forEach((l) => {
        const mn = s.nodes.find((n) => n.id === l.from.node), tn = s.nodes.find((n) => n.id === l.to.node);
        if (!mn || !tn) return;
        const op = { add: "increment", sub: "decrement", set: "set", mul: "multiply", div: "divide", min: "atLeast", max: "atMost" }[mn.props.operation || mn.props.op] || "set";
        out += `        <modifier type="${op}" field="${X(tn.props.field || tn.label)}" value="${X(mn.props.value ?? 1)}">${mn.props.condition ? `<conditions><condition type="greaterThan" value="0" field="selections" scope="roster" childId="${X(o.id)}" shared="true"/></conditions>` : ""}</modifier>\n`;
      });
      out += `      </modifiers>\n`;
    }
    if (o.tags?.length) out += `      <categoryLinks>${o.tags.map((t, i) => `<categoryLink id="${X(o.id)}-t${i}" name="${X(t)}" targetId="${X(s.id)}-cat" hidden="false"/>`).join("")}</categoryLinks>\n`;
    out += `    </selectionEntry>\n`;
  });
  out += `  </selectionEntries>\n</catalogue>\n`;
  return out;
}
function exportBattleScribe() {
  const s = schema();
  if (!s) { toast("Нет текущей схемы", "err"); return; }
  const xml = battleScribeXML(s);
  const skipped = s.nodes.filter((n) => ["condition", "constraint"].includes(n.kind) && !s.links.some((l) => l.from.node === n.id)).length;
  const report = {
    schema: s.name,
    profiles: objectsOfSchema(s).length,
    characteristics: s.fields.filter((f) => !f.removed).length,
    modifiers: s.links.filter((l) => l.type === "modifies").length,
    constraints: s.nodes.filter((n) => n.kind === "constraint").length,
    неПеренесено: skipped,
  };
  openModal(
    "Экспорт BattleScribe · .cat",
    `<p class="muted">Профили, характеристики, стоимость, ограничения и модификаторы текущей схемы. Нераспознанные конструкции перечислены в отчёте и не блокируют экспорт.</p>
     <div class="page-stats">${Object.entries(report).map(([k, v]) => `<div>${esc(k)}: <b>${esc(v)}</b></div>`).join("")}</div>
     <pre class="export-preview">${esc(xml.slice(0, 2400))}</pre>`,
    '<button class="btn" onclick="closeModal()">Закрыть</button><button class="btn primary" id="bs-dl">Скачать .cat</button>',
  );
  $("#bs-dl").onclick = () => {
    download(xml, (s.name || "schema").replace(/[^\wа-яё-]+/gi, "_") + ".cat", "application/xml;charset=utf-8");
    closeModal();
    toast("BattleScribe .cat экспортирован · профилей: " + report.profiles, "ok");
  };
  return xml;
}
const exportDialogPrev = exportDialog;
exportDialog = function () {
  exportDialogPrev();
  const selEl = $("#ex-format"), btn = $("#ex-download");
  if (!selEl || !btn) return;
  const o = document.createElement("option");
  o.value = "bs";
  o.textContent = "BattleScribe · .cat (профили и модификаторы)";
  selEl.appendChild(o);
  const prev = btn.onclick;
  btn.onclick = (e) => {
    if (selEl.value === "bs") { closeModal(); exportBattleScribe(); return; }
    return prev?.call(btn, e);
  };
};

/* ---------------- 6. Настройки, кнопки, самопроверка ---------------- */
const projectDataPrev = projectData;
projectData = function () {
  const m = projectDataPrev();
  m.settings.filters = m.settings.filters || {};
  m.settings.filters.touch = !!state.ui.touch;
  m.settings.filters.locale = state.ui.locale;
  return m;
};
const applySettingsPrev = applySettings;
applySettings = function (s = {}) {
  applySettingsPrev(s);
  if (s.filters?.touch !== undefined) setTouch(!!s.filters.touch);
  if (s.filters?.locale) state.ui.locale = s.filters.locale;
  const b = $("#btn-locale");
  if (b) b.textContent = (state.ui.locale || "ru").toUpperCase();
  applyLocale();
};
function addIter3Buttons() {
  const tools = $(".header-tools");
  if (!tools) return;
  if (!$("#btn-locale")) {
    const b = document.createElement("button");
    b.id = "btn-locale";
    b.className = "icon-btn lang-flag";
    b.textContent = (state.ui.locale || "ru").toUpperCase();
    b.title = "Язык интерфейса · RU / EN";
    b.onclick = toggleLocale;
    tools.append(b);
  }
  if (!$("#btn-touch")) {
    const t = document.createElement("button");
    t.id = "btn-touch";
    t.className = "icon-btn";
    t.textContent = "✋";
    t.title = "Тач-режим: зоны ≥44px, long-press = меню, два пальца = пан/зум";
    t.onclick = () => {
      setTouch(!state.ui.touch);
      snapshot("Тач-режим");
      toast(state.ui.touch ? "Тач-режим включён" : "Тач-режим выключен", "info");
    };
    tools.append(t);
  }
}
const selfTestPrev = selfTest;
selfTest = function () {
  const res = selfTestPrev();
  const t = (name, fn) => { try { res.push({ name, ok: true, detail: String(fn() ?? "OK") }); } catch (e) { res.push({ name, ok: false, detail: e.message }); } };
  t("Страницы: перенос без разрыва", () => {
    const l = clone(state.model.layouts[0]);
    l.space = "layout"; l.multipage = true; l.pageFormat = "A4"; l.pageHeight = 400; l.pageGap = 20;
    l.nodes = [mkNode("card", 10, 350, 200, 120)];
    paginate(l);
    const n = l.nodes[0], m = pageMetrics(l);
    if (n.frame.y + n.frame.h > pageTop(l, pageAt(l, n.frame.y)) + m.h + 0.5) throw Error("Блок пересекает границу страницы");
    return "y=" + Math.round(n.frame.y);
  });
  t("Страницы: высота холста растёт", () => {
    const l = clone(state.model.layouts[0]);
    l.space = "layout"; l.multipage = true; l.pageHeight = 300; l.pageGap = 10;
    l.nodes = [mkNode("card", 0, 900, 100, 50)];
    paginate(l);
    if (l.canvas.h < 950) throw Error("Холст не покрыл страницы");
    return l.canvas.h + "px";
  });
  t("Переполнение: слот сообщает о скрытых объектах", () => {
    const l = state.model.layouts.find((x) => x.nodes.some((n) => n.kind === "slot"));
    if (!l) return "нет слота";
    const slot = l.nodes.find((n) => n.kind === "slot"), probe = clone(slot);
    probe.props.autoHeight = false; probe.frame.h = 60;
    const info = overflowInfo(probe, l);
    return info ? info.label : "всё помещается";
  });
  t("Локализация: словарь и шаблоны", () => {
    if (tr3("Страницы: 3") !== "Pages: 3" || tr3("Плашка") !== "Stat tile") throw Error("Словарь не покрывает строку");
    return Object.keys(EN3).length + " строк";
  });
  t("BattleScribe: XML содержит профили", () => {
    const xml = battleScribeXML();
    if (!xml.includes("<catalogue") || !xml.includes("<profile ")) throw Error("Пустой каталог");
    return xml.length + " символов";
  });
  return res;
};
const initializePrev = initialize;
initialize = function () {
  initializePrev();
  addIter3Buttons();
  let coarse = false;
  try { coarse = matchMedia("(pointer: coarse)").matches; } catch {}
  setTouch(state.model.settings?.filters?.touch ?? coarse);
  const b = $("#btn-locale");
  if (b) b.textContent = (state.ui.locale || "ru").toUpperCase();
  applyLocale();
  Object.assign(window.RForge, {
    pageMetrics, pageCount, paginate, pageDialog, fitPageWidth, overflowInfo,
    setTouch, applyLocale, tr3, battleScribeXML, exportBattleScribe, sheetHTML,
  });
};

/* =====================================================================
   Iteration 4 — постраничный просмотр персонажа (ПП-02), выталкивание
   внутри контейнеров (КЛ-03), shrinkText (КЛ-05/08), перенос блоков
   между страницами, «＋ Страница». Локально, без сети и eval.
   ===================================================================== */

/* ---------- A. Навигация по страницам в модуле «Персонаж» ---------- */
const charLayout = () => state.model.layouts.find((x) => x.id === roster().layout);
const charPageCount = () => { const l = charLayout(); return l && l.multipage ? pageCount(l) : 1; };
function gotoCharPage(i, scroll = true) {
  const total = charPageCount();
  state.ui.charPage = clamp(i, 0, total - 1);
  renderChar();
  if (scroll && !state.ui.charPaged) {
    const cv = $("#char-view"), p = $$("#char-view .sheet-page")[state.ui.charPage];
    if (cv && p) cv.scrollTop += p.getBoundingClientRect().top - cv.getBoundingClientRect().top - 12;
  }
  setHint(`ПЕРСОНАЖ · Страница ${state.ui.charPage + 1} / ${total} · PageUp / PageDown листают`);
}
const renderCharPrev4 = renderChar;
renderChar = function () {
  renderCharPrev4();
  const cv = $("#char-view"), wrap = $("#char-view .sheet-scale"), sc = $("#char-view .sheet-canvas");
  if (!cv || !wrap || !sc) return;
  const l = charLayout(), pages = [...sc.querySelectorAll(".sheet-page")], total = pages.length || 1;
  state.ui.charPage = clamp(state.ui.charPage || 0, 0, total - 1);
  const paged = !!state.ui.charPaged && total > 1, z = state.ui.charZoom || 0.85;
  pages.forEach((p, i) => {
    p.style.display = !paged || i === state.ui.charPage ? "" : "none";
    if (paged) p.style.marginBottom = "0";
  });
  if (paged) {
    const h = parseFloat(pages[state.ui.charPage].style.height) || pageMetrics(l).h;
    sc.style.height = h + "px";
    wrap.style.height = h * z + "px";
  }
  const nav = document.createElement("div");
  nav.className = "page-nav";
  nav.innerHTML =
    `<button class="tb-btn" id="pg-prev" title="Предыдущая страница · PageUp" ${state.ui.charPage === 0 ? "disabled" : ""}>◀</button>` +
    `<div class="page-chips">${pages.map((p, i) => `<button class="page-chip${i === state.ui.charPage ? " active" : ""}" data-page="${i}" title="Страница ${i + 1}">${i + 1}</button>`).join("")}</div>` +
    `<button class="tb-btn" id="pg-next" title="Следующая страница · PageDown" ${state.ui.charPage >= total - 1 ? "disabled" : ""}>▶</button>` +
    `<button class="tb-btn" id="pg-mode" title="Показывать одну страницу или все сразу">${paged ? "Постранично" : "Все страницы"}</button>` +
    `<button class="tb-btn" id="pg-setup" title="Формат и разрывы страниц">⚙ Формат</button>` +
    `<span class="page-count muted">Страница ${state.ui.charPage + 1} / ${total}</span>`;
  cv.prepend(nav);
  $("#pg-prev").onclick = () => gotoCharPage(state.ui.charPage - 1);
  $("#pg-next").onclick = () => gotoCharPage(state.ui.charPage + 1);
  $("#pg-mode").onclick = () => {
    state.ui.charPaged = !state.ui.charPaged;
    snapshot("Режим просмотра страниц");
    renderChar();
    toast(state.ui.charPaged ? "Постраничный просмотр" : "Все страницы подряд", "info");
  };
  $("#pg-setup").onclick = () => pageDialog(l);
  $$("#char-view .page-chip").forEach((b) => (b.onclick = () => gotoCharPage(+b.dataset.page)));
  shrinkTextIn($("#char-view"), l);
  applyLocaleSoon();
};
document.addEventListener("keydown", (e) => {
  if (state.ui.module !== "char" || $("#modal-backdrop").classList.contains("open")) return;
  if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) return;
  if (e.key === "PageDown") { e.preventDefault(); gotoCharPage(state.ui.charPage + 1); }
  if (e.key === "PageUp") { e.preventDefault(); gotoCharPage(state.ui.charPage - 1); }
}, true);

/* ---------- B. Выталкивание внутри контейнеров (КЛ-03) ---------- */
function pushChildren(sp) {
  if (!state.ui.autoflow || !sp) return 0;
  let moved = 0;
  for (let pass = 0; pass < 8; pass++) {
    let changed = false;
    sp.nodes.filter((p) => CONTAINERS.includes(p.kind) && !p.hidden).forEach((p) => {
      const mode = p.layoutMode || p.props.layoutMode;
      if (mode === "flow" || mode === "grid") return;
      const gap = Math.max(0, +p.props.gap || 0);
      const kids = sp.nodes
        .filter((c) => c.parent === p.id && !c.hidden && !c.locked && !(c.props.anchors?.top || c.props.anchors?.bottom))
        .sort((a, b) => a.frame.y - b.frame.y);
      for (let i = 0; i < kids.length; i++)
        for (let j = 0; j < i; j++) {
          const a = kids[j], b = kids[i];
          if (b.frame.x < a.frame.x + a.frame.w && b.frame.x + b.frame.w > a.frame.x && b.frame.y < a.frame.y + a.frame.h + gap) {
            const d = a.frame.y + a.frame.h + gap - b.frame.y;
            if (d > 0) { b.frame.y += d; changed = true; moved++; }
          }
        }
    });
    if (!changed) break;
  }
  return moved;
}
const autoLayoutPrev4 = autoLayout;
autoLayout = function (sp) {
  const previous=sheetRosterContext;
  if(!previous && isPageSpace(sp))sheetRosterContext=rosterForLayout(sp);
  try { pushChildren(sp); autoLayoutPrev4(sp); }
  finally { sheetRosterContext=previous; }
};

/* ---------- C. shrinkText: текст уменьшается до 11px, не масштабируется (КЛ-05/08) ---------- */
function shrinkTextIn(root, sp) {
  if (!root || !sp) return 0;
  const ids = sp.nodes.filter((n) => n.props.overflow === "shrinkText" && !n.hidden).map((n) => n.id);
  if (!ids.length) return 0;
  let done = 0;
  requestAnimationFrame(() => {
    ids.forEach((id) => {
      const el = root.querySelector(`.node[data-id="${id}"]`);
      if (!el) return;
      const body = el.querySelector(".n-body");
      if (!body) return;
      const n = sp.nodes.find((x) => x.id === id);
      const avail = el.clientHeight - (el.querySelector(".n-head") ? 28 : 0) - 4;
      let size = clamp(+n.props.fontSize || 14, 11, 24), steps = 0;
      body.style.fontSize = size + "px";
      while (avail > 20 && body.scrollHeight > avail + 1 && size > 11 && steps++ < 10) {
        size = Math.max(11, size - 1);
        body.style.fontSize = size + "px";
      }
      el.classList.toggle("shrunk", size < clamp(+n.props.fontSize || 14, 11, 24));
      done++;
    });
  });
  return ids.length;
}
const renderCanvasPrev4 = renderCanvas;
renderCanvas = function () { renderCanvasPrev4(); shrinkTextIn(nodesLayer, spaceRef()); };

/* ---------- D. Перенос между страницами и добавление страницы ---------- */
function moveSelectionPage(dir) {
  const l = layout();
  if (!l) return;
  l.multipage = true;
  const m = pageMetrics(l);
  let moved = 0;
  state.ui.selection.forEach((id) => {
    const n = l.nodes.find((x) => x.id === id);
    if (!n || n.parent || n.locked) return;
    const i = pageAt(l, n.frame.y), t = Math.max(0, i + dir);
    const off = clamp(n.frame.y - pageTop(l, i), 8, Math.max(8, m.h - n.frame.h - 8));
    n.frame.y = pageTop(l, t) + off;
    moved++;
  });
  paginate(l);
  snapshot("Перенос на другую страницу");
  refresh();
  toast(moved ? `Перенесено блоков: ${moved}` : "Выделены только вложенные или заблокированные блоки", moved ? "ok" : "info");
}
function addPage() {
  const l = layout();
  if (!l) return;
  l.multipage = true;
  const m = pageMetrics(l);
  l.canvas.h = Math.max(l.canvas.h, pageCount(l) * (m.h + m.gap) - m.gap) + m.h + m.gap;
  snapshot("Новая страница");
  refresh();
  toast(`Страниц: ${pageCount(l)} · холст ${l.canvas.h}px`, "ok");
}
const showCtxPrev4 = showCtx;
showCtx = function (x, y, items) {
  if (state.ui.module === "layout" && state.ui.selection.size) {
    items = [...items, "-",
      { label: "На следующую страницу", fn: () => moveSelectionPage(1) },
      { label: "На предыдущую страницу", fn: () => moveSelectionPage(-1) },
      { label: "＋ Добавить страницу", fn: addPage }];
  }
  showCtxPrev4(x, y, items);
};
const buildToolbarPrev4 = buildToolbar;
buildToolbar = function () {
  buildToolbarPrev4();
  if (state.ui.module !== "layout") return;
  const g = $("#tb-pages")?.parentElement;
  if (!g || $("#tb-addpage")) return;
  const b = document.createElement("button");
  b.className = "tb-btn";
  b.id = "tb-addpage";
  b.title = "Добавить страницу в конец листа";
  b.textContent = "＋ Страница";
  b.onclick = addPage;
  g.appendChild(b);
  applyLocaleSoon();
};

/* ---------- E. Сохранение состояния просмотра ---------- */
const projectDataPrev4 = projectData;
projectData = function () {
  const m = projectDataPrev4();
  m.settings.filters.charPage = state.ui.charPage || 0;
  m.settings.filters.charPaged = !!state.ui.charPaged;
  return m;
};
const applySettingsPrev4 = applySettings;
applySettings = function (s = {}) {
  applySettingsPrev4(s);
  if (Number.isInteger(s.filters?.charPage)) state.ui.charPage = s.filters.charPage;
  if (s.filters?.charPaged !== undefined) state.ui.charPaged = !!s.filters.charPaged;
};
Object.assign(EN3, {
  "Постранично": "Paged", "Все страницы": "All pages", "⚙ Формат": "⚙ Format",
  "＋ Страница": "＋ Page", "На следующую страницу": "To next page",
  "На предыдущую страницу": "To previous page", "＋ Добавить страницу": "＋ Add page",
});
EN3_PATTERNS.push([/^Страница (\d+) \/ (\d+) · PageUp/, "Page $1 / $2 · PageUp"]);

const selfTestPrev4 = selfTest;
selfTest = function () {
  const savedModel=clone(state.model),savedSelection=new Set(state.ui.selection),savedLayout=state.ui.activeLayout;
  let res;
  try { res = selfTestPrev4();
  const t = (name, fn) => { try { res.push({ name, ok: true, detail: String(fn() ?? "OK") }); } catch (e) { res.push({ name, ok: false, detail: e.message }); } };
  t("Автопоток: выталкивание внутри контейнера", () => {
    const l = clone(state.model.layouts[0]);
    l.space = "layout"; l.multipage = false;
    const p = mkNode("section", 0, 0, 400, 400), a = mkNode("stat", 10, 40, 120, 60), b = mkNode("stat", 10, 50, 120, 60);
    p.props.gap = 10; a.parent = p.id; b.parent = p.id;
    l.nodes = [p, a, b]; l.links = [];
    pushChildren(l);
    if (b.frame.y < a.frame.y + a.frame.h + 10) throw Error("Дети не растолканы: " + b.frame.y);
    return "y=" + b.frame.y;
  });
  t("Страницы: перенос выделенного блока", () => {
    const l = state.model.layouts[0], before = state.ui.activeLayout;
    state.ui.activeLayout = 0;
    const n = l.nodes.find((x) => !x.parent && !x.locked);
    if (!n) return "нет корневых блоков";
    const y0 = n.frame.y, multi = l.multipage;
    l.multipage = true;
    state.ui.selection = new Set([n.id]);
    const m = pageMetrics(l), i = pageAt(l, n.frame.y);
    n.frame.y = pageTop(l, i + 1) + 12;
    if (pageAt(l, n.frame.y) !== i + 1) throw Error("Перенос не попал на страницу");
    n.frame.y = y0; l.multipage = multi; state.ui.selection = new Set(); state.ui.activeLayout = before;
    return "страница " + (i + 2) + " · " + m.format;
  });
  } finally {
    state.model=savedModel;state.ui.selection=savedSelection;state.ui.activeLayout=savedLayout;invalidate();refresh();
  }
  return res;
};
const initializePrev4 = initialize;
initialize = function () {
  initializePrev4();
  Object.assign(window.RForge, { gotoCharPage, charPageCount, pushChildren, shrinkTextIn, moveSelectionPage, addPage });
};


/* =====================================================================
   Iteration 5 — фикс отображения карточек и листов.
   Проблема: в renderedSlotCard масштабировались только X и ширина,
   а Y/высота оставались в натуральную величину → карточки «комкались»,
   текст налезал на соседей. Компактный режим показывал лишь 6 полей
   из 9+ и обрезался фиксированной высотой 82px.
   Решение: равномерный transform:scale всей карточки шаблона
   (шрифты, таблицы, бары — всё пропорционально), высота обёртки и
   оценка высоты строки слота считаются по одной и той же формуле.
   Компактный режим — полноценная мини-таблица характеристик.
   ===================================================================== */
function slotCardHeight(n, s, o, a) {
  if (!o || !s) return 45;
  const notes = a && a.notes ? 22 : 0;
  if (n.props.view === "compact" || state.ui.compact) return 112 + notes;
  const visual = s.nodes.filter((x) => VISUAL.includes(x.kind) && !x.hidden);
  if (!visual.length) return 150 + notes;
  const cols = clamp(+n.props.cols || 1, 1, 8), gap = +n.props.gap || 8;
  const width = (n.frame.w - 16 - gap * (cols - 1)) / cols;
  const frames = visual.map((nd) => worldFrame(nd, s));
  const sx = Math.min(...frames.map((f) => f.x)), sy = Math.min(...frames.map((f) => f.y));
  const maxW = Math.max(100, ...visual.map((nd, i) => frames[i].x + nd.frame.w)) - sx;
  const maxH = Math.max(70, ...visual.map((nd, i) => frames[i].y + nd.frame.h)) - sy;
  const scale = Math.min(1, Math.max(40, width - 20) / maxW);
  return Math.ceil(maxH * scale) + 76 + notes;
}
function renderedSlotCard(s, o, a, n, index, width, interactive) {
  const compact = n.props.view === "compact" || state.ui.compact;
  let content = "";
  if (compact) {
    const stats = s.fields.filter((f) => !f.removed && f.type === "number").slice(0, 10);
    const extra = s.fields.filter((f) => !f.removed && f.type === "calc" && !/стоимость|cost|points/i.test(f.name)).slice(0, 2);
    const fs = [...stats, ...extra].slice(0, 10);
    if (fs.length) {
      content = `<div class="compact-stats" style="height:46px;overflow:hidden"><table style="width:100%;table-layout:fixed;border-collapse:collapse;font:9.5px var(--mono,monospace);text-align:center;line-height:1.25"><tr>${fs.map((f) => `<th style="border:1px solid var(--border,#2c3849);padding:2px 1px;color:var(--muted,#8797ae);font-weight:400;overflow:hidden;white-space:nowrap">${esc(f.name)}</th>`).join("")}</tr><tr>${fs.map((f) => `<td style="border:1px solid var(--border,#2c3849);padding:3px 1px;color:var(--cyan,#22d3ee);font-weight:700;overflow:hidden;white-space:nowrap" data-live-field="${esc(f.name)}" data-s="${s.id}" data-o="${o.id}">${esc(displayValue(s, o, f.name))}</td>`).join("")}</tr></table></div>`;
    } else {
      content = s.fields.filter((f) => !f.removed && f.type !== "tags").slice(0, 4).map((f) => `<span>${esc(f.name)} <b data-live-field="${esc(f.name)}" data-s="${s.id}" data-o="${o.id}">${esc(displayValue(s, o, f.name))}</b></span>`).join(" ");
    }
  } else {
    const visual = s.nodes.filter((x) => VISUAL.includes(x.kind) && !x.hidden);
    if (visual.length) {
      const frames = visual.map((nd) => ({ nd, f: worldFrame(nd, s) }));
      const sx = Math.min(...frames.map((v) => v.f.x)), sy = Math.min(...frames.map((v) => v.f.y));
      const maxW = Math.max(100, ...frames.map((v) => v.f.x + v.nd.frame.w)) - sx;
      const maxH = Math.max(70, ...frames.map((v) => v.f.y + v.nd.frame.h)) - sy;
      const scale = Math.min(1, Math.max(40, width - 20) / maxW);
      const inner = document.createElement("div");
      inner.className = "template-card";
      inner.style.cssText = `position:relative;width:${maxW}px;height:${maxH}px;transform:scale(${scale});transform-origin:0 0;`;
      frames.forEach(({ nd, f }) => {
        if (!visibleNode(nd, s, o)) return;
        const el = buildNodeEl(nd, s, o, true);
        el.style.left = f.x - sx + "px";
        el.style.top = f.y - sy + "px";
        el.style.width = nd.frame.w + "px";
        el.style.height = nd.frame.h + "px";
        inner.appendChild(el);
      });
      const wrap = document.createElement("div");
      wrap.className = "template-scale-wrap";
      wrap.style.cssText = `position:relative;width:100%;height:${Math.ceil(maxH * scale)}px;overflow:hidden;`;
      wrap.appendChild(inner);
      content = wrap.outerHTML;
    } else content = renderSchemaCard(s, o);
  }
  return `<div class="roster-card ${compact ? "compact" : ""}" draggable="${interactive}" data-assignment="${a.id}" data-slot="${n.id}" data-index="${index}" data-object="${o.id}" data-schema="${s.id}"><div class="roster-card-head"><b>${esc(a.alias || o.name)}</b><span class="count-badge">×${a.count}</span>${interactive ? '<button data-act="edit" title="Имя и заметка экземпляра">✎</button><button data-act="dec" aria-label="Уменьшить количество">−</button><button data-act="inc" aria-label="Увеличить количество">＋</button><button data-act="rm" aria-label="Удалить">×</button>' : ""}</div><div class="roster-card-content">${content}</div><div class="roster-card-foot"><span>${esc(o.tags.join(" · "))}</span><b>${objectCost(o, a.count)} оч.</b></div>${a.notes ? `<p class="instance-note">${esc(a.notes)}</p>` : ""}</div>`;
}

      try { initialize(); }
      catch(e) {
        console.error("Recruit Forge: ошибка запуска",e);
        const message=document.createElement("div");
        message.setAttribute("role","alert");
        message.style.cssText="position:fixed;inset:20px 20px auto;z-index:100000;padding:18px;background:#351722;color:#fff;border:1px solid #ff4d6d;border-radius:8px;font:14px system-ui";
        message.textContent="Ошибка запуска приложения: "+e.message+". Откройте файл в актуальном Chrome, Edge или Firefox.";
        document.body.appendChild(message);
      }
    
    