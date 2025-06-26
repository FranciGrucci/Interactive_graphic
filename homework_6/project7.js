function GetModelViewMatrix(translationX, translationY, translationZ, rotationX, rotationY) {
  var trans = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, translationX, translationY, translationZ, 1];
  var rotX = [1, 0, 0, 0, 0, Math.cos(rotationX), -Math.sin(rotationX), 0, 0, Math.sin(rotationX), Math.cos(rotationX), 0, 0, 0, 0, 1];
  var rotY = [Math.cos(rotationY), 0, Math.sin(rotationY), 0, 0, 1, 0, 0, 0 - Math.sin(rotationY), 0, Math.cos(rotationY), 0, 0, 0, 0, 1];
  var mv = MatrixMult(MatrixMult(trans, rotX), rotY);
  return mv;
}

class MeshDrawer {
  constructor() {
    var fragmentShaderObject = gl.createShader(gl.FRAGMENT_SHADER);
    var fragmentShaderObject = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShaderObject, fragmentShader);
    gl.compileShader(fragmentShaderObject);
    if (!gl.getShaderParameter(fragmentShaderObject, gl.COMPILE_STATUS)) {
      console.error("ERROR compiling fragment shader!", gl.getShaderInfoLog(fragmentShaderObject));
    }

    this.program = InitShaderProgram(vertexShader, fragmentShader);
    gl.useProgram(this.program);

    this.SwapYZ = gl.getUniformLocation(this.program, "SwapYZ");
    this.mvp = gl.getUniformLocation(this.program, "mvp");
    this.mv = gl.getUniformLocation(this.program, "mv");
    this.mn = gl.getUniformLocation(this.program, "mn");
    this.position = gl.getAttribLocation(this.program, "position");
    this.shTexture = gl.getUniformLocation(this.program, "shTexture");
    this.texCoord = gl.getAttribLocation(this.program, "texCoord");
    this.tex = gl.getUniformLocation(this.program, "tex");
    this.textureLoaded = gl.getUniformLocation(this.program, "textureLoaded");
    this.normal = gl.getAttribLocation(this.program, "normal");
    this.lightDirection = gl.getUniformLocation(this.program, "lightDirection");
    this.shininess = gl.getUniformLocation(this.program, "shininess");

    gl.uniform1i(this.SwapYZ, 0);
    gl.uniform1i(this.shTexture, 1);
    gl.uniform1i(this.textureLoaded, 0);

    this.vertexBuffer = gl.createBuffer();
    this.texCoordsBuffer = gl.createBuffer();
    this.normalBuffer = gl.createBuffer();
  }

  setMesh(vertPos, texCoords, normals) {
    gl.useProgram(this.program);

    this.numVerticies = vertPos.length / 3;

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);

    gl.vertexAttribPointer(this.position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(this.position);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);

    gl.vertexAttribPointer(this.texCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(this.texCoord);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

    gl.vertexAttribPointer(this.normal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(this.normal);
  }

  swapYZ(swap) {
    gl.useProgram(this.program);

    if (swap) {
      gl.uniform1i(this.SwapYZ, 1);
    } else {
      gl.uniform1i(this.SwapYZ, 0);
    }
  }

  draw(matrixMVP, matrixMV, matrixNormal) {
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.vertexAttribPointer(this.position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(this.position);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordsBuffer);
    gl.vertexAttribPointer(this.texCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(this.texCoord);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
    gl.vertexAttribPointer(this.normal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(this.normal);

    gl.uniformMatrix4fv(this.mvp, false, matrixMVP);
    gl.uniformMatrix4fv(this.mv, false, matrixMV);
    gl.uniformMatrix3fv(this.mn, false, matrixNormal);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);

    gl.drawArrays(gl.TRIANGLES, 0, this.numVerticies);
  }

  setTexture(img) {
    gl.useProgram(this.program);

    gl.uniform1i(this.textureLoaded, 1);
    this.texture = gl.createTexture();

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);

    gl.uniform1i(this.tex, 0);
  }

  showTexture(show) {
    gl.useProgram(this.program);

    if (show) {
      gl.uniform1i(this.shTexture, 1);
    } else {
      gl.uniform1i(this.shTexture, 0);
    }
  }

  setLightDir(x, y, z) {
    gl.useProgram(this.program);
    gl.uniform3f(this.lightDirection, x, y, z);
  }

  setShininess(shininess) {
    gl.useProgram(this.program);
    gl.uniform1f(this.shininess, shininess);
  }
}

function SimTimeStep(dt, positions, velocities, springs, stiffness, damping, particleMass, gravity, restitution) {
  var forces = Array(positions.length);

  console.log("Positions: ", positions);
  console.log("Velocities: ", velocities);
  console.log("Springs: ", springs);
  console.log("Stiffness: ", stiffness);
  console.log("Damping: ", damping);
  console.log("Particle Mass: ", particleMass);
  console.log("Gravity: ", gravity);
  console.log("Restitution: ", restitution);
  console.log("Time step: ", dt);
  var forces = Array(positions.length);
  forces.fill(new Vec3(0, 0, 0));

  for (let i = 0; i < springs.length; i++) {
    let spring = springs[i];
    let x0 = positions[spring.p0];
    let x1 = positions[spring.p1];
    let v0 = velocities[spring.p0];
    let v1 = velocities[spring.p1];

    let delta = x1.sub(x0);
    let length = delta.len();
    let restLen = spring.rest;
    let direction = delta.div(length);

    let springForce = direction.mul(stiffness * (length - restLen));
    forces[spring.p0] = forces[spring.p0].add(springForce);
    forces[spring.p1] = forces[spring.p1].add(springForce.mul(-1));

    let relVel = v1.sub(v0).dot(direction);
    let dampingForce = direction.mul(damping * relVel);
    forces[spring.p0] = forces[spring.p0].add(dampingForce);
    forces[spring.p1] = forces[spring.p1].add(dampingForce.mul(-1));
  }

  for (let i = 0; i < velocities.length; i++) {
    let accel = forces[i].div(particleMass).add(gravity);
    velocities[i] = velocities[i].add(accel.mul(dt));
  }

  for (let i = 0; i < positions.length; i++) {
    positions[i] = positions[i].add(velocities[i].mul(dt));
  }

  const minB = new Vec3(-1, -1, -1);
  const maxB = new Vec3(1, 1, 1);
  for (let i = 0; i < positions.length; i++) {
    let pos = positions[i];
    let vel = velocities[i];

    for (const axis of ["x", "y", "z"]) {
      if (pos[axis] < minB[axis]) {
        let pen = minB[axis] - pos[axis];
        pos[axis] = minB[axis] + pen * restitution;
        vel[axis] *= -restitution;
      }
      if (pos[axis] > maxB[axis]) {
        let pen = pos[axis] - maxB[axis];
        pos[axis] = maxB[axis] - pen * restitution;
        vel[axis] *= -restitution;
      }
    }
  }
}

var fragmentShader = `
	precision mediump float;
	uniform bool shTexture;
	uniform sampler2D tex;
	uniform bool textureLoaded;
	uniform vec3 lightDirection;
	uniform float shininess;

	varying vec2 vertexTexCoord;
	varying vec3 vertexNormal;
	varying vec3 vertexPos;

	void main() {
		vec3 I = vec3(1.0,1.0,1.0);
		vec3 Ks = vec3(1.0,1.0,1.0);
		vec3 Kd = vec3(1.0,1.0,1.0);
		if(shTexture && textureLoaded){
			Kd = texture2D(tex, vertexTexCoord).rgb;
		}else{
			Kd = vec3(1,gl_FragCoord.z*gl_FragCoord.z,0);
		}

		vec3 n = normalize(vertexNormal);
		vec3 omega = normalize(lightDirection);
		vec3 v = normalize(-vertexPos);
		vec3 h = normalize((omega + v)/length(omega + v));

		float theta = acos(dot(omega,n));
		float phi = acos(dot(n, h));

		vec3 finalColor = I*(max(cos(theta),0.0)*Kd + Ks*pow(cos(phi),shininess));

		gl_FragColor = vec4(finalColor, 1.0);	
}`;

var vertexShader = `
	uniform bool SwapYZ;
	uniform mat4 mvp;
	uniform mat4 mv;
	uniform mat3 mn;

	attribute vec3 position;
	attribute vec2 texCoord;
	attribute vec3 normal; 

	varying vec2 vertexTexCoord;
	varying vec3 vertexNormal;
	varying vec3 vertexPos;

	void main(){
		vec3 pos = position;
		if(SwapYZ){
			pos = vec3(pos.x, pos.z, pos.y);
		}
		gl_Position = mvp * vec4(pos, 1.0);

		vertexTexCoord = texCoord;

		vertexNormal = normalize(mn * normal);

		vertexPos = (mv * vec4(pos, 1.0)).xyz;
	}
`;