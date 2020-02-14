import { html, render } from 'lit-html'
import { installRouter } from './node_modules/pwa-helpers/router.js'
import solutions from './solutions'
import config from './config'

const { fetch, FormData } = window

const EXPECTED_SOLUTIONS = 2
const PREVIEW_VOTES_COUNT = 5
let active, slug
let myVote
const cache = []
let selectedSolutions = []

// TODO
function countryName (countryCode) {
  return countryCode
}

const form = document.querySelector('#vote-form')
form.addEventListener('submit', (event) => {
  event.preventDefault()
  event.stopPropagation()
  handleSubmit(event)
  return false
})

async function handleSubmit (event) {
  document.querySelector('button[type=submit]').classList.add('inactive')
  document.querySelector('#prevBtn').classList.add('inactive')
  document.querySelector('#submitting').classList.remove('inactive')
  const data = new FormData(form)
  const draft = {}
  for (const key of data.keys()) { (draft[key] = data.get(key)) }
  draft.solutions = [...selectedSolutions]
  // vote ready to submit
  const castedVoteResponse = await fetch(config.serviceUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(draft)
  })
  document.querySelector('#submitting').classList.add('inactive')
  if (castedVoteResponse.ok) {
    console.log('VOTE SUBMISSION SUCCEEDED')
    document.querySelector('button[type=submit]').classList.add('inactive')
    document.querySelector('#please-confirm').classList.remove('inactive')
  } else {
    console.log('VOTE SUBMISSION FAILED')
    document.querySelector('#prevBtn').classList.remove('inactive')
    document.querySelector('button[type=submit]').classList.remove('inactive')
    // if status 409 - vote for that email exists
    if (castedVoteResponse.status === 409) {
      document.querySelector('#vote-exists').classList.remove('inactive')
    }
  }
}

function updateSelectedSolutions (event) {
  if (event.target.checked) {
    selectedSolutions.push(event.target.value)
  } else {
    selectedSolutions = selectedSolutions.filter(s => s !== event.target.value)
  }
  // update select x more counter
  document.querySelector('.sticky-select span').innerHTML = EXPECTED_SOLUTIONS - selectedSolutions.length
  const solutionElements = document.querySelectorAll('#vote .project-box')
  if (selectedSolutions.length === EXPECTED_SOLUTIONS) {
    document.querySelector('.sticky-select').classList.add('inactive')
    // hide other solutions
    for (const element of solutionElements) {
      if (!selectedSolutions.includes(element.dataset.rank)) {
        element.classList.add('inactive')
      }
    }
  } else {
    document.querySelector('.sticky-select').classList.remove('inactive')
    // show all solutions
    for (const element of solutionElements) {
      element.classList.remove('inactive')
    }
  }
}

;(async () => {
  renderSolutions(solutions)
  installRouter(handleRouting)
  if (window.location.pathname.split('/')[1] === 'voters') {
    const myVoteId = window.location.pathname.split('/')[2]
    if (myVoteId) {
      const myVoteResponse = await fetch(`${config.serviceUrl}/votes/${myVoteId}`)
      myVote = await myVoteResponse.json()
    }
  }
  const statsResponse = await fetch(`${config.serviceUrl}`, { credentials: 'include' })
  const stats = await statsResponse.json()
  const countries = stats.country
  renderVotes(stats)
  handleRouting(window.location)
  for await (const country of countries) {
    await new Promise(resolve => setTimeout(resolve))
    const element = document.querySelector(`#voters-${country.code}`)
    render(countryShortTemplate(country), element)
  }
})()

async function handleRouting (location, event) {
  if (event && event.type === 'click') {
    window.scrollTo(0, 0)
  }
  active = location.pathname.split('/')[1]
  slug = location.pathname.split('/')[2]
  let linkedHeader = true
  if (active === '') {
    document.querySelector('#home').classList.remove('inactive')
    linkedHeader = false
  } else {
    document.querySelector(`#${active}`).classList.remove('inactive')
  }
  renderHeader(linkedHeader)
  if (active === 'voters') {
    if (slug) {
      const template = html`
        <div class="my-vote info-box">Congratulations, you are voter from <strong>${countryName(myVote.nationality)}</strong></div>
        <div class="vertical-line-small"></div>
        ${countryShortTemplate({ code: myVote.nationality, vote: [myVote] })}
      `
      if (document.querySelector('#my-vote')) {
        render(template, document.querySelector('#my-vote'))
      }
    } else {
      if (document.querySelector('#my-vote')) {
        document.querySelector('#my-vote').classList.add('inactive')
      }
    }
  }
  if (active === 'countries' && slug) {
    let country = cache.find(c => c.code === slug)
    if (!country) {
      const countryResponse = await fetch(`${config.serviceUrl}/countries/${slug}`)
      country = await countryResponse.json()
      cache.push(country)
    }
    if (active !== 'countries') return // check again if route didn't change
    renderCountry(country)
    document.querySelector('#country').classList.remove('inactive')
  }
}

function renderHeader (linked = true) {
  let headerTemplate = html`
    Alice in Government
  `
  if (linked) {
    headerTemplate = html`
    <a href="/">
      ${headerTemplate}
    </a>
    `
  }

  render(headerTemplate, document.querySelector('#header'))
}

function solutionTemplate (solution) {
  return html`
    <div class="project-box col-xs-6" data-rank=${solution.rank}>
      <label class="container">
        <h3>${solution.name}</h3>
        <input
          type="checkbox"
          name="solution-${solution.rank}"
          value="${solution.rank}"
          @change="${updateSelectedSolutions}">
        <span class="checkmark"><span>VOTE</span></span>
      </label>      
      <div class="clear"></div>
    </div>
  `
}

function renderSolutions (solutions) {
  const solutionsHeader = html`
      <div class="vertical-line-small"></div>
      <div class="info-box" style="text-align:center">
      Nothing seems to work when it comes to changing politics 
      and that's why we created this platform, so that those making decisions are everyday citizens.
      </div>
      <div class="vertical-line-small"></div>
      <div class="info-box info-box-short" style="text-align:center">
        Over the Internet. <br> Without institutions.
      </div>
      <div class="vertical-line-small"></div>
      <div class="info-box" style="text-align:center">
        Scientists and academics at <a href="https://www.drawdown.org/solutions-summary-by-rank" target="_blank"><u><i>Project Drawdown</i></u></a> -over 200 of them-
        have ranked the top 15 climate change solutions <strong>in order of greatest impact</strong>.
      </div>
      <div class="vertical-line-small not-voted"></div>
      <div class="info-box info-box-medium not-voted" style="text-align:center">
        <strong>By selecting ${EXPECTED_SOLUTIONS} solutions</strong>,<br>
        we can reach a citizen consensus <br> on climate change priorities.
      </div>
      <div class="vertical-line-small"></div>
  `

  const solutionsTemplate = html`
    ${solutionsHeader}
    ${solutions.map(solutionTemplate)}
  `
  render(solutionsTemplate, document.querySelector('#vote'))
}

function loadMoreLink (country) {
  if (country.count > PREVIEW_VOTES_COUNT) {
    return html`<a href="/countries/${country.code.toLowerCase()}"><i>load more ↓</i></a>`
  }
}

function countryShortTemplate (country) {
  return html`
    <div class="project-box votes">
      <h2>
        ${countryName(country.code)}
      </h2>
      <span class="counter">${country.count} Votes</span>
    </div>
    <div class="project-box solution content">
        <ul class="country-votes">
          ${country.vote.map(voteTemplate)}
        </ul>
        ${loadMoreLink(country)}
    </div>
    <div class="vertical-line"></div>
  `
}

function renderVotes (stats) {
  const pageTemplate = html`
    <div>
      <div class="vertical-line-small"></div>
      <div id="my-vote"></div>
      <div class="project-box solution info-box">
        <h3>Check out what other voters have said:</h3>
        <strong>Total # of Voters</strong>: ---<strong>${stats.global.count}</strong>
        <br>
        <strong>Universities</strong>: ---<strong> ${stats.country.length} </strong>
      </div>
      <div class="vertical-line-small"></div>
      ${stats.country.map(c => html`<div id="voters-${c.code}"></div>`)}
    </div>
  `
  render(pageTemplate, document.querySelector('#voters'))
}

function voteTemplate (vote) {
  return html`
  <li>
    <div>
      <strong>${vote.name}</strong>
      <em>${vote.description}</em>
    </div>
    <div class="opinion">${vote.opinion}</div>
  </li>
  `
}

function renderCountry (country) {
  const countryTemplate = html`
    <div class="project-box votes">
      <h2>
        ${countryName(country.code)}
      </h2>
      <span class="counter">${country.count} VOTES</span>
    </div>
    <div class="project-box solution">
      <ul class="country-votes">${country.vote.map(voteTemplate)}</ul>
    </div>
  `
  const pageTemplate = html`
    <div>
      ${countryTemplate}
    </div>
  `

  render(pageTemplate, document.querySelector('#country'))
}

// FAQ info accordion
const accordions = document.getElementsByClassName('accordion')

for (const accordion of accordions) {
  accordion.addEventListener('click', function () {
    this.classList.toggle('active')
    var panel = this.nextElementSibling
    if (panel.style.maxHeight) {
      panel.style.maxHeight = null
    } else {
      panel.style.maxHeight = panel.scrollHeight + 'px'
    }
  })
}

document.querySelector('input[type=email').addEventListener('blur', function checkEmail (e) {
  console.log(e.srcElement.value)
})
