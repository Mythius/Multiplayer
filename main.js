var socket = io();
var id,connected=false,once=true;
var colors=[{ch:'w',c:'blue'},{ch:'g',c:'#080'},{ch:'s',c:'gray'},{ch:'t',c:'darkgreen'},{ch:'n',c:'black'},{ch:'d',c:'#654321'},{ch:'au',c:'gold'}];
var ins={ArrowUp:false,ArrowDown:false,ArrowLeft:false,ArrowRight:false,space:false};
const vw = 15,vh = 15;
var td = window.innerHeight/vh;
var plrs=[],blks=[];

var board = new Grid(obj('div'),vw,vh,td);
board.setColorAll('#444');
var ox = 8,oy = 8;
var width,height;
var SELECTED;

socket.on('getUsername',()=>{socket.emit('user',prompt('Enter a Username'))});
socket.on('id',p=>{
	id=p;
	connected=true;
	addEvents();
});
socket.on('render',function(w,h,world,players,blocks){
	if(connected){
		obj('blocks').innerHTML='';
		obj('people').innerHTML='';
		blks=[];
		width=w;
		height=h;
		var me = players.filter(p=>p.id==id)[0];
		var ox = me.x-7,oy=me.y-7;
		for(let i=1;i<=vh;i++){
			for(let j=1;j<=vw;j++){
				var s = colors.filter(c=>c.ch==world[pos(ox+j,oy+i)]);
				var c = s[0] ? s[0].c : 'black';
				if(inBounds(ox+j,oy+i))board.setColor(j,i,c);
				else board.setColor(j,i,'black');
			}
		}
		if(once) once=false;
		board.setImageAll('');
		board.forEach(function(x,y){
			let c = board.getColor(x,y);
			if(c=='gold') board.setImage(x,y,'gold.png');
			if(c=='darkgreen') board.setImage(x,y,'tree.png');
			if(c=='gray') board.setImage(x,y,'stone.png');
			if(c=='blue') board.setImage(x,y,'water.png');
			if(c=='rgb(0, 136, 0)') board.setImage(x,y,'grass.png');
			if(c=='rgb(101, 67, 33)') board.setImage(x,y,'dirt.png');
			if(c=='darkgreen'){
				board.setImage(x,y,'grass.png');
				blocks.push({type:'tree',x:ox+x-1,y:oy+y-1,solid:true});
			} 
		});
		for(let p of players){
			let tempp = plrs.filter(t=>t.id==p.id);
			tempp[0].setPos(p.x,p.y);
			tempp[0].display(me.x,me.y);
			for(let pp of p.population){
				let p = new Person(pp.type,pp.x,pp.y);
				p.display(me.x,me.y);
			}
		}
		for(let b of blocks){
			var temp=new Block(b.type,b.x,b.y,b.width,b.height);
			temp.display(me.x,me.y);
		}
		updateMenu(me);
	}
});
socket.on('getInputs',()=>{socket.emit('inputs',{ins,id})});
socket.on('newplayer',i=>{
	plrs.push(new Player(i));
	//
});
socket.on('discon',id=>{
	let tem = plrs.filter(e=>e.id==id)[0];
	tem.img.remove();
	plrs.splice(plrs.indexOf(tem),1);
});
function pos(x,y){
	return y*width-width-2+x;
	//
}
function typeAt(x,y){
	if(inBounds(x,y)) return world[pos(x,y)];
	else return 'n';
}
function inBounds(x,y){
	return x>1 && x<=width+1 && y>1 && y<=height;
	//
}
function addEvents(){
	document.on('keydown',function(e){
		if(e.key==" ") ins.space=true;
		else if(e.key in ins) ins[e.key]=true;
	});
	document.on('keyup',function(e){
		if(e.key==" ") ins.space=false;
		else if(e.key in ins) ins[e.key]=false;
	});
	var drops = document.querySelectorAll('drop');
	for(let d of drops){
		var c = create('img');
		c.classList.add('droparrow');
		c.src='arrow.svg';
		d.appendChild(c);
		d.open=false;
		c.on('click',function(){
			SELECTED = undefined;
			if(d.open){
				d.nextElementSibling.classList.remove('open');
				d.open=false;
				this.style.transform='';
			} else {
				d.nextElementSibling.classList.add('open');
				d.open=true;
				this.style.transform='rotate(0deg)';
			}
		});
	}
	var types = ['hunter / gatherer','defender','farmer','miner','soldier','builder'];
	var buttons = document.querySelectorAll('.occ');
	var i=0;
	for(let b of buttons){
		let t = i++;
		b.on('click',function(){
			if(SELECTED){
				socket.emit('updobj',{id:SELECTED.id,type:types[t]});
				SELECTED = undefined;
			}
		});
	}
}
function applyStyles(){
	obj('div').innerHTML='';
	td=window.innerHeight/vh;
	board=new Grid(obj('div'),vw,vh,td);
	board.setColorAll('gray');
	var style = `calc((${window.innerWidth}px - ${td*15}px - 50px)/2)`;
	obj('div').style.borderWidth=window.innerHeight-td*vh+'px';
	obj('res').style.width=style;
	obj('con').style.width=style;
	obj('res').style.right=`calc((${window.innerWidth}px - ${td*15}px - 50px)/2 + 50px)`;
	obj('bottom').style.width=`calc(${window.innerWidth}px - ${td*15}px - 50px)`;
	obj('#weather').style.width=td*15+'px';
	obj('#weather').style.height=td*15+'px';
}
function updateMenu(me){
	obj('con').innerHTML = `Current Position: (${me.x},${me.y})`;
	var popMenu = obj('#p');
	popMenu.innerHTML='';
	popMenu.previousElementSibling.children[0].innerHTML = `Population (${me.population.length})`;
	for(let p of me.population){
		var box = create('person');
		var text = p.type + ` (${p.x},${p.y})`;
		box.appendChild(create('b', text.toUpperCase()));
		popMenu.appendChild(box);
		box.on('mouseup',function(){
			if(SELECTED && SELECTED.id == p.id){
				SELECTED = undefined;
			} else {
				SELECTED = p;
			}
		});
		if(SELECTED && p.id == SELECTED.id){
			box.style.backgroundColor='#99f';
		}
	}
}

// CLASSES 

function Player(i){
	var x,y;
	var el = create('img');
	var isme=i==id;
	obj('people').appendChild(el);
	var ob = new SAM(board,el,td-5,td-5);
	this.id=i;
	this.img = el;
	this.setPos=function(nx,ny){
		x=nx;
		y=ny;
	}
	this.display=function(mx,my){
		let tx = x-mx+ox;
		let ty = y-my+oy;
		hide(el);
		board.getTile(8,8).style.border='3px dashed black';
	}
}

function Block(t,x,y,w=1,h=1){
	var sam = new SAM(board,false,td*w,td*h);
	sam.img.src=t+'.png';
	this.display=function(mx,my){
		let tx = x-mx+ox;
		let ty = y-my+oy;
		if(tx>0 && tx<=vw && ty>0 && ty<=vh){
			sam.goTo(tx,ty);
			obj('blocks').appendChild(sam.img);
		}
	}
	blks.push(this);
}

function Person(t,x,y){
	var sam = new SAM(board,false,td*.9,td*.9);
	var sr = t.replace(/[^A-Z0-9]/gi,'');
	sam.img.src=sr+'.png';
	this.display=function(mx,my){
		let tx = x-mx+ox;
		let ty = y-my+oy;
		if(tx>0 && tx<=vw && ty>0 && ty<=vh){
			sam.goTo(tx,ty);
			obj('people').appendChild(sam.img);
		}
	}
	plrs.push(this);
}

applyStyles();
window.addEventListener('resize',applyStyles);