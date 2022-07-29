const vShader =`
	attribute vec4 aVertexPosition;
	attribute vec2 aTextureCoordinates;
	
	uniform mat4 uModelTransform; 
	uniform mat4 uPerspectiveViewTransform;

	varying vec2 vTextureCoordinates;

	void main() {
		gl_Position = uPerspectiveViewTransform * uModelTransform * aVertexPosition; 
		vTextureCoordinates = aTextureCoordinates;  
	} 
	`

const fShader = `
	precision mediump float; 
	varying vec2 vTextureCoordinates;
	uniform sampler2D uSampler;
	
	void main() {
		gl_FragColor = texture2D(uSampler, vTextureCoordinates);
	}
	`

var animate = 0;

var gl;
var canvas;
var all_colors = [];
var shadersProgram;
var vertexPositionAttributePointer;
var modelUniformPointer;
var perspectiveViewUniformPointer;

// Textures
var wood_texture;
var wood_texture_2;
var fabric_texture;

var mouseDown = false;			// Mouse button pressed flag
var deltaFresh = false;

var lastMouseX = null;			// Last mouse position on canvas
var lastMouseY = null; 

var currMouseX = null;			// Current mouse position on canvas
var currMouseY = null;

var deltaMouseX = 0;			// Mouse movement difference (now - last)
var deltaMouseY = 0;

var wheelRadiusFactor = 0;		// Handle mousewheel pos
var prev_angle = wheelRadiusFactor;

var easterEggCounter = 0;
var rect;

// Final positions for chair
var broken_chair_backrest_pos = [30.5, 0, 1/2];
var final_chair_backrest_pos = [40.5, 0, 0.5];
var curr_chair_backrest_pos = broken_chair_backrest_pos;
var chair_backrest_rotation = 0;

// Handles toggle buttons
var prev_toggle;

var vertexBuffer;
var color_Desk_Buffer; 
var indexBuffer;
var totalAngle = 0;
var totalZ = 1.0;

var vMatrix = new Float32Array(16);
var pMatrix = new Float32Array(16);
var pvMatrix = new Float32Array(16);
	
var rotationXMatrix = new Float32Array(16);
var requestID = 0; 
	
function createGLContext(canvas) {
	var context = null;
	
	context = canvas.getContext("webgl");
	if (!context)
		context = canvas.getContext("experimental-webgl"); 
	if (context) {
		context.viewportWidth = canvas.width; 
		context.viewportHeight = canvas.height; 
	} 
	else {
		alert("Failed to create WebGL context!");
	}
	return context;
}

function createCompileShader(shaderType, shaderSource) {
	var outShader = gl.createShader(shaderType);
	gl.shaderSource(outShader, shaderSource); 
	gl.compileShader(outShader); 
	if (!gl.getShaderParameter(outShader, gl.COMPILE_STATUS)) { 
		alert( "Shader compilation error. " + gl.getShaderInfoLog(outShader) ); 
		gl.deleteShader(outShader);
		outShader = null;
	}
	return outShader;
}

function initShaders() {
	var vertexShaderSource = vShader;
	var fragmentShaderSource = fShader;
	var vertexShader = createCompileShader(gl.VERTEX_SHADER, vertexShaderSource); 
	var fragmentShader = createCompileShader(gl.FRAGMENT_SHADER, fragmentShaderSource); 
	shadersProgram = gl.createProgram(); 
	gl.attachShader(shadersProgram, vertexShader); 
	gl.attachShader(shadersProgram, fragmentShader); 
	gl.linkProgram(shadersProgram);
	
	if (!gl.getProgramParameter(shadersProgram, gl.LINK_STATUS))
		alert("Shaders linking error.");

	gl.useProgram(shadersProgram); 
	vertexPositionAttributePointer = gl.getAttribLocation(shadersProgram, "aVertexPosition"); 
	gl.enableVertexAttribArray(vertexPositionAttributePointer); 

	textureCoordinatesAttributePointer = gl.getAttribLocation(shadersProgram, "aTextureCoordinates");
	gl.enableVertexAttribArray(textureCoordinatesAttributePointer);

	verticesTransformUniformPointer = gl.getUniformLocation(shadersProgram, "uVerticesTransform"); 

	modelUniformPointer = gl.getUniformLocation(shadersProgram, "uModelTransform"); 
	perspectiveViewUniformPointer = gl.getUniformLocation(shadersProgram, "uPerspectiveViewTransform");
		
	uSamplerPointer = gl.getUniformLocation(shadersProgram, "uSampler");
}

function initBuffers() {
	var tetraVertices = new Float32Array([
		-1.0, -1.0,  1.0, 1.0, -1.0,  1.0, 1.0,  1.0,  1.0, -1.0,  1.0,  1.0,		// Front face
		-1.0, -1.0, -1.0, -1.0,  1.0, -1.0, 1.0,  1.0, -1.0, 1.0, -1.0, -1.0,		// Back face
		-1.0,  1.0, -1.0, -1.0,  1.0,  1.0, 1.0,  1.0,  1.0, 1.0,  1.0, -1.0,		// Top face
		-1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0,  1.0, -1.0, -1.0,  1.0,		// Bottom face
		1.0, -1.0, -1.0, 1.0,  1.0, -1.0, 1.0,  1.0,  1.0, 1.0, -1.0,  1.0,			// Right face
		-1.0, -1.0, -1.0, -1.0, -1.0,  1.0, -1.0,  1.0,  1.0, -1.0,  1.0, -1.0,		// Left face
	]);
	
	vertexBuffer = gl.createBuffer(); 
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer); 
	gl.bufferData(gl.ARRAY_BUFFER, tetraVertices,	gl.STATIC_DRAW); 
	vertexBuffer.itemSize = 3;

	textureBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
	var textureCoordinates=new Float32Array([
		// Front
		0.0,  0.0,
		1.0,  0.0,
		1.0,  1.0,
		0.0,  1.0,
		// Back
		0.0,  0.0,
		1.0,  0.0,
		1.0,  1.0,
		0.0,  1.0,
		// Top
		0.0,  0.0,
		1.0,  0.0,
		1.0,  1.0,
		0.0,  1.0,
		// Bottom
		0.0,  0.0,
		1.0,  0.0,
		1.0,  1.0,
		0.0,  1.0,
		// Right
		0.0,  0.0,
		1.0,  0.0,
		1.0,  1.0,
		0.0,  1.0,
		// Left
		0.0,  0.0,
		1.0,  0.0,
		1.0,  1.0,
		0.0,  1.0,
	]);

	gl.bufferData(gl.ARRAY_BUFFER, textureCoordinates, gl.STATIC_DRAW);  
	textureBuffer.itemSize = 2;

	wood_texture = gl.createTexture();
	var woodImageURL = "./textures/texture_wood_1.jpg";
	preprocessTextureImage(woodImageURL, wood_texture);

	wood_texture_2 = gl.createTexture();
	var woodImageURL = "./textures/texture_wood_2.jpg";
	preprocessTextureImage(woodImageURL, wood_texture_2);

	fabric_texture = gl.createTexture();
	var fabricImageURL = "./textures/texture_fabric.jpg";
	preprocessTextureImage(fabricImageURL, fabric_texture);

	sky_texture = gl.createTexture();
	var skyImageURL = "./textures/texture_sky.jpg";
	preprocessTextureImage(skyImageURL, sky_texture);

	floor_texture = gl.createTexture();
	var skyImageURL = "./textures/texture_floor.jpg";
	preprocessTextureImage(skyImageURL, floor_texture);

	var indexMatrix = [
		0,1,2, 0,2,3,		// FRONT
		4,5,6, 4,6,7,		// BACK
		8,9,10, 8,10,11, 	// TOP
		12,13,14, 12,14,15,	// BOTTOM
		16,17,18, 16,18,19, // RIGHT
		20,21,22, 20,22,23 	// LEFT
	];

	indexBuffer = gl.createBuffer(); 
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer); 
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexMatrix) ,gl.STATIC_DRAW);
	indexBuffer.itemCount = 36;
}

function preprocessTextureImage(imageURL, textureObject) {
	var imageObject = new Image();
		
	imageObject.onload = function()
	{
		gl.bindTexture(gl.TEXTURE_2D, textureObject);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imageObject);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
		gl.generateMipmap(gl.TEXTURE_2D);
	}
	imageObject.src = imageURL;	
}

function drawScene()
{
	if(!mouseDown && requestID ){
		numStepAngle = 1*Math.PI/180.0;
		totalAngle += 0.01;

		// Stop overflow of totalAngle
		if (totalAngle >= 2*Math.PI)				// If totalAngle goes over 360 degrees (2π), make it equal to angle less then 360 degrees.
			totalAngle = totalAngle - 2*Math.PI;
		else if (totalAngle < 0)					// If totalAngle goes negetive, make it equal to the same positive angle.
			totalAngle = totalAngle + 2*Math.PI;
		totalZ += 0.001;
	}

	if (mouseDown){
		if (deltaFresh){
			totalAngle = totalAngle + deltaMouseX*Math.PI/180.0;
			totalZ = totalZ - deltaMouseY/100.0;
			deltaFresh = false;
		}
	}

	// View matrix
	var vMatrix = glMatrix.mat4.create();

	const aspect = canvas.clientWidth / canvas.clientHeight;
	glMatrix.mat4.perspective(pMatrix,Math.PI/2,aspect,0.01,3000);

	// text box for user input (view angle and view distance)
	var numviewAngle = parseFloat(document.getElementById("viewAngle").value)*Math.PI/180;
	var numviewDistance = parseFloat(document.getElementById("viewDistance").value);

	// Get toggle button choice and reset camera
	if(document.getElementById('Left-Front-Top').checked)
	{
		if (prev_toggle != 'Left-Front-Top'){
			totalZ = 1;
			totalAngle = 0;
		}
		camera_pos = [-numviewDistance, -numviewDistance, numviewDistance];
		console.log("Left-Front-Top")
		prev_toggle = "Left-Front-Top"
	}
	else if(document.getElementById('Left-Front-Bottom').checked){
		if (prev_toggle != 'Left-Front-Bottom'){
			totalZ = 1;
			totalAngle = 0;
		}
		camera_pos = [-numviewDistance, -numviewDistance, -numviewDistance];
		console.log("Left-Front-Bottom")
		prev_toggle = "Left-Front-Bottom"
	}
	else if(document.getElementById('Left-Back-Top').checked){
		if (prev_toggle != 'Left-Back-Top'){
			totalZ = 1;
			totalAngle = 0;
		}
		camera_pos = [-numviewDistance, numviewDistance, numviewDistance];
		console.log("Left-Back-Top")
		prev_toggle = "Left-Back-Top"
	}
	else if(document.getElementById('Left-Back-Bottom').checked){
		if (prev_toggle != 'Left-Back-Bottom'){
			totalZ = 1;
			totalAngle = 0;
		}
		camera_pos = [-numviewDistance, numviewDistance, -numviewDistance];
		console.log("Left-Back-Bottom")
		prev_toggle = "Left-Back-Bottom"
	}
	else if(document.getElementById('Right-Front-Top').checked){
		if (prev_toggle != 'Right-Front-Top'){
			totalZ = 1;
			totalAngle = 0;
		}
		camera_pos = [numviewDistance, -numviewDistance, numviewDistance];
		console.log("Right-Front-Top")
		prev_toggle = "Right-Front-Top"
	}
	else if(document.getElementById('Right-Front-Bottom').checked){
		if (prev_toggle != 'Right-Front-Bottom'){
			totalZ = 1;
			totalAngle = 0;
		}
		camera_pos = [numviewDistance, -numviewDistance, -numviewDistance];
		console.log("Right-Front-Bottom")
		prev_toggle = "Right-Front-Bottom"
	}
	else if(document.getElementById('Right-Back-Top').checked){
		if (prev_toggle != 'Right-Back-Top'){
			totalZ = 1;
			totalAngle = 0;
		}
		camera_pos = [numviewDistance, numviewDistance, numviewDistance];
		console.log("Right-Back-Top")
		prev_toggle = "Right-Back-Top"
	}
	else if(document.getElementById('Right-Back-Bottom').checked){
		if (prev_toggle != 'Right-Back-Bottom'){
			totalZ = 1;
			totalAngle = 0;
		}
		camera_pos = [numviewDistance, numviewDistance, -numviewDistance];
		console.log("Right-Back-Bottom")
		prev_toggle = "Right-Back-Bottom"
	}
	else{
		console.log("no choice....")
		camera_pos = [-numviewDistance, -numviewDistance, numviewDistance];
	}

	// So the "rotation" goes up
	if (camera_pos[2]<=0)
		camera_pos = [camera_pos[0], camera_pos[1], camera_pos[2] * 1/totalZ]
	else
		camera_pos = [camera_pos[0], camera_pos[1], camera_pos[2] * totalZ]

	// Camera rotation
	let rotationZMatrix = new Float32Array(16);
	glMatrix.mat4.fromZRotation(rotationZMatrix, totalAngle);
	glMatrix.mat4.lookAt(vMatrix, camera_pos, [0, 0, 0], [0, 0, 1]);
	glMatrix.mat4.perspective(pMatrix, numviewAngle, aspect, 0.01, 3000);

	// Make background gray
	gl.clearColor(0.5, 0.5, 0.5, 1.0);
	gl.clearDepth(1.0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	glMatrix.mat4.multiply(pvMatrix,pMatrix,vMatrix);
	glMatrix.mat4.multiply(pvMatrix, pvMatrix, rotationZMatrix);
	gl.uniformMatrix4fv(perspectiveViewUniformPointer, false, pvMatrix);
		
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	gl.vertexAttribPointer(vertexPositionAttributePointer, 3, gl.FLOAT, false, 0, 0);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indexBuffer);


	// Table top
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, wood_texture); 
	gl.uniform1i(uSamplerPointer, 0);
	gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
	gl.vertexAttribPointer(textureCoordinatesAttributePointer, textureBuffer.itemSize, gl.FLOAT, false, 0, 0);
	
	draw_parallelogram([0,0,20.5], [10,10,0.5]);

	// Table legs
	gl.activeTexture(gl.TEXTURE1);
	gl.bindTexture(gl.TEXTURE_2D, wood_texture_2); 
	gl.uniform1i(uSamplerPointer, 1);
	gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
	gl.vertexAttribPointer(textureCoordinatesAttributePointer, textureBuffer.itemSize, gl.FLOAT, false, 0, 0);

	var j=0;
	for(var p=-19; p<=19; p+=38){
		for(var i=-19; i<=19; i+=38){
			draw_parallelogram([p/2, i/2, 10], [0.5, 0.5 ,10]);
			j++;
		}
	}

	//chairlegs
	for(var p=5.25; p<=14.75; p+=9.5){
		for(var i=-4.75; i<=4.75; i+=9.5){
			draw_parallelogram([p, i, 5], [0.25, 0.25, 5], wheelRadiusFactor, [15,0,0]);
		}
	}

	gl.activeTexture(gl.TEXTURE1);
	gl.bindTexture(gl.TEXTURE_2D, fabric_texture); 
	gl.uniform1i(uSamplerPointer, 1);
	gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
	gl.vertexAttribPointer(textureCoordinatesAttributePointer, textureBuffer.itemSize, gl.FLOAT, false, 0, 0);

	// Chair top
	draw_parallelogram([10,0,10.25], [5,5,0.25], wheelRadiusFactor, [15,0,0]);

	//Chair back
	if ( easterEggCounter < 4 )
	{
		draw_parallelogram([14.75, 0, 15.5], [0.25, 5, 5], wheelRadiusFactor, [15,0,0]);
	}
	else
	{
		// Start rotating and moving animation for back of chair
		if (curr_chair_backrest_pos[0] < final_chair_backrest_pos[0])
		{
			draw_parallelogram(curr_chair_backrest_pos, [5, 5, 0.25], chair_backrest_rotation, curr_chair_backrest_pos, [0,0,1]);

			curr_chair_backrest_pos[0] += 1;
			chair_backrest_rotation += 18;

			// Check if the animation is running, if not start manual frame drawing
			if (!requestID){
				animate = 1;
			}
		}
		else{
			draw_parallelogram(final_chair_backrest_pos, [5,5,0.25]);
			animate = 0;
		}
	}


	// Floor
	// For Z-Fighting (legs clip through floor)
	gl.enable(gl.POLYGON_OFFSET_FILL);
	gl.polygonOffset(-1, -1);

	gl.activeTexture(gl.TEXTURE2);
	gl.bindTexture(gl.TEXTURE_2D, floor_texture); 
	gl.uniform1i(uSamplerPointer, 2);
	gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
	gl.vertexAttribPointer(textureCoordinatesAttributePointer, textureBuffer.itemSize, gl.FLOAT, false, 0, 0);
	
	draw_parallelogram([0,0,0], [47,47,0]);

	gl.disable(gl.POLYGON_OFFSET_FILL);


	// sky
	gl.activeTexture(gl.TEXTURE3);
	gl.bindTexture(gl.TEXTURE_2D, sky_texture); 
	gl.uniform1i(uSamplerPointer, 3);
	gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
	gl.vertexAttribPointer(textureCoordinatesAttributePointer, textureBuffer.itemSize, gl.FLOAT, false, 0, 0);
	
	draw_parallelogram([0,0,0], [1000,1000,1000]);

	// Used for animating the chair braking when the camera rotation is stopped
	if (animate){
		console.log("Camera stoped, animating broken chair");
		setTimeout(() => { drawScene() }, 1);
	}
}
	
// Function to cover every cube draw and rotation
function draw_parallelogram(posistion, scale, wheelRadiusFactor=0, rotation_pivot_point=[0,0,0], rotation_axis=[0,1,0])
{
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	gl.vertexAttribPointer(vertexPositionAttributePointer, vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indexBuffer);

	var rotation_matrix = fromAxisRotationAroundPoint(wheelRadiusFactor*Math.PI/180.0, rotation_pivot_point, rotation_axis);
	var final = glMatrix.mat4.create();

	glMatrix.mat4.multiply(final, final, rotation_matrix);
	glMatrix.mat4.translate(final,final,posistion);
	glMatrix.mat4.scale(final,final,scale);

	gl.uniformMatrix4fv(modelUniformPointer, false, new Float32Array(final));
	gl.drawElements(gl.TRIANGLES,indexBuffer.itemCount,gl.UNSIGNED_SHORT, 0);
}

// Rotation function around pivot point other than origin
function fromAxisRotationAroundPoint(rotation, pivot_point, axis)
{
	let rotationMatrix = new Float32Array(16);
	let backMatrix = new Float32Array(16);
	let moveMatrix = new Float32Array(16);
	let finalMatrix = new Float32Array(16);

	glMatrix.mat4.identity(finalMatrix);

	glMatrix.mat4.fromTranslation(backMatrix, pivot_point)
	glMatrix.mat4.fromRotation(rotationMatrix, rotation, axis);
	glMatrix.mat4.fromTranslation(moveMatrix, [-pivot_point[0], -pivot_point[1], -pivot_point[2]])

	// Move to origin, rotate and then move back to original pos
	glMatrix.mat4.multiply(finalMatrix, finalMatrix, backMatrix);
	glMatrix.mat4.multiply(finalMatrix, finalMatrix, rotationMatrix);
	glMatrix.mat4.multiply(finalMatrix, finalMatrix, moveMatrix);

	return finalMatrix;
}

function main() {
	minDimension = Math.min(window.innerHeight, window.innerWidth);
	canvas = document.getElementById("SceneCanvas");
	canvas.onmousedown = handleMouseDown;
	canvas.width = 0.98 * window.innerWidth;
	canvas.height = 0.80 * window.innerHeight;
	gl = WebGLDebugUtils.makeDebugContext(createGLContext(canvas));
	initShaders();
	initBuffers();

	gl.enable(gl.DEPTH_TEST);

	canvas.onmousedown = handleMouseDown;
	window.onmouseup = handleMouseUp;
	canvas.onmousemove = handleMouseMove;
	canvas.onwheel = handleMouseWheel;
	rect = canvas.getBoundingClientRect();

	startAnimation();
}

function handleMouseDown(event) {
	mouseDown = true;
	lastMouseX = event.clientX - rect.left;
	lastMouseY = rect.bottom - event.clientY;
	deltaMouseX = 0;
	deltaMouseY = 0;
	deltaFresh = true;
}

function handleMouseUp(event) {
	mouseDown = false;
}

function handleMouseMove(event)
{
	currMouseX = event.clientX - rect.left;
	currMouseY = rect.bottom - event.clientY;
	//document.getElementById("mouseX").innerHTML = currMouseX;
	//document.getElementById("mouseY").innerHTML = currMouseY;

	if (mouseDown)
	{
		deltaMouseX = currMouseX - lastMouseX;
		deltaMouseY = currMouseY - lastMouseY;
		deltaFresh = true;
	}

	if (!requestID && mouseDown)
		drawScene();
	lastMouseX = currMouseX;
	lastMouseY = currMouseY;
}

function handleMouseWheel(event)
{
	if (event.deltaY > 0){
		if (wheelRadiusFactor > 0)
			wheelRadiusFactor -= 10;
	}
	else{
		if (wheelRadiusFactor < 90)
			wheelRadiusFactor += 10;
	}

	if( prev_angle != 90 && wheelRadiusFactor == 90)
		easterEggCounter += 1;

	prev_angle = wheelRadiusFactor;

	document.getElementById("easteregg").innerHTML = easterEggCounter;
	document.getElementById("wrf").innerHTML = wheelRadiusFactor;

	if (!requestID)
		drawScene();
}

function startAnimation()
{
	if (!requestID)
		animationStep();
}

function animationStep()
{
	drawScene();
	requestID = window.requestAnimationFrame(animationStep);
}

function stopAnimation()
{
	window.cancelAnimationFrame(requestID);
	requestID = 0;
}
