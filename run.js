var canvas;
var gl;
var ext;

var numVertices = 36;
var points = [];
var colors = [];
var textureCoordsArray = [];

var up = vec3(0.0, 1.0, 0.0);

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
//Lighting
var lightPosition = vec3(0.0, 4.6, 0.0 );
var materialShininess = 7.0;
//Texture
var texture;
var value = 3;
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

    gl = WebGLUtils.setupWebGL( canvas );
    if (!gl) { alert( "WebGL isn't available" ); }

    ext = gl.getExtension('ANGLE_instanced_arrays');
    if (!ext) { alert("ANGLE_instanced_arrays missing"); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    aspect = canvas.width / canvas.height;
    gl.clearColor( 0.0, 0.0, 0.0, 1.0 );

    setupData();
}

window.addEventListener("keydown", function(){
	switch(event.keyCode) {
		case 38:  // up arrow key
			up = vec3(0.0, -1.0, 0.0);
			break;
		case 40:  // down arrow key
			up = vec3(0.0, 1.0, 0.0);
			break;
		case 37: // left arrow key
			up = vec3(-1.0, 0.0, 0.0);
			break;
		case 39: // right arrow key
			up = vec3(1.0, 0.0, 0.0);
			break;
	}
}, true);
function colorCube()
{
    quad( 1, 0, 3, 2 );
    quad( 2, 3, 7, 6 );
    quad( 3, 0, 4, 7 );
    quad( 6, 5, 1, 2 );
    quad( 4, 5, 6, 7 );
    quad( 5, 4, 0, 1 );
}

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
}

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

    colorCube();
    matrixMake();

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
    projectionMatrixLoc = gl.getUniformLocation( program, "projectionMatrix" );
	modelViewMatrixLoc = gl.getUniformLocation( program, "modelViewMatrix" );

    render();
}

var i = 0;

function render()
{
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    //var eye = vec3(0, 3, 2);
    var eye;
    if (i <= 0) {
        eye = vec3(20, 20, 20);
        i = 20;
    } else {
        eye = vec3(0, i, i);
        i -= 0.05;
    }
    var at = vec3(0.0, 2.0, 0.0);
    modelViewMatrix = lookAt(eye, at, up);
    projectionMatrix = perspective(100, aspect, -5, 1);

    matrices.forEach((mat, ndx) => {
        if ( ndx < 1 ) {
            m4.translation(ndx * 5,  0, 0, mat);
        }
        else if ( ndx < 4 ) {
            m4.translation( 15 + (ndx - 5) * 5,  2.5, 4, mat);
        }
        else if ( ndx < 9) {
            m4.translation( 20 + (ndx - 10) * 5,  5, 8, mat);
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

	//Lighting
	gl.uniform3fv( gl.getUniformLocation(program, "lightPosition"),flatten(lightPosition) );
	gl.uniform3fv( gl.getUniformLocation(program, "eye"),flatten(lightPosition) );
	gl.uniform1f( gl.getUniformLocation(program, "shininess"),materialShininess );
	
    gl.uniformMatrix4fv( projectionMatrixLoc, false, flatten(projectionMatrix) );
	gl.uniformMatrix4fv( modelViewMatrixLoc, false, flatten(modelViewMatrix) );

    ext.drawArraysInstancedANGLE(
        gl.TRIANGLES,
        0,
        numVertices,
        numInstances,
    );
    requestAnimationFrame(render);
}