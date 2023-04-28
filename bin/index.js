#! /usr/bin/env node
import inquirer from "inquirer";
import gradient from "gradient-string";
import chalkAnimation from "chalk-animation";
import figlet from "figlet";
import { createSpinner } from "nanospinner";
import axios from "axios";

let playerName;
let difficulty_level;
let word;
let guessCount;
let gameOver = false;
const displayedWord = [];
const alphabet = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
];

let guesses = [];
const ui = new inquirer.ui.BottomBar();

// ==> Allows animations to run for 2 seconds
//      Could also use a setTimeout
const sleep = (ms = 2000) => new Promise((r) => setTimeout(r, ms));

async function gameIntro() {
  chalkAnimation.rainbow(`Hello ${playerName}!`);
  await sleep();

  figlet.text(
    "HANGMAN",
    {
      font: "star wars",
    },
    function (err, data) {
      if (err) {
        console.log("Something went wrong...");
        console.dir(err);
        return;
      }
      console.log(gradient.retro(data));
    }
  );
  await sleep();

  console.log(
    `How to play => 
        Choose your difficulty level.
        Make your guesses.
        If you exceed your guess count (based on level of difficulty), you lose.
        If you guess the word, you win!
      `
  );
}

async function askName() {
  const answers = await inquirer.prompt({
    name: "player_name",
    type: "input",
    message: "What is your name?",
  });
  playerName = answers.player_name || "Player";
  console.clear();
}

async function askDifficulty() {
  const answers = await inquirer.prompt({
    name: "difficulty_level",
    type: "list",
    message: `Hello ${playerName}! Choose your difficulty level (length of word).`,
    choices: [3, 4, 5],
  });
  difficulty_level = answers.difficulty_level;
  switch (answers.difficulty_level) {
    case 3:
      guessCount = 6;
      break;
    case 4:
      guessCount = 7;
      break;
    case 5:
      guessCount = 8;
      break;
  }
  console.log("guessCount: ", guessCount);
  console.clear();
}

async function getWord(lengthOfWord) {
  try {
    const {
      data: [result],
    } = await axios.get(
      `https://random-word-api.vercel.app/api?words=1&length=${lengthOfWord}&type=uppercase`
    );

    word = result.split("");
    // console.log("The word is: ", word.join(""));
    for (let i = 0; i < word.length; i++) {
      displayedWord.push("-");
    }
  } catch (error) {
    console.log("getWord error =>", error);
  }
}

async function askQuestion() {
  const response = await inquirer.prompt({
    name: "letter",
    type: "input",
    message: "Choose a letter!",

    validate: function (input) {
      const done = this.async();
      setTimeout(function () {
        if (input.length !== 1) {
          // Pass the return value in the done callback
          done("Invalid response");

          return;
        }
        console.clear();
        done(null, true);
      }, 1000);
    },
  });

  let uppercaseLetter = response.letter.toUpperCase();
  guesses.push(uppercaseLetter);
  await checkAnswer(uppercaseLetter);
}

async function checkAnswer(letter) {
  let isCorrect = word.includes(letter);
  const spinner = createSpinner("Checking answer...").start();
  if (isCorrect) {
    await sleep();

    alphabet.splice(alphabet.indexOf(letter), 1, "-");
    displayedWord.splice(word.indexOf(letter), 1, letter);
    await checkDuplicateLetters(letter);
    spinner.success({ text: `Got one ${playerName}! ` });
    await checkGameOver();
    ui.log.write(`Guess Count: ${guessCount}`);
    ui.log.write(alphabet.join(" "));
    ui.log.write(displayedWord.join(" "));
  } else {
    await sleep();
    guessCount--;
    alphabet.splice(alphabet.indexOf(letter), 1, "-");
    spinner.stop({
      text: `That letter is not in the word, ${playerName}!`,
    });
    await checkGameOver();

    ui.log.write(`Guess Count: ${guessCount}`);
    ui.log.write(alphabet.join(" "));
    ui.log.write(displayedWord.join(" "));
  }
}

async function checkDuplicateLetters(letterGuess) {
  for (let i = 0; i < word.length; i++) {
    if (word[i] === letterGuess) {
      displayedWord[i] = letterGuess;
    }
  }
}

async function checkGameOver() {
  if (word.join("") === displayedWord.join("")) {
    gameOver = true;
    const msg = `Congratulations ${playerName}! `;
    console.log(`The word is: ${word.join("")}`);

    figlet(msg, (err, data) => {
      console.log(gradient.pastel.multiline(data));
    });
    await sleep();
    process.exit(1);
  }

  // process.exit => if 1 means exited with errors and kill the script.
  //so if 'isCorrect' is true, then continue, otherwise kill the game
  // process.exit(1);

  if (guessCount === 0) {
    // === Make this text fancier 🤵🤵🤵🤵🤵
    gameOver = true;

    console.log(`☠️ ☠️ ☠️ `);
    console.log(`The word is: ${word.join("")}`);
    chalkAnimation.pulse(`GAME OVER`, 0.5);
    await sleep();
    process.exit(1);
  }
}

await askName();
await gameIntro();
await askDifficulty();
await getWord(difficulty_level);

while (!gameOver) {
  await askQuestion();
}

// figlet.fonts(function (err, fonts) {
//   if (err) {
//     console.log("something went wrong...");
//     console.dir(err);
//     return;
//   }
//   console.dir(fonts);
// });
