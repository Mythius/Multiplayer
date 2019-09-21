// IMPORT LIBRARIES
var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);


// CONNECTION VARIABLES
const port = 80;
const path = 'C:/Users/south/Desktop/multiplayer/';


// HANDLE GET REQUESTS FROM WEBPAGES
app.get('/',(req,res)=>{res.sendFile(path+'index.html')});
app.get('/helpers.js',(req,res)=>{res.sendFile(path+'helpers.js')});
app.get('/grid.js',(req,res)=>{res.sendFile(path+'grid.js')});
app.get('/style.css',(req,res)=>{res.sendFile(path+'style.css')});
app.get('/player1.png',(req,res)=>{res.sendFile(path+'player1.png')});
app.get('/player2.png',(req,res)=>{res.sendFile(path+'player2.png')});

// SERVE PORT
http.listen(port,()=>{console.log('Serving Port: '+port)});

// HANDLE CONNECTION TO WEBPAGES
io.on('connection',function(socket){
	io.emit('getUsername');
	socket.on('user',function(name){
		console.log('Player connected with Username: '+name);
		var p = new Player(name);
		users.push(p);
		io.emit('id',p.id);
	});
	socket.on('inputs',(i)=>{inputs.push(i)});
	socket.on('disconnect',()=>{
		console.log('User Disconnected');
	});
});

// GAME VARIABLES
const CPS = 1, seed = 500;
var users=[],world=[],inputs=[],uniq=0;
var width=100,height=100;
// Water , Grass , Stone , Tree , Null , Ice , Gold
var ground_types=['w','g','g','g','s','t','i','au','n'];

// GAME CLASSES
class Player{
	constructor(name){
		this.id=uniq++;
		this.name=name;
		this.x=5;
		this.y=5;
	}
}
function Tile(x,y){
	this.x=x;
	this.y=y;
	this.value=char;
}

// GAME FUNCTIONS 
function pos(x,y){
	return y*width-width-1+x;
	//
}

function typeAt(x,y){
	if(inBounds(x,y)) return world[pos(x,y)];
	else return 'n';
}

function inBounds(x,y){
	return x>0 && x<=width && y>0 && y<=height;
	//
}

function generateWorld(w,h){
	function choose(x,y){
		var result=[...ground_types];
		for(let j=-1;j<=1;j++){
			for(let i=-1;i<=1;i++){
				var t=typeAt(x+i,y+j);
				if(inBounds(x+i,y+j) && t!= 'n'){
					if(i==0||j==0){
						result.unshift(t);
						result.unshift(t);
						result.unshift(t);
					} else {
						result.unshift(t);
					}
				}
			}
		}
		return result[random(0,result.length-2)];
	}
	var x,y;
	world='n'.repeat(w*h).split('');
	for(y=1;y<=h;y++){
		for(x=1;x<=w;x++){
			world[pos(x,y)]=choose(x,y);
		}
	}
}

function loop(){
	io.emit('render',width,height,world,users);
	handleInputs();
	io.emit('getInputs');
}

function handleInputs(){
	var a=0;
	for(let i of inputs){
		let u = users.filter(p=>p.id==i.id);
		let usr = u ? u[0] : false;
		if(usr){
			console.log(i.id);
			var input = i.ins;
			if(input.ArrowUp) usr.y--;
			if(input.ArrowDown) usr.y++;
			if(input.ArrowLeft) usr.x--;
			if(input.ArrowRight) usr.x++;
			usr.x = Math.min(Math.max(usr.x,1),width);
			usr.y = Math.min(Math.max(usr.y,1),height);
		}
	}
	inputs=[];
}

// Values for Random Generator
var a=16807,xn=seed,c=5,m=2147483647;

function random(min,max){
	let psudo = (a*xn+c)%m;
	let rn = xn/m;
	xn = psudo;
	return min-1+Math.ceil(rn*(1+max-min));
}

// START GAME
generateWorld(width,height);
//console.log(world);
setInterval(loop,1000/CPS);