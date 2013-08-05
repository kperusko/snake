/* jshint smarttabs: true */

function Playground(canvas){
	var that = this;

	this.width = parseInt(canvas.getAttribute("width"), 10);
	this.height = parseInt(canvas.getAttribute("height"), 10);
	this.gridSize = 10;
	this.initialSnakeSize = 10;
	this.level = 1;
	this.emptySpace = [];
	this.food = [];

	this.ctx = canvas.getContext("2d");

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

	function createEmptySpaceForSnake(){
		for ( var x = 0; x < that.width; x+=that.gridSize){
			for ( var y = 0; y < that.height; y+=that.gridSize){
				that.emptySpace.push( new Coordinate(x, y).toString() );
			}
		}
	}

	createEmptySpaceForSnake();
}

Playground.prototype.throwTheSnakeIn = function(){
	var that = this;

	this.snake = new Snake(this.initialSnakeSize, this.gridSize, this.ctx);

	$(document).keypress(function(e){
		switch(e.keyCode){
			case 37:
			that.snake.setOrientation(that.snake.orientationEnum.LEFT);
			break;
			case 38:
			that.snake.setOrientation(that.snake.orientationEnum.UP);
			break;
			case 39:
			that.snake.setOrientation(that.snake.orientationEnum.RIGHT);
			break;
			case 40:
			that.snake.setOrientation(that.snake.orientationEnum.DOWN);
			break;
		}
	});
};

Playground.prototype.occupyPosition = function(position){
	delete(this.emptySpace[position.toString()]);
};

Playground.prototype.throwTheFoodIn = function(){
	var randomEmptySpaceIndex =  Math.floor(Math.random() * this.emptySpace.length);
	var foodCoordinate = Coordinate.prototype.fromString(this.emptySpace[randomEmptySpaceIndex]);

	this.ctx.fillRect(foodCoordinate.x, foodCoordinate.y, this.gridSize, this.gridSize);

	this.food.push( foodCoordinate );
};

function Snake(initialSnakeSize, width, ctx){
	var that = this;

	this.snakeWidth = width; //width of the snake in px;
	this.initialSnakeSize = initialSnakeSize;

	this.body = [];
	this.orientation = this.orientationEnum.RIGHT;

	this.ctx = ctx;

	this.addSnakeToPosition = function(position){
		that.body.push(position);
		that.ctx.fillRect(position.x, position.y, that.snakeWidth, that.snakeWidth);
	};

    function createInitialSnake(){
		for (var i=0; i < that.initialSnakeSize * that.snakeWidth; i += that.snakeWidth){
			that.addSnakeToPosition(new Coordinate(i,0));
		}
	}

	this.move = function(position){
		var removePosition = that.body.shift();
		that.ctx.clearRect(removePosition.x, removePosition.y, that.snakeWidth, that.snakeWidth);

		that.addSnakeToPosition(position);
	};

	this.eat = function(position){
		that.addSnakeToPosition(position);
	};

	this.getNextPosition = function(){
		var lastPosition = that.body[that.body.length-1];
		var x = lastPosition.x;
		var y = lastPosition.y;

		if ( that.orientation == that.orientationEnum.LEFT )
			x -= that.snakeWidth;

		if ( that.orientation == that.orientationEnum.RIGHT )
			x += that.snakeWidth;

		if ( that.orientation == that.orientationEnum.UP )
			y -= that.snakeWidth;

		if ( that.orientation == that.orientationEnum.DOWN )
			y += that.snakeWidth;

		return new Coordinate(x,y);
	};

	createInitialSnake();
}

Snake.prototype.orientationEnum = {
	LEFT : "left",
	RIGHT: "right",
	UP   : "up",
	DOWN : "down"
};

Snake.prototype.setOrientation = function(orientation){
	if( this.orientation == this.orientationEnum.LEFT &&
		orientation != this.orientationEnum.RIGHT) this.orientation = orientation;

	if( this.orientation == this.orientationEnum.RIGHT &&
		orientation != this.orientationEnum.LEFT) this.orientation = orientation;

	if( this.orientation == this.orientationEnum.UP &&
		orientation != this.orientationEnum.DOWN) this.orientation = orientation;

	if( this.orientation == this.orientationEnum.DOWN &&
		orientation != this.orientationEnum.UP) this.orientation = orientation;
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

var canvas = document.getElementById('playground');
if ( canvas.getContext ){
	var playground = new Playground(canvas);
	playground.throwTheSnakeIn();
	playground.pushTheSnake();
}
