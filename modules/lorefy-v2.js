/* Premium statistics module for the local Lorefy preview. */
;(function () {
  "use strict";

  var React = window.React;
  if (!React) return;

  var h = React.createElement;
  var Icons = window.NenIcons || {};
  var DAY_LABELS = ["\u0627\u0644\u0633\u0628\u062a", "\u0627\u0644\u0623\u062D\u062F", "\u0627\u0644\u0627\u062B\u0646\u064A\u0646", "\u0627\u0644\u062B\u0644\u0627\u062B\u0627\u0621", "\u0627\u0644\u0623\u0631\u0628\u0639\u0627\u0621", "\u0627\u0644\u062E\u0645\u064A\u0633", "\u0627\u0644\u062C\u0645\u0639\u0629"];

  function number(value) {
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function format(value) {
    return number(value).toLocaleString("ar-SA");
  }

  function icon(Component, color, size) {
    return Component ? h(Component, { size: size || 18, color: color, strokeWidth: 2 }) : null;
  }

  function normalizeTypes(value) {
    if (!value) return [];
    if (!Array.isArray(value)) return Object.entries(value).map(function (entry) {
      return { label: entry[0], value: number(entry[1]) };
    });
    return value.map(function (item) {
      if (Array.isArray(item)) return { label: item[0], value: number(item[1]) };
      return {
        label: item && (item.label || item.type || item.name) || "-",
        value: number(item && (item.value || item.count || item.total))
      };
    });
  }

  function normalizeActivity(value) {
    var items = Array.isArray(value) ? value.slice(-7) : [];
    return DAY_LABELS.map(function (day, index) {
      var item = items[index];
      return {
        label: item && (item.label || item.day) || day,
        value: number(item && (item.value || item.minutes || item.count || item.total))
      };
    });
  }

  function StatsScreen(props) {
    var ctx = props && props.ctx || {};
    var C = ctx.C || {};
    var totals = ctx.achStats || {};
    var activity = normalizeActivity(ctx.readLog);
    var types = normalizeTypes(ctx.typeStats).sort(function (a, b) { return b.value - a.value; }).slice(0, 5);
    var activityMax = Math.max.apply(Math, activity.map(function (item) { return item.value; }).concat([1]));
    var typeMax = Math.max.apply(Math, types.map(function (item) { return item.value; }).concat([1]));
    var surface = C.card || "#fff";
    var surfaceAlt = C.card3 || C.fill2 || "#f4f2f8";
    var text = C.text || "#171521";
    var sub = C.sub || "#817b8c";
    var border = C.border || "#e9e6ef";
    var accent = C.accent || "#8A2BE2";
    var accentSoft = C.accentSoft || "rgba(138,43,226,0.10)";
    var green = C.green || "#1F9E5B";
    var blue = C.blue || "#0A6CDF";
    var gold = C.gold || "#FF9500";

    var metrics = [
      { label: "\u0633\u0627\u0639\u0627\u062A \u062A\u0642\u062F\u064A\u0631\u064A\u0629", value: ctx.readHours, Icon: Icons.Clock, color: accent },
      { label: "\u0639\u0645\u0644 \u0645\u0643\u062A\u0645\u0644", value: totals.totalRead, Icon: Icons.BookMarked, color: green },
      { label: "\u0641\u0635\u0644 \u0645\u0642\u0631\u0648\u0621", value: totals.totalChRead, Icon: Icons.BookOpen, color: blue },
      { label: "\u0645\u0631\u0627\u062C\u0639\u0629", value: totals.reviewCount, Icon: Icons.MessageCircle, color: gold }
    ];

    return h("main", {
      "aria-label": "\u0627\u0644\u0625\u062D\u0635\u0627\u0626\u064A\u0627\u062A \u0627\u0644\u0645\u062A\u0642\u062F\u0645\u0629",
      dir: "rtl",
      style: {
        minHeight: "100%",
        background: C.bg || "#F8F7FC",
        color: text,
        padding: "calc(env(safe-area-inset-top, 0px) + 18px) 16px 118px",
        boxSizing: "border-box"
      }
    },
      h("header", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 18 } },
        h("div", null,
          h("h1", { style: { margin: 0, fontSize: 24, lineHeight: 1.25, fontWeight: 850, letterSpacing: 0 } }, "\u0627\u0644\u0625\u062D\u0635\u0627\u0626\u064A\u0627\u062A"),
          h("p", { style: { margin: "5px 0 0", color: sub, fontSize: 12.5 } }, "\u0635\u0648\u0631\u0629 \u062F\u0642\u064A\u0642\u0629 \u0644\u0631\u062D\u0644\u062A\u0643 \u0627\u0644\u0642\u0631\u0627\u0626\u064A\u0629")
        ),
        h("button", {
          type: "button",
          "aria-label": "\u0627\u0644\u0639\u0648\u062F\u0629 \u0644\u0644\u062D\u0633\u0627\u0628",
          onClick: ctx.goBack,
          style: { width: 42, height: 42, borderRadius: 21, border: "1px solid " + border, background: surface, color: text, display: "grid", placeItems: "center", padding: 0, cursor: "pointer", flexShrink: 0 }
        }, icon(Icons.ChevronRight, text, 22))
      ),

      h("section", {
        "aria-label": "\u0645\u0644\u062E\u0635 \u0627\u0644\u0642\u0631\u0627\u0621\u0629",
        style: { background: surface, border: "1px solid " + border, borderRadius: 8, padding: 16, boxShadow: C.cardShadow || "none", marginBottom: 14 }
      },
        h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 14 } },
          h("div", null,
            h("p", { style: { margin: 0, color: sub, fontSize: 11.5, fontWeight: 700 } }, "\u0645\u0646 \u0627\u0644\u062A\u0642\u062F\u0645 \u0627\u0644\u0645\u062D\u0641\u0648\u0638"),
            h("p", { style: { margin: "4px 0 0", fontSize: 29, fontWeight: 900, lineHeight: 1, fontVariantNumeric: "tabular-nums" } }, format(ctx.readHours), " ", h("span", { style: { color: sub, fontSize: 12, fontWeight: 700 } }, "\u0633\u0627\u0639\u0627\u062A \u062A\u0642\u062F\u064A\u0631\u064A\u0629"))
          ),
          h("span", { style: { display: "inline-flex", alignItems: "center", gap: 6, background: accentSoft, color: accent, borderRadius: 16, padding: "7px 10px", fontSize: 11, fontWeight: 800 } }, icon(Icons.Sparkles, accent, 14), "Premium")
        ),
        h("div", { style: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 9 } }, metrics.map(function (metric) {
          return h("div", { key: metric.label, style: { minWidth: 0, background: surfaceAlt, borderRadius: 8, padding: "12px 11px", display: "grid", gridTemplateColumns: "34px minmax(0, 1fr)", alignItems: "center", gap: 9 } },
            h("span", { style: { width: 34, height: 34, borderRadius: 17, background: metric.color + "18", display: "grid", placeItems: "center" } }, icon(metric.Icon, metric.color, 16)),
            h("span", { style: { minWidth: 0 } },
              h("strong", { style: { display: "block", fontSize: 18, lineHeight: 1, fontVariantNumeric: "tabular-nums" } }, format(metric.value)),
              h("small", { style: { display: "block", color: sub, fontSize: 9.5, lineHeight: 1.4, marginTop: 5, whiteSpace: "normal", overflowWrap: "anywhere" } }, metric.label)
            )
          );
        })),
        h("details", { "data-reading-estimate": true, dir: "auto", style: { marginTop: 12, color: sub, fontSize: 12, lineHeight: 1.7 } },
          h("summary", { style: { minHeight: 44, padding: "10px 0", cursor: "pointer", color: text, fontWeight: 700 } }, "\u0643\u064A\u0641 \u064A\u064F\u062D\u0633\u0628 \u0627\u0644\u062A\u0642\u062F\u064A\u0631\u061F"),
          h("p", { style: { margin: "0 0 4px", overflowWrap: "anywhere" } }, "\u062A\u0642\u062F\u064A\u0631 \u062A\u0631\u0627\u0643\u0645\u064A \u0645\u0646 \u0627\u0644\u062A\u0642\u062F\u0645 \u0627\u0644\u0645\u062D\u0641\u0648\u0638\u060C \u0648\u0644\u064A\u0633 \u0645\u0624\u0642\u0651\u062A \u0642\u0631\u0627\u0621\u0629. \u0644\u0643\u0644 \u0639\u0645\u0644: \u0627\u0644\u0641\u0635\u0644 \u00D7 12 \u062F\u0642\u064A\u0642\u0629\u061B \u0648\u0625\u0644\u0627 \u0627\u0644\u0635\u0641\u062D\u0629 \u00D7 1.5 \u062F\u0642\u064A\u0642\u0629\u061B \u0648\u0625\u0644\u0627 \u0627\u0644\u0645\u062C\u0644\u062F \u00D7 90 \u062F\u0642\u064A\u0642\u0629. \u0644\u0627 \u062A\u064F\u062C\u0645\u0639 \u0627\u0644\u0648\u062D\u062F\u0627\u062A \u0644\u0646\u0641\u0633 \u0627\u0644\u0639\u0645\u0644\u060C \u0648\u064A\u064F\u0642\u0631\u0651\u0628 \u0627\u0644\u0648\u0642\u062A \u0627\u0644\u0645\u0648\u062C\u0628 \u0625\u0644\u0649 \u0633\u0627\u0639\u0627\u062A \u0643\u0627\u0645\u0644\u0629 \u0628\u062D\u062F \u0623\u062F\u0646\u0649 \u0633\u0627\u0639\u0629.")
        )
      ),

      h("section", {
        "aria-label": "\u0646\u0634\u0627\u0637 \u0627\u0644\u0642\u0631\u0627\u0621\u0629",
        style: { background: surface, border: "1px solid " + border, borderRadius: 8, padding: 16, marginBottom: 14 }
      },
        h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16 } },
          h("h2", { style: { margin: 0, fontSize: 17, fontWeight: 850 } }, "\u0646\u0634\u0627\u0637 \u0627\u0644\u0642\u0631\u0627\u0621\u0629"),
          h("span", { style: { color: sub, fontSize: 10.5 } }, "\u0622\u062E\u0631 \u0667 \u0623\u064A\u0627\u0645")
        ),
        h("div", { style: { height: 128, display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", alignItems: "end", gap: 7 } }, activity.map(function (item, index) {
          var height = item.value ? Math.max(14, Math.round(item.value / activityMax * 92)) : 5;
          return h("div", { key: index, title: item.label + ": " + format(item.value), style: { minWidth: 0, display: "flex", height: "100%", flexDirection: "column", justifyContent: "flex-end", alignItems: "center", gap: 7 } },
            h("span", { style: { color: item.value ? text : sub, fontSize: 9, fontWeight: 800, fontVariantNumeric: "tabular-nums" } }, item.value ? format(item.value) : ""),
            h("span", { style: { width: "100%", maxWidth: 24, height: height, background: item.value ? accent : C.fill || "#E8E4EE", borderRadius: 6, transition: "height .25s ease" } }),
            h("small", { style: { color: sub, fontSize: 8.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" } }, String(item.label).slice(0, 3))
          );
        }))
      ),

      h("section", {
        "aria-label": "\u062A\u0648\u0632\u064A\u0639 \u0627\u0644\u0623\u0646\u0648\u0627\u0639",
        style: { background: surface, border: "1px solid " + border, borderRadius: 8, padding: 16 }
      },
        h("h2", { style: { margin: "0 0 15px", fontSize: 17, fontWeight: 850 } }, "\u062A\u0648\u0632\u064A\u0639 \u0627\u0644\u0623\u0646\u0648\u0627\u0639"),
        types.length ? h("div", { style: { display: "grid", gap: 13 } }, types.map(function (item) {
          return h("div", { key: item.label },
            h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 6 } },
              h("span", { style: { fontSize: 12, fontWeight: 750, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }, item.label),
              h("span", { style: { color: sub, fontSize: 11, fontWeight: 700, fontVariantNumeric: "tabular-nums" } }, format(item.value))
            ),
            h("div", { style: { height: 7, background: C.fill || "#E8E4EE", borderRadius: 4, overflow: "hidden" } },
              h("div", { style: { width: Math.max(4, item.value / typeMax * 100) + "%", height: "100%", background: accent, borderRadius: 4 } })
            )
          );
        })) : h("div", { style: { background: surfaceAlt, borderRadius: 8, padding: "22px 14px", textAlign: "center" } },
          h("p", { style: { margin: 0, color: text, fontSize: 13, fontWeight: 750 } }, "\u0633\u062A\u0638\u0647\u0631 \u062A\u0641\u0627\u0635\u064A\u0644 \u0623\u0646\u0648\u0627\u0639\u0643 \u0647\u0646\u0627"),
          h("p", { style: { margin: "6px 0 0", color: sub, fontSize: 11 } }, "\u0623\u0636\u0641 \u0623\u0639\u0645\u0627\u0644\u0627 \u0644\u0645\u0643\u062A\u0628\u062A\u0643 \u0644\u0628\u0646\u0627\u0621 \u0625\u062D\u0635\u0627\u0626\u064A\u0627\u062A\u0643")
        )
      )
    );
  }

  window.LorefyV2 = Object.assign(window.LorefyV2 || {}, { StatsScreen: StatsScreen });
})();
