<template>
  <div class="main">
    <div class="cat">
      <div class="cat__body">
        <div class="cat__tail"></div>
      </div>
      <div class="cat__paws">
        <div class="cat__paw cat__paw--left"></div>
        <div class="cat__paw cat__paw--right"></div>
      </div>
      <div class="cat__head">
        <div class="cat__ear cat__ear--left"></div>
        <div class="cat__ear cat__ear--right"></div>
        <div class="cat__eye cat__eye--left"></div>
        <div class="cat__eye cat__eye--right"></div>
        <div class="cat__nose"></div>
        <div class="cat__mouth"></div>
        <div class="cat__whiskers-l"></div>
        <div class="cat__whiskers-r"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.main {
  position: relative;
  width: 10vmax;
  height: 10vmax;
  display: flex;
  justify-content: center;
  align-items: center;
}

.cat {
  position: relative;
  width: 10vmax;
  height: 9vmax;
}

.cat::before {
  content: "";
  position: absolute;
  bottom: -0.5vmax;
  left: 50%;
  transform: translateX(-50%);
  width: 7.5vmax;
  height: 1vmax;
  background-color: #dcdcdc;
  border-radius: 50%;
  z-index: -10;
  animation: shadow 8s ease-in-out infinite;
}

.cat__body {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 7.5vmax;
  height: 5vmax;
  background-color: #7d7d7d;
  border-radius: 50% 50% 30% 30% / 60% 60% 40% 40%;
  z-index: -1;
  animation: body-bob 8s ease-in-out infinite;
}

.cat__paws {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 5.5vmax;
  height: 1.5vmax;
  z-index: 2;
  animation: body-bob 8s ease-in-out infinite;
}

.cat__paw {
  position: absolute;
  bottom: 0;
  width: 2vmax;
  height: 1.25vmax;
  background-color: #9c9c9c;
  border-radius: 50% 50% 40% 40% / 70% 70% 30% 30%;
}

.cat__paw--left { left: 0; }
.cat__paw--right { right: 0; }

.cat__tail {
  position: absolute;
  bottom: 0.5vmax;
  left: -2vmax;
  width: 6vmax;
  height: 1.25vmax;
  background-color: #7d7d7d;
  border-radius: 1vmax;
  transform-origin: 100% 50%;
  transform: rotate(30deg);
  animation: tail-sway 8s ease-in-out infinite;
}

.cat__head {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 6vmax;
  height: 5.5vmax;
  background-color: #9c9c9c;
  border-radius: 50%;
  animation: head-turn 8s ease-in-out infinite;
}

.cat__ear {
  position: absolute;
  top: -0.5vmax;
  width: 2.5vmax;
  height: 2.5vmax;
  background-color: #9c9c9c;
  z-index: -1;
}

.cat__ear::before {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 70%;
  height: 70%;
  background-color: #f5c3c3;
}

.cat__ear--left {
  left: -0.5vmax;
  border-radius: 5% 70% 5% 50%;
  transform: rotate(-15deg);
  animation: ear-twitch-left 8s ease-in-out infinite;
}
.cat__ear--left::before { border-radius: 5% 70% 5% 50%; }

.cat__ear--right {
  right: -0.5vmax;
  border-radius: 70% 5% 50% 5%;
  transform: rotate(15deg);
  animation: ear-twitch-right 8s ease-in-out infinite;
}
.cat__ear--right::before { border-radius: 70% 5% 50% 5%; }

.cat__eye {
  position: absolute;
  top: 2vmax;
  width: 1.25vmax;
  height: 1.25vmax;
  background-color: #a8e6cf;
  border-radius: 50%;
  animation: blink 8s linear infinite;
}

.cat__eye::before {
  content: "";
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 0.25vmax;
  height: 0.6vmax;
  background-color: #2c3e50;
  border-radius: 0.125vmax;
}

.cat__eye--left { left: 1vmax; }
.cat__eye--right { right: 1vmax; }

.cat__nose {
  position: absolute;
  top: 3.25vmax;
  left: 50%;
  transform: translateX(-50%);
  width: 0.75vmax;
  height: 0.5vmax;
  background-color: #f5c3c3;
  border-radius: 20% 20% 50% 50%;
}

.cat__mouth {
  position: absolute;
  top: 3.75vmax;
  left: 50%;
  width: 1.5vmax;
  height: 0.75vmax;
  transform: translateX(-50%);
  animation: meow 8s ease-in-out infinite;
}

.cat__mouth::before,
.cat__mouth::after {
  content: "";
  position: absolute;
  top: 0;
  width: 50%;
  height: 100%;
  border-style: solid;
  border-color: #444;
  border-width: 0 0 0.1vmax 0;
  border-radius: 0 0 50% 50% / 0 0 100% 100%;
}
.cat__mouth::before { left: 0; transform: rotate(10deg); }
.cat__mouth::after { right: 0; transform: rotate(-10deg); }

.cat__whiskers-l,
.cat__whiskers-r {
  position: absolute;
  top: 3.75vmax;
  width: 2.5vmax;
  height: 1.5vmax;
}

.cat__whiskers-l { left: -0.25vmax; transform: rotate(10deg); }
.cat__whiskers-r { right: -0.25vmax; transform: rotate(-10deg); }

.cat__whiskers-l::before,
.cat__whiskers-l::after,
.cat__whiskers-r::before,
.cat__whiskers-r::after {
  content: "";
  position: absolute;
  height: 0.075vmax;
  background-color: #444;
  border-radius: 0.05vmax;
}

.cat__whiskers-l::before { width: 80%; top: 0; left: 0; transform: rotate(-10deg); }
.cat__whiskers-l::after { width: 100%; top: 0.5vmax; left: 0; }
.cat__whiskers-r::before { width: 80%; top: 0; right: 0; transform: rotate(10deg); }
.cat__whiskers-r::after { width: 100%; top: 0.5vmax; right: 0; }

@keyframes head-turn {
  0%, 100% { transform: translateX(-50%) rotate(0deg); }
  20% { transform: translateX(-55%) rotate(-5deg); }
  60% { transform: translateX(-45%) rotate(5deg); }
  80% { transform: translateX(-50%) rotate(0deg); }
}

@keyframes tail-sway {
  0%, 20%, 100% { transform: rotate(30deg); }
  50% { transform: rotate(0deg); }
  80% { transform: rotate(-25deg); }
}

@keyframes blink {
  0%, 38%, 41%, 88%, 91%, 100% { transform: scaleY(1); }
  40%, 90% { transform: scaleY(0.1); }
}

@keyframes body-bob {
  0%, 100% { bottom: 0; }
  50% { bottom: 0.25vmax; }
}

@keyframes ear-twitch-left {
  0%, 50%, 100% { transform: rotate(-15deg); }
  55% { transform: rotate(-25deg); }
  60% { transform: rotate(-15deg); }
}

@keyframes ear-twitch-right {
  0%, 70%, 100% { transform: rotate(15deg); }
  75% { transform: rotate(25deg); }
  80% { transform: rotate(15deg); }
}

@keyframes meow {
  0%, 50%, 60%, 100% { transform: translateX(-50%) scaleY(1); }
  55% { transform: translateX(-50%) scaleY(1.3); }
}

@keyframes shadow {
  0%, 100% { width: 7.5vmax; opacity: 1; }
  50% { width: 8vmax; opacity: 0.8; }
}
</style>
