from vpython import *
import numpy as np

# =======================================================================
# 1. HELPER FUNCTIONS from the 2D Animation Code
# =======================================================================

def solve_kepler(M, e, tolerance=1e-6):
    """Solves Kepler's equation M = E - e*sin(E) for E using Newton's method."""
    E = M
    for _ in range(100):
        f_val = E - e * np.sin(E) - M
        f_prime_val = 1 - e * np.cos(E)
        if abs(f_prime_val) < 1e-10: break
        delta_E = f_val / f_prime_val
        E = E - delta_E
        if abs(delta_E) < tolerance: break
    return E

def get_initial_M_from_phi(phi, e):
    """Calculates the initial Mean Anomaly (M) for a given starting True Anomaly (phi)."""
    # This function is crucial for starting the orbit at the correct convergence point.
    tan_E_half = np.sqrt((1 - e) / (1 + e)) * np.tan(phi / 2)
    E = 2 * np.arctan(tan_E_half)
    M = E - e * np.sin(E)
    return M

# =======================================================================
# 2. CONSTANTS AND PARAMETERS
# =======================================================================

# --- Planet "Halferth" Parameters ---
planet_rot_period_h = 21
planet_rot_period_s = planet_rot_period_h * 3600

# --- Moon "Mother" Parameters ---
a_mother = 6.56e5 * 1000
e_mother = 0.35
P_mother_days = 70

# --- Moon "Daughter" Parameters ---
a_daughter = 4.13e5 * 1000
e_daughter = 0.3
P_daughter_days = 35

# =======================================================================
# 3. SIMULATION TIMING AND SCALING
# =======================================================================

# --- Time Scale: Focus on the 70-day convergence cycle ---
SIMULATION_CYCLE_DAYS = 70
H_DAY_SECONDS = planet_rot_period_s
SIMULATION_CYCLE_SECONDS = SIMULATION_CYCLE_DAYS * H_DAY_SECONDS

FRAME_RATE = 100
# Set animation to run for 60 seconds total
DT = SIMULATION_CYCLE_SECONDS / (FRAME_RATE * 60)

# --- Visual Scaling ---
r_apogee_mother = a_mother * (1 + e_mother)
VIEW_SCALE = r_apogee_mother * 1.2

R_planet_viz = VIEW_SCALE / 30
R_mother_viz = R_planet_viz / 1.5
R_daughter_viz = R_planet_viz / 4

# =======================================================================
# 4. SCENE AND OBJECT SETUP
# =======================================================================

scene.caption = "Halferth Planetary System: 70-Day Cycle"
scene.background = color.black
scene.range = VIEW_SCALE
scene.center = vector(0, 0, 0)

# --- Planet "Halferth" (No Axial Tilt) ---
planet = sphere(
    pos=vector(0, 0, 0),
    radius=R_planet_viz,
    color=color.blue
)
# Planet's axis is now perfectly vertical (Y-axis)
planet.axis = vector(0, 1, 0)
planet_rotation_rate = 2 * np.pi / planet_rot_period_s

# Equator ring is now in the horizontal X-Z plane
equator = ring(pos=vector(0,0,0), axis=planet.axis, radius=R_planet_viz * 1.1, thickness=R_planet_viz*0.01, color=color.green)

# --- South Pole Post (for perspective) ---
post_radius = R_planet_viz * 0.05
post_length = R_planet_viz * 0.75
south_pole_post = cylinder(
    pos=vector(0, -R_planet_viz, 0),
    axis=vector(0, -post_length, 0),
    radius=post_radius,
    color=color.red
)

# --- Moons "Mother" and "Daughter" ---
mother = sphere(radius=R_mother_viz, color=color.cyan, make_trail=True, trail_color=color.cyan, trail_radius=R_planet_viz*0.05)
daughter = sphere(radius=R_daughter_viz, color=color.magenta, make_trail=True, trail_color=color.magenta, trail_radius=R_planet_viz*0.03)

# =======================================================================
# 5. ANIMATION LOOP
# =======================================================================

# --- Pre-calculate constant values for the loop ---
P_mother_s = P_mother_days * H_DAY_SECONDS
n_mother = 2 * np.pi / P_mother_s

P_daughter_s = P_daughter_days * H_DAY_SECONDS
n_daughter = 2 * np.pi / P_daughter_s

# --- Calculate the Initial Mean Anomaly for the "Set" position start ---
start_phi = -np.pi / 2
M_initial_mother = get_initial_M_from_phi(start_phi, e_mother)
M_initial_daughter = get_initial_M_from_phi(start_phi, e_daughter)

day_counter_label = label(
    pos=vector(0, VIEW_SCALE * 0.9, 0), # Moved to top
    text=f"Day: 0.0 / {SIMULATION_CYCLE_DAYS}",
    height=16, border=4, font='sans', box=False, line=False
)

sim_time_s = 0.0

while True:
    rate(FRAME_RATE)

    sim_time_s += DT
    current_day = sim_time_s / H_DAY_SECONDS
    day_counter_label.text = f"Day: {current_day:.1f} / {SIMULATION_CYCLE_DAYS}"

    if sim_time_s >= SIMULATION_CYCLE_SECONDS:
        sim_time_s = 0 # Loop the 70-day cycle

    # --- Rotate the planet and its post ---
    planet.rotate(angle=planet_rotation_rate * DT, axis=planet.axis, origin=planet.pos)
    equator.rotate(angle=planet_rotation_rate * DT, axis=planet.axis, origin=planet.pos)
    south_pole_post.rotate(angle=planet_rotation_rate * DT, axis=planet.axis, origin=planet.pos)

    # --- Calculate Moon Positions using Kepler's Equation ---
    # Mother
    M_m = M_initial_mother + n_mother * sim_time_s
    E_m = solve_kepler(M_m, e_mother)
    r_m = a_mother * (1 - e_mother * np.cos(E_m))
    phi_m = 2 * np.arctan2(np.sqrt(1 + e_mother) * np.sin(E_m / 2), np.sqrt(1 - e_mother) * np.cos(E_m / 2))
    # New orientation: orbit in the X-Y plane
    mother.pos = vector(r_m * np.sin(phi_m), r_m * np.cos(phi_m), 0)

    # Daughter
    M_d = M_initial_daughter + n_daughter * sim_time_s
    E_d = solve_kepler(M_d, e_daughter)
    r_d = a_daughter * (1 - e_daughter * np.cos(E_d))
    phi_d = 2 * np.arctan2(np.sqrt(1 + e_daughter) * np.sin(E_d / 2), np.sqrt(1 - e_daughter) * np.cos(E_d / 2))
    # New orientation: orbit in the X-Y plane
    daughter.pos = vector(r_d * np.sin(phi_d), r_d * np.cos(phi_d), 0)