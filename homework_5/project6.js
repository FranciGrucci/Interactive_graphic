var raytraceFS = `
struct Ray {
    vec3 pos;
    vec3 dir;
};

struct Material {
    vec3  k_d;  // Diffuse reflection component (base color)
    vec3  k_s;  // Specular reflection component (mirror-like)
    float n;    // Shininess factor (controls specular highlight size)
};

struct Sphere {
    vec3     center;
    float    radius;
    Material mtl;
};

struct Light {
    vec3 position;
    vec3 intensity;  // RGB intensity of the light
};

struct HitInfo {
    float    t;         // Distance from ray origin to intersection point
    vec3     position;  // World-space location of the hit
    vec3     normal;    // Surface normal at the hit location
    Material mtl;       // Material of the object that was hit
};

uniform Sphere spheres[ NUM_SPHERES ];
uniform Light  lights [ NUM_LIGHTS  ];
uniform samplerCube envMap;
uniform int bounceLimit;

// Checks if the ray intersects any sphere in the scene.
// Updates the HitInfo with the closest hit, if found.
// Returns true if any intersection occurs.
bool IntersectRay(inout HitInfo hit, Ray ray) {
    hit.t = 1e30; // Initialize hit distance to a large value
    bool foundHit = false;

    for (int i = 0; i < NUM_SPHERES; ++i) {
        // Compute quadratic terms for ray-sphere intersection
        vec3 oc = ray.pos - spheres[i].center;
        float a = dot(ray.dir, ray.dir);
        float b = 2.0 * dot(oc, ray.dir);
        float c = dot(oc, oc) - spheres[i].radius * spheres[i].radius;
        float discriminant = b * b - 4.0 * a * c;

        // Valid intersection only if discriminant is positive
        if (discriminant > 0.0) {
            float t1 = (-b - sqrt(discriminant)) / (2.0 * a);
            float t2 = (-b + sqrt(discriminant)) / (2.0 * a);
            float t = min(t1, t2); // Choose nearest intersection

            if (t > 0.0 && t < hit.t) {
                // Store the closest valid hit
                hit.t = t;
                hit.position = ray.pos + t * ray.dir;
                hit.normal = normalize(hit.position - spheres[i].center);
                hit.mtl = spheres[i].mtl;
                foundHit = true;
            }
        }
    }

    return foundHit;
}

// Computes the color at a surface point using lighting and material properties.
// Applies diffuse and specular contributions using the Blinn-Phong model.
vec3 Shade(Material mtl, vec3 position, vec3 normal, vec3 view) {
    vec3 color = vec3(0, 0, 0);

    for (int i = 0; i < NUM_LIGHTS; ++i) {
        // Cast a ray toward the light source to check for shadows
        Ray shadowRay;
        shadowRay.pos = position + normal * 0.001; // Offset to prevent self-shadowing
        shadowRay.dir = normalize(lights[i].position - position);

        HitInfo shadowHit;
        bool inShadow = IntersectRay(shadowHit, shadowRay);

        // If no occlusion or occluder is farther than light, calculate illumination
        if (!inShadow || shadowHit.t > length(lights[i].position - position)) {
            vec3 lightDir = normalize(lights[i].position - position);
            vec3 halfDir = normalize(lightDir + view); // Halfway vector for Blinn-Phong

            float diff = max(dot(normal, lightDir), 0.0); // Diffuse term
            float spec = pow(max(dot(normal, halfDir), 0.0), mtl.n); // Specular term

            // Accumulate diffuse and specular contributions scaled by light intensity
            color += mtl.k_d * diff * lights[i].intensity;
            color += mtl.k_s * spec * lights[i].intensity;
        }
    }

    return color;
}

// Main ray tracing function.
// Casts a ray and returns the final color with shading and reflections.
// Falls back to environment map if no object is hit.
vec4 RayTracer(Ray ray) {
    HitInfo hit;
    if (IntersectRay(hit, ray)) {
        // Direct illumination from light sources
        vec3 view = normalize(-ray.dir); // Direction toward the camera
        vec3 clr = Shade(hit.mtl, hit.position, hit.normal, view);

        // Reflective component
        vec3 k_s = hit.mtl.k_s;
        for (int bounce = 0; bounce < MAX_BOUNCES; ++bounce) {
            if (bounce >= bounceLimit) break; // User-defined bounce limit
            if (hit.mtl.k_s.r + hit.mtl.k_s.g + hit.mtl.k_s.b <= 0.0) break; // No reflection left

            // Create reflected ray
            Ray r;
            r.pos = hit.position + hit.normal * 0.001;
            r.dir = reflect(ray.dir, hit.normal);

            HitInfo h;
            if (IntersectRay(h, r)) {
                // Compute reflected shading
                vec3 reflectionColor = Shade(h.mtl, h.position, h.normal, normalize(-r.dir));
                clr += k_s * reflectionColor;

                // Prepare for next bounce
                k_s *= h.mtl.k_s; // Accumulate reflectivity
                ray = r;
                hit = h;
            } else {
                // No further hit; sample from environment map
                clr += k_s * textureCube(envMap, r.dir.xzy).rgb;
                break;
            }
        }

        return vec4(clr, 1); // Final pixel color with alpha = 1
    } else {
        // Ray missed all geometry; use background color
        return vec4(textureCube(envMap, ray.dir.xzy).rgb, 0);
    }
}
`;
