export class Mathf {

    static clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    static lerp(a, b, t) {
        return a + (b - a) * t;
    }

    static degToRad(deg) {
        return deg * (Math.PI / 180);
    }

    static radToDeg(rad) {
        return rad * (180 / Math.PI);
    }
    static remap(value,inMin,inMax,outMin,outMax){
        // To stop / by 0
        if (inMin === inMax) {
        return outMin;
    }
        const raw_t = (value - inMin) / (inMax - inMin)

        const clamped_t = Math.max(0,Math.min(1,raw_t))

        return outMin + (outMax - outMin) * clamped_t; // The standard Linear Interpolation formula
    }

}
