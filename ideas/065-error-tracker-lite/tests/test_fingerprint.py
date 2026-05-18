from fingerprint import extract_frames, fingerprint, normalize_path


PY_STACK = '''Traceback (most recent call last):
  File "/app/site-packages/lib/foo.py", line 12, in handle
    raise TypeError("nope")
  File "/app/main.py", line 100, in main
    handle(x)
TypeError: nope'''

PY_STACK_DIFFERENT_LINE = '''Traceback (most recent call last):
  File "/app/site-packages/lib/foo.py", line 99, in handle
    raise TypeError("nope")
  File "/app/main.py", line 250, in main
    handle(y)
TypeError: nope'''

JS_STACK = '''TypeError: x is not a function
    at handle (/app/node_modules/lib/foo.js:12:7)
    at /app/index.js:100:3'''


def test_extract_frames_python():
    frames = extract_frames(PY_STACK)
    assert ("lib/foo.py", "handle") in frames
    assert ("app/main.py", "main") in frames


def test_extract_frames_javascript():
    frames = extract_frames(JS_STACK)
    assert any(fn == "handle" for _, fn in frames)


def test_fingerprint_stable_across_line_numbers():
    a = fingerprint("TypeError", PY_STACK)
    b = fingerprint("TypeError", PY_STACK_DIFFERENT_LINE)
    assert a == b


def test_fingerprint_differs_by_error_type():
    a = fingerprint("TypeError", PY_STACK)
    b = fingerprint("ValueError", PY_STACK)
    assert a != b


def test_normalize_path_drops_volatile_prefixes():
    assert normalize_path("/app/node_modules/foo/bar.js") == "foo/bar.js"
    assert normalize_path("/usr/lib/python3.12/site-packages/x/y.py") == "x/y.py"
