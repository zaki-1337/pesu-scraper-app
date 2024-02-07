////////////////////////////////////////////////////
//////////// FUNCTION DEFINITIONS //////////////////
////////////////////////////////////////////////////

// in case PESU Academy logs the user out for inactivity
let userNameC;
let passWordC;

exports.loginCheckPESU = async function (
  page,
  userName = userNameC,
  passWord = passWordC
) {
  userNameC = userName;
  passWordC = passWord;

  await page.type("#j_scriptusername", userName);
  await page.type(
    "body > div.login-body > div:nth-child(1) > div > div.login-form > form > fieldset > div:nth-child(3) > input",
    passWord
  );

  await page.click(
    "body > div.login-body > div:nth-child(1) > div > div.login-form > form > fieldset > div:nth-child(4)"
  );

  await page.waitForFunction(() => {
    if (
      document.querySelector(".login-msg")?.textContent ==
        "Your Username and Password do not match" ||
      document.querySelector(".login-msg")?.textContent == "User doesn't exist"
    )
      return 1;
    if (document.querySelector("#menuTab_653 > a > span.menu-name")) return 1;
  });

  // try {
  //   await page.waitForSelector("#menuTab_653 > a > span.menu-name", {
  //     timeout: 2000,
  //   });
  //   return 1;
  // } catch {
  //   return await page.evaluate(() => {
  //     if (
  //       document.querySelector(".login-msg")?.textContent ==
  //         "Your Username and Password do not match" ||
  //       document.querySelector(".login-msg")?.textContent ==
  //         "User doesn't exist"
  //     )
  //       return 0;
  //   });
  // }

  await page.waitForSelector("#menuTab_653 > a > span.menu-name,.login-msg");
  return await page.evaluate(() => {
    if (
      document.querySelector(".login-msg")?.textContent ==
        "Your Username and Password do not match" ||
      document.querySelector(".login-msg")?.textContent == "User doesn't exist"
    )
      return 0;
    if (document.querySelector("#menuTab_653 > a > span.menu-name")) return 1;
  });
};

exports.clickMyCourses = async function (page) {
  while (true) {
    try {
      await page.waitForFunction(() => {
        if (document.querySelector(".blockUI")) return 0;
        if (document.querySelector("#menuTab_653 > a > span.menu-name"))
          return 1;
      });
      break;
    } catch {}
  }

  // click "My Courses"
  await page.waitForSelector("#menuTab_653 > a > span.menu-name");
  await page.$eval("#menuTab_653 > a > span.menu-name", (elem) => elem.click());
};

exports.getSemesters = async function (page) {
  // Get All Subjects
  await page.waitForSelector("#semesters option");
  return await page.evaluate(() => {
    const semestersOptions = document.querySelectorAll("#semesters > option");
    let semesters = {};
    semestersOptions.forEach((sem) => (semesters[sem.label] = sem.value));
    return semesters;
  });
};

exports.clickSemester = async function (page, semesterValue) {
  await page.waitForSelector("#semesters option");

  const previousSem = await page.evaluate(() => {
    return document.querySelector("#semesters").value;
  });

  if (semesterValue == previousSem) return;

  await page.waitForSelector(".table");
  const prevSubjects = await page.evaluate(() => {
    const mainSubjects = document.querySelectorAll(".table tbody tr");
    let subjects = [];
    mainSubjects.forEach((sub) => subjects.push(sub.innerText));
    return subjects;
  });

  await page.evaluate((semVal) => {
    const selectorElement = document.querySelector("#semesters");
    selectorElement.value = semVal;
    const eventManual = new Event("change", { bubbles: true });
    selectorElement.dispatchEvent(eventManual);
  }, semesterValue);

  await page.waitForFunction(
    (prevSub1) => {
      if (
        document
          .querySelector("#CourseContentId h3")
          ?.textContent.includes("No information available")
      )
        return true;
      if (prevSub1 != document.querySelector(".table tbody tr").innerText)
        return true;
      return false;
    },
    {},
    prevSubjects[0]
  );
};

exports.getSubjects = async function (page, semesterValue) {
  // Get All Subjects
  await module.exports.clickSemester(page, semesterValue);
  await page.waitForSelector(".table");
  return await page.evaluate(() => {
    const mainSubjects = document.querySelectorAll(".table tbody tr");
    let subjects = [];
    mainSubjects.forEach((sub) => subjects.push(sub.innerText));
    return subjects.map((e) => e.split("\t")[1]);
  });
};

exports.clickSubject = async function (page, subjectNumber) {
  // click ith subject
  await page.waitForSelector(
    "#getStudentSubjectsBasedOnSemesters > div > div > table > tbody > tr > td"
  );
  await page.$eval(
    `#getStudentSubjectsBasedOnSemesters > div > div > table > tbody > tr:nth-child(${subjectNumber}) > td`,
    (elem) => elem.click()
  );
};

exports.getLessons = async function (page) {
  // Get All Units/Lessons
  await page.waitForSelector(
    ".course-info-content .tab-content #courseUnits #courselistunit li a, .course-info-content .tab-content #courseUnits .text-center"
  );
  return await page.evaluate(() => {
    if (
      document
        .querySelector(
          ".course-info-content .tab-content #courseUnits .text-center"
        )
        ?.textContent.includes("No Units to display")
    )
      return [];

    const mainLessons = document.querySelectorAll(
      ".course-info-content .tab-content #courseUnits #courselistunit li a"
    );
    let lessons = [];
    mainLessons.forEach((sub) => lessons.push(sub.innerText));
    return lessons;
  });
};

exports.clickLesson = async function (page, lessonNumber) {
  // get previous topics (before lesson change)
  if (lessonNumber != 1)
    await page.waitForSelector(
      "#CourseContentId .table tbody tr, #CourseContentId h3"
    );
  const prevTopics = await page.evaluate(() => {
    if (
      document
        .querySelector("#CourseContentId h3")
        ?.textContent.includes("No information available")
    )
      return ["No Content"];

    const topics = document.querySelectorAll(
      "#CourseContentId .table tbody tr"
    );
    let subTopics = [];
    topics.forEach((title) => subTopics.push(title.innerText.split("\t")[0]));
    return subTopics;
  });

  // click ith lesson
  await page.waitForSelector(
    ".course-info-content .tab-content #courseUnits #courselistunit li a"
  );
  await page.$eval(
    `.course-info-content .tab-content #courseUnits #courselistunit li:nth-of-type(${lessonNumber}) a`,
    (elem) => elem.click()
  );

  // check if topics have changed compared to previous ones
  if (lessonNumber != 1)
    await page.waitForFunction(
      (prevTopic1) => {
        if (
          document
            .querySelector("#CourseContentId h3")
            ?.textContent.includes("No information available")
        )
          return true;
        if (
          prevTopic1 !=
          document
            .querySelector("#CourseContentId .table tbody tr")
            ?.innerText.split("\t")[0]
        )
          return true;
        return false;
      },
      {},
      prevTopics[0]
    );
};

exports.getTopics = async function (page) {
  // get all topics
  await page.waitForSelector(
    "#CourseContentId .table tbody tr, #CourseContentId h3"
  );
  return await page.evaluate(() => {
    if (
      document
        .querySelector("#CourseContentId h3")
        ?.textContent.includes("No information available")
    )
      return [];

    const topics = document.querySelectorAll(
      "#CourseContentId .table tbody tr"
    );
    let subTopics = [];
    topics.forEach((title) => subTopics.push(title.innerText?.split("\t")[0]));
    return subTopics;
  });
};

exports.clickTopic = async function (page, topicNumber) {
  // click ith topic
  await page.waitForSelector(
    `#CourseContentId table tbody tr:nth-of-type(${topicNumber})`
  );
  await page.$eval(
    `#CourseContentId table tbody tr:nth-of-type(${topicNumber})`,
    (elem) => elem.click()
  );
};

exports.clickSlidesNotesMenu = async function (page, type) {
  // to handle 'AV summary' section sometimes containing a link which gets selected by the selector
  // let need;
  await page.waitForSelector("#CourseContent .tab-content");
  // need = await page.evaluate(() => {
  //   if (
  //     document.querySelector(
  //       "#CourseContent .tab-content .content-type-area div .col-md-12"
  //     )
  //   )
  //     return 1;
  //   return 0;
  // });

  // click slides / notes
  const ifSlidesOrNotes = type == "slides" ? 3 : 4;
  await page.waitForSelector(
    `#courseMaterialContent > li:nth-child(${ifSlidesOrNotes}) > a`
  );
  await page.$eval(
    `#courseMaterialContent > li:nth-child(${ifSlidesOrNotes}) > a`,
    (elem) => elem.click()
  );

  // wait for tab change
  await page.waitForFunction(
    (ifSlidesOrNotes) => {
      if (
        document.querySelector("#captureCurrentTabVal").value ==
        ifSlidesOrNotes - 1
      )
        return true;
      return false;
    },
    {},
    ifSlidesOrNotes
  );

  // check if the selector is selecting a video link, if so, wait until that changes
  // if (need)
  //   await page.waitForFunction(() => {
  //     if (
  //       document
  //         .querySelector(
  //           "#CourseContent .tab-content .content-type-area div .col-md-12 .link-preview"
  //         )
  //         ?.getAttribute("onclick")
  //         .includes("vimeo") ||
  //       document
  //         .querySelector(
  //           "#CourseContent .tab-content .content-type-area div .col-md-12 .link-preview"
  //         )
  //         ?.getAttribute("onclick")
  //         .includes("openExternalContent")
  //     )
  //       return false;
  //     else return true;
  //   });
};

exports.runDownloadLoop = async function (
  page,
  semesterValue,
  subjectNumber,
  lessonNumber,
  numsOfTopics,
  type = "slides"
) {
  let count = 1;
  const run = async () => {
    if (count > numsOfTopics) return; // stop
    await module.exports.clickTopic(page, count);
    await module.exports.clickSlidesNotesMenu(page, type);
    const toWait = await module.exports.downloadSlides(page);
    await module.exports.clickMyCourses(page);
    await module.exports.clickSemester(page, semesterValue);
    await module.exports.clickSubject(page, subjectNumber);
    await module.exports.clickLesson(page, lessonNumber);
    count++;
    if (toWait) await setTimeout(run, toWait * 1000);
    else await run();
  };
  await run();
};

exports.downloadSlidesOld = async function (page) {
  // Download Type: Both
  try {
    await page.waitForSelector(
      ".tab-content > div > div > iframe,.tab-content > div > iframe, .content-type-area .link-preview iframe,#CourseContent .tab-content .content-type-area .link-preview",
      { timeout: 1000 }
    );
  } catch {
    if (
      await page.evaluate(() => {
        if (
          document.querySelector(".tab-content > .tab-pane > h2")?.innerText ==
            "No Slides Content to Display" ||
          document.querySelector(".tab-content > .tab-pane > h2")?.innerText ==
            "No Notes Content to Display"
        )
          return 1;
        else return 0;
      })
    )
      return;
    else {
      return downloadSlides(page);
    }
  }
  return await page.evaluate(() => {
    let downloadArr = document.querySelectorAll(
      "#CourseContent .tab-content .content-type-area div"
    );
    // filter duplicate elements belonging to same row
    downloadArr = Array.from(downloadArr).filter((el) =>
      el.querySelector(".col-md-12 , iframe")
    );
    // replaced forEach with function because needed to implement timeOut to fix multiple slides in a page not downloading properly
    let countEle = 0;
    const clickIt = () => {
      if (countEle >= downloadArr.length) return; // stop
      if (downloadArr[countEle].querySelector("iframe.elem-fullscreen")) {
        const btn = document.createElement("a");
        btn.setAttribute(
          "href",
          downloadArr[countEle].querySelector("iframe.elem-fullscreen").src
        );
        btn.setAttribute("download", "FILE_NAME");
        btn.click();
      } else downloadArr[countEle].querySelector(".link-preview").click();
      countEle++;
      // if (countEle >= downloadArr.length) return;
      setTimeout(clickIt, 1000);
    };
    clickIt();
    return downloadArr.length - 1;
  });
};

///////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////

exports.downloadSlides = async function (page) {
  // Download Type: Both

  // await page.waitForSelector(
  //   ".tab-content > div > div > iframe,.tab-content > div > iframe, .content-type-area .link-preview iframe,#CourseContent .tab-content .content-type-area .link-preview, .tab-content > .tab-pane > h2, #CourseContent .tab-content .content-type-area div, .tab-content > .tab-pane > h2"
  // );
  await page.waitForSelector(
    "#CourseContent .tab-content .content-type-area div iframe.elem-fullscreen, #CourseContent .tab-content .content-type-area div .link-preview, .tab-content > .tab-pane > h2, #CourseContent .tab-content .content-type-area .link-preview"
  );

  await page.waitForFunction(() => {
    if (
      document
        .querySelector(".tab-content > .tab-pane > h2")
        ?.innerText.includes("No AV Summary Content to Display")
    )
      return false;
    else return true;
  });

  return await page.evaluate(() => {
    if (
      document.querySelector(".tab-content > .tab-pane > h2")?.innerText ==
        "No Slides Content to Display" ||
      document.querySelector(".tab-content > .tab-pane > h2")?.innerText ==
        "No Notes Content to Display"
    )
      return;

    let downloadArr = document.querySelectorAll(
      "#CourseContent .tab-content .content-type-area div"
    );
    // filter duplicate elements belonging to same row
    downloadArr = Array.from(downloadArr).filter((el) =>
      el.querySelector(".col-md-12 , iframe")
    );

    // replaced forEach with function because needed to implement timeOut to fix multiple slides in a page not downloading properly
    let countEle = 0;
    const clickIt = () => {
      if (countEle >= downloadArr.length) return; // stop
      if (downloadArr[countEle].querySelector("iframe.elem-fullscreen")) {
        const btn = document.createElement("a");
        btn.setAttribute(
          "href",
          downloadArr[countEle].querySelector("iframe.elem-fullscreen").src
        );
        btn.setAttribute("download", "FILE_NAME");
        btn.click();
      } else if (
        downloadArr[countEle]
          .querySelector("a")
          ?.getAttribute("onclick")
          ?.includes("loadIframe")
      ) {
        let str = downloadArr[countEle]
          .querySelector("a")
          ?.getAttribute("onclick");
        let startI = str.indexOf("'");
        let endI = str.indexOf("'", startI + 1);
        let result = str.substring(startI + 1, endI);

        console.log(result);

        const btn = document.createElement("a");
        btn.setAttribute("href", result);
        btn.setAttribute("download", "FILE_NAME");
        btn.click();
      } else if (
        !downloadArr[countEle]
          .querySelector(".link-preview")
          ?.getAttribute("onclick")
          ?.includes("drive.google.com")
      ) {
        downloadArr[countEle].querySelector(".link-preview").click();
      }

      countEle++;
      // if (countEle >= downloadArr.length) return;
      setTimeout(clickIt, 1000);
    };
    clickIt();
    return downloadArr.length - 1;
  });
};
