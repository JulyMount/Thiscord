const peer = new Peer();

const myIdEl = document.getElementById('my-id');
const peerIdInput = document.getElementById('peer-id-input');
const btnCopy = document.getElementById('btn-copy');
const btnCall = document.getElementById('btn-call');
const btnScreen = document.getElementById('btn-screen');
const btnPip = document.getElementById('btn-pip');
const btnFullscreen = document.getElementById('btn-fullscreen');
const localVideo = document.getElementById('local-video');
const remoteVideo = document.getElementById('remote-video');

let localStream = null;

// Exibir o ID gerado pelo PeerJS
peer.on('open', (id) => {
  myIdEl.innerText = id;
});

// Copiar ID para a área de transferência
btnCopy.addEventListener('click', () => {
  const currentId = myIdEl.innerText;
  if (currentId && currentId !== 'Gerando ID...') {
    navigator.clipboard.writeText(currentId);
    btnCopy.innerText = 'Copiado!';
    setTimeout(() => { btnCopy.innerText = 'Copiar'; }, 2000);
  }
});

// Receber chamadas/transmissões da outra pessoa
peer.on('call', async (call) => {
  if (!localStream) {
    try {
      localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localVideo.srcObject = localStream;
    } catch (e) {
      console.log('Sem permissão de câmera/microfone local.');
    }
  }
  call.answer(localStream);
  call.on('stream', (remoteStream) => {
    remoteVideo.srcObject = remoteStream;
  });
});

// Ligar Câmera para a outra pessoa
btnCall.addEventListener('click', async () => {
  const targetId = peerIdInput.value.trim();
  if (!targetId) return alert('Por favor, insira o ID da outra pessoa!');

  try {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideo.srcObject = localStream;

    const call = peer.call(targetId, localStream);
    call.on('stream', (remoteStream) => {
      remoteVideo.srcObject = remoteStream;
    });
  } catch (err) {
    alert('Erro ao acessar a câmera: ' + err.message);
  }
});

// Compartilhar Tela (Assistir vídeos/jogos juntos)
btnScreen.addEventListener('click', async () => {
  const targetId = peerIdInput.value.trim();
  if (!targetId) return alert('Por favor, insira o ID da outra pessoa!');

  try {
    const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
    localVideo.srcObject = screenStream;

    const call = peer.call(targetId, screenStream);
    call.on('stream', (remoteStream) => {
      remoteVideo.srcObject = remoteStream;
    });
  } catch (err) {
    console.error('Erro ao compartilhar tela:', err);
  }
});

// MODO PIP: Destaca o vídeo da outra pessoa e coloca flutuando por cima do Windows/Jogos
btnPip.addEventListener('click', async () => {
  try {
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture();
    } else if (remoteVideo.readyState >= 2) {
      await remoteVideo.requestPictureInPicture();
    } else {
      alert('Aguarde o vídeo do parceiro carregar antes de ativar o modo flutuante!');
    }
  } catch (error) {
    alert('Seu navegador não suporta a função Picture-in-Picture.');
  }
});

// Modo Tela Cheia
btnFullscreen.addEventListener('click', () => {
  const container = document.querySelector('.video-container');
  if (!document.fullscreenElement) {
    container.requestFullscreen().catch((err) => console.error(err));
  } else {
    document.exitFullscreen();
  }
});