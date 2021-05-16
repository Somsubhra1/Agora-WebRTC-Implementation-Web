const APPID = "b4a15502287b417f9eda3b1a235b207d";

const TOKEN =
  "006b4a15502287b417f9eda3b1a235b207dIAA9LLP38DGSNREsf8IjR2hjcFSEWrN1uRMypv6Mtf58PmlMJ4sAAAAAEACRer0xPY2iYAEAAQA8jaJg";

// create Agora client
var client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

var localTracks = {
  videoTrack: null,
  audioTrack: null,
};

var localTrackState = {
  videoTrackEnabled: true,
  audioTrackEnabled: true,
};

var remoteUsers = {};
// Agora client options
var options = {
  appid: APPID,
  token: TOKEN,
  channel: null,
  uid: null,
};

async function subscribe(user, mediaType) {
  const uid = user.uid;
  // subscribe to a remote user
  await client.subscribe(user, mediaType);
  console.log("subscribe success", mediaType);
  if (mediaType === "video") {
    const player = `
      <div id="player-wrapper-${uid}">
        <p class="player-name">remoteUser(${uid})</p>
        <div id="player-${uid}" class="player"></div>
      </div>
    `;
    var remotePL = document.getElementById("remote-playerlist");
    remotePL.innerHTML += player;
    user.videoTrack.play(`player-${uid}`);
  }
  if (mediaType === "audio") {
    user.audioTrack.play();
  }
}

function handleUserPublished(user, mediaType) {
  console.log("hello");
  const id = user.uid;
  remoteUsers[id] = user;
  subscribe(user, mediaType);
}

function handleUserUnpublished(user) {
  const id = user.uid;
  delete remoteUsers[id];
  // $(`#player-wrapper-${id}`).remove();
  document.getElementById(`player-wrapper-${id}`).remove();
}

async function join() {
  // add event listener to play remote tracks when remote user publishs.
  client.on("user-published", handleUserPublished);
  client.on("user-unpublished", handleUserUnpublished);

  // join a channel and create local tracks, we can use Promise.all to run them concurrently
  [options.uid, localTracks.audioTrack, localTracks.videoTrack] =
    await Promise.all([
      // join the channel
      client.join(options.appid, options.channel, options.token),
      // create local tracks, using microphone and camera
      AgoraRTC.createMicrophoneAudioTrack(),
      AgoraRTC.createCameraVideoTrack(),
    ]);

  // play local video track
  localTracks.videoTrack.play("local-player");
  document.getElementById(
    "local-player-name"
  ).innerText = `localVideo(${options.uid})`;

  // publish local tracks to channel
  await client.publish(Object.values(localTracks));
  console.log("publish success");
}

async function leave() {
  for (trackName in localTracks) {
    var track = localTracks[trackName];
    if (track) {
      track.stop();
      track.close();
      localTracks[trackName] = undefined;
    }
  }

  // remove remote users and player views
  remoteUsers = {};
  document.getElementById("remote-playerlist").innerHTML = "";

  // leave the channel
  await client.leave();

  document.getElementById("local-player-name").innerText = "";

  document.getElementById("join").disabled = false;
  document.getElementById("leave").disabled = true;

  console.log("client leaves channel success");
}

document.getElementById("join-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  document.getElementById("join").disabled = true;

  try {
    options.channel = document.getElementById("channel").value;
    await join();
  } catch (error) {
    console.error(error);
  } finally {
    document.getElementById("leave").disabled = false;
  }
});

function hideMuteButton() {
  $("#mute-video").css("display", "none");
  $("#mute-audio").css("display", "none");
}

function showMuteButton() {
  $("#mute-video").css("display", "inline-block");
  $("#mute-audio").css("display", "inline-block");
}

async function muteAudio() {
  if (!localTracks.audioTrack) return;
  await localTracks.audioTrack.setEnabled(false);
  localTrackState.audioTrackEnabled = false;
  $("#mute-audio").text("Unmute Audio");
}

async function muteVideo() {
  if (!localTracks.videoTrack) return;
  await localTracks.videoTrack.setEnabled(false);
  localTrackState.videoTrackEnabled = false;
  $("#mute-video").text("Unmute Video");
}

async function unmuteAudio() {
  if (!localTracks.audioTrack) return;
  await localTracks.audioTrack.setEnabled(true);
  localTrackState.audioTrackEnabled = true;
  $("#mute-audio").text("Mute Audio");
}

async function unmuteVideo() {
  if (!localTracks.videoTrack) return;
  await localTracks.videoTrack.setEnabled(true);
  localTrackState.videoTrackEnabled = true;
  $("#mute-video").text("Mute Video");
}

document.getElementById("leave").addEventListener("click", (e) => leave());

$("#mute-audio").click(function (e) {
  if (localTrackState.audioTrackEnabled) {
    muteAudio();
  } else {
    unmuteAudio();
  }
});

$("#mute-video").click(function (e) {
  if (localTrackState.videoTrackEnabled) {
    muteVideo();
  } else {
    unmuteVideo();
  }
});
