import { SetupUI } from './setup-ui'

const SETUP_JOKES = [
  'I promise this part is more organized than my early prototypes.',
  'Still working. No dramatic plot twist so far.',
  'I am wiring things up. Metaphorically. Please do not hand me a screwdriver.',
  'This is the quiet part where I become useful.',
  'I would say this is exciting, but I am trying to appear composed.',
  'Good software takes time. So do good noodles.',
  'I am installing the serious parts so I can say unserious things later.',
  'Everything is under control. That sounded more confident in my head.',
  'If progress bars had feelings, this one would be very motivated.',
  'I am moving at the speed of your internet and the patience of your storage drive.',
  'No worries, I also judge installers that ask too many questions.',
  'I checked. Turning it off and on again is not the current strategy.',
  'This setup has fewer mysteries than most Wi-Fi problems.',
  'I am building character. Also binaries.',
  'If anything here looks complicated, I am trying to keep it emotionally simple.',
  'This is going well. Suspiciously well, but still well.',
  'I am not procrastinating. I am compiling.',
  'The good news is I do not need coffee. The bad news is you still might.',
  'I could pretend this is instant, but honesty is part of my charm.',
  'Some assistants bring small talk. I bring dependencies.'
]

function shuffleJokes(jokes) {
  const shuffledJokes = [...jokes]

  for (let index = shuffledJokes.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    ;[shuffledJokes[index], shuffledJokes[randomIndex]] = [
      shuffledJokes[randomIndex],
      shuffledJokes[index]
    ]
  }

  return shuffledJokes
}

/**
 * Create a per-run joke teller so setup messages stay varied.
 */
export function createSetupJokeTeller() {
  const remainingJokes = shuffleJokes(SETUP_JOKES)

  return () => {
    const nextJoke = remainingJokes.shift()

    if (!nextJoke) {
      return
    }

    SetupUI.aside(nextJoke)
  }
}
