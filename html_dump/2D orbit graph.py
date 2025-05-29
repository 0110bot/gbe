import numpy as np
import matplotlib.pyplot as plt
import matplotlib.animation as animation
from matplotlib.lines import Line2D # Needed for custom legend entries

# =============================================================================
# HELPER FUNCTIONS (Solving Kepler's Equation)
# =============================================================================

def solve_kepler(M, e, tolerance=1e-6, max_iterations=100):
    """
    Solves Kepler's equation M = E - e*sin(E) for E (eccentric anomaly)
    using Newton's method.
    """
    E = M
    for _ in range(max_iterations):
        f_val = E - e * np.sin(E) - M
        f_prime_val = 1 - e * np.cos(E)
        if abs(f_prime_val) < 1e-10:
            break 
        delta_E = f_val / f_prime_val
        E = E - delta_E
        if abs(delta_E) < tolerance:
            break
    return E

def get_position_from_eccentric_anomaly(E, a, e):
    """
    Calculates Cartesian coordinates (x, y) from eccentric anomaly E.
    """
    phi = 2 * np.arctan2(np.sqrt(1 + e) * np.sin(E / 2), 
                         np.sqrt(1 - e) * np.cos(E / 2))
    r = a * (1 - e * np.cos(E))
    x = r * np.cos(phi)
    y = r * np.sin(phi)
    return x, y

def get_initial_M_from_phi(phi, e):
    """
    Calculates the initial Mean Anomaly (M) required to produce a given
    True Anomaly (phi) for a certain eccentricity (e).
    """
    tan_E_half = np.sqrt((1 - e) / (1 + e)) * np.tan(phi / 2)
    E = 2 * np.arctan(tan_E_half)
    M = E - e * np.sin(E)
    return M

# =============================================================================
# PARAMETERS
# =============================================================================

# Moons' parameters
a_mother = 6.56e5
e_mother = 0.35
P_mother_h_days = 70

a_daughter = 4.13e5
e_daughter = 0.3
P_daughter_h_days = 35

# Simulation parameters
total_duration_h_days = 70
frames_per_h_day = 5
num_frames = total_duration_h_days * frames_per_h_day
interval_ms = 40

# =============================================================================
# CALCULATE INITIAL STARTING POSITIONS
# =============================================================================

desired_start_phi = -np.pi / 2
M_initial_mother = get_initial_M_from_phi(desired_start_phi, e_mother)
M_initial_daughter = get_initial_M_from_phi(desired_start_phi, e_daughter)

# =============================================================================
# PLOTTING SETUP
# =============================================================================

fig, ax = plt.subplots(figsize=(10.5, 10.5)) # Slightly larger figure to accommodate legend
ax.plot(0, 0, 'o', color='saddlebrown', markersize=12, label='Halferth (Focus)')

# Plot static orbits
phi_for_orbit_plot = np.linspace(0, 2 * np.pi, 200)
r_mother_orbit = a_mother * (1 - e_mother**2) / (1 + e_mother * np.cos(phi_for_orbit_plot))
x_mother_orbit = r_mother_orbit * np.cos(phi_for_orbit_plot)
y_mother_orbit = r_mother_orbit * np.sin(phi_for_orbit_plot)
ax.plot(x_mother_orbit, y_mother_orbit, linestyle=':', color='cornflowerblue', alpha=0.7, label="Mother's Path")

r_daughter_orbit = a_daughter * (1 - e_daughter**2) / (1 + e_daughter * np.cos(phi_for_orbit_plot))
x_daughter_orbit = r_daughter_orbit * np.cos(phi_for_orbit_plot)
y_daughter_orbit = r_daughter_orbit * np.sin(phi_for_orbit_plot)
ax.plot(x_daughter_orbit, y_daughter_orbit, linestyle=':', color='lightcoral', alpha=0.7, label="Daughter's Path")

# ----- NEW: VISUAL ADJUSTMENTS -----

# 1. Draw Horizon and Apogee/Perigee lines
ax.axhline(0, color='black', linestyle='-', lw=1, alpha=0.8) # X-axis
ax.axvline(0, color='black', linestyle='-', lw=1, alpha=0.8) # Y-axis

# 2. Add text labels for axes
ax.text(0, 850000, 'RISE', ha='center', va='center', fontsize=12, weight='bold')
ax.text(0, -850000, 'SET', ha='center', va='center', fontsize=12, weight='bold')
ax.text(-920000, 0, 'A', ha='center', va='center', fontsize=14, weight='bold')
ax.text(520000, 0, 'P', ha='center', va='center', fontsize=14, weight='bold')
ax.text(-90000, 0, '←', ha='center', va='center', fontsize=18) # Unicode arrow

# ------------------------------------

# Setup plot objects
# VISUAL CHANGE: Mother is now a circle 'o'
mother_dot, = ax.plot([], [], 'o', color='blue', markersize=10, label='Mother')
daughter_dot, = ax.plot([], [], 'o', color='red', markersize=7, label='Daughter') 
time_text = ax.text(0.02, 0.95, '', transform=ax.transAxes)

# Set plot properties
ax.set_aspect('equal', adjustable='box')
ax.set_xlabel('Distance (km)')
ax.set_ylabel('Distance (km)')
ax.set_title('Animated Orbits of Halferth\'s Moons (70 H-day cycle)')
ax.grid(True, linestyle=':', alpha=0.5)

max_extent = a_mother * (1 + e_mother) * 1.1 
ax.set_xlim([-max_extent, max_extent])
ax.set_ylim([-max_extent, max_extent])

# ----- NEW: CUSTOM LEGEND SETUP -----

# Get handles from existing plot elements
handles, labels = ax.get_legend_handles_labels()

# Create "proxy" artists for the new legend entries
legend_elements = [
    Line2D([0], [0], color='black', lw=1, label='Horizon'),
    Line2D([0], [0], marker='None', linestyle='None', label='A — apogee'),
    Line2D([0], [0], marker='None', linestyle='None', label='P — perigee'),
    Line2D([0], [0], marker='None', linestyle='None', label='← — observer perspe')
]

# Combine the original handles with the new proxy artists
ax.legend(handles=handles + legend_elements, loc='upper right')

# =============================================================================
# ANIMATION LOGIC
# =============================================================================

def init():
    mother_dot.set_data([], [])
    daughter_dot.set_data([], [])
    time_text.set_text('')
    return mother_dot, daughter_dot, time_text

def update(frame):
    current_h_day = (frame / num_frames) * total_duration_h_days
    
    M_mother = M_initial_mother + (2 * np.pi / P_mother_h_days) * current_h_day
    M_daughter = M_initial_daughter + (2 * np.pi / P_daughter_h_days) * current_h_day
    
    E_mother = solve_kepler(M_mother, e_mother)
    E_daughter = solve_kepler(M_daughter, e_daughter)
    
    x_mother, y_mother = get_position_from_eccentric_anomaly(E_mother, a_mother, e_mother)
    x_daughter, y_daughter = get_position_from_eccentric_anomaly(E_daughter, a_daughter, e_daughter)
    
    mother_dot.set_data([x_mother], [y_mother])
    daughter_dot.set_data([x_daughter], [y_daughter])
    time_text.set_text(f'Halferth Day: {current_h_day:.1f}')
    return mother_dot, daughter_dot, time_text

# Create and save animation
ani = animation.FuncAnimation(fig, update, frames=num_frames,
                              init_func=init, blit=False, interval=interval_ms, repeat=True)

try:
    print("Attempting to save animation as GIF (this may take a moment)...")
    ani.save('halferth_moon_orbits_FINAL.gif', writer='pillow', fps=25) 
    print("Animation successfully saved as halferth_moon_orbits_FINAL.gif")
except Exception as e:
    print(f"Error saving animation as GIF: {e}")
    print("Please ensure you have Pillow installed ('pip install Pillow').")

plt.show()