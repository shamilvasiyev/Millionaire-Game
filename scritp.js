let currentPosition = 1;
let questions;
let currentQuestion;
let currentPoint = 0;
let currentAnswerId;
let modalOpen = false;
let playerName = "";
let playerList;
let newQuestionIndex;
let oldQuestionsIndex = [];

const COLOR_CODES = {
  info: {
    color: "green",
  },
  alert: {
    color: "red",
    threshold: 10,
  },
};

let TIME_LIMIT = 60;
let timePassed = 0;
let timeLeft = TIME_LIMIT;
let timerInterval = null;
let remainingPathColor = COLOR_CODES.info.color;

/* DOM elements */

const gamePage = document.getElementById("game-page");
const overlay = document.getElementById("overlay");

const pointArray = [
  { id: "15", money: "1,000,000", point: "3000" },
  { id: "14", money: "500,000", point: "2800" },
  { id: "13", money: "250,000", point: "2600" },
  { id: "12", money: "125,000", point: "2400" },
  { id: "11", money: "64,000", point: "2200" },
  { id: "10", money: "32,000", point: "2000" },
  { id: "9", money: "16,000", point: "1800" },
  { id: "8", money: "8000", point: "1600" },
  { id: "7", money: "4000", point: "1400" },
  { id: "6", money: "2000", point: "1200" },
  { id: "5", money: "1000", point: "1000" },
  { id: "4", money: "500", point: "800" },
  { id: "3", money: "300", point: "600" },
  { id: "2", money: "200", point: "400" },
  { id: "1", money: "100", point: "200" },
];

function enterNameHandler() {
  gamePage.innerHTML = `
      <div id="overlay" class="overlay"></div>

      <div id="name-modal" class="name-modal">
        <h1>Oyuna xoş gəlmisiz!</h1>

        <p>Adınızı qeyd edin</p>

        <input type="text" />

        <button id="start-btn" class="hexagon">Başla</button>
      </div>
    `;

  const startBtn = document.getElementById("start-btn");
  const nameInput = document.querySelector("#name-modal input[type=text]");

  startBtn.addEventListener("click", () => {
    if (nameInput.value === "") {
      return;
    }

    playerName = nameInput.value;

    startGame();
  });
}

enterNameHandler();

const startGame = async () => {
  await getPlayersList();

  await fetchQuestionHandler();

  console.log(Object.values(playerList));

  const sorterPlayerList = Object.values(playerList).sort(
    (a, b) => Number(b.score) - Number(a.score)
  );

  gamePage.innerHTML = `
          <div class="ranking-box page-box">
            <h2>Ranking Box</h2>
            <div class="rang-wrapper">
            ${sorterPlayerList
              .map((player, i) => {
                const imgIndex = String(i + 1);

                return `<div class="player-rank blue-hexagon">
                              ${
                                imgIndex <= 3
                                  ? `<img src="./Assests/icons/${imgIndex}.png" alt="" /> <span>${player.name}</span>`
                                  : `<span>${imgIndex}. ${player.name}</span>`
                              }
                          </div>`;
              })
              .join(" ")}
            </div>
          </div>
          <div class="help-box page-box">
            <button id="1" class="help-button-container">
              <img src="./Assests/icons/50.png" alt="" />
            </button>
            <button id="2" class="help-button-container">
              <img src="./Assests/icons/phone-call.png" alt="" />
            </button>
            <button id="3" class="help-button-container">
              <img src="./Assests/icons/contacts.png" alt="" />
            </button>
          </div>
     
      <div class="current-position">
            ${pointArray
              .map(
                (point) =>
                  `<div id="${point.id}" class="point-wrapper ${
                    point.id == currentPosition
                      ? "hexagon-orange"
                      : "blue-hexagon"
                  }">
                    <span class="money">${point.money} $</span>
                    <div class="player-point">
                        <img src="./Assests/icons/point.png" alt="" />
                        <span>${point.point}</span>
                    </div>
                </div>`
              )
              .join(" ")}
      </div>
      
      <div class="query-wrapper">
          <div class="question blue-hexagon">
          <p>${currentQuestion.title}</p>
          </div>
          <div class="answer-container">
              ${currentQuestion.answers
                .map(
                  (a) => `
                  <button id="${a.id}" class="answer blue-hexagon">${a.answer}</button>`
                )
                .join(" ")}
          </div>
      </div>

      <div id="time" class="time"></div>

      <div class="overlay" id="overlay" style="display:none"></div>

      <div class="alert-box page-box" id="alert-box" style="display:none"></div>

      <div class="help-box-content" style="display:none"></div>
      `;

  if (currentPosition === 1) {
    clickAnswer();
  }

  setTime();

  useHelp();
};

function timerDefaultValues() {
  TIME_LIMIT = 60;
  timePassed = 0;
  timeLeft = TIME_LIMIT;
  timerInterval = null;
  remainingPathColor = COLOR_CODES.info.color;
}

const setTime = () => {
  timerDefaultValues();

  document.getElementById("time").innerHTML = `
    <div class="base-timer">
      <svg class="base-timer__svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <g class="base-timer__circle">
          <circle class="base-timer__path-elapsed" cx="50" cy="50" r="45"></circle>
          <path
            id="base-timer-path-remaining"
            stroke-dasharray="283"
            class="base-timer__path-remaining ${remainingPathColor}"
            d="
              M 50, 50
              m -45, 0
              a 45,45 0 1,0 90,0
              a 45,45 0 1,0 -90,0
            "
          ></path>
        </g>
      </svg>
      <span id="base-timer-label" class="base-timer__label">60</span>
    </div>
    `;

  startTimer();
};

function onTimesUp() {
  clearInterval(timerInterval);
}

function startTimer() {
  timerInterval = setInterval(() => {
    timePassed += 1;
    timeLeft = TIME_LIMIT - timePassed;
    document.getElementById("base-timer-label").innerHTML =
      formatTime(timeLeft);

    setCircleDasharray();
    setRemainingPathColor(timeLeft);

    timeAlert(timeLeft);

    if (timeLeft === 0) {
      onTimesUp();
    }
  }, 1000);
}

function formatTime(time) {
  let seconds = time % 60;

  if (seconds < 10) {
    seconds = `0${seconds}`;
  }

  return `${seconds === "00" ? (seconds = "60") : seconds}`;
}

function setRemainingPathColor(timeLeft) {
  const { alert, info } = COLOR_CODES;

  if (timeLeft <= alert.threshold) {
    document
      .getElementById("base-timer-path-remaining")
      .classList.remove(info.color);
    document
      .getElementById("base-timer-path-remaining")
      .classList.add(alert.color);
  }
}

function calculateTimeFraction() {
  const rawTimeFraction = timeLeft / TIME_LIMIT;
  return rawTimeFraction - (1 / TIME_LIMIT) * (1 - rawTimeFraction);
}

function setCircleDasharray() {
  const circleDasharray = `${(calculateTimeFraction() * 283).toFixed(0)} 283`;

  document
    .getElementById("base-timer-path-remaining")
    .setAttribute("stroke-dasharray", circleDasharray);
}

const clickAnswer = () => {
  const answerContainer =
    document.getElementsByClassName("answer-container")[0];

  answerContainer.addEventListener("click", function (e) {
    e = e.target;

    if (e.nodeName === "BUTTON") {
      currentAnswerId = e.id;
    } else return;

    openModal();
  });
};

const openModal = () => {
  const overlay = document.getElementById("overlay");
  const alertBox = document.getElementById("alert-box");

  alertBox.innerHTML = `
        <h3>Seçdiyiniz variantı təsdiq edirsiniz?</h3>
        <div id="alert-answer-box" class="alert-answer-box">
           <button id="accept">Bəli</button>

            <button id="reject">Xeyr</button>
         </div>`;

  overlay.style.display = "block";
  alertBox.style.display = "block";

  const acceptBtn = document.getElementById("accept");
  const rejectBtn = document.getElementById("reject");

  acceptBtn.addEventListener("click", checkAnswer);
  rejectBtn.addEventListener("click", closeModal);
};

const closeModal = () => {
  const overlay = document.getElementById("overlay");
  const alertBox = document.getElementById("alert-box");

  overlay.style.display = "none";
  alertBox.style.display = "none";
};

const checkAnswer = async (e) => {
  const alertBox = document.getElementById("alert-box");
  const alertBoxHeader = alertBox.querySelector("h3");
  const alertButtons = document.getElementById("alert-answer-box");
  const time = document.getElementById("time");

  const clickedAnswer = currentQuestion.answers[currentAnswerId - 1];

  const trueAnswerAudio = new Audio("./sounds/correct-answer.mp3");
  const wrongAnswerAudio = new Audio("./sounds/wrong-answer.mp3");

  if (clickedAnswer.trueAnswer) {
    if (currentPosition < 15) {
      currentPosition += 1;
      currentPoint += 200;
    } else {
      trueAnswerAudio.play();

      const text = "Təbriklər 1 milyon dollar qazandınız";

      onTimesUp();

      endGame(text);

      return;
    }

    trueAnswerAudio.play();

    generateNumber();

    onTimesUp();

    timerDefaultValues();

    nextQuestion();

    alertBoxHeader.textContent = `Sualı dogru cavablandırdınız.`;
    alertBoxHeader.style.margin = 0;
    alertButtons.style.display = "none";

    setTimeout(() => {
      trueAnswerAudio.pause();
      closeModal();

      setTime();
    }, 4000);
  } else {
    wrongAnswerAudio.play();

    onTimesUp();

    const text = "Oyun bitti";

    endGame(text);
  }
};

const nextQuestion = () => {
  const question = document.getElementsByClassName("question")[0];
  const answer = document.querySelectorAll(".answer");

  const pointsBox = document.querySelectorAll(".point-wrapper");

  question.textContent = currentQuestion.title;

  answer.forEach((a, i) => {
    a.textContent = currentQuestion.answers[i].answer;
    a.removeAttribute("disabled", "");
  });

  pointsBox.forEach((point) => {
    point.classList.replace("hexagon-orange", "blue-hexagon");

    if (point.id == currentPosition) {
      point.classList.remove("blue-hexagon");
      point.classList.add("hexagon-orange");
    }
  });

  clickAnswer();
};

const useHelp = () => {
  const helpButtons = document.querySelectorAll(".help-button-container");

  helpButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      btn.classList.add("help-button-container-disabled");
      btn.setAttribute("disabled", "");
      const overlay = document.getElementById("overlay");

      if (btn.id === "1") {
        const answers = document.querySelectorAll(".answer");

        const falseAnswers = currentQuestion.answers.filter(
          (question) => question.trueAnswer === undefined
        );

        const firstFalseAnswerId = falseAnswers[0].id;
        const secondFalseAnswerId = falseAnswers[1].id;

        answers.forEach((a) => {
          if (a.id === firstFalseAnswerId || a.id === secondFalseAnswerId) {
            a.setAttribute("disabled", "");
            a.textContent = "";
          }
        });
      } else if (btn.id === "2") {
        overlay.style.display = "block";
        const callingBox =
          document.getElementsByClassName("help-box-content")[0];
        callingBox.style.display = "block";

        const trueAnswer = currentQuestion.answers.find((a) => a.trueAnswer);

        callingBox.innerHTML = `
          <h4>Dostunuza zəng edilir</h4>

          <div class="calling-content">
            <img id="calling-box-image" src="./Assests/gifs/calling.gif" alt="" />
          </div>
        `;

        const calling = new Audio("./sounds/calling.mp3");
        calling.play();

        setTimeout(() => {
          const callingBoxContent =
            document.getElementsByClassName("calling-content")[0];

          calling.pause();

          callingBoxContent.innerHTML = `
            <p>Dostunuzun cavabı <span class="friendAnswer">${trueAnswer.answer}</span> variantıdır</p>
          `;
        }, 6000);

        closeHelpModal();
      } else if (btn.id === "3") {
        overlay.style.display = "block";
        const chartBox = document.getElementsByClassName("help-box-content")[0];
        chartBox.style.display = "block";

        chartBox.innerHTML = `
              <p id="cart-line"></p>
              <p id="cart-line"></p>
              <p id="cart-line"></p>
              <p id="cart-line"></p>
              <p id="cart-line"></p>
              <p id="cart-line"></p>
              <p id="cart-line"></p>
              <p id="cart-line"></p>
              <p id="cart-line"></p>
              <p id="cart-line"></p>

              <div id="chart-answers">
                <div class="chart-simple-answer">
                  <div class="cart-answer-column" id="1"></div>

                  <p>A</p>
                </div>

                <div class="chart-simple-answer">
                  <div class="cart-answer-column" id="2"></div>

                  <p>B</p>
                </div>

                <div class="chart-simple-answer">
                  <div class="cart-answer-column" id="3"></div>

                  <p>C</p>
                </div>

                <div class="chart-simple-answer">
                  <div class="cart-answer-column" id="4"></div>

                  <p>D</p>
                </div>
              </div>
          `;

        setChartBoxData();
      }
    });
  });
};

const setChartBoxData = () => {
  const chart = document.getElementsByClassName("help-box-content")[0];
  const cartBoxColums = document.querySelectorAll(".cart-answer-column");

  setTimeout(() => {
    document.getElementById("cart-line").remove();

    const chartPercentageBox = `<div class="cart-answer-percentage">
      ${currentQuestion.answers
        .map(
          (answer) => `<span>
          ${answer.trueAnswer ? "40%" : "20%"}
      </span>`
        )
        .join(" ")}
    </div>`;

    cartBoxColums.forEach((column, index) => {
      const trueAnswer = currentQuestion.answers[index].trueAnswer;

      if (trueAnswer) {
        column.style.height = "104px";
        column.style.translate = "-7px -104px";
      } else {
        column.style.height = "52px";
        column.style.translate = "-7px -52px";
      }
    });

    chart.insertAdjacentHTML("afterbegin", chartPercentageBox);
  }, 3000);

  closeHelpModal();
};

const closeHelpModal = () => {
  setTimeout(() => {
    document.getElementById("overlay").style.display = "none";
    document.getElementsByClassName("help-box-content")[0].style.display =
      "none";
  }, 10000);
};

const timeAlert = (time) => {
  const warningBox = `
    <div id="time-alert" class="time-alert-active">
      <p>Sualı cavablandırmaq üçün ${time} saniyə vaxtınız qaldı</p>
    </div>
  `;

  if (time === 15) {
    gamePage.insertAdjacentHTML("afterbegin", warningBox);

    setTimeout(() => {
      document.getElementById("time-alert").removeAttribute("class");
    }, 5000);
  } else if (time === 0) {
    const timePassedText =
      "60 saniyə vaxtınız doldu. Heç bir variantı seçmədiniz";

    endGame(timePassedText);
  }
};

const endGame = (text) => {
  oldQuestionsIndex = [];

  gamePage.innerHTML = `
    <div class="overlay"></div>

    <div id="win-game-alert">
      <h2>${text}</h2>

      <button type="button" class="hexagon ranking-btn">Sıralamaya bax</button>
    </div>
  `;

  const rankingBtn = document.getElementsByClassName("ranking-btn")[0];

  rankingBtn.addEventListener("click", sendPlayerName);
};

const fetchQuestionHandler = async () => {
  const questionResp = await fetch(
    `https://react-http-request-7c7ef-default-rtdb.firebaseio.com/questions.json`
  );
  const data = await questionResp.json();
  questions = data;

  generateNumber();

  return data;
};

const getPlayersList = async () => {
  const playersResp = await fetch(
    "https://react-http-request-7c7ef-default-rtdb.firebaseio.com/players.json"
  );
  const players = await playersResp.json();

  playerList = players;

  return players;
};

const sendPlayerName = async () => {
  const newPlayerData = {
    id: `${new Date().getTime()}`,
    name: playerName,
    score: currentPoint,
  };

  const sendPlayerData = await fetch(
    "https://react-http-request-7c7ef-default-rtdb.firebaseio.com/players.json",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newPlayerData),
    }
  );
  rankingList(newPlayerData);
};

const rankingList = (newPlayer) => {
  const updatedList = [...Object.values(playerList), newPlayer];
  const newPlayerList = updatedList.sort(
    (a, b) => Number(b.score) - Number(a.score)
  );

  currentPosition = 1;

  currentPosition = 1;

  gamePage.innerHTML = `
    <div class="overlay"></div>

    <div id="ranking-box-wrapper">
      <div class="ranking-box page-box" style="position: relative">
        <h2>Ranking Box</h2>
        <div class="rang-wrapper" style="max-height: 300px">
        ${newPlayerList
          .map((player, i) => {
            const imgIndex = String(i + 1);

            return `<div class="player-rank blue-hexagon" style="width: auto">
                      ${
                        imgIndex <= 3
                          ? `<img src="./Assests/icons/${imgIndex}.png" alt="" /> <span>${player.name}</span>`
                          : `<span>${imgIndex}. ${player.name}</span>`
                      }
                    </div>`;
          })
          .join(" ")}
        </div>
      </div>

      <button class="hexagon new-game-btn">Yeni oyuna başla</button>
    </div>
  `;

  document
    .getElementsByClassName("new-game-btn")[0]
    .addEventListener("click", enterNameHandler);
};

function generateNumber() {
  newQuestionIndex = Math.floor(Math.random() * 45) + 1;

  if (oldQuestionsIndex.includes(newQuestionIndex)) {
    generateNumber();

    return;
  }

  oldQuestionsIndex.push(newQuestionIndex);

  currentQuestion = questions[newQuestionIndex];
}
