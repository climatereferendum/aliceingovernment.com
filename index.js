import { html, render } from 'lit-html'
import { installRouter } from './node_modules/pwa-helpers/router.js'
import csv from 'neat-csv'
import { flag, name as countryName, countries } from 'country-emoji'

const { fetch, localStorage, FormData } = window

const DOC_URL = 'https://docs.google.com/spreadsheets/d/1WNDWjJOGeVbOsYaWy3udBnRxFIknO5NpYwToVhH2nGE/gviz/tq?tqx=out:csv'
const SERVICE_URL = 'https://elf.pagekite.me'
const PREVIEW_VOTES_COUNT = 5
let solutions
let votes, votesCount
let myVote
let active, slug
let selectedSolutions = []
let authProviders

const form = document.querySelector('#vote-form')
renderCountriesDropdown()
form.addEventListener('submit', (event) => {
  event.preventDefault()
  event.stopPropagation()
  handleSubmit(event)
  return false
})

function handleSubmit (event) {
  const data = new FormData(form)
  const draft = {}
  for (const key of data.keys()) { (draft[key] = data.get(key)) }
  draft.solution = [...selectedSolutions]
  localStorage.setItem('data', JSON.stringify(draft))
  window.location = `${SERVICE_URL}${authProviders[event.explicitOriginalTarget.value]}`
}

function updateSelectedSolutions (event) {
  if (event.target.checked) {
    selectedSolutions.push(event.target.value)
  } else {
    selectedSolutions = selectedSolutions.filter(s => s !== event.target.value)
  }
  const solutionElements = document.querySelectorAll('#solutions .project-box')
  const nav = document.querySelector('.sticky-nav')
  const footer = document.querySelector('footer')
  if (selectedSolutions.length === 3) {
    // hide other solutions
    for (const element of solutionElements) {
      if (!selectedSolutions.includes(element.dataset.rank)) {
        element.classList.add('inactive')
      }
    }
    // show form, hide navigation and footer
    nav.classList.add('inactive')
    footer.classList.add('inactive')
    form.classList.remove('inactive')
    form.scrollIntoView(false)
  } else {
    // show all solutions
    for (const element of solutionElements) {
      element.classList.remove('inactive')
    }
    // hide form, show navigation and footer
    form.classList.add('inactive')
    nav.classList.remove('inactive')
    footer.classList.remove('inactive')
  }
}

function showVote (vote) {
  window.history.pushState({}, '', '/info')
  handleRouting(window.location)
}

;(async () => {
  const solutionsResponse = await fetch(DOC_URL + '&sheet=solutions')
  const solutionsCsv = await solutionsResponse.text()
  solutions = await csv(solutionsCsv)
  renderSolutions(solutions)
  installRouter(handleRouting)
  const serviceResponse = await fetch(SERVICE_URL, { credentials: 'include' })
  const serviceData = await serviceResponse.json()
  authProviders = serviceData.authProviders
  myVote = serviceData.vote
  console.log('vote:', myVote)
  let savedData = localStorage.getItem('data')
  if (savedData) {
    savedData = JSON.parse(savedData)
  }
  console.log('savedData:', savedData)
  if (!myVote) {
    // not authenticated
    // TODO: if savedData should continue with voting
  } else if (myVote.solutions) {
    // already voted
    showVote()
  } else if (savedData) {
    // vote ready to submit
    myVote.solutions = selectedSolutions
    Object.assign(myVote, savedData)
    const castedVoteResponse = await fetch(myVote.id, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(myVote)
    })
    if (castedVoteResponse.ok) {
      console.log('VOTE SUBMISSION SUCCEEDED')
      // draft
      localStorage.removeItem('data')
      // re fetch votes
      ;[votes, votesCount] = await fetchVotes()
      showVote(myVote)
    } else {
      console.log('VOTE SUBMISSION FAILED')
    }
  } else {
    console.log('AUTHENTICATED BUT NO SAVED DATA')
  }
})()

const pages = document.querySelectorAll('.page')
const nav = {
  solutions: document.querySelector('#nav-solutions'),
  voters: document.querySelector('#nav-voters'),
  info: document.querySelector('#nav-info')
}

async function handleRouting (location, event) {
  if (event && event.type === 'click') {
    window.scrollTo(0, 0)
  }
  for (const page of pages) {
    page.classList.add('inactive')
  }
  for (const n in nav) {
    nav[n].classList.remove('active')
    nav[n].classList.remove('active-prev')
  }
  active = location.pathname.split('/')[1]
  slug = location.pathname.split('/')[2]
  let linkedHeader = true
  if (active === '') {
    document.querySelector('#home').classList.remove('inactive')
    linkedHeader = false
  }
  if (active === 'solutions' && !slug) {
    nav['voters'].classList.add('active-prev')
    nav['solutions'].classList.add('active')
    document.querySelector('#solutions').classList.remove('inactive')
  }
  if (active === 'voters' && !slug) {
    nav['voters'].classList.add('active')
    if (!votes) [votes, votesCount] = await fetchVotes()
    if (active !== 'voters') return // check again if route didn't change
    renderVotes(votes)
    document.querySelector('#voters').classList.remove('inactive')
  }
  if (active === 'info') {
    nav['voters'].classList.add('active-prev')
    nav['solutions'].classList.add('active-prev')
    nav['info'].classList.add('active')
    if (myVote && myVote.nationality) {
      if (!votes) [votes, votesCount] = await fetchVotes()
      render(countryShortTemplate(myVote.nationality), document.querySelector('#my-vote'))
    }
    document.querySelector('#info').classList.remove('inactive')
  }
  if (active === 'voters' && slug) {
    nav['voters'].classList.add('active')
    if (!votes) [votes, votesCount] = await fetchVotes()
    const country = Object.keys(votes).find(country => country.toLowerCase() === slug)
    const countryVotes = votes[country]
    if (active !== 'voters') return // check again if route didn't change
    renderCountry(country, countryVotes)
    document.querySelector('#country').classList.remove('inactive')
  }
  renderHeader(linkedHeader)
}

async function fetchVotes () {
  const votesResponse = await window.fetch(SERVICE_URL + '/votes')
  const votes = await votesResponse.json()
  const reduced = votes.reduce((acc, vote) => {
    if (!acc[vote.nationality]) {
      acc[vote.nationality] = []
    }
    acc[vote['nationality']].push(vote)
    return acc
  }, {})
  // add index per country
  for (const country in reduced) {
    reduced[country] = reduced[country].map((vote, index) => {
      return { index: index + 1, ...vote }
    })
    reduced[country].reverse()
  }
  return [reduced, votes.length]
}

function renderCountriesDropdown () {
  const template = html`
    <p><select name="nationality">
      ${Object.keys(countries).map(code => html`
        <option value="${code.toLowerCase()}">${countries[code]} ${flag(code)}</option>
      `)}
    </select></p>
  `
  render(template, document.querySelector('#nationality'))
}

function renderHeader (linked = true) {
  let headerTemplate = html`
    <img src="/img/logo.png">
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
      <a href="${solution.link}" target="drawdown">
      <h4>Solution #${solution.rank}</h4>
      <h3>${solution.name}</h3></a>
      <label class="container">
        <input
          type="checkbox"
          name="solution-${solution.rank}"
          value="${solution.rank}"
          @change="${updateSelectedSolutions}"
          >
        <span class="checkmark"></span>
      </label> 
    </div>
  `
}

function renderSolutions (solutions) {
  const solutionsHeader = html`
    <h2 class="h-boxed" style="margin-bottom: 32px;">To make things easier, here is a list of the<br> 
      Top 30 most effective Solutions<br> 
      to Climate Change as compiled by the <br>
      wonderful team of scientists at <a href="https://www.drawdown.org/" target="_blank">Drawdown</a>. <br>
      <div class="vertical-line"></div>
      Please select three (3) by ticking <br>the checkboxes to cast your vote.
    </h2>
    <div class="row">
      <div class="select-block">SELECT</div>
    </div>
  `

  const solutionsTemplate = html`
    ${solutionsHeader}
    ${solutions.map(solutionTemplate)}
  `
  render(solutionsTemplate, document.querySelector('#solutions'))
}

function loadMoreLink (country, countryVotes) {
  if (countryVotes.length > PREVIEW_VOTES_COUNT) {
    return html`<a href="/votes/${country.toLowerCase()}"><i>load more ↓</i></a>`
  }
}

function countryShortTemplate (country) {
  return html`
    <div class="vertical-line"></div>
    <div class="project-box votes">
      <h2>
        ${flag(country)}
        ${countryName(country)}
      </h2>
      <span>${votes[country].length} VOTES</span>
    </div>
    <div class="project-box solution content">
        <ul>
          ${votes[country].slice(PREVIEW_VOTES_COUNT * -1).map(voteTemplate)}
        </ul>
        ${loadMoreLink(country, votes[country])}
    </div>
  `
}

function renderVotes (votes) {
  const orderedCountries = Object.keys(votes).sort((first, second) => {
    return votes[second].length - votes[first].length
  })
  const listTemplate = html`${
    orderedCountries.map(countryShortTemplate)
  }`
  const pageTemplate = html`
    <div class="flex-wrap">
      <div class="project-box solution">
        <h3>People defining our global strategy:</h3>
        Total # of Voters: ${votesCount}
        <br>
        Countries: ${Object.keys(votes).length}
      </div>
      ${listTemplate}
    </div>
  `
  render(pageTemplate, document.querySelector('#voters'))
}

function voteTemplate (vote) {
  return html`
  <li>
    <em class="index">${vote.index}</em>
    <strong>${vote.name}</strong>
    <em>${vote.description}</em>
  </li>
  `
}

function renderCountry (country, countryVotes) {
  const countryTemplate = html`
    <div class="project-box votes">
      <h2>
        ${flag(country)}
        ${countryName(country)}
      </h2>
      <span>${votes[country].length} VOTES</span>
    </div>
    <div class="project-box solution">
      <ul>${countryVotes.map(voteTemplate)}</ul>
    </div>
  `
  const pageTemplate = html`
    <div class="flex-wrap">
      ${countryTemplate}
    </div>
  `

  render(pageTemplate, document.querySelector('#country'))
}
