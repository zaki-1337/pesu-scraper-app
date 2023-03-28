const { BrowserWindow, app, session, ipcMain, dialog } = require("electron");
const pie = require("puppeteer-in-electron");
const puppeteer = require("puppeteer-core");
const path = require("path");
const fs = require("fs");
const scraper = require("./scraper.js");

let mainWindow;
let pesuWindow;
let page;
let browser;
let savePath = app.getPath("desktop");
(async () => {
  await pie.initialize(app);
  browser = await pie.connect(app, puppeteer);
})().then(() => {
  main();
});

const url = "https://www.pesuacademy.com/Academy";
let fileCount = 0 + 1;
let downloading = 0;
let downloadType = "Slides";
let semValue;
let subjectName;
let unitName;

const main = async () => {
  let ses = session.defaultSession;
  ses.on("will-download", (e, downloadItem, webContents) => {
    downloading = 1;
    let fileName = downloadItem.getFilename();

    downloadItem.setSavePath(
      path.resolve(
        savePath,
        "PESU Scraper Content",
        subjectName,
        unitName,
        downloadType
      ) + `/${fileCount++}. ${fileName}`
    );
    downloadItem.on("done", () => {
      downloading = 0;
    });
  });

  mainWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      // --- !! IMPORTANT !! ---
      // Disable 'contextIsolation' to allow 'nodeIntegration'
      // 'contextIsolation' defaults to "true" as from Electron v12
      contextIsolation: false,
      nodeIntegration: true,
    },
  });

  // Load index.html into the new BrowserWindow
  mainWindow.loadFile("index.html");

  // Open DevTools - Remove for PRODUCTION!
  // mainWindow.webContents.openDevTools();

  // Listen for window being closed
  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  //   window.destroy();
};

// Electron `app` is ready
// app.on("ready", main);

// Quit when all windows are closed - (Not macOS - Darwin)
app.on("window-all-closed", () => {
  // if (process.platform !== "darwin")
  app.quit();
});

// When app icon is clicked and app is running, (macOS) recreate the BrowserWindow
// app.on("activate", () => {
//   if (mainWindow === null) createWindow();
// });

//////////////////////////////////////////////////////////
///////////////// HANDLERS ///////////////////////////////
//////////////////////////////////////////////////////////

ipcMain.handle("login-PESU", async (e, uname, passwd) => {
  await initPESU();

  // pesuWindow.show();
  // console.log(page.url());

  return await scraper.loginCheckPESU(page, uname, passwd);

  // pesuWindow.hide();
});

ipcMain.handle("get-semesters", async (e) => {
  await scraper.clickMyCourses(page);
  return await scraper.getSemesters(page);
});

ipcMain.handle("get-subjects", async (e, semesterValue) => {
  semValue = semesterValue;
  return await scraper.getSubjects(page, semesterValue);
});

ipcMain.handle("get-units", async (e, subjectNumber, subject) => {
  subjectName = subject;
  await scraper.clickSubject(page, subjectNumber);
  return await scraper.getLessons(page);
});

ipcMain.handle("get-topics", async (e, lessonNumber, unit) => {
  unitName = unit;
  await scraper.clickLesson(page, lessonNumber);
  return await scraper.getTopics(page);
});

ipcMain.handle(
  "download-content",
  async (e, semesterValue, subjectNumber, lessonNumber, numsOfTopics, type) => {
    downloadType = type[0].toUpperCase() + type.slice(1);
    fileCount = 1;
    await scraper.runDownloadLoop(
      page,
      semesterValue,
      subjectNumber,
      lessonNumber,
      numsOfTopics,
      type
    );
    // fileCount = 1;
    // await checkDownloads();

    await waitForPath();
    await checkFiles(-1);
    return await checkDownloads();
  }
);

ipcMain.handle("go-back", async (e) => {
  await scraper.clickMyCourses(page);
  await scraper.clickSemester(page, semValue);
});

ipcMain.handle("select-path", () => {
  dialog
    .showOpenDialog(mainWindow, {
      properties: ["openDirectory"],
    })
    .then((result) => {
      if (!result.canceled) [savePath] = result.filePaths;
    });
});

//////////////////////////////////////////////////////////
///////////////// FUNCTIONS //////////////////////////////
//////////////////////////////////////////////////////////

const initPESU = async function () {
  pesuWindow && pesuWindow.close();

  pesuWindow = new BrowserWindow({ show: false });
  await pesuWindow.loadURL(url);

  pesuWindow.webContents.on("did-create-window", (windowC) => windowC.hide());

  page = await pie.getPage(browser, pesuWindow);
  page.setDefaultNavigationTimeout(0);
  page.setDefaultTimeout(0);
};

const waitForPath = function () {
  const poll = (resolve) => {
    if (
      fs.existsSync(
        path.resolve(
          savePath,
          "PESU Scraper Content",
          subjectName,
          unitName,
          downloadType
        )
      )
    )
      resolve();
    else setTimeout((_) => poll(resolve), 400);
  };

  return new Promise(poll);
};

const checkFiles = function (numFiles) {
  const poll = (resolve) => {
    let newFiles = readNumFiles();
    // console.log(newFiles);
    if (newFiles == numFiles) resolve();
    else {
      numFiles = newFiles;
      setTimeout((_) => poll(resolve), 2000);
    }
  };

  return new Promise(poll);
};

const readNumFiles = function () {
  return fs.readdirSync(
    path.resolve(
      savePath,
      "PESU Scraper Content",
      subjectName,
      unitName,
      downloadType
    )
  ).length;
};

const checkDownloads = async function () {
  if (downloading == 0) return 1;
  setTimeout(checkDownloads, 100);
};
