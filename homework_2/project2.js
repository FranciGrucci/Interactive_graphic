// Returns a 3x3 transformation matrix as an array of 9 values in column-major order.
// The transformation first applies scale, then rotation, and finally translation.
// The given rotation value is in degrees.
function GetTransform(positionX, positionY, rotation, scale) {
    let theta = rotation * (Math.PI / 180); // Convert degrees to radians
    let cosT = Math.cos(theta);
    let sinT = Math.sin(theta);

    // Construct the combined transformation matrix: T * R * S
    // in column-major order
    return [
        scale * cosT, scale * sinT, 0,            // First column
        -scale * sinT, scale * cosT, 0,           // Second column
        positionX, positionY, 1                   // Third column
    ];
}

// Returns a 3x3 transformation matrix as an array of 9 values in column-major order.
// The arguments are transformation matrices in the same format.
// The returned transformation first applies trans1 and then trans2.
function ApplyTransform(trans1, trans2) {
    let result = new Array(9).fill(0);

    // Matrix multiplication: result = trans2 * trans1 (column-major order)
    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
            for (let k = 0; k < 3; k++) {
                result[col * 3 + row] += trans2[k * 3 + row] * trans1[col * 3 + k];
            }
        }
    }

    return result;
}
