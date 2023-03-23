// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
const { ipcRenderer } = require("electron");

const windowLoginParent = document.querySelector(".window");
const loginWindow = document.querySelector(".loginWindow");

const loginBtn = document.querySelector("#login");
const submitBtn = document.querySelector("#submit-button");
const backBtn = document.querySelector("#back");
const slidesBtn = document.querySelector("#slides");
const notesBtn = document.querySelector("#notes");
const subjectsList = document.querySelector("#subjectList");
const unitsList = document.querySelector("#unitList");
const topicsList = document.querySelector("#topicList");
const pathBtn = document.querySelector("#select-path");
const spanner = document.querySelector(".spanner");

let state = "atlogin";

let subjectNumber;
let subjects = [];
let lessonNumber;
let units = [];
let numsOfTopics;

submitBtn.addEventListener("click", async function (e) {
  e.preventDefault();

  submitBtn.disabled = true;
  document.querySelector("#login-fail").style.display = "none";

  const uname = document.querySelector("#unameField").value;
  const passwd = document.querySelector("#passwdField").value;

  const validCreds = await ipcRenderer.invoke("login-PESU", uname, passwd);
  submitBtn.disabled = false;

  if (!validCreds) {
    document.querySelector("#login-fail").style.display = "flex";
    return;
  }

  spanner.classList.toggle("show");
  loginBtn.style.display = "none";
  pathBtn.style.display = "flex";
  loginWindow.style.display = "none";
  windowLoginParent.style.display = "none";
  document.querySelector("#login-fail").style.display = "none";

  subjects = await ipcRenderer.invoke("get-subjects");

  subjects.forEach(function (sub, i) {
    const html = `<div class="subject" data-subno=${i + 1}>${
      i + 1
    }. ${sub}</div>`;

    subjectsList.insertAdjacentHTML("beforeend", html);
  });

  subjectsList.style.display = "flex";
  spanner.classList.toggle("show");

  state = "atsubjects";
});

loginBtn.addEventListener("click", async () => {
  spanner.classList.toggle("show");
  loginBtn.style.display = "none";
  loginWindow.style.display = "none";
  windowLoginParent.style.display = "none";

  subjects = await ipcRenderer.invoke("check-login");

  subjects.forEach(function (sub, i) {
    const html = `<div class="subject" data-subno=${i + 1}>${
      i + 1
    }. ${sub}</div>`;

    subjectsList.insertAdjacentHTML("beforeend", html);
  });

  subjectsList.style.display = "flex";
  pathBtn.style.display = "flex";
  spanner.classList.toggle("show");

  state = "atsubjects";
});

subjectsList.addEventListener("click", async function (e) {
  if (e.target.classList.contains("subject")) {
    subjectNumber = e.target.dataset.subno;

    spanner.classList.toggle("show");
    subjectsList.style.display = "none";

    unitsList.innerHTML = "";

    units = await ipcRenderer.invoke(
      "get-units",
      subjectNumber,
      subjects[subjectNumber - 1]
    );

    if (units.length == 0) {
      const html = "<div>No Content Found</div>";

      unitsList.insertAdjacentHTML("beforeend", html);
    } else {
      units.forEach(function (unit, i) {
        const html = `<div class="unit" data-unitno=${i + 1}>${
          i + 1
        }. ${unit}</div>`;

        unitsList.insertAdjacentHTML("beforeend", html);
      });
    }

    unitsList.style.display = "flex";
    spanner.classList.toggle("show");
  }

  backBtn.style.display = "flex";
  state = "atunits";
});

unitsList.addEventListener("click", async function (e) {
  if (e.target.classList.contains("unit")) {
    lessonNumber = e.target.dataset.unitno;
    spanner.classList.toggle("show");
    unitsList.style.display = "none";

    topicsList.innerHTML = "";

    const topics = await ipcRenderer.invoke(
      "get-topics",
      lessonNumber,
      e.target.innerText
    );

    numsOfTopics = topics.length;

    if (numsOfTopics == 0) {
      const html = "<div>No Content Found</div>";

      topicsList.insertAdjacentHTML("beforeend", html);
    } else {
      topics.forEach(function (topic, i) {
        const html = `<div class="topic" data-topicno=${i + 1}>${
          i + 1
        }. ${topic}</div>`;

        topicsList.insertAdjacentHTML("beforeend", html);
      });

      slidesBtn.style.display = "flex";
      notesBtn.style.display = "flex";
    }

    topicsList.style.display = "flex";
    backBtn.style.display = "flex";
    spanner.classList.toggle("show");

    state = "attopics";
  }
});

backBtn.addEventListener("click", async function () {
  if (state == "attopics") {
    slidesBtn.style.display = "none";
    notesBtn.style.display = "none";
    spanner.classList.toggle("show");

    await ipcRenderer.invoke("go-back");
    await ipcRenderer.invoke(
      "get-units",
      subjectNumber,
      subjects[subjectNumber - 1]
    );

    subjectsList.style.display = "none";
    topicsList.style.display = "none";
    unitsList.style.display = "flex";
    spanner.classList.toggle("show");

    state = "atunits";
  } else if (state == "atunits") {
    backBtn.style.display = "none";
    spanner.classList.toggle("show");

    await ipcRenderer.invoke("go-back");

    subjectsList.style.display = "flex";
    topicsList.style.display = "none";
    unitsList.style.display = "none";
    spanner.classList.toggle("show");

    state = "atsubjects";
  }
});

slidesBtn.addEventListener("click", async function () {
  spanner.classList.toggle("show");
  await ipcRenderer
    .invoke(
      "download-content",
      subjectNumber,
      lessonNumber,
      numsOfTopics,
      "slides"
    )
    .then((res) => {
      if (res) spanner.classList.toggle("show");
    });
});

notesBtn.addEventListener("click", async function () {
  spanner.classList.toggle("show");
  await ipcRenderer.invoke(
    "download-content",
    subjectNumber,
    lessonNumber,
    numsOfTopics,
    "notes"
  );
  spanner.classList.toggle("show");
});

pathBtn.addEventListener("click", async function () {
  await ipcRenderer.invoke("select-path");
});
