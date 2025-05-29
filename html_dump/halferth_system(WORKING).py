from vpython import *
import math 

# =======================================================================
# 1. HELPER FUNCTIONS
# =======================================================================
def solve_kepler(M, e, tolerance=1e-6):
    E = float(M); M = float(M); e = float(e)
    for _ in range(100):
        f_val = E - e * math.sin(E) - M
        f_prime_val = 1 - e * math.cos(E)
        if abs(f_prime_val) < 1e-10: break
        delta_E = f_val / f_prime_val
        E = E - delta_E
        if abs(delta_E) < tolerance: break
    return E

def get_initial_M_from_phi(phi, e):
    tan_E_half = math.sqrt((1 - e) / (1 + e)) * math.tan(phi / 2)
    E = 2 * math.atan(tan_E_half)
    M = E - e * math.sin(E)
    return M

# =======================================================================
# 2. CONSTANTS 
# =======================================================================
ECC_HALFERTH_SOLAR = 0.0167
HALFERTH_AXIAL_TILT = 12.5

H_DAY_SECONDS = 21 * 3600
H_YEAR_DAYS = 420
H_YEAR_SECONDS = H_YEAR_DAYS * H_DAY_SECONDS
planet_rotation_rate = 2 * math.pi / H_DAY_SECONDS

a_mother_physical = 6.56e5 * 1000
e_mother = 0.35
P_mother_days = 70

a_daughter_physical = 4.13e5 * 1000
e_daughter = 0.3
P_daughter_days = 35

SOLAR_ORBIT_DISPLAY_RADIUS = 25.0
SUN_DISPLAY_RADIUS = SOLAR_ORBIT_DISPLAY_RADIUS / 7
PLANET_DISPLAY_RADIUS = SUN_DISPLAY_RADIUS / 3.0 

MOTHER_ORBIT_DISPLAY_AVG_RADIUS = PLANET_DISPLAY_RADIUS * 7 
DAUGHTER_ORBIT_DISPLAY_AVG_RADIUS = MOTHER_ORBIT_DISPLAY_AVG_RADIUS * (a_daughter_physical / a_mother_physical)
MOTHER_DISPLAY_RADIUS = PLANET_DISPLAY_RADIUS * 0.5 
DAUGHTER_DISPLAY_RADIUS = PLANET_DISPLAY_RADIUS * 0.3 

GUIDE_LINE_RADIUS = SOLAR_ORBIT_DISPLAY_RADIUS / 600 
TRAIL_DISPLAY_RADIUS = GUIDE_LINE_RADIUS 
TRAIL_OPACITY = 0.3

ORBIT_PATH_THICKNESS = GUIDE_LINE_RADIUS 

POST_DISPLAY_RADIUS = GUIDE_LINE_RADIUS 
POST_DISPLAY_LENGTH = PLANET_DISPLAY_RADIUS * 1.5 
EQUATOR_DISPLAY_THICKNESS = PLANET_DISPLAY_RADIUS * 0.1

# Removed trail retain point constants for this test

# =======================================================================
# 3. SCENE AND STATIC OBJECT SETUP
# =======================================================================
scene.background = color.black
scene.width = 800 
scene.height = 600 
scene.title = f"Halferth System Orbital Dynamics\nDay: 0.0 / {H_YEAR_DAYS}\n" 

sun = sphere(pos=vector(0,0,0), radius=SUN_DISPLAY_RADIUS, color=color.yellow, emissive=True)
local_light(pos=vector(0,0,0), color=color.white)

orbit_path_display = ring(pos=vector(0,0,0), axis=vector(0,1,0), radius=SOLAR_ORBIT_DISPLAY_RADIUS, color=color.gray(0.5), thickness=ORBIT_PATH_THICKNESS)
axis_len = SOLAR_ORBIT_DISPLAY_RADIUS * 1.0
solstice_line = cylinder(pos=vector(-axis_len,0,0), axis=vector(2*axis_len,0,0), radius=GUIDE_LINE_RADIUS, color=color.red)
equinox_line = cylinder(pos=vector(0,0,-axis_len), axis=vector(0,0,2*axis_len), radius=GUIDE_LINE_RADIUS, color=color.green)
angle1_rad = math.radians(150); pos1 = vector(-axis_len*math.cos(angle1_rad),0,-axis_len*math.sin(angle1_rad)); axis_vec1 = vector(2*axis_len*math.cos(angle1_rad),0,2*axis_len*math.sin(angle1_rad))
season_line_1 = cylinder(pos=pos1, axis=axis_vec1, radius=GUIDE_LINE_RADIUS, color=color.green)
angle2_rad = math.radians(30); pos2 = vector(-axis_len*math.cos(angle2_rad),0,-axis_len*math.sin(angle2_rad)); axis_vec2 = vector(2*axis_len*math.cos(angle2_rad),0,2*axis_len*math.sin(angle2_rad))
season_line_2 = cylinder(pos=pos2, axis=axis_vec2, radius=GUIDE_LINE_RADIUS, color=color.green)

planet = sphere(pos=vector(0,0,0), radius=PLANET_DISPLAY_RADIUS, texture={'file': 'http://i.imgur.com/OsdMZof.png'})
equator = ring(radius=PLANET_DISPLAY_RADIUS*1.2, thickness=EQUATOR_DISPLAY_THICKNESS, color=color.green)
post = cylinder(radius=POST_DISPLAY_RADIUS, color=color.red) 

mother = sphere(radius=MOTHER_DISPLAY_RADIUS, color=color.cyan) # No make_trail
daughter = sphere(radius=DAUGHTER_DISPLAY_RADIUS, color=color.blue) # No make_trail

mother_trail_curve = curve(color=color.cyan, radius=TRAIL_DISPLAY_RADIUS, opacity=TRAIL_OPACITY, visible=False)
daughter_trail_curve = curve(color=color.blue, radius=TRAIL_DISPLAY_RADIUS, opacity=TRAIL_OPACITY, visible=False) # Ensure daughter trail uses blue


tilt_rad = math.radians(HALFERTH_AXIAL_TILT); angle_of_tilt_definition = -tilt_rad; axis_to_tilt_around_world = vector(0,0,1) 
local_north_pole_vector = vector(0,1,0)
WORLD_SPACE_FIXED_NORTH_POLE = rotate(local_north_pole_vector, angle=angle_of_tilt_definition, axis=axis_to_tilt_around_world)
planet.axis = WORLD_SPACE_FIXED_NORTH_POLE
planet.up = vector(0,0,1) 
if mag(cross(WORLD_SPACE_FIXED_NORTH_POLE, planet.up)) < 1e-6:
    planet.up = rotate(vector(1,0,0), angle=angle_of_tilt_definition, axis=axis_to_tilt_around_world)

scene.center = vector(0,0,0); scene.autoscale = True; scene.autoscale = False 
print("Main simulation script initialized in CMD.")

# =======================================================================
# 4. UI CONTROLS 
# =======================================================================
animation_is_paused = False 
trails_are_visible = False 

def toggle_pause_animation():
    global animation_is_paused 
    animation_is_paused = not animation_is_paused
    if animation_is_paused:
        pause_button.text = "Play"
    else:
        pause_button.text = "Pause"

def toggle_trail_visibility():
    global trails_are_visible
    trails_are_visible = not trails_are_visible
    print(f"Trail toggle button clicked. Setting trails_are_visible to: {trails_are_visible}")

    # Always clear trails when changing visibility state to ensure a fresh start if they become visible
    mother_trail_curve.clear()
    daughter_trail_curve.clear()
    
    mother_trail_curve.visible = trails_are_visible
    daughter_trail_curve.visible = trails_are_visible # Match daughter's sphere color
    
    if trails_are_visible:
        show_hide_trails_button.text = "Hide Trails"
        print("Trail curves set to visible (will start fresh).")
    else:
        show_hide_trails_button.text = "Show Trails"
        print("Trail curves set to invisible and cleared.")


scene.append_to_caption('\n') 
pause_button = button(bind=toggle_pause_animation, text="Pause")
scene.append_to_caption(' &nbsp; &nbsp; ') 
show_hide_trails_button = button(bind=toggle_trail_visibility, text="Show Trails")

# =======================================================================
# 5. ANIMATION LOOP
# =======================================================================
n_solar = 2 * math.pi / H_YEAR_SECONDS 
solar_start_phi = 3 * math.pi / 2 
M_initial_solar = get_initial_M_from_phi(solar_start_phi, ECC_HALFERTH_SOLAR)

n_mother = 2 * math.pi / (P_mother_days * H_DAY_SECONDS)
n_daughter = 2 * math.pi / (P_daughter_days * H_DAY_SECONDS)
moon_start_phi = -math.pi / 2
M_initial_mother = get_initial_M_from_phi(moon_start_phi, e_mother)
M_initial_daughter = get_initial_M_from_phi(moon_start_phi, e_daughter)

sim_time_s = 0.0
FRAME_RATE = 100
ANIMATION_DURATION_SECONDS = 60 
DT = H_YEAR_SECONDS / (FRAME_RATE * ANIMATION_DURATION_SECONDS)

while True:
    rate(FRAME_RATE) 
    
    if not animation_is_paused:
        sim_time_s += DT
        if sim_time_s >= H_YEAR_SECONDS:
            sim_time_s -= H_YEAR_SECONDS

        current_day = sim_time_s / H_DAY_SECONDS
        scene.title = f"Halferth System Orbital Dynamics\nDay: {current_day:.1f} / {H_YEAR_DAYS}\n"

        M_solar = M_initial_solar + n_solar * sim_time_s
        E_solar = solve_kepler(M_solar, ECC_HALFERTH_SOLAR)
        r_solar_physical_ratio = (1 - ECC_HALFERTH_SOLAR * math.cos(E_solar)) 
        r_solar_display = SOLAR_ORBIT_DISPLAY_RADIUS * r_solar_physical_ratio
        phi_solar = 2*math.atan2(math.sqrt(1+ECC_HALFERTH_SOLAR)*math.sin(E_solar/2), math.sqrt(1-ECC_HALFERTH_SOLAR)*math.cos(E_solar/2))
        
        halferth_display_pos = vector(
            -r_solar_display * math.cos(phi_solar), 
            0, 
            r_solar_display * math.sin(phi_solar)
        )
        planet.pos = halferth_display_pos
        
        planet.axis = WORLD_SPACE_FIXED_NORTH_POLE
        planet.rotate(angle=planet_rotation_rate*DT, axis=WORLD_SPACE_FIXED_NORTH_POLE) 
        
        equator.pos = planet.pos
        equator.axis = planet.axis 
        
        current_south_pole_direction_world = norm(-planet.axis) 
        post.axis = current_south_pole_direction_world * POST_DISPLAY_LENGTH
        post.pos = planet.pos + current_south_pole_direction_world * PLANET_DISPLAY_RADIUS
        
        M_m = M_initial_mother + n_mother * sim_time_s
        E_m = solve_kepler(M_m, e_mother)
        r_m_physical = a_mother_physical * (1 - e_mother * math.cos(E_m))
        radius_ratio_m = r_m_physical / a_mother_physical
        r_m_diorama = MOTHER_ORBIT_DISPLAY_AVG_RADIUS * radius_ratio_m
        phi_m = 2*math.atan2(math.sqrt(1+e_mother)*math.sin(E_m/2), math.sqrt(1-e_mother)*math.cos(E_m/2))
        local_pos_m_diorama = vector(0, r_m_diorama * math.cos(phi_m), r_m_diorama * math.sin(phi_m))

        M_d = M_initial_daughter + n_daughter * sim_time_s
        E_d = solve_kepler(M_d, e_daughter)
        r_d_physical = a_daughter_physical * (1 - e_daughter * math.cos(E_d))
        radius_ratio_d = r_d_physical / a_daughter_physical
        r_d_diorama = DAUGHTER_ORBIT_DISPLAY_AVG_RADIUS * radius_ratio_d
        phi_d = 2*math.atan2(math.sqrt(1+e_daughter)*math.sin(E_d/2), math.sqrt(1-e_daughter)*math.cos(E_d/2))
        local_pos_d_diorama = vector(0, r_d_diorama * math.cos(phi_d), r_d_diorama * math.sin(phi_d))

        mother.pos = halferth_display_pos + rotate(local_pos_m_diorama, angle=angle_of_tilt_definition, axis=axis_to_tilt_around_world)
        daughter.pos = halferth_display_pos + rotate(local_pos_d_diorama, angle=angle_of_tilt_definition, axis=axis_to_tilt_around_world)

        if trails_are_visible:
            mother_trail_curve.append(pos=mother.pos)
            daughter_trail_curve.append(pos=daughter.pos)
            # No retain logic for this test, let them grow