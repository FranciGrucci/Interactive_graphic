
function GetModelViewProjection(projectionMatrix, translationX, translationY, translationZ, rotationX, rotationY) {
    var translation = [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        translationX, translationY, translationZ, 1
    ];

    var cosX = Math.cos(rotationX);
    var sinX = Math.sin(rotationX);
    var rotationXMatrix = [
        1, 0, 0, 0,
        0, cosX, sinX, 0,
        0, -sinX, cosX, 0,
        0, 0, 0, 1
    ];

    var cosY = Math.cos(rotationY);
    var sinY = Math.sin(rotationY);
    var rotationYMatrix = [
        cosY, 0, -sinY, 0,
        0, 1, 0, 0,
        sinY, 0, cosY, 0,
        0, 0, 0, 1
    ];

    var modelView = MatrixMult(MatrixMult(translation, rotationYMatrix), rotationXMatrix);
    var mvp = MatrixMult(projectionMatrix, modelView);
    return mvp;
}

// Vertex Shader
const vertexShaderSrc = `
    attribute vec3 aPosition;
    attribute vec2 aTexCoord;
    uniform mat4 uMVPMatrix;
    uniform bool uSwapYZ;
    varying vec2 vTexCoord;
    void main() {
        vec4 pos = vec4(aPosition, 1.0);
        if (uSwapYZ) {
            pos.yz = pos.zy;
        }
        gl_Position = uMVPMatrix * pos;
        vTexCoord = aTexCoord;
    }
`;

// Fragment Shader
const fragmentShaderSrc = `
    precision mediump float;
    varying vec2 vTexCoord;
    uniform bool uUseTexture;
    uniform sampler2D uTexture;
    void main() {
        if (uUseTexture) {
            gl_FragColor = texture2D(uTexture, vTexCoord);
        } else {
            gl_FragColor = vec4(1.0, gl_FragCoord.z * gl_FragCoord.z, 0.0, 1.0);
        }
    }
`;

class MeshDrawer {
    constructor() {
        this.shaderProgram = InitShaderProgram(vertexShaderSrc, fragmentShaderSrc);
        gl.useProgram(this.shaderProgram);

        this.mvpMatrixLocation = gl.getUniformLocation(this.shaderProgram, "uMVPMatrix");
        this.swapYZLocation = gl.getUniformLocation(this.shaderProgram, "uSwapYZ");
        this.useTextureLocation = gl.getUniformLocation(this.shaderProgram, "uUseTexture");

        this.vertexPosition = gl.getAttribLocation(this.shaderProgram, "aPosition");
        this.textureCoord = gl.getAttribLocation(this.shaderProgram, "aTexCoord");

        this.vertexBuffer = gl.createBuffer();
        this.texCoordBuffer = gl.createBuffer();

        this.texture = null;
        this.useTextureValue = false;
        this.swapYZValue = false;
    }

    setMesh(vertPos, texCoords) {
        this.numTriangles = vertPos.length / 3;

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);
    }

    swapYZ(swap) {
        this.swapYZValue = swap;
    }

    draw(trans) {
        gl.useProgram(this.shaderProgram);

        gl.uniformMatrix4fv(this.mvpMatrixLocation, false, trans);
        gl.uniform1i(this.swapYZLocation, this.swapYZValue ? 1 : 0);

        // Use texture only if it's been set
        const useTex = this.useTextureValue && this.texture !== null;
        gl.uniform1i(this.useTextureLocation, useTex ? 1 : 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.enableVertexAttribArray(this.vertexPosition);
        gl.vertexAttribPointer(this.vertexPosition, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.enableVertexAttribArray(this.textureCoord);
        gl.vertexAttribPointer(this.textureCoord, 2, gl.FLOAT, false, 0, 0);

        if (useTex) {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.texture);
        }

        gl.drawArrays(gl.TRIANGLES, 0, this.numTriangles);
    }

    setTexture(img) {
        gl.bindTexture(gl.TEXTURE_2D, this.texture = gl.createTexture());
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    }

    showTexture(show) {
        this.useTextureValue = show;
    }
}
