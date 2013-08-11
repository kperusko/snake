/* jshint smarttabs: true */

/******************************************************************************
 * http://paulirish.com/2011/requestanimationframe-for-smart-animating/
 * http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating

 * requestAnimationFrame polyfill by Erik Möller
 * fixes from Paul Irish and Tino Zijdel
 *****************************************************************************/
(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
	window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
	window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] ||
			window[vendors[x]+'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame)
	window.requestAnimationFrame = function(callback, element) {
	    var currTime = new Date().getTime();
	    var timeToCall = Math.max(0, 16 - (currTime - lastTime));
	    var id = window.setTimeout(function() { callback(currTime + timeToCall); },
	      timeToCall);
	    lastTime = currTime + timeToCall;
	    return id;
	};

    if (!window.cancelAnimationFrame)
	window.cancelAnimationFrame = function(id) {
	    clearTimeout(id);
	};
}());
/******************************************************************************/

function Playground(drawingSurface, gridSize){
	var that = this;

	this.width = drawingSurface.getWidth();
	this.height = drawingSurface.getHeight();
	this.gridSize = gridSize;
	this.emptySpace = [];
	this.food = [];
	this.drawingSurface = drawingSurface;

	var level = 0;
	var timeout = 500;

	this.isInPlayground = function(position){
		if ( position.x + that.gridSize > that.width ||
			 position.x + that.gridSize <= 0 ||
			 position.y + that.gridSize > that.height ||
			 position.y + that.gridSize <= 0 ){
			return false;
		}

		for ( var i = 0; i < that.snake.body.length; i++ ){
			if ( that.snake.body[i].x == position.x && that.snake.body[i].y == position.y ) return false;
		}
		return true;
	};

	this.increaseLevel = function(){
		adjustTimeout();

		level++;
		$('#level span').html(level);
	};

	this.getTimeout = function(){
		return timeout;
	};

	function createEmptySpaceForSnake(){
		for ( var x = 0; x < that.width; x+=that.gridSize){
			for ( var y = 0; y < that.height; y+=that.gridSize){
				that.emptySpace.push( new Coordinate(x, y).toString() );
			}
		}
	}

	// Max timeout for the game is 17 ms
	// which is pretty fast but still playable
	function adjustTimeout(){
		timeout = Math.floor(timeout - (timeout * 0.10));

		// max framerate 60fps which is about 16.66..7 ms
		if ( timeout < 17 ) return timeout;
	}

	this.addEventHandlers = function(){
		$(document).swipe({
			swipeLeft:function() {
				that.snake.addOrientation(that.snake.orientationEnum.LEFT); 
			},
			swipeRight:function(){
				that.snake.addOrientation(that.snake.orientationEnum.RIGHT);
			},
			swipeUp:function(){
				that.snake.addOrientation(that.snake.orientationEnum.UP);
			},
			swipeDown:function(){
				that.snake.addOrientation(that.snake.orientationEnum.DOWN);
			}
		});

		$(document).keydown(function(e){
			switch(e.keyCode){
			case 37:
				that.snake.addOrientation(that.snake.orientationEnum.LEFT);
				break;
			case 38:
				that.snake.addOrientation(that.snake.orientationEnum.UP);
				break;
			case 39:
				that.snake.addOrientation(that.snake.orientationEnum.RIGHT);
				break;
			case 40:
				that.snake.addOrientation(that.snake.orientationEnum.DOWN);
				break;
			}
		});
	}

	createEmptySpaceForSnake();

	this.increaseLevel();
}

Playground.prototype.throwTheSnakeIn = function(){
	var that = this;

	this.snake = new Snake(this.gridSize, this.drawingSurface);

	this.addEventHandlers();
};

Playground.prototype.occupyPosition = function(position){
	this.emptySpace.splice(this.emptySpace.indexOf(position.toString()), 1);
};

Playground.prototype.pushTheSnake = function(){
	var that = this;

	window.setTimeout(function(){
		var nextPosition = that.snake.getNextPosition();
		if ( that.food.length === 0 ) that.throwTheFoodIn();

		if ( that.isInPlayground(nextPosition) ){
			window.requestAnimationFrame(that.pushTheSnake.bind(that));

			that.occupyPosition(nextPosition);

			if ( that.food[0].equals(nextPosition) ){
				that.snake.eat(nextPosition);
				that.food.pop();

				that.increaseLevel();
			}else{
				that.emptySpace.push(that.snake.body[0].toString());
				that.snake.move(nextPosition);
			}
		}else{
			$('#game_over').show();
		}
	}, this.getTimeout());
};

Playground.prototype.throwTheFoodIn = function(){
	var randomEmptySpaceIndex =  Math.floor(Math.random() * this.emptySpace.length);
	var foodCoordinate = Coordinate.prototype.fromString(this.emptySpace[randomEmptySpaceIndex]);

	this.drawingSurface.drawRectangle(foodCoordinate.x, foodCoordinate.y, this.gridSize, this.gridSize);

	// Draw a food as in original snake.
	// The original food is square divided in 9 squares
	// with filled squares at (1,0), (0,1), (2,1) and (1,2) coordinates
	if ( this.gridSize % 3 === 0 ){
		var foodGridSize = this.gridSize / 3;

		this.drawingSurface.deleteRectangle(foodCoordinate.x, foodCoordinate.y, foodGridSize, foodGridSize);
		this.drawingSurface.deleteRectangle(foodCoordinate.x+(foodGridSize*2), foodCoordinate.y, foodGridSize, foodGridSize);
		this.drawingSurface.deleteRectangle(foodCoordinate.x+foodGridSize, foodCoordinate.y+foodGridSize, foodGridSize, foodGridSize);
		this.drawingSurface.deleteRectangle(foodCoordinate.x, foodCoordinate.y+(foodGridSize*2), foodGridSize, foodGridSize);
		this.drawingSurface.deleteRectangle(foodCoordinate.x+(foodGridSize*2), foodCoordinate.y+(foodGridSize*2), foodGridSize, foodGridSize);
	}

	this.food.push( foodCoordinate );
};

function Snake(width, drawingSurface){
	var that = this;

	this.snakeWidth = width; //width of the snake in px;

	this.body = [];
	this.currOrientation = this.orientationEnum.RIGHT;
	this.nextOrientationBuffer = [];

	var initialSnakeSize = 10;

	this.addSnakeToPosition = function(position){
		that.body.push(position);
		drawingSurface.drawRectangle(position.x, position.y, that.snakeWidth, that.snakeWidth);
	};

	this.move = function(position){
		var removePosition = that.body.shift();
		drawingSurface.deleteRectangle(removePosition.x, removePosition.y, that.snakeWidth, that.snakeWidth);

		that.addSnakeToPosition(position);
	};

	this.eat = function(position){
		that.addSnakeToPosition(position);
	};

	this.getNextOrientation = function(){
		var nextOrientation = null;

		while(that.nextOrientationBuffer.length !== 0){
			var nextBuffer = that.nextOrientationBuffer.shift();

			if(
				(this.currOrientation == this.orientationEnum.LEFT &&
				 nextBuffer != this.orientationEnum.RIGHT) ||

				(this.currOrientation == this.orientationEnum.RIGHT &&
				 nextBuffer != this.orientationEnum.LEFT) ||

				(this.currOrientation == this.orientationEnum.UP &&
				 nextBuffer != this.orientationEnum.DOWN) ||

				(this.currOrientation == this.orientationEnum.DOWN &&
				 nextBuffer != this.orientationEnum.UP)
			){
				nextOrientation = nextBuffer;
				break;
			}
		}

		if ( nextOrientation === null ) nextOrientation = that.currOrientation;

		return nextOrientation;
	};

	this.getNextPosition = function(){
		var lastPosition = that.body[that.body.length-1];
		var x = lastPosition.x;
		var y = lastPosition.y;

		var nextOrientation = that.getNextOrientation();

		if ( nextOrientation == that.orientationEnum.LEFT )
			x -= that.snakeWidth;

		if ( nextOrientation == that.orientationEnum.RIGHT )
			x += that.snakeWidth;

		if ( nextOrientation == that.orientationEnum.UP )
			y -= that.snakeWidth;

		if ( nextOrientation == that.orientationEnum.DOWN )
			y += that.snakeWidth;

		that.currOrientation = nextOrientation;

		return new Coordinate(x,y);
	};

    function createInitialSnake(){
		for (var i=0; i < initialSnakeSize * that.snakeWidth; i += that.snakeWidth){
			that.addSnakeToPosition(new Coordinate(i,0));
		}
	}

	createInitialSnake();
}

Snake.prototype.orientationEnum = {
	LEFT : "left",
	RIGHT: "right",
	UP   : "up",
	DOWN : "down"
};

Snake.prototype.addOrientation = function(orientation){
	this.nextOrientationBuffer.push(orientation);
};

function Coordinate(x,y){
	this.x = x;
	this.y = y;
}

Coordinate.prototype.toString = function(){
	return this.x.toString() + "#" + this.y.toString();
};

Coordinate.prototype.fromString = function(hash){
	var split = hash.split("#");

	if (split.length === 0) return null;

	var x = parseInt(split[0], 10);
	var y = parseInt(split[1], 10);

	return new Coordinate(x,y);
};

Coordinate.prototype.equals = function(compareTo){
	if ( compareTo === null  || ! compareTo instanceof Coordinate ) return false;

	if ( this.x !== compareTo.x || this.y !== compareTo.y ) return false;

	return true;
};

// Class for abstracting the drawing on canvas
// so we can easily substitute the canvas with something else
// to have some code portability
function DrawingSurface(canv){
	var that = this;

	this.canvas = canv;
	this.ctx = this.canvas.getContext("2d");
	this.ctx.fillStyle = "rgb(12,46,6)";
	this.gridSize = null;

	// stretch the width of the 
	function resizeCanvas(){
		var container = $('#game'),
		maxWidth = container.width();

		var width = maxWidth;
		// 1.75 is the aprox. ratio that we want to keep between height and width
		var height = (maxWidth / 1.75);
		
		// The grid size is fixed at 21 x grid heigth
		// so that the proportions of the snake width and canvas height
		// are always the same. 
		// The grid size must be divisible by 3 because the food is drawn
		// as 3x3 square
		that.gridSize = Math.floor(height/21) - Math.floor(height/21) % 3;

		// Recalculate the final height and width.
		// This will prevent the problem when the snake hits invisible wall
		// i.e. when the next step is outside the canvas but the snake 
		// is not drawed to the border of the canvas.
		width = Math.floor(width / that.gridSize) * that.gridSize;
		height = Math.floor(height / that.gridSize ) * that.gridSize;
		
		$(that.canvas).attr('width', width);
		$(that.canvas).attr('height', height);

		// adjust the padding of the parent element so that the canvas is always in center
		if ( maxWidth > width )	$(that.canvas).parent().css('padding-left', Math.floor((maxWidth - width)/2));
	}

	resizeCanvas();
}

DrawingSurface.prototype.canDrawOnSurface = function(){
	if ( this.canvas.getContext ) return true;
	return false;
};

DrawingSurface.prototype.getWidth = function(){
	return parseInt(this.canvas.getAttribute("width"), 10);
};

DrawingSurface.prototype.getHeight = function(){
	return parseInt(this.canvas.getAttribute("height"), 10);
};

DrawingSurface.prototype.drawRectangle = function(x,y,width,height){
	this.ctx.fillRect(x,y,width,height);
};

DrawingSurface.prototype.deleteRectangle = function(x,y,width,height){
	this.ctx.clearRect(x,y,width,height);
};

DrawingSurface.prototype.getGridSize = function(){
	return this.gridSize;
};

$(document).ready(function(){
	var canvas = $('#playground');
	var drawSurface = new DrawingSurface(canvas[0]);

	if ( drawSurface.canDrawOnSurface() ){
		var playground = new Playground(drawSurface, drawSurface.getGridSize());
		playground.throwTheSnakeIn();
		playground.pushTheSnake();
	}
});
