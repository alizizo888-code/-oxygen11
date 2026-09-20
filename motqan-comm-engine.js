/**
 * motqan-comm-engine.js
 * نظام الاتصال والدردشة بالصوت، الفيديو، والكاميرا
 */
const MotqanComm = (function () {
  let mediaRecorder = null;
  let audioChunks = [];

  return {
    // فتح الكاميرا لالتقاط عطل أو فيديو
    openCameraStream: async function (videoElementId) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        const videoElement = document.getElementById(videoElementId);
        if (videoElement) {
          videoElement.srcObject = stream;
          videoElement.play();
        }
        return stream;
      } catch (err) {
        throw new Error('تعذر الوصول للكاميرا والميكروفون: ' + err.message);
      }
    },
    // تسجيل رسالة صوتية (Voice Note)
    startVoiceRecording: async function () {
      audioChunks = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
      mediaRecorder.start();
    },
    stopVoiceRecording: function () {
      return new Promise(resolve => {
        if (!mediaRecorder) return resolve(null);
        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
          const audioUrl = URL.createObjectURL(audioBlob);
          resolve({ blob: audioBlob, url: audioUrl });
        };
        mediaRecorder.stop();
      });
    },
    // بث مباشر عبر الإنترنت (WebRTC Peer Setup)
    initDirectCall: function (remoteVideoId) {
      const peer = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      peer.ontrack = event => {
        const remoteVideo = document.getElementById(remoteVideoId);
        if (remoteVideo) remoteVideo.srcObject = event.streams[0];
      };
      return peer;
    }
  };
})();
