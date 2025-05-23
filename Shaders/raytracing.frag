﻿#version 410 core

#define EPSILON 0.001
#define BIG 1000000.0

const int DIFFUSE = 1;
const int REFLECTION = 2;
const int REFRACTION = 3;

const int RED_DIFFUSE   = 0;
const int GLASS         = 1;
const int GREEN_DIFFUSE = 2;
const int BLUE_DIFFUSE  = 3;
const int MIRROR        = 4;
const int GRAY_DIFFUSE  = 5;
const int GOLD          = 6;
const int SILVER        = 7;
const int EMERALD       = 8;
const int RUBY          = 9;

const int DIFFUSE_REFLECTION = 1;
const int MIRROR_REFLECTION = 2;

in vec3 glPosition;
out vec4 FragColor;


struct SCamera
{
	vec3 Position; 
	vec3 View; 
	vec3 Up;
	vec3 Side; 
	vec2 Scale; 
};

struct SRay
{
	vec3 Origin; 
	vec3 Direction; 
};

struct SSphere
{
	vec3 Center; 
	float Radius; 
	int MaterialIdx; 
};

struct STriangle
{
	vec3 v1; 
	vec3 v2; 
	vec3 v3; 
	int MaterialIdx; 
};

struct SIntersection
{
	float Time;
	vec3 Point;
	vec3 Normal;
	vec3 Color;
	vec4 LightCoeffs;
	float ReflectionCoef;
	float RefractionCoef;
	int MaterialType;
};

struct SMaterial
{
	vec3 Color;
	vec4 LightCoeffs;
	float ReflectionCoef;
	float RefractionCoef;
	int MaterialType;
};

struct SLight
{
	vec3 Position;
};

struct STracingRay
{
	SRay ray;
	float contribution;
	int depth;
};

STriangle triangles[12]; 
SSphere spheres[2];
SLight light;
SMaterial materials[10];
SCamera uCamera;

STracingRay stack[10];
int stackSize = 0;

bool isEmpty()
{
	if (stackSize == 0)
		return true;
	return false;
}

void pushRay(STracingRay ray)
{
	if (ray.depth > 100 || stackSize >= 9 || ray.contribution < 0.01) 
	{
        return;
    }
	stack[stackSize] = ray;
	stackSize++;
}

STracingRay popRay()
{
	stackSize--;
	return stack[stackSize];
}

SRay GenerateRay(SCamera uCamera) 
{
	vec2 coords = glPosition.xy * uCamera.Scale; 
	vec3 direction = uCamera.View + uCamera.Side * coords.x + uCamera.Up * coords.y; 
	return SRay(uCamera.Position, normalize(direction));
}

SCamera initializeDefaultCamera() 
{
	SCamera camera;
	camera.Position = vec3( 0.0, 0.0, -8.0);
	camera.View = vec3( 0.0, 0.0, 1.0);
	camera.Up = vec3( 0.0, 1.0, 0.0);
	camera.Side = vec3( 1.0, 0.0, 0.0);
	camera.Scale = vec2(1.0);
	return camera;
}

void initializeDefaultScene(out STriangle triangles[12], out SSphere spheres[2]) 
{
	/** TRIANGLES **/
    triangles[0].v1 = vec3(-5.0,-5.0,-5.0);
    triangles[0].v2 = vec3(-5.0, 5.0, 5.0);
    triangles[0].v3 = vec3(-5.0, 5.0,-5.0);
    triangles[0].MaterialIdx = BLUE_DIFFUSE;

    triangles[1].v1 = vec3(-5.0,-5.0,-5.0);
    triangles[1].v2 = vec3(-5.0,-5.0, 5.0);
    triangles[1].v3 = vec3(-5.0, 5.0, 5.0);
    triangles[1].MaterialIdx = BLUE_DIFFUSE;

    triangles[2].v1 = vec3(-5.0,-5.0, 5.0);
    triangles[2].v2 = vec3( 5.0,-5.0, 5.0);
    triangles[2].v3 = vec3(-5.0, 5.0, 5.0);
    triangles[2].MaterialIdx = GRAY_DIFFUSE;

    triangles[3].v1 = vec3( 5.0, 5.0, 5.0);
    triangles[3].v2 = vec3(-5.0, 5.0, 5.0);
    triangles[3].v3 = vec3( 5.0,-5.0, 5.0);
    triangles[3].MaterialIdx = GRAY_DIFFUSE;

    triangles[4].v1 = vec3(5.0,-5.0,-5.0);
    triangles[4].v2 = vec3(5.0, 5.0,-5.0);
    triangles[4].v3 = vec3(5.0, 5.0, 5.0);
    triangles[4].MaterialIdx = MIRROR;

    triangles[5].v1 = vec3(5.0,-5.0,-5.0);
    triangles[5].v2 = vec3(5.0, 5.0, 5.0);
    triangles[5].v3 = vec3(5.0,-5.0, 5.0);
    triangles[5].MaterialIdx = MIRROR;

    triangles[6].v1 = vec3(-5.0,-5.0,-5.0);
    triangles[6].v2 = vec3( 5.0,-5.0,-5.0);
    triangles[6].v3 = vec3(-5.0,-5.0, 5.0);
    triangles[6].MaterialIdx = EMERALD;

    triangles[7].v1 = vec3( 5.0,-5.0,-5.0);
    triangles[7].v2 = vec3( 5.0,-5.0, 5.0);
    triangles[7].v3 = vec3(-5.0,-5.0, 5.0);
    triangles[7].MaterialIdx = EMERALD;

    triangles[8].v1 = vec3(-5.0,5.0,-5.0);
    triangles[8].v2 = vec3(-5.0,5.0, 5.0);
    triangles[8].v3 = vec3( 5.0,5.0,-5.0);
    triangles[8].MaterialIdx = GOLD;

    triangles[9].v1 = vec3( 5.0,5.0, 5.0);
    triangles[9].v2 = vec3( 5.0,5.0,-5.0);
    triangles[9].v3 = vec3(-5.0,5.0, 5.0);
    triangles[9].MaterialIdx = GOLD;

    triangles[10].v1 = vec3(-5.0,-5.0,-5.0);
    triangles[10].v2 = vec3(-5.0, 5.0,-5.0);
    triangles[10].v3 = vec3( 5.0, 5.0,-5.0);
    triangles[10].MaterialIdx = RED_DIFFUSE;

    triangles[11].v1 = vec3(-5.0,-5.0,-5.0);
    triangles[11].v2 = vec3( 5.0, 5.0,-5.0);
    triangles[11].v3 = vec3( 5.0,-5.0,-5.0);
    triangles[11].MaterialIdx = RED_DIFFUSE;


	/** SPHERES **/

	spheres[0].Center = vec3(-1.0,-1.0,-1.0);
	spheres[0].Radius = 2.0;
	spheres[0].MaterialIdx = RUBY;

	spheres[1].Center = vec3(2.0,1.0,2.0);
	spheres[1].Radius = 1.0;
	spheres[1].MaterialIdx = GLASS;
}

bool IntersectSphere(SSphere sphere, SRay ray, float start, float final, out float time)
{
	ray.Origin -= sphere.Center;
	float A = dot(ray.Direction, ray.Direction);
	float B = dot(ray.Direction, ray.Origin);
	float C = dot(ray.Origin, ray.Origin) - sphere.Radius * sphere.Radius;
	float D = B * B - A * C;
	if (D > 0.0)
	{
		D = sqrt(D);
		float t1 = (- B - D) / A;
		float t2 = (- B + D) / A;
		if (t1 < 0 && t2 < 0)
			return false;
		if (min(t1, t2) < 0)
		{
			time = max(t1, t2);
			return true;
		}
		time = min(t1, t2);
		return true;
	}
	return false;
}

bool IntersectTriangle(SRay ray, vec3 v1, vec3 v2, vec3 v3, out float time)
{
	time = -1;
	vec3 A = v2 - v1;
	vec3 B = v3 - v1;
	vec3 N = cross(A, B);
	float NdotRayDirection = dot(N, ray.Direction);
	if (abs(NdotRayDirection) < 0.001)
		return false;
	float d = dot(N, v1);
	float t = -(dot(N, ray.Origin) - d) / NdotRayDirection;
	if (t < 0)
		return false;
	vec3 P = ray.Origin + t * ray.Direction;
	vec3 C;
	vec3 edge1 = v2 - v1;
	vec3 VP1 = P - v1;
	C = cross(edge1, VP1);
	if (dot(N, C) < 0)
		return false;
	vec3 edge2 = v3 - v2;
	vec3 VP2 = P - v2;
	C = cross(edge2, VP2);
	if (dot(N, C) < 0)
		return false;
	vec3 edge3 = v1 - v3;
	vec3 VP3 = P - v3;
	C = cross(edge3, VP3);
	if (dot(N, C) < 0)
		return false;
	time = t;
	return true;
}

bool RayTrace(SRay ray, SSphere spheres[2], STriangle triangles[12], SMaterial materials[10], float start, float final, inout SIntersection intersect)
{
	bool result = false;
	float test = start;
	intersect.Time = final;
	for (int i = 0; i < 2; i++)
	{
		SSphere sphere = spheres[i];
		if (IntersectSphere(sphere, ray, start, final, test) && test < intersect.Time)
		{
			intersect.Time = test;
			intersect.Point = ray.Origin + ray.Direction * test;
			intersect.Normal = normalize(intersect.Point - spheres[i].Center);
			int materialIndex = sphere.MaterialIdx; 
			intersect.Color = materials[materialIndex].Color;
			intersect.LightCoeffs = materials[materialIndex].LightCoeffs;
			intersect.ReflectionCoef = materials[materialIndex].ReflectionCoef;
			intersect.RefractionCoef = materials[materialIndex].RefractionCoef;
			intersect.MaterialType = materials[materialIndex].MaterialType;
			result = true;
		}
	}
	for (int i = 0; i < 12; i++)
	{
		STriangle triangle = triangles[i];
		if (IntersectTriangle(ray, triangle.v1, triangle.v2, triangle.v3, test) && test < intersect.Time)
		{
			intersect.Time = test;
			intersect.Point = ray.Origin + ray.Direction * test;
			intersect.Normal = normalize(cross(triangle.v1 - triangle.v2, triangle.v3 - triangle.v2));
			int materialIndex = triangle.MaterialIdx;
			intersect.Color = materials[materialIndex].Color;
			intersect.LightCoeffs = materials[materialIndex].LightCoeffs;
			intersect.ReflectionCoef = materials[materialIndex].ReflectionCoef;
			intersect.RefractionCoef = materials[materialIndex].RefractionCoef;
			intersect.MaterialType = materials[materialIndex].MaterialType;
			result = true;
		}
	}
	return result;
}

void initializeDefaultLightMaterials(out SLight light, out SMaterial materials[10])
{
	light.Position = vec3(0.5, 4.0, -4.0f);
	vec4 lightCoefs = vec4(0.4, 0.9, 0.0, 512.0);

    materials[RED_DIFFUSE].Color = vec3(0.4, 0.0, 0.0);
    materials[RED_DIFFUSE].LightCoeffs = vec4(lightCoefs);
    materials[RED_DIFFUSE].ReflectionCoef = 0.5;
    materials[RED_DIFFUSE].RefractionCoef = 1.0;
    materials[RED_DIFFUSE].MaterialType = DIFFUSE_REFLECTION;

    materials[GLASS].Color = vec3(0.9, 0.9, 1.0);
    materials[GLASS].LightCoeffs = vec4(0.1, 0.5, 0.0, 512.0);
    materials[GLASS].ReflectionCoef = 0.3;
    materials[GLASS].RefractionCoef = 1.5;
    materials[GLASS].MaterialType = REFRACTION;

    materials[GREEN_DIFFUSE].Color = vec3(0.0, 0.4, 0.0);
    materials[GREEN_DIFFUSE].LightCoeffs = vec4(lightCoefs);
    materials[GREEN_DIFFUSE].ReflectionCoef = 0.2;
    materials[GREEN_DIFFUSE].RefractionCoef = 1.0;
    materials[GREEN_DIFFUSE].MaterialType = DIFFUSE_REFLECTION;

    materials[BLUE_DIFFUSE].Color = vec3(0.0, 0.0, 0.7);
    materials[BLUE_DIFFUSE].LightCoeffs = vec4(lightCoefs);
    materials[BLUE_DIFFUSE].ReflectionCoef = 0.5;
    materials[BLUE_DIFFUSE].RefractionCoef = 1.0;
    materials[BLUE_DIFFUSE].MaterialType = DIFFUSE_REFLECTION;

    materials[MIRROR].Color = vec3(0.9, 0.2, 0.9);
    materials[MIRROR].LightCoeffs = vec4(lightCoefs);
    materials[MIRROR].ReflectionCoef = 0.9;
    materials[MIRROR].RefractionCoef = 0.0;
    materials[MIRROR].MaterialType = MIRROR_REFLECTION;

    materials[GRAY_DIFFUSE].Color = vec3(0.5, 0.5, 0.5);
    materials[GRAY_DIFFUSE].LightCoeffs = vec4(lightCoefs);
    materials[GRAY_DIFFUSE].ReflectionCoef = 0.3;
    materials[GRAY_DIFFUSE].RefractionCoef = 1.0;
    materials[GRAY_DIFFUSE].MaterialType = DIFFUSE_REFLECTION;

    materials[GOLD].Color = vec3(1.0, 0.75, 0.33);
    materials[GOLD].LightCoeffs = vec4(0.25, 0.6, 0.4, 32.0);
    materials[GOLD].ReflectionCoef = 0.3;
    materials[GOLD].RefractionCoef = 0.1;
    materials[GOLD].MaterialType = REFLECTION;

    materials[SILVER].Color = vec3(0.97, 0.96, 0.9);
    materials[SILVER].LightCoeffs = vec4(0.25, 0.6, 0.4, 64.0);
    materials[SILVER].ReflectionCoef = 0.9;
    materials[SILVER].RefractionCoef = 0.0;
    materials[SILVER].MaterialType = REFLECTION;

    materials[EMERALD].Color = vec3(0.0, 0.6, 0.0);
    materials[EMERALD].LightCoeffs = vec4(0.0215, 0.2174, 0.0215, 12.8);
    materials[EMERALD].ReflectionCoef = 0.2;
    materials[EMERALD].RefractionCoef = 1.6;
    materials[EMERALD].MaterialType = REFRACTION;

    materials[RUBY].Color = vec3(0.61, 0.041, 0.041);
    materials[RUBY].LightCoeffs = vec4(0.0215, 0.2174, 0.0215, 12.8);
    materials[RUBY].ReflectionCoef = 0.3;
    materials[RUBY].RefractionCoef = 1.76;
    materials[RUBY].MaterialType = REFRACTION;
}

vec3 Phong(SIntersection intersect, SLight currLight, float shadow)
{
	vec3 light = normalize(currLight.Position - intersect.Point);
	float diffuse = max(dot(light, intersect.Normal), 0.0);
	vec3 view = normalize(uCamera.Position - intersect.Point);
	vec3 reflected = reflect( -view, intersect.Normal);
	float specular = pow(max(dot(reflected, light), 0.0), intersect.LightCoeffs.w);
	return intersect.LightCoeffs.x * intersect.Color + intersect.LightCoeffs.y * diffuse * intersect.Color * shadow + intersect.LightCoeffs.z * specular;
}

float Shadow(SLight currLight, SIntersection intersect)
{
	float shadowing = 1.0;
	vec3 direction = normalize(currLight.Position - intersect.Point);
	float distanceLight = distance(currLight.Position, intersect.Point);
	SRay shadowRay = SRay(intersect.Point + direction * EPSILON, direction);
	SIntersection shadowIntersect;
	shadowIntersect.Time = BIG;
	if (RayTrace(shadowRay, spheres, triangles, materials, 0, distanceLight, shadowIntersect))
	{
		shadowing = 0.0;
	}
	return shadowing;
}

void main()
{
	float start = 0;
	float final = BIG;

	uCamera = uCamera = SCamera(vec3(0.0, 0.0, -4.9), vec3(0.0, 0.0, 1.0), vec3(0.0, 1.0, 0.0), vec3(1.0, 0.0, 0.0), vec2(1.0));
	SRay ray = GenerateRay(uCamera); 
	SIntersection intersect;
	intersect.Time = BIG;
	vec3 resultColor = vec3(0,0,0);
	initializeDefaultScene(triangles, spheres);
	initializeDefaultLightMaterials(light, materials);
	if (RayTrace(ray, spheres, triangles, materials, start, final, intersect))
	{
		resultColor = vec3(0.1 , 0.1, 0.1);
	}

	STracingRay	trRay = STracingRay(ray, 1, 0);
	pushRay(trRay);
	while (!isEmpty())
	{
		STracingRay trRay = popRay();
		ray = trRay.ray;
		SIntersection intersect;
		intersect.Time = BIG;
		start = 0;
		final = BIG;
		if (RayTrace(ray, spheres, triangles, materials, start, final,	intersect))
		{
			float attenuation = 0.2;
			switch(intersect.MaterialType)
			{
				case DIFFUSE_REFLECTION:
				{
					float shadowing = Shadow(light, intersect);
					resultColor += trRay.contribution * Phong(intersect, light, shadowing);
					break;
				}
				case MIRROR_REFLECTION:
				{
					if (intersect.ReflectionCoef < 1)
					{
						float contribution = trRay.contribution * (1 - intersect.ReflectionCoef);
						float shadowing = Shadow(light, intersect);
						resultColor += contribution * Phong(intersect, light, shadowing);
					}
					vec3 ReflectDirection = reflect(ray.Direction, intersect.Normal);
					float contribution = trRay.contribution * intersect.ReflectionCoef;
					STracingRay reflectRay = STracingRay(SRay(intersect.Point + ReflectDirection * EPSILON, ReflectDirection), contribution, trRay.depth + 1);
					pushRay(reflectRay);
					break;
				}
				case REFRACTION:
				{
					float eta = 1.0 / intersect.RefractionCoef;
					vec3 N = intersect.Normal;
					float cosTheta = dot(-ray.Direction, N);
					if (cosTheta < 0.0) 
					{
    					eta = intersect.RefractionCoef;
						N = -N;
					}
					vec3 refractDir = refract(normalize(ray.Direction), intersect.Normal, eta);
					float contribution = trRay.contribution * pow(attenuation, float(trRay.depth));

					if (trRay.contribution < 0.001)
					{
						resultColor += contribution * intersect.Color;
						break;
					}
					
					if (length(refractDir) > 0.0)
					{
						STracingRay refractRay = STracingRay(SRay(intersect.Point + refractDir * EPSILON, refractDir), contribution, trRay.depth + 1);
						pushRay(refractRay);
					}
					if (intersect.ReflectionCoef > 0.0)
					{
						vec3 reflectDir = reflect(normalize(ray.Direction), intersect.Normal);
						STracingRay reflectRay = STracingRay(SRay(intersect.Point + reflectDir * EPSILON, reflectDir), contribution * intersect.ReflectionCoef, trRay.depth + 1);
						pushRay(reflectRay);
					}
					resultColor += trRay.contribution * intersect.Color * 0.2;
					break;
				}
			}
		}
	}

	FragColor = vec4( resultColor, 1.0); 
}