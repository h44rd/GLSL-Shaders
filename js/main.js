"use strict";

// Image source: https://commons.wikimedia.org/wiki/File:Normal_map_example_-_Map.png
var imgURL;

var canvas, gl, program, image, resolutionLocation, mouseLocation, mousex, mousey;

var num_images;

function urlInputByUser() {
  var bright_url = document.getElementById("bright_url").value;
  var dark_url = document.getElementById("dark_url").value;
  var normal_map_url = document.getElementById("normal_map_url").value;

  // document.getElementById("imageInformation").innerHTML = bright_url + dark_url + normal_map_url;

  console.log("Urls : " + bright_url + dark_url + normal_map_url);
}

function main() {

  var images = {'bright' : {url : 'https://raw.githubusercontent.com/h44rd/NormalMaps/master/Homer/DI1.png', Image : null},
                    'dark' : {url : 'https://raw.githubusercontent.com/h44rd/NormalMaps/master/Homer/DI0.png', Image : null},
                    'normal_map' : {url : 'https://raw.githubusercontent.com/h44rd/NormalMaps/master/Homer/SM.png', Image : null}
                  };

  

  loadImages(images, render);
}

function loadImage(url, callback) {
  var image = new Image();
  requestCORSIfNotSameOrigin(image, url)
  image.src = url;
  image.onload = callback;
  return image;
}

function loadImages(m_images, callback) {
  // var images = [];
  var imagesToLoad = Object.keys(m_images).length;
 
  // Called each time an image finished loading.
  var onImageLoad = function() {
    --imagesToLoad;
    // If all the images are loaded call the callback.
    if (imagesToLoad == 0) {
      callback(m_images);
    }
  };
 
  for (var image_i in m_images) {
    var image = loadImage(m_images[image_i].url, onImageLoad);
    m_images[image_i].Image = image;
  }
}



function render(images) {
  // Get A WebGL context
  /** @type {HTMLCanvasElement} */

  canvas = document.getElementById("canvas");
  gl = canvas.getContext("webgl");
  if (!gl) {
    return;
  }

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

  var image = images['bright'].Image;

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


  // ------------------------------------------------------------------------------------- //

  var texturesNum = Object.keys(images).length;
  for (var key in images) {
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Set the parameters so we can render any size image.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    // Upload the image into the texture.
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, images[key].Image);

    // add the texture to the array of textures.
    images[key].Texture = texture;
  }


  for(var key in images) {
    images[key].UniformLoc = gl.getUniformLocation(program, "u_" + key);
  }

  // ------------------------------------------------------------------------------------- //

  // // Create a texture.
  // var texture = gl.createTexture();
  // gl.bindTexture(gl.TEXTURE_2D, texture);

  // // Set the parameters so we can render any size image.
  // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

  // // Upload the image into the texture.
  // gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

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

  // --------------------------------------------------------------------------------- //
  var i = 0;
  for(var key in images) {
    gl.uniform1i(images[key].UniformLoc, i);
    i++;
  }

  i = 0;
  for(var key in images) {
    gl.activeTexture(gl.TEXTURE0 + i);
    gl.bindTexture(gl.TEXTURE_2D, images[key].Texture);
    i++;  
  }
  //----------------------------------------------------------------------------------- //

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

