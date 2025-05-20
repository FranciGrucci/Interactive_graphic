// This function takes the translation and two rotation angles (in radians) as input arguments.
// The two rotations are applied around x and y axes.
// It returns the combined 4x4 transformation matrix as an array in column-major order.
// You can use the MatrixMult function defined in project5.html to multiply two 4x4 matrices in the same format.
function GetModelViewMatrix(translationX, translationY, translationZ, rotationX, rotationY) {
    // Translation matrix
    var translation = [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        translationX, translationY, translationZ, 1
    ];

    // Rotation around X-axis
    var cosX = Math.cos(rotationX);
    var sinX = Math.sin(rotationX);
    var rotationXMatrix = [
        1, 0, 0, 0,
        0, cosX, sinX, 0,
        0, -sinX, cosX, 0,
        0, 0, 0, 1
    ];

    // Rotation around Y-axis
    var cosY = Math.cos(rotationY);
    var sinY = Math.sin(rotationY);
    var rotationYMatrix = [
        cosY, 0, -sinY, 0,
        0, 1, 0, 0,
        sinY, 0, cosY, 0,
        0, 0, 0, 1
    ];

    // Combine transformations: Translation * RotationY * RotationX
    var modelView = MatrixMult(MatrixMult(translation, rotationYMatrix), rotationXMatrix);
    return modelView;
}

// Vertex Shader Source Code
const vertexShaderSrc = `
    attribute vec3 aPosition;
    attribute vec2 aTexCoord;
    attribute vec3 aNormal;
    uniform mat4 uMVPMatrix;
    uniform mat4 uMVMatrix;
    uniform mat3 uNormalMatrix;
    uniform bool uSwapYZ;
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec2 vTexCoord;
    void main() {
        vec4 pos = vec4(aPosition, 1.0);
        if (uSwapYZ) {
            pos.yz = pos.zy;
        }
        gl_Position = uMVPMatrix * pos;
        vPosition = (uMVMatrix * pos).xyz; // Transform position to camera space
        vNormal = uNormalMatrix * aNormal; // Transform normal to camera space
        vTexCoord = aTexCoord;
    }
`;

// Fragment Shader Source Code
const fragmentShaderSrc = `
    precision mediump float;
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec2 vTexCoord;
    uniform bool uUseTexture;
    uniform sampler2D uTexture;
    uniform vec3 uLightDir;
    uniform float uShininess;
    void main() {
        vec3 normal = normalize(vNormal);
        vec3 lightDir = normalize(uLightDir);
        vec3 viewDir = normalize(-vPosition); // Camera is at (0,0,0) in camera space
        vec3 halfDir = normalize(lightDir + viewDir);

        // Diffuse component
        float diff = max(dot(normal, lightDir), 0.0);

        // Specular component (Blinn-Phong)
        float spec = pow(max(dot(normal, halfDir), 0.0), uShininess);

        // Base color (use texture if enabled, otherwise white)
        vec4 baseColor = uUseTexture ? texture2D(uTexture, vTexCoord) : vec4(1.0);

        // Combine components
        vec3 color = baseColor.rgb * diff + vec3(1.0) * spec;
        gl_FragColor = vec4(color, 1.0);
    }
`;

// [TO-DO] Complete the implementation of the following class.
class MeshDrawer {
    constructor() {
        // Compile the shader program
        this.shaderProgram = InitShaderProgram(vertexShaderSrc, fragmentShaderSrc);
        gl.useProgram(this.shaderProgram);

        // Get uniform locations
        this.mvpMatrixLocation = gl.getUniformLocation(this.shaderProgram, "uMVPMatrix");
        this.mvMatrixLocation = gl.getUniformLocation(this.shaderProgram, "uMVMatrix");
        this.normalMatrixLocation = gl.getUniformLocation(this.shaderProgram, "uNormalMatrix");
        this.swapYZLocation = gl.getUniformLocation(this.shaderProgram, "uSwapYZ");
        this.useTextureLocation = gl.getUniformLocation(this.shaderProgram, "uUseTexture");
        this.lightDirLocation = gl.getUniformLocation(this.shaderProgram, "uLightDir");
        this.shininessLocation = gl.getUniformLocation(this.shaderProgram, "uShininess");

        // Get attribute locations
        this.vertexPosition = gl.getAttribLocation(this.shaderProgram, "aPosition");
        this.textureCoord = gl.getAttribLocation(this.shaderProgram, "aTexCoord");
        this.normal = gl.getAttribLocation(this.shaderProgram, "aNormal");

        // Create buffers
        this.vertexBuffer = gl.createBuffer();
        this.texCoordBuffer = gl.createBuffer();
        this.normalBuffer = gl.createBuffer();

        // Initialize texture
        this.texture = gl.createTexture();
        this.useTextureValue = false;
        this.swapYZValue = false;
    }

    // This method is called every time the user opens an OBJ file.
    setMesh(vertPos, texCoords, normals) {
        this.numTriangles = vertPos.length / 3;

        // Load vertex positions
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);

        // Load texture coordinates
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);

        // Load normals
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
    }

    // This method is called when the user changes the state of the "Swap Y-Z Axes" checkbox.
    swapYZ(swap) {
        this.swapYZValue = swap;
        gl.useProgram(this.shaderProgram);
        gl.uniform1i(this.swapYZLocation, swap ? 1 : 0);
    }

    // This method is called to draw the triangular mesh.
    draw(matrixMVP, matrixMV, matrixNormal) {
        gl.useProgram(this.shaderProgram);

        // Set matrices
        gl.uniformMatrix4fv(this.mvpMatrixLocation, false, matrixMVP);
        gl.uniformMatrix4fv(this.mvMatrixLocation, false, matrixMV);
        gl.uniformMatrix3fv(this.normalMatrixLocation, false, matrixNormal);

        // Bind vertex buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.enableVertexAttribArray(this.vertexPosition);
        gl.vertexAttribPointer(this.vertexPosition, 3, gl.FLOAT, false, 0, 0);

        // Bind texture coordinate buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.enableVertexAttribArray(this.textureCoord);
        gl.vertexAttribPointer(this.textureCoord, 2, gl.FLOAT, false, 0, 0);

        // Bind normal buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.enableVertexAttribArray(this.normal);
        gl.vertexAttribPointer(this.normal, 3, gl.FLOAT, false, 0, 0);

        // Bind texture if enabled
        if (this.useTextureValue) {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.texture);
        }

        // Draw the mesh
        gl.drawArrays(gl.TRIANGLES, 0, this.numTriangles);
    }

    // This method is called to set the texture of the mesh.
    setTexture(img) {
        console.log("Texture loaded:", img); // Verify the image is loaded
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    }

    // This method is called when the user changes the state of the "Show Texture" checkbox.
    showTexture(show) {
        this.useTextureValue = show;
        gl.useProgram(this.shaderProgram);
        gl.uniform1i(this.useTextureLocation, show ? 1 : 0);
    }

    // This method is called to set the incoming light direction.
    setLightDir(x, y, z) {
        const length = Math.sqrt(x * x + y * y + z * z);
        x /= length;
        y /= length;
        z /= length;
        gl.useProgram(this.shaderProgram);
        gl.uniform3f(this.lightDirLocation, x, y, z);
    }

    // This method is called to set the shininess of the material.
    setShininess(shininess) {
        gl.useProgram(this.shaderProgram);
        gl.uniform1f(this.shininessLocation, shininess);
    }
}