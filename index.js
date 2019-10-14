// IMPORT LIBRARIES
var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var fs = require('fs');

// PROTOTYPES

Array.prototype.last=function(){
	return this[this.length-1];
	//
}

// READ / WRITE FUNCTIONS

function save(n,t){
	fs.writeFile(n,t,e=>{
		console.log(e);
	});
}
function read(n,c){
	fs.readFile(n,(e,b)=>{
		if(e) console.log(e);
		else c(b.toString());
	});
}

// CONNECTION VARIABLES
const port = 80;
const path = __dirname+'/';


// HANDLE GET REQUESTS FROM WEBPAGES
function serveFiles(){
	app.get('/',(req,res)=>{res.sendFile(path+'index.html')});
	read('files.txt',d=>{
		var e = d.split(',').map(e=>e.trim());
		for(let l of e){
			app.get('/'+l.split('/').last(),(req,res)=>{res.sendFile(path+l)});
		}
	});
}

serveFiles();

// SERVE PORT
http.listen(port,()=>{console.log(`=== Serving Port: ${port} ===\n`)});

// HANDLE CONNECTION TO WEBPAGES
io.on('connection',function(socket){
	var localid,localname;
	socket.emit('getUsername');
	socket.on('user',function(name){
		console.log(`"${name}" Connected`);
		var p = new Player(name);
		socket.emit('id',p.id);
		localid=p.id;
		localname=name;
		io.emit('newplayer',p.id);
		for(let u of users){
			socket.emit('newplayer',u.id);
		}
		users.push(p);
	});
	socket.on('inputs',(i)=>{inputs.push(i)});
	socket.on('disconnect',()=>{
		var usr = users.filter(e=>e.id==localid)[0];
		console.log(localname+' Disconnected');
		users.splice(users.indexOf(usr),1);
		io.emit('discon',localid);
	});
});

// GAME VARIABLES
const CPS = 6, seed = 25;
var users=[],world=[],inputs=[],blocks=[],uniq=0;
var width=80,height=80;
var ground_types=['w','g','g','s','t','d','au','n'];

// GAME CLASSES
class Player{
	constructor(name){
		this.id=uniq++;
		this.name=name;
		this.x=rand(1,width-1);
		this.y=rand(1,height-1);
		this.population=[];
		this.inventory=[];
	}
}

class Block{
	constructor(t,x,y,s=true,w=1,h=1){
		this.type=t;
		this.x=x;
		this.y=y;
		this.solid=s;
		this.width=w;
		this.height=h;
		blocks.push(this);
	}
}

class aPeople{
	constructor(player,a=20,e=0){
		this.health = 20;
		this.job;
		this.age = a;
		this.expirience = e;
		this.owner = player;
		this.type='none';
		player.population.push(this);
	}
}

// GAME FUNCTIONS 
function pos(x,y){
	return y*width-width+x-1;
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
	var result;
	function addType(t,c){
		for(let i=0;i<c;i++) result.unshift(t);
		//
	}
	function removeType(t){
		let l = result.length;
		while(l--){
			if(result[l]==t) result.splice(l,1);
		}
	}
	function choose(x,y){
		result=[...ground_types];
		addType('g',4);
		for(let j=-1;j<=1;j++){
			for(let i=-1;i<=1;i++){
				var t=typeAt(x+i,y+j);
				if(inBounds(x+i,y+j) && t!= 'n'){
					if(i==0||j==0){
						addType(t,2);
						if(t=='w') addType(t,40);
						if(t=='g') addType(t,30);
						if(t=='d') addType(t,25);
						if(t=='s') addType(t,40);
						if(t=='s') addType('au',3);
						if(t=='t') addType(t,20);
						if(t=='w') removeType('au');
						if(t=='g') removeType('au');
						if(t=='t') removeType('au');
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
	io.emit('render',width,height,world,users,blocks);
	handleInputs();
	io.emit('getInputs');
}
function handleInputs(){
	var a=0,l=users.length;
	for(let i of inputs){
		let u = users.filter(p=>p.id==i.id);
		let usr = u ? u[0] : false;
		if(usr){
			var input = i.ins;
			let tx=usr.x;
			let ty=usr.y;
			if (input.ArrowUp) ty--;
			if (input.ArrowDown) ty++;
			if (input.ArrowLeft) tx--;
			if (input.ArrowRight) tx++;
			let ttype = typeAt(tx,ty+1);
			let item = itemAt(tx,ty);
			usr.x = tx;
			usr.y = ty;
			usr.x = Math.min(Math.max(usr.x,1),width);
			usr.y = Math.min(Math.max(usr.y,1),height-1);
		}
	}
	inputs=[];
}
function itemAt(x,y){
	let temparr=blocks.filter(b=>b.x==x&&b.y==y);
	if(temparr.length>0) return temparr[0];
}

// Values for Random Generator
var a=16807,xn=seed,c=5,m=2147483647;

function random(min,max){
	let psudo = (a*xn+c)%m;
	let rn = xn/m;
	xn = psudo;
	return min-1+Math.ceil(rn*(1+max-min));
}

function rand(min,max){
	return min+Math.floor(Math.random()*(max-min+1));
	//
}

// START GAME
console.log(`Generating World with Seed: ${seed}\n...`);
generateWorld(width,height);
console.log('Complete!')
setInterval(loop,1000/CPS);
console.log(`Starting Game Clock at ${CPS} calculations per second.\n`);


console.log('Messages:\n');
new Block('house',7,1,true,1,1);
console.log('BLOCKS:')
console.log(blocks);

console.log('\n');