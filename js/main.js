"use strict";

// Image source: https://commons.wikimedia.org/wiki/File:Normal_map_example_-_Map.png
var imgURL;

function main() {
  var m_image = new Image();

  imgURL = document.getElementById('normals').src
  // imgURL = 'images/normals.jpg'
  // imgURL = 'https://raw.githubusercontent.com/h44rd/Aquarium-Simulation-3D/master/textures/codfish.png'
  imgURL = 'https://upload.wikimedia.org/wikipedia/commons/3/3b/Normal_map_example_-_Map.png';
  // imgURL = 'https://upload.wikimedia.org/wikipedia/en/4/44/SpongeBob_SquarePants_characters_promo.png';

  document.getElementById("imageInformation").innerHTML = "Image Source: " + imgURL;

  requestCORSIfNotSameOrigin(m_image, imgURL)
  m_image.src = imgURL;

  m_image.onload = function() {
    render(m_image);
  };
}

var canvas, gl, program, image, resolutionLocation, mouseLocation, mousex, mousey;

function render(m_image) {
  // Get A WebGL context
  /** @type {HTMLCanvasElement} */
  image = m_image;
  canvas = document.getElementById("canvas");
  gl = canvas.getContext("webgl");
  if (!gl) {
    return;
  }
  console.log(image.width)

  // setup GLSL program
  program = webglUtils.createProgramFromScripts(gl, ["2d-vertex-shader", "2d-fragment-shader"]);

  // look up where the vertex data needs to go.
  var positionLocation = gl.getAttribLocation(program, "a_position");
  var texcoordLocation = gl.getAttribLocation(program, "a_texCoord");

  // Create a buffer to put three 2d clip space points in
  var positionBuffer = gl.createBuffer();

  // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  // Set a rectangle the same size as the image.

  webglUtils.resizeCanvasToDisplaySize(gl.canvas);

  var rectangleHeight = gl.canvas.height;
  var rectangleWidth = (image.width/image.height) * gl.canvas.height;
  var rectanglePosX = gl.canvas.width/2 - rectangleWidth/2;
  var rectanglePosY = 0;

  setRectangle(gl, rectanglePosX, rectanglePosY, rectangleWidth, rectangleHeight);

  // provide texture coordinates for the rectangle.
  var texcoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      0.0,  0.0,
      1.0,  0.0,
      0.0,  1.0,
      0.0,  1.0,
      1.0,  0.0,
      1.0,  1.0,
  ]), gl.STATIC_DRAW);

  // Create a texture.
  var texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Set the parameters so we can render any size image.
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

  // Upload the image into the texture.
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

  // lookup uniforms
  resolutionLocation = gl.getUniformLocation(program, "u_resolution");

  // lookup mouse 
  mouseLocation = gl.getUniformLocation(program, "u_mouse");

  // Tell WebGL how to convert from clip space to pixels
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  // Clear the canvas
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Tell it to use our program (pair of shaders)
  gl.useProgram(program);

  // Turn on the position attribute
  gl.enableVertexAttribArray(positionLocation);

  // Bind the position buffer.
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // Tell the position attribute how to get data out of positionBuffer (ARRAY_BUFFER)
  var size = 2;          // 2 components per iteration
  var type = gl.FLOAT;   // the data is 32bit floats
  var normalize = false; // don't normalize the data
  var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
  var offset = 0;        // start at the beginning of the buffer
  gl.vertexAttribPointer(
      positionLocation, size, type, normalize, stride, offset);

  // Turn on the teccord attribute
  gl.enableVertexAttribArray(texcoordLocation);

  // Bind the position buffer.
  gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);

  // Tell the position attribute how to get data out of positionBuffer (ARRAY_BUFFER)
  var size = 2;          // 2 components per iteration
  var type = gl.FLOAT;   // the data is 32bit floats
  var normalize = false; // don't normalize the data
  var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
  var offset = 0;        // start at the beginning of the buffer
  gl.vertexAttribPointer(texcoordLocation, size, type, normalize, stride, offset);

  animateScene();
}

function animateScene() {
  // set the resolution
  gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);

  gl.uniform2f(mouseLocation, mousex * 1.0 / gl.canvas.width, mousey * 1.0 / gl.canvas.height);

  // Draw the rectangle.
  var primitiveType = gl.TRIANGLES;
  var offset = 0;
  var count = 6;
  gl.drawArrays(primitiveType, offset, count);

  requestAnimationFrame(animateScene);
}

function setRectangle(gl, x, y, width, height) {
  var x1 = x;
  var x2 = x + width;
  var y1 = y;
  var y2 = y + height;
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
     x1, y1,
     x2, y1,
     x1, y2,
     x1, y2,
     x2, y1,
     x2, y2,
  ]), gl.STATIC_DRAW);
}

main();

function requestCORSIfNotSameOrigin(img, url) {
  if ((new URL(url)).origin !== window.location.origin) {
    img.crossOrigin = "";
  }
}

function updateMouse(e) {
  mousex = e.clientX;
  mousey = e.clientY;

  mousex = (mousex - gl.canvas.width/2);
  mousey = -1.0 * (mousey - gl.canvas.height/2);
  var coor = "Coordinates: (" + mousex + "," + mousey + ")";
  document.getElementById("demo").innerHTML = coor;
}

