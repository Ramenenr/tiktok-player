<template>
  <div class="video-container" @scroll="handleScroll">
    <div 
      v-if="showCover" 
      class="cover-image" 
      @click="startPlayback"
    >
      <img src="/home.png" alt="Click to begin" />
    </div>
    
    <div 
      v-show="!showCover"
      class="video-player"
      ref="videoContainer"
    >
      <div 
        v-for="(video, index) in videoList" 
        :key="index"
        class="video-item"
        :id="`video-item-${index}`"
      >
        <video
          :src="video.url"
          class="video"
          :id="`video-${index}`"
          preload="auto"
          webkit-playsinline
          playsinline
          loop
          muted
          ref="videoRefs"
        ></video>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'

const props = defineProps({
  videoList: {
    type: Array,
    required: true
  }
})

const currentVideoIndex = ref(0)
const videoContainer = ref(null)
const videoRefs = ref([])
const showCover = ref(true)

let isTransitioning = false
let touchStartY = 0
let touchEndY = 0

const handleTouchStart = (e) => {
  if (isTransitioning) return
  touchStartY = e.touches[0].clientY
}

const handleTouchMove = (e) => {
  if (isTransitioning) return
  e.preventDefault()
  touchEndY = e.touches[0].clientY
}

const handleTouchEnd = async () => {
  if (isTransitioning) return
  
  const diff = touchStartY - touchEndY
  
  if (Math.abs(diff) > 50) { // 滑动距离超过50px才触发切换
    isTransitioning = true
    
    const previousIndex = currentVideoIndex.value
    
    if (diff > 0 && currentVideoIndex.value < props.videoList.length - 1) {
      // 向上滑动，播放下一个视频
      currentVideoIndex.value++
    } else if (diff < 0 && currentVideoIndex.value > 0) {
      // 向下滑动，播放上一个视频
      currentVideoIndex.value--
    }
    
    // 只有在索引真的改变时才更新视频
    if (previousIndex !== currentVideoIndex.value) {
      await updateVideoPlayback()
    }
    
    setTimeout(() => {
      isTransitioning = false
    }, 300)
  }
}

const handleWheel = async (e) => {
  if (isTransitioning) return
  e.preventDefault()
  
  isTransitioning = true
  
  if (e.deltaY > 0 && currentVideoIndex.value < props.videoList.length - 1) {
    currentVideoIndex.value++
  } else if (e.deltaY < 0 && currentVideoIndex.value > 0) {
    currentVideoIndex.value--
  }
  
  await updateVideoPlayback()
  
  // 300ms后重置状态
  setTimeout(() => {
    isTransitioning = false
  }, 300)
}

const updateVideoPlayback = async () => {
  if (!videoRefs.value) return
  
  const videos = videoRefs.value
  
  // 暂停所有视频
  videos.forEach((video, index) => {
    if (video && index !== currentVideoIndex.value) {
      video.pause()
      video.currentTime = 0
    }
  })
  
  // 播放当前视频
  const currentVideo = videos[currentVideoIndex.value]
  if (currentVideo) {
    try {
      currentVideo.muted = false // 确保新视频不是静音的
      
      // 如果视频还没有加载完成，等待加载
      if (currentVideo.readyState < 2) {
        await new Promise((resolve) => {
          currentVideo.addEventListener('loadeddata', resolve, { once: true })
          currentVideo.load()
        })
      }
      
      // 尝试播放视频
      await currentVideo.play()
      
    } catch (err) {
      console.error('Failed to play video:', err)
      // 如果自动播放失败，500ms后重试一次
      setTimeout(async () => {
        try {
          await currentVideo.play()
        } catch (retryErr) {
          console.error('Retry failed:', retryErr)
        }
      }, 500)
    }
  }
  
  // 预加载下一个视频
  const nextIndex = currentVideoIndex.value + 1
  if (nextIndex < videos.length) {
    const nextVideo = videos[nextIndex]
    if (nextVideo) {
      nextVideo.load()
    }
  }
}

const startPlayback = async () => {
  showCover.value = false
  await nextTick()
  
  const firstVideo = videoRefs.value[0]
  if (firstVideo) {
    firstVideo.muted = false
    try {
      await firstVideo.play()
    } catch (err) {
      console.error('First video autoplay failed:', err)
      setTimeout(() => {
        firstVideo.play().catch(console.error)
      }, 500)
    }
  }
}

const toggleMute = (index) => {
  if (index === currentVideoIndex.value) {
    const video = videoRefs.value[index]
    video.muted = !video.muted
  }
}

const onVideoLoaded = async (index) => {
  // 确保视频加载完成后立即播放
  if (index === currentVideoIndex.value) {
    const video = videoRefs.value[index]
    if (video && !video.playing) {
      try {
        await video.play()
      } catch (err) {
        // 如果播放失败，500ms后重试
        setTimeout(async () => {
          try {
            await video.play()
          } catch (retryErr) {
            console.error('Video autoplay retry failed:', retryErr)
          }
        }, 500)
      }
    }
  }
}

const onVideoEnded = (index) => {
  if (index === currentVideoIndex.value) {
    const video = videoRefs.value[index]
    video.currentTime = 0
    video.play()
  }
}

// 预加载下一个视频
const preloadNextVideo = () => {
  const nextIndex = currentVideoIndex.value + 1
  if (nextIndex < props.videoList.length) {
    const nextVideo = videoRefs.value[nextIndex]
    if (nextVideo) {
      nextVideo.load()
    }
  }
}

const handleScroll = () => {
  const container = document.querySelector('.video-container')
  if (!container) return
  
  const scrollTop = container.scrollTop
  const height = container.clientHeight
  const index = Math.round(scrollTop / height)
  
  if (index !== currentVideoIndex.value) {
    // 暂停当前视频
    const currentVideo = videoRefs.value[currentVideoIndex.value]
    if (currentVideo) {
      currentVideo.pause()
      currentVideo.currentTime = 0
    }
    
    // 更新索引
    currentVideoIndex.value = index
    
    // 播放新视频
    const nextVideo = videoRefs.value[index]
    if (nextVideo) {
      nextVideo.muted = false
      nextVideo.play().catch(err => {
        console.error('Failed to play video:', err)
        setTimeout(() => {
          nextVideo.play().catch(console.error)
        }, 500)
      })
    }
  }
}

onMounted(() => {
  // 添加滚动事件监听
  const container = document.querySelector('.video-container')
  if (container) {
    container.addEventListener('scroll', handleScroll)
  }
  
  // 预加载所有视频
  videoRefs.value.forEach((video, index) => {
    if (video) {
      video.load()
    }
  })
})

onUnmounted(() => {
  // 移除滚动事件监听
  const container = document.querySelector('.video-container')
  if (container) {
    container.removeEventListener('scroll', handleScroll)
  }
})
</script>

<style scoped>
.video-container {
  width: 100vw;
  height: 100vh;
  overflow-y: scroll;
  scroll-snap-type: y mandatory;
  background: #000;
  scroll-behavior: smooth;
  position: fixed;
  top: 0;
  left: 0;
}

.video-player {
  width: 100%;
  height: 100%;
  position: relative;
}

.video-item {
  width: 100vw;
  height: 100vh;
  position: relative;
  scroll-snap-align: center;
  scroll-snap-stop: always;
}

.video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  background: #000;
}

.cover-image {
  position: absolute;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  z-index: 2;
  background-color: black;
}

.cover-image img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.brand-text {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  color: white;
  font-size: 36px;
  font-weight: bold;
  z-index: 3;
}

.play-icon {
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 48px;
  color: white;
  background-color: rgba(0, 0, 0, 0.7);
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
}

/* 隐藏所有滚动条 */
.video-container::-webkit-scrollbar {
  display: none;
}

/* Firefox */
.video-container {
  scrollbar-width: none;
}

/* IE 10+ */
.video-container {
  -ms-overflow-style: none;
}

/* 确保当前视频项在最上层 */
.video-item.active {
  z-index: 1;
}

@media (max-width: 768px) {
  .video-container {
    max-width: calc(100vh * 9/16);
    height: 100%;
    margin: 0 auto;
  }
}
</style> 