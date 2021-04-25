var canvas;
var gl;

var numVertices = 36;
var points = [];
var colors = [];

var theta = [90, 90, 0];

var thetaLoc;
var aspect;


window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    aspect = canvas.width/canvas.height;
    gl.clearColor( 0.0, 0.0, 0.0, 1.0 );

    setupData();
}

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
}

var projectionMatrixLoc, modelViewMatrixLoc;

function setupData() {
    gl.enable(gl.DEPTH_TEST);

    // Load shaders
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    colorCube();

    var cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );

    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

    modelViewMatrixLoc = gl.getUniformLocation( program, "modelViewMatrix" );
    projectionMatrixLoc = gl.getUniformLocation( program, "projectionMatrix" );

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    thetaLoc = gl.getUniformLocation(program, "theta");

    render();
}

var modelViewMatrix, projectionMatrix;
var i=0;
function render()
{
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    //var eye = vec3(0.0, 3.0, 0.0);
    var eye;
    if(i <= 0) {
        eye = vec3(20, 20, 20);
        i = 20;
    } else {
        eye = vec3(0,i,i);
        i-=0.1;
    }
    var at = vec3(0.0, 2.0, 0.0);
    var up = vec3(0.0, 1.0, 0.0);
    modelViewMatrix = lookAt( eye, at, up );
    var scale = 6;
	// projectionMatrix = ortho(-1.0*scale, 1.0*scale, -1.0*scale, 1.0*scale, -1.0*scale, 1.0*scale);
	projectionMatrix = perspective(100, aspect, -2, 1);

    gl.uniform3fv(thetaLoc, theta);

    gl.drawArrays( gl.TRIANGLES, 0, numVertices );

    gl.uniformMatrix4fv( modelViewMatrixLoc, false, flatten(modelViewMatrix) );
    gl.uniformMatrix4fv( projectionMatrixLoc, false, flatten(projectionMatrix) );

    requestAnimFrame( render );
}