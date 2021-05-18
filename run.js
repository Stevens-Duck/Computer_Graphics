var canvas;
var gl;
var ext;

var numVertices = 36;
var points = [];
var colors = [];
var textureCoordsArray = [];
var normalsArray = [];

var theta = [90, 90, 0];
var up = vec3(0.0, 1.0, 0.0);

var thetaLoc;
var aspect;
var program;

var projectionMatrixLoc, modelViewMatrixLoc;
var projectionMatrix, modelViewMatrix;

var numInstances = 9;
var matrixData;
var matrices = [];
var byteOffsetToMatrix = 0;
var numFloatsForView = 0;
var bytesPerMatrix = 0;

var matrixBuffer;
var matrixLoc;

var lightPosition = vec4(10.0, 30.0, 50.0, 0.0);
var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0);
var lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
var lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);
var materialAmbient = vec4(1.0, 1.0, 1.0, 1.0);
var materialDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
var materialSpecular = vec4(1.0, 1.0, 1.0, 1.0);
var materialShininess = 100.0;

//Texture
var texture;

window.addEventListener("resize", resizeCanvas, false);
function resizeCanvas(canvas) {
  var myCanvas = document.getElementById("gl-canvas");
  myCanvas.width = document.documentElement.clientWidth;
  myCanvas.height = document.documentElement.clientHeight;
}

function configureTexture( image ) {
    texture = gl.createTexture();
    gl.bindTexture( gl.TEXTURE_2D, texture );
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image );
    gl.generateMipmap( gl.TEXTURE_2D );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );
    gl.uniform1i(gl.getUniformLocation(program, "texture"), 0);
}

window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );
	canvas.width = document.documentElement.clientWidth;
	canvas.height = document.documentElement.clientHeight;
    gl = WebGLUtils.setupWebGL( canvas );
    if (!gl) { alert( "WebGL isn't available" ); }

    ext = gl.getExtension('ANGLE_instanced_arrays');
    if (!ext) { alert("ANGLE_instanced_arrays missing"); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    aspect = canvas.width / canvas.height;
    gl.clearColor( 0.0, 0.0, 0.0, 1.0 );

    setupData();
}

// Class-example code taken and readjusted for the purpose
// of our project.
function rectangle()
{
    quad( 1, 0, 3, 2 );
    quad( 2, 3, 7, 6 );
    quad( 3, 0, 4, 7 );
    quad( 6, 5, 1, 2 );
    quad( 4, 5, 6, 7 );
    quad( 5, 4, 0, 1 );
}

// Quad function taken from class example
// and adjusted to fit our final project.
// Computes texture coords and normals of platforms.
function quad(a, b, c, d)
{
    var vertices = [
        vec4( -1.0, -0.5,  0.25, 1.0 ),  // 0
        vec4( -1.0,  0.5,  0.25, 1.0 ),  // 1
        vec4(  1.0,  0.5,  0.25, 1.0 ),  // 2
        vec4(  1.0, -0.5,  0.25, 1.0 ),  // 3
        vec4( -1.0, -0.5, -0.25, 1.0 ),  // 4
        vec4( -1.0,  0.5, -0.25, 1.0 ),  // 5
        vec4(  1.0,  0.5, -0.25, 1.0 ),  // 6
        vec4(  1.0, -0.5, -0.25, 1.0 )   // 7
    ];

    var vertexColors = [
        [ 0.0, 0.0, 0.0, 1.0 ],  // black
        [ 1.0, 0.0, 0.0, 1.0 ],  // red
        [ 1.0, 1.0, 0.0, 1.0 ],  // yellow
        [ 0.0, 1.0, 0.0, 1.0 ],  // green
        [ 0.0, 0.0, 1.0, 1.0 ],  // blue
        [ 1.0, 0.0, 1.0, 1.0 ],  // magenta
        [ 0.0, 1.0, 1.0, 1.0 ],  // cyan
        [ 1.0, 1.0, 1.0, 1.0 ]   // white
    ];
	
	var textureCoords = [
        vec2(1, 1),
        vec2(0, 1),
        vec2(0, 0),
        vec2(1, 0)
    ];

    var t1 = subtract(vertices[b], vertices[a]);
    var t2 = subtract(vertices[c], vertices[a]);
    var normal = cross(t1, t2);
    normal = vec3(normal);
	
    // We need to parition the quad into two triangles in order for
    // WebGL to be able to render it.  In this case, we create two
    // triangles from the quad indices

    //vertex color assigned by the index of the vertex
    //              1  0  3  1  3  2
    var indices = [ a, b, c, a, c, d ];

    for ( var i = 0; i < indices.length; ++i ) {
        points.push( vertices[indices[i]] );
        //colors.push( vertexColors[indices[i]] );

        // for solid colored faces use
        colors.push(vertexColors[a]);
    }
	textureCoordsArray.push(textureCoords[0]);
    textureCoordsArray.push(textureCoords[1]);
    textureCoordsArray.push(textureCoords[2]);
    textureCoordsArray.push(textureCoords[0]);
    textureCoordsArray.push(textureCoords[2]);
    textureCoordsArray.push(textureCoords[3]);
    normalsArray.push(normal); 
    normalsArray.push(normal); 
    normalsArray.push(normal); 
    normalsArray.push(normal); 
    normalsArray.push(normal); 
    normalsArray.push(normal); 
}

// Makes a matrix of matrices for later use in creating
// multiple instances of platforms.
function matrixMake() {
    matrixData = new Float32Array(numInstances * 16);
    for (let i = 0; i < numInstances; ++i) {
        byteOffsetToMatrix = i * 16 * 4;
        numFloatsForView = 16;
        matrices.push(new Float32Array(
            matrixData.buffer,
            byteOffsetToMatrix,
            numFloatsForView));
    }
}

function setupData() {
    gl.enable(gl.DEPTH_TEST);

    // Load shaders
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    rectangle();
    matrixMake();

    //Normals
    var nBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW );
    
    var vNormal = gl.getAttribLocation( program, "vNormal");
    gl.vertexAttribPointer( vNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);

    var cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );

    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );
	
	//Texture
    var tBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, tBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(textureCoordsArray), gl.STATIC_DRAW );
    var vTexCoord = gl.getAttribLocation( program, "vTexCoord" );
    gl.vertexAttribPointer( vTexCoord, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vTexCoord );
    var image = document.getElementById('moonImg');
    // texture1 = configureTexture( image );
    configureTexture( image );
    // gl.activeTexture( gl.TEXTURE0 );
    // gl.bindTexture( gl.TEXTURE_2D, texture1 );
	// gl.uniform1i(gl.getUniformLocation( program, "texture1"), 0);
	
    matrixBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, matrixBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, matrixData.byteLength, gl.DYNAMIC_DRAW );

    matrixLoc = gl.getAttribLocation(program, 'matrix');
 

    render();
	
    // Button event listeners to change the modelview matrix too correspond
    // with chosen side
    document.getElementById( "bottomButton" ).onclick = function () {
        up = vec3(0.0, 1.0, 0.0);
    };
    document.getElementById( "rightButton" ).onclick = function () {
        up = vec3(1.0, 0.0, 0.0);
    };
    document.getElementById( "topButton" ).onclick = function () {
        up = vec3(0.0, -1.0, 0.0);
    };
    document.getElementById( "leftButton" ).onclick = function () {
        up = vec3(-1.0, 0.0, 0.0);
    };

    var ambientProduct = mult(lightAmbient, materialAmbient);
    var diffuseProduct = mult(lightDiffuse, materialDiffuse);
    var specularProduct = mult(lightSpecular, materialSpecular);

    gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"), flatten(ambientProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"), flatten(diffuseProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"), flatten(specularProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), flatten(lightPosition));
    gl.uniform1f(gl.getUniformLocation(program, "shininess"), materialShininess);

    projectionMatrixLoc = gl.getUniformLocation( program, "projectionMatrix" );
	modelViewMatrixLoc = gl.getUniformLocation( program, "modelViewMatrix" );

    render();
}

var i = 0;

function render()
{
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // conditions here incremement the modelview matrix
    // in order to replicate a moving camera that loops back
    // once it passes over all the platforms
    var eye;
    if (i <= 0) {
        eye = vec3(20, 20, 20);
        i = 20;
    } else {
        eye = vec3(0, i, i);
        i -= 0.01;
    }
    var at = vec3(0.0, 2.0, 0.0);
    modelViewMatrix = lookAt(eye, at, up);
    projectionMatrix = perspective(90, aspect, -5, 1);

    // For each instance, translates platforms across 
    // x, y, and z planes in order to stay symmetrical
    matrices.forEach((mat, ndx) => {
        if ( ndx < 1 ) {    // for the first instance
            m4.translation(ndx * 5,  0, 0, mat);
        }
        else if ( ndx < 4 ) {   // for the next 3 instances
            m4.translation( 15 + (ndx - 5) * 5,  2.2, 4, mat); // shifts x by 5 for each index to have them side-by-side
        }
        else if ( ndx < 9) {    // for the last 5 instances
            m4.translation( 20 + (ndx - 10) * 5,  4.4, 8, mat);
        }
    });
   
    gl.bindBuffer(gl.ARRAY_BUFFER, matrixBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, matrixData);

    bytesPerMatrix = 4 * 16;
    for (let i = 0; i < 4; ++i) {
        var loc = matrixLoc + i;
        gl.enableVertexAttribArray(loc);
        var offset = i * 16;
        gl.vertexAttribPointer(
            loc,
            4,
            gl.FLOAT,
            false,
            bytesPerMatrix,
            offset,
        );
        ext.vertexAttribDivisorANGLE(loc, 1);
    }

    gl.uniform3fv(thetaLoc, theta);

    gl.uniformMatrix4fv( projectionMatrixLoc, false, flatten(projectionMatrix) );
	gl.uniformMatrix4fv( modelViewMatrixLoc, false, flatten(modelViewMatrix) );

    var normalMatrix = [
        vec3(modelViewMatrix[0][0], modelViewMatrix[0][1], modelViewMatrix[0][2]),
        vec3(modelViewMatrix[1][0], modelViewMatrix[1][1], modelViewMatrix[1][2]),
        vec3(modelViewMatrix[2][0], modelViewMatrix[2][1], modelViewMatrix[2][2])
    ];
    
    gl.uniformMatrix3fv(gl.getUniformLocation(program, "normalMatrix"), false, flatten(normalMatrix) );

    // draws all instances
    ext.drawArraysInstancedANGLE(
        gl.TRIANGLES,
        0,
        numVertices,
        numInstances,
    );
    requestAnimationFrame(render);
}