"""Thesis figures for the reminder simulation (reads results/ written by simulate.py)."""
import csv
import json
import os

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

HERE = os.path.dirname(os.path.abspath(__file__))
RES = os.path.join(HERE, "results")

# One colour per strategy, the same in every figure (validated categorical slots 1-3).
COLOR = {"A fixed": "#2a78d6", "B+escalate": "#eb6834", "C adaptive": "#1baf7a"}
NEUTRAL = "#b9b7ae"
INK, INK2, GRID = "#0b0b0b", "#52514e", "#e6e4dd"
NAMES = {"A fixed": "A  Fixed alarm", "B routine": "B  Routine (current system)",
         "B+escalate": "B + follow-up & caregiver alert", "C-noTrust": "C without trust model",
         "C-noBandit": "C without style learning", "C adaptive": "C  Adaptive + trust (ours)"}

plt.rcParams.update({"font.family": "DejaVu Sans", "font.size": 10, "axes.edgecolor": GRID,
                     "axes.labelcolor": INK2, "xtick.color": INK2, "ytick.color": INK2,
                     "axes.spines.top": False, "axes.spines.right": False})


def style(ax, grid_axis="x"):
    ax.grid(axis=grid_axis, color=GRID, linewidth=0.8)
    ax.set_axisbelow(True)
    ax.tick_params(length=0)


def load():
    rows = list(csv.DictReader(open(os.path.join(RES, "summary.csv"), encoding="utf-8")))
    main = {r["strategy"]: r for r in rows if "[" not in r["strategy"]}
    groups = json.load(open(os.path.join(RES, "groups.json")))
    return main, groups


def fig_strategies(main):
    order = ["A fixed", "B routine", "B+escalate", "C-noTrust", "C-noBandit", "C adaptive"]
    fig, ax = plt.subplots(figsize=(8, 3.8), dpi=200)
    for i, s in enumerate(order):
        r = main[s]
        v, lo, hi = float(r["missed_%"]), float(r["ci_low"]), float(r["ci_high"])
        ax.barh(i, v, height=0.55, color=COLOR.get(s, NEUTRAL), edgecolor="white", linewidth=2)
        ax.errorbar(v, i, xerr=[[v - lo], [hi - v]], fmt="none", ecolor=INK2, elinewidth=1, capsize=3)
        ax.text(hi + 0.4, i, f"{v:.1f}%", va="center", color=INK, fontsize=9,
                fontweight="bold" if s == "C adaptive" else "normal")
    ax.set_yticks(range(len(order)), [NAMES[s] for s in order])
    ax.invert_yaxis()
    ax.set_xlabel("Missed medicine doses (% of doses, 95% CI over 100 patients)")
    ax.set_xlim(0, 21)
    style(ax)
    ax.set_title("Missed doses by reminder strategy (100 patients x 90 days)", loc="left", color=INK, fontsize=11)
    fig.tight_layout()
    return fig


def fig_bridge(main):
    """What took missed doses from the current system (B) down to ours (C)."""
    b, esc = float(main["B routine"]["missed_%"]), float(main["B+escalate"]["missed_%"])
    no_trust, c = float(main["C-noTrust"]["missed_%"]), float(main["C adaptive"]["missed_%"])
    steps = [("Current system (B)", b, None), ("+ follow-up reminder\n& caregiver alert", esc - b, "#eb6834"),
             ("+ risk-based timing\n& style learning", no_trust - esc, "#1baf7a"),
             ("+ trust model\nfor 'done' taps", c - no_trust, "#1baf7a"), ("Ours (C)", c, None)]
    fig, ax = plt.subplots(figsize=(8, 3.8), dpi=200)
    level = 0
    for i, (label, val, col) in enumerate(steps):
        if col is None:   # totals stand on the axis
            ax.bar(i, val, width=0.55, color="#5f5d57")
            ax.text(i, val + 0.3, f"{val:.1f}%", ha="center", color=INK, fontsize=9, fontweight="bold")
            level = val
        else:
            ax.bar(i, val, bottom=level, width=0.55, color=col)
            ax.text(i, level + 0.3, f"{val:+.1f}", ha="center", color=INK, fontsize=9)
            ax.plot([i - 1 + 0.275, i - 0.275], [level, level], color=INK2, linewidth=0.8, linestyle=":")
            level += val
    ax.set_xticks(range(len(steps)), [s[0] for s in steps], fontsize=8.5)
    ax.set_ylabel("Missed doses (%)")
    ax.set_ylim(0, 18.5)
    style(ax, "y")
    ax.set_title("Where the reduction comes from (orange: escalation only, green: the AI parts)",
                 loc="left", color=INK, fontsize=11)
    fig.tight_layout()
    return fig


def fig_severity(groups):
    sev = groups["severity"]
    cats = [k for k in ("Severe", "Moderate", "Mild") if k in sev]
    series = ["A fixed", "B+escalate", "C adaptive"]
    counts = groups["patients"]["severity_counts"]
    fig, ax = plt.subplots(figsize=(8, 3.8), dpi=200)
    w = 0.26
    for j, s in enumerate(series):
        for i, c in enumerate(cats):
            v = sev[c][s]
            x = i + (j - 1) * w
            ax.bar(x, v, width=w - 0.02, color=COLOR[s], edgecolor="white", linewidth=2, label=NAMES[s] if i == 0 else None)
            ax.text(x, v + 0.3, f"{v:.1f}", ha="center", color=INK, fontsize=8.5)
    ax.set_xticks(range(len(cats)), [f"{c} memory loss\n(n={counts[c]} patients)" for c in cats])
    ax.set_ylabel("Missed doses (%)")
    style(ax, "y")
    ax.legend(frameon=False, loc="upper right", fontsize=8.5)
    ax.set_title("The biggest gain is for patients with severe memory loss", loc="left", color=INK, fontsize=11)
    fig.tight_layout()
    return fig


def fig_weekly(groups):
    wk = groups["weekly_missed_%"]
    fig, ax = plt.subplots(figsize=(8, 3.6), dpi=200)
    for s in ("A fixed", "B+escalate", "C adaptive"):
        y = wk[s]
        x = list(range(1, len(y) + 1))
        ax.plot(x, y, color=COLOR[s], linewidth=2, marker="o", markersize=4)
        ax.text(x[-1] + 0.25, y[-1], f"{NAMES[s]}  {y[-1]:.1f}%", va="center", color=INK, fontsize=8.5)
    ax.set_xticks(range(1, len(wk["A fixed"]) + 1))
    ax.set_xlabel("Week")
    ax.set_ylabel("Missed doses (%)")
    ax.set_xlim(0.5, len(wk["A fixed"]) + 4.8)
    ax.set_ylim(0, None)
    style(ax, "y")
    ax.set_title("Week by week: memory gets worse over 90 days, ours keeps misses low", loc="left", color=INK, fontsize=11)
    fig.tight_layout()
    return fig


def main():
    main_rows, groups = load()
    out_dirs = [RES, os.path.join(os.path.expanduser("~"), "Desktop", "thesis_figures")]
    figs = {"fig_reminder_strategies.png": fig_strategies(main_rows), "fig_reminder_bridge.png": fig_bridge(main_rows),
            "fig_reminder_severity.png": fig_severity(groups), "fig_reminder_weekly.png": fig_weekly(groups)}
    for name, fig in figs.items():
        for d in out_dirs:
            if os.path.isdir(d):
                fig.savefig(os.path.join(d, name), facecolor="#fcfcfb")
        print("saved", name)


if __name__ == "__main__":
    main()
