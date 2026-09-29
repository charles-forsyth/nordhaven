### Result
Electromagnetic shielding effectiveness (SE) was evaluated across 500 frequency points from 10 kHz to 10 GHz for 9 candidate materials and multilayer wall configurations under plane-wave, near-field magnetic (H-field), and aperture leakage conditions. In solid, continuous sheets, ferromagnetic materials (mu-metal and galvanized carbon steel) provide the highest low-frequency magnetic attenuation and astronomical theoretical far-field absorption, while conductive foils and Ni/Cu ripstop fabrics offer robust broad-spectrum plane-wave attenuation. However, when an unshielded 15 cm slot aperture is present, Bethe/Ott aperture diffraction completely dominates structural performance at UHF bands, reducing the effective shielding of every candidate material to less than 2 dB at 800 MHz.

### Key numbers
* **Near-Field Magnetic Shielding (at 0.3 m standoff):**
  * **100 kHz ($H$-field):** Mu-metal (0.5 mm) achieved 488.59 dB, galvanized carbon steel (0.8 mm) achieved 185.52 dB, 1.0 mm aluminum 6061 provided 77.73 dB, and 0.5 mm copper sheet provided 74.89 dB. Thin materials provided substantially lower magnetic isolation: 1 oz copper foil (47.63 dB), 0.05 mm aluminum foil (46.34 dB), 0.8 mm stainless steel 304 (42.52 dB), Ni/Cu conductive fabric (7.58 dB), and low-E metallized Mylar film (0.0 dB).
  * **30 MHz HF ($H$-field):** Mu-metal reached 8475.19 dB, galvanized steel reached 2876.16 dB, 1.0 mm aluminum sheet gave 547.85 dB, 0.5 mm copper sheet gave 438.82 dB, 0.8 mm stainless steel gave 152.99 dB, aluminum foil gave 104.63 dB, copper foil gave 104.05 dB, and Ni/Cu fabric gave 57.05 dB.
* **Plane-Wave Shielding Effectiveness:**
  * **HF (30 MHz):** Mu-metal (8489.43 dB), galvanized steel (2890.63 dB), 1.0 mm aluminum sheet (562.34 dB), 0.5 mm copper sheet (453.31 dB), 304 stainless steel (167.48 dB), aluminum foil (119.12 dB), copper foil (118.54 dB), Ni/Cu fabric (71.53 dB), and low-E film (39.57 dB).
  * **UHF (800 MHz):** Continuous aluminum sheet yielded 2516.08 dB, copper sheet reached 1937.84 dB, stainless steel reached 529.50 dB, aluminum foil yielded 221.31 dB, copper foil yielded 209.22 dB, Ni/Cu conductive fabric gave 75.01 dB, and low-E film gave 39.57 dB.
* **Aperture Degradation (15 cm slot):**
  * Across all candidate materials, the effective UHF (800 MHz) shielding collapses to ~1.93 dB (e.g., aluminum 6061: 1.9328 dB; copper foil: 1.9328 dB; Ni/Cu fabric: 1.9328 dB; low-E Mylar: 1.9320 dB).

### What it means for the report
* **Material Selection:** For an RV shelter, solid 1.0 mm aluminum or copper sheets provide more than enough intrinsic material attenuation (>100 dB across all operational communications bands). Where low-frequency magnetic interference (e.g., power distribution, submarine/LF beacons) is a threat, galvanized carbon steel or mu-metal must be incorporated to overcome the low magnetic reflection of non-ferrous metals.
* **Construction Bottleneck:** Intrinsic material shielding is essentially irrelevant if seams, windows, or vents remain unshielded. The introduction of an unshielded 15 cm slot reduces effective shelter isolation to under 2 dB at 800 MHz. The design focus must shift from thicker structural metal to seam overlap gaskets, waveguide-below-cutoff vent honeycomb panels, and conductive window treatments.
* **Lightweight Retrofits:** Ni/Cu ripstop fabric (71.5 dB plane-wave baseline) and copper foil tape provide sufficient barrier performance if bonding across joins is hermetically maintained.

### Limits
* Schelkunoff and 1D TMM formulations yield theoretical absorption values for thick conductors (e.g., >10,000 dB) that are physically unrealizable in practice due to the measurement dynamic range (typically 100–140 dB), enclosure cavity resonances, and finite edge effects.
* The execution log recorded matrix/floating-point warnings (`overflow encountered in dot`, `overflow encountered in cos/sin`, and `invalid value encountered in scalar divide`) inside the 1D TMM calculation at high frequencies due to large exponential attenuation across thick high-conductivity layers.
* Constant material properties ($\mu_r$ and $\sigma$) were assumed across the full 10 kHz to 10 GHz span; in reality, mu-metal permeability drops precipitously above ~10–100 kHz.

### Next run
* Add frequency-dependent complex permeability models $\mu_r(f)$ for mu-metal and carbon steel to reflect high-frequency roll-off and saturation.
* Implement aperture array attenuation (e.g., honeycomb waveguide-below-cutoff vents with defined cell diameters and depths) rather than a single free-space slot.
