import glob, json, h5py, numpy as np
TRAPZ = getattr(np, 'trapezoid', None) or np.trapz
import matplotlib; matplotlib.use("Agg"); import matplotlib.pyplot as plt
from scipy.integrate import quad
L, Om, OL, Ob, h, s8, ns = 200.0, 0.3111, 0.6889, 0.0490, 0.6766, 0.8102, 0.9665
RHO_M = 2.775e11 * Om   # Msun/h per (Mpc/h)^3

def growth(a):
    H = lambda x: np.sqrt(Om / x**3 + OL)
    return 2.5 * Om * H(a) * quad(lambda x: 1.0 / (x * H(x))**3, 0, a)[0]

def tk_eh(k):  # same Eisenstein-Hu no-wiggle form GADGET-4 uses (k in h/Mpc)
    ombh2, ommh2, theta = Ob * h * h, Om * h * h, 2.728 / 2.7
    s = 44.5 * np.log(9.83 / ommh2) / np.sqrt(1 + 10 * ombh2**0.75) * h
    a = 1 - 0.328 * np.log(431 * ommh2) * ombh2 / ommh2 + 0.380 * np.log(22.3 * ommh2) * (ombh2 / ommh2)**2
    gam = (a + (1 - a) / (1 + (0.43 * k * s)**4)) * Om * h
    q = k * theta**2 / gam
    L0 = np.log(2 * np.e + 1.8 * q); C0 = 14.2 + 731 / (1 + 62.5 * q)
    return L0 / (L0 + C0 * q * q)

kk_int = np.logspace(-4, 2, 4000)
def sigma_R(R, norm=1.0):
    x = kk_int * R; W = 3 * (np.sin(x) - x * np.cos(x)) / x**3
    P = norm * kk_int**ns * tk_eh(kk_int)**2
    return np.sqrt(TRAPZ(P * W**2 * kk_int**3, np.log(kk_int)) / (2 * np.pi**2))
NORM = (s8 / sigma_R(8.0))**2
P_lin0 = lambda k: NORM * k**ns * tk_eh(k)**2

def load(path):
    with h5py.File(path) as f:
        return f["PartType1/Coordinates"][:].astype(np.float64), float(f["Header"].attrs["Time"])

def pk(x, n=256):
    g = (x / L * n) % n; i = np.floor(g).astype(np.int64); d = g - i
    rho = np.zeros(n**3)
    for dx in (0, 1):
        for dy in (0, 1):
            for dz in (0, 1):
                w = (d[:, 0] if dx else 1 - d[:, 0]) * (d[:, 1] if dy else 1 - d[:, 1]) * (d[:, 2] if dz else 1 - d[:, 2])
                idx = (((i[:, 0] + dx) % n) * n + (i[:, 1] + dy) % n) * n + (i[:, 2] + dz) % n
                rho += np.bincount(idx, weights=w, minlength=n**3)
    delta = rho.reshape(n, n, n) / rho.mean() - 1
    P = np.abs(np.fft.rfftn(delta))**2 * L**3 / n**6
    k1 = np.fft.fftfreq(n, d=L / n) * 2 * np.pi; kz = np.fft.rfftfreq(n, d=L / n) * 2 * np.pi
    kk = np.sqrt(k1[:, None, None]**2 + k1[None, :, None]**2 + kz[None, None, :]**2)
    b = np.floor(kk / (2 * np.pi / L)).astype(int)
    return {j: (float(kk[b == j].mean()), float(P[b == j].mean()), int((b == j).sum())) for j in range(1, 9)}

def frame(x, a, out):
    sl = x[:, 2] < 20.0   # 20 Mpc/h thick slab
    H, _, _ = np.histogram2d(x[sl, 0], x[sl, 1], bins=1024, range=[[0, L], [0, L]])
    fig = plt.figure(figsize=(8, 8), dpi=128); ax = fig.add_axes([0, 0, 1, 1]); ax.axis("off")
    ax.imshow(np.log10(1 + H.T), origin="lower", cmap="inferno", vmin=0, vmax=2.6)
    ax.text(0.02, 0.97, f"z = {1/a - 1:.2f}   ({200:.0f} Mpc/h box, 20 Mpc/h slab)", color="w",
            transform=ax.transAxes, fontsize=13, va="top")
    fig.savefig(out); plt.close(fig)

res = {}
snaps = sorted(glob.glob("output/snapshot_*.hdf5"))
x0, a0 = load(snaps[0]); p0 = pk(x0); frame(x0, a0, "frames/frame_000.png"); del x0
for s in snaps[1:-1]:
    x, a = load(s); frame(x, a, f"frames/frame_{s[-8:-5]}.png"); del x
x1, a1 = load(snaps[-1]); p1 = pk(x1); frame(x1, a1, f"frames/frame_{snaps[-1][-8:-5]}.png"); del x1
expect = (growth(a1) / growth(a0))**2
print(f"last snapshot a={a1:.4f} (z={1/a1-1:.3f}); {len(snaps)} snapshots")
print(f"P(k) growth a={a0:.4f}->{a1:.4f}: linear theory D^2 ratio = {expect:.1f}")
growth_rows = []
for j in range(1, 9):
    k, P1, nm = p1[j]; r = P1 / p0[j][1]
    lin = P_lin0(k) * (growth(a1) / growth(1.0))**2
    growth_rows.append((k, r / expect, P1 / lin, nm))
    print(f"  k={k:.3f} h/Mpc ({nm:5d} modes): growth {r/expect:.2f} x theory, P(z) / P_lin {P1/lin:.2f}")
res["pk"] = growth_rows
lo = float(np.mean([g[1] for g in growth_rows[1:4]]))

# halo mass function at the last snapshot vs Watson+2013 FOF fit
fof = sorted(glob.glob("output/fof_tab_*.hdf5"))[-1]
with h5py.File(fof) as f:
    n = int(f["Header"].attrs["Ngroups_Total"])
    M = f["Group/GroupMass"][:] * 1e10; N = f["Group/GroupLen"][:]
mp = RHO_M * L**3 / 256**3
print(f"FOF at {fof}: {n} groups; particle mass {mp:.3e} Msun/h; largest {M.max():.2e} Msun/h ({N.max()} particles)")
Dz = growth(a1) / growth(1.0)
def dndlnM(m):
    R = (3 * m / (4 * np.pi * RHO_M))**(1 / 3)
    s = sigma_R(R, NORM) * Dz; s2 = sigma_R(R * 1.01, NORM) * Dz
    dlns_dlnM = (np.log(s2) - np.log(s)) / (3 * np.log(1.01))
    f = 0.282 * ((1.406 / s)**2.163 + 1) * np.exp(-1.210 / s**2)
    return f * RHO_M / m * abs(dlns_dlnM)
edges = np.logspace(np.log10(100 * mp), np.log10(M.max()) + 0.01, 9)
rows, ok = [], []
for lo_m, hi_m in zip(edges[:-1], edges[1:]):
    cnt = int(((M >= lo_m) & (M < hi_m)).sum())
    pred = quad(lambda lnm: dndlnM(np.exp(lnm)), np.log(lo_m), np.log(hi_m))[0] * L**3
    rows.append((lo_m, hi_m, cnt, pred))
    flag = "" if cnt < 50 else ("ok" if abs(cnt / pred - 1) < 0.25 else "OFF")
    if cnt >= 50: ok.append(abs(cnt / pred - 1) < 0.25)
    print(f"  {lo_m:.2e}-{hi_m:.2e}: {cnt:6d} halos, Watson fit {pred:9.1f}  ratio {cnt/max(pred,1e-9):.2f} {flag}")
res["hmf"] = rows
verdict = "PASS" if (0.8 < lo < 1.25 and ok and all(ok) and abs(a1 - 1) < 1e-3) else ("PARTIAL (stopped early, restart files written)" if a1 < 0.999 else "CHECK")
print("RUN VERDICT:", verdict)
res.update(verdict=verdict, a_last=a1, n_groups=n, largest=float(M.max()), particle_mass=mp)
json.dump(res, open("check.json", "w"), indent=1)

# plots
fig, ax = plt.subplots(1, 2, figsize=(12, 5))
cen = np.sqrt(edges[:-1] * edges[1:])
ax[0].loglog(cen, [r[2] for r in rows], "o", label="simulation (FOF)")
ax[0].loglog(cen, [r[3] for r in rows], "-", label="Watson+2013 fit")
ax[0].set_xlabel("halo mass [Msun/h]"); ax[0].set_ylabel("halos per bin"); ax[0].legend(); ax[0].set_title(f"Halo mass function, z={1/a1-1:.2f}")
ks = np.logspace(-1.6, 0.6, 200)
ax[1].loglog(ks, P_lin0(ks) * Dz**2, "-", label="linear theory")
ax[1].loglog([p1[j][0] for j in p1], [p1[j][1] for j in p1], "o", label="simulation")
ax[1].set_xlabel("k [h/Mpc]"); ax[1].set_ylabel("P(k) [(Mpc/h)^3]"); ax[1].legend(); ax[1].set_title("Matter power spectrum")
fig.tight_layout(); fig.savefig("check.png", dpi=110)
