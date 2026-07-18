import pyautogui, time

pyautogui.PAUSE = 0
DELAY = 0.4
N = 30

print("Focus the browser! Starting in 3s...")
time.sleep(3)

delays = []
cycle_start = time.perf_counter()
for i in range(N):
    target_press = cycle_start + i * 0.8 + DELAY
    target_next = cycle_start + (i + 1) * 0.8
    while time.perf_counter() < target_press:
        pass
    actual = (time.perf_counter() - (cycle_start + i * 0.8)) * 1000
    pyautogui.press("space")
    delays.append(actual)
    while time.perf_counter() < target_next:
        pass

print(f"Python delays (ms): mean={sum(delays)/N:.1f} min={min(delays):.1f} max={max(delays):.1f}")
print("Browser RTs: run document.querySelector('#rt-log').textContent in devtools console")
