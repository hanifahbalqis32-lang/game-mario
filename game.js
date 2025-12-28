const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const lvlText = document.getElementById("lvl");
const coinText = document.getElementById("coin");

/* ================= STATE ================= */
let paused=false;
let level=1;
let coinCount=0;

/* ================= PLAYER ================= */
const mario={
  x:50,y:260,w:28,h:40,
  vx:0,vy:0,
  speed:3,
  jump:-10,
  onGround:false,
  dir:1
};

const gravity=0.5;
const groundY=360;

/* ================= CAMERA ================= */
let camX=0;
const MAP_WIDTH=1800;

/* ================= OBJECT ================= */
let coins=[], enemies=[], bullets=[], pipes=[];

/* ================= LEVEL DESIGN (MULUS) ================= */
const levels=[
  {pipes:[400,900], coins:[200,350,550,800], enemies:[600], finish:1600},
  {pipes:[450,950], coins:[250,450,650,900], enemies:[700,1000], finish:1600},
  {pipes:[500,1000], coins:[300,500,700,1000], enemies:[800,1100], finish:1600},
  {pipes:[550,1050], coins:[350,550,750,1100], enemies:[900,1200], finish:1600},
  {pipes:[600,1100], coins:[400,600,800,1200], enemies:[1000], finish:1600}
];

/* ================= INPUT ================= */
let left=false,right=false,jump=false;

document.addEventListener("keydown",e=>{
  if(e.key==="ArrowLeft") left=true;
  if(e.key==="ArrowRight") right=true;
  if(e.key==="ArrowUp"||e.key===" ") jump=true;
  if(e.key==="x"||e.key==="X") shoot();
  if(e.key==="p"||e.key==="P") paused=!paused;
  if(e.key==="r"||e.key==="R") resetLevel();
});
document.addEventListener("keyup",e=>{
  if(e.key==="ArrowLeft") left=false;
  if(e.key==="ArrowRight") right=false;
  if(e.key==="ArrowUp"||e.key===" ") jump=false;
});

/* ================= LOAD / RESET ================= */
function loadLevel(){
  coins=[]; enemies=[]; bullets=[]; pipes=[];
  mario.x=50; mario.y=260; camX=0;

  const d=levels[level-1];

  d.coins.forEach(x=>coins.push({x:x,y:300,r:8}));
  d.enemies.forEach(x=>enemies.push({x:x,y:330,w:28,h:28,dir:1}));
  d.pipes.forEach(x=>pipes.push({x:x,y:300,w:40,h:60}));

  lvlText.textContent=level;
}
function resetLevel(){ loadLevel(); }

loadLevel();

/* ================= SHOOT ================= */
let fireCD=0;
function shoot(){
  if(fireCD>0||paused) return;

  bullets.push({
    x:mario.x+mario.w/2,
    y:mario.y+mario.h/2,
    r:4+level*2,
    dx:(6+level)*mario.dir
  });

  fireCD=15;
}

/* ================= UPDATE ================= */
function update(){
  if(paused) return;
  fireCD--;

  mario.vx=0;
  if(left){ mario.vx=-mario.speed; mario.dir=-1; }
  if(right){ mario.vx=mario.speed; mario.dir=1; }

  if(jump&&mario.onGround){
    mario.vy=mario.jump;
    mario.onGround=false;
  }

  mario.vy+=gravity;
  mario.x+=mario.vx;
  mario.y+=mario.vy;

  // Ground (MULUS)
  if(mario.y+mario.h>=groundY){
    mario.y=groundY-mario.h;
    mario.vy=0;
    mario.onGround=true;
  }

  // Pipe collision (halus)
  pipes.forEach(p=>{
    if(mario.x<p.x+p.w &&
       mario.x+mario.w>p.x &&
       mario.y+mario.h>p.y){
      mario.x-=mario.vx;
    }
  });

  // Camera follow
  camX=mario.x-200;
  camX=Math.max(0,Math.min(camX,MAP_WIDTH-canvas.width));

  // Bullets
  bullets.forEach(b=>b.x+=b.dx);
  bullets=bullets.filter(b=>b.x>0&&b.x<MAP_WIDTH);

  // Coin
  coins=coins.filter(c=>{
    const hit =
      mario.x<c.x+c.r &&
      mario.x+mario.w>c.x-c.r &&
      mario.y<c.y+c.r &&
      mario.y+mario.h>c.y-c.r;
    if(hit) coinCount++;
    return !hit;
  });
  coinText.textContent=coinCount;

  // Enemy (normal)
  enemies.forEach(e=>{
    e.x+=e.dir*1.2;
    if(e.x<0||e.x>MAP_WIDTH) e.dir*=-1;

    if(
      mario.x<e.x+e.w &&
      mario.x+mario.w>e.x &&
      mario.y<e.y+e.h &&
      mario.y+mario.h>e.y
    ){
      gameOver();
    }
  });

  // Bullet vs Enemy
  bullets.forEach((b,bi)=>{
    enemies.forEach((e,ei)=>{
      if(b.x>e.x&&b.x<e.x+e.w&&
         b.y>e.y&&b.y<e.y+e.h){
        bullets.splice(bi,1);
        enemies.splice(ei,1);
      }
    });
  });

  // Finish
  if(mario.x>levels[level-1].finish){
    if(level<5){
      level++;
      loadLevel();
    }else{
      alert("YOU FINISHED THE GAME!");
      location.reload();
    }
  }
}

/* ================= DRAW ================= */
function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.save();
  ctx.translate(-camX,0);

  // Ground
  ctx.fillStyle="#654321";
  ctx.fillRect(0,groundY,MAP_WIDTH,40);

  // Pipes
  ctx.fillStyle="green";
  pipes.forEach(p=>ctx.fillRect(p.x,p.y,p.w,p.h));

  // Mario
  ctx.fillStyle="red";
  ctx.fillRect(mario.x,mario.y,28,20);
  ctx.fillStyle="blue";
  ctx.fillRect(mario.x,mario.y+20,28,20);
  ctx.fillStyle="peachpuff";
  ctx.fillRect(mario.x+6,mario.y+6,16,10);

  // Coins
  ctx.fillStyle="gold";
  coins.forEach(c=>{
    ctx.beginPath();
    ctx.arc(c.x,c.y,c.r,0,Math.PI*2);
    ctx.fill();
  });

  // Enemies
  ctx.fillStyle="brown";
  enemies.forEach(e=>ctx.fillRect(e.x,e.y,e.w,e.h));

  // Bullets
  ctx.fillStyle="orange";
  bullets.forEach(b=>{
    ctx.beginPath();
    ctx.arc(b.x,b.y,b.r,0,Math.PI*2);
    ctx.fill();
  });

  // Finish
  ctx.fillStyle="yellow";
  ctx.fillRect(levels[level-1].finish,280,10,80);

  ctx.restore();

  if(paused){
    ctx.fillStyle="rgba(0,0,0,0.6)";
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle="white";
    ctx.font="30px Arial";
    ctx.fillText("PAUSED",350,200);
  }
}

/* ================= END ================= */
function gameOver(){
  alert("GAME OVER");
  resetLevel();
}

function loop(){
  update();
  draw();
  requestAnimationFrame(loop);
}
loop();
