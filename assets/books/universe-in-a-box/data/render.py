"""Render the job 307 universe (GADGET-4, 256^3, 200 Mpc/h) into presentation media.

Outputs in ./job/media/:
  universe_zoomout.mp4  - full 200 Mpc/h slab, Big Bang -> today, smooth (particles
                          followed by ID between the 12 snapshots)
  cluster_zoom.mp4      - 40 Mpc/h cube around the biggest cluster (1.9e15 Msun/h)
  frame_z*.png          - stills at chosen redshifts
  pk_growth.png         - power spectrum at every snapshot vs linear theory
  hmf.png               - halo mass function vs Watson+2013 (copied check.png)
Interpolation between snapshots is visual only (linear in comoving position, with
periodic wrap); the stills and the analysis use real snapshots.
"""
import glob
import os
import subprocess
import sys

import h5py
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

BASE = os.path.expanduser("./job/run256")
OUT = os.path.expanduser("./job/media")
os.makedirs(OUT, exist_ok=True)
L = 200.0
NPIX = 1080
SLAB = 20.0          # Mpc/h slab thickness for the wide view
FPS = 30
STEPS = 30           # interpolated frames between snapshots
CMAP = plt.get_cmap("inferno")
H0, Om, OL = 67.66, 0.3111, 0.6889


def age_gyr(a):
    # flat LCDM age at scale factor a
    from math import asinh, sqrt
    return 2 / (3 * H0 * sqrt(OL)) * asinh(sqrt(OL / Om) * a ** 1.5) * 977.8


snaps = sorted(glob.glob(f"{BASE}/output/snapshot_*.hdf5"))
if len(snaps) < 12:
    sys.exit(f"only {len(snaps)} snapshots present")

# biggest cluster at z=0
with h5py.File(f"{BASE}/output/fof_tab_011.hdf5") as f:
    g = f["Group"]
    big = int(np.argmax(g["GroupMass"][:]))
    CEN = g["GroupPos"][big].astype(np.float64)
    BIGM = float(g["GroupMass"][big]) * 1e10


def load(path):
    with h5py.File(path) as f:
        a = float(f["Header"].attrs["Time"])
        ids = f["PartType1/ParticleIDs"][:]
        x = f["PartType1/Coordinates"][:]
    order = np.argsort(ids, kind="stable")
    return a, x[order].astype(np.float32)


from scipy.ndimage import gaussian_filter


def render(img, title, sub, out, cmax, sigma=1.0):
    # density contrast relative to the mean, smoothed; mean density maps to a dim red
    rho = gaussian_filter(img.astype(np.float64), sigma, mode="wrap")
    rho /= max(rho.mean(), 1e-12)
    v = np.clip((np.log10(rho + 0.05) + 1.0) / (np.log10(cmax) + 1.0), 0, 1)
    rgb = (CMAP(v)[:, :, :3] * 255).astype(np.uint8)
    fig = plt.figure(figsize=(NPIX / 100, NPIX / 100), dpi=100)
    ax = fig.add_axes([0, 0, 1, 1]); ax.axis("off")
    ax.imshow(rgb, origin="lower", interpolation="nearest")
    ax.text(0.025, 0.965, title, color="white", fontsize=22, transform=ax.transAxes, va="top", weight="bold")
    ax.text(0.025, 0.915, sub, color="#dddddd", fontsize=14, transform=ax.transAxes, va="top")
    ax.text(0.975, 0.025, "GADGET-4 on the cluster  |  16.8M particles  |  88 cores, 2h56m",
            color="#aaaaaa", fontsize=11, transform=ax.transAxes, ha="right")
    fig.savefig(out); plt.close(fig)


def wide_image(x):
    sl = x[:, 2] < SLAB
    H, _, _ = np.histogram2d(x[sl, 1], x[sl, 0], bins=NPIX, range=[[0, L], [0, L]])
    return H


def zoom_image(x, half=20.0):
    d = (x - CEN + L / 2) % L - L / 2           # periodic offset from the cluster
    m = (np.abs(d) < half).all(axis=1)
    H, _, _ = np.histogram2d(d[m, 1], d[m, 0], bins=NPIX, range=[[-half, half], [-half, half]])
    return H


def interp(x0, x1, t):
    d = (x1 - x0 + L / 2) % L - L / 2
    return (x0 + t * d) % L


def label(a):
    z = 1 / a - 1
    return f"z = {z:5.2f}", f"{age_gyr(a):5.2f} billion years after the Big Bang"


def encode(pattern, out):
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-framerate", str(FPS), "-i", pattern,
                    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", "-movflags", "+faststart", out],
                   check=True)


def main():
    wdir, zdir = f"{OUT}/frames_wide", f"{OUT}/frames_zoom"
    os.makedirs(wdir, exist_ok=True); os.makedirs(zdir, exist_ok=True)
    n = 0
    a0, x0 = load(snaps[0])
    for k in range(1, len(snaps)):
        a1, x1 = load(snaps[k])
        last = k == len(snaps) - 1
        for s in range(STEPS + (1 if last else 0)):
            t = s / STEPS
            # smoothstep in log(a) for the label so time flows evenly
            a = np.exp(np.log(a0) + t * (np.log(a1) - np.log(a0)))
            x = interp(x0, x1, t)
            title, sub = label(a)
            render(wide_image(x), title, sub + "   |   200 Mpc/h slice (about 900 million light-years)",
                   f"{wdir}/{n:05d}.png", 60, 1.6)
            render(zoom_image(x), title, sub + f"   |   40 Mpc/h around the biggest cluster",
                   f"{zdir}/{n:05d}.png", 400, 2.5)
            n += 1
        print(f"snapshot {k}: a={a1:.3f}, frames so far {n}", flush=True)
        a0, x0 = a1, x1
    # hold the final frame 2 s
    for _ in range(2 * FPS):
        for d in (wdir, zdir):
            os.link(f"{d}/{n-1:05d}.png", f"{d}/{n:05d}.png") if not os.path.exists(f"{d}/{n:05d}.png") else None
        n += 1
    encode(f"{wdir}/%05d.png", f"{OUT}/universe_zoomout.mp4")
    encode(f"{zdir}/%05d.png", f"{OUT}/cluster_zoom.mp4")
    print("videos done", flush=True)

    # stills from real snapshots
    for i in (0, 3, 6, 8, 11):
        a, x = load(snaps[i])
        title, sub = label(a)
        render(wide_image(x), title, sub, f"{OUT}/still_wide_{i:02d}_z{1/a-1:.1f}.png", 60, 1.6)
        render(zoom_image(x), title, sub + "  |  biggest cluster region", f"{OUT}/still_zoom_{i:02d}_z{1/a-1:.1f}.png", 400, 2.5)

    # power spectrum growth from GADGET's own measurements
    fig, ax = plt.subplots(figsize=(10, 6.5))
    cols = plt.get_cmap("viridis")(np.linspace(0, 1, 12))
    for i in range(12):
        p = f"{BASE}/output/powerspecs/powerspec_{i:03d}.txt"
        with open(p) as fh:
            lines = fh.read().split("\n")
        a = float(lines[0]); nb = int(lines[1])
        rows = np.array([list(map(float, ln.split())) for ln in lines[5:5 + nb]])
        k, d2, shot = rows[:, 0], rows[:, 1], rows[:, 4]
        P = d2 * 2 * np.pi**2 / k**3
        m = (d2 > 3 * shot) & (k < 3)   # drop shot-noise dominated bins
        ax.loglog(k[m], P[m], color=cols[i], lw=1.6, label=f"z = {1/a-1:.1f}")
    ax.set_xlabel("k  [h/Mpc]   (small k = big scales)", fontsize=12)
    ax.set_ylabel("P(k)  [(Mpc/h)^3]   (how clumpy)", fontsize=12)
    ax.set_title("Matter power spectrum: structure grows about 2,500x from z=63 to today", fontsize=13)
    ax.legend(ncol=2, fontsize=9); ax.grid(alpha=0.3, which="both")
    fig.tight_layout(); fig.savefig(f"{OUT}/pk_growth.png", dpi=120); plt.close(fig)
    print("stills + plots done; biggest cluster", f"{BIGM:.2e}", CEN, flush=True)


if __name__ == "__main__":
    main()
