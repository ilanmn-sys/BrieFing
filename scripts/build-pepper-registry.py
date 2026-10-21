#!/usr/bin/env python3
"""Regenerates pepper/registry.md (IDs only) from config.json.

    python3 scripts/build-pepper-registry.py          # write pepper/registry.md
    python3 scripts/build-pepper-registry.py --check  # exit 1 if registry.md is stale

config.json is the only place IDs live (CLAUDE.md). WhatsApp JIDs and a few verified people IDs are
not in config.json yet, so they sit in STATIC below with their source. Move them into config.json
when it gains a whatsapp section, and delete them here. Phone numbers are never written in full.
"""
import hashlib, json, pathlib, sys

root = pathlib.Path(__file__).resolve().parent.parent
cfg_path = root / "config.json"
out_path = root / "pepper" / "registry.md"

# Not in config.json. Source: Pepper's raw knowledge (MEMORY.md:74-98, groups-context.md) and the
# read-only connections check of 2026-10-21 (CONNECTIONS.md §2-3).
STATIC = {
    "whatsapp": [
        ("wa-comms", "Comms✨", "120363402527748008@g.us", "groups-context.md:123; GROUPS.md:15"),
        ("wa-mondaypr", "mondayPR🇮🇱", "19175666675-1579723915@g.us", "MEMORY.md:86; groups-context.md:6"),
        ("wa-ilan-or", "אילן אור ו-Pepper", "120363426187717225@g.us", "MEMORY.md:81; groups-context.md:106"),
        ("(not pilot) wa-media-relations", "Media relations ✨", "120363046265574722@g.us", "MEMORY.md:89; C-08"),
        ("(not pilot) wa-ilan-dm", "Ilan DM", "number ending 3241 (full JID in platform allowlist only)", "MEMORY.md:82; C-03"),
    ],
    "people": [
        ("Or Elmaliah", "monday 11990559 · Slack USZ21R877 · WA ending 4996", "CONNECTIONS.md §2-3 (verified); C-03"),
        ("Noam Safier (Slack)", "Slack U0BDEHQR2S3", "CONNECTIONS.md §3 (verified)"),
        ("Eden Cohen (Scherf, external)", "monday 22575907", "CONNECTIONS.md §2 (verified)"),
        ("Zohar Dublin (Scherf, external)", "monday 64483031", "CONNECTIONS.md §2 (verified)"),
        ("Anat Paz (Scherf, external)", "monday 65928524", "CONNECTIONS.md §2 (verified); C-20"),
    ],
}


def build(cfg, digest):
    L = []
    w = L.append
    w("# Registry (IDs only)")
    w("")
    w("> Generated from `config.json` by `scripts/build-pepper-registry.py` — do not hand-edit.")
    w(f"> config.json sha256: `{digest}`. If it differs from the live file, rerun the script.")
    w("> Rules about how to use these IDs live in CORE.md and the cards, not here.")
    w("")

    me, pep, sl = cfg["me"], cfg["pepper"], cfg.get("slack", {})
    req = cfg.get("requests", {})
    w("## People and bots")
    w("| Who | IDs |")
    w("|---|---|")
    w(f"| {me['name']} | monday {me['mondayUserId']} · Slack DM target `user:{me['slackUserId']}` · tz {me['tz']} · work week {me['workWeek']} |")
    w(f"| Pepper (bot) | Slack {pep['userId']} |")
    w(f"| Claude app (proxy footer) | Slack {sl.get('claudeAppUserId', '')} |")
    w(f"| Brie Fing (request desk agent) | monday {req.get('briefingAgentUserId', '')} · Slack DM target `user:{req.get('briefingAgentSlackId', '')}` |")
    if cfg.get("influencers", {}).get("mandyUserId"):
        w(f"| Mandy Monday | Slack {cfg['influencers']['mandyUserId']} |")
    for name, o in cfg.get("commsOwners", {}).items():
        if name != "Ilan":
            w(f"| {name} | monday {o['id']} ({', '.join(o['regions'])}) |")
    for name, ids, src in STATIC["people"]:
        w(f"| {name} | {ids} (static: {src}) |")
    w(f"\nNot a send target: Slack DM channel `{pep['dmChannel']}`. Send to `user:<id>` (S-005).")
    w("")

    w("## Boards")
    w("| Key | Board ID |")
    w("|---|---|")
    seen = set()
    for k, v in cfg["boards"].items():
        if isinstance(v, int) and v not in seen:
            seen.add(v)
            w(f"| {k} | {v} |")
    w(f"| agencies.syncNotes (Scherf <> monday.com) | {cfg['agencies']['syncNotesBoardId']} |")
    w(f"| news.spokespeople | {cfg['news']['spokespeople']['boardId']} |")
    w("")

    g = cfg["groups"]
    w(f"## Projects board {cfg['boards']['projects']}: groups")
    w("| Use | Key | Group ID |")
    w("|---|---|---|")
    for k, v in g["canonical"].items():
        w(f"| canonical | {k} | `{v['id']}` |")
    w(f"| R-13 automation target | activeProjects | `{g['activeProjects']}` |")
    w(f"| personal track (main session only) | personal | `{g['personal']}` |")
    for k, v in g["parking"].items():
        w(f"| parking — DO NOT WRITE | {k} | `{v}` |")
    for v in g["legacy"]:
        w(f"| legacy — NEVER WRITE | — | `{v}` |")
    for v in g["excluded"]:
        w(f"| excluded | — | `{v}` |")
    w("")

    c = cfg["columns"]
    w(f"## Projects board {cfg['boards']['projects']}: columns")
    w("| Key | Column ID |")
    w("|---|---|")
    for k, v in c.items():
        if k != "neverUse":
            w(f"| {k} | `{v}` |")
    for v in c["neverUse"]:
        w(f"| NEVER USE | `{v}` |")
    w("")

    cc = cfg["commsCalendar"]
    w(f"## Comms calendar {cc['boardId']}")
    w("Groups: " + " · ".join(f"{k} `{v}`" for k, v in cc["groups"].items()))
    w("Columns: " + " · ".join(f"{k} `{v}`" for k, v in cc["columns"].items()))
    w("")

    n = cfg["news"]
    w(f"## News board {n['boardId']}")
    w("Groups: " + " · ".join(f"{k} `{v}`" for k, v in n["groups"].items()))
    w("")

    inf = cfg["influencers"]
    w(f"## Influencers CRM {inf['boardId']}")
    w("Groups: " + " · ".join(f"{k} `{v}`" for k, v in inf["groups"].items()))
    w(f"Columns used by the pilot: elevate `{inf['columns']['elevate']}` · stage `{inf['columns']['stage']}` · owner `{inf['columns']['owner']}`")
    w("")

    w("## Slack channels")
    w("| Channel | ID |")
    w("|---|---|")
    for k, v in cfg["slackChannelIds"].items():
        w(f"| #{k} | {v} |")
    w("")

    w("## WhatsApp chats (static: not in config.json yet)")
    w("| Card id | Chat | JID | Source |")
    w("|---|---|---|---|")
    for cid, name, jid, src in STATIC["whatsapp"]:
        w(f"| {cid} | {name} | `{jid}` | {src} |")
    w("")
    return "\n".join(L)


def main():
    raw = cfg_path.read_bytes()
    text = build(json.loads(raw), hashlib.sha256(raw).hexdigest()[:12])
    if "--check" in sys.argv:
        ok = out_path.exists() and out_path.read_text() == text
        print("registry: up to date" if ok else "registry: STALE, rerun scripts/build-pepper-registry.py")
        sys.exit(0 if ok else 1)
    out_path.parent.mkdir(exist_ok=True)
    out_path.write_text(text)
    print(f"wrote {out_path.relative_to(root)} ({len(text.encode())} bytes)")


if __name__ == "__main__":
    main()
