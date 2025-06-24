// config.js
export const CONFIG = {
  ORBIT_RADIUS: 30,
  PLANET_AXIAL_TILT: 12.5,
  HALFERTH_YEAR_DAYS: 420,
  HALFERTH_DAY_HOURS: 21,
  ANIMATION_ORBIT_PERIOD_SECONDS: 62.8,
  MAX_TRAIL_POINTS: 9000,

  MOTHER: {
    ORBIT_DAYS: 70,
    ECCENTRICITY: 0.35,
    SEMI_MAJOR_AXIS: 7.0,
    RADIUS: 1,
    get SEMI_MINOR_AXIS() { return this.SEMI_MAJOR_AXIS * Math.sqrt(1 - this.ECCENTRICITY ** 2); },
    get FOCUS_OFFSET() { return this.SEMI_MAJOR_AXIS * this.ECCENTRICITY; }
  },

  DAUGHTER: {
    ORBIT_DAYS: 35,
    ECCENTRICITY: 0.3,
    SEMI_MAJOR_AXIS: 7.0 * (413000 / 656000),
    RADIUS: 0.6,
    get SEMI_MINOR_AXIS() { return this.SEMI_MAJOR_AXIS * Math.sqrt(1 - this.ECCENTRICITY ** 2); },
    get FOCUS_OFFSET() { return this.SEMI_MAJOR_AXIS * this.ECCENTRICITY; }
  },
};

export const SEASONS = ["Nightfall", "Long Night", "Nightspring", "Dayspring", "Long Day", "Dayfall"];
