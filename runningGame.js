// animation that updates the display of the game
(function() {
  var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
  window.requestAnimationFrame = requestAnimationFrame;
})();

var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

// dimensions
var width = 1920;
var height = 967;
const PLAYER_HEIGHT = 270;
const PLAYER_WIDTH = 200;
var keys = []; //An array to keep track of keys pressed
const gravity = 1; //Simulates speed of gravity for jumping
var boxes = []; //An array of boxes on the screen
var player = { //Player object
  x: width / 3,
  y: height - 40,
  width: PLAYER_WIDTH,
  height: PLAYER_HEIGHT,
  speed: 12,
  velY: 0,
  jumping: false,
  grounded: false
};

canvas.width = width;
canvas.height = height;
var maxHealth;
var curHealth;
var travelled = 0;

// player images
var playerimg = document.getElementById('character');
var jumpimg = document.getElementById('jump');
var crouchimg = document.getElementById('crouch');

canvas.style.display = "block"; //Displays the game

runGame(); //Starts the level

//A helper function to help generate random numbers within a certain range
function randomNumber(min, max) {
  let range = max - min + 1;
  return Math.floor(Math.random() * range) + min;
}

// function called when user reaches 0 health
function endGame() {
  // redirects user to "game over" screen
  window.open("success.html", "_self");
}

// function that initializes some settings and graphics for the game
function setUp() {

  // sets random amount of water from 2-3L
  maxHealth = randomNumber(15000, 30000);
  curHealth = [maxHealth];
  // displays other info
  var t = "Today's temperature: " + randomNumber(20, 35) + " degrees";
  var d = "Distance to home: " + travelled + " m";
  var w = "Water left: " + curHealth + "/" + maxHealth + " mL";
  $('.temperature').text(t);
  $('.distance').text(d);
  $('.water').text(w);

  // sets background to match time of day
  var d = new Date();
  // gets hours since midnight
  var n = d.getHours();
  var color1;
  var color2;
  // sky changes colour depending on time of day
  if (n < 6 || n > 21) {
    //night sky
    color1 = "#09203f";
    color2 = "#537895";
  } else if (n < 18) {
    // daytime sky
    color1 = "#93a5cf";
    color2 = "#e4efe9";
  } else {
    // sunset sky
    color1 = "#f0B7A4"
    color2 = "#fFE469";
  }
  $('body').css('background-image', 'linear-gradient(to bottom, ' + color1 + ', ' + color2 + ')');

}

// runs the game
function runGame() {

  setUp();

  //Resets the boxes on the screen so that only the floor is left
  boxes = [{
    x: 0,
    y: height,
    width: width,
    height: height - 5,
    name: "floor"
  }];

  //Resets properties of the player
  player = {
    x: width / 3, //Position of the player
    y: height - 40,
    width: PLAYER_WIDTH, //Size of the player
    height: PLAYER_HEIGHT,
    speed: 12, //Speed for jumping
    velY: 0,
    jumping: false,
    grounded: true
  };

  var NUM_OBSTACLES = randomNumber(20, 30); //Number of obstacles before reaching home

  // sets game background
  canvas.style['background-image'] = 'url(Images/background.png)';

  //Creates the first obstacle
  boxes.push({
    x: width + 200, //First obstacle is off to the right of the screen
    y: height - 100,
    width: 100,
    height: 100,
    name: "obstacle1"
  });

  //Creates the rest of the obstacles in the level
  for (i = 2; i < NUM_OBSTACLES; i++) {
    obs = randomNumber(1, 3);

    if (obs == 1) {
      boxes.push({
        x: boxes[i - 1].x + randomNumber(800, 1000), //Obstacles are randomly positioned (within a certain range) after the last obstacles
        y: height - 100,
        width: 100,
        height: 100,
        name: "obstacle" + obs
      });
    } else if (obs == 2) {
      boxes.push({
        x: boxes[i - 1].x + randomNumber(800, 1000),
        y: height - 450,
        width: 300,
        height: 200,
        name: "obstacle" + obs
      });
    } else {
      boxes.push({
        x: boxes[i - 1].x + randomNumber(800, 1000),
        y: height - 400,
        width: 200,
        height: 150,
        name: "obstacle" + obs
      });
    }
  }

  // house at the end of the level
  boxes.push({
    x: boxes[NUM_OBSTACLES - 1].x + randomNumber(800, 1000),
    y: height - 300,
    width: 300,
    height: 300,
    name: "house"
  })

  update();
}

// fucntion that constantly updates the state of the game
function update() {

  var actionimg = playerimg;

  ctx.clearRect(0, 0, width, height); //Gets rid of existing frame

  //Resets the dimensions of the player
  player.height = PLAYER_HEIGHT;
  player.width = PLAYER_WIDTH

  if (keys[38] || keys[32] || keys[87]) { //Up arrow key, W key and space bar to jump
    if (!player.jumping && player.grounded) {
      player.jumping = true;
      player.grounded = false;
      player.velY = -player.speed * 2; //Simulates player jumping
    }
  }

  player.velY += gravity; //Simulates gravity pulling player down

  if ((keys[40] || keys[83]) && player.grounded) { //Down arrow key and S key to duck when the player is on the ground
    player.height = 200; //Player height is reduced
    player.width = 120
    player.y = height - 35; //Player position moves down
    actionimg = crouchimg; // changes image if crouching
  }

  if (player.grounded) { //Player stops going down once they hit the ground
    player.velY = 0;
  }
  if (player.jumping) {
    actionimg = jumpimg;
    player.height = 210;
    player.width = 150;
  }

  player.y += player.velY; //Player vertical position changes depending on velocity

  for (var i = 0; i < boxes.length; i++) {
    var dir = colCheck(player, boxes[i]); //Checks collisions with player and every obstacle in the game

    // if the player reaches the end of the game
    if ((dir) && (boxes[i].name == "house")) {
      endGame();
      return //Exits the function
    }

    //If the player collides with any obstacles
    if (dir === "left" || dir === "right" || dir === "top") {
      applyChange(curHealth);
      boxes[i] = 0;
    } else if (dir === "bottom") {
      if (boxes[i].name != "floor") {
        applyChange(curHealth);
        boxes[i] = 0;
      } else {
        player.grounded = true;
        player.jumping = false;
      }
    }

    travelled++;
    if (travelled % 300 == 0) {
      var d = "Distance travelled: " + travelled / 3;
      $('.distance').text(d);
    }

    //The following code draws out the game
    if (boxes[i].name == "floor") {
      ctx.fillStyle = "white";
      ctx.fillRect(boxes[i].x, boxes[i].y, boxes[i].width, boxes[i].height);
    } else if (boxes[i].name == "house") {
      boxes[i].x -= 15;
      var houseimg = document.getElementById('house');
      ctx.drawImage(houseimg, boxes[i].x, boxes[i].y, boxes[i].width, boxes[i].height);
    } else {
      boxes[i].x -= 15; //This moves all the obstacles to the left

      if (boxes[i].name == "obstacle1") {
        var tumbleweed = document.getElementById('tumbleweed');
        ctx.drawImage(tumbleweed, boxes[i].x, boxes[i].y, boxes[i].width, boxes[i].height);
      } else if (boxes[i].name == "obstacle2") {
        var bird = document.getElementById('bird');
        ctx.drawImage(bird, boxes[i].x, boxes[i].y, boxes[i].width, boxes[i].height);
      } else if (boxes[i].name == "obstacle3") {
        var bird2 = document.getElementById('bird2');
        ctx.drawImage(bird2, boxes[i].x, boxes[i].y, boxes[i].width, boxes[i].height);
      }
    }
  }

  ctx.drawImage(actionimg, player.x, player.y, player.width, player.height); //Draws the player
  ctx.beginPath(); //Current state of the game
  requestAnimationFrame(update); //Animates the game
}

//This checks whether two shapes are colliding and from which direction
function colCheck(shapeA, shapeB) {

  var cX = (shapeA.x + (shapeA.width / 2)) - (shapeB.x + (shapeB.width / 2)), //Finds the difference in x coordinates of the two objects' centers
    cY = (shapeA.y + (shapeA.height / 2)) - (shapeB.y + (shapeB.height / 2)), //Finds the difference in y coordinates of the two objects' centers
    hWidths = (shapeA.width / 2) + (shapeB.width / 2), //The half-widths of the two shapes added together
    hHeights = (shapeA.height / 2) + (shapeB.height / 2), //The half-heights of the two shapes added together
    colDir = null;

  //If the distance between centers is less than the half-height and half-width sum, then the shapes are colliding
  if (Math.abs(cX) < hWidths && Math.abs(cY) < hHeights) {
    // Figures out on which side the boxes are colliding (top, bottom, left, or right)
    var oX = hWidths - Math.abs(cX), //The overlap
      oY = hHeights - Math.abs(cY);
    if (oX >= oY) { //If the y coordinates overlap
      if (cY > 0) {
        colDir = "top";
        shapeA.y += oY;
      } else {
        colDir = "bottom";
        shapeA.y -= oY;
      }
    } else { //If the x coordinates overlap
      if (cX > 0) {
        colDir = "left";
        shapeA.x += oX;
      } else {
        colDir = "right";
        shapeA.x -= oX;
      }
    }
  }
  return colDir; //Returns direction of collision or null if there isn't one
}
//Health Bar
$ = jQuery;

$(".health-bar-text").html("100%");
$(".health-bar").css({
  "width": "100%"
});

function applyChange(curHealth) {
  var audio = new Audio("Sound/ow.mp3");
  audio.play();
  var damage = randomNumber(4000, 8000);
  curHealth[0] = curHealth[0] - damage;
  if (curHealth[0] <= 0) {
    curHealth[0] = 0;
    gameOver();
  }

  var a = curHealth * (100 / maxHealth);
  if (a < 50) {
    $(".health-bar-text").css("color", "#043C5B");
  }

  $(".health-bar-text").html(Math.round(a) + "%");
  $(".health-bar-red").animate({
    'width': a + "%"
  }, 700);
  $(".health-bar").animate({
    'width': a + "%"
  }, 500);
  $(".health-bar-blue").animate({
    'width': a + "%"
  }, 300);
  var w = "Water left: " + curHealth + "/" + maxHealth + " mL";
  $('.water').html(w);
}

//When the player collides with an obstacle
function gameOver() {
  ctx.clearRect(0, 0, width, height);
  keys[38] = false; //Resets all the keys being pressed down to false
  keys[32] = false;
  keys[87] = false;
  keys[40] = false;
  keys[83] = false;
  window.open("gameover.html", "_self");
}

//This checks whether a key is being held down
document.body.addEventListener("keydown", function(e) {
  keys[e.keyCode] = true;
});
document.body.addEventListener("keyup", function(e) {
  keys[e.keyCode] = false;
});
