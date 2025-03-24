<template>
  <div class="app-container">
    <VideoPlayer :videoList="videoList" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import VideoPlayer from './components/VideoPlayer.vue'

const videoList = ref([
  {
    url: '/videos/video1.mp4'
  },
  {
    url: '/videos/video2.mp4'
  },
  {
    url: '/videos/video3.mp4'
  }
])
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.app-container {
  width: 100vw;
  height: 100vh;
  background-color: #000;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;  
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}
</style>
