var socket = io();
var id,connected=false,once=true;
var colors=[{ch:'w',c:'blue'},{ch:'g',c:'green'},{ch:'s',c:'gray'},{ch:'t',c:'darkgreen'},{ch:'n',c:'black'},{ch:'d',c:'#654321'},{ch:'au',c:'gold'}];
var ins={ArrowUp:false,ArrowDown:false,ArrowLeft:false,ArrowRight:false,z:false};
const vw = 15,vh = 15;
var td = window.innerHeight/vh;
var plrs=[],blks=[];

var board = new Grid(obj('div'),vw,vh,td);
board.setColorAll('#444');
var ox = 8,oy = 8;
var width,height;

socket.on('getUsername',()=>{socket.emit('user',prompt('Enter a Username'))});
socket.on('id',p=>{
	id=p;
	connected=true;
	addEvents();
});
socket.on('render',function(w,h,world,players,blocks){
	if(connected){
		obj('blocks').innerHTML='';
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
		});
		for(let p of players){
			let tempp = plrs.filter(t=>t.id==p.id)
			tempp[0].setPos(p.x,p.y);
			tempp[0].display(me.x,me.y);
		}
		for(let b of blocks){
			var temp=new Block(b.type,b.x,b.y);
			temp.display(me.x,me.y);
		}
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
		if(e.key in ins) ins[e.key]=true;
	});
	document.on('keyup',function(e){
		if(e.key in ins) ins[e.key]=false;
	});
	var drops = document.querySelectorAll('drop');
	for(let d of drops){
		var c = create('img');
		c.classList.add('droparrow');
		c.src='arrow.svg';
		d.appendChild(c);
		d.open=false;
		c.on('click',function(){
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
function collapse(e) {
  	var sectionHeight = e.scrollHeight;
  	var eTransition = e.style.transition;
  	e.style.transition = '';
  	requestAnimationFrame(function() {
  	  	e.style.height = sectionHeight + 'px';
  	  	e.style.transition = eTransition;
  	  	requestAnimationFrame(function() {
  	  	  	e.style.height = 0 + 'px';
  	  	});
  	});
}
function expand(e) {
  	var sectionHeight = e.scrollHeight;
  	e.style.height = sectionHeight + 'px';
  	e.addEventListener('transitionend', function(e) {
  	  e.removeEventListener('transitionend', arguments.callee);
  	  e.style.height = null;
  	});
}

// CLASSES 

function Player(i){
	var x,y;
	var el = create('img');
	var isme=i==id;
	if(i==id){
		el.src='player1.png';
	} else {
		el.src='player2.png';
	}
	obj('players').appendChild(el);
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
		if(tx>0 && tx<=vw && ty>0 && ty<=vh){
			show(el);
			ob.goTo(isme?ox:tx,isme?oy:ty);
		} else {
			ob.goTo(1,1);
			hide(el);
		}
	}
}

function Block(t,x,y){
	var sam = new SAM(board,false,td*3,td*3);
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

applyStyles();
window.addEventListener('resize',applyStyles);