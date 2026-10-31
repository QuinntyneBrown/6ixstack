"""Render every registered mock into docs/mocks and write manifest.json."""
import sys, importlib
sys.path.insert(0, __import__("os").path.dirname(__file__))
import core
for m in ("s_events", "s_directory", "s_organizer"):
    try:
        importlib.import_module(m)
    except ModuleNotFoundError as e:
        if e.name != m: raise
        print(f"skip {m} (not written yet)")
print(core.build(), "files")
