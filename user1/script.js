'use strict';
import {initializeApp} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import {getDatabase, onValue,
    ref as db_ref, set as db_set
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js';
import {getStorage, ref, uploadBytes} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js';

const config = {
  apiKey: 'AIzaSyAlfCyPFzLHtoPODXBeamSvL_ss58DlHNA',
  appId: '1:657398340602:web:115d182a214dcc0395e243',
  authDomain: 'web-talk-bdf51.firebaseapp.com',
  measurementId: 'G-YRP53NM8CJ',
  messagingSenderId: '657398340602',
  projectId: 'web-talk-bdf51',
  storageBucket: 'web-talk-bdf51.appspot.com'
};
const app = initializeApp(config);
const database = getDatabase(app);
const storage = getStorage(app);

const user_0_ref = db_ref(database, 'user_0_base64');
const user_1_ref = db_ref(database, 'user_1_base64');

const startButton = document.getElementById('start-button');
const finishButton = document.getElementById('finish-button');
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const img = document.getElementById('img');

const MEDIA_CONSTRAINTS = {
  audio: true,
  video: {width: {min: 720}, height: {min: 1280}, facingMode: 'user'}
};
const FLUSH_SIZE = 60 * 60;
const BLOB_INFO = {type: 'video/webm'};

let recorder, stream, recording = false;
let blob = new Blob([], BLOB_INFO);
let chunks = [];

startButton.onclick = onClick;
finishButton.onclick = onClick;

async function onClick (event) {
  switch (this) {
    case startButton:
      if (recording) return;
      navigator.mediaDevices.getUserMedia(MEDIA_CONSTRAINTS)
          .then(resolve).catch(reject);
      break;
    case finishButton:
      if (!recording) return;
      recorder.stop();
      console.log('録画を終了しました。');
      blob = flush(blob);
      const filename = `${Date.now()}-${parseInt(Math.random() * 1000)}.webm`;
      console.log('ファイル名: ' + filename);
      window.alert('切断処理を開始します。\n少々お待ちください。');
      await uploadBytes(ref(storage, filename), blob);
      window.alert('切断処理が完了しました。');
      recording = false;
      break;
  }
}

onValue(user_0_ref, ss => {
  const val = ss.val();
  img.src = val;
})

function resolve (mediaStream) {
  video.srcObject = mediaStream;
  video.play();
  try {
    recorder = new MediaRecorder(mediaStream, {mimeType: 'video/webm;codecs=vp9'});
  } catch {
    return reject();
  }
  console.log('MediaRecorderの初期化に成功しました。')
  recorder.addEventListener('dataavailable', function (event) {
    const data = event.data;
    if (data && data.size > 0) {
      chunks.push(data);
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, video.videoWidth, canvas.height, 0, 0, video.videoWidth / 4, canvas.height / 4);
      db_set(user_1_ref, canvas.toDataURL('image/jpeg'));
    }
    if (chunks.length === FLUSH_SIZE) blob = flush(blob);
  }, false);
  recorder.start(1000 / 60);
  console.log('録画を開始します。');
  recording = true;
}

function reject (error) {
  console.log(error);
  window.alert('この端末は対応していない可能性がります。');
}

function flush (blob) {
  const tmp = chunks.splice(0, FLUSH_SIZE);
  return new Blob([blob].concat(tmp), BLOB_INFO);
}
