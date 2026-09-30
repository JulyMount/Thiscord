const peer = new Peer();

const myIdEl = document.getElementById('my-id');
const peerIdInput = document.getElementById('peer-id-input');
const btnCopy = document.getElementById('btn-copy');
const btnCall = document.getElementById('btn-call');
const btnScreen = document.getElementById('btn-screen');
const btnPip = document.getElementById('btn-pip');
const btnFullscreen = document.getElementById('btn-fullscreen');

const btnToggleMic = document.getElementById('btn-toggle-mic');
const btnToggleCam = document.getElementById('btn-toggle-cam');
const btnHangup = document.getElementById('btn-hangup');
const callControls = document.getElementById('call-controls');

const localVideo = document.getElementById('local-video');
const remoteVideo = document.getElementById('remote-video');

let localStream = null;
let currentCall = null;
let isMicOn = true;
let isCamOn = true;

// Exibir o ID gerado pelo PeerJS
peer.on('open', (id) => {
  myIdEl.innerText = id;
});

// Copiar ID
btnCopy.addEventListener('click', () => {
  const currentId = myIdEl.innerText;
  if (currentId && currentId !== 'Gerando ID...') {
    navigator.clipboard.writeText(currentId);
    btnCopy.innerText = 'Copiado!';
    setTimeout(() => { btnCopy.innerText = 'Copiar'; }, 2000);
  }
});

// Função para garantir captura completa de áudio e vídeo
async function getMediaStream(isScreen = false) {
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
  }

  if (isScreen) {
    const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
    // Tenta pegar o áudio do microfone junto se quiser falar enquanto compartilha tela
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStream.getAudioTracks().forEach(track => screenStream.addTrack(track));
    } catch (e) {
      console.log('Sem permissão de mic adicional no compartilhamento.');
    }
    localStream = screenStream;
  } else {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  }

  localVideo.srcObject = localStream;
  isMicOn = true;
  isCamOn = true;
  updateControlButtons();
  return localStream;
}

// Receber chamadas (Garante que o áudio/vídeo local é capturado antes de responder)
peer.on('call', async (call) => {
  currentCall = call;
  try {
    const stream = await getMediaStream(false);
    call.answer(stream);
  } catch (err) {
    console.error('Erro ao acessar mídia para atender:', err);
    call.answer(); // Atende apenas recebendo
  }

  setupCallEvents(call);
});

// Ligar Câmera + Áudio
btnCall.addEventListener('click', async () => {
  const targetId = peerIdInput.value.trim();
  if (!targetId) return alert('Por favor, insira o ID da outra pessoa!');

  try {
    const stream = await getMediaStream(false);
    const call = peer.call(targetId, stream);
    currentCall = call;
    setupCallEvents(call);
  } catch (err) {
    alert('Erro ao acessar câmera e microfone: ' + err.message);
  }
});

// Compartilhar Tela
btnScreen.addEventListener('click', async () => {
  const targetId = peerIdInput.value.trim();
  if (!targetId) return alert('Por favor, insira o ID da outra pessoa!');

  try {
    const stream = await getMediaStream(true);
    const call = peer.call(targetId, stream);
    currentCall = call;
    setupCallEvents(call);
  } catch (err) {
    console.error('Erro ao compartilhar tela:', err);
  }
});

// Configurar escuta do fluxo remoto
function setupCallEvents(call) {
  callControls.classList.remove('hidden');

  call.on('stream', (remoteStream) => {
    remoteVideo.srcObject = remoteStream;
  });

  call.on('close', () => {
    endCallUI();
  });
}

// Controles de Microfone e Câmera
btnToggleMic.addEventListener('click', () => {
  if (!localStream) return;
  const audioTracks = localStream.getAudioTracks();
  if (audioTracks.length > 0) {
    isMicOn = !isMicOn;
    audioTracks.forEach(track => track.enabled = isMicOn);
    updateControlButtons();
  }
});

btnToggleCam.addEventListener('click', () => {
  if (!localStream) return;
  const videoTracks = localStream.getVideoTracks();
  if (videoTracks.length > 0) {
    isCamOn = !isCamOn;
    videoTracks.forEach(track => track.enabled = isCamOn);
    updateControlButtons();
  }
});

// Encerrar Chamada
btnHangup.addEventListener('click', () => {
  if (currentCall) currentCall.close();
  endCallUI();
});

function endCallUI() {
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
    localStream = null;
  }
  localVideo.srcObject = null;
  remoteVideo.srcObject = null;
  callControls.classList.add('hidden');
}

function updateControlButtons() {
  btnToggleMic.innerText = isMicOn ? '🎤 Mic On' : '🎙️ Mic Muted';
  btnToggleMic.classList.toggle('off', !isMicOn);

  btnToggleCam.innerText = isCamOn ? '📹 Cam On' : '📷 Cam Off';
  btnToggleCam.classList.toggle('off', !isCamOn);
}

// PiP e Fullscreen
btnPip.addEventListener('click', async () => {
  try {
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture();
    } else if (remoteVideo.readyState >= 2) {
      await remoteVideo.requestPictureInPicture();
    } else {
      alert('Aguarde o vídeo carregar para ativar o modo flutuante!');
    }
  } catch (error) {
    alert('Navegador sem suporte a Picture-in-Picture.');
  }
});

btnFullscreen.addEventListener('click', () => {
  const container = document.querySelector('.video-container');
  if (!document.fullscreenElement) {
    container.requestFullscreen().catch((err) => console.error(err));
  } else {
    document.exitFullscreen();
  }
});
