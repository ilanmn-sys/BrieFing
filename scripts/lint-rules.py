#!/usr/bin/env python3
"""Mechanical rule lint for agents/*/prompt.md (R-12 enforcement)."""
import re, sys, pathlib

root = pathlib.Path(__file__).resolve().parent.parent
errors = []
for p in sorted(root.glob("agents/*/prompt.md")):
    t = p.read_text()
    low = t.lower()
    if not re.search(r"system clock|today\(\)", low):
        errors.append(f"{p}: R-09 missing system-clock read")
    if "learning-log" not in low:
        errors.append(f"{p}: missing LEARNING-LOG §1 read")
    if re.search(r"\bD[0-9A-Z]{9,}\b", t):
        errors.append(f"{p}: hard-coded DM channel id (use config + user:<id>)")
    if re.search(r"group_mm5p24nn|group_mm65750m|group_mm65tada|group_mm5ptt65|group_mm5wxtwc", t) and "never" not in low:
        errors.append(f"{p}: R-13 references legacy group without a 'never' guard")
    if re.search(r"(create|set|add)[^\n]{0,40}(deadline|due date)[^\n]{0,40}automation", low):
        errors.append(f"{p}: R-04 possible dating of an automation")
for e in errors:
    print(e)
print(f"lint: {len(errors)} violation(s)")
sys.exit(1 if errors else 0)
